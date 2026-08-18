<script setup lang="ts">


const props = defineProps<{
  modelValue: string[];
  availableRows: Set<string>;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: string[]): void;
}>();

const kanaOptions = [
  { label: "あ行", value: "a" },
  { label: "か行", value: "k" },
  { label: "さ行", value: "s" },
  { label: "た行", value: "t" },
  { label: "な行", value: "n" },
  { label: "は行", value: "h" },
  { label: "ま行", value: "m" },
  { label: "や行", value: "y" },
  { label: "ら行", value: "r" },
  { label: "わ行他", value: "w" },
];

function isKanaDisabled(row: string) {
  if (row === "w") {
    return !props.availableRows.has("w") && !props.availableRows.has("other");
  }
  return !props.availableRows.has(row);
}

function toggleKana(kana: string) {
  let newValue = [...props.modelValue];
  if (newValue.includes(kana)) {
    newValue = newValue.filter((k) => k !== kana);
  } else {
    newValue.push(kana);
  }
  emit("update:modelValue", newValue);
}
</script>

<template>
  <div class="p-db__filter-grid p-glossary__filter-grid--sm">
    <AppCheckbox
      v-for="kana in kanaOptions"
      :key="kana.value"
      :model-value="props.modelValue.includes(kana.value)"
      :disabled="isKanaDisabled(kana.value)"
      @update:model-value="toggleKana(kana.value)"
    >
      {{ kana.label }}
    </AppCheckbox>
  </div>
</template>

<style scoped lang="scss">
// 既存のグリッドスタイルを継承、もしくは追加
.p-db__filter-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: var(--space-2);
}
</style>
