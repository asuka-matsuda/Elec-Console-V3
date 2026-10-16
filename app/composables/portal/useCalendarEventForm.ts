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
    isPersonal: false,
    location: '',
    description: '',
    assignees: [],
    createdBy: null,
    updatedBy: null,
    createdAt: undefined,
    updatedAt: undefined,
  })

  const openCreateModal = (
    startStr: string,
    endStr: string,
    allDay: boolean,
    isMilestone = false,
    isPersonal = false,
  ) => {
    isEditing.value = false
    editingEventId.value = null

    const finalStart = isMilestone || allDay
      ? (startStr.split('T')[0] || startStr)
      : (startStr.includes('T') ? startStr.slice(0, 16) : startStr)

    let finalEnd = isMilestone
      ? finalStart
      : (allDay
          ? (endStr.split('T')[0] || endStr)
          : (endStr.includes('T') ? endStr.slice(0, 16) : endStr))

    if (!isMilestone && allDay && finalEnd && finalEnd > finalStart) {
      const d = new Date(finalEnd)

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
      isPersonal,
      location: '',
      description: '',
      assignees: [],
      createdBy: null,
      updatedBy: null,
      createdAt: undefined,
      updatedAt: undefined,
    }
    isModalOpen.value = true
  }

  const openEditModal = (calEvent: {
    id: string
    title: string
    startStr: string
    endStr: string
    allDay: boolean
    extendedProps: {
      type?: string
      isMilestone?: boolean
      isPersonal?: boolean
      location?: string | null
      description?: string | null
      assignees?: string[]
      createdBy?: string | null
      updatedBy?: string | null
      createdAt?: string
      updatedAt?: string
    }
  }) => {
    isEditing.value = true
    editingEventId.value = calEvent.id

    const isMilestone = Boolean(calEvent.extendedProps?.isMilestone)
    const isPersonal = Boolean(calEvent.extendedProps?.isPersonal)
    const rawStart = calEvent.startStr
    const rawEnd = calEvent.endStr

    const finalStart = isMilestone || calEvent.allDay
      ? (rawStart.split('T')[0] || rawStart)
      : (rawStart.includes('T') ? rawStart.slice(0, 16) : rawStart)

    let finalEnd = isMilestone
      ? finalStart
      : (calEvent.allDay
          ? (rawEnd.split('T')[0] || rawEnd)
          : (rawEnd.includes('T') ? rawEnd.slice(0, 16) : rawEnd))

    if (!isMilestone && calEvent.allDay && finalEnd && finalEnd > finalStart) {
      const d = new Date(finalEnd)

      d.setDate(d.getDate() - 1)
      finalEnd = formatToDateInputString(d)
    }

    form.value = {
      title: calEvent.title,
      type: calEvent.extendedProps?.type || 'work',
      start: finalStart,
      end: finalEnd || finalStart,
      allDay: isMilestone ? true : calEvent.allDay,
      isMilestone,
      isPersonal,
      location: calEvent.extendedProps?.location || '',
      description: calEvent.extendedProps?.description || '',
      assignees: Array.isArray(calEvent.extendedProps?.assignees)
        ? [...calEvent.extendedProps.assignees]
        : [],
      createdBy: calEvent.extendedProps?.createdBy ?? null,
      updatedBy: calEvent.extendedProps?.updatedBy ?? null,
      createdAt: calEvent.extendedProps?.createdAt,
      updatedAt: calEvent.extendedProps?.updatedAt,
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
      isPersonal: Boolean(evt.isPersonal),
      location: evt.location || '',
      description: evt.description || '',
      assignees: Array.isArray(evt.assignees) ? [...evt.assignees] : [],
      createdBy: evt.createdBy ?? null,
      updatedBy: evt.updatedBy ?? null,
      createdAt: evt.createdAt,
      updatedAt: evt.updatedAt,
    }
    isModalOpen.value = true
  }

  const duplicateEvent = (sourceData: EventFormData) => {
    isEditing.value = false
    editingEventId.value = null
    form.value = {
      ...sourceData,
      title: sourceData.title.endsWith(' (コピー)')
        ? sourceData.title
        : `${sourceData.title} (コピー)`,
      assignees: Array.isArray(sourceData.assignees) ? [...sourceData.assignees] : [],
      createdBy: null,
      updatedBy: null,
      createdAt: undefined,
      updatedAt: undefined,
    }
    toast.info('予定を複製しました。日時を確認して保存してください。')
  }

  const closeModal = () => {
    isModalOpen.value = false
  }

  const saveEvent = async (savedData: EventFormData) => {
    const isMilestone = Boolean(savedData.isMilestone)
    const isPersonal = Boolean(savedData.isPersonal)
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

    const payload = {
      title: savedData.title,
      type: savedData.type,
      start: normalizedStart,
      end: finalEnd,
      allDay: isMilestone ? true : savedData.allDay,
      isMilestone,
      isPersonal,
      location: savedData.location?.trim() || null,
      description: savedData.description?.trim() || null,
      assignees: isPersonal ? [] : (Array.isArray(savedData.assignees) ? savedData.assignees : []),
    }

    try {
      if (isEditing.value && editingEventId.value) {
        await updateEvent(editingEventId.value, payload)
      }
      else {
        await createEvent(payload)
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
    duplicateEvent,
    saveEvent,
    removeEvent,
  }
}
