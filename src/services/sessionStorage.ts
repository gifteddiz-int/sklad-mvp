import type { SessionSnapshotDTO, SessionSettings } from '@/types/session';

type FileStoreApi = Pick<
  NonNullable<Window['fileStore']>,
  'saveSession' | 'loadLatestSession' | 'clearSession' | 'saveSettings' | 'loadSettings'
>;

function getFileStore(): FileStoreApi | undefined {
  return typeof window !== 'undefined' ? window.fileStore : undefined;
}

export async function persistSession(payload: SessionSnapshotDTO): Promise<void> {
  try {
    await getFileStore()?.saveSession(payload);
  } catch (error) {
    console.error('[sessionStorage] Failed to save session', error);
    throw error;
  }
}

export async function loadLatestSession(): Promise<SessionSnapshotDTO | null> {
  try {
    const data = await getFileStore()?.loadLatestSession();
    return (data ?? null) as SessionSnapshotDTO | null;
  } catch (error) {
    console.error('[sessionStorage] Failed to load latest session', error);
    return null;
  }
}

export async function clearSession(): Promise<void> {
  try {
    await getFileStore()?.clearSession();
  } catch (error) {
    console.error('[sessionStorage] Failed to clear session', error);
    throw error;
  }
}

export async function persistSettings(settings: SessionSettings): Promise<void> {
  try {
    await getFileStore()?.saveSettings(settings);
  } catch (error) {
    console.error('[sessionStorage] Failed to save settings', error);
    throw error;
  }
}

export async function loadSettings(): Promise<SessionSettings | null> {
  try {
    const data = await getFileStore()?.loadSettings();
    return (data ?? null) as SessionSettings | null;
  } catch (error) {
    console.error('[sessionStorage] Failed to load settings', error);
    return null;
  }
}
