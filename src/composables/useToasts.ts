import { storeToRefs } from 'pinia';
import { useToastStore } from '@/stores/toastStore';

export const useToasts = () => {
  const store = useToastStore();
  const { toasts, history } = storeToRefs(store);

  return {
    toasts,
    history,
    push: store.push,
    remove: store.remove,
    clear: store.clear,
    clearHistory: store.clearHistory,
  };
};
