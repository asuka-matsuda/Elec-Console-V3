import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import Calendar from '../../app/components/common/molecules/Calendar.vue'

describe('Calendar.vue', () => {
  it('renders calendar grid with 42 cells and week days', () => {
    const wrapper = mount(Calendar, {
      global: {
        stubs: {
          Button: {
            template: '<button type="button" @click="$emit(\'click\')"><slot /></button>',
          },
        },
      },
    })

    const weekdays = wrapper.findAll('.calendar-weekday')

    expect(weekdays).toHaveLength(7)
    expect(weekdays[0].text()).toBe('日')
    expect(weekdays[6].text()).toBe('土')

    const cells = wrapper.findAll('.calendar-cell')

    expect(cells).toHaveLength(42)
  })

  it('selects single date on day click in single mode', async () => {
    const wrapper = mount(Calendar, {
      props: {
        mode: 'single',
        modelValue: null,
      },
      global: {
        stubs: {
          Button: {
            template: '<button type="button" @click="$emit(\'click\')"><slot /></button>',
          },
        },
      },
    })

    // 当月の15日目付近のセルをクリック
    const currentMonthCells = wrapper.findAll('.calendar-cell:not(.is-other-month)')

    expect(currentMonthCells.length).toBeGreaterThan(20)

    const targetCell = currentMonthCells[14]

    await targetCell.trigger('click')

    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('select')).toBeTruthy()

    const selectedValue = wrapper.emitted('select')?.[0]?.[0]

    expect(typeof selectedValue).toBe('string')
    expect(selectedValue).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('selects range on two clicks in range mode', async () => {
    const wrapper = mount(Calendar, {
      props: {
        mode: 'range',
        modelValue: null,
      },
      global: {
        stubs: {
          Button: {
            template: '<button type="button" @click="$emit(\'click\')"><slot /></button>',
          },
        },
      },
    })

    const currentMonthCells = wrapper.findAll('.calendar-cell:not(.is-other-month)')
    const startCell = currentMonthCells[5] // 6日
    const endCell = currentMonthCells[10] // 11日

    // 1回目クリック: 始点
    await startCell.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeFalsy()

    // 2回目クリック: 終点確定
    await endCell.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('select')).toBeTruthy()

    const range = wrapper.emitted('select')?.[0]?.[0] as { start: string, end: string }

    expect(range).toBeDefined()
    expect(range.start).toBeDefined()
    expect(range.end).toBeDefined()
    expect(range.start <= range.end).toBe(true)
  })

  it('handles presets selection', async () => {
    const presets = [
      { label: '今日', range: { start: '2026-10-05', end: '2026-10-05' } },
      { label: '直近7日間', range: { start: '2026-09-29', end: '2026-10-05' } },
    ]

    const wrapper = mount(Calendar, {
      props: {
        mode: 'range',
        presets,
      },
      global: {
        stubs: {
          Button: {
            template: '<button type="button" @click="$emit(\'click\')"><slot /></button>',
          },
        },
      },
    })

    const presetButtons = wrapper.findAll('.calendar-presets button')

    expect(presetButtons).toHaveLength(2)
    expect(presetButtons[1].text()).toBe('直近7日間')

    await presetButtons[1].trigger('click')

    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('select')?.[0]?.[0]).toEqual({
      start: '2026-09-29',
      end: '2026-10-05',
    })
  })

  it('respects min and max bounds', async () => {
    const wrapper = mount(Calendar, {
      props: {
        min: '2099-01-01', // すべて min より過去
      },
      global: {
        stubs: {
          Button: {
            template: '<button type="button" @click="$emit(\'click\')"><slot /></button>',
          },
        },
      },
    })

    const disabledCells = wrapper.findAll('.calendar-cell.is-disabled')

    expect(disabledCells.length).toBe(42)

    await disabledCells[10].trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeFalsy()
  })

  it('applies size classes correctly', () => {
    const wrapperSm = mount(Calendar, {
      props: { size: 'sm' },
      global: { stubs: { Button: true } },
    })

    expect(wrapperSm.classes()).toContain('calendar--sm')

    const wrapperMd = mount(Calendar, {
      props: { size: 'md' },
      global: { stubs: { Button: true } },
    })

    expect(wrapperMd.classes()).toContain('calendar--md')
  })
})
