export type AppMode = 'personal' | 'baccarat';

const KEY = 'app_mode';

export function getAppMode(): AppMode {
  return localStorage.getItem(KEY) === 'baccarat' ? 'baccarat' : 'personal';
}

export function setAppMode(mode: AppMode): void {
  localStorage.setItem(KEY, mode);
}
