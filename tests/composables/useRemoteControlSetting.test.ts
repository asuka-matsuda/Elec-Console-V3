import { describe, expect, it, vi } from 'vitest'

import { useRemoteControlSetting } from '../../app/composables/portal/useRemoteControlSetting'

// NuxtAppモック
vi.mock('#app', () => ({
  useNuxtApp: () => ({
    $api: vi.fn(),
  }),
}))

describe('useRemoteControlSetting', () => {
  it('assignGroup / removeGroup でグループ番号が正しく追加・解除・ソートされること', () => {
    const { config, assignGroup, removeGroup } = useRemoteControlSetting('test-site')

    // 1-1, 1-2 に G1 を割り当て
    assignGroup(['1-1', '1-2'], 1)
    expect(config.value.assignments['1-1'].groups).toEqual([1])
    expect(config.value.assignments['1-2'].groups).toEqual([1])

    // 1-1 に G3 を追加割り当て（昇順ソートされること）
    assignGroup(['1-1'], 3)
    expect(config.value.assignments['1-1'].groups).toEqual([1, 3])

    // 重複追加しても1つだけ保持されること
    assignGroup(['1-1'], 1)
    expect(config.value.assignments['1-1'].groups).toEqual([1, 3])

    // G1 を解除
    removeGroup('1-1', 1)
    expect(config.value.assignments['1-1'].groups).toEqual([3])
  })

  it('assignPattern / removePattern でパターンが正しく追加・解除されること', () => {
    const { config, assignPattern, removePattern } = useRemoteControlSetting('test-site')

    assignPattern(['1-1', '2-1'], 'P1 ON')
    expect(config.value.assignments['1-1'].patterns).toEqual(['P1 ON'])
    expect(config.value.assignments['2-1'].patterns).toEqual(['P1 ON'])

    assignPattern(['1-1'], 'P2 OFF')
    expect(config.value.assignments['1-1'].patterns).toEqual(['P1 ON', 'P2 OFF'])

    removePattern('1-1', 'P1 ON')
    expect(config.value.assignments['1-1'].patterns).toEqual(['P2 OFF'])
  })

  it('clearSelectedAssignments で選択したアドレスの割り当てが一括クリアされること', () => {
    const { config, assignGroup, assignPattern, clearSelectedAssignments } = useRemoteControlSetting('test-site')

    assignGroup(['1-1', '1-2'], 1)
    assignPattern(['1-1'], 'P1 ON')

    clearSelectedAssignments(['1-1'])
    expect(config.value.assignments['1-1'].groups).toEqual([])
    expect(config.value.assignments['1-1'].patterns).toEqual([])
    expect(config.value.assignments['1-2'].groups).toEqual([1])
  })

  it('activeGroups / activePatterns が所属アドレスのあるもののみ正しくフィルタされること', () => {
    const { activeGroups, activePatterns, assignGroup, assignPattern } = useRemoteControlSetting('test-site')

    expect(activeGroups.value).toHaveLength(0)
    expect(activePatterns.value).toHaveLength(0)

    assignGroup(['1-1', '1-2'], 5)
    assignPattern(['2-1'], 'P3 ON')

    expect(activeGroups.value).toHaveLength(1)
    expect(activeGroups.value[0].groupKey).toBe('G5')
    expect(activeGroups.value[0].addresses).toEqual(['1-1', '1-2'])
    expect(activeGroups.value[0].addressText).toBe('1-1  1-2')

    expect(activePatterns.value).toHaveLength(1)
    expect(activePatterns.value[0].patternKey).toBe('P3 ON')
    expect(activePatterns.value[0].addresses).toEqual(['2-1'])
  })
})
