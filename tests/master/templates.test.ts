/**
 * マスター帳票テンプレート管理の単体テスト
 */
import { describe, expect, it } from 'vitest'

import { REPORT_TEMPLATE_DEFINITIONS } from '../../app/constants/reportTemplates'
import {
  deleteMasterTemplate,
  deleteMasterTemplateItem,
  getAllMasterTemplateItems,
  getAllMasterTemplatesMeta,
  getMasterTemplateFilePath,
  saveMasterTemplate,
  saveMasterTemplateItem,
} from '../../server/utils/masterTemplates'

describe('Master Templates Definition & Storage', () => {
  it('should define all 4 required report template formats with keys', () => {
    expect(REPORT_TEMPLATE_DEFINITIONS).toHaveLength(4)

    const ids = REPORT_TEMPLATE_DEFINITIONS.map(d => d.id)

    expect(ids).toContain('tag')
    expect(ids).toContain('socket-tepra')
    expect(ids).toContain('exam')
    expect(ids).toContain('remote')

    // 各テンプレートが使用可能キーを定義しているか
    for (const def of REPORT_TEMPLATE_DEFINITIONS) {
      expect(def.availableKeys.length).toBeGreaterThan(0)
      for (const keyDef of def.availableKeys) {
        expect(keyDef.key).toMatch(/^%.+%$/)
        expect(keyDef.label).toBeTruthy()
        expect(keyDef.sample).toBeTruthy()
      }
    }
  })

  it('should save, retrieve, and delete a template file correctly in storage', async () => {
    const dummyBuffer = Buffer.from('dummy excel content')
    const originalFilename = 'test-tepra-template.xlsx'

    // 保存
    const saved = await saveMasterTemplate('socket-tepra', dummyBuffer, originalFilename)

    expect(saved.filename).toBe(originalFilename)
    expect(saved.size).toBe(dummyBuffer.length)

    // ファイルパス取得
    const filePath = getMasterTemplateFilePath('socket-tepra')

    expect(filePath).toBeTruthy()
    expect(filePath).toContain('socket-tepra.xlsx')

    // 一覧メタデータ取得
    const allMeta = getAllMasterTemplatesMeta()

    expect(allMeta['socket-tepra']).toBeDefined()
    expect(allMeta['socket-tepra'].filename).toBe(originalFilename)

    // 削除
    const deleted = await deleteMasterTemplate('socket-tepra')

    expect(deleted).toBe(true)

    // 削除後の確認
    const afterDeletePath = getMasterTemplateFilePath('socket-tepra')

    expect(afterDeletePath).toBeNull()

    const allMetaAfter = getAllMasterTemplatesMeta()

    expect(allMetaAfter['socket-tepra']).toBeUndefined()
  })

  it('should support multi-template registration and site assignment filtering', async () => {
    const dummyBuffer = Buffer.from('excel-binary')

    // 1. 全現場共通テンプレートの登録
    const tpl1 = await saveMasterTemplateItem({
      id: 'tpl-test-all',
      name: '全現場共通 線名札',
      logicType: 'tag',
      logicFile: 'kfc-3350',
      isAllSites: true,
      assignedSiteIds: [],
      fileBuffer: dummyBuffer,
      originalFilename: 'common-tag.xlsx',
    })

    expect(tpl1.id).toBe('tpl-test-all')
    expect(tpl1.logicFile).toBe('kfc-3350')
    expect(tpl1.isAllSites).toBe(true)

    // 2. 特定現場専用テンプレートの登録
    const tpl2 = await saveMasterTemplateItem({
      id: 'tpl-test-siteA',
      name: '現場A専用 試験記録',
      logicType: 'exam',
      isAllSites: false,
      assignedSiteIds: ['site-A'],
      fileBuffer: dummyBuffer,
      originalFilename: 'siteA-exam.xlsx',
    })

    expect(tpl2.id).toBe('tpl-test-siteA')
    expect(tpl2.isAllSites).toBe(false)
    expect(tpl2.assignedSiteIds).toContain('site-A')

    // 3. 全件取得（フィルターなし）
    const allItems = getAllMasterTemplateItems()
    const allIds = allItems.map(i => i.id)

    expect(allIds).toContain('tpl-test-all')
    expect(allIds).toContain('tpl-test-siteA')

    // 4. site-A 向け取得（全現場共通 + site-A 専用が含まれる）
    const siteAItems = getAllMasterTemplateItems('site-A')
    const siteAIds = siteAItems.map(i => i.id)

    expect(siteAIds).toContain('tpl-test-all')
    expect(siteAIds).toContain('tpl-test-siteA')

    // 5. site-B 向け取得（全現場共通のみ含まれ、site-A専用は含まれない）
    const siteBItems = getAllMasterTemplateItems('site-B')
    const siteBIds = siteBItems.map(i => i.id)

    expect(siteBIds).toContain('tpl-test-all')
    expect(siteBIds).not.toContain('tpl-test-siteA')

    // 後片付け
    await deleteMasterTemplateItem('tpl-test-all')
    await deleteMasterTemplateItem('tpl-test-siteA')
  })

  it('should reject invalid template IDs with path traversal attempts', async () => {
    const dummyBuffer = Buffer.from('excel-binary')

    await expect(saveMasterTemplateItem({
      id: '../../malicious',
      name: 'Traveral Template',
      logicType: 'tag',
      fileBuffer: dummyBuffer,
      originalFilename: 'test.xlsx',
    })).rejects.toThrow('無効なテンプレートIDです')

    await expect(saveMasterTemplateItem({
      id: 'template/nested',
      name: 'Nested Template',
      logicType: 'tag',
      fileBuffer: dummyBuffer,
      originalFilename: 'test.xlsx',
    })).rejects.toThrow('無効なテンプレートIDです')

    expect(await deleteMasterTemplateItem('../malicious')).toBe(false)
  })
})
