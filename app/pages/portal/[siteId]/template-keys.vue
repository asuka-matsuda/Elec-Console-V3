<script setup lang="ts">
/**
 * テンプレート置換キー一覧ページ (旧URL互換リダイレクト)
 * /portal/:siteId/template-keys -> /portal/:siteId/reports?tab=keys
 */
import { navigateTo, useRoute } from '#app'

const route = useRoute()
const siteId = route.params.siteId as string

await navigateTo(`/portal/${siteId}/reports?tab=keys`, { replace: true })
</script>

<template>
  <div />
</template>
