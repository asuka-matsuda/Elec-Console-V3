/**
 * カレンダー予定作成・編集モーダル Composable
 *
 * @description 現場カレンダーにおける予定の登録・変更・削除フォーム状態を管理します。
 */

import { type Ref, ref } from 'vue'

import type {
  CalendarEvent,
  CalendarSettings,
  EventFormData,
} from '#shared/types/calendar'
import { useModal } from '~/composables/useModal'
import { useToast } from '~/composables/useToast'
import { formatToDateInputString } from '~/utils/date'
import { parseToAppException } from '~/utils/errors'

interface UseCalendarEventFormOptions {
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
  const toast = useToast()
  const isModalOpen = ref(false)
  const isEditing = ref(false)
  const editingEventId = ref<string | null>(null)

  const form = ref<EventFormData>({
    title: '',
    type: 'work',
    start: '',
    end: '',
    allDay: false,
    isMilestone: false,
  })

  const openCreateModal = (
    startStr: string,
    endStr: string,
    allDay: boolean,
    isMilestone = false,
  ) => {
    isEditing.value = false
    editingEventId.value = null

    const finalStart = isMilestone ? (startStr.split('T')[0] || startStr) : startStr
    let finalEnd = isMilestone ? finalStart : endStr

    if (!isMilestone && allDay && endStr) {
      const d = new Date(endStr)

      d.setDate(d.getDate() - 1)
      finalEnd = formatToDateInputString(d)
    }

    form.value = {
      title: '',
      type: settings.value?.eventTypes?.[0]?.id || 'work',
      start: finalStart,
      end: finalEnd || finalStart,
      allDay: isMilestone ? true : allDay,
      isMilestone,
    }
    isModalOpen.value = true
  }

  const openEditModal = (calEvent: {
    id: string
    title: string
    startStr: string
    endStr: string
    allDay: boolean
    extendedProps: { type?: string, isMilestone?: boolean }
  }) => {
    isEditing.value = true
    editingEventId.value = calEvent.id

    const isMilestone = Boolean(calEvent.extendedProps?.isMilestone)
    const finalStart = isMilestone
      ? (calEvent.startStr.split('T')[0] || calEvent.startStr)
      : calEvent.startStr
    let finalEnd = isMilestone ? finalStart : calEvent.endStr

    if (!isMilestone && calEvent.allDay && calEvent.endStr) {
      const d = new Date(calEvent.endStr)

      d.setDate(d.getDate() - 1)
      finalEnd = formatToDateInputString(d)
    }

    form.value = {
      title: calEvent.title,
      type: calEvent.extendedProps.type || 'work',
      start: finalStart,
      end: finalEnd || finalStart,
      allDay: isMilestone ? true : calEvent.allDay,
      isMilestone,
    }
    isModalOpen.value = true
  }

  const openEditMilestone = (evt: CalendarEvent) => {
    const startOnly = evt.start.split('T')[0] || evt.start

    isEditing.value = true
    editingEventId.value = evt.id
    form.value = {
      title: evt.title,
      type: evt.type || settings.value?.eventTypes?.[0]?.id || 'work',
      start: startOnly,
      end: startOnly,
      allDay: true,
      isMilestone: Boolean(evt.isMilestone),
    }
    isModalOpen.value = true
  }

  const closeModal = () => {
    isModalOpen.value = false
  }

  const saveEvent = async (savedData: EventFormData) => {
    const isMilestone = Boolean(savedData.isMilestone)
    const normalizedStart = isMilestone
      ? (savedData.start.split('T')[0] || savedData.start)
      : savedData.start
    let finalEnd: string | undefined = isMilestone ? undefined : savedData.end

    if (!isMilestone && savedData.allDay && normalizedStart && savedData.end) {
      if (normalizedStart === savedData.end) {
        finalEnd = undefined
      }
      else {
        const endDate = new Date(savedData.end)

        endDate.setDate(endDate.getDate() + 1)
        finalEnd = formatToDateInputString(endDate)
      }
    }

    try {
      if (isEditing.value && editingEventId.value) {
        await updateEvent(editingEventId.value, {
          title: savedData.title,
          type: savedData.type,
          start: normalizedStart,
          end: finalEnd,
          allDay: isMilestone ? true : savedData.allDay,
          isMilestone,
        })
      }
      else {
        await createEvent({
          title: savedData.title,
          type: savedData.type,
          start: normalizedStart,
          end: finalEnd,
          allDay: isMilestone ? true : savedData.allDay,
          isMilestone,
        })
      }
      isModalOpen.value = false
    }
    catch (e: unknown) {
      const appErr = parseToAppException(e)

      toast.error(appErr.getUserFacingMessage())
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
      try {
        await deleteEvent(targetId)
        closeModal()
      }
      catch (e: unknown) {
        const appErr = parseToAppException(e)

        toast.error(appErr.getUserFacingMessage())
      }
    }
  }

  return {
    isModalOpen,
    isEditing,
    form,
    openCreateModal,
    openEditModal,
    openEditMilestone,
    saveEvent,
    removeEvent,
  }
}
