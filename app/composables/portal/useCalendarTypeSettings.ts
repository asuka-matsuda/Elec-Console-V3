/**
 * カレンダーイベント種別設定 Composable
 *
 * @description カレンダーのイベント分類（工程・点検・送電等）の表示色やラベルカスタマイズ設定を管理します。
 * @param siteId 対象現場IDのRef
 */

import type { ComputedRef, Ref } from 'vue'
import { ref, watch } from 'vue'

import {
  DEFAULT_CALENDAR_EVENT_TYPES,
  type EventType,
} from '#shared/types/calendar'
import { DEFAULT_COLOR, DEFAULT_COLOR_PRESETS } from '~/constants/colors'

interface UseCalendarTypeSettingsParams {
  eventTypes: Ref<EventType[]> | ComputedRef<EventType[]>
  isOpen: Ref<boolean>
  onSave: (types: EventType[]) => void
}

export function useCalendarTypeSettings(params: UseCalendarTypeSettingsParams) {
  const { eventTypes, isOpen, onSave } = params
  const types = ref<EventType[]>([])

  const syncTypes = () => {
    const source = eventTypes.value.length > 0 ? eventTypes.value : DEFAULT_CALENDAR_EVENT_TYPES

    types.value = source.map(t => ({ ...t }))
  }

  // モーダルオープン時のみ同期（編集中に親の更新で入力値が巻き戻る事故を防止）
  watch(
    isOpen,
    (open) => {
      if (open) {
        syncTypes()
      }
    },
    { immediate: true },
  )

  const handleAddType = () => {
    const newId = `type_${Date.now()}`
    const defaultPreset
      = DEFAULT_COLOR_PRESETS[types.value.length % DEFAULT_COLOR_PRESETS.length]

    types.value.push({
      id: newId,
      name: '',
      color: defaultPreset?.value ?? DEFAULT_COLOR,
    })
  }

  const handleRemoveType = (index: number) => {
    if (types.value.length <= 1) return
    types.value.splice(index, 1)
  }

  const handleSave = () => {
    const cleaned = types.value.map((t, idx) => ({
      ...t,
      name: t.name.trim() || `種別 ${idx + 1}`,
    }))

    onSave(cleaned)
    isOpen.value = false
  }

  return {
    types,
    handleAddType,
    handleRemoveType,
    handleSave,
  }
}
