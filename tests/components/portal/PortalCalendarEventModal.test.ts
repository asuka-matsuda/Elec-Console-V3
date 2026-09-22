import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import CalendarEventModal from '../../../app/components/portal/organisms/CalendarEventModal.vue'

describe('CalendarEventModal.vue', () => {
  const dummyEventTypes = [
    { id: 'work', name: '現場作業', color: '#10b981' },
    { id: 'meeting', name: '会議', color: '#3b82f6' },
  ]

  const dummyInitialData = {
    title: '点検作業',
    type: 'work',
    start: '2026-09-21T09:00',
    end: '2026-09-21T10:00',
    allDay: false,
  }

  it('renders correctly with initial data in create mode', () => {
    const wrapper = mount(CalendarEventModal, {
      props: {
        modelValue: true,
        isEditing: false,
        eventTypes: dummyEventTypes,
        initialData: dummyInitialData,
      },
    })

    expect(wrapper.text()).toContain('新しい予定')
    const titleInput = wrapper.findAllComponents({ name: 'Input' })[0]

    expect(titleInput?.props('modelValue')).toBe('点検作業')

    // 新規作成時は削除ボタンがないこと
    const buttons = wrapper.findAllComponents({ name: 'Button' })
    const deleteBtn = buttons.find(b => b.props('icon') === 'trash-2')

    expect(deleteBtn).toBeUndefined()
  })

  it('renders correctly in edit mode and emits delete event when delete button clicked', async () => {
    const wrapper = mount(CalendarEventModal, {
      props: {
        modelValue: true,
        isEditing: true,
        eventTypes: dummyEventTypes,
        initialData: dummyInitialData,
      },
    })

    expect(wrapper.text()).toContain('予定の編集')
    const buttons = wrapper.findAllComponents({ name: 'Button' })
    const deleteBtn = buttons.find(b => b.props('icon') === 'trash-2')

    expect(deleteBtn).toBeDefined()

    await deleteBtn?.trigger('click')
    expect(wrapper.emitted('delete')).toBeTruthy()
  })

  it('shows error on save when title is empty, and clears error on input', async () => {
    const wrapper = mount(CalendarEventModal, {
      props: {
        modelValue: true,
        isEditing: false,
        eventTypes: dummyEventTypes,
        initialData: {
          ...dummyInitialData,
          title: '',
        },
      },
    })

    const buttons = wrapper.findAllComponents({ name: 'Button' })
    const saveBtn = buttons.find(b => b.text().includes('保存'))

    expect(saveBtn).toBeDefined()

    await saveBtn?.trigger('click')
    expect(wrapper.emitted('save')).toBeFalsy()
    expect(wrapper.text()).toContain('タイトルを入力してください')

    // タイトルを入力するとエラーが消える
    const titleInput = wrapper.findAllComponents({ name: 'Input' })[0]

    await titleInput?.vm.$emit('input', '新規作業')
    expect(wrapper.text()).not.toContain('タイトルを入力してください')
  })

  it('emits save with current form data when title is valid', async () => {
    const wrapper = mount(CalendarEventModal, {
      props: {
        modelValue: true,
        isEditing: false,
        eventTypes: dummyEventTypes,
        initialData: dummyInitialData,
      },
    })

    const buttons = wrapper.findAllComponents({ name: 'Button' })
    const saveBtn = buttons.find(b => b.text().includes('保存'))

    await saveBtn?.trigger('click')
    expect(wrapper.emitted('save')).toBeTruthy()
    expect(wrapper.emitted('save')?.[0]).toEqual([
      {
        title: '点検作業',
        type: 'work',
        start: '2026-09-21T09:00',
        end: '2026-09-21T10:00',
        allDay: false,
      },
    ])
  })

  it('closes modal when cancel button is clicked', async () => {
    const wrapper = mount(CalendarEventModal, {
      props: {
        modelValue: true,
        isEditing: false,
        eventTypes: dummyEventTypes,
        initialData: dummyInitialData,
      },
    })

    const buttons = wrapper.findAllComponents({ name: 'Button' })
    const cancelBtn = buttons.find(b => b.text().includes('キャンセル'))

    await cancelBtn?.trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false])
  })

  it('adjusts start and end format when allDay checkbox is toggled', async () => {
    const wrapper = mount(CalendarEventModal, {
      props: {
        modelValue: true,
        isEditing: false,
        eventTypes: dummyEventTypes,
        initialData: dummyInitialData,
      },
    })

    const checkbox = wrapper.findComponent({ name: 'Checkbox' })

    expect(checkbox.exists()).toBe(true)

    // 終日をtrueに切り替え
    await checkbox.vm.$emit('update:modelValue', true)

    const saveBtn = wrapper.findAllComponents({ name: 'Button' }).find(b => b.text().includes('保存'))

    await saveBtn?.trigger('click')

    expect(wrapper.emitted('save')?.[0]).toEqual([
      {
        title: '点検作業',
        type: 'work',
        start: '2026-09-21',
        end: '2026-09-21',
        allDay: true,
      },
    ])
  })
})
