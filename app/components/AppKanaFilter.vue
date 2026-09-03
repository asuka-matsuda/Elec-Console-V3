<script setup lang="ts">
/**
 * AppKanaFilter
 * 五十音（あ行〜わ行他）による絞り込み機能を提供するフィルターコンポーネント。
 */

const selectedKanas = defineModel<string[]>({ default: () => [] });

const props = defineProps<{
  availableRows: Set<string>;
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
</script>

<template>
  <div class="c-kana-filter">
    <AppCheckbox
      v-for="kana in kanaOptions"
      :key="kana.value"
      v-model="selectedKanas"
      :value="kana.value"
      :disabled="isKanaDisabled(kana.value)"
    >
      {{ kana.label }}
    </AppCheckbox>
  </div>
</template>

<style scoped lang="scss">
.c-kana-filter {
  @include grid-auto(80px, var(--space-1));
}
</style>
