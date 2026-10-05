<script setup lang="ts">
/**
 * タグ・線名札 Excel 帳票出力画面 (旧URL互換リダイレクト)
 * /portal/:siteId/tag-print -> /portal/:siteId/reports?tab=tag
 */
import { navigateTo, useRoute } from '#app'

const route = useRoute()
const siteId = route.params.siteId as string

await navigateTo(`/portal/${siteId}/reports?tab=tag`, { replace: true })
</script>

<template>
  <div />
</template>
