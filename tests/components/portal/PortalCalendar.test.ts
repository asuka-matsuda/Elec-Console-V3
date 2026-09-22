import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

import CalendarClient from '../../../app/components/portal/organisms/Calendar.client.vue'

const mockEvents = ref([
  { id: 'evt-1', siteId: 'site-1', title: '現場確認', start: '2026-09-21' },
])
const mockSettings = ref({
  siteId: 'site-1',
  eventTypes: [{ id: 'work', name: '現場作業', color: '#39c5cf' }],
  holidayDays: [0, 6],
  customHolidays: [],
})

const mockCreateEvent = vi.fn()
const mockUpdateEvent = vi.fn()
const mockDeleteEvent = vi.fn()
const mockUpdateSettings = vi.fn()

vi.mock('~/composables/portal/useCalendar', () => ({
  useCalendar: () => ({
    events: mockEvents,
    settings: mockSettings,
    createEvent: mockCreateEvent,
    updateEvent: mockUpdateEvent,
    deleteEvent: mockDeleteEvent,
    updateSettings: mockUpdateSettings,
  }),
}))

const mockIsModalOpen = ref(false)
const mockIsEditing = ref(false)
const mockForm = ref({
  title: '',
  type: 'work',
  start: '',
  end: '',
  allDay: false,
})
const mockOpenCreateModal = vi.fn()
const mockOpenEditModal = vi.fn()
const mockSaveEvent = vi.fn()
const mockRemoveEvent = vi.fn()

vi.mock('~/composables/portal/useCalendarEventForm', () => ({
  useCalendarEventForm: () => ({
    isModalOpen: mockIsModalOpen,
    isEditing: mockIsEditing,
    form: mockForm,
    openCreateModal: mockOpenCreateModal,
    openEditModal: mockOpenEditModal,
    saveEvent: mockSaveEvent,
    removeEvent: mockRemoveEvent,
  }),
}))

let capturedOptionsConfig: {
  onEventDrop: (info: { event: { id: string, startStr: string, endStr?: string, allDay: boolean }, revert: () => void }) => Promise<void>
  onEventResize: (info: { event: { id: string, startStr: string, endStr?: string }, revert: () => void }) => Promise<void>
} | null = null

vi.mock('~/composables/portal/useCalendarOptions', () => ({
  useCalendarOptions: (config: typeof capturedOptionsConfig) => {
    capturedOptionsConfig = config

    return {
      fullCalendarRef: ref(null),
      currentTitle: ref('2026年9月'),
      currentView: ref('dayGridMonth'),
      calendarOptions: ref({ initialView: 'dayGridMonth' }),
      handlePrev: vi.fn(),
      handleNext: vi.fn(),
      handleToday: vi.fn(),
      handleViewChange: vi.fn(),
    }
  },
}))

vi.mock('@fullcalendar/vue3', () => ({
  default: {
    name: 'FullCalendar',
    props: ['options'],
    template: '<div class="fc-stub" />',
  },
}))

describe('Calendar.client.vue', () => {
  it('renders toolbar, panel with padding none, fullcalendar stub and modals', () => {
    const wrapper = mount(CalendarClient, {
      props: { siteId: 'site-1' },
      global: {
        stubs: {
          Panel: {
            name: 'Panel',
            props: ['padding', 'overflow'],
            template: '<div class="panel-stub" :data-padding="padding" :data-overflow="overflow"><slot /></div>',
          },
          CalendarToolbar: true,
          CalendarEventModal: true,
          CalendarTypeSettingsModal: true,
        },
      },
    })

    // Panel の余白引き算プロパティが渡されていること
    const panel = wrapper.findComponent({ name: 'Panel' })

    expect(panel.exists()).toBe(true)
    expect(panel.props('padding')).toBe('none')
    expect(panel.props('overflow')).toBe('visible')

    // FullCalendar スタブが存在すること
    expect(wrapper.find('.fc-stub').exists()).toBe(true)
  })

  it('opens type settings modal when toolbar emits open-type-settings', async () => {
    const wrapper = mount(CalendarClient, {
      props: { siteId: 'site-1' },
      global: {
        stubs: {
          Panel: true,
          CalendarToolbar: true,
          CalendarEventModal: true,
          CalendarTypeSettingsModal: {
            name: 'CalendarTypeSettingsModal',
            props: ['modelValue'],
            template: '<div class="settings-modal" :data-open="modelValue" />',
          },
        },
      },
    })

    const toolbar = wrapper.findComponent({ name: 'CalendarToolbar' })
    const typeModal = wrapper.findComponent({ name: 'CalendarTypeSettingsModal' })

    expect(typeModal.props('modelValue')).toBe(false)

    // ツールバーから開くイベント
    await toolbar.vm.$emit('open-type-settings')
    expect(typeModal.props('modelValue')).toBe(true)
  })

  it('calls updateSettings without manual array spread hack when saving types', async () => {
    const wrapper = mount(CalendarClient, {
      props: { siteId: 'site-1' },
      global: {
        stubs: {
          Panel: true,
          CalendarToolbar: true,
          CalendarEventModal: true,
          CalendarTypeSettingsModal: true,
        },
      },
    })

    const typeModal = wrapper.findComponent({ name: 'CalendarTypeSettingsModal' })
    const newTypes = [{ id: 'new', name: '新規種別', color: '#ff0000' }]

    await typeModal.vm.$emit('save', newTypes)
    expect(mockUpdateSettings).toHaveBeenCalledWith({ eventTypes: newTypes })
  })

  it('handles revert on event drop or resize when updateEvent fails', async () => {
    mount(CalendarClient, {
      props: { siteId: 'site-1' },
      global: {
        stubs: {
          Panel: true,
          CalendarToolbar: true,
          CalendarEventModal: true,
          CalendarTypeSettingsModal: true,
        },
      },
    })

    expect(capturedOptionsConfig).toBeTruthy()

    // 正常系: updateEvent が成功
    mockUpdateEvent.mockResolvedValueOnce(undefined)
    const dropRevert = vi.fn()

    await capturedOptionsConfig?.onEventDrop({
      event: { id: 'evt-1', startStr: '2026-09-22', endStr: '', allDay: false },
      revert: dropRevert,
    })
    expect(mockUpdateEvent).toHaveBeenCalledWith('evt-1', {
      start: '2026-09-22',
      end: undefined,
      allDay: false,
    })
    expect(dropRevert).not.toHaveBeenCalled()

    // 異常系: updateEvent が失敗したら revert() が呼ばれること
    mockUpdateEvent.mockRejectedValueOnce(new Error('Network error'))
    await capturedOptionsConfig?.onEventDrop({
      event: { id: 'evt-1', startStr: '2026-09-23', endStr: '', allDay: false },
      revert: dropRevert,
    })
    expect(dropRevert).toHaveBeenCalled()

    // リサイズの異常系: updateEvent が失敗したら revert() が呼ばれること
    const resizeRevert = vi.fn()

    mockUpdateEvent.mockRejectedValueOnce(new Error('Resize error'))
    await capturedOptionsConfig?.onEventResize({
      event: { id: 'evt-1', startStr: '2026-09-21', endStr: '2026-09-24' },
      revert: resizeRevert,
    })
    expect(resizeRevert).toHaveBeenCalled()
  })
})
