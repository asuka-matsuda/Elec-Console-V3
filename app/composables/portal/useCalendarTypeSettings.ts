import type { ComputedRef, Ref } from 'vue'
import { ref, watch } from 'vue'

import type { EventType } from '~/composables/portal/useCalendar'
import { DEFAULT_EVENT_TYPES } from '~/composables/portal/useCalendar'
import { DEFAULT_COLOR_PRESETS } from '~/constants/colors'

export interface UseCalendarTypeSettingsParams {
  eventTypes: Ref<EventType[]> | ComputedRef<EventType[]>
  isOpen: Ref<boolean>
  onSave: (types: EventType[]) => void
}

export function useCalendarTypeSettings(params: UseCalendarTypeSettingsParams) {
  const { eventTypes, isOpen, onSave } = params
  const types = ref<EventType[]>([])

  const syncTypesFromProps = () => {
    if (eventTypes.value && eventTypes.value.length > 0) {
      types.value = JSON.parse(JSON.stringify(eventTypes.value))
    }
    else {
      types.value = JSON.parse(JSON.stringify(DEFAULT_EVENT_TYPES))
    }
  }

  watch(
    eventTypes,
    () => {
      syncTypesFromProps()
    },
    { immediate: true, deep: true },
  )

  watch(isOpen, (open) => {
    if (open) {
      syncTypesFromProps()
    }
  })

  const handleAddType = () => {
    const newId = `type_${Date.now()}`
    const defaultPreset
      = DEFAULT_COLOR_PRESETS[types.value.length % DEFAULT_COLOR_PRESETS.length]

    types.value.push({
      id: newId,
      name: '',
      color: defaultPreset ? defaultPreset.value : '#00f0ff',
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
