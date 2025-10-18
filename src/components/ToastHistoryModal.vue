<template>
  <div v-if="show" class="modal fade show d-block" style="background: rgba(0, 0, 0, 0.5)">
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">История уведомлений</h5>
          <button type="button" class="btn-close" @click="$emit('close')"></button>
        </div>
        <div class="modal-body">
          <div v-if="history.length === 0" class="text-muted">Нет уведомлений за эту сессию</div>
          <div v-else class="_history-list">
            <div v-for="item in history" :key="item.id + item.time" class="history-item d-flex align-items-start py-2 border-bottom">
              <span class="_level badge me-2" :class="badgeClass(item.level)">{{ label(item.level) }}</span>
              <div class="flex-grow-1">
                <div class="small text-muted">{{ formatTime(item.time) }}</div>
                <div>
                  <strong v-if="item.title" class="me-1">{{ item.title }}</strong>
                  <span>{{ item.message }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-outline-danger me-auto" @click="clearHistory">Очистить историю</button>
          <button type="button" class="btn btn-secondary" @click="$emit('close')">Закрыть</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useToasts } from "@/composables/useToasts";

defineProps<{ show: boolean }>();
const { history, clearHistory } = useToasts();

const formatTime = (iso: string) => new Date(iso).toLocaleString("ru-RU");
const label = (lvl: "success" | "info" | "warning" | "danger") =>
  ({
    success: "Успех",
    info: "Инфо",
    warning: "Внимание",
    danger: "Ошибка",
  })[lvl];
const badgeClass = (lvl: "success" | "info" | "warning" | "danger") =>
  ({
    success: "bg-success",
    info: "bg-info",
    warning: "bg-warning text-dark",
    danger: "bg-danger",
  })[lvl];
</script>

<style scoped>
._history-list {
  max-height: 50vh;
  overflow: auto;
}
._level {
  width: 100px;
}
</style>
