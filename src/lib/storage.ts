import type { RunState } from './game';

export type Settings = { reducedMotion: boolean };

const realPrefix = 'signal-school:';
const demoPrefix = 'demo:signal-school:';

export const keyFor = (demo: boolean, key: string) => `${demo ? demoPrefix : realPrefix}${key}`;

export const loadRun = (demo: boolean): RunState | null => {
  try {
    const raw = localStorage.getItem(keyFor(demo, 'run'));
    return raw ? JSON.parse(raw) as RunState : null;
  } catch { return null; }
};

export const saveRun = (demo: boolean, run: RunState) => localStorage.setItem(keyFor(demo, 'run'), JSON.stringify(run));
export const clearRun = (demo: boolean) => localStorage.removeItem(keyFor(demo, 'run'));

export const loadSettings = (): Settings => {
  try {
    const raw = localStorage.getItem(`${realPrefix}settings`);
    return raw ? { reducedMotion: false, ...JSON.parse(raw) } : { reducedMotion: false };
  } catch { return { reducedMotion: false }; }
};

export const saveSettings = (settings: Settings) => localStorage.setItem(`${realPrefix}settings`, JSON.stringify(settings));
