import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import OrganismsFooter from '../../app/components/OrganismsFooter.vue'

describe('OrganismsFooter.vue', () => {
  it('renders default copyright with current year', () => {
    const currentYear = new Date().getFullYear()
    const wrapper = mount(OrganismsFooter, {
      global: {
        stubs: {
          AtomsDivider: true,
        },
      },
    })

    expect(wrapper.text()).toContain(`© ${currentYear} Mat.Operate & Gemini 3.1 Pro. / Elec-Console All rights reserved.`)
  })

  it('renders custom year when year prop is provided', () => {
    const wrapper = mount(OrganismsFooter, {
      props: {
        year: 2028,
      },
      global: {
        stubs: {
          AtomsDivider: true,
        },
      },
    })

    expect(wrapper.text()).toContain('© 2028 Mat.Operate & Gemini 3.1 Pro. / Elec-Console All rights reserved.')
  })

  it('renders custom text when text prop is provided', () => {
    const wrapper = mount(OrganismsFooter, {
      props: {
        text: 'Custom Copyright Notice',
      },
      global: {
        stubs: {
          AtomsDivider: true,
        },
      },
    })

    expect(wrapper.text()).toContain('Custom Copyright Notice')
  })

  it('renders slot content when default slot is provided', () => {
    const wrapper = mount(OrganismsFooter, {
      slots: {
        default: '<span>Slot Custom Content</span>',
      },
      global: {
        stubs: {
          AtomsDivider: true,
        },
      },
    })

    expect(wrapper.text()).toContain('Slot Custom Content')
  })
})
