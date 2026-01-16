import { Tool } from '@/components/tool';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Check, Copy, EyeOff, Lock, Unlock } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

function byteToVariationSelector(byte: number): string {
  if (byte < 16) {
    return String.fromCodePoint(0xfe00 + byte);
  } else {
    return String.fromCodePoint(0xe0100 + (byte - 16));
  }
}

function variationSelectorToByte(codePoint: number): number | null {
  if (codePoint >= 0xfe00 && codePoint <= 0xfe0f) {
    return codePoint - 0xfe00;
  } else if (codePoint >= 0xe0100 && codePoint <= 0xe01ef) {
    return codePoint - 0xe0100 + 16;
  }

  return null;
}

function encode(base: string, message: string): string {
  const bytes = new TextEncoder().encode(message);

  let result = base;

  for (const byte of bytes) {
    result += byteToVariationSelector(byte);
  }

  return result;
}

function decode(text: string): { base: string; message: string } | null {
  const bytes: number[] = [];
  let base = '';
  let foundFirst = false;

  for (const char of text) {
    const codePoint = char.codePointAt(0);

    if (codePoint === undefined) {
      continue;
    }

    const byte = variationSelectorToByte(codePoint);

    if (byte !== null) {
      foundFirst = true;
      bytes.push(byte);
    } else if (!foundFirst) {
      base += char;
    } else {
      break;
    }
  }

  if (bytes.length === 0) {
    return null;
  }

  try {
    const message = new TextDecoder().decode(new Uint8Array(bytes));
    return { base, message };
  } catch {
    return null;
  }
}

function getCodePoints(text: string): string[] {
  const result: string[] = [];

  for (const char of text) {
    const codePoint = char.codePointAt(0);

    if (codePoint !== undefined) {
      result.push(`U+${codePoint.toString(16).toUpperCase().padStart(4, '0')}`);
    }
  }

  return result;
}

function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button variant='outline' size='sm' onClick={handleCopy}>
      {copied ? (
        <Check className='mr-2 h-4 w-4' />
      ) : (
        <Copy className='mr-2 h-4 w-4' />
      )}
      {label || 'Copy'}
    </Button>
  );
}

export function EmojiSmugglerTool() {
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  const [baseEmoji, setBaseEmoji] = useState('😊');
  const [secretMessage, setSecretMessage] = useState('');
  const [encodedInput, setEncodedInput] = useState('');

  const encodedResult = useMemo(() => {
    if (!baseEmoji || !secretMessage) return null;
    return encode(baseEmoji, secretMessage);
  }, [baseEmoji, secretMessage]);

  const decodedResult = useMemo(() => {
    if (!encodedInput) return null;
    return decode(encodedInput);
  }, [encodedInput]);

  return (
    <Tool toolId='emoji-smuggler'>
      <div className='space-y-6'>
        <div className='flex gap-2'>
          <Button
            variant={mode === 'encode' ? 'default' : 'outline'}
            onClick={() => setMode('encode')}
          >
            <Lock className='mr-2 h-4 w-4' />
            Encode
          </Button>
          <Button
            variant={mode === 'decode' ? 'default' : 'outline'}
            onClick={() => setMode('decode')}
          >
            <Unlock className='mr-2 h-4 w-4' />
            Decode
          </Button>
        </div>

        {mode === 'encode' ? (
          <div className='space-y-4'>
            <div>
              <label className='text-muted-foreground mb-2 block text-sm'>
                Base Character (emoji or any unicode)
              </label>
              <Input
                value={baseEmoji}
                onChange={(e) => setBaseEmoji(e.target.value)}
                placeholder='Enter an emoji or character'
                className='max-w-xs text-2xl'
              />
            </div>

            <div>
              <label className='text-muted-foreground mb-2 block text-sm'>
                Secret Message
              </label>
              <Textarea
                value={secretMessage}
                onChange={(e) => setSecretMessage(e.target.value)}
                placeholder='Enter the message to hide...'
                className='min-h-[100px]'
              />
            </div>

            {encodedResult && (
              <div className='border-border bg-accent/50 space-y-4 rounded-lg border p-4'>
                <div className='flex items-center justify-between'>
                  <h3 className='flex items-center gap-2 text-sm font-semibold'>
                    <EyeOff className='h-4 w-4' />
                    Encoded Result
                  </h3>
                  <CopyButton text={encodedResult} />
                </div>

                <div className='bg-background rounded-md border p-4 text-center'>
                  <span className='text-4xl'>{encodedResult}</span>
                  <p className='text-muted-foreground mt-2 text-sm'>
                    Looks like a regular emoji, but contains hidden data!
                  </p>
                </div>

                <div>
                  <p className='text-muted-foreground mb-2 text-xs'>
                    Codepoints ({getCodePoints(encodedResult).length} total):
                  </p>
                  <div className='bg-muted max-h-32 overflow-auto rounded p-2 font-mono text-xs'>
                    {getCodePoints(encodedResult).join(' ')}
                  </div>
                </div>

                <div className='text-muted-foreground text-xs'>
                  <p>
                    <strong>How it works:</strong> Each byte of your message is
                    encoded as a Unicode variation selector (U+FE00-FE0F or
                    U+E0100-E01EF) appended to the base character. These
                    selectors are invisible but preserved when copying/pasting.
                  </p>
                </div>
              </div>
            )}

            {!encodedResult && baseEmoji && (
              <div className='border-border bg-accent/50 text-muted-foreground rounded-lg border p-8 text-center'>
                <Lock className='text-muted-foreground mx-auto mb-2 h-12 w-12' />
                <p>Enter a secret message to encode it in the emoji</p>
              </div>
            )}
          </div>
        ) : (
          <div className='space-y-4'>
            <div>
              <label className='text-muted-foreground mb-2 block text-sm'>
                Encoded Text
              </label>
              <Textarea
                value={encodedInput}
                onChange={(e) => setEncodedInput(e.target.value)}
                placeholder='Paste text that may contain hidden data...'
                className='min-h-[100px]'
              />
              {encodedInput && (
                <p className='text-muted-foreground mt-1 text-xs'>
                  {getCodePoints(encodedInput).length} codepoints detected
                </p>
              )}
            </div>

            {decodedResult ? (
              <div className='border-border bg-accent/50 space-y-4 rounded-lg border p-4'>
                <div className='flex items-center justify-between'>
                  <h3 className='text-sm font-semibold'>
                    Hidden Message Found!
                  </h3>
                  <CopyButton
                    text={decodedResult.message}
                    label='Copy Message'
                  />
                </div>

                <div className='space-y-2'>
                  <div>
                    <span className='text-muted-foreground text-xs'>
                      Base character:
                    </span>
                    <span className='ml-2 text-2xl'>{decodedResult.base}</span>
                  </div>
                  <div>
                    <span className='text-muted-foreground text-xs'>
                      Hidden message:
                    </span>
                    <div className='bg-background mt-1 rounded-md border p-3'>
                      {decodedResult.message}
                    </div>
                  </div>
                </div>

                <div>
                  <p className='text-muted-foreground mb-2 text-xs'>
                    Codepoints breakdown:
                  </p>
                  <div className='bg-muted max-h-32 overflow-auto rounded p-2 font-mono text-xs'>
                    {getCodePoints(encodedInput).join(' ')}
                  </div>
                </div>
              </div>
            ) : encodedInput ? (
              <div className='border-border bg-accent/50 text-muted-foreground rounded-lg border p-8 text-center'>
                <EyeOff className='text-muted-foreground mx-auto mb-2 h-12 w-12' />
                <p>No hidden data found in this text</p>
              </div>
            ) : (
              <div className='border-border bg-accent/50 text-muted-foreground rounded-lg border p-8 text-center'>
                <Unlock className='text-muted-foreground mx-auto mb-2 h-12 w-12' />
                <p>Paste encoded text to reveal hidden messages</p>
              </div>
            )}
          </div>
        )}
      </div>
    </Tool>
  );
}
