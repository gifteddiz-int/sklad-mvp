import { defineStore } from 'pinia';
import { ref } from 'vue';

export type ToastLevel = 'success' | 'info' | 'warning' | 'danger';

export interface ToastItem {
  id: string;
  message: string;
  level: ToastLevel;
  title?: string;
  duration?: number;
}

export interface ToastHistoryItem {
  id: string;
  message: string;
  level: ToastLevel;
  title?: string;
  time: string;
}

const defaultDurations: Record<ToastLevel, number> = {
  success: 3000,
  info: 4000,
  warning: 5000,
  danger: 6000,
};

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export const useToastStore = defineStore('toast', () => {
  const toasts = ref<ToastItem[]>([]);
  const history = ref<ToastHistoryItem[]>([]);

  function push(message: string, level: ToastLevel = 'info', opts?: { title?: string; duration?: number }) {
    const id = generateId();
    const toast: ToastItem = {
      id,
      message,
      level,
      title: opts?.title,
      duration: opts?.duration ?? defaultDurations[level],
    };

    if (toasts.value.length >= 5) {
      toasts.value.shift();
    }
    toasts.value.push(toast);

    history.value.push({ id, message, level, title: opts?.title, time: new Date().toISOString() });
    if (history.value.length > 200) {
      history.value.shift();
    }

    if (toast.duration && toast.duration > 0) {
      setTimeout(() => remove(id), toast.duration);
    }

    return id;
  }

  function remove(id: string) {
    const index = toasts.value.findIndex((toast) => toast.id === id);
    if (index >= 0) {
      toasts.value.splice(index, 1);
    }
  }

  function clear() {
    toasts.value = [];
  }

  function clearHistory() {
    history.value = [];
  }

  return {
    toasts,
    history,
    push,
    remove,
    clear,
    clearHistory,
  };
});
