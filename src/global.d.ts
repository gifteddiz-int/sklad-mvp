export {};

declare global {
  interface Window {
    fileStore?: {
      saveSession: (data: import('@/types/session').SessionSnapshotDTO) => Promise<{ filePath: string } | void>;
      loadLatestSession: () => Promise<import('@/types/session').SessionSnapshotDTO | null>;
      clearSession: () => Promise<void>;
      saveSettings: (settings: import('@/types/session').SessionSettings) => Promise<void>;
      loadSettings: () => Promise<import('@/types/session').SessionSettings | null>;
    };
  }
}
