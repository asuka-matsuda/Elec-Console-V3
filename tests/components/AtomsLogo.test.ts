import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import AtomsLogo from '../../app/components/AtomsLogo.vue'

describe('AtomsLogo.vue', () => {
  it('renders brand logo link with target "/"', () => {
    const wrapper = mount(AtomsLogo, {
      global: {
        stubs: {
          NuxtLink: {
            template: '<a :href="to" class="logo"><slot /></a>',
            props: ['to'],
          },
          Icon: true,
        },
      },
    })

    const link = wrapper.find('a')

    expect(link.exists()).toBe(true)
    expect(link.attributes('href')).toBe('/')
    expect(wrapper.text()).toContain('Elec-Console')
  })

  it('renders gauge Icon component without explicit size prop', () => {
    const wrapper = mount(AtomsLogo, {
      global: {
        stubs: {
          NuxtLink: {
            template: '<a :href="to"><slot /></a>',
            props: ['to'],
          },
          Icon: {
            template: '<span class="stub-icon" :data-name="name" :data-size="size" />',
            props: ['name', 'size'],
          },
        },
      },
    })

    const icon = wrapper.find('.stub-icon')

    expect(icon.exists()).toBe(true)
    expect(icon.attributes('data-name')).toBe('gauge')
    expect(icon.attributes('data-size')).toBeUndefined()
  })

  it('emits click event on click', async () => {
    const wrapper = mount(AtomsLogo, {
      global: {
        stubs: {
          NuxtLink: {
            template: '<a @click="$emit(\'click\', $event)"><slot /></a>',
          },
          Icon: true,
        },
      },
    })

    await wrapper.find('a').trigger('click')

    expect(wrapper.emitted('click')).toBeTruthy()
  })
})
