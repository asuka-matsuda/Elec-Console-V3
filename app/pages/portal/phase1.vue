<script setup lang="ts">
import { useHead } from '#app';
import PortalPhaseExamTemplate from '~/components/portal/PortalPhaseExamTemplate.vue';
import { PHASE1_HEADERS } from '~/utils/constants/portal';

useHead({ title: 'Phase 1 - Elec-Console' });
</script>

<template>
  <PortalPhaseExamTemplate 
    :phase="1"
    title="Phase 1: 盤内チェック・外観検査"
    icon="check-square"
    :headers="PHASE1_HEADERS"
  />
</template>
