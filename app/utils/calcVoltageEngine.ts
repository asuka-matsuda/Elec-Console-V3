/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * @fileoverview Voltage Calculation Engine
 * 電圧降下 / ケーブルサイズ選定計算エンジン。
 * ケーブルマスターデータや配電方式データを元に、条件に適合する最小ケーブルサイズの探索や設計電流の計算を行います。
 */

import { cableData as defaultCableData } from '~/utils/cableData';
import { hlVal, formatVal } from './mathUtils';

/**
 * 容量と単位から設計電流(A)を逆算します。
 * @param {Object} sys - 配電方式マスターデータ
 * @param {number} loadVal - 負荷容量
 * @param {string} loadUnit - 容量の単位 (A, kW, kVA, VA)
 * @param {number} [pf] - 力率 (kW の場合に使用)
 * @returns {number|null} 変換された設計電流(A)
 */
export function calculateDesignCurrent(sys: Record<string, any> | null | undefined, loadVal: number, loadUnit: string, pf?: number): number | null {
    if (!sys || isNaN(loadVal) || loadVal <= 0) return null;
    if (loadUnit === 'kW' && pf !== undefined && !isNaN(pf)) return (loadVal * 1000) / (sys.kwDivisor * pf);
    if (loadUnit === 'kVA') return (loadVal * 1000) / sys.kwDivisor;
    if (loadUnit === 'VA') return loadVal / sys.kwDivisor;
    if (loadUnit === 'A') return loadVal;
    return null;
}

/**
 * 指定された入力条件に基づいて、最適なケーブルサイズと電圧降下結果を算出します。
 * @param {Object} inputs - UIから収集された検証済みの入力パラメータ群
 * @param {Array} cableDataList - ケーブルマスターデータ
 * @returns {Object|null} 最適サイズ、限界電流値、最終電圧降下などの計算結果
 */
export function calculateLogic(inputs: Record<string, any>, cableDataList: Record<string, any>[] | null = null): Record<string, any> | null {
    if (!inputs || !inputs.isReady) return null;
    const cables = cableDataList || defaultCableData;

    if (inputs.mode === 'size') {
        return _calculateSizeSelection(inputs, cables);
    } else {
        return _calculateVoltageDrop(inputs, cables);
    }
}

// ==========================================================================
// メイン計算処理
// ==========================================================================

/**
 * ケーブルサイズが指定された場合の電圧降下と許容電流を計算する
 * @param {Object} inputs - ユーザー入力データ
 * @param {Array} cables - ケーブルデータ
 * @returns {Object} 計算結果オブジェクト
 */
function _calculateVoltageDrop(inputs: Record<string, any>, cables: Record<string, any>[]) {
    const { sys, I, L, cableType, selectedCores, derating, ambientTemp, parallel, selectedSize } =
        inputs;

    let candidates = cables.filter(
        (c) => c.category === cableType && parseFloat(c.size) === selectedSize
    );
    if (selectedCores) {
        candidates = candidates.filter((c) => c.cores === selectedCores || !c.cores || c.cores === '-');
    }

    const fixedCable = candidates[0] || null;
    const unit = fixedCable ? fixedCable.unit : 'sq';
    let A = selectedSize;
    if (unit === 'mm') {
        if (selectedSize === 1.6) A = 2.0;
        else if (selectedSize === 2.0) A = 3.5;
        else if (selectedSize === 2.6) A = 5.5;
        else if (selectedSize === 3.2) A = 8.0;
        else A = Math.PI * Math.pow(selectedSize / 2, 2);
    }

    const finalDropV = (sys.simpleK * L * I) / (1000 * (A * parallel));

    let tempDerating = 1.0;
    let finalEffAmp = 0;
    if (fixedCable && fixedCable.ampacity !== '-') {
        tempDerating = _getAmbientTempDerating(
            fixedCable.baseTemp,
            fixedCable.maxTemp,
            ambientTemp
        );
        finalEffAmp = parseFloat(fixedCable.ampacity) * derating * tempDerating * parallel;
    }

    return {
        optimal: fixedCable || { category: cableType, size: selectedSize, unit: unit },
        minAmpacityCable: fixedCable,
        finalEffAmp,
        finalDropV,
        parallelCount: parallel,
        convertedA: A,
        tempDerating
    };
}

// ==========================================================================
// サイズ選定処理
// ==========================================================================

/**
 * 許容電流と電圧降下の両方の条件を満たす最小ケーブルサイズを選定する
 * @param {Object} inputs - ユーザー入力データ
 * @param {Array} cables - ケーブルデータ
 * @returns {Object|null} 選定結果オブジェクト
 */
function _calculateSizeSelection(inputs: Record<string, any>, cables: Record<string, any>[]) {
    const { sys, I, L, cableType, selectedCores, derating, ambientTemp, parallel, targetDrop } =
        inputs;
    const maxDropV = sys.voltage * (targetDrop / 100);

    let candidates = cables.filter((c) => c.category === cableType && c.ampacity !== '-');
    if (selectedCores) {
        candidates = candidates.filter((c) => c.cores === selectedCores || !c.cores || c.cores === '-');
    }

    candidates.sort((a, b) => parseFloat(a.ampacity) - parseFloat(b.ampacity));

    let minAmpacityCable = null;
    for (const c of candidates) {
        const finalTempDerating = _getAmbientTempDerating(c.baseTemp, c.maxTemp, ambientTemp);
        const effAmp = parseFloat(c.ampacity) * derating * finalTempDerating;
        const totalEffAmp = effAmp * parallel;
        if (!minAmpacityCable && totalEffAmp >= I) minAmpacityCable = c;

        if (totalEffAmp < I) continue;
        const R_total = parseFloat(c.resistance) / parallel;
        const dropV = (sys.coefficient * L * I * R_total) / 1000;
        if (dropV > maxDropV) continue;

        return {
            optimal: c,
            minAmpacityCable,
            finalEffAmp: totalEffAmp,
            finalDropV: dropV,
            parallelCount: parallel,
            tempDerating: finalTempDerating
        };
    }
    return null;
}

/**
 * 計算過程を示す数式（TEX）および凡例のデータを生成します。
 * @param {Object} inputs - ユーザーの入力条件
 * @param {Object} result - calculateLogicの計算結果
 * @param {Array} cableDataList - ケーブルデータ
 * @returns {Array<{title?: string, tex: string, legend: Array<{symbol: string, name: string}>}>|null} ステップごとの描画用データ
 */
export function generateMathData(inputs: Record<string, any>, result: Record<string, any> | null, cableDataList: Record<string, any>[] | null = null): Array<{title?: string, tex: string, legend: any[]}> | null {
    if (!inputs) return null;
    const cables = cableDataList || defaultCableData;

    const step1 = _getUnitConversionFormula(inputs);
    const step2 = _getTempDeratingFormula(inputs, result, cables);
    const step3 = _getThermalLimitFormula(inputs, result, cables);
    const step4 = _getVoltageDropFormula(inputs, result);

    if (inputs.mode === 'size') {
        return [
            { title: '① 単位換算（負荷電流）', tex: step1.tex, legend: step1.leg },
            {
                title: '② 使用ケーブルの電圧降下による最小サイズ',
                tex: step4.tex,
                legend: step4.leg
            },
            {
                title: '③ ②で算出されたケーブルの温度補正による許容電流',
                tex: step2.tex,
                legend: step2.leg
            },
            { title: '④ ③で算出された許容電流による最終サイズ', tex: step3.tex, legend: step3.leg }
        ];
    } else {
        const isAmpOver = result && result.finalEffAmp > 0 && inputs.I > result.finalEffAmp;
        const steps = [
            { title: '① 単位換算（負荷電流）', tex: step1.tex, legend: step1.leg },
            { title: '② 選択ケーブルの温度補正による許容電流', tex: step2.tex, legend: step2.leg },
            { title: '③ 選択ケーブルの許容電流チェック', tex: step3.tex, legend: step3.leg }
        ];
        if (!isAmpOver) {
            steps.push({
                title: '④ 選択ケーブルの電圧降下チェック',
                tex: step4.tex,
                legend: step4.leg
            });
        }
        return steps;
    }
}

// ==========================================================================
// 内部ユーティリティ関数
// ==========================================================================

/**
 * 周囲温度による許容電流の補正係数を算出する
 * @param {string|number} baseTempStr - 基準周囲温度
 * @param {string|number} maxTempStr - ケーブルの最高許容温度
 * @param {number} ambientTemp - 実際の周囲温度
 * @returns {number} 温度低減係数
 */
function _getAmbientTempDerating(baseTempStr: string | number, maxTempStr: string | number, ambientTemp: number | null) {
    if (!ambientTemp || isNaN(ambientTemp)) return 1.0;
    const base = parseFloat(String(baseTempStr));
    const max = parseFloat(String(maxTempStr));
    if (isNaN(base) || isNaN(max)) return 1.0;
    if (ambientTemp >= max) return 0.1; // 極端な低減（計算破綻回避）
    return Math.sqrt((max - ambientTemp) / (max - base));
}

// _str は mathUtils.ts の formatVal / hlVal に移行したため削除

/**
 * 対象となるケーブルの定義データを取得する
 * @param {Object} inputs - ユーザー入力データ
 * @param {Object} result - 計算結果データ
 * @param {Array} cables - ケーブルデータ
 * @returns {Object|null} ケーブルマスターデータ
 */
function _getTargetCable(inputs: Record<string, any>, result: Record<string, any> | null, cables: Record<string, any>[]) {
    if (result && result.optimal) return result.optimal;

    if (inputs && inputs.cableType && inputs.selectedSize !== null) {
        let candidates = cables.filter(
            (c) => c.category === inputs.cableType && parseFloat(c.size) === inputs.selectedSize
        );
        if (inputs.selectedCores) {
            candidates = candidates.filter((c) => c.cores === inputs.selectedCores || !c.cores);
        }
        return candidates[0] || null;
    }
    return null;
}

/**
 * 温度補正の計算式用TEX文字列を生成する
 * @param {Object} inputs - ユーザー入力データ
 * @param {Object} result - 計算結果データ
 * @param {Array} cables - ケーブルデータ
 * @returns {Object} { tex, leg } TEX文字列と凡例配列
 */
function _getTempDeratingFormula(inputs: Record<string, any>, result: Record<string, any> | null, cables: Record<string, any>[]) {
    const targetCable = _getTargetCable(inputs, result, cables);

    if (!targetCable || !targetCable.ampacity || targetCable.ampacity === '-') {
        return {
            tex: `\\text{許容電流データなし}`,
            leg: []
        };
    }

    const baseAmp = parseFloat(targetCable.ampacity);

    if (inputs.ambientTemp === null) {
        return {
            tex: `I_0' = ${baseAmp}\\text{ A} \\quad \\text{(温度補正なし)}`,
            leg: ["\\( I_0' \\): 補正後許容電流 [A]"]
        };
    }

    const amb = inputs.ambientTemp;
    const max = parseFloat(targetCable.maxTemp);
    const base = parseFloat(targetCable.baseTemp);

    let k;
    if (result && result.tempDerating) k = result.tempDerating;
    else k = _getAmbientTempDerating(targetCable.baseTemp, targetCable.maxTemp, amb);

    if (isNaN(max) || isNaN(base)) {
        return { tex: '\\text{温度補正不可}', leg: [] };
    }

    const tempAmp = baseAmp * k;
    const ambHl = hlVal(amb, '\\theta_{amb}', 1);
    const tex = `\\begin{aligned} I_0' &= I_0 \\times \\sqrt{\\frac{\\theta_{max} - \\theta_{amb}}{\\theta_{max} - \\theta_{base}}} \\\\ &= ${baseAmp} \\times \\sqrt{\\frac{${max} - ${ambHl}}{${max} - ${base}}} \\\\ &= ${tempAmp.toFixed(1)} \\text{ A} \\end{aligned}`;

    const leg = [
        "\\( I_0' \\): 補正後許容電流 [A]",
        '\\( I_0 \\): 基準許容電流 [A]',
        '\\( \\theta_{max} \\): 最高許容温度 (' + max + '℃)',
        '\\( \\theta_{base} \\): 基底温度 (' + base + '℃)',
        '\\( \\theta_{amb} \\): 周囲温度 (' + amb + '℃)'
    ];

    return { tex, leg };
}

/**
 * 電流の単位換算式用TEX文字列を生成する
 * @param {Object} inputs - ユーザー入力データ
 * @returns {Object} { tex, leg } TEX文字列と凡例配列
 */
function _getUnitConversionFormula(inputs: Record<string, any>) {
    const { sys, I, loadVal, loadUnit, pf } = inputs;
    const P = hlVal(loadVal, 'P', 1);
    const Cos = hlVal(pf, '\\cos \\theta', 2);

    if (loadUnit === 'A') {
        const tex =
            loadVal === null ? `I = \\text{設計電流 [A]}` : `I = ${P} \\text{ A}`;
        return { tex, leg: ['\\( I \\): 設計電流 [A]'] };
    }

    let vTerm = '\\alpha \\cdot V';
    const leg = [];

    if (sys) {
        if (sys.id.startsWith('3P')) {
            vTerm = `\\sqrt{3} \\times ${sys.voltage}`;
            leg.push(`\\( V \\): 線間電圧 (${sys.voltage} V)`, `\\( \\sqrt{3} \\): 三相係数`);
        } else {
            vTerm = sys.id === '1P3W200' ? `200` : `${sys.voltage}`;
            leg.push(`\\( V \\): 電圧 (${vTerm} V)`);
        }
    } else {
        leg.push('\\( V \\): 基準電圧 [V]', '\\( \\alpha \\): 相係数 (単相=1, 三相=√3)');
    }

    let tex = `\\begin{aligned} I &= \\frac{P`;
    if (loadUnit === 'kW' || loadUnit === 'kVA') tex += ` \\times 1000`;
    tex += `}{V`;
    if (sys && sys.id.startsWith('3P')) tex += ` \\times \\sqrt{3}`;
    if (loadUnit === 'kW') tex += ` \\times \\cos \\theta`;
    tex += `}`;

    tex += ` \\\\ &= \\frac{${P}`;
    if (loadUnit === 'kW' || loadUnit === 'kVA') tex += ` \\times 1000`;
    tex += `}{${vTerm}`;
    if (loadUnit === 'kW') tex += ` \\times ${Cos}`;
    tex += `}`;

    if (loadUnit === 'kW') leg.unshift('\\( P \\): 負荷 [kW]', '\\( \\cos \\theta \\): 力率');
    else if (loadUnit === 'kVA') leg.unshift('\\( P \\): 負荷 [kVA]');
    else if (loadUnit === 'VA') leg.unshift('\\( P \\): 負荷 [VA]');

    if (I !== null) tex += ` \\\\ &= ${I.toFixed(1)} \\text{ A}`;
    tex += ` \\end{aligned}`;

    return { tex, leg };
}

/**
 * 許容電流（熱的制限）の計算式用TEX文字列を生成する
 * @param {Object} inputs - ユーザー入力データ
 * @param {Object} result - 計算結果データ
 * @param {Array} cables - ケーブルデータ
 * @returns {Object} { tex, leg } TEX文字列と凡例配列
 */
function _getThermalLimitFormula(inputs: Record<string, any>, result: Record<string, any> | null, cables: Record<string, any>[]) {
    const { I, derating, parallel } = inputs;

    const I_str = formatVal(I, 'I', 1); // 算出値
    const N_val = parallel !== null ? parallel : 1;
    const N_hl = hlVal(parallel, 'N', 0);
    const cdStr = derating !== null ? hlVal(derating, 'C_d', 2) : 'C_d';

    const leg = ['\\( I \\): 設計電流 [A]', "\\( I_0' \\): 補正後許容電流 [A]"];
    if (N_val > 1) leg.push('\\( N \\): 条数');

    const targetCable = _getTargetCable(inputs, result, cables);

    if (!targetCable || !targetCable.ampacity || targetCable.ampacity === '-') {
        return {
            tex: `\\text{許容電流データなし}`,
            leg: []
        };
    }

    let kValue = result && result.tempDerating ? result.tempDerating : 1.0;
    if (inputs.ambientTemp !== null) {
        kValue =
            (result && result.tempDerating) ||
            _getAmbientTempDerating(
                targetCable.baseTemp,
                targetCable.maxTemp,
                inputs.ambientTemp
            );
    }
    const tempAmp = (parseFloat(targetCable.ampacity) * kValue).toFixed(1);
    const unitStr = targetCable.unit || 'sq';

    let rightSide = `${tempAmp}`;
    if (derating !== null && derating < 1.0) {
        rightSide += ` \\times ${cdStr}`;
        leg.push(`C_d: 減少係数 (${derating})`);
    } else if (derating === null) {
        rightSide += ` \\times C_d`;
        leg.push(`C_d: 減少係数`);
    }

    if (N_val > 1) rightSide += ` \\times ${N_hl}`;

    if (derating !== null) {
        const effAmp =
            result && result.finalEffAmp !== undefined
                ? result.finalEffAmp.toFixed(1)
                : (parseFloat(tempAmp) * derating * N_val).toFixed(1);
        let rightSideSymbol = `I_0'`;
        if (derating !== null && derating < 1.0) rightSideSymbol += ` \\times C_d`;
        else if (derating === null) rightSideSymbol += ` \\times C_d`;
        if (N_val > 1) rightSideSymbol += ` \\times N`;

        const parallelStr = N_val > 1 ? ` \\times ${N_val}` : '';
        const tex = `\\begin{aligned} ${I_str} \\text{ A} &\\le ${rightSideSymbol} \\\\ &\\le ${rightSide} \\\\ &= ${effAmp} \\text{ A (}${targetCable.size}\\text{${unitStr}}${parallelStr}\\text{)} \\end{aligned}`;
        return { tex, leg };
    } else {
        const rightSideSymbol = `I_0'` + (N_val > 1 ? ` \\times N` : '');
        const parallelStr = N_val > 1 ? ` \\times ${N_val}` : '';
        const tex = `\\begin{aligned} ${I_str} \\text{ A} &\\le ${rightSideSymbol} \\\\ &\\le ${rightSide} \\text{ A (}${targetCable.size}\\text{${unitStr}}${parallelStr}\\text{)} \\end{aligned}`;
        return { tex, leg };
    }
}

/**
 * 電圧降下の計算式用TEX文字列を生成する
 * @param {Object} inputs - ユーザー入力データ
 * @param {Object} result - 計算結果データ
 * @returns {Object} { tex, leg } TEX文字列と凡例配列
 */
function _getVoltageDropFormula(inputs: Record<string, any>, result: Record<string, any> | null) {
    const { mode, sys, I, L, targetDrop, selectedSize, parallel } = inputs;
    const isAuto = mode === 'size';
    const I_str = formatVal(I, 'I', 1);
    const K_val = sys ? formatVal(sys.simpleK, 'K', 2) : 'K';
    const L_val = hlVal(L, 'L', 1);
    
    // e は %入力から計算した実数値。V計算の元になった入力なのでハイライト
    const TargetE = sys && targetDrop !== null ? hlVal(sys.voltage * (targetDrop / 100), 'e', 2) : 'e';
    
    const A_val = result && result.convertedA ? formatVal(result.convertedA, 'A', 2) : hlVal(selectedSize, 'A', 1);
    const N_val = parallel !== null ? parallel : 1;
    const N_hl = hlVal(parallel, 'N', 0);

    let tex;
    const leg = [
        `\\( K \\): 方式係数 (${K_val})`,
        '\\( L \\): 距離 [m]',
        '\\( I \\): 電流 [A]',
        '1000: 定数'
    ];

    if (isAuto) {
        leg.push(`\\( e \\): 許容電圧降下 (${TargetE} V)`);
        if (N_val > 1) leg.push('\\( A_{\\text{each}} \\): 1条あたりの算出断面積 [sq]');
        else leg.push('\\( A \\): 算出断面積 [sq]');
    } else {
        leg.push('\\( A \\): 断面積 [sq]', '\\( e \\): 電圧降下 [V]');
    }
    if (N_val > 1) leg.push('\\( N \\): 条数');

    const N_term = N_val > 1 ? ` \\times ${N_hl}` : '';
    const N_paren = N_val > 1 ? `(${A_val} \\times ${N_hl})` : `${A_val}`;
    const N_sub = N_val > 1 ? '_{\\text{each}}' : '';

    if (isAuto) {
        const leftSide = `A${N_sub}`;
        const rightSideSymbol = `\\frac{K \\cdot L \\cdot I}{1000 \\times e${N_val > 1 ? ` \\times N` : ''}}`;
        const rightSide = `\\frac{${K_val} \\cdot ${L_val} \\cdot ${I_str}}{1000 \\times ${TargetE}${N_term}}`;
        tex = `\\begin{aligned} ${leftSide} &= ${rightSideSymbol} \\\\ &= ${rightSide}`;

        if (result && result.optimal) {
            const calA_total = (sys.simpleK * L * I) / (1000 * (sys.voltage * (targetDrop / 100)));
            const calA_each = calA_total / N_val;
            tex += ` \\\\ &= ${(N_val > 1 ? calA_each : calA_total).toFixed(2)} \\text{ sq}`;
        }
        tex += ` \\end{aligned}`;
    } else {
        const rightSideSymbol = `\\frac{K \\cdot L \\cdot I}{1000 \\times A${N_val > 1 ? ` \\times N` : ''}}`;
        tex = `\\begin{aligned} e &= ${rightSideSymbol} \\\\ &= \\frac{${K_val} \\cdot ${L_val} \\cdot ${I_str}}{1000 \\times ${N_paren}}`;
        if (result && result.finalDropV !== undefined) {
            tex += ` \\\\ &= ${result.finalDropV.toFixed(2)} \\text{ V}`;
        }
        tex += ` \\end{aligned}`;
    }

    return { tex, leg };
}
