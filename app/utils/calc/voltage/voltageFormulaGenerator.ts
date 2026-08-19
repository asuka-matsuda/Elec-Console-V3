import type { CableData } from '~/types/database';
import { cableData as defaultCableData } from '~/utils/data/cableData';
import { hlVal, hlOk, hlNg, buildFormula } from '~/utils/mathUtils';
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

function _getUnitConversionFormula(inputs: VoltageCalcInputs): MathStep {
    const { sys, I, loadVal, loadUnit, pf } = inputs;
    const P_val = hlVal(loadVal, 'P', 1);
    const Cos_val = hlVal(pf, '\\cos \\theta', 2);

    if (loadUnit === 'A') {
        const resultVal = I !== null ? hlOk(I.toFixed(1)) : '\\text{---}';
        const tex = buildFormula('I', P_val, resultVal, 'A');
        return { tex, legend: ['\\( I \\): 設計電流 [A]'] };
    }

    const leg = [];
    let rightSideSymbol = `\\frac{P`;
    if (loadUnit === 'kW' || loadUnit === 'kVA') rightSideSymbol += ` \\times 1000`;
    rightSideSymbol += `}{V`;
    if (sys && sys.id.startsWith('3P')) rightSideSymbol += ` \\times \\sqrt{3}`;
    else if (!sys) rightSideSymbol += ` \\times \\alpha`;
    if (loadUnit === 'kW') rightSideSymbol += ` \\times \\cos \\theta`;
    rightSideSymbol += `}`;

    let v_val = hlVal(null, 'V');
    if (sys) {
        v_val = sys.id === '1P3W200' ? hlVal(200, 'V') : hlVal(sys.voltage, 'V');
    }
    let rightSideSubst = `\\frac{${P_val}`;
    if (loadUnit === 'kW' || loadUnit === 'kVA') rightSideSubst += ` \\times 1000`;
    rightSideSubst += `}{${v_val}`;
    if (sys && sys.id.startsWith('3P')) rightSideSubst += ` \\times \\sqrt{3}`;
    else if (!sys) rightSideSubst += ` \\times \\alpha`;
    if (loadUnit === 'kW') rightSideSubst += ` \\times ${Cos_val}`;
    rightSideSubst += `}`;

    const resultVal = I !== null ? hlOk(I.toFixed(1)) : '\\text{---}';
    const tex = buildFormula('I', rightSideSymbol + ` \\\\ &= ` + rightSideSubst, resultVal, 'A');

    if (loadUnit === 'kW') leg.push('\\( P \\): 負荷 [kW]', '\\( \\cos \\theta \\): 力率');
    else if (loadUnit === 'kVA') leg.push('\\( P \\): 負荷 [kVA]');
    else if (loadUnit === 'VA') leg.push('\\( P \\): 負荷 [VA]');

    leg.push('\\( V \\): 基準電圧 [V]', '\\( \\alpha \\): 相係数 (単相=1, 三相=\\sqrt{3})');

    return { tex, legend: leg };
}

function _getTempDeratingFormula(inputs: VoltageCalcInputs, result: VoltageCalcResult | null, cables: CableData[]): MathStep {
    const targetCable = _getTargetCable(inputs, result, cables);
    const amb = inputs.ambientTemp;

    const leg = [
        "\\( I_0' \\): 補正後許容電流 [A]",
        '\\( I_0 \\): 基準許容電流 [A]'
    ];

    const I_0_val = hlVal(targetCable?.ampacity, 'I_0');

    if (amb === null) {
        const resultVal = targetCable?.ampacity ? hlOk(parseFloat(String(targetCable.ampacity)).toString()) : '\\text{---}';
        const tex = buildFormula("I_0'", 'I_0 \\\\ &= ' + I_0_val, resultVal, 'A');
        return { tex, legend: leg };
    }

    leg.push(
        '\\( \\theta_{max} \\): 最高許容温度 [℃]',
        '\\( \\theta_{base} \\): 基底温度 [℃]',
        '\\( \\theta_{amb} \\): 周囲温度 [℃]'
    );

    const max_val = hlVal(targetCable?.maxTemp, '\\theta_{max}');
    const base_val = hlVal(targetCable?.baseTemp, '\\theta_{base}');
    const amb_val = hlVal(amb, '\\theta_{amb}');

    let resultVal = '\\text{---}';
    if (targetCable?.maxTemp && targetCable?.baseTemp && !isNaN(parseFloat(String(targetCable.maxTemp))) && !isNaN(parseFloat(String(targetCable.baseTemp)))) {
        const baseAmp = parseFloat(String(targetCable.ampacity));
        const max = parseFloat(String(targetCable.maxTemp));
        const base = parseFloat(String(targetCable.baseTemp));
        let k = result?.tempDerating ?? getAmbientTempDerating(base, max, amb);
        
        const tempAmp = baseAmp * k;
        resultVal = hlOk(tempAmp.toFixed(1));
    }

    const symbolFormula = `I_0 \\times \\sqrt{\\frac{\\theta_{max} - \\theta_{amb}}{\\theta_{max} - \\theta_{base}}}`;
    const substFormula = `${I_0_val} \\times \\sqrt{\\frac{${max_val} - ${amb_val}}{${max_val} - ${base_val}}}`;
    const tex = buildFormula("I_0'", symbolFormula + ` \\\\ &= ` + substFormula, resultVal, 'A');

    return { tex, legend: leg };
}

function _getThermalLimitFormula(inputs: VoltageCalcInputs, result: VoltageCalcResult | null, cables: CableData[]): MathStep {
    const { I, derating, parallel } = inputs;
    const N_val = parallel !== null ? parallel : 1;
    const N_hl = hlVal(parallel, 'N', 0);
    const cdStr = hlVal(derating, 'C_d', 2);
    const I_str_left = hlVal(I, 'I', 1);

    const leg = [
        '\\( I \\): 設計電流 [A]',
        "\\( I_0' \\): 補正後許容電流 [A]",
        '\\( C_d \\): 減少係数',
        '\\( N \\): 条数'
    ];

    let rightSideSymbol = `I_0' \\times C_d \\times N`;
    const targetCable = _getTargetCable(inputs, result, cables);
    let rightSideSubst;
    let resultLine = '\\text{---}';

    if (!targetCable) {
        rightSideSubst = `I_0' \\times ${cdStr} \\times ${N_hl}`;
    } else {
        let kValue = result?.tempDerating ?? 1.0;
        if (inputs.ambientTemp !== null) {
            kValue = result?.tempDerating || getAmbientTempDerating(targetCable.baseTemp || '', targetCable.maxTemp || '', inputs.ambientTemp);
        }
        const tempAmp = hlVal(parseFloat(String(targetCable.ampacity)) * kValue, "I_0'", 1);

        rightSideSubst = `${tempAmp} \\times ${cdStr} \\times ${N_hl}`;

        let effAmp;
        if (derating !== null) {
            effAmp = result?.finalEffAmp !== undefined
                ? result.finalEffAmp
                : parseFloat(String(targetCable.ampacity)) * kValue * derating * N_val;
        } else {
            effAmp = parseFloat(String(targetCable.ampacity)) * kValue * N_val;
        }
        
        resultLine = hlOk(effAmp.toFixed(1));
    }

    const tex = `\\begin{aligned} I &\\le ${rightSideSymbol} \\\\ ${I_str_left} &\\le ${rightSideSubst} \\\\ ${I_str_left} &\\le ${resultLine} \\text{ [A]} \\end{aligned}`;

    return { tex, legend: leg };
}

function _getVoltageDropFormula(inputs: VoltageCalcInputs, result: VoltageCalcResult | null): MathStep {
    const { mode, sys, I, L, targetDrop, selectedSize, parallel } = inputs;
    const isAuto = mode === 'size';
    const I_str = hlVal(I, 'I', 1);
    const K_val = hlVal(sys?.simpleK, 'K', 2);
    const L_val = hlVal(L, 'L', 1);
    
    const TargetE = hlVal(sys && targetDrop !== null ? sys.voltage * (targetDrop / 100) : null, 'e', 2);
    
    const A_val = hlVal(result?.convertedA ?? selectedSize, 'A', 2);
    const N_val = parallel !== null ? parallel : 1;
    const N_hl = hlVal(parallel, 'N', 0);

    let tex;
    const leg = [
        '\\( K \\): 方式係数',
        '\\( L \\): 距離 [m]',
        '\\( I \\): 電流 [A]',
        '1000: 定数',
        '\\( e \\): 電圧降下 [V]',
        '\\( A \\): 断面積 [sq]',
        '\\( N \\): 条数'
    ];

    if (isAuto) {
        const leftSide = `A_{\\text{each}}`;
        const rightSideSymbol = `\\frac{K \\cdot L \\cdot I}{1000 \\times e \\times N}`;
        const rightSide = `\\frac{${K_val} \\cdot ${L_val} \\cdot ${I_str}}{1000 \\times ${TargetE} \\times ${N_hl}}`;
        
        let resultLine = '\\text{---}';
        if (result?.optimal && sys && targetDrop !== null && I !== null && L !== null) {
            const calA_total = (sys.coefficient * L * I) / (1000 * (sys.voltage * (targetDrop / 100)));
            const calA_each = calA_total / N_val;
            resultLine = hlOk(calA_each.toFixed(2));
        }
        tex = buildFormula(leftSide, rightSideSymbol + ` \\\\ &= ` + rightSide, resultLine, 'sq');
    } else {
        const rightSideSymbol = `\\frac{K \\cdot L \\cdot I}{1000 \\times A \\times N}`;
        const rightSide = `\\frac{${K_val} \\cdot ${L_val} \\cdot ${I_str}}{1000 \\times ${A_val} \\times ${N_hl}}`;

        let resultLine = '\\text{---}';
        if (result?.finalDropV !== undefined) {
            resultLine = hlOk(result.finalDropV.toFixed(2));
        }
        tex = buildFormula('e', rightSideSymbol + ` \\\\ &= ` + rightSide, resultLine, 'V');
    }

    return { tex, legend: leg };
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
            { title: '① 単位換算（負荷電流）', tex: step1.tex, legend: step1.legend },
            { title: '② 使用ケーブルの電圧降下による最小サイズ', tex: step4.tex, legend: step4.legend },
            { title: '③ ②で算出されたケーブルの温度補正による許容電流', tex: step2.tex, legend: step2.legend },
            { title: '④ ③で算出された許容電流による最終サイズ', tex: step3.tex, legend: step3.legend }
        ];
    } else {
        return [
            { title: '① 単位換算（負荷電流）', tex: step1.tex, legend: step1.legend },
            { title: '② 選択ケーブルの温度補正による許容電流', tex: step2.tex, legend: step2.legend },
            { title: '③ 選択ケーブルの許容電流チェック', tex: step3.tex, legend: step3.legend },
            { title: '④ 選択ケーブルの電圧降下チェック', tex: step4.tex, legend: step4.legend }
        ];
    }
}
