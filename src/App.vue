<template>
  <div class="container mt-4">
    <h1 class="text-primary mb-4">Сканер штрих-кодов</h1>

    <!-- Настройки -->
    <div class="card mb-4">
      <div class="card-body">
        <h5 class="card-title">Настройки сканирования</h5>
        <div class="row g-3">
          <div class="col-md-4">
            <label for="startBox" class="form-label">Начальный номер коробки</label>
            <input type="number" class="form-control" id="startBox" v-model.number="settings.startBoxNumber" min="1" />
          </div>
          <div class="col-md-4">
            <label for="boxCapacity" class="form-label">Количество кодов в коробке</label>
            <input type="number" class="form-control" id="boxCapacity" v-model.number="settings.codesPerBox" min="1" />
          </div>
          <div class="col-md-4">
            <label class="form-label">Текущая коробка</label>
            <div class="form-control bg-light">{{ currentBoxNumber }}</div>
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

    <!-- Статус -->
    <div v-if="alertMessage" :class="`alert alert-${alertType} alert-dismissible fade show`" role="alert">
      {{ alertMessage }}
      <button type="button" class="btn-close" @click="alertMessage = ''"></button>
    </div>

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
            <button type="button" class="btn btn-secondary" @click="startNewSession">Начать заново</button>
            <button type="button" class="btn btn-primary" @click="recoverSession">Восстановить</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from "vue";
import * as XLSX from "xlsx";
// @ts-ignore
import { saveAs } from "file-saver";

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

const currentCode = ref("");
const scannedCodes = ref<ScanRecord[]>([]);
const currentBoxNumber = ref(1);
const alertMessage = ref("");
const alertType = ref("success");
const showRecovery = ref(false);
const recoveryDate = ref("");
const scannerInput = ref<HTMLInputElement>();

// Звуки (замени пути на реальные)
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

const showAlert = (message: string, type: "success" | "danger" | "warning" = "success") => {
  alertMessage.value = message;
  alertType.value = type;
  setTimeout(() => {
    alertMessage.value = "";
  }, 3000);
};

const handleScan = () => {
  const code = currentCode.value.trim();

  if (!code) {
    return;
  }

  // Проверка на дубликат в текущей сессии
  const isDuplicate = scannedCodes.value.some((scan) => scan.code === code);

  if (isDuplicate) {
    playSound("error");
    showAlert(`Код "${code}" уже был отсканирован ранее!`, "danger");
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

  const data = scannedCodes.value.map((scan) => ({
    Время: formatTime(scan.timestamp),
    Код: scan.code,
    "Номер коробки": scan.boxNumber,
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Отсканированные коды");

  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });

  const date = new Date().toISOString().split("T")[0];
  saveAs(blob, `scanned_codes_${date}.xlsx`);
  showAlert("Данные успешно экспортированы в Excel");
};

// Работа с localStorage
const saveToStorage = () => {
  const data = {
    settings: settings.value,
    scannedCodes: scannedCodes.value,
    currentBoxNumber: currentBoxNumber.value,
    lastSave: new Date().toISOString(),
  };
  localStorage.setItem("barcodeScannerData", JSON.stringify(data));
};

const loadFromStorage = (): any => {
  const saved = localStorage.getItem("barcodeScannerData");
  return saved ? JSON.parse(saved) : null;
};

const recoverSession = () => {
  const savedData = loadFromStorage();
  if (savedData) {
    settings.value = savedData.settings;
    scannedCodes.value = savedData.scannedCodes.map((scan: any) => ({
      ...scan,
      timestamp: new Date(scan.timestamp),
    }));
    currentBoxNumber.value = savedData.currentBoxNumber;
    showRecovery.value = false;
    showAlert("Сессия восстановлена");
  }
};

const startNewSession = () => {
  localStorage.removeItem("barcodeScannerData");
  scannedCodes.value = [];
  currentBoxNumber.value = settings.value.startBoxNumber;
  showRecovery.value = false;
  showAlert("Новая сессия начата");
};

// Хуки жизненного цикла
onMounted(() => {
  // Восстановление настроек
  const savedSettings = localStorage.getItem("scannerSettings");
  if (savedSettings) {
    settings.value = JSON.parse(savedSettings);
  }

  // Проверка сохраненной сессии
  const savedData = loadFromStorage();
  if (savedData && savedData.scannedCodes.length > 0) {
    showRecovery.value = true;
    recoveryDate.value = new Date(savedData.lastSave).toLocaleString("ru-RU");
  } else {
    currentBoxNumber.value = settings.value.startBoxNumber;
  }

  // Фокус на поле ввода
  if (scannerInput.value) {
    scannerInput.value.focus();
  }

  // Автосохранение настроек
  const saveSettings = () => {
    localStorage.setItem("scannerSettings", JSON.stringify(settings.value));
  };

  // Следим за изменениями настроек
  const unwatch = watch(settings, saveSettings, { deep: true });

  // Обработчик глобальных событий для фокуса
  const handleGlobalClick = () => {
    nextTick(() => {
      if (scannerInput.value) {
        scannerInput.value.focus();
      }
    });
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
</style>
