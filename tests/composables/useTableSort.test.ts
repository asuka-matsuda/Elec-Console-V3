import { describe, expect, it } from 'vitest'
import { ref } from 'vue'

import { useTableSort } from '../../app/composables/useTableSort'

describe('useTableSort', () => {
  const sampleData = [
    { id: '2', name: '東京現場', count: 20, createdAt: '2026-05-01' },
    { id: '1', name: '大阪現場', count: 100, createdAt: '2026-01-10' },
    { id: '3', name: '名古屋現場', count: 5, createdAt: '2026-08-30' },
  ]

  it('should sort numbers in asc/desc correctly', () => {
    const list = ref(sampleData)
    const { sortedData, handleSort, sortOrder } = useTableSort(list, {
      defaultKey: 'count',
      defaultOrder: 'asc',
    })

    expect(sortedData.value.map(d => d.count)).toEqual([5, 20, 100])

    handleSort({ key: 'count' })
    expect(sortOrder.value).toBe('desc')
    expect(sortedData.value.map(d => d.count)).toEqual([100, 20, 5])
  })

  it('should sort dates in asc/desc correctly', () => {
    const list = ref(sampleData)
    const { sortedData, handleSort } = useTableSort(list, {
      defaultKey: 'createdAt',
      defaultOrder: 'asc',
    })

    expect(sortedData.value.map(d => d.createdAt)).toEqual([
      '2026-01-10',
      '2026-05-01',
      '2026-08-30',
    ])

    handleSort({ key: 'createdAt', order: 'desc' })
    expect(sortedData.value.map(d => d.createdAt)).toEqual([
      '2026-08-30',
      '2026-05-01',
      '2026-01-10',
    ])
  })

  it('should sort strings in Japanese alphabetical order', () => {
    const list = ref(sampleData)
    const { sortedData } = useTableSort(list, {
      defaultKey: 'name',
      defaultOrder: 'asc',
    })

    // 大阪(O) -> 東京(T) -> 名古屋(N) (localeCompare ja)
    expect(sortedData.value[0].name).toBe('大阪現場')
  })

  it('should place null and undefined at the end', () => {
    const dataWithNull = [
      { id: '1', val: 50 },
      { id: '2', val: null },
      { id: '3', val: 10 },
    ]
    const { sortedData } = useTableSort(dataWithNull, {
      defaultKey: 'val',
      defaultOrder: 'asc',
    })

    expect(sortedData.value.map(d => d.val)).toEqual([10, 50, null])
  })
})
