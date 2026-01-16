import { Tool } from '@/components/tool';
import { Textarea } from '@/components/ui/textarea';
import { Clock, FileText, Hash, TrendingUp } from 'lucide-react';
import { useMemo, useState } from 'react';

interface TextStats {
  words: number;
  characters: number;
  charactersNoSpaces: number;
  sentences: number;
  paragraphs: number;
  averageWordLength: number;
  averageSentenceLength: number;
  readingTimeMinutes: number;
  topWords: Array<{ word: string; count: number }>;
}

function calculateStats(text: string): TextStats {
  if (!text.trim()) {
    return {
      words: 0,
      characters: 0,
      charactersNoSpaces: 0,
      sentences: 0,
      paragraphs: 0,
      averageWordLength: 0,
      averageSentenceLength: 0,
      readingTimeMinutes: 0,
      topWords: [],
    };
  }

  const words = text
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0);
  const characters = text.length;
  const charactersNoSpaces = text.replace(/\s/g, '').length;
  const sentences = text
    .split(/[.!?]+/)
    .filter((s) => s.trim().length > 0).length;
  const paragraphs = text
    .split(/\n\s*\n/)
    .filter((p) => p.trim().length > 0).length;

  const totalWordLength = words.reduce((sum, word) => sum + word.length, 0);
  const averageWordLength =
    words.length > 0 ? totalWordLength / words.length : 0;
  const averageSentenceLength = sentences > 0 ? words.length / sentences : 0;

  const readingTimeMinutes = words.length / 225;

  const wordMap = new Map<string, number>();
  words.forEach((word) => {
    const normalized = word.toLowerCase().replace(/[^\w]/g, '');
    if (normalized.length > 0) {
      wordMap.set(normalized, (wordMap.get(normalized) || 0) + 1);
    }
  });

  const topWords = Array.from(wordMap.entries())
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    words: words.length,
    characters,
    charactersNoSpaces,
    sentences,
    paragraphs,
    averageWordLength: Math.round(averageWordLength * 10) / 10,
    averageSentenceLength: Math.round(averageSentenceLength * 10) / 10,
    readingTimeMinutes: Math.round(readingTimeMinutes * 10) / 10,
    topWords,
  };
}

function StatCard({
  icon: Icon,
  label,
  value,
  subtitle,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  subtitle?: string;
}) {
  return (
    <div className='border-border bg-accent/50 flex items-start gap-4 rounded-lg border p-4'>
      <div className='text-muted-foreground mt-1'>
        <Icon className='h-5 w-5' />
      </div>
      <div className='flex-1'>
        <div className='text-muted-foreground mb-1 text-sm'>{label}</div>
        <div className='text-2xl font-bold'>{value}</div>
        {subtitle && (
          <div className='text-muted-foreground mt-1 text-xs'>{subtitle}</div>
        )}
      </div>
    </div>
  );
}

export function WordCounterTool() {
  const [text, setText] = useState('');

  const stats = useMemo(() => calculateStats(text), [text]);

  return (
    <Tool toolId='word-counter'>
      <div className='space-y-6'>
        <div>
          <Textarea
            placeholder='Start typing or paste your text here...'
            value={text}
            onChange={(e) => setText(e.target.value)}
            className='border-border bg-background focus:ring-ring min-h-[200px] w-full rounded-md border px-3 py-2 focus:ring-2 focus:outline-none'
          />
        </div>

        {text.trim() && (
          <>
            <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
              <StatCard
                icon={FileText}
                label='Words'
                value={stats.words.toLocaleString()}
              />
              <StatCard
                icon={Hash}
                label='Characters'
                value={stats.characters.toLocaleString()}
                subtitle={`${stats.charactersNoSpaces.toLocaleString()} without spaces`}
              />
              <StatCard
                icon={TrendingUp}
                label='Sentences'
                value={stats.sentences.toLocaleString()}
                subtitle={`${stats.averageSentenceLength.toFixed(1)} words/sentence`}
              />
              <StatCard
                icon={Clock}
                label='Reading Time'
                value={`${stats.readingTimeMinutes.toFixed(1)} min`}
                subtitle='~225 words/min'
              />
            </div>

            <div className='grid gap-4 sm:grid-cols-2'>
              <div className='border-border bg-accent/50 rounded-lg border p-4'>
                <h3 className='mb-3 text-sm font-semibold'>Text Structure</h3>
                <div className='space-y-2 text-sm'>
                  <div className='flex justify-between'>
                    <span className='text-muted-foreground'>Paragraphs</span>
                    <span className='font-medium'>{stats.paragraphs}</span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-muted-foreground'>
                      Average Word Length
                    </span>
                    <span className='font-medium'>
                      {stats.averageWordLength} characters
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-muted-foreground'>
                      Average Sentence Length
                    </span>
                    <span className='font-medium'>
                      {stats.averageSentenceLength} words
                    </span>
                  </div>
                </div>
              </div>

              {stats.topWords.length > 0 && (
                <div className='border-border bg-accent/50 rounded-lg border p-4'>
                  <h3 className='mb-3 text-sm font-semibold'>
                    Most Frequent Words
                  </h3>
                  <div className='space-y-2'>
                    {stats.topWords.map(({ word, count }, index) => {
                      const maxCount = stats.topWords[0]?.count || 1;
                      const percentage = (count / maxCount) * 100;
                      return (
                        <div key={index} className='space-y-1'>
                          <div className='flex items-center justify-between text-sm'>
                            <span className='font-medium'>{word}</span>
                            <span className='text-muted-foreground'>
                              {count}
                            </span>
                          </div>
                          <div className='bg-muted h-2 w-full overflow-hidden rounded-full'>
                            <div
                              className='bg-primary h-full transition-all duration-300'
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {!text.trim() && (
          <div className='border-border bg-accent/50 text-muted-foreground rounded-lg border p-8 text-center'>
            <FileText className='text-muted-foreground mx-auto mb-2 h-12 w-12' />
            <p>Enter text above to see detailed statistics</p>
          </div>
        )}
      </div>
    </Tool>
  );
}
