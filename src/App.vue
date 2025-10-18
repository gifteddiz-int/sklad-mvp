<template>
  <div class="container mt-4">
    <ToastContainer position="top-right" />
    <!-- Восстановление данных -->
    <div v-if="showRecovery" class="modal fade show d-block" style="background: rgba(0, 0, 0, 0.5)">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Восстановление данных</h5>
          </div>
          <div class="modal-body">
            <p>Обнаружены сохраненные данные от {{ recoveryDate }}.</p>
            <p>Хотите восстановить предыдущую сессию сканирования?</p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showStartOverConfirm = true">Начать заново</button>
            <button type="button" class="btn btn-primary" @click="recoverSession">Восстановить</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Подтверждение начала новой сессии (красное предупреждение) -->
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

    <!-- Экран начальной настройки -->
    <div v-if="!isConfigured && !showRecovery" class="row justify-content-center">
      <div class="col-md-6">
        <div class="card">
          <div class="card-body">
            <h2 class="card-title text-center mb-4">Настройки сканирования</h2>
            <form @submit.prevent="confirmSettings">
              <div class="mb-3">
                <label for="startBox" class="form-label">Начальный номер коробки</label>
                <input type="number" class="form-control" id="startBox" v-model.number="settings.startBoxNumber" min="1" required autofocus />
              </div>
              <div class="mb-3">
                <label for="boxCapacity" class="form-label">Количество кодов в коробке</label>
                <input type="number" class="form-control" id="boxCapacity" v-model.number="settings.codesPerBox" min="1" required />
              </div>
              <button type="submit" class="btn btn-primary w-100 btn-lg">Начать сканирование</button>
            </form>
          </div>
        </div>
      </div>
    </div>

    <!-- Основной интерфейс сканирования -->
    <div v-else-if="isConfigured">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h1 class="text-primary mb-0">Сканер штрих-кодов</h1>
        <div class="d-flex gap-2">
          <button class="btn btn-outline-secondary" @click="showToastHistory = true" title="История уведомлений" aria-label="История уведомлений">
            <i class="bi bi-bell"></i>
          </button>
          <button class="btn btn-warning" @click="isConfigured = false">Изменить настройки</button>
        </div>
      </div>

      <!-- Компактная панель настроек -->
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

      <!-- Поле ввода -->
      <div class="card mb-4">
        <div class="card-body">
          <h5 class="card-title">Сканирование</h5>
          <input type="text" class="form-control form-control-lg" v-model="currentCode" @keydown.enter="handleScan" ref="scannerInput" placeholder="Поднесите штрих-код для сканирования..." autofocus />
          <div class="form-text">Поле всегда активно для сканирования</div>
        </div>
      </div>

      <!-- Убрали встроенный alert; тосты показываются отдельно -->

      <!-- Таблица отсканированных кодов -->
      <div class="card">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <h5 class="card-title mb-0">Отсканированные коды</h5>
            <button class="btn btn-success" @click="exportToExcel"><i class="bi bi-download"></i> Экспорт в Excel</button>
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
                  <td>
                    <code>{{ scan.code }}</code>
                  </td>
                  <td>
                    <span class="badge bg-primary">#{{ scan.boxNumber }}</span>
                  </td>
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
            <small class="text-muted"> Всего отсканировано: {{ scannedCodes.length }} кодов </small>
            <small class="text-muted"> В текущей коробке: {{ codesInCurrentBox }} из {{ settings.codesPerBox }} </small>
          </div>
        </div>
      </div>
    </div>
  </div>
  <ToastHistoryModal :show="showToastHistory" @close="showToastHistory = false" />
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from "vue";
import * as XLSX from "xlsx";
// @ts-ignore
import { saveAs } from "file-saver";
import ToastContainer from "@/components/ToastContainer.vue";
import ToastHistoryModal from "@/components/ToastHistoryModal.vue";
import { useToasts } from "@/composables/useToasts";

// Интерфейсы
interface ScanRecord {
  id: string;
  timestamp: Date;
  code: string;
  boxNumber: number;
}

interface AppSettings {
  startBoxNumber: number;
  codesPerBox: number;
}

// Реактивные данные
const settings = ref<AppSettings>({
  startBoxNumber: 1,
  codesPerBox: 10,
});

const isConfigured = ref(false);
const currentCode = ref("");
const scannedCodes = ref<ScanRecord[]>([]);
const currentBoxNumber = ref(1);
const showToastHistory = ref(false);
const showRecovery = ref(false);
const showStartOverConfirm = ref(false);
const recoveryDate = ref("");
const scannerInput = ref<HTMLInputElement>();

// Звуки
const sounds = {
  success: new Audio("./sounds/beep-success.mp3"),
  error: new Audio("./sounds/beep-error.mp3"),
  nextBox: new Audio("./sounds/next-box.mp3"),
};

// Вычисляемые свойства
const codesInCurrentBox = computed(() => {
  return scannedCodes.value.filter((scan) => scan.boxNumber === currentBoxNumber.value).length;
});

const isBoxFull = computed(() => {
  return codesInCurrentBox.value >= settings.value.codesPerBox;
});

// Методы
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

const formatTime = (date: Date): string => {
  return new Date(date).toLocaleString("ru-RU");
};

const playSound = async (soundType: keyof typeof sounds) => {
  try {
    const sound = sounds[soundType];
    sound.currentTime = 0;
    await sound.play();
  } catch (error) {
    console.warn("Не удалось воспроизвести звук:", error);
  }
};

const { push: pushToast, clearHistory } = useToasts();
const showAlert = (message: string, type: "success" | "info" | "danger" | "warning" = "success") => {
  // Показываем через тосты; история доступна в модальном окне
  pushToast(message, type);
};

const confirmSettings = () => {
  if (settings.value.startBoxNumber < 1 || settings.value.codesPerBox < 1) {
    showAlert("Пожалуйста, введите корректные значения настроек", "danger");
    return;
  }

  currentBoxNumber.value = settings.value.startBoxNumber;
  isConfigured.value = true;
  nextTick(() => {
    if (scannerInput.value) {
      scannerInput.value.focus();
    }
  });
};

const handleScan = () => {
  if (!isConfigured.value) return;

  const code = currentCode.value.trim();

  if (!code) {
    return;
  }

  // Проверка на дубликат в текущей сессии с указанием коробки
  const duplicate = scannedCodes.value.find((scan) => scan.code === code);
  if (duplicate) {
    playSound("error");
    showAlert(`Код "${code}" уже был отсканирован ранее в коробке #${duplicate.boxNumber}!`, "danger");
    currentCode.value = "";
    return;
  }

  // Создание записи
  const record: ScanRecord = {
    id: generateId(),
    timestamp: new Date(),
    code: code,
    boxNumber: currentBoxNumber.value,
  };

  scannedCodes.value.unshift(record);
  playSound("success");
  showAlert(`Код "${code}" успешно отсканирован в коробку #${currentBoxNumber.value}`, "success");

  // Проверка заполнения коробки
  if (isBoxFull.value) {
    playSound("nextBox");
    currentBoxNumber.value++;
    showAlert(`Коробка заполнена! Переходим к коробке #${currentBoxNumber.value}`, "warning");
  }

  currentCode.value = "";
  saveToStorage();
};

const removeScan = (index: number) => {
  scannedCodes.value.splice(index, 1);
  saveToStorage();
};

const exportToExcel = () => {
  if (scannedCodes.value.length === 0) {
    showAlert("Нет данных для экспорта", "warning");
    return;
  }

  const data = scannedCodes.value.map((scan) => {
    const all = String(scan.code).trim().split(/\s+/);
    const code1 = all[0] ?? "";
    const code2 = all[1] ?? "";
    const code3 = all.length > 2 ? all.slice(2).join(" ") : (all[2] ?? "");
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

  const date = new Date().toISOString().split("T")[0];
  saveAs(blob, `scanned_codes_${date}.xlsx`);
  showAlert("Данные успешно экспортированы в Excel");
};

// Хранение в локальных файлах (через preload API)
const saveToStorage = () => {
  // Подготовим сериализуемые данные (без Vue Proxy/реактивности)
  const plainSettings = { ...settings.value };
  const plainScans = scannedCodes.value.map((s) => ({
    id: s.id,
    timestamp: new Date(s.timestamp).toISOString(),
    code: s.code,
    boxNumber: s.boxNumber,
  }));
  const data = {
    settings: plainSettings,
    scannedCodes: plainScans,
    currentBoxNumber: currentBoxNumber.value,
  };
  // fire-and-forget, не блокируем UI
  // @ts-ignore - глобальный API из preload
  window.fileStore
    ?.saveSession(data)
    // @ts-ignore
    .then((res) => console.debug("Session saved to:", res?.filePath))
    .catch(() => {
      showAlert("Не удалось сохранить сессию на диск", "danger");
    });
};

const loadFromStorage = async (): Promise<any | null> => {
  // @ts-ignore - глобальный API из preload
  const saved = await window.fileStore?.loadLatestSession();
  return saved ?? null;
};

const recoverSession = async () => {
  const savedData = await loadFromStorage();
  if (savedData) {
    settings.value = savedData.settings;
    scannedCodes.value = savedData.scannedCodes.map((scan: any) => ({
      ...scan,
      timestamp: new Date(scan.timestamp),
    }));
    currentBoxNumber.value = savedData.currentBoxNumber;
    isConfigured.value = true;
    showRecovery.value = false;
    showAlert("Сессия восстановлена");

    nextTick(() => {
      if (scannerInput.value) {
        scannerInput.value.focus();
      }
    });
  }
};

const startNewSession = () => {
  // Очистка файла текущего дня, предыдущие дни сохраняем как бэкапы
  // @ts-ignore - глобальный API из preload
  window.fileStore?.clearSession?.();
  scannedCodes.value = [];
  currentBoxNumber.value = settings.value.startBoxNumber;
  showRecovery.value = false;
  isConfigured.value = false;
  showAlert("Новая сессия начата");
};

const confirmStartNewSession = () => {
  // Очистить историю уведомлений текущей сессии
  try {
    clearHistory();
  } catch {}
  startNewSession();
  showStartOverConfirm.value = false;
};

// Хуки жизненного цикла
onMounted(async () => {
  // Восстановление настроек
  // @ts-ignore - глобальный API из preload
  const savedSettings = await window.fileStore?.loadSettings?.();
  if (savedSettings) {
    settings.value = savedSettings;
  }

  // Проверка сохраненной сессии (берем последнюю сессию из файлов)
  const savedData = await loadFromStorage();
  if (savedData && savedData.scannedCodes && savedData.scannedCodes.length > 0) {
    showRecovery.value = true;
    if (savedData.lastSave) {
      recoveryDate.value = new Date(savedData.lastSave).toLocaleString("ru-RU");
    }
  } else {
    currentBoxNumber.value = settings.value.startBoxNumber;
    isConfigured.value = false;
  }

  // Автосохранение настроек в файл
  const saveSettings = () => {
    // @ts-ignore - глобальный API из preload
    window.fileStore?.saveSettings?.({ ...settings.value }).catch(() => {
      showAlert("Не удалось сохранить настройки", "danger");
    });
  };

  // Следим за изменениями настроек
  const unwatch = watch(settings, saveSettings, { deep: true });

  // Обработчик глобальных событий для фокуса
  const handleGlobalClick = () => {
    if (isConfigured.value) {
      nextTick(() => {
        if (scannerInput.value) {
          scannerInput.value.focus();
        }
      });
    }
  };

  document.addEventListener("click", handleGlobalClick);

  onUnmounted(() => {
    document.removeEventListener("click", handleGlobalClick);
    unwatch();
  });
});
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
