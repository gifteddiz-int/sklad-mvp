export interface SessionSettings {
  startBoxNumber: number;
  codesPerBox: number;
}

export interface ScannedCode {
  id: string;
  code: string;
  timestamp: Date;
  boxNumber: number;
}

export interface ScannedCodeDTO {
  id: string;
  code: string;
  timestamp: string;
  boxNumber: number;
}

export interface SessionSnapshotDTO {
  settings: SessionSettings;
  scannedCodes: ScannedCodeDTO[];
  currentBoxNumber: number;
  lastSave?: string;
}
