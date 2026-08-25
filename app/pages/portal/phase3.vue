<script setup lang="ts">
import { useHead } from '#app';
import PortalPhaseExamTemplate from '~/components/portal/PortalPhaseExamTemplate.vue';
import { PHASE3_HEADERS } from '~/utils/constants/portal';

useHead({ title: 'Phase 3 - Elec-Console' });
</script>

<template>
  <PortalPhaseExamTemplate 
    :phase="3"
    title="Phase 3: 電圧・相回転測定"
    icon="zap"
    :headers="PHASE3_HEADERS"
    unit="V"
  />
</template>
