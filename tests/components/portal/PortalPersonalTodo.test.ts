import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, ref } from 'vue'

import PersonalTodo from '../../../app/components/portal/souden/PersonalTodo.client.vue'
import type { TodoItem } from '../../../app/composables/portal/useTodo'

const mockTodos = ref<TodoItem[]>([])
const mockAddTodo = vi.fn((text: string) => {
  mockTodos.value.push({
    id: String(Date.now()),
    text,
    completed: false,
    createdAt: new Date().toISOString(),
  })
})
const mockDeleteTodo = vi.fn((id: string) => {
  mockTodos.value = mockTodos.value.filter(t => t.id !== id)
})

vi.mock('~/composables/portal/useTodo', () => ({
  useTodo: () => ({
    todos: computed(() => mockTodos.value),
    addTodo: mockAddTodo,
    deleteTodo: mockDeleteTodo,
  }),
}))

describe('PersonalTodo.client.vue', () => {
  beforeEach(() => {
    mockTodos.value = []
    mockAddTodo.mockClear()
    mockDeleteTodo.mockClear()
  })

  it('renders EmptyState when there are no todos', () => {
    const wrapper = mount(PersonalTodo, {
      props: { siteId: 'site-1' },
      global: {
        stubs: {
          Panel: { template: '<div><slot /></div>' },
          SectionHeader: { template: '<div class="section-header" />' },
          EmptyState: { template: '<div class="empty-state">タスクはありません</div>' },
          Input: {
            props: ['modelValue'],
            emits: ['update:modelValue'],
            template: '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
          },
          Button: { template: '<button><slot /></button>' },
          Checkbox: { template: '<label><slot /></label>' },
        },
      },
    })

    expect(wrapper.find('.empty-state').exists()).toBe(true)
    expect(wrapper.find('ul').exists()).toBe(false)
  })

  it('renders todo list and items when todos exist', () => {
    mockTodos.value = [
      { id: '1', text: '配線チェック', completed: false, createdAt: '2026-09-21T09:00:00Z' },
      { id: '2', text: '安全確認', completed: true, createdAt: '2026-09-21T08:00:00Z' },
    ]

    const wrapper = mount(PersonalTodo, {
      props: { siteId: 'site-1' },
      global: {
        stubs: {
          Panel: { template: '<div><slot /></div>' },
          SectionHeader: { template: '<div class="section-header" />' },
          EmptyState: { template: '<div class="empty-state" />' },
          Input: { template: '<input />' },
          Button: { template: '<button class="btn-stub"><slot /></button>' },
          Checkbox: { template: '<label class="checkbox-stub"><slot /></label>' },
        },
      },
    })

    expect(wrapper.find('.empty-state').exists()).toBe(false)
    expect(wrapper.find('ul').exists()).toBe(true)

    const items = wrapper.findAll('li.todo-item')

    expect(items.length).toBe(2)
    expect(items[0].text()).toContain('配線チェック')
    expect(items[1].text()).toContain('安全確認')
  })

  it('adds todo on form submit and clears input', async () => {
    const wrapper = mount(PersonalTodo, {
      props: { siteId: 'site-1' },
      global: {
        stubs: {
          Panel: { template: '<div><slot /></div>' },
          SectionHeader: { template: '<div class="section-header" />' },
          EmptyState: { template: '<div class="empty-state" />' },
          Input: {
            props: ['modelValue'],
            emits: ['update:modelValue'],
            template: '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
          },
          Button: { template: '<button type="submit"><slot /></button>' },
          Checkbox: { template: '<label><slot /></label>' },
        },
      },
    })

    const input = wrapper.find('input')

    await input.setValue('新規テストタスク')
    await wrapper.find('form').trigger('submit.prevent')

    expect(mockAddTodo).toHaveBeenCalledWith('新規テストタスク')
    expect((input.element as HTMLInputElement).value).toBe('')
  })

  it('ignores empty input on submit', async () => {
    const wrapper = mount(PersonalTodo, {
      props: { siteId: 'site-1' },
      global: {
        stubs: {
          Panel: { template: '<div><slot /></div>' },
          SectionHeader: { template: '<div class="section-header" />' },
          EmptyState: { template: '<div class="empty-state" />' },
          Input: {
            props: ['modelValue'],
            emits: ['update:modelValue'],
            template: '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
          },
          Button: { template: '<button type="submit"><slot /></button>' },
          Checkbox: { template: '<label><slot /></label>' },
        },
      },
    })

    const input = wrapper.find('input')

    await input.setValue('   ')
    await wrapper.find('form').trigger('submit.prevent')

    expect(mockAddTodo).not.toHaveBeenCalled()
  })

  it('calls deleteTodo when delete button is clicked', async () => {
    mockTodos.value = [
      { id: 'todo-999', text: '削除対象タスク', completed: false, createdAt: '2026-09-21T09:00:00Z' },
    ]

    const wrapper = mount(PersonalTodo, {
      props: { siteId: 'site-1' },
      global: {
        stubs: {
          Panel: { template: '<div><slot /></div>' },
          SectionHeader: { template: '<div class="section-header" />' },
          EmptyState: { template: '<div class="empty-state" />' },
          Input: { template: '<input />' },
          Button: {
            template: '<button class="btn-stub" @click="$emit(\'click\')"><slot /></button>',
          },
          Checkbox: { template: '<label><slot /></label>' },
        },
      },
    })

    const deleteBtn = wrapper.find('li.todo-item button.btn-stub')

    await deleteBtn.trigger('click')

    expect(mockDeleteTodo).toHaveBeenCalledWith('todo-999')
  })
})
