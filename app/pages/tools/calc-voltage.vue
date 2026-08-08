<script setup lang="ts">
import { reactive, computed } from "vue";

// 空の構造
useHead({
  title: "電圧降下・ケーブルサイズ選定",
});

// リアクティブステート（フォーム入力値）
const form = reactive({
  mode: "drop", // "drop" (電圧降下) | "size" (導体断面積)
  phase: "",
  loadValue: null as number | null,
  loadUnit: "A",
  powerFactor: "1.0",
  distance: null as number | null,
  cableType: "",
  cores: "",
  fixedSize: "",
  parallel: "1",
  derating: "1.0",
  ambientTemp: "none",
  targetDrop: "2",
});

// 計算モードの選択肢
const modeOptions = [
  { label: "電圧降下", value: "drop", color: "var(--color-category-tool)" },
  { label: "導体断面積", value: "size", color: "var(--color-category-tool)" },
];

const phaseOptions = [
  { label: "単相2線式 100V", value: "1P2W100" },
  { label: "単相2線式 200V", value: "1P2W200" },
  { label: "単相3線式 100/200V", value: "1P3W200" },
  { label: "三相3線式 200V", value: "3P3W200" },
  { label: "三相3線式 400V", value: "3P3W400" },
];

const loadUnitOptions = [
  { label: "A", value: "A" },
  { label: "kW", value: "kW" },
  { label: "kVA", value: "kVA" },
  { label: "VA", value: "VA" },
];

const powerFactorOptions = [
  { label: "1.0 (電熱器・白熱灯等)", value: "1.0" },
  { label: "0.95", value: "0.95" },
  { label: "0.9", value: "0.9" },
  { label: "0.85", value: "0.85" },
  { label: "0.8 (モーター・一般動力等)", value: "0.8" },
  { label: "0.75", value: "0.75" },
  { label: "0.7", value: "0.7" },
  { label: "0.65", value: "0.65" },
  { label: "0.6", value: "0.6" },
];

const cableTypeOptions = [
  { label: "CVT / CET", value: "CVT" },
  { label: "CV / CE", value: "CV" },
  { label: "IV / EM-IE", value: "IV" },
  { label: "VVF (平型)", value: "VVF" },
];

const coreOptions = [
  { label: "1芯 (単心)", value: "1" },
  { label: "2芯", value: "2" },
  { label: "3芯", value: "3" },
  { label: "4芯", value: "4" },
];

const fixedSizeOptions = [
  { label: "2 (mm²)", value: "2" },
  { label: "3.5 (mm²)", value: "3.5" },
  { label: "5.5 (mm²)", value: "5.5" },
  { label: "8 (mm²)", value: "8" },
  { label: "14 (mm²)", value: "14" },
  { label: "22 (mm²)", value: "22" },
  { label: "38 (mm²)", value: "38" },
  { label: "60 (mm²)", value: "60" },
  { label: "100 (mm²)", value: "100" },
  { label: "150 (mm²)", value: "150" },
  { label: "200 (mm²)", value: "200" },
  { label: "250 (mm²)", value: "250" },
  { label: "325 (mm²)", value: "325" },
];

const parallelOptions = [
  { label: "1条", value: "1" },
  { label: "2条", value: "2" },
  { label: "3条", value: "3" },
  { label: "4条", value: "4" },
  { label: "5条", value: "5" },
  { label: "6条", value: "6" },
];

const deratingOptions = [
  { label: "気中・ラック (係数 1.0)", value: "1.0" },
  { label: "電線管内 3条以下 (0.70)", value: "0.7" },
  { label: "電線管内 4条 (0.63)", value: "0.63" },
  { label: "電線管内 5〜6条 (0.56)", value: "0.56" },
];

const ambientTempOptions = [
  { label: "使用しない（補正なし）", value: "none" },
  { label: "30℃", value: "30" },
  { label: "40℃", value: "40" },
  { label: "50℃", value: "50" },
  { label: "60℃", value: "60" },
];

const targetDropOptions = [
  { label: "2% 以下", value: "2" },
  { label: "3% 以下", value: "3" },
  { label: "4% 以下", value: "4" },
  { label: "5% 以下", value: "5" },
  { label: "6% 以下", value: "6" },
  { label: "7% 以下", value: "7" },
];

// 表示制御用の算出プロパティ
const isSizeCalcMode = computed(() => form.mode === "size");
const isDropCalcMode = computed(() => form.mode === "drop");
</script>

<template>
  <AppToolLayout>
    <template #disclaimer>
      <AppDisclaimer />
    </template>

    <template #results>
      <AppPanel
        variant="hud"
        bracketColor="tool"
        style="flex: 1; min-height: 0"
      >
        <template #header>
          <AppSectionHeader title="計算結果" icon="check-square" variant="tool" size="md" />
        </template>
        <div
          style="
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--color-text-muted);
          "
        >
          （結果エリア：後日実装）
        </div>
      </AppPanel>
    </template>

    <template #inputs>
      <AppPanel variant="simple" style="flex: 1; min-height: 0">
        <template #header>
          <AppSectionHeader title="条件入力" icon="edit" variant="tool" size="md" />
        </template>
        <!-- 1. 計算モード切替 (AppRadioGroup) -->
        <div class="u-mb-4">
          <AppRadioGroup v-model="form.mode" :options="modeOptions" />
        </div>

        <div class="l-grid l-grid--2col">
          <!-- 2. 配電方式・電圧 -->
          <AppFormGroup label="配電方式・電圧">
            <AppSelect v-model="form.phase" :options="phaseOptions" placeholder="選択してください" />
          </AppFormGroup>

          <!-- 3. 負荷 -->
          <AppFormGroup label="負荷">
            <div class="c-input-group">
              <AppInput
                v-model.number="form.loadValue"
                type="number"
                placeholder="入力してください"
                min="0.1"
                step="0.1"
              />
              <AppSelect v-model="form.loadUnit" :options="loadUnitOptions" style="width: 80px; flex-shrink: 0;" />
            </div>
          </AppFormGroup>

          <!-- 4. 力率 -->
          <AppFormGroup label="力率設定 (kW時)">
            <AppSelect v-model="form.powerFactor" :options="powerFactorOptions" placeholder="選択してください" />
          </AppFormGroup>

          <!-- 5. 配線距離 -->
          <AppFormGroup label="配線距離 (L)">
            <div class="c-input-group">
              <AppInput
                v-model.number="form.distance"
                type="number"
                placeholder="入力してください"
                min="1"
              />
              <span class="c-input-addon">m</span>
            </div>
          </AppFormGroup>

          <!-- 6. 使用ケーブル -->
          <AppFormGroup label="使用ケーブル">
            <AppSelect v-model="form.cableType" :options="cableTypeOptions" placeholder="選択してください" />
          </AppFormGroup>

          <!-- 7. 芯数指定 (導体断面積モードのみ) -->
          <AppFormGroup v-if="isSizeCalcMode" label="芯数 指定">
            <AppSelect v-model="form.cores" :options="coreOptions" placeholder="選択してください" />
          </AppFormGroup>

          <!-- 8. ケーブルサイズ指定 (電圧降下モードのみ) -->
          <AppFormGroup v-if="isDropCalcMode" label="ケーブルサイズ 指定">
            <AppSelect v-model="form.fixedSize" :options="fixedSizeOptions" placeholder="選択してください" />
          </AppFormGroup>

          <!-- 9. 敷設条数 -->
          <AppFormGroup label="敷設条数">
            <AppSelect v-model="form.parallel" :options="parallelOptions" placeholder="選択してください" />
          </AppFormGroup>

          <!-- 10. 布設条件 -->
          <AppFormGroup label="布設条件 (電流減少係数)">
            <AppSelect v-model="form.derating" :options="deratingOptions" placeholder="選択してください" />
          </AppFormGroup>

          <!-- 11. 想定周囲温度 -->
          <AppFormGroup label="想定周囲温度">
            <AppSelect v-model="form.ambientTemp" :options="ambientTempOptions" placeholder="選択してください" />
          </AppFormGroup>

          <!-- 12. 目標（許容）電圧降下率 (導体断面積モードのみ) -->
          <AppFormGroup v-if="isSizeCalcMode" label="目標（許容）電圧降下率">
            <AppSelect v-model="form.targetDrop" :options="targetDropOptions" placeholder="選択してください" />
          </AppFormGroup>
        </div>
      </AppPanel>
    </template>

    <template #basis>
      <AppPanel
        variant="simple"
        style="flex: 1; min-height: 0"
      >
        <template #header>
          <AppSectionHeader title="計算根拠" icon="book" variant="tool" size="md" />
        </template>
        <div
          style="
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--color-text-muted);
          "
        >
          （計算根拠エリア：後日実装）
        </div>
      </AppPanel>
    </template>
  </AppToolLayout>
</template>

<style scoped lang="scss">
/* 2カラムグリッドを再現 (PCファースト) */
.l-grid {
  display: grid;
  gap: var(--space-4);

  &--2col {
    grid-template-columns: repeat(2, 1fr); // PCのデフォルトは2カラム
    
    @include mq("md") { // スマホサイズに縮んだ時だけ1カラムに上書き
      grid-template-columns: 1fr;
    }
  }
}

/* 旧 c-input-group を簡単なFlexで再現 */
.c-input-group {
  display: flex;
  width: 100%;

  // AppInputの中身をflex:1にして引き伸ばす
  :deep(.c-input) {
    flex: 1;
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
  }
  
  // selectやaddonを隣接させる
  > :deep(select),
  > .c-input-addon {
    border-left: none;
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
  }

  .c-input-addon {
    display: inline-flex;
    align-items: center;
    padding: 0 var(--space-3);
    background: var(--color-bg-base);
    border: var(--border-width-base) solid var(--color-border);
    border-left: none;
    border-radius: 0 var(--radius-base) var(--radius-base) 0;
    color: var(--color-text-muted);
    font-size: var(--text-sm);
  }
}
</style>
