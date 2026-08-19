import type { CableData } from '~/types/database';
import { cableData as defaultCableData } from '~/utils/data/cableData';
import type { SystemData, VoltageCalcInputs, VoltageCalcResult } from './types';

/**
 * 容量と単位から設計電流(A)を逆算します。
 */
export function calculateDesignCurrent(sys: SystemData | null | undefined, loadVal: number | null | undefined, loadUnit: string, pf?: number): number | null {
    if (loadVal === null || loadVal === undefined || isNaN(loadVal) || loadVal <= 0) return null;
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

function _getEquivalentSq(size: number, unit: string): number {
    if (unit !== 'mm') return size;
    if (size === 1.6) return 2.0;
    if (size === 2.0) return 3.5;
    if (size === 2.6) return 5.5;
    if (size === 3.2) return 8.0;
    return Math.PI * Math.pow(size / 2, 2);
}

function _calculateVoltageDrop(inputs: VoltageCalcInputs, cables: CableData[]): VoltageCalcResult {
    const { sys, I, L, cableType, selectedCores, derating, ambientTemp, parallel, selectedSize } = inputs;
    if (I === null || L === null || parallel === null || derating === null || selectedSize === null) throw new Error("Invalid inputs");

    let candidates = cables.filter(
        (c) => c.category === cableType && parseFloat(String(c.size)) === selectedSize
    );
    if (selectedCores) {
        candidates = candidates.filter((c) => c.cores === selectedCores || !c.cores || c.cores === '-');
    }

    const fixedCable = candidates[0] || null;
    const unit = fixedCable ? fixedCable.unit : 'sq';
    const A = _getEquivalentSq(selectedSize || 0, unit);

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
        optimal: (fixedCable || { category: cableType, size: selectedSize || '', unit: unit }) as CableData,
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
    if (I === null || L === null || parallel === null || derating === null || targetDrop === null) throw new Error("Invalid inputs");
    
    const maxDropV = sys.voltage * ((targetDrop || 0) / 100);
    const A_req = (sys.simpleK * L * I) / (1000 * maxDropV * parallel);

    let candidates = cables.filter((c) => c.category === cableType && c.ampacity !== '-');
    if (selectedCores) {
        candidates = candidates.filter((c) => c.cores === selectedCores || !c.cores || c.cores === '-');
    }

    candidates.sort((a, b) => {
        const a_sq = _getEquivalentSq(parseFloat(String(a.size)), a.unit);
        const b_sq = _getEquivalentSq(parseFloat(String(b.size)), b.unit);
        return a_sq - b_sq;
    });

    let minAmpacityCable: CableData | null = null;
    let minAreaCable: CableData | null = null;

    for (const c of candidates) {
        const sizeVal = typeof c.size === 'number' ? c.size : parseFloat(String(c.size));
        const c_sq = _getEquivalentSq(sizeVal, c.unit);
        
        if (!minAreaCable && c_sq >= A_req) {
            minAreaCable = c;
        }

        const finalTempDerating = getAmbientTempDerating(c.baseTemp || '', c.maxTemp || '', ambientTemp);
        const ampacityVal = typeof c.ampacity === 'number' ? c.ampacity : parseFloat(String(c.ampacity));
        const effAmp = ampacityVal * derating * finalTempDerating;
        const totalEffAmp = effAmp * parallel;
        
        if (!minAmpacityCable && totalEffAmp >= I) {
            minAmpacityCable = c;
        }

        if (c_sq < A_req) continue;
        if (totalEffAmp < I) continue;

        const finalDropV = (sys.simpleK * L * I) / (1000 * c_sq * parallel);

        return {
            optimal: c,
            minAmpacityCable,
            finalEffAmp: totalEffAmp,
            finalDropV: finalDropV,
            parallelCount: parallel,
            convertedA: c_sq,
            tempDerating: finalTempDerating
        };
    }
    return null;
}
