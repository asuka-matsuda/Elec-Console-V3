import { ref, computed, watch, onMounted } from "vue";
import { systemData } from "~/utils/data/systemData";
import { getAvailableSizes } from "~/utils/cableDataHelper";
import { cableData } from "~/utils/data/cableData";
import { calculateDesignCurrent, calculateLogic, generateMathData } from "~/utils/calc/voltage/calcVoltageEngine";
import type { VoltageCalcInputs, SystemData } from "~/utils/calc/voltage/types";
import { useToolPage } from "~/composables/calc/useToolPage";
import { mapVoltageToHistory } from "~/utils/calc/voltage/historyMapper";
import { voltageSchema } from "~/utils/calc/voltage/voltageSchema";

export const defaultForm = {
  mode: "drop" as "drop" | "size",
  phase: "",
  loadValue: null as number | null,
  loadUnit: "A",
  powerFactor: "",
  distance: null as number | null,
  cableType: "",
  cores: "",
  fixedSize: "",
  parallel: "",
  derating: "",
  ambientTemp: "",
  targetDrop: "",
};

export function useVoltageCalculator() {
  const {
    inputs: form,
    result: _dummyResult,
    resetInputs,
    isResetModalOpen,
    openResetModal,
    confirmReset,
    saveToHistory
  } = useToolPage(
    'voltage',
    '電圧降下・ケーブルサイズ選定',
    { ...defaultForm },
    (inputs) => {
      // Dummy calculate function since calcInputs needs to be derived first
      return null;
    },
    {
      toHistory: (inputs, res) => mapVoltageToHistory('電圧降下・ケーブルサイズ選定', {} as any, res as any), // Will not be used directly
      fromHistory: () => JSON.parse(JSON.stringify(defaultForm))
    }
  );

  const resetForm = confirmReset;

  const isSizeCalcMode = computed(() => form.value.mode === "size");
  const isDropCalcMode = computed(() => form.value.mode === "drop");

  const computedAvailableSizes = computed(() => {
    return getAvailableSizes(form.value.cableType);
  });

  watch(
    () => form.value.cableType,
    (newVal) => {
      const sizes = getAvailableSizes(newVal);
      if (!sizes.some((s) => s.value === form.value.fixedSize)) {
        form.value.fixedSize = "";
      }
    }
  );

  const calcInputs = computed<VoltageCalcInputs>(() => {
    const mode = form.value.mode;
    const sys = systemData.find((s) => s.id === form.value.phase) || null;
    const loadVal = form.value.loadValue;
    const loadUnit = form.value.loadUnit;
    const pf = form.value.powerFactor ? parseFloat(form.value.powerFactor) : null;
    const L = form.value.distance;
    const cableType = form.value.cableType || "";
    const rawSize = form.value.fixedSize || "";

    let selectedSize: number | null = null;
    let selectedCores: string | null = null;

    if (mode === "size") {
      selectedCores = form.value.cores || null;
    } else if (rawSize && rawSize.startsWith("idx_")) {
      const idx = parseInt(rawSize.replace("idx_", ""), 10);
      const cable = cableData[idx];
      if (cable) {
        selectedSize = parseFloat(String(cable.size));
        selectedCores = cable.cores || null;
      }
    }

    const derating = form.value.derating ? parseFloat(form.value.derating) : null;
    const rawTempVal = form.value.ambientTemp;
    const ambientTemp =
      rawTempVal && rawTempVal !== "none" ? parseFloat(rawTempVal) : null;
    const parallel = form.value.parallel ? parseInt(form.value.parallel) : null;
    const targetDrop = form.value.targetDrop ? parseFloat(form.value.targetDrop) : null;

    const I = calculateDesignCurrent(sys, loadVal, loadUnit, pf ?? undefined);

    const validationResult = voltageSchema.safeParse(form.value);

    return {
      mode,
      sys: sys as SystemData,
      I,
      L,
      cableType,
      selectedCores,
      derating,
      rawTempVal,
      ambientTemp,
      parallel,
      targetDrop,
      selectedSize,
      loadVal,
      loadUnit,
      pf,
      isReady: validationResult.success,
      missingFields: validationResult.success ? [] : validationResult.error.errors.map(e => String(e.path[0])),
    };
  });

  const calcResult = computed(() => {
    if (!calcInputs.value.isReady) return null;
    return calculateLogic(calcInputs.value);
  });

  const mathSteps = computed(() => {
    return generateMathData(calcInputs.value, calcResult.value) || [];
  });

  return {
    form,
    isResetModalOpen,
    openResetModal,
    resetForm,
    isSizeCalcMode,
    isDropCalcMode,
    computedAvailableSizes,
    calcInputs,
    calcResult,
    mathSteps,
  };
}
