import { Tool } from '@/components/tool';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import {
  Check,
  Copy,
  KeyRound,
  RefreshCw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

interface PasswordOptions {
  length: number;
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
}

const CHARSETS = {
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  numbers: '0123456789',
  symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
};

function generatePassword(options: PasswordOptions): string {
  let charset = '';
  const required: string[] = [];

  if (options.uppercase) {
    charset += CHARSETS.uppercase;
    required.push(
      CHARSETS.uppercase[Math.floor(Math.random() * CHARSETS.uppercase.length)]
    );
  }
  if (options.lowercase) {
    charset += CHARSETS.lowercase;
    required.push(
      CHARSETS.lowercase[Math.floor(Math.random() * CHARSETS.lowercase.length)]
    );
  }
  if (options.numbers) {
    charset += CHARSETS.numbers;
    required.push(
      CHARSETS.numbers[Math.floor(Math.random() * CHARSETS.numbers.length)]
    );
  }
  if (options.symbols) {
    charset += CHARSETS.symbols;
    required.push(
      CHARSETS.symbols[Math.floor(Math.random() * CHARSETS.symbols.length)]
    );
  }

  if (!charset) return '';

  const remaining = options.length - required.length;
  const chars = [...required];
  for (let i = 0; i < remaining; i++) {
    chars.push(charset[Math.floor(Math.random() * charset.length)]);
  }

  for (let i = chars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars.join('');
}

function calculateStrength(
  password: string,
  options: PasswordOptions
): { score: number; label: string; color: string } {
  if (!password) return { score: 0, label: 'None', color: 'bg-muted' };

  let poolSize = 0;
  if (options.uppercase) poolSize += 26;
  if (options.lowercase) poolSize += 26;
  if (options.numbers) poolSize += 10;
  if (options.symbols) poolSize += 26;

  const entropy = password.length * Math.log2(poolSize || 1);

  if (entropy < 30) return { score: 1, label: 'Weak', color: 'bg-red-500' };
  if (entropy < 50) return { score: 2, label: 'Fair', color: 'bg-orange-500' };
  if (entropy < 70)
    return { score: 3, label: 'Strong', color: 'bg-yellow-500' };
  return { score: 4, label: 'Very Strong', color: 'bg-green-500' };
}

function StrengthIcon({ score }: { score: number }) {
  if (score <= 1) return <ShieldAlert className='h-4 w-4' />;
  if (score <= 2) return <Shield className='h-4 w-4' />;
  return <ShieldCheck className='h-4 w-4' />;
}

function PasswordCharacter({ char }: { char: string }) {
  const type = CHARSETS.uppercase.includes(char)
    ? 'uppercase'
    : CHARSETS.lowercase.includes(char)
      ? 'lowercase'
      : CHARSETS.numbers.includes(char)
        ? 'number'
        : 'symbol';

  const colorClass =
    type === 'uppercase'
      ? 'text-blue-400'
      : type === 'lowercase'
        ? 'text-foreground'
        : type === 'number'
          ? 'text-green-400'
          : 'text-amber-400';

  return <span className={colorClass}>{char}</span>;
}

export function PasswordTool() {
  const [options, setOptions] = useState<PasswordOptions>({
    length: 20,
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
  });
  const [initialPassword] = useState(() => generatePassword(options));
  const [password, setPassword] = useState(initialPassword);
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<string[]>([initialPassword]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const strength = useMemo(
    () => calculateStrength(password, options),
    [password, options]
  );

  const hasAnyOption =
    options.uppercase ||
    options.lowercase ||
    options.numbers ||
    options.symbols;

  const generate = useCallback(() => {
    if (!hasAnyOption) return;
    const pw = generatePassword(options);
    setPassword(pw);
    setCopied(false);
    setHistory((prev) => [pw, ...prev].slice(0, 10));
  }, [options, hasAnyOption]);

  const copyToClipboard = async (text: string, index?: number) => {
    await navigator.clipboard.writeText(text);
    if (index !== undefined) {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 1500);
    } else {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const toggleOption = (key: keyof Omit<PasswordOptions, 'length'>) => {
    const enabledCount = [
      options.uppercase,
      options.lowercase,
      options.numbers,
      options.symbols,
    ].filter(Boolean).length;
    if (options[key] && enabledCount <= 1) return;
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const optionItems: {
    key: keyof Omit<PasswordOptions, 'length'>;
    label: string;
    preview: string;
  }[] = [
    { key: 'uppercase', label: 'Uppercase', preview: 'A-Z' },
    { key: 'lowercase', label: 'Lowercase', preview: 'a-z' },
    { key: 'numbers', label: 'Numbers', preview: '0-9' },
    { key: 'symbols', label: 'Symbols', preview: '!@#$' },
  ];

  return (
    <Tool toolId='password'>
      <div className='space-y-6'>
        {/* Password display */}
        <div className='border-border bg-accent/50 relative rounded-lg border p-6'>
          <div className='flex items-center gap-3'>
            <div
              className='flex-1 overflow-x-auto font-mono text-xl tracking-wider select-all'
              style={{ wordBreak: 'break-all' }}
            >
              {password ? (
                password
                  .split('')
                  .map((char, i) => <PasswordCharacter key={i} char={char} />)
              ) : (
                <span className='text-muted-foreground italic'>
                  Select at least one character type
                </span>
              )}
            </div>
            <div className='flex shrink-0 gap-1'>
              <Button
                variant='ghost'
                size='icon'
                onClick={() => copyToClipboard(password)}
                disabled={!password}
                title='Copy password'
              >
                {copied ? (
                  <Check className='h-4 w-4 text-green-500' />
                ) : (
                  <Copy className='h-4 w-4' />
                )}
              </Button>
              <Button
                variant='ghost'
                size='icon'
                onClick={generate}
                disabled={!hasAnyOption}
                title='Generate new password'
              >
                <RefreshCw className='h-4 w-4' />
              </Button>
            </div>
          </div>

          {/* Strength meter */}
          {password && (
            <div className='mt-4 space-y-2'>
              <div className='flex gap-1.5'>
                {[1, 2, 3, 4].map((level) => (
                  <div
                    key={level}
                    className={cn(
                      'h-1.5 flex-1 rounded-full transition-colors duration-300',
                      level <= strength.score ? strength.color : 'bg-muted'
                    )}
                  />
                ))}
              </div>
              <div className='flex items-center gap-1.5 text-xs'>
                <StrengthIcon score={strength.score} />
                <span className='text-muted-foreground'>{strength.label}</span>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className='grid gap-6 sm:grid-cols-2'>
          {/* Length slider */}
          <div className='border-border bg-accent/50 rounded-lg border p-4'>
            <div className='mb-4 flex items-center justify-between'>
              <label className='text-sm font-medium'>Length</label>
              <span className='bg-background text-foreground rounded-md px-2.5 py-0.5 font-mono text-sm font-semibold tabular-nums'>
                {options.length}
              </span>
            </div>
            <input
              type='range'
              min={4}
              max={64}
              value={options.length}
              onChange={(e) =>
                setOptions((prev) => ({
                  ...prev,
                  length: Number(e.target.value),
                }))
              }
              className='accent-primary w-full cursor-pointer'
            />
            <div className='text-muted-foreground mt-1 flex justify-between text-xs'>
              <span>4</span>
              <span>64</span>
            </div>
          </div>

          {/* Character options */}
          <div className='border-border bg-accent/50 rounded-lg border p-4'>
            <label className='mb-4 block text-sm font-medium'>Characters</label>
            <div className='space-y-3'>
              {optionItems.map(({ key, label, preview }) => (
                <div key={key} className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <span className='text-sm'>{label}</span>
                    <span className='text-muted-foreground font-mono text-xs'>
                      {preview}
                    </span>
                  </div>
                  <Switch
                    checked={options[key]}
                    onCheckedChange={() => toggleOption(key)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Generate button */}
        <Button
          className='w-full'
          size='lg'
          onClick={generate}
          disabled={!hasAnyOption}
        >
          <KeyRound className='h-4 w-4' />
          Generate Password
        </Button>

        {/* History */}
        {history.length > 1 && (
          <div className='border-border bg-accent/50 rounded-lg border p-4'>
            <div className='mb-3 flex items-center justify-between'>
              <h3 className='text-sm font-medium'>Recent</h3>
              <Button
                variant='ghost'
                size='sm'
                className='text-muted-foreground h-auto px-2 py-1 text-xs'
                onClick={() => setHistory(password ? [password] : [])}
              >
                <Trash2 className='mr-1 h-3 w-3' />
                Clear
              </Button>
            </div>
            <div className='space-y-1'>
              {history.slice(1).map((pw, i) => (
                <div
                  key={i}
                  className='hover:bg-background/50 group flex items-center justify-between rounded-md px-2 py-1.5 transition-colors'
                >
                  <span className='text-muted-foreground truncate font-mono text-xs'>
                    {pw}
                  </span>
                  <Button
                    variant='ghost'
                    size='icon-sm'
                    className='shrink-0 opacity-0 group-hover:opacity-100'
                    onClick={() => copyToClipboard(pw, i)}
                  >
                    {copiedIndex === i ? (
                      <Check className='h-3 w-3 text-green-500' />
                    ) : (
                      <Copy className='h-3 w-3' />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Tool>
  );
}
