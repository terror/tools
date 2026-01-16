import { Tool } from '@/components/tool';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useTheme } from '@/providers/theme-provider';
import { parsePatchFiles, type FileDiffMetadata } from '@pierre/diffs';
import { FileDiff } from '@pierre/diffs/react';
import { Loader2, Settings } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

const GITHUB_PR_REGEX = /^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/;

type DiffStyle = 'split' | 'unified';
type DiffIndicators = 'bars' | 'classic' | 'none';
type LineDiffType = 'word' | 'word-alt' | 'char' | 'none';
type Overflow = 'scroll' | 'wrap';

interface DiffConfig {
  diffStyle: DiffStyle;
  diffIndicators: DiffIndicators;
  lineDiffType: LineDiffType;
  overflow: Overflow;
  disableLineNumbers: boolean;
  disableBackground: boolean;
}

const DEFAULT_CONFIG: DiffConfig = {
  diffStyle: 'split',
  diffIndicators: 'bars',
  lineDiffType: 'word-alt',
  overflow: 'scroll',
  disableLineNumbers: false,
  disableBackground: false,
};

const STORAGE_KEY = 'diff-viewer-config';

function loadConfig(): DiffConfig {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
    }
  } catch {
    // Ignore parse errors
  }
  return DEFAULT_CONFIG;
}

const EXAMPLE_PATCH = `diff --git a/src/utils.ts b/src/utils.ts
index abc123..def456 100644
--- a/src/utils.ts
+++ b/src/utils.ts
@@ -1,8 +1,10 @@
-export function greet(name: string) {
-  console.log("Hello, " + name);
+export function greet(name: string, formal: boolean = false) {
+  const greeting = formal ? "Good day" : "Hello";
+  console.log(\`\${greeting}, \${name}!\`);
 }

 export function add(a: number, b: number) {
   return a + b;
 }
+
+export const VERSION = "1.0.0";
`;

export function DiffViewerTool() {
  const [patch, setPatch] = useState('');
  const [prUrl, setPrUrl] = useState('');
  const [currentGitHubUrl, setCurrentGitHubUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<DiffConfig>(loadConfig);
  const [showSettings, setShowSettings] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  }, [config]);

  const fetchPatch = useCallback(async (url: string) => {
    const match = url.match(GITHUB_PR_REGEX);
    if (!match) {
      setError('Invalid GitHub PR URL. Expected format: https://github.com/owner/repo/pull/123');
      return;
    }

    const [, owner, repo, prNumber] = match;
    const canonicalUrl = `https://github.com/${owner}/${repo}/pull/${prNumber}`;
    const patchUrl = `${canonicalUrl}.patch`;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `https://api.allorigins.win/raw?url=${encodeURIComponent(patchUrl)}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch patch: ${response.status} ${response.statusText}`);
      }

      const patchContent = await response.text();

      if (!patchContent.trim()) {
        throw new Error('No diff content found. The PR may have no file changes.');
      }

      setPatch(patchContent);
      setPrUrl('');
      setCurrentGitHubUrl(canonicalUrl);

      // Update URL with q parameter
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('q', canonicalUrl);
      window.history.replaceState({}, '', newUrl.toString());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch patch');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load from URL parameter on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlParam = params.get('q');
    if (urlParam && GITHUB_PR_REGEX.test(urlParam)) {
      fetchPatch(urlParam);
    }
  }, [fetchPatch]);

  const fetchPrPatch = () => {
    if (prUrl.trim()) {
      fetchPatch(prUrl.trim());
    }
  };

  const activePatch = patch.trim() || EXAMPLE_PATCH;
  const hasCustomPatch = patch.trim().length > 0;

  const fileDiffs = useMemo((): FileDiffMetadata[] => {
    try {
      const patches = parsePatchFiles(activePatch);
      return patches.flatMap((p) => p.files);
    } catch {
      return [];
    }
  }, [activePatch]);

  const diffTheme = useMemo(() => {
    if (theme === 'system') {
      return { dark: 'github-dark', light: 'github-light' } as const;
    }
    return theme === 'dark' ? 'github-dark' : 'github-light';
  }, [theme]);

  const updateConfig = <K extends keyof DiffConfig>(
    key: K,
    value: DiffConfig[K]
  ) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const resetConfig = () => {
    setConfig(DEFAULT_CONFIG);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <Tool toolId='diff-viewer' error={error}>
      <div className='space-y-6'>
        <div className='space-y-2'>
          <label htmlFor='pr-url' className='text-sm font-medium'>
            GitHub Pull Request URL
          </label>
          <div className='flex gap-2'>
            <Input
              id='pr-url'
              type='url'
              value={prUrl}
              onChange={(e) => {
                setPrUrl(e.target.value);
                setError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && prUrl.trim()) {
                  fetchPrPatch();
                }
              }}
              placeholder='https://github.com/owner/repo/pull/123'
              className='flex-1'
            />
            <Button onClick={fetchPrPatch} disabled={loading || !prUrl.trim()}>
              {loading ? (
                <>
                  <Loader2 className='h-4 w-4 animate-spin' />
                  Fetching...
                </>
              ) : (
                'Fetch'
              )}
            </Button>
          </div>
        </div>

        <div className='space-y-2'>
          <label htmlFor='patch-input' className='text-sm font-medium'>
            Or paste your patch
          </label>
          <Textarea
            id='patch-input'
            value={patch}
            onChange={(e) => {
              setPatch(e.target.value);
              // Clear GitHub URL state and URL param when manually editing
              if (currentGitHubUrl) {
                setCurrentGitHubUrl(null);
                const newUrl = new URL(window.location.href);
                newUrl.searchParams.delete('q');
                window.history.replaceState({}, '', newUrl.toString());
              }
            }}
            placeholder='Paste a unified diff or patch file here...'
            className='h-40 resize-y font-mono'
          />
          {!hasCustomPatch && !currentGitHubUrl && (
            <p className='text-muted-foreground text-xs'>
              Showing example diff. Paste your own patch above.
            </p>
          )}
        </div>

        {currentGitHubUrl && (
          <div className='flex items-center justify-between rounded-lg border bg-muted/50 px-4 py-3'>
            <div className='flex items-center gap-2 text-sm'>
              <span className='text-muted-foreground'>Viewing:</span>
              <a
                href={currentGitHubUrl}
                target='_blank'
                rel='noopener noreferrer'
                className='font-medium text-primary hover:underline'
              >
                {currentGitHubUrl.replace('https://github.com/', '')}
              </a>
            </div>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
              }}
            >
              Copy Link
            </Button>
          </div>
        )}

        <div className='flex justify-end'>
          <Dialog open={showSettings} onOpenChange={setShowSettings}>
            <DialogTrigger asChild>
              <Button variant='ghost' size='sm'>
                <Settings className='h-4 w-4' />
                Settings
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Display Settings</DialogTitle>
                <DialogDescription>
                  Customize how diffs are rendered.
                </DialogDescription>
              </DialogHeader>

              <div className='grid gap-4 py-4'>
                <div className='flex items-center justify-between'>
                  <label className='text-sm font-medium'>View Style</label>
                  <Select
                    value={config.diffStyle}
                    onValueChange={(value: DiffStyle) =>
                      updateConfig('diffStyle', value)
                    }
                  >
                    <SelectTrigger className='w-40'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='split'>Side by Side</SelectItem>
                      <SelectItem value='unified'>Unified</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className='flex items-center justify-between'>
                  <label className='text-sm font-medium'>
                    Change Indicators
                  </label>
                  <Select
                    value={config.diffIndicators}
                    onValueChange={(value: DiffIndicators) =>
                      updateConfig('diffIndicators', value)
                    }
                  >
                    <SelectTrigger className='w-40'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='bars'>Colored Bars</SelectItem>
                      <SelectItem value='classic'>+/- Characters</SelectItem>
                      <SelectItem value='none'>None</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className='flex items-center justify-between'>
                  <label className='text-sm font-medium'>
                    Inline Highlighting
                  </label>
                  <Select
                    value={config.lineDiffType}
                    onValueChange={(value: LineDiffType) =>
                      updateConfig('lineDiffType', value)
                    }
                  >
                    <SelectTrigger className='w-40'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='word-alt'>Word (optimized)</SelectItem>
                      <SelectItem value='word'>Word</SelectItem>
                      <SelectItem value='char'>Character</SelectItem>
                      <SelectItem value='none'>None</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className='flex items-center justify-between'>
                  <label className='text-sm font-medium'>Long Lines</label>
                  <Select
                    value={config.overflow}
                    onValueChange={(value: Overflow) =>
                      updateConfig('overflow', value)
                    }
                  >
                    <SelectTrigger className='w-40'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='scroll'>Scroll</SelectItem>
                      <SelectItem value='wrap'>Wrap</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className='flex items-center justify-between'>
                  <label className='text-sm font-medium'>Line Numbers</label>
                  <Switch
                    checked={!config.disableLineNumbers}
                    onCheckedChange={(checked) =>
                      updateConfig('disableLineNumbers', !checked)
                    }
                  />
                </div>

                <div className='flex items-center justify-between'>
                  <label className='text-sm font-medium'>
                    Change Backgrounds
                  </label>
                  <Switch
                    checked={!config.disableBackground}
                    onCheckedChange={(checked) =>
                      updateConfig('disableBackground', !checked)
                    }
                  />
                </div>
              </div>

              <Button variant='secondary' onClick={resetConfig} className='w-full'>
                Reset to Defaults
              </Button>
            </DialogContent>
          </Dialog>
        </div>

        <div
          className='space-y-4'
          style={
            {
              '--diffs-font-family':
                'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
              '--diffs-font-size': '13px',
              '--diffs-line-height': '1.5',
              '--diffs-tab-size': '2',
            } as React.CSSProperties
          }
        >
          {fileDiffs.length > 0 ? (
            fileDiffs.map((fileDiff, index) => (
              <div key={`${fileDiff.name}-${index}`} className='overflow-hidden rounded-lg border'>
                <FileDiff
                  fileDiff={fileDiff}
                  options={{
                    theme: diffTheme,
                    diffStyle: config.diffStyle,
                    diffIndicators: config.diffIndicators,
                    lineDiffType: config.lineDiffType,
                    overflow: config.overflow,
                    disableLineNumbers: config.disableLineNumbers,
                    disableBackground: config.disableBackground,
                  }}
                />
              </div>
            ))
          ) : (
            <div className='text-muted-foreground rounded-lg border p-8 text-center'>
              No valid diff content found
            </div>
          )}
        </div>
      </div>
    </Tool>
  );
}
