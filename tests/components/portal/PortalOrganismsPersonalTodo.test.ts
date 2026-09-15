import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import OrganismsPersonalTodo from '../../../app/components/portal/OrganismsPersonalTodo.client.vue'

describe('OrganismsPersonalTodo.client.vue', () => {
  it('renders todo input and section header', () => {
    const wrapper = mount(OrganismsPersonalTodo, {
      props: {
        siteId: 'site-a',
      },
    })

    expect(wrapper.text()).toContain('パーソナルToDo')
    expect(wrapper.find('input').exists()).toBe(true)
    const btn = wrapper.findComponent({ name: 'AtomsButton' })

    expect(btn.exists()).toBe(true)
    expect(btn.props('variant')).toBe('ghost')
  })
})
