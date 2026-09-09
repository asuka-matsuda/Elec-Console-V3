import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import OrganismsRackResult from '../../app/components/tool/OrganismsRackResult.vue'
import type { RackCalcResult } from '../../app/utils/tools/rack/rackCalcLogic'

describe('ToolOrganismsRackResult (app/components/tool/OrganismsRackResult.vue)', () => {
  const commonStubs = {
    MoleculesResultBox: {
      props: ['status', 'isEmpty'],
      template: `
        <div class="result-box-stub" :class="[status, { 'is-empty': isEmpty }]">
          <div class="title"><slot name="title" /></div>
          <div class="value"><slot name="value" /></div>
          <div class="footer"><slot name="footer" /></div>
        </div>
      `,
    },
    AtomsBadge: {
      props: ['color'],
      template: '<span class="badge-stub"><slot /></span>',
    },
    MoleculesResultDetails: {
      props: ['items'],
      template: `
        <div class="result-details-stub">
          <div v-for="item in items" :key="item.label" class="detail-row">
            <span>{{ item.label }}</span>
            <span>{{ item.value }}</span>
            <span v-if="item.unit">{{ item.unit }}</span>
            <span v-if="item.note">{{ item.note }}</span>
          </div>
        </div>
      `,
    },
  }

  const createMockResult = (overrides: Partial<RackCalcResult> = {}): RackCalcResult => ({
    mode: 'strong',
    rackHeight: 100,
    maxDepth: 80,
    wStrong: 180,
    wWeak: 0,
    totalWidth: 180,
    tier1: {
      layers: 1,
      selectedSize: 200,
      totalWidth: 180,
      maxCableStackHeight: 35,
      utilizationRate: 90,
      isOverflow: false,
      isSizeOver: false,
      row1Count: 4,
      row2Count: 0,
      isFit: true,
    },
    tier2: {
      layers: 2,
      selectedSize: 150,
      totalWidth: 130,
      maxCableStackHeight: 70,
      utilizationRate: 86.7,
      isOverflow: false,
      isSizeOver: false,
      row1Count: 2,
      row2Count: 2,
      isApplicable: true,
      isFit: true,
    },
    error: false,
    ...overrides,
  })

  it('Tailwindのレイアウトクラスで正しく描画されること', () => {
    const wrapper = mount(OrganismsRackResult, {
      props: {
        result: createMockResult(),
        maxDepth: 80,
        mode: 'strong',
      },
      global: {
        stubs: commonStubs,
      },
    })

    const root = wrapper.find('div')

    expect(root.classes()).toContain('flex')
    expect(root.classes()).toContain('flex-col')
  })

  it('1段・2段敷設の結果と内訳が正しく描画されること', () => {
    const wrapper = mount(OrganismsRackResult, {
      props: {
        result: createMockResult(),
        maxDepth: 80,
        mode: 'strong',
      },
      global: {
        stubs: commonStubs,
      },
    })

    const text = wrapper.text()

    expect(text).toContain('1段敷設（平置き・標準）')
    expect(text).toContain('200')
    expect(text).toContain('2段敷設（省スペース）')
    expect(text).toContain('150')
    expect(text).toContain('ラック有効高さ')
    expect(text).toContain('80')
  })

  it('2段敷設が適用不可（isApplicable: false）の場合に適用不可メッセージが表示されること', () => {
    const mock = createMockResult()

    mock.tier2.isApplicable = false

    const wrapper = mount(OrganismsRackResult, {
      props: {
        result: mock,
        maxDepth: 80,
        mode: 'strong',
      },
      global: {
        stubs: commonStubs,
      },
    })

    const text = wrapper.text()

    expect(text).toContain('段積み不可')
  })

  it('結果がnullの場合に空状態として描画されること', () => {
    const wrapper = mount(OrganismsRackResult, {
      props: {
        result: null,
        maxDepth: 80,
      },
      global: {
        stubs: commonStubs,
      },
    })

    const resultBoxes = wrapper.findAllComponents(commonStubs.MoleculesResultBox)

    expect(resultBoxes.length).toBe(2)
    expect(resultBoxes[0].props('isEmpty')).toBe(true)
    expect(resultBoxes[1].props('isEmpty')).toBe(true)
  })
})
