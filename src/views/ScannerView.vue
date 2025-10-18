<template>
  <div class="container mt-4">
    <ToastContainer position="top-right" />

    <div v-if="showRecoveryModal" class="modal fade show d-block" style="background: rgba(0, 0, 0, 0.5)">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Восстановление данных</h5>
          </div>
          <div class="modal-body">
            <p>Обнаружены сохраненные данные от {{ recoveryDateLabel }}.</p>
            <p>Хотите восстановить предыдущую сессию сканирования?</p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showStartOverConfirm = true">Начать заново</button>
            <button type="button" class="btn btn-primary" @click="recoverSession">Восстановить</button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showStartOverConfirm" class="modal fade show d-block" style="background: rgba(0, 0, 0, 0.5)">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header bg-danger text-white">
            <h5 class="modal-title">Подтверждение сброса</h5>
          </div>
          <div class="modal-body">
            <p class="mb-2">Вы уверены, что хотите начать заново?</p>
            <p class="mb-0">Все отсканированные данные текущей сессии и история уведомлений будут безвозвратно удалены.</p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-outline-secondary" @click="showStartOverConfirm = false">Отмена</button>
            <button type="button" class="btn btn-danger" @click="confirmStartNewSession">Да, начать заново</button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="!isConfigured && !showRecoveryModal" class="row justify-content-center">
      <div class="col-md-6">
        <div class="card">
          <div class="card-body">
            <h2 class="card-title text-center mb-4">Настройки сканирования</h2>
            <form @submit.prevent="confirmSettings">
              <div class="mb-3">
                <label for="startBox" class="form-label">Начальный номер коробки</label>
                <input
                  id="startBox"
                  v-model.number="settings.startBoxNumber"
                  type="number"
                  class="form-control"
                  min="1"
                  required
                  autofocus
                />
              </div>
              <div class="mb-3">
                <label for="boxCapacity" class="form-label">Количество кодов в коробке</label>
                <input
                  id="boxCapacity"
                  v-model.number="settings.codesPerBox"
                  type="number"
                  class="form-control"
                  min="1"
                  required
                />
              </div>
              <button type="submit" class="btn btn-primary w-100 btn-lg">Начать сканирование</button>
            </form>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="isConfigured">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 class="text-primary mb-0">Сканер штрих-кодов</h1>
          <small class="text-muted d-block">Сессия от {{ sessionDate }}</small>
        </div>
        <div class="d-flex gap-2">
          <button
            class="btn btn-outline-secondary"
            @click="showToastHistory = true"
            title="История уведомлений"
            aria-label="История уведомлений"
          >
            <i class="bi bi-bell"></i>
          </button>
          <button class="btn btn-warning" @click="isConfigured = false">Изменить настройки</button>
        </div>
      </div>

      <div class="card mb-4">
        <div class="card-body py-3">
          <div class="row g-3 align-items-center">
            <div class="col-md-3">
              <div class="d-flex align-items-center">
                <span class="badge bg-light text-dark me-2">Старт:</span>
                <strong>#{{ settings.startBoxNumber }}</strong>
              </div>
            </div>
            <div class="col-md-3">
              <div class="d-flex align-items-center">
                <span class="badge bg-light text-dark me-2">В коробке:</span>
                <strong>{{ settings.codesPerBox }} шт</strong>
              </div>
            </div>
            <div class="col-md-3">
              <div class="d-flex align-items-center">
                <span class="badge bg-light text-dark me-2">Текущая:</span>
                <strong class="text-primary">#{{ currentBoxNumber }}</strong>
              </div>
            </div>
            <div class="col-md-3">
              <div class="d-flex align-items-center">
                <span class="badge bg-light text-dark me-2">Заполнено:</span>
                <strong>{{ codesInCurrentBox }}/{{ settings.codesPerBox }}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="card mb-4">
        <div class="card-body">
          <h5 class="card-title">Сканирование</h5>
          <input
            ref="scannerInput"
            v-model="currentCode"
            type="text"
            class="form-control form-control-lg"
            placeholder="Поднесите штрих-код для сканирования..."
            @keydown.enter.prevent="handleScan"
            autofocus
          />
          <div class="form-text">Поле всегда активно для сканирования</div>
        </div>
      </div>

      <div class="card">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <h5 class="card-title mb-0">Отсканированные коды</h5>
            <button class="btn btn-success" @click="exportToExcel">
              <i class="bi bi-download"></i>
              Экспорт в Excel
            </button>
          </div>

          <div class="table-responsive">
            <table class="table table-striped table-hover">
              <thead>
                <tr>
                  <th>Время</th>
                  <th>Код</th>
                  <th>Коробка</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(scan, index) in scannedCodes" :key="scan.id">
                  <td>{{ formatTime(scan.timestamp) }}</td>
                  <td><code>{{ scan.code }}</code></td>
                  <td><span class="badge bg-primary">#{{ scan.boxNumber }}</span></td>
                  <td>
                    <button class="btn btn-sm btn-outline-danger" @click="removeScan(index)">Удалить</button>
                  </td>
                </tr>
                <tr v-if="scannedCodes.length === 0">
                  <td colspan="4" class="text-center text-muted py-4">Нет отсканированных кодов</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="d-flex justify-content-between align-items-center mt-3">
            <small class="text-muted">Всего отсканировано: {{ totalScans }} кодов</small>
            <small class="text-muted">В текущей коробке: {{ codesInCurrentBox }} из {{ settings.codesPerBox }}</small>
          </div>
        </div>
      </div>
    </div>
  </div>
  <ToastHistoryModal :show="showToastHistory" @close="showToastHistory = false" />
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import * as XLSX from "xlsx";
// @ts-ignore
import { saveAs } from "file-saver";
import ToastContainer from "@/components/ToastContainer.vue";
import ToastHistoryModal from "@/components/ToastHistoryModal.vue";
import { useSessionStore } from "@/stores/sessionStore";
import { useToasts } from "@/composables/useToasts";
import { toLocaleDateTime } from "@/utils/date";

const sessionStore = useSessionStore();
const {
  settings,
  isConfigured,
  scannedCodes,
  currentBoxNumber,
  codesInCurrentBox,
  totalScans,
  hasRecovery,
  recoverySnapshot,
  recoveryLastSave,
  sessionDate,
} = storeToRefs(sessionStore);

const { push: pushToast, clearHistory } = useToasts();

const currentCode = ref("");
const showToastHistory = ref(false);
const showRecoveryModal = ref(false);
const showStartOverConfirm = ref(false);
const scannerInput = ref<HTMLInputElement | null>(null);
const hydrationReady = ref(false);

const recoveryDateLabel = computed(() => (recoveryLastSave.value ? toLocaleDateTime(recoveryLastSave.value) : ""));

const sounds = {
  success: new Audio("./sounds/beep-success.mp3"),
  error: new Audio("./sounds/beep-error.mp3"),
  nextBox: new Audio("./sounds/next-box.mp3"),
};

const formatTime = (value: Date) => toLocaleDateTime(value);

const focusScanner = () => {
  nextTick(() => {
    if (scannerInput.value) {
      scannerInput.value.focus();
    }
  });
};

const playSound = async (sound: keyof typeof sounds) => {
  try {
    const audio = sounds[sound];
    audio.currentTime = 0;
    await audio.play();
  } catch (error) {
    console.warn("Не удалось воспроизвести звук:", error);
  }
};

const showAlert = (message: string, level: "success" | "info" | "danger" | "warning" = "success") => {
  pushToast(message, level);
};

const confirmSettings = async () => {
  if (settings.value.startBoxNumber < 1 || settings.value.codesPerBox < 1) {
    showAlert("Пожалуйста, введите корректные значения настроек", "danger");
    return;
  }

  sessionStore.configure({ ...settings.value });

  try {
    await sessionStore.saveSettings();
  } catch {
    showAlert("Не удалось сохранить настройки", "danger");
  }

  focusScanner();
};

const persistSession = async () => {
  try {
    await sessionStore.saveSession();
  } catch {
    showAlert("Не удалось сохранить сессию на диск", "danger");
  }
};

const handleScan = async () => {
  if (!isConfigured.value) {
    return;
  }

  const result = sessionStore.recordScan(currentCode.value);
  currentCode.value = "";

  if (result.status === "empty") {
    return;
  }

  if (result.status === "duplicate") {
    await playSound("error");
    showAlert(`Код "${result.duplicate.code}" уже был отсканирован ранее в коробке #${result.duplicate.boxNumber}!`, "danger");
    return;
  }

  await playSound("success");
  showAlert(`Код "${result.scan.code}" успешно отсканирован в коробку #${result.scan.boxNumber}`, "success");

  if (result.status === "boxCompleted") {
    await playSound("nextBox");
    showAlert(`Коробка заполнена! Переходим к коробке #${result.nextBoxNumber}`, "warning");
  }

  await persistSession();
  focusScanner();
};

const removeScan = async (index: number) => {
  sessionStore.removeScan(index);
  await persistSession();
};

const exportToExcel = () => {
  if (scannedCodes.value.length === 0) {
    showAlert("Нет данных для экспорта", "warning");
    return;
  }

  const data = scannedCodes.value.map((scan) => {
    const parts = String(scan.code).trim().split(/\s+/);
    const code1 = parts[0] ?? "";
    const code2 = parts[1] ?? "";
    const code3 = parts.length > 2 ? parts.slice(2).join(" ") : parts[2] ?? "";
    return {
      Время: formatTime(scan.timestamp),
      "Код 1": code1,
      "Код 2": code2,
      "Код 3": code3,
      "Номер коробки": scan.boxNumber,
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Отсканированные коды");

  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });

  saveAs(blob, `scanned_codes_${sessionDate.value ?? new Date().toISOString().split("T")[0]}.xlsx`);
  showAlert("Данные успешно экспортированы в Excel");
};

const recoverSession = async () => {
  if (!recoverySnapshot.value) {
    return;
  }

  sessionStore.fromSnapshot(recoverySnapshot.value);
  sessionStore.setRecoverySnapshot(null);
  showRecoveryModal.value = false;
  showStartOverConfirm.value = false;
  await persistSession();
  focusScanner();
  showAlert("Сессия восстановлена");
};

const clearCurrentSession = async () => {
  try {
    await sessionStore.clearPersistedSession();
  } catch {
    // ignore file deletion failure to keep UX smooth
  }
  sessionStore.resetSession();
  sessionStore.setRecoverySnapshot(null);
};

const confirmStartNewSession = async () => {
  try {
    clearHistory();
  } catch {
    /* noop */
  }

  await clearCurrentSession();
  showStartOverConfirm.value = false;
  showRecoveryModal.value = false;
  showAlert("Новая сессия начата");
};

const handleGlobalClick = () => {
  if (isConfigured.value) {
    focusScanner();
  }
};

onMounted(async () => {
  await sessionStore.hydrate();
  hydrationReady.value = true;

  if (hasRecovery.value) {
    showRecoveryModal.value = true;
  } else {
    sessionStore.resetSession();
  }

  document.addEventListener("click", handleGlobalClick);
});

onUnmounted(() => {
  document.removeEventListener("click", handleGlobalClick);
});

watch(
  () => hasRecovery.value,
  (value) => {
    if (hydrationReady.value && value) {
      showRecoveryModal.value = true;
    }
  }
);

watch(
  () => isConfigured.value,
  (value) => {
    if (value) {
      focusScanner();
    }
  }
);

watch(
  settings,
  async () => {
    if (!hydrationReady.value) {
      return;
    }
    try {
      await sessionStore.saveSettings();
    } catch {
      showAlert("Не удалось сохранить настройки", "danger");
    }
  },
  { deep: true }
);
</script>

<style scoped>
.form-control:focus {
  border-color: #0d6efd;
  box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.25);
}

.table-responsive {
  max-height: 400px;
  overflow-y: auto;
}

.modal {
  background: rgba(0, 0, 0, 0.5);
}

.card {
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
}

.badge.bg-light {
  font-size: 0.75em;
  padding: 0.35em 0.65em;
}
</style>
