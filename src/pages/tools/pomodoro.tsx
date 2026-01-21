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
import { usePersistedState } from '@/hooks/use-persisted-state';
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

interface PomodoroState {
  activeMode: TimerMode;
  viewMode: TimerMode;
  timers: Timers;
  isRunning: boolean;
  completedSessions: number;
  config: TimerConfig;
}

interface StoredState extends PomodoroState {
  savedAt: number;
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

const DEFAULT_STATE: PomodoroState = {
  config: DEFAULT_CONFIG,
  activeMode: 'work',
  viewMode: 'work',
  timers: getDefaultTimers(DEFAULT_CONFIG),
  isRunning: false,
  completedSessions: 0,
};

function deserializeState(stored: StoredState): PomodoroState {
  const config = stored.config ?? DEFAULT_CONFIG;

  const activeMode: TimerMode = stored.activeMode ?? 'work';
  const viewMode: TimerMode = stored.viewMode ?? 'work';

  let timers: Timers = stored.timers ?? getDefaultTimers(config);
  let isRunning = stored.isRunning ?? false;

  const completedSessions = stored.completedSessions ?? 0;

  if (isRunning && stored.savedAt) {
    const elapsedSeconds = Math.floor((Date.now() - stored.savedAt) / 1000);

    timers = {
      ...timers,
      [activeMode]: Math.max(0, timers[activeMode] - elapsedSeconds),
    };

    if (timers[activeMode] === 0) {
      isRunning = false;
    }
  }

  return { config, activeMode, viewMode, timers, isRunning, completedSessions };
}

function serializeState(state: PomodoroState): StoredState {
  return { ...state, savedAt: Date.now() };
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
  const [state, setState, clearState] = usePersistedState<
    PomodoroState,
    StoredState
  >(STORAGE_KEY, DEFAULT_STATE, {
    serialize: serializeState,
    deserialize: deserializeState,
  });

  const { config, activeMode, viewMode, timers, isRunning, completedSessions } =
    state;

  const intervalRef = useRef<number | null>(null);
  const completionHandlerRef = useRef<() => void>(() => {});

  const timeLeft = timers[viewMode];
  const totalTime = config[viewMode] * 60;
  const progress = ((totalTime - timeLeft) / totalTime) * 100;

  useEffect(() => {
    const activeTimeLeft = timers[activeMode];
    document.title = `${formatTime(activeTimeLeft)} - ${MODE_LABELS[activeMode]}`;
    return () => {
      document.title = 'tools.liam.rs';
    };
  }, [timers, activeMode]);

  useEffect(() => {
    completionHandlerRef.current = () => {
      playNotification();

      setState((prev) => {
        const newCompletedSessions =
          prev.activeMode === 'work'
            ? prev.completedSessions + 1
            : prev.completedSessions;

        const nextMode =
          prev.activeMode === 'work'
            ? newCompletedSessions % prev.config.sessionsBeforeLongBreak === 0
              ? 'longBreak'
              : 'shortBreak'
            : 'work';

        return {
          ...prev,
          isRunning: false,
          timers: {
            ...prev.timers,
            [prev.activeMode]: prev.config[prev.activeMode] * 60,
          },
          activeMode: nextMode,
          viewMode: nextMode,
          completedSessions: newCompletedSessions,
        };
      });
    };
  }, [setState]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = window.setInterval(() => {
        setState((prev) => {
          const currentTime = prev.timers[prev.activeMode];
          if (currentTime <= 1) {
            setTimeout(() => completionHandlerRef.current(), 0);
            return {
              ...prev,
              timers: { ...prev.timers, [prev.activeMode]: 0 },
            };
          }
          return {
            ...prev,
            timers: { ...prev.timers, [prev.activeMode]: currentTime - 1 },
          };
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, setState]);

  const switchView = useCallback(
    (newMode: TimerMode) => {
      setState((prev) => ({ ...prev, viewMode: newMode }));
    },
    [setState]
  );

  const toggle = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isRunning: !prev.isRunning,
      activeMode: !prev.isRunning ? prev.viewMode : prev.activeMode,
    }));
  }, [setState]);

  const reset = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isRunning: false,
      timers: {
        ...prev.timers,
        [prev.viewMode]: prev.config[prev.viewMode] * 60,
      },
    }));
  }, [setState]);

  const resetAll = useCallback(() => {
    clearState();
  }, [clearState]);

  const updateConfig = useCallback(
    (key: keyof TimerConfig, value: number) => {
      setState((prev) => {
        const newConfig = { ...prev.config, [key]: value };
        const updatedTimers = { ...prev.timers };
        const modes: TimerMode[] = ['work', 'shortBreak', 'longBreak'];

        for (const m of modes) {
          if (m in newConfig && prev.timers[m] === prev.config[m] * 60) {
            updatedTimers[m] = (newConfig[m] as number) * 60;
          }
        }

        return { ...prev, config: newConfig, timers: updatedTimers };
      });
    },
    [setState]
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
              className={
                isRunning && activeMode === m && viewMode !== m
                  ? 'animate-pulse'
                  : ''
              }
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
              isRunning && isActiveView
                ? 'bg-orange-500 hover:bg-orange-600'
                : ''
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
