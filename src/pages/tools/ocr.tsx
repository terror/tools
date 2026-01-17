import { Tool } from '@/components/tool';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import * as pdfjsLib from 'pdfjs-dist';
import PdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { useCallback, useRef, useState } from 'react';
import { toast } from 'sonner';
import Tesseract from 'tesseract.js';

pdfjsLib.GlobalWorkerOptions.workerSrc = PdfjsWorker;

interface OcrResult {
  pageNumber: number;
  text: string;
}

export function OcrTool() {
  const [results, setResults] = useState<OcrResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processImage = useCallback(
    async (imageSource: string | HTMLCanvasElement): Promise<string> => {
      const result = await Tesseract.recognize(imageSource, 'eng', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setProgress((prev) => Math.max(prev, m.progress * 100));
          }
        },
      });

      return result.data.text;
    },
    []
  );

  const processPdf = useCallback(
    async (file: File): Promise<OcrResult[]> => {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const totalPages = pdf.numPages;
      const pageResults: OcrResult[] = [];

      for (let i = 1; i <= totalPages; i++) {
        setStatusMessage(`Processing page ${i} of ${totalPages}...`);
        setProgress(((i - 1) / totalPages) * 100);

        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 });

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Could not get canvas context');

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({
          canvasContext: context,
          viewport: viewport,
          canvas: canvas,
        }).promise;

        const text = await processImage(canvas);
        pageResults.push({ pageNumber: i, text: text.trim() });
      }

      return pageResults;
    },
    [processImage]
  );

  const processFile = useCallback(
    async (file: File) => {
      setIsProcessing(true);
      setProgress(0);
      setResults([]);

      try {
        if (file.type === 'application/pdf') {
          setStatusMessage('Loading PDF...');
          const pageResults = await processPdf(file);
          setResults(pageResults);
          toast.success(
            `Extracted text from ${pageResults.length} page${pageResults.length !== 1 ? 's' : ''}`
          );
        } else if (file.type.startsWith('image/')) {
          setStatusMessage('Processing image...');
          const imageUrl = URL.createObjectURL(file);
          const text = await processImage(imageUrl);
          URL.revokeObjectURL(imageUrl);
          setResults([{ pageNumber: 1, text: text.trim() }]);
          toast.success('Text extracted successfully');
        } else {
          throw new Error('Unsupported file type');
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsProcessing(false);
        setProgress(100);
        setStatusMessage('');
      }
    },
    [processImage, processPdf]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        processFile(file);
      }
    },
    [processFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const file = e.dataTransfer.files?.[0];
      if (file) {
        processFile(file);
      }
    },
    [processFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  const copyToClipboard = useCallback(() => {
    const allText = results.map((r) => r.text).join('\n\n');
    navigator.clipboard.writeText(allText);
    toast.success('Copied to clipboard');
  }, [results]);

  const combinedText = results.map((r) => r.text).join('\n\n');

  return (
    <Tool toolId='ocr'>
      <div className='space-y-6'>
        <div
          onClick={() => !isProcessing && fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className={`border-border hover:border-primary/50 hover:bg-accent/50 flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors ${
            isProcessing ? 'pointer-events-none opacity-50' : ''
          }`}
        >
          <input
            ref={fileInputRef}
            type='file'
            accept='image/*,.pdf'
            onChange={handleFileSelect}
            className='hidden'
          />
          <div className='text-center'>
            <p className='text-lg font-medium'>
              Drop a file here or click to upload
            </p>
            <p className='text-muted-foreground mt-1 text-sm'>
              Supports images (PNG, JPG, etc.) and PDF documents
            </p>
          </div>
        </div>

        {isProcessing && (
          <div className='space-y-2'>
            <div className='flex items-center justify-between text-sm'>
              <span className='text-muted-foreground'>{statusMessage}</span>
              <span className='text-muted-foreground'>
                {Math.round(progress)}%
              </span>
            </div>
            <Progress value={progress} />
          </div>
        )}

        {results.length > 0 && !isProcessing && (
          <div className='space-y-4'>
            <div className='flex items-center justify-between'>
              <h3 className='font-medium'>
                Extracted Text
                {results.length > 1 && ` (${results.length} pages)`}
              </h3>
              <Button variant='outline' size='sm' onClick={copyToClipboard}>
                Copy All
              </Button>
            </div>
            <Textarea
              value={combinedText}
              readOnly
              className='min-h-[300px] font-mono text-sm'
            />
          </div>
        )}
      </div>
    </Tool>
  );
}
