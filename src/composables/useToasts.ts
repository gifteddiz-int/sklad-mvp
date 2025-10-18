import { ref } from 'vue';

export type ToastLevel = 'success' | 'info' | 'warning' | 'danger';

export interface ToastItem {
  id: string;
  message: string;
  level: ToastLevel;
  title?: string;
  duration?: number;
}

const toasts = ref<ToastItem[]>([]);

const defaultDurations: Record<ToastLevel, number> = {
  success: 3000,
  info: 4000,
  warning: 5000,
  danger: 6000,
};

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export function useToasts() {
  const push = (message: string, level: ToastLevel = 'info', opts?: { title?: string; duration?: number }) => {
    const id = genId();
    const item: ToastItem = {
      id,
      message,
      level,
      title: opts?.title,
      duration: opts?.duration ?? defaultDurations[level],
    };

    // ограничим очередь до 5 тостов
    if (toasts.value.length >= 5) {
      toasts.value.shift();
    }

    toasts.value.push(item);

    if (item.duration && item.duration > 0) {
      setTimeout(() => remove(id), item.duration);
    }

    return id;
  };

  const remove = (id: string) => {
    const idx = toasts.value.findIndex((t) => t.id === id);
    if (idx >= 0) toasts.value.splice(idx, 1);
  };

  const clear = () => {
    toasts.value = [];
  };

  return { toasts, push, remove, clear };
}

