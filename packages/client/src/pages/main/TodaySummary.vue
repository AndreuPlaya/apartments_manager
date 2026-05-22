<script setup lang="ts">
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
      <div class="stat-card__label">Today's arrivals</div>
    </div>
    <div class="stat-card">
      <div class="stat-card__value">{{ departureCount }}</div>
      <div class="stat-card__label">Today's departures</div>
    </div>
    <div class="stat-card">
      <div class="stat-card__value">{{ occupiedCount }}</div>
      <div class="stat-card__label">Currently occupied</div>
    </div>
  </div>
</template>
