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
import { Settings } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

type TimerMode = 'work' | 'shortBreak' | 'longBreak';
type Timers = Record<TimerMode, number>;

interface TimerConfig {
  work: number;
  shortBreak: number;
  longBreak: number;
  sessionsBeforeLongBreak: number;
}

interface StoredState {
  activeMode: TimerMode;
  viewMode: TimerMode;
  timers: Timers;
  isRunning: boolean;
  completedSessions: number;
  config: TimerConfig;
  savedAt: number;
  mode?: TimerMode;
}

const STORAGE_KEY = 'pomodoro-timer-state';

const DEFAULT_CONFIG: TimerConfig = {
  work: 25,
  shortBreak: 5,
  longBreak: 15,
  sessionsBeforeLongBreak: 4,
};

const MODE_LABELS: Record<TimerMode, string> = {
  work: 'Focus Time',
  shortBreak: 'Short Break',
  longBreak: 'Long Break',
};

const MODE_COLORS: Record<TimerMode, string> = {
  work: 'bg-red-500',
  shortBreak: 'bg-green-500',
  longBreak: 'bg-blue-500',
};

function getDefaultTimers(config: TimerConfig): Timers {
  return {
    work: config.work * 60,
    shortBreak: config.shortBreak * 60,
    longBreak: config.longBreak * 60,
  };
}

function loadStoredState(): Partial<StoredState> | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (stored) {
      return JSON.parse(stored);
    }
  } catch {}

  return null;
}

function getInitialState() {
  const stored = loadStoredState();

  if (!stored) {
    return {
      config: DEFAULT_CONFIG,
      activeMode: 'work' as TimerMode,
      viewMode: 'work' as TimerMode,
      timers: getDefaultTimers(DEFAULT_CONFIG),
      isRunning: false,
      completedSessions: 0,
    };
  }

  const config = stored.config ?? DEFAULT_CONFIG;

  const activeMode: TimerMode = stored.activeMode ?? stored.mode ?? 'work';
  const viewMode: TimerMode = stored.viewMode ?? stored.mode ?? 'work';

  let timers: Timers = stored.timers ?? getDefaultTimers(config);
  let isRunning = stored.isRunning ?? false;

  const completedSessions = stored.completedSessions ?? 0;

  if (isRunning && stored.savedAt) {
    const elapsedSeconds = Math.floor((Date.now() - stored.savedAt) / 1000);

    timers = { ...timers, [activeMode]: Math.max(0, timers[activeMode] - elapsedSeconds) };

    if (timers[activeMode] === 0) {
      isRunning = false;
    }
  }

  return { config, activeMode, viewMode, timers, isRunning, completedSessions };
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function playNotification() {
  const audioContext = new AudioContext();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  oscillator.frequency.value = 800;
  oscillator.type = 'sine';

  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(
    0.01,
    audioContext.currentTime + 0.5
  );

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.5);
}

function usePomodoroTimer() {
  const [initialState] = useState(getInitialState);

  const [config, setConfig] = useState<TimerConfig>(initialState.config);
  const [isRunning, setIsRunning] = useState(initialState.isRunning);
  const [activeMode, setActiveMode] = useState<TimerMode>(initialState.activeMode);
  const [viewMode, setViewMode] = useState<TimerMode>(initialState.viewMode);
  const [timers, setTimers] = useState<Timers>(initialState.timers);

  const [completedSessions, setCompletedSessions] = useState(
    initialState.completedSessions
  );

  const intervalRef = useRef<number | null>(null);
  const completionHandlerRef = useRef<() => void>(() => {});

  const timeLeft = timers[viewMode];
  const totalTime = config[viewMode] * 60;
  const progress = ((totalTime - timeLeft) / totalTime) * 100;

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        activeMode,
        viewMode,
        timers,
        isRunning,
        completedSessions,
        config,
        savedAt: Date.now(),
      })
    );
  }, [activeMode, viewMode, timers, isRunning, completedSessions, config]);

  useEffect(() => {
    const activeTimeLeft = timers[activeMode];
    document.title = `${formatTime(activeTimeLeft)} - ${MODE_LABELS[activeMode]}`;
    return () => {
      document.title = 'tools.liam.rs';
    };
  }, [timers, activeMode]);

  const resetModeTimer = useCallback(
    (targetMode: TimerMode) => {
      setTimers((prev) => ({ ...prev, [targetMode]: config[targetMode] * 60 }));
    },
    [config]
  );

  const switchView = useCallback((newMode: TimerMode) => {
    setViewMode(newMode);
  }, []);

  useEffect(() => {
    completionHandlerRef.current = () => {
      playNotification();
      setIsRunning(false);
      resetModeTimer(activeMode);

      if (activeMode === 'work') {
        const newCompletedSessions = completedSessions + 1;
        setCompletedSessions(newCompletedSessions);

        const nextMode = newCompletedSessions % config.sessionsBeforeLongBreak === 0
          ? 'longBreak'
          : 'shortBreak';
        setActiveMode(nextMode);
        setViewMode(nextMode);
      } else {
        setActiveMode('work');
        setViewMode('work');
      }
    };
  }, [activeMode, completedSessions, config.sessionsBeforeLongBreak, resetModeTimer]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = window.setInterval(() => {
        setTimers((prev) => {
          const currentTime = prev[activeMode];
          if (currentTime <= 1) {
            setTimeout(() => completionHandlerRef.current(), 0);
            return { ...prev, [activeMode]: 0 };
          }
          return { ...prev, [activeMode]: currentTime - 1 };
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, activeMode]);

  const toggle = useCallback(() => {
    setIsRunning((prev) => {
      if (!prev) {
        setActiveMode(viewMode);
      }
      return !prev;
    });
  }, [viewMode]);

  const reset = useCallback(() => {
    setIsRunning(false);
    resetModeTimer(viewMode);
  }, [viewMode, resetModeTimer]);

  const resetAll = useCallback(() => {
    setIsRunning(false);
    setActiveMode('work');
    setViewMode('work');
    setTimers(getDefaultTimers(config));
    setCompletedSessions(0);
    localStorage.removeItem(STORAGE_KEY);
  }, [config]);

  const updateConfig = useCallback(
    (key: keyof TimerConfig, value: number) => {
      setConfig((prev) => {
        const newConfig = { ...prev, [key]: value };

        setTimers((prevTimers) => {
          const updated = { ...prevTimers };
          const modes: TimerMode[] = ['work', 'shortBreak', 'longBreak'];

          for (const m of modes) {
            if (m in newConfig && prevTimers[m] === prev[m] * 60) {
              updated[m] = (newConfig[m] as number) * 60;
            }
          }

          return updated;
        });

        return newConfig;
      });
    },
    []
  );

  return {
    activeMode,
    viewMode,
    timeLeft,
    isRunning,
    progress,
    completedSessions,
    config,
    switchView,
    toggle,
    reset,
    resetAll,
    updateConfig,
  };
}

export function PomodoroTool() {
  const {
    activeMode,
    viewMode,
    timeLeft,
    isRunning,
    progress,
    completedSessions,
    config,
    switchView,
    toggle,
    reset,
    resetAll,
    updateConfig,
  } = usePomodoroTimer();

  const [showSettings, setShowSettings] = useState(false);

  const isActiveView = activeMode === viewMode;

  return (
    <Tool toolId='pomodoro'>
      <div className='flex max-w-md flex-col items-center space-y-8'>
        <div className='flex gap-2'>
          {(Object.keys(MODE_LABELS) as TimerMode[]).map((m) => (
            <Button
              key={m}
              onClick={() => switchView(m)}
              variant={viewMode === m ? 'default' : 'secondary'}
              className={isRunning && activeMode === m && viewMode !== m ? 'animate-pulse' : ''}
            >
              {MODE_LABELS[m]}
            </Button>
          ))}
        </div>

        <div className='relative flex h-64 w-64 items-center justify-center'>
          <svg className='absolute h-full w-full -rotate-90'>
            <circle
              cx='128'
              cy='128'
              r='120'
              fill='none'
              stroke='currentColor'
              strokeWidth='8'
              className='text-accent'
            />
            <circle
              cx='128'
              cy='128'
              r='120'
              fill='none'
              stroke='currentColor'
              strokeWidth='8'
              strokeLinecap='round'
              strokeDasharray={2 * Math.PI * 120}
              strokeDashoffset={2 * Math.PI * 120 * (1 - progress / 100)}
              className={`transition-all duration-1000 ${
                viewMode === 'work'
                  ? 'text-red-500'
                  : viewMode === 'shortBreak'
                    ? 'text-green-500'
                    : 'text-blue-500'
              }`}
            />
          </svg>

          <div className='z-10 text-center'>
            <div className='text-6xl font-bold tabular-nums'>
              {formatTime(timeLeft)}
            </div>
            <div className='text-muted-foreground mt-2 text-sm'>
              {MODE_LABELS[viewMode]}
            </div>
          </div>
        </div>

        <div className='flex gap-4'>
          <Button
            onClick={toggle}
            size='lg'
            className={`rounded-full px-8 ${
              isRunning && isActiveView ? 'bg-orange-500 hover:bg-orange-600' : ''
            }`}
          >
            {isRunning && isActiveView ? 'Pause' : 'Start'}
          </Button>
          <Button
            onClick={reset}
            variant='secondary'
            size='lg'
            className='rounded-full px-6'
          >
            Reset
          </Button>
        </div>

        <div className='flex items-center gap-3'>
          <span className='text-muted-foreground text-sm'>Sessions:</span>
          <div className='flex gap-1'>
            {Array.from({ length: config.sessionsBeforeLongBreak }).map(
              (_, i) => (
                <div
                  key={i}
                  className={`h-3 w-3 rounded-full transition-colors ${
                    i < completedSessions % config.sessionsBeforeLongBreak ||
                    (completedSessions > 0 &&
                      completedSessions % config.sessionsBeforeLongBreak === 0)
                      ? MODE_COLORS.work
                      : 'bg-accent'
                  }`}
                />
              )
            )}
          </div>
          <span className='text-muted-foreground text-sm'>
            ({completedSessions} total)
          </span>
        </div>

        <Dialog open={showSettings} onOpenChange={setShowSettings}>
          <DialogTrigger asChild>
            <Button variant='ghost' size='sm'>
              <Settings className='h-4 w-4' />
              Settings
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Settings</DialogTitle>
              <DialogDescription>
                Customize your Pomodoro timer durations and session count.
              </DialogDescription>
            </DialogHeader>

            <div className='grid gap-4 py-4'>
              <div className='flex items-center justify-between'>
                <label className='text-sm font-medium'>Focus Duration</label>
                <div className='flex items-center gap-2'>
                  <Input
                    type='number'
                    min='1'
                    max='60'
                    value={config.work}
                    onChange={(e) =>
                      updateConfig('work', parseInt(e.target.value) || 1)
                    }
                    className='w-16 text-center'
                  />
                  <span className='text-muted-foreground text-sm'>min</span>
                </div>
              </div>

              <div className='flex items-center justify-between'>
                <label className='text-sm font-medium'>Short Break</label>
                <div className='flex items-center gap-2'>
                  <Input
                    type='number'
                    min='1'
                    max='30'
                    value={config.shortBreak}
                    onChange={(e) =>
                      updateConfig('shortBreak', parseInt(e.target.value) || 1)
                    }
                    className='w-16 text-center'
                  />
                  <span className='text-muted-foreground text-sm'>min</span>
                </div>
              </div>

              <div className='flex items-center justify-between'>
                <label className='text-sm font-medium'>Long Break</label>
                <div className='flex items-center gap-2'>
                  <Input
                    type='number'
                    min='1'
                    max='60'
                    value={config.longBreak}
                    onChange={(e) =>
                      updateConfig('longBreak', parseInt(e.target.value) || 1)
                    }
                    className='w-16 text-center'
                  />
                  <span className='text-muted-foreground text-sm'>min</span>
                </div>
              </div>

              <div className='flex items-center justify-between'>
                <label className='text-sm font-medium'>
                  Sessions before long break
                </label>
                <Input
                  type='number'
                  min='2'
                  max='10'
                  value={config.sessionsBeforeLongBreak}
                  onChange={(e) =>
                    updateConfig(
                      'sessionsBeforeLongBreak',
                      parseInt(e.target.value) || 4
                    )
                  }
                  className='w-16 text-center'
                />
              </div>
            </div>

            <Button onClick={resetAll} variant='destructive' className='w-full'>
              Reset
            </Button>
          </DialogContent>
        </Dialog>
      </div>
    </Tool>
  );
}
