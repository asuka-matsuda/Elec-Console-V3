<script setup lang="ts">
import AppButton from '~/components/ui/AppButton.vue';

defineProps<{
  status: string;
}>();

defineEmits<{
  (e: 'update-status', status: string): void
}>();
</script>

<template>
  <div class="p-portal-exam-actions">
    <AppButton 
      variant="success" 
      size="sm" 
      icon="check"
      :disabled="status === '合格'"
      @click="$emit('update-status', '合格')"
    >
      合格
    </AppButton>
    <AppButton 
      variant="danger" 
      size="sm" 
      icon="x"
      :disabled="status === '不良'"
      @click="$emit('update-status', '不良')"
    >
      不良
    </AppButton>
    <AppButton 
      variant="secondary" 
      size="sm" 
      icon="minus"
      :disabled="status === '除外'"
      @click="$emit('update-status', '除外')"
    >
      除外
    </AppButton>
  </div>
</template>

<style scoped lang="scss">
.p-portal-exam-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
</style>