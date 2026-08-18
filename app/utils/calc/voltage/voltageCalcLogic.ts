import { cableData as defaultCableData } from '~/utils/cableData';
import type { SystemData, CableData, VoltageCalcInputs, VoltageCalcResult } from './types';

/**
 * 容量と単位から設計電流(A)を逆算します。
 */
export function calculateDesignCurrent(sys: SystemData | null | undefined, loadVal: number, loadUnit: string, pf?: number): number | null {
    if (isNaN(loadVal) || loadVal <= 0) return null;
    if (loadUnit === 'A') return loadVal;

    if (!sys) return null;
    if (loadUnit === 'kW' && pf !== undefined && !isNaN(pf)) return (loadVal * 1000) / (sys.kwDivisor * pf);
    if (loadUnit === 'kVA') return (loadVal * 1000) / sys.kwDivisor;
    if (loadUnit === 'VA') return loadVal / sys.kwDivisor;
    return null;
}

/**
 * 周囲温度による許容電流の補正係数を算出する
 */
export function getAmbientTempDerating(baseTempStr: string | number, maxTempStr: string | number, ambientTemp: number | null): number {
    if (!ambientTemp || isNaN(ambientTemp)) return 1.0;
    const base = parseFloat(String(baseTempStr));
    const max = parseFloat(String(maxTempStr));
    if (isNaN(base) || isNaN(max)) return 1.0;
    if (ambientTemp >= max) return 0.1;
    return Math.sqrt((max - ambientTemp) / (max - base));
}

/**
 * 指定された入力条件に基づいて、最適なケーブルサイズと電圧降下結果を算出します。
 */
export function calculateLogic(inputs: VoltageCalcInputs, cableDataList: CableData[] | null = null): VoltageCalcResult | null {
    if (!inputs || !inputs.isReady) return null;
    const cables = cableDataList || defaultCableData;

    if (inputs.mode === 'size') {
        return _calculateSizeSelection(inputs, cables);
    } else {
        return _calculateVoltageDrop(inputs, cables);
    }
}

function _calculateVoltageDrop(inputs: VoltageCalcInputs, cables: CableData[]): VoltageCalcResult {
    const { sys, I, L, cableType, selectedCores, derating, ambientTemp, parallel, selectedSize } = inputs;

    let candidates = cables.filter(
        (c) => c.category === cableType && parseFloat(String(c.size)) === selectedSize
    );
    if (selectedCores) {
        candidates = candidates.filter((c) => c.cores === selectedCores || !c.cores || c.cores === '-');
    }

    const fixedCable = candidates[0] || null;
    const unit = fixedCable ? fixedCable.unit : 'sq';
    let A = selectedSize || 0;
    
    if (unit === 'mm') {
        if (selectedSize === 1.6) A = 2.0;
        else if (selectedSize === 2.0) A = 3.5;
        else if (selectedSize === 2.6) A = 5.5;
        else if (selectedSize === 3.2) A = 8.0;
        else A = Math.PI * Math.pow((selectedSize || 0) / 2, 2);
    }

    const finalDropV = (sys.simpleK * L * I) / (1000 * (A * parallel));

    let tempDerating = 1.0;
    let finalEffAmp = 0;
    if (fixedCable && fixedCable.ampacity && fixedCable.ampacity !== '-') {
        tempDerating = getAmbientTempDerating(
            fixedCable.baseTemp || '',
            fixedCable.maxTemp || '',
            ambientTemp
        );
        finalEffAmp = parseFloat(String(fixedCable.ampacity)) * derating * tempDerating * parallel;
    }

    return {
        optimal: fixedCable || { category: cableType, size: selectedSize || '', unit: unit },
        minAmpacityCable: fixedCable,
        finalEffAmp,
        finalDropV,
        parallelCount: parallel,
        convertedA: A,
        tempDerating
    };
}

function _calculateSizeSelection(inputs: VoltageCalcInputs, cables: CableData[]): VoltageCalcResult | null {
    const { sys, I, L, cableType, selectedCores, derating, ambientTemp, parallel, targetDrop } = inputs;
    const maxDropV = sys.voltage * ((targetDrop || 0) / 100);

    let candidates = cables.filter((c) => c.category === cableType && c.ampacity !== '-');
    if (selectedCores) {
        candidates = candidates.filter((c) => c.cores === selectedCores || !c.cores || c.cores === '-');
    }

    candidates.sort((a, b) => parseFloat(String(a.ampacity)) - parseFloat(String(b.ampacity)));

    let minAmpacityCable: CableData | null = null;
    for (const c of candidates) {
        const finalTempDerating = getAmbientTempDerating(c.baseTemp || '', c.maxTemp || '', ambientTemp);
        const effAmp = parseFloat(String(c.ampacity)) * derating * finalTempDerating;
        const totalEffAmp = effAmp * parallel;
        if (!minAmpacityCable && totalEffAmp >= I) minAmpacityCable = c;

        if (totalEffAmp < I) continue;
        const R_total = parseFloat(c.resistance) / parallel;
        const dropV = sys.coefficient * L * I * R_total / 1000;
        if (dropV > maxDropV) continue;

        return {
            optimal: c,
            minAmpacityCable,
            finalEffAmp: totalEffAmp,
            finalDropV: dropV,
            parallelCount: parallel,
            convertedA: 0, // In original code it was implicitly omitted
            tempDerating: finalTempDerating
        };
    }
    return null;
}
