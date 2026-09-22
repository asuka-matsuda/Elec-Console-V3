import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import CalendarTypeSettingsModal from '../../../app/components/portal/organisms/CalendarTypeSettingsModal.vue'

describe('CalendarTypeSettingsModal.vue', () => {
  const dummyEventTypes = [
    { id: 't1', name: '現場作業', color: '#10b981' },
    { id: 't2', name: '会議', color: '#3b82f6' },
  ]

  it('renders correctly with given event types', () => {
    const wrapper = mount(CalendarTypeSettingsModal, {
      props: {
        modelValue: true,
        eventTypes: dummyEventTypes,
      },
    })

    expect(wrapper.text()).toContain('予定種別の設定')
    const inputs = wrapper.findAllComponents({ name: 'Input' })

    expect(inputs.length).toBe(2)
  })

  it('adds a new type when add button is clicked', async () => {
    const wrapper = mount(CalendarTypeSettingsModal, {
      props: {
        modelValue: true,
        eventTypes: dummyEventTypes,
      },
    })

    const buttons = wrapper.findAllComponents({ name: 'Button' })
    const addBtn = buttons.find(b => b.text().includes('種別を追加'))

    expect(addBtn).toBeDefined()

    await addBtn?.trigger('click')

    const inputs = wrapper.findAllComponents({ name: 'Input' })

    expect(inputs.length).toBe(3)
  })

  it('removes a type when trash button is clicked', async () => {
    const wrapper = mount(CalendarTypeSettingsModal, {
      props: {
        modelValue: true,
        eventTypes: dummyEventTypes,
      },
    })

    const buttons = wrapper.findAllComponents({ name: 'Button' })
    const deleteBtn = buttons.find(b => b.props('icon') === 'trash-2')

    expect(deleteBtn).toBeDefined()

    await deleteBtn?.trigger('click')

    const inputs = wrapper.findAllComponents({ name: 'Input' })

    expect(inputs.length).toBe(1)
  })

  it('emits save event with cleaned types and closes modal', async () => {
    const wrapper = mount(CalendarTypeSettingsModal, {
      props: {
        modelValue: true,
        eventTypes: [
          { id: 't1', name: '  現地確認  ', color: '#10b981' },
          { id: 't2', name: '   ', color: '#3b82f6' },
        ],
      },
    })

    const saveBtn = wrapper.findAllComponents({ name: 'Button' }).find(b => b.text().includes('設定を保存'))

    expect(saveBtn).toBeDefined()

    await saveBtn?.trigger('click')

    expect(wrapper.emitted('save')).toBeTruthy()
    expect(wrapper.emitted('save')?.[0]).toEqual([
      [
        { id: 't1', name: '現地確認', color: '#10b981' },
        { id: 't2', name: '種別 2', color: '#3b82f6' },
      ],
    ])
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false])
  })

  it('closes modal when cancel button is clicked', async () => {
    const wrapper = mount(CalendarTypeSettingsModal, {
      props: {
        modelValue: true,
        eventTypes: dummyEventTypes,
      },
    })

    const cancelBtn = wrapper.findAllComponents({ name: 'Button' }).find(b => b.text().includes('キャンセル'))

    expect(cancelBtn).toBeDefined()

    await cancelBtn?.trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false])
  })
})
