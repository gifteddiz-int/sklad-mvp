import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import {
  persistSession,
  loadLatestSession,
  persistSettings,
  loadSettings,
  clearSession as clearStoredSession,
} from '@/services/sessionStorage';
import type { ScannedCode, SessionSettings, SessionSnapshotDTO } from '@/types/session';
import { generateId } from '@/utils/id';
import { todayISO } from '@/utils/date';

const defaultSettings: SessionSettings = {
  startBoxNumber: 1,
  codesPerBox: 10,
};

type RecordScanResult =
  | { status: 'empty' }
  | { status: 'duplicate'; duplicate: ScannedCode }
  | { status: 'recorded'; scan: ScannedCode }
  | { status: 'boxCompleted'; scan: ScannedCode; nextBoxNumber: number };

export const useSessionStore = defineStore('session', () => {
  const settings = ref<SessionSettings>({ ...defaultSettings });
  const sessionDate = ref<string>(todayISO());
  const isConfigured = ref(false);
  const scannedCodes = ref<ScannedCode[]>([]);
  const currentBoxNumber = ref<number>(settings.value.startBoxNumber);
  const recoverySnapshot = ref<SessionSnapshotDTO | null>(null);

  const totalScans = computed(() => scannedCodes.value.length);
  const codesInCurrentBox = computed(() => scannedCodes.value.filter((scan) => scan.boxNumber === currentBoxNumber.value).length);
  const isBoxFull = computed(() => codesInCurrentBox.value >= settings.value.codesPerBox);
  const hasRecovery = computed(() => !!recoverySnapshot.value && (recoverySnapshot.value.scannedCodes?.length ?? 0) > 0);
  const recoveryLastSave = computed(() => recoverySnapshot.value?.lastSave ?? null);

  function applySettings(newSettings: SessionSettings) {
    settings.value = { ...newSettings };
    currentBoxNumber.value = newSettings.startBoxNumber;
  }

  function configure(newSettings: SessionSettings) {
    applySettings(newSettings);
    sessionDate.value = todayISO();
    isConfigured.value = true;
  }

  function recordScan(rawCode: string): RecordScanResult {
    if (!isConfigured.value) {
      return { status: 'empty' };
    }

    const code = rawCode.trim();
    if (!code) {
      return { status: 'empty' };
    }

    const duplicate = scannedCodes.value.find((scan) => scan.code === code);
    if (duplicate) {
      return { status: 'duplicate', duplicate };
    }

    const scan: ScannedCode = {
      id: generateId(),
      code,
      timestamp: new Date(),
      boxNumber: currentBoxNumber.value,
    };

    scannedCodes.value.unshift(scan);

    if (codesInCurrentBox.value >= settings.value.codesPerBox) {
      currentBoxNumber.value += 1;
      return { status: 'boxCompleted', scan, nextBoxNumber: currentBoxNumber.value };
    }

    return { status: 'recorded', scan };
  }

  function removeScan(index: number) {
    scannedCodes.value.splice(index, 1);
  }

  function toSnapshot(): SessionSnapshotDTO {
    return {
      settings: { ...settings.value },
      scannedCodes: scannedCodes.value.map((scan) => ({
        id: scan.id,
        code: scan.code,
        timestamp: scan.timestamp.toISOString(),
        boxNumber: scan.boxNumber,
      })),
      currentBoxNumber: currentBoxNumber.value,
      lastSave: new Date().toISOString(),
    };
  }

  function fromSnapshot(snapshot: SessionSnapshotDTO) {
    applySettings(snapshot.settings);
    scannedCodes.value = snapshot.scannedCodes.map((scan) => ({
      ...scan,
      timestamp: new Date(scan.timestamp),
    }));
    currentBoxNumber.value = snapshot.currentBoxNumber;
    sessionDate.value = snapshot.lastSave ? snapshot.lastSave.slice(0, 10) : todayISO();
    isConfigured.value = true;
  }

  function resetSession(options?: { stayConfigured?: boolean }) {
    scannedCodes.value = [];
    sessionDate.value = todayISO();
    currentBoxNumber.value = settings.value.startBoxNumber;
    isConfigured.value = options?.stayConfigured ?? false;
  }

  function setRecoverySnapshot(snapshot: SessionSnapshotDTO | null) {
    recoverySnapshot.value = snapshot;
  }

  async function hydrate() {
    const storedSettings = await loadSettings();
    if (storedSettings) {
      applySettings(storedSettings);
    }
    const snapshot = await loadLatestSession();
    if (snapshot && (snapshot.scannedCodes?.length ?? 0) > 0) {
      recoverySnapshot.value = snapshot;
    } else {
      currentBoxNumber.value = settings.value.startBoxNumber;
      isConfigured.value = false;
    }
  }

  async function saveSession() {
    const snapshot = toSnapshot();
    await persistSession(snapshot);
    return snapshot.lastSave;
  }

  async function saveSettings() {
    await persistSettings({ ...settings.value });
  }

  async function clearPersistedSession() {
    await clearStoredSession();
  }

  return {
    // state
    settings,
    sessionDate,
    isConfigured,
    scannedCodes,
    currentBoxNumber,
    recoverySnapshot,
    // getters
    totalScans,
    codesInCurrentBox,
    isBoxFull,
    hasRecovery,
    recoveryLastSave,
    // actions
    configure,
    applySettings,
    recordScan,
    removeScan,
    resetSession,
    toSnapshot,
    fromSnapshot,
    hydrate,
    saveSession,
    saveSettings,
    clearPersistedSession,
    setRecoverySnapshot,
  };
});
