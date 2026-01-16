import { Tool } from '@/components/tool';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Settings } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

type TimerMode = 'work' | 'shortBreak' | 'longBreak';

interface TimerConfig {
  work: number;
  shortBreak: number;
  longBreak: number;
  sessionsBeforeLongBreak: number;
}

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

export function PomodoroTimerTool() {
  const [config, setConfig] = useState<TimerConfig>(DEFAULT_CONFIG);
  const [mode, setMode] = useState<TimerMode>('work');
  const [timeLeft, setTimeLeft] = useState(config.work * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [showSettings, setShowSettings] = useState(false);

  const intervalRef = useRef<number | null>(null);
  const completionHandlerRef = useRef<() => void>(() => {});

  const totalTime = config[mode] * 60;
  const progress = ((totalTime - timeLeft) / totalTime) * 100;

  const playNotification = useCallback(() => {
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
  }, []);

  const switchMode = useCallback(
    (newMode: TimerMode) => {
      setMode(newMode);
      setTimeLeft(config[newMode] * 60);
      setIsRunning(false);
    },
    [config]
  );

  useEffect(() => {
    completionHandlerRef.current = () => {
      playNotification();
      setIsRunning(false);

      if (mode === 'work') {
        const newCompletedSessions = completedSessions + 1;
        setCompletedSessions(newCompletedSessions);

        if (newCompletedSessions % config.sessionsBeforeLongBreak === 0) {
          switchMode('longBreak');
        } else {
          switchMode('shortBreak');
        }
      } else {
        switchMode('work');
      }
    };
  }, [
    mode,
    completedSessions,
    config.sessionsBeforeLongBreak,
    playNotification,
    switchMode,
  ]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setTimeout(() => completionHandlerRef.current(), 0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  useEffect(() => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    document.title = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')} - ${MODE_LABELS[mode]}`;

    return () => {
      document.title = 'tools.liam.rs';
    };
  }, [timeLeft, mode]);

  const toggleTimer = () => setIsRunning(!isRunning);

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(config[mode] * 60);
  };

  const resetAll = () => {
    setIsRunning(false);
    setMode('work');
    setTimeLeft(config.work * 60);
    setCompletedSessions(0);
  };

  const updateConfig = (key: keyof TimerConfig, value: number) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    if (!isRunning) {
      setTimeLeft(newConfig[mode] * 60);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <Tool toolId='pomodoro-timer'>
      <div className='flex max-w-md flex-col items-center space-y-8'>
        <div className='flex gap-2'>
          {(Object.keys(MODE_LABELS) as TimerMode[]).map((m) => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                mode === m
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-accent hover:bg-accent/80'
              }`}
            >
              {MODE_LABELS[m]}
            </button>
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
                mode === 'work'
                  ? 'text-red-500'
                  : mode === 'shortBreak'
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
              {MODE_LABELS[mode]}
            </div>
          </div>
        </div>

        <div className='flex gap-4'>
          <button
            onClick={toggleTimer}
            className={`rounded-full px-8 py-3 text-lg font-semibold transition-colors ${
              isRunning
                ? 'bg-orange-500 text-white hover:bg-orange-600'
                : 'bg-primary text-primary-foreground hover:bg-primary/90'
            }`}
          >
            {isRunning ? 'Pause' : 'Start'}
          </button>
          <button
            onClick={resetTimer}
            className='bg-accent hover:bg-accent/80 rounded-full px-6 py-3 text-lg font-semibold transition-colors'
          >
            Reset
          </button>
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
            <button className='text-muted-foreground hover:text-foreground flex cursor-pointer items-center gap-2 text-sm transition-colors'>
              <Settings className='h-4 w-4' />
              Settings
            </button>
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
                  <input
                    type='number'
                    min='1'
                    max='60'
                    value={config.work}
                    onChange={(e) =>
                      updateConfig('work', parseInt(e.target.value) || 1)
                    }
                    className='border-border bg-background w-16 rounded border px-2 py-1 text-center text-sm'
                  />
                  <span className='text-muted-foreground text-sm'>min</span>
                </div>
              </div>

              <div className='flex items-center justify-between'>
                <label className='text-sm font-medium'>Short Break</label>
                <div className='flex items-center gap-2'>
                  <input
                    type='number'
                    min='1'
                    max='30'
                    value={config.shortBreak}
                    onChange={(e) =>
                      updateConfig('shortBreak', parseInt(e.target.value) || 1)
                    }
                    className='border-border bg-background w-16 rounded border px-2 py-1 text-center text-sm'
                  />
                  <span className='text-muted-foreground text-sm'>min</span>
                </div>
              </div>

              <div className='flex items-center justify-between'>
                <label className='text-sm font-medium'>Long Break</label>
                <div className='flex items-center gap-2'>
                  <input
                    type='number'
                    min='1'
                    max='60'
                    value={config.longBreak}
                    onChange={(e) =>
                      updateConfig('longBreak', parseInt(e.target.value) || 1)
                    }
                    className='border-border bg-background w-16 rounded border px-2 py-1 text-center text-sm'
                  />
                  <span className='text-muted-foreground text-sm'>min</span>
                </div>
              </div>

              <div className='flex items-center justify-between'>
                <label className='text-sm font-medium'>
                  Sessions before long break
                </label>
                <input
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
                  className='border-border bg-background w-16 rounded border px-2 py-1 text-center text-sm'
                />
              </div>
            </div>

            <button
              onClick={resetAll}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90 w-full rounded px-4 py-2 text-sm font-medium'
            >
              Reset
            </button>
          </DialogContent>
        </Dialog>
      </div>
    </Tool>
  );
}
