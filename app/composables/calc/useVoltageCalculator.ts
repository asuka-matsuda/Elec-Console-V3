import { ref, computed, watch } from "vue";
import { useLocalStorage } from "@vueuse/core";
import { systemData } from "~/utils/data/systemData";
import { getAvailableSizes } from "~/utils/cableDataHelper";
import { cableData } from "~/utils/cableData";
import { calculateDesignCurrent, calculateLogic, generateMathData } from "~/utils/calcVoltageEngine";
import type { VoltageCalcInputs, SystemData } from "~/utils/calc/voltage/types";

export const defaultForm = {
  mode: "drop" as "drop" | "size",
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
};

export function useVoltageCalculator() {
  const form = useLocalStorage("elec-calc-voltage-form", { ...defaultForm });
  const isResetModalOpen = ref(false);

  const resetForm = () => {
    form.value = { ...defaultForm };
    isResetModalOpen.value = false;
  };

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
    const loadVal = form.value.loadValue || 0;
    const loadUnit = form.value.loadUnit;
    const pf = parseFloat(form.value.powerFactor);
    const L = form.value.distance || 0;
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

    const derating = parseFloat(form.value.derating) || 1.0;
    const rawTempVal = form.value.ambientTemp;
    const ambientTemp =
      rawTempVal && rawTempVal !== "none" ? parseFloat(rawTempVal) : null;
    const parallel = parseInt(form.value.parallel) || 1;
    const targetDrop = parseFloat(form.value.targetDrop) || null;

    const I = calculateDesignCurrent(sys, loadVal, loadUnit, pf) || 0;

    const missing = [];
    if (!sys) missing.push("sys");
    if (!loadVal) missing.push("loadVal");
    if (!L) missing.push("L");
    if (!cableType) missing.push("cableType");
    if (!derating) missing.push("derating");
    if (mode === "drop" && !selectedSize) missing.push("selectedSize");

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
      isReady: missing.length === 0,
      missingFields: missing,
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
    resetForm,
    isSizeCalcMode,
    isDropCalcMode,
    computedAvailableSizes,
    calcInputs,
    calcResult,
    mathSteps,
  };
}
