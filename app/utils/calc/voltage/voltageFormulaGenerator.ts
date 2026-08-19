import type { CableData, ConduitData, DrumData } from '~/types/database';
import { cableData as defaultCableData } from '~/utils/data/cableData';
import { hlVal, formatVal } from '~/utils/mathUtils';
import type { VoltageCalcInputs, VoltageCalcResult, MathStep } from './types';
import { getAmbientTempDerating } from './voltageCalcLogic';

function _getTargetCable(inputs: VoltageCalcInputs, result: VoltageCalcResult | null, cables: CableData[]): CableData | null {
    if (result && result.optimal) return result.optimal;

    if (inputs && inputs.cableType && inputs.selectedSize !== null) {
        let candidates = cables.filter(
            (c) => c.category === inputs.cableType && parseFloat(String(c.size)) === inputs.selectedSize
        );
        if (inputs.selectedCores) {
            candidates = candidates.filter((c) => c.cores === inputs.selectedCores || !c.cores || c.cores === '-');
        }
        return candidates[0] || null;
    }
    return null;
}

function _getUnitConversionFormula(inputs: VoltageCalcInputs) {
    const { sys, I, loadVal, loadUnit, pf } = inputs;
    const P_val = loadVal ? hlVal(loadVal, 'P', 1) : 'P';
    const Cos_val = pf ? hlVal(pf, '\\cos \\theta', 2) : '\\cos \\theta';

    if (loadUnit === 'A') {
        const tex = (!loadVal) ? `I = 0 \\text{ A}` : `I = \\htmlClass{tex-status-success}{${P_val}} \\text{ A}`;
        return { tex, leg: ['\\( I \\): 設計電流 [A]'] };
    }

    const leg = [];
    let rightSideSymbol = `\\frac{P`;
    if (loadUnit === 'kW' || loadUnit === 'kVA') rightSideSymbol += ` \\times 1000`;
    rightSideSymbol += `}{V`;
    if (sys && sys.id.startsWith('3P')) rightSideSymbol += ` \\times \\sqrt{3}`;
    else if (!sys) rightSideSymbol += ` \\times \\alpha`;
    if (loadUnit === 'kW') rightSideSymbol += ` \\times \\cos \\theta`;
    rightSideSymbol += `}`;

    let v_val = 'V';
    if (sys) {
        v_val = sys.id === '1P3W200' ? '200' : `${sys.voltage}`;
    }
    let rightSideSubst = `\\frac{${P_val}`;
    if (loadUnit === 'kW' || loadUnit === 'kVA') rightSideSubst += ` \\times 1000`;
    rightSideSubst += `}{${v_val}`;
    if (sys && sys.id.startsWith('3P')) rightSideSubst += ` \\times \\sqrt{3}`;
    else if (!sys) rightSideSubst += ` \\times \\alpha`;
    if (loadUnit === 'kW') rightSideSubst += ` \\times ${Cos_val}`;
    rightSideSubst += `}`;

    const resultVal = I !== null ? `\\htmlClass{tex-status-success}{${I.toFixed(1)}} \\text{ A}` : `0 \\text{ A}`;
    const tex = `\\begin{aligned} I &= ${rightSideSymbol} \\\\ &= ${rightSideSubst} \\\\ &= ${resultVal} \\end{aligned}`;

    if (loadUnit === 'kW') leg.push('\\( P \\): 負荷 [kW]', '\\( \\cos \\theta \\): 力率');
    else if (loadUnit === 'kVA') leg.push('\\( P \\): 負荷 [kVA]');
    else if (loadUnit === 'VA') leg.push('\\( P \\): 負荷 [VA]');

    leg.push('\\( V \\): 基準電圧 [V]', '\\( \\alpha \\): 相係数 (単相=1, 三相=\\sqrt{3})');

    return { tex, leg };
}

function _getTempDeratingFormula(inputs: VoltageCalcInputs, result: VoltageCalcResult | null, cables: CableData[]) {
    const targetCable = _getTargetCable(inputs, result, cables);
    const amb = inputs.ambientTemp;

    const leg = [
        "\\( I_0' \\): 補正後許容電流 [A]",
        '\\( I_0 \\): 基準許容電流 [A]'
    ];

    const I_0_val = targetCable && targetCable.ampacity ? parseFloat(String(targetCable.ampacity)).toString() : 'I_0';

    if (amb === null) {
        const resultVal = targetCable && targetCable.ampacity ? `\\htmlClass{tex-status-success}{${I_0_val}} \\text{ A}` : `0 \\text{ A}`;
        const tex = `\\begin{aligned} I_0' &= I_0 \\\\ &= ${I_0_val} \\text{ A (温度補正なし)} \\\\ &= ${resultVal} \\end{aligned}`;
        return { tex, leg };
    }

    leg.push(
        '\\( \\theta_{max} \\): 最高許容温度 [℃]',
        '\\( \\theta_{base} \\): 基底温度 [℃]',
        '\\( \\theta_{amb} \\): 周囲温度 [℃]'
    );

    const max_val = targetCable && targetCable.maxTemp ? parseFloat(String(targetCable.maxTemp)).toString() : '\\theta_{max}';
    const base_val = targetCable && targetCable.baseTemp ? parseFloat(String(targetCable.baseTemp)).toString() : '\\theta_{base}';
    const amb_val = amb.toString();

    let resultVal = '0 \\text{ A}';
    if (targetCable && targetCable.maxTemp && targetCable.baseTemp && !isNaN(parseFloat(String(targetCable.maxTemp))) && !isNaN(parseFloat(String(targetCable.baseTemp)))) {
        const baseAmp = parseFloat(String(targetCable.ampacity));
        const max = parseFloat(String(targetCable.maxTemp));
        const base = parseFloat(String(targetCable.baseTemp));
        let k;
        if (result && result.tempDerating) k = result.tempDerating;
        else k = getAmbientTempDerating(base, max, amb);
        
        const tempAmp = baseAmp * k;
        resultVal = `\\htmlClass{tex-status-success}{${tempAmp.toFixed(1)}} \\text{ A}`;
    }

    const tex = `\\begin{aligned} I_0' &= I_0 \\times \\sqrt{\\frac{\\theta_{max} - \\theta_{amb}}{\\theta_{max} - \\theta_{base}}} \\\\ &= ${I_0_val} \\times \\sqrt{\\frac{${max_val} - ${amb_val}}{${max_val} - ${base_val}}} \\\\ &= ${resultVal} \\end{aligned}`;

    return { tex, leg };
}

function _getThermalLimitFormula(inputs: VoltageCalcInputs, result: VoltageCalcResult | null, cables: CableData[]) {
    const { I, derating, parallel } = inputs;
    const N_val = parallel !== null ? parallel : 1;
    const N_hl = hlVal(parallel, 'N', 0);
    const cdStr = derating !== null ? hlVal(derating, 'C_d', 2) : 'C_d';

    const leg = [
        '\\( I \\): 設計電流 [A]',
        "\\( I_0' \\): 補正後許容電流 [A]",
        '\\( C_d \\): 減少係数',
        '\\( N \\): 条数'
    ];

    let rightSideSymbol = `I_0'`;
    if (derating !== null && derating < 1.0) rightSideSymbol += ` \\times C_d`;
    else if (derating === null) rightSideSymbol += ` \\times C_d`;
    rightSideSymbol += ` \\times N`;

    const targetCable = _getTargetCable(inputs, result, cables);
    let rightSideSubst;
    let resultLine = '0 \\text{ A}';

    if (!targetCable) {
        rightSideSubst = `I_0'`;
        if (derating !== null && derating < 1.0) rightSideSubst += ` \\times ${cdStr}`;
        else if (derating === null) rightSideSubst += ` \\times C_d`;
        rightSideSubst += ` \\times ${N_hl}`;
    } else {
        let kValue = result && result.tempDerating ? result.tempDerating : 1.0;
        if (inputs.ambientTemp !== null) {
            kValue = result?.tempDerating || getAmbientTempDerating(targetCable.baseTemp || '', targetCable.maxTemp || '', inputs.ambientTemp);
        }
        const tempAmp = (parseFloat(String(targetCable.ampacity)) * kValue).toFixed(1);

        rightSideSubst = `${tempAmp}`;
        if (derating !== null && derating < 1.0) {
            rightSideSubst += ` \\times ${cdStr}`;
        } else if (derating === null) {
            rightSideSubst += ` \\times C_d`;
        }
        rightSideSubst += ` \\times ${N_hl}`;

        let effAmp;
        if (derating !== null) {
            effAmp = result && result.finalEffAmp !== undefined
                ? result.finalEffAmp.toFixed(1)
                : (parseFloat(tempAmp) * derating * N_val).toFixed(1);
        } else {
            effAmp = (parseFloat(tempAmp) * N_val).toFixed(1);
        }
        
        resultLine = `\\htmlClass{tex-status-success}{${effAmp}} \\text{ A}`;
    }

    const I_str_left = hlVal(I, '0', 1);
    const tex = `\\begin{aligned} I \\text{ A} &\\le ${rightSideSymbol} \\\\ ${I_str_left} \\text{ A} &\\le ${rightSideSubst} \\\\ ${I_str_left} \\text{ A} &\\le ${resultLine} \\end{aligned}`;

    return { tex, leg };
}

function _getVoltageDropFormula(inputs: VoltageCalcInputs, result: VoltageCalcResult | null) {
    const { mode, sys, I, L, targetDrop, selectedSize, parallel } = inputs;
    const isAuto = mode === 'size';
    const I_str = hlVal(I, 'I', 1);
    const K_val = sys ? formatVal(sys.simpleK, 'K', 2) : 'K';
    const L_val = hlVal(L, 'L', 1);
    
    const TargetE = sys && targetDrop !== null ? hlVal(sys.voltage * (targetDrop / 100), 'e', 2) : 'e';
    
    const A_val = result && result.convertedA ? formatVal(result.convertedA, 'A', 2) : hlVal(selectedSize, 'A', 1);
    const N_val = parallel !== null ? parallel : 1;
    const N_hl = hlVal(parallel, 'N', 0);

    let tex;
    const leg = [
        '\\( K \\): 方式係数',
        '\\( L \\): 距離 [m]',
        '\\( I \\): 電流 [A]',
        '1000: 定数'
    ];

    if (isAuto) {
        leg.push('\\( e \\): 許容電圧降下 [V]');
        leg.push('\\( A \\): 算出断面積 [sq]');
    } else {
        leg.push('\\( A \\): 断面積 [sq]', '\\( e \\): 電圧降下 [V]');
    }
    leg.push('\\( N \\): 条数');

    const N_term = N_val > 1 ? ` \\times ${N_hl}` : '';
    const N_paren = N_val > 1 ? `(${A_val} \\times ${N_hl})` : `${A_val}`;
    const N_sub = N_val > 1 ? '_{\\text{each}}' : '';

    if (isAuto) {
        const leftSide = `A${N_sub}`;
        const rightSideSymbol = `\\frac{K \\cdot L \\cdot I}{1000 \\times e${N_val > 1 ? ` \\times N` : ''}}`;
        const rightSide = `\\frac{${K_val} \\cdot ${L_val} \\cdot ${I_str}}{1000 \\times ${TargetE}${N_term}}`;
        
        let resultLine = '0 \\text{ sq}';
        if (result && result.optimal && sys && targetDrop !== null && I !== null && L !== null) {
            const calA_total = (sys.coefficient * L * I) / (1000 * (sys.voltage * (targetDrop / 100)));
            const calA_each = calA_total / N_val;
            const aVal = (N_val > 1 ? calA_each : calA_total).toFixed(2);
            resultLine = `\\htmlClass{tex-status-success}{${aVal}} \\text{ sq}`;
        }
        tex = `\\begin{aligned} ${leftSide} &= ${rightSideSymbol} \\\\ &= ${rightSide} \\\\ &= ${resultLine} \\end{aligned}`;
    } else {
        const rightSideSymbol = `\\frac{K \\cdot L \\cdot I}{1000 \\times A${N_val > 1 ? ` \\times N` : ''}}`;
        const rightSide = `\\frac{${K_val} \\cdot ${L_val} \\cdot ${I_str}}{1000 \\times ${N_paren}}`;

        let resultLine = '0 \\text{ V}';
        if (result && result.finalDropV !== undefined) {
            resultLine = `\\htmlClass{tex-status-success}{${result.finalDropV.toFixed(2)}} \\text{ V}`;
        }
        tex = `\\begin{aligned} e &= ${rightSideSymbol} \\\\ &= ${rightSide} \\\\ &= ${resultLine} \\end{aligned}`;
    }

    return { tex, leg };
}

export function generateMathData(inputs: VoltageCalcInputs, result: VoltageCalcResult | null, cableDataList: CableData[] | null = null): MathStep[] | null {
    if (!inputs) return null;
    const cables = cableDataList || defaultCableData;

    const step1 = _getUnitConversionFormula(inputs);
    const step2 = _getTempDeratingFormula(inputs, result, cables);
    const step3 = _getThermalLimitFormula(inputs, result, cables);
    const step4 = _getVoltageDropFormula(inputs, result);

    if (inputs.mode === 'size') {
        return [
            { title: '① 単位換算（負荷電流）', tex: step1.tex, legend: step1.leg },
            { title: '② 使用ケーブルの電圧降下による最小サイズ', tex: step4.tex, legend: step4.leg },
            { title: '③ ②で算出されたケーブルの温度補正による許容電流', tex: step2.tex, legend: step2.leg },
            { title: '④ ③で算出された許容電流による最終サイズ', tex: step3.tex, legend: step3.leg }
        ];
    } else {
        return [
            { title: '① 単位換算（負荷電流）', tex: step1.tex, legend: step1.leg },
            { title: '② 選択ケーブルの温度補正による許容電流', tex: step2.tex, legend: step2.leg },
            { title: '③ 選択ケーブルの許容電流チェック', tex: step3.tex, legend: step3.leg },
            { title: '④ 選択ケーブルの電圧降下チェック', tex: step4.tex, legend: step4.leg }
        ];
    }
}
