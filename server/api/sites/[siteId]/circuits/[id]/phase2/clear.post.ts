/**
 * フェーズ2測定値解除 API
 * POST /api/sites/:siteId/circuits/:id/phase2/clear
 *
 * @description 指定回路のフェーズ2確定結果を安全にリセット・解除します。
 * @permission 現場アクセス権限
 */

import { defineEventHandler } from 'h3'

import { clearCircuitPhase } from '../../../../../../utils/examLogic'

export default defineEventHandler(event => clearCircuitPhase(event, 2))
