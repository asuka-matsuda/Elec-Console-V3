import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ModalCalendarEvent from '../../../app/components/portal/calendar/ModalCalendarEvent.vue'

describe('ModalCalendarEvent.vue', () => {
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
    const wrapper = mount(ModalCalendarEvent, {
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
    const wrapper = mount(ModalCalendarEvent, {
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
    const wrapper = mount(ModalCalendarEvent, {
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

    await titleInput?.vm.$emit('update:modelValue', '新規作業')
    expect(wrapper.text()).not.toContain('タイトルを入力してください')
  })

  it('emits save with current form data when title is valid', async () => {
    const wrapper = mount(ModalCalendarEvent, {
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
    const wrapper = mount(ModalCalendarEvent, {
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
    const wrapper = mount(ModalCalendarEvent, {
      props: {
        modelValue: true,
        isEditing: false,
        eventTypes: dummyEventTypes,
        initialData: dummyInitialData,
      },
    })

    const allDayToggle = wrapper
      .findAllComponents({ name: 'Toggle' })
      .find(c => c.props('label') === '終日イベント')

    expect(allDayToggle).toBeDefined()

    // 終日をtrueに切り替え
    await allDayToggle?.vm.$emit('update:modelValue', true)

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

  it('displays audit info (createdBy / updatedBy) and emits duplicate event in edit mode', async () => {
    const wrapper = mount(ModalCalendarEvent, {
      props: {
        modelValue: true,
        isEditing: true,
        eventTypes: dummyEventTypes,
        siteMembers: ['松田 飛鳥', '佐藤 太郎'],
        initialData: {
          ...dummyInitialData,
          location: '1F 電気室',
          description: '検電器持参',
          assignees: ['松田 飛鳥'],
          createdBy: '松田 飛鳥',
          updatedBy: '佐藤 太郎',
          createdAt: '2026-09-20T09:00:00.000Z',
          updatedAt: '2026-09-20T15:30:00.000Z',
        },
      },
    })

    expect(wrapper.text()).toContain('登録:')
    expect(wrapper.text()).toContain('松田 飛鳥')
    expect(wrapper.text()).toContain('最終更新:')
    expect(wrapper.text()).toContain('佐藤 太郎')

    const duplicateBtn = wrapper.findAllComponents({ name: 'Button' }).find(b => b.text().includes('複製'))

    expect(duplicateBtn).toBeDefined()
    await duplicateBtn?.trigger('click')
    expect(wrapper.emitted('duplicate')).toBeTruthy()
  })

  it('validates that end date is not before start date', async () => {
    const wrapper = mount(ModalCalendarEvent, {
      props: {
        modelValue: true,
        isEditing: false,
        eventTypes: dummyEventTypes,
        initialData: {
          ...dummyInitialData,
          start: '2026-09-22T10:00',
          end: '2026-09-21T09:00',
        },
      },
    })

    const saveBtn = wrapper.findAllComponents({ name: 'Button' }).find(b => b.text().includes('保存'))

    await saveBtn?.trigger('click')
    expect(wrapper.emitted('save')).toBeFalsy()
    expect(wrapper.text()).toContain('終了日時は開始日時以降を指定してください')
  })

  it('hides edit/delete/save buttons when readonly is true', () => {
    const wrapper = mount(ModalCalendarEvent, {
      props: {
        modelValue: true,
        isEditing: true,
        readonly: true,
        eventTypes: dummyEventTypes,
        initialData: dummyInitialData,
      },
    })

    expect(wrapper.text()).toContain('予定の詳細')
    const buttons = wrapper.findAllComponents({ name: 'Button' })

    expect(buttons.find(b => b.text().includes('保存'))).toBeUndefined()
    expect(buttons.find(b => b.props('icon') === 'trash-2')).toBeUndefined()
    expect(buttons.find(b => b.text().includes('閉じる'))).toBeDefined()
  })
})
