<script setup lang="ts">
import { useHead } from '#app';
import PortalPhaseExamTemplate from '~/components/portal/PortalPhaseExamTemplate.vue';
import { PHASE2_HEADERS } from '~/utils/constants/portal';

useHead({ title: 'Phase 2 - Elec-Console' });
</script>

<template>
  <PortalPhaseExamTemplate 
    :phase="2"
    title="Phase 2: 絶縁抵抗測定"
    icon="activity"
    :headers="PHASE2_HEADERS"
    unit="MΩ"
  />
</template>
