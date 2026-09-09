import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import OrganismsInfoAside from '../../app/components/OrganismsInfoAside.vue'
import type { AnnouncementItem, HistoryItem } from '../../app/types/components'

describe('OrganismsInfoAside.vue', () => {
  const mockAnnouncements: AnnouncementItem[] = [
    {
      title: '第1回 システムメンテナンスのお知らせ',
      date: '2026-09-01',
      desc: '定期メンテナンスを実施します。',
    },
    {
      title: '新機能リリース',
      date: '2026-09-05',
      desc: '配管計算機能が追加されました。',
    },
  ]

  const mockHistory: HistoryItem[] = [
    {
      version: 'v2.1.0',
      title: 'UIリニューアル完了',
      date: '2026-09-08',
      desc: 'Tailwind CSS完全移行とAtomic Design適用',
      status: 'success',
    },
    {
      version: 'v2.0.0',
      title: 'メジャーアップデート',
      date: '2026-08-15',
      desc: 'コンソール基盤刷新',
    },
  ]

  it('renders announcements and history items correctly', () => {
    const wrapper = mount(OrganismsInfoAside, {
      props: {
        announcements: mockAnnouncements,
        history: mockHistory,
      },
      global: {
        stubs: {
          MoleculesSectionHeader: true,
          AtomsPanel: {
            template: '<div class="panel-stub"><slot /></div>',
          },
          AtomsBadge: {
            template: '<span class="badge-stub"><slot /></span>',
          },
          AtomsIcon: true,
        },
      },
    })

    expect(wrapper.text()).toContain('第1回 システムメンテナンスのお知らせ')
    expect(wrapper.text()).toContain('定期メンテナンスを実施します。')
    expect(wrapper.text()).toContain('UIリニューアル完了')
    expect(wrapper.text()).toContain('v2.1.0')
  })

  it('renders loading status when pending is true', () => {
    const wrapper = mount(OrganismsInfoAside, {
      props: {
        pending: true,
      },
      global: {
        stubs: {
          MoleculesSectionHeader: true,
          AtomsPanel: {
            template: '<div class="panel-stub"><slot /></div>',
          },
          AtomsIcon: true,
        },
      },
    })

    expect(wrapper.text()).toContain('お知らせを読み込み中...')
    expect(wrapper.text()).toContain('更新履歴を読み込み中...')
  })

  it('renders empty status when no items are provided', () => {
    const wrapper = mount(OrganismsInfoAside, {
      props: {
        announcements: [],
        history: [],
      },
      global: {
        stubs: {
          MoleculesSectionHeader: true,
          AtomsPanel: {
            template: '<div class="panel-stub"><slot /></div>',
          },
          AtomsIcon: true,
        },
      },
    })

    expect(wrapper.text()).toContain('現在新しいお知らせはありません')
    expect(wrapper.text()).toContain('現在更新履歴はありません')
  })

  it('respects maxCount prop by limiting item count', () => {
    const manyAnnouncements: AnnouncementItem[] = Array.from({ length: 10 }, (_, i) => ({
      title: `Notice ${i + 1}`,
      date: '2026-09-01',
      desc: `Description ${i + 1}`,
    }))

    const wrapper = mount(OrganismsInfoAside, {
      props: {
        announcements: manyAnnouncements,
        maxCount: 3,
      },
      global: {
        stubs: {
          MoleculesSectionHeader: true,
          AtomsPanel: {
            template: '<div class="panel-stub"><slot /></div>',
          },
          AtomsBadge: true,
          AtomsIcon: true,
        },
      },
    })

    expect(wrapper.text()).toContain('Notice 1')
    expect(wrapper.text()).toContain('Notice 2')
    expect(wrapper.text()).toContain('Notice 3')
    expect(wrapper.text()).not.toContain('Notice 4')
  })
})
