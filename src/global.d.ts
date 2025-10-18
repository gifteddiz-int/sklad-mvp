export {};

declare global {
  interface Window {
    fileStore?: {
      saveSession: (data: any) => Promise<{ filePath: string }>;
      loadLatestSession: () => Promise<any | null>;
      clearSession: () => Promise<void>;
      saveSettings: (settings: any) => Promise<void>;
      loadSettings: () => Promise<any | null>;
    };
  }
}

