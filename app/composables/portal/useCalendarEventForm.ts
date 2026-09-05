import { type Ref, ref } from 'vue'

import type {
  CalendarEvent,
  CalendarSettings,
} from '~/composables/portal/useCalendar'
import { useModal } from '~/composables/useModal'
import type { EventFormData } from '~/types/portal'

export interface UseCalendarEventFormOptions {
  settings: Ref<CalendarSettings | null>
  createEvent: (data: Omit<CalendarEvent, 'id' | 'siteId'>) => Promise<unknown>
  updateEvent: (
    id: string,
    data: Partial<Omit<CalendarEvent, 'id' | 'siteId'>>,
  ) => Promise<unknown>
  deleteEvent: (id: string) => Promise<unknown>
}

/**
 * カレンダー予定の作成・編集・削除モーダル制御Composable
 */
export function useCalendarEventForm({
  settings,
  createEvent,
  updateEvent,
  deleteEvent,
}: UseCalendarEventFormOptions) {
  const isModalOpen = ref(false)
  const isEditing = ref(false)
  const editingEventId = ref<string | null>(null)

  const form = ref<EventFormData>({
    title: '',
    type: 'work',
    start: '',
    end: '',
    allDay: false,
  })

  const openCreateModal = (
    startStr: string,
    endStr: string,
    allDay: boolean,
  ) => {
    isEditing.value = false
    editingEventId.value = null

    const finalStart = startStr
    let finalEnd = endStr

    if (allDay && endStr) {
      const d = new Date(endStr)

      d.setDate(d.getDate() - 1)
      finalEnd = d.toISOString().split('T')[0] || ''
    }

    form.value = {
      title: '',
      type: settings.value?.eventTypes?.[0]?.id || 'work',
      start: finalStart,
      end: finalEnd || finalStart,
      allDay,
    }
    isModalOpen.value = true
  }

  const openEditModal = (calEvent: {
    id: string
    title: string
    startStr: string
    endStr: string
    allDay: boolean
    extendedProps: { type?: string }
  }) => {
    isEditing.value = true
    editingEventId.value = calEvent.id

    const finalStart = calEvent.startStr
    let finalEnd = calEvent.endStr

    if (calEvent.allDay && calEvent.endStr) {
      const d = new Date(calEvent.endStr)

      d.setDate(d.getDate() - 1)
      finalEnd = d.toISOString().split('T')[0] || ''
    }

    form.value = {
      title: calEvent.title,
      type: calEvent.extendedProps.type || 'work',
      start: finalStart,
      end: finalEnd || finalStart,
      allDay: calEvent.allDay,
    }
    isModalOpen.value = true
  }

  const closeModal = () => {
    isModalOpen.value = false
  }

  const saveEvent = async (savedData: EventFormData) => {
    let finalEnd: string | undefined = savedData.end

    if (savedData.allDay && savedData.start && savedData.end) {
      if (savedData.start === savedData.end) {
        finalEnd = undefined
      }
      else {
        const endDate = new Date(savedData.end)

        endDate.setDate(endDate.getDate() + 1)
        finalEnd = endDate.toISOString().split('T')[0]
      }
    }

    try {
      if (isEditing.value && editingEventId.value) {
        await updateEvent(editingEventId.value, {
          title: savedData.title,
          type: savedData.type,
          start: savedData.start,
          end: finalEnd,
          allDay: savedData.allDay,
        })
      }
      else {
        await createEvent({
          title: savedData.title,
          type: savedData.type,
          start: savedData.start,
          end: finalEnd,
          allDay: savedData.allDay,
        })
      }
    }
    finally {
      isModalOpen.value = false
    }
  }

  const { askConfirm } = useModal()

  const removeEvent = async () => {
    if (!editingEventId.value) return
    const targetId = editingEventId.value

    const isConfirmed = await askConfirm({
      title: '予定の削除',
      message: `「${form.value.title || 'この予定'}」を削除してもよろしいですか？`,
      confirmText: '削除する',
      intent: 'danger',
    })

    if (isConfirmed) {
      await deleteEvent(targetId)
      closeModal()
    }
  }

  return {
    isModalOpen,
    isEditing,
    editingEventId,
    form,
    openCreateModal,
    openEditModal,
    closeModal,
    saveEvent,
    removeEvent,
  }
}
