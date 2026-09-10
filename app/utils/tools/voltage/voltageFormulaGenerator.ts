import { cableData as defaultCableData } from '~/constants/data/cableData'
import type { CableData } from '~/types/database'
import type {
  MathStep,
  VoltageCalcInputs,
  VoltageCalcResult,
} from '~/types/voltage'
import { buildFormula, formatVal, hlAccent, hlNg, hlOk } from '~/utils/math'

import { getAmbientTempDerating } from './voltageCalcLogic'

function _getTargetCable(
  inputs: VoltageCalcInputs,
  result: VoltageCalcResult | null,
  cables: CableData[],
): CableData | null {
  if (result && result.optimal) return result.optimal

  if (inputs && inputs.cableType && inputs.selectedSize !== null) {
    let candidates = cables.filter(
      c =>
        c.category === inputs.cableType
        && parseFloat(String(c.size)) === inputs.selectedSize,
    )

    if (inputs.selectedCores) {
      candidates = candidates.filter(
        c => c.cores === inputs.selectedCores || !c.cores || c.cores === '-',
      )
    }

    return candidates[0] || null
  }

  return null
}

function _getUnitConversionFormula(inputs: VoltageCalcInputs): MathStep {
  const { sys, I, loadVal, loadUnit, pf } = inputs
  const P_val = formatVal(loadVal, 'P', 1)
  const Cos_val = formatVal(pf, '\\cos \\theta', 2)

  if (loadUnit === 'A') {
    const resultVal = I !== null ? I.toFixed(1) : '\\text{---}'
    const tex = buildFormula('I', P_val, resultVal, 'A')

    return { tex, legend: ['\\( I \\): 設計電流 [A]'] }
  }

  const leg = []
  let rightSideSymbol = `\\frac{P`

  if (loadUnit === 'kW' || loadUnit === 'kVA')
    rightSideSymbol += ` \\times 1000`
  rightSideSymbol += `}{V`
  if (sys && sys.id.startsWith('3P')) rightSideSymbol += ` \\times \\sqrt{3}`
  else if (!sys) rightSideSymbol += ` \\times \\alpha`
  if (loadUnit === 'kW') rightSideSymbol += ` \\times \\cos \\theta`
  rightSideSymbol += `}`

  let v_val = formatVal(null, 'V')

  if (sys) {
    v_val = sys.id === '1P3W200' ? formatVal(200, 'V') : formatVal(sys.voltage, 'V')
  }
  let rightSideSubst = `\\frac{${P_val}`

  if (loadUnit === 'kW' || loadUnit === 'kVA')
    rightSideSubst += ` \\times 1000`
  rightSideSubst += `}{${v_val}`
  if (sys && sys.id.startsWith('3P')) rightSideSubst += ` \\times \\sqrt{3}`
  else if (!sys) rightSideSubst += ` \\times \\alpha`
  if (loadUnit === 'kW') rightSideSubst += ` \\times ${Cos_val}`
  rightSideSubst += `}`

  const resultVal = I !== null ? I.toFixed(1) : '\\text{---}'
  const tex = buildFormula(
    'I',
    rightSideSymbol + ` \\\\ &= ` + rightSideSubst,
    resultVal,
    'A',
  )

  if (loadUnit === 'kW')
    leg.push('\\( P \\): 負荷 [kW]', '\\( \\cos \\theta \\): 力率')
  else if (loadUnit === 'kVA') leg.push('\\( P \\): 負荷 [kVA]')
  else if (loadUnit === 'VA') leg.push('\\( P \\): 負荷 [VA]')

  leg.push(
    '\\( V \\): 基準電圧 [V]',
    '\\( \\alpha \\): 相係数 (単相=1, 三相=\\sqrt{3})',
  )

  return { tex, legend: leg }
}

function _getTempDeratingFormula(
  inputs: VoltageCalcInputs,
  result: VoltageCalcResult | null,
  cables: CableData[],
): MathStep {
  const targetCable = _getTargetCable(inputs, result, cables)
  const amb = inputs.ambientTemp

  const leg = [
    '\\( I_0\' \\): 補正後許容電流 [A]',
    '\\( I_0 \\): 基準許容電流 [A]',
  ]

  const I_0_val = formatVal(targetCable?.ampacity, 'I_0')

  if (amb === null) {
    const resultVal = targetCable?.ampacity
      ? parseFloat(String(targetCable.ampacity)).toString()
      : '\\text{---}'
    const tex = buildFormula('I_0\'', 'I_0 \\\\ &= ' + I_0_val, resultVal, 'A')

    return { tex, legend: leg }
  }

  leg.push(
    '\\( \\theta_{max} \\): 最高許容温度 [℃]',
    '\\( \\theta_{base} \\): 基底温度 [℃]',
    '\\( \\theta_{amb} \\): 周囲温度 [℃]',
  )

  const max_val = formatVal(targetCable?.maxTemp, '\\theta_{max}')
  const base_val = formatVal(targetCable?.baseTemp, '\\theta_{base}')
  const amb_val = formatVal(amb, '\\theta_{amb}')

  let resultVal = '\\text{---}'

  if (
    targetCable?.maxTemp
    && targetCable?.baseTemp
    && !isNaN(parseFloat(String(targetCable.maxTemp)))
    && !isNaN(parseFloat(String(targetCable.baseTemp)))
  ) {
    const baseAmp = parseFloat(String(targetCable.ampacity))
    const max = parseFloat(String(targetCable.maxTemp))
    const base = parseFloat(String(targetCable.baseTemp))
    const k = result?.tempDerating ?? getAmbientTempDerating(base, max, amb)

    const tempAmp = baseAmp * k

    resultVal = tempAmp.toFixed(1)
  }

  const symbolFormula = `I_0 \\times \\sqrt{\\frac{\\theta_{max} - \\theta_{amb}}{\\theta_{max} - \\theta_{base}}}`
  const substFormula = `${I_0_val} \\times \\sqrt{\\frac{${max_val} - ${amb_val}}{${max_val} - ${base_val}}}`
  const tex = buildFormula(
    'I_0\'',
    symbolFormula + ` \\\\ &= ` + substFormula,
    resultVal,
    'A',
  )

  return { tex, legend: leg }
}

function _getThermalLimitFormula(
  inputs: VoltageCalcInputs,
  result: VoltageCalcResult | null,
  cables: CableData[],
): MathStep {
  const { I, derating, parallel } = inputs
  const N_val = parallel !== null ? parallel : 1
  const N_str = formatVal(parallel, 'N', 0)
  const cdStr = formatVal(derating, 'C_d', 2)
  const I_str_left = formatVal(I, 'I', 1)

  const leg = [
    '\\( I \\): 設計電流 [A]',
    '\\( I_0\' \\): 補正後許容電流 [A]',
    '\\( C_d \\): 低減係数',
    '\\( N \\): 条数',
  ]

  const rightSideSymbol = `I_0' \\times C_d \\times N`
  const targetCable = _getTargetCable(inputs, result, cables)
  let rightSideSubst
  let resultLine = '\\text{---}'

  if (!targetCable) {
    rightSideSubst = `I_0' \\times ${cdStr} \\times ${N_str}`
  }
  else {
    let kValue = result?.tempDerating ?? 1.0

    if (inputs.ambientTemp !== null) {
      kValue
        = result?.tempDerating
          || getAmbientTempDerating(
            targetCable.baseTemp || '',
            targetCable.maxTemp || '',
            inputs.ambientTemp,
          )
    }
    const tempAmp = formatVal(
      parseFloat(String(targetCable.ampacity)) * kValue,
      'I_0\'',
      1,
    )

    rightSideSubst = `${tempAmp} \\times ${cdStr} \\times ${N_str}`

    let effAmp

    if (derating !== null) {
      effAmp
        = result?.finalEffAmp !== undefined
          ? result.finalEffAmp
          : parseFloat(String(targetCable.ampacity))
            * kValue
            * derating
            * N_val
    }
    else {
      effAmp = parseFloat(String(targetCable.ampacity)) * kValue * N_val
    }

    resultLine = effAmp.toFixed(1)
  }

  let finalSelectionLine = ''

  if (inputs.mode === 'size' && result?.optimal) {
    const isUp = result.minAmpacityCable && result.optimal.size !== result.minAmpacityCable.size
    const badge = hlAccent(`\\text{【 ${result.optimal.size} sq 】}`)
    const reasonStr = isUp
      ? `\\\\ &\\quad \\text{※ 許容電流不足のため } ${result.minAmpacityCable?.size} \\text{ sq} \\rightarrow ${badge} \\text{ へサイズアップ}`
      : `\\\\ &\\quad \\text{※ 仮選定サイズにて許容電流条件も適合}`

    finalSelectionLine = `\\\\[6pt] &\\textbf{【 最終推奨ケーブルサイズ 】} \\\\ &\\quad \\text{選定サイズ:} \\quad ${badge} ${reasonStr}`
  }

  const isPass = I !== null && !isNaN(parseFloat(resultLine)) && I <= parseFloat(resultLine)
  const passStr = isPass
    ? `\\quad ${hlOk('\\text{(適合)}')}`
    : (I !== null && !isNaN(parseFloat(resultLine)) ? `\\quad ${hlNg('\\text{(超過)}')}` : '')

  const tex = `\\begin{aligned} I &\\le ${rightSideSymbol} \\\\ ${I_str_left} &\\le ${rightSideSubst} \\\\ ${I_str_left} \\text{ A} &\\le ${resultLine} \\text{ A} ${passStr} ${finalSelectionLine} \\end{aligned}`

  return { tex, legend: leg }
}

function _getVoltageDropFormula(
  inputs: VoltageCalcInputs,
  result: VoltageCalcResult | null,
): MathStep {
  const { mode, sys, I, L, targetDrop, selectedSize, parallel } = inputs
  const isAuto = mode === 'size'
  const I_str = formatVal(I, 'I', 1)
  const K_val = formatVal(sys?.simpleK, 'K', 2)
  const L_val = formatVal(L, 'L', 1)

  const TargetE = formatVal(
    sys && targetDrop !== null ? sys.voltage * (targetDrop / 100) : null,
    'e',
    2,
  )

  const A_val = formatVal(result?.convertedA ?? selectedSize, 'A', 2)
  const N_val = parallel !== null ? parallel : 1
  const N_str = formatVal(parallel, 'N', 0)

  let tex: string
  const leg = [
    '\\( K \\): 方式係数',
    '\\( L \\): 距離 [m]',
    '\\( I \\): 電流 [A]',
    '1000: 定数',
    '\\( e \\): 電圧降下 [V]',
    '\\( A \\): 断面積 [sq]',
    '\\( N \\): 条数',
  ]

  if (isAuto) {
    const leftSide = `A_{\\text{calc}}`
    const rightSideSymbol = `\\frac{K \\cdot L \\cdot I}{1000 \\times e \\times N}`
    const rightSide = `\\frac{${K_val} \\cdot ${L_val} \\cdot ${I_str}}{1000 \\times ${TargetE} \\times ${N_str}}`

    let resultLine = '\\text{---}'
    let provLine = ''

    if (
      result?.optimal
      && sys
      && targetDrop !== null
      && I !== null
      && L !== null
    ) {
      const calA_total
        = (sys.simpleK * L * I) / (1000 * (sys.voltage * (targetDrop / 100)))
      const calA_each = calA_total / N_val

      resultLine = calA_each.toFixed(2)
      const provSize = result.minAmpacityCable ? result.minAmpacityCable.size : result.optimal.size
      const badge = hlAccent(`\\text{【 ${provSize} sq 】}`)
      const passMark = hlOk('\\text{(適合)}')

      provLine = `\\\\[6pt] &\\textbf{【 電圧降下による仮選定 】} \\\\ &\\quad \\text{仮選定公称サイズ:} \\quad ${badge} \\\\ &\\quad \\text{判定条件:} \\quad ${resultLine} \\text{ sq} \\le ${provSize} \\text{ sq} \\quad ${passMark}`
    }

    tex = `\\begin{aligned} ${leftSide} &= ${rightSideSymbol} \\\\ &= ${rightSide} \\\\ &= ${resultLine} \\text{ [sq]} ${provLine} \\end{aligned}`
  }
  else {
    const rightSideSymbol = `\\frac{K \\cdot L \\cdot I}{1000 \\times A \\times N}`
    const rightSide = `\\frac{${K_val} \\cdot ${L_val} \\cdot ${I_str}}{1000 \\times ${A_val} \\times ${N_str}}`

    let resultLine = '\\text{---}'
    let dropRateLine = ''

    if (result?.finalDropV !== undefined && sys) {
      resultLine = result.finalDropV.toFixed(2)
      const dropRate = (result.finalDropV / sys.voltage) * 100
      const targetRate = targetDrop ?? 2.0
      const isPass = dropRate <= targetRate
      const passStr = isPass ? hlOk('\\text{(適合)}') : hlNg('\\text{(超過)}')

      dropRateLine = `\\\\[6pt] &\\textbf{【 電圧降下率の判定 】} \\\\ &\\quad \\text{計算降下率:} \\quad \\Delta V\\% = \\frac{e}{V} \\times 100 = \\frac{${resultLine}}{${sys.voltage}} \\times 100 = ${dropRate.toFixed(2)}\\% \\\\ &\\quad \\text{目標判定:} \\quad \\Delta V\\% \\le ${targetRate.toFixed(1)}\\% \\quad (${dropRate.toFixed(2)}\\% \\le ${targetRate.toFixed(1)}\\% \\quad ${passStr})`
    }

    tex = `\\begin{aligned} e &= ${rightSideSymbol} \\\\ &= ${rightSide} \\\\ &= ${resultLine} \\text{ [V]} ${dropRateLine} \\end{aligned}`
  }

  return { tex, legend: leg }
}

export function generateMathData(
  inputs: VoltageCalcInputs,
  result: VoltageCalcResult | null,
  cableDataList: CableData[] | null = null,
): MathStep[] | null {
  if (!inputs) return null
  const cables = cableDataList || defaultCableData

  const step1 = _getUnitConversionFormula(inputs)
  const step2 = _getTempDeratingFormula(inputs, result, cables)
  const step3 = _getThermalLimitFormula(inputs, result, cables)
  const step4 = _getVoltageDropFormula(inputs, result)

  if (inputs.mode === 'size') {
    return [
      { title: '① 単位換算（負荷電流）', tex: step1.tex, legend: step1.legend },
      {
        title: '② 使用ケーブルの電圧降下による最小サイズ',
        tex: step4.tex,
        legend: step4.legend,
      },
      {
        title: '③ ②で算出されたケーブルの温度補正による許容電流',
        tex: step2.tex,
        legend: step2.legend,
      },
      {
        title: '④ ③で算出された許容電流による最終サイズ',
        tex: step3.tex,
        legend: step3.legend,
      },
    ]
  }
  else {
    return [
      { title: '① 単位換算（負荷電流）', tex: step1.tex, legend: step1.legend },
      {
        title: '② 選択ケーブルの温度補正による許容電流',
        tex: step2.tex,
        legend: step2.legend,
      },
      {
        title: '③ 選択ケーブルの許容電流チェック',
        tex: step3.tex,
        legend: step3.legend,
      },
      {
        title: '④ 選択ケーブルの電圧降下チェック',
        tex: step4.tex,
        legend: step4.legend,
      },
    ]
  }
}
