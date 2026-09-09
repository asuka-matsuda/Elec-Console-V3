import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import OrganismsConduitResult from '../../app/components/tool/OrganismsConduitResult.vue'
import type { ConduitCalcResult } from '../../app/utils/tools/conduit/conduitCalcLogic'

describe('ToolOrganismsConduitResult (app/components/tool/OrganismsConduitResult.vue)', () => {
  const commonStubs = {
    MoleculesResultBox: {
      props: ['title', 'status', 'size'],
      template: `
        <div class="result-box-stub" :class="[status, size ? 'is-' + size : '']">
          <div class="title"><slot name="title">{{ title }}</slot></div>
          <div class="value"><slot name="value"><slot /></slot></div>
        </div>
      `,
    },
    AtomsBadge: {
      template: '<span class="badge-stub"><slot /></span>',
    },
    AtomsPanel: {
      template: '<div class="panel-stub"><slot /></div>',
    },
    AtomsIcon: {
      template: '<i class="icon-stub" />',
    },
  }

  it('renders recommendation badges and sizes for different cable sizes (異種混在)', () => {
    const mockResult = {
      success: true,
      partial: false,
      isSameSize: false,
      conduit32: { size: 'E31' },
      fill32: 28.5,
      conduit48: { size: 'E25' },
      fill48: 42.1,
      customFillRate: 40,
      conduitCustom: { size: 'E31' },
      fillCustom: 28.5,
    } as unknown as ConduitCalcResult

    const wrapper = mount(OrganismsConduitResult, {
      props: {
        result: mockResult,
      },
      global: {
        stubs: commonStubs,
      },
    })

    const text = wrapper.text()

    expect(text).toContain('規程推奨')
    expect(text).toContain('適用外 (異種混在)')
    expect(text).toContain('E31')
    expect(text).toContain('28.5')
    expect(text).toContain('E25')
    expect(text).toContain('42.1')
    expect(text).toContain('3110-6 (32%以下)')
    expect(text).toContain('3110-5 (48%以下)')
  })

  it('renders applicable badge for same cable sizes (同種)', () => {
    const mockResult = {
      success: true,
      partial: false,
      isSameSize: true,
      conduit32: { size: 'E25' },
      fill32: 25.0,
      conduit48: { size: 'E19' },
      fill48: 45.0,
      customFillRate: 40,
      conduitCustom: { size: 'E25' },
      fillCustom: 25.0,
    } as unknown as ConduitCalcResult

    const wrapper = mount(OrganismsConduitResult, {
      props: {
        result: mockResult,
      },
      global: {
        stubs: commonStubs,
      },
    })

    const text = wrapper.text()

    expect(text).toContain('適用可 (屈曲小)')
    expect(text).toContain('E25')
    expect(text).toContain('E19')
  })

  it('applies is-sm class when size="sm"', () => {
    const wrapper = mount(OrganismsConduitResult, {
      props: {
        result: null,
        size: 'sm',
      },
      global: {
        stubs: commonStubs,
      },
    })

    expect(wrapper.classes()).toContain('is-sm')
  })
})
