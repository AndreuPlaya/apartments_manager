<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

defineProps<{
  arrivalCount: number
  departureCount: number
  occupiedCount: number
}>()
</script>

<template>
  <div class="summary-strip">
    <div class="stat-card">
      <div class="stat-card__value">{{ arrivalCount }}</div>
      <div class="stat-card__label">{{ t('dashboard.todayArrivals') }}</div>
    </div>
    <div class="stat-card">
      <div class="stat-card__value">{{ departureCount }}</div>
      <div class="stat-card__label">{{ t('dashboard.todayDepartures') }}</div>
    </div>
    <div class="stat-card">
      <div class="stat-card__value">{{ occupiedCount }}</div>
      <div class="stat-card__label">{{ t('dashboard.currentlyOccupied') }}</div>
    </div>
  </div>
</template>
