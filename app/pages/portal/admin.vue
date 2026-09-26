<script setup lang="ts">
/**
 * 現場管理コンソール
 * 現場管理者・マスター向けの現場プロジェクト管理画面。
 */
import { useHead } from '#app'

useHead({ title: '現場ポータル管理 - Elec-Console' })

definePageMeta({
  middleware: ['admin'],
})
</script>

<template>
  <PortalTabAdminSites />
</template>
