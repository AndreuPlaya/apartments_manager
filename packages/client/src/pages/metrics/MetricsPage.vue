<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import MetricsTab from './MetricsTab.vue'

const { t } = useI18n()
</script>

<template>
  <div class="page-container">
    <h2 style="margin-bottom: 1rem">{{ t('metrics.title') }}</h2>
    <MetricsTab />
  </div>
</template>
