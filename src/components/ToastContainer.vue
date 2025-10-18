<template>
  <div class="toast-container position-fixed p-3" :class="positionClass" style="z-index: 1080">
    <transition-group name="toast-fade" tag="div">
      <div
        v-for="t in toasts"
        :key="t.id"
        class="toast show align-items-center text-white border-0 mb-2"
        :class="bgClass(t.level)"
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
      >
        <div class="d-flex">
          <div class="toast-body">
            <strong v-if="t.title" class="me-1">{{ t.title }}</strong>
            <span>{{ t.message }}</span>
          </div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" aria-label="Close" @click="remove(t.id)"></button>
        </div>
      </div>
    </transition-group>
  </div>
  
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useToasts } from '@/composables/useToasts';

const props = defineProps<{ position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' }>();
const { toasts, remove } = useToasts();

const positionClass = computed(() => {
  switch (props.position ?? 'top-right') {
    case 'top-left':
      return 'top-0 start-0';
    case 'bottom-right':
      return 'bottom-0 end-0';
    case 'bottom-left':
      return 'bottom-0 start-0';
    default:
      return 'top-0 end-0';
  }
});

const bgClass = (level: 'success' | 'info' | 'warning' | 'danger') => {
  return {
    success: 'bg-success',
    info: 'bg-info',
    warning: 'bg-warning text-dark',
    danger: 'bg-danger',
  }[level];
};
</script>

<style scoped>
.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

/* Make Bootstrap toast look nice without JS plugin */
.toast {
  display: block;
  min-width: 260px;
  max-width: 420px;
}
</style>

