/**
 * @fileoverview Voltage Calculation Engine (Facade)
 * 電圧降下 / ケーブルサイズ選定計算エンジン。
 * 実際のロジックは voltageCalcLogic と voltageFormulaGenerator に分離されています。
 */

export { calculateDesignCurrent, calculateLogic } from './calc/voltage/voltageCalcLogic';
export { generateMathData } from './calc/voltage/voltageFormulaGenerator';
