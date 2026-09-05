import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

import type { EventType } from '../../app/composables/portal/useCalendar'
import { useCalendarTypeSettings } from '../../app/composables/portal/useCalendarTypeSettings'

describe('useCalendarTypeSettings', () => {
  const mockTypes: EventType[] = [
    { id: 't1', name: '現場作業', color: '#ff0000' },
    { id: 't2', name: '打合せ', color: '#00ff00' },
  ]

  it('should initialize and clone event types from props', () => {
    const eventTypes = ref<EventType[]>(mockTypes)
    const isOpen = ref(true)
    const onSave = vi.fn()

    const { types } = useCalendarTypeSettings({ eventTypes, isOpen, onSave })

    expect(types.value.length).toBe(2)
    expect(types.value[0].name).toBe('現場作業')
    // ディープコピーの確認
    expect(types.value).not.toBe(eventTypes.value)
  })

  it('should add a new event type with preset color', () => {
    const eventTypes = ref<EventType[]>(mockTypes)
    const isOpen = ref(true)
    const onSave = vi.fn()

    const { types, handleAddType } = useCalendarTypeSettings({
      eventTypes,
      isOpen,
      onSave,
    })

    handleAddType()
    expect(types.value.length).toBe(3)
    expect(types.value[2].name).toBe('')
    expect(types.value[2].color).toBeTruthy()
  })

  it('should remove an event type unless only 1 remains', () => {
    const eventTypes = ref<EventType[]>(mockTypes)
    const isOpen = ref(true)
    const onSave = vi.fn()

    const { types, handleRemoveType } = useCalendarTypeSettings({
      eventTypes,
      isOpen,
      onSave,
    })

    handleRemoveType(0)
    expect(types.value.length).toBe(1)
    expect(types.value[0].id).toBe('t2')

    // 残り1つの時は削除不可
    handleRemoveType(0)
    expect(types.value.length).toBe(1)
  })

  it('should trim names and fallback to default name on save', () => {
    const eventTypes = ref<EventType[]>([
      { id: 't1', name: '  作業  ', color: '#ff0000' },
      { id: 't2', name: '   ', color: '#00ff00' },
    ])
    const isOpen = ref(true)
    const onSave = vi.fn()

    const { handleSave } = useCalendarTypeSettings({
      eventTypes,
      isOpen,
      onSave,
    })

    handleSave()
    expect(onSave).toHaveBeenCalledWith([
      { id: 't1', name: '作業', color: '#ff0000' },
      { id: 't2', name: '種別 2', color: '#00ff00' },
    ])
    expect(isOpen.value).toBe(false)
  })
})
