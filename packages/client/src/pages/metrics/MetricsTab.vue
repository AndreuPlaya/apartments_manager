<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { MetricsData } from '../../api/client'
import { api } from '../../api/client'
import { useAsyncOp } from '../../composables/useAsyncOp'

const { t, locale } = useI18n()
const { loading, run } = useAsyncOp()
const metrics = ref<MetricsData | null>(null)
const selectedYear = ref(new Date().getFullYear())

function monthName(monthIndex: number): string {
  return new Date(2024, monthIndex - 1).toLocaleDateString(locale.value, { month: 'short' })
}

async function load() {
  const res = await run(() => api.metrics.get())
  if (res) metrics.value = res
}

onMounted(load)

const availableYears = computed(() => {
  if (!metrics.value) return []
  return [...new Set(metrics.value.occupancy.map((o) => o.year))].sort()
})

const occupancyForYear = computed(() => {
  if (!metrics.value) return []
  return metrics.value.occupancy.filter((o) => o.year === selectedYear.value)
})

const revenueForYear = computed(() => {
  if (!metrics.value) return []
  return metrics.value.revenue.filter((r) => r.year === selectedYear.value)
})

const totalRevenue = computed(() => revenueForYear.value.reduce((s, r) => s + r.revenue, 0))
const avgOccupancy = computed(() => {
  const rows = occupancyForYear.value
  if (!rows.length) return 0
  return rows.reduce((s, r) => s + r.occupancyRate, 0) / rows.length
})
</script>

<template>
  <div>
    <div class="page-header">
      <h3>{{ t('metrics.title') }}</h3>
      <div class="page-header__spacer" />
      <select v-model="selectedYear" style="width: auto">
        <option v-for="y in availableYears" :key="y" :value="y">{{ y }}</option>
      </select>
    </div>

    <div v-if="loading" class="empty-state"><p>{{ t('common.loading') }}</p></div>
    <div v-else-if="!metrics" class="empty-state"><p>{{ t('metrics.noMetrics') }}</p></div>
    <div v-else>
      <!-- Year summary -->
      <div class="summary-strip" style="margin-bottom: 1.5rem">
        <div class="stat-card">
          <div class="stat-card__value">€{{ totalRevenue.toFixed(0) }}</div>
          <div class="stat-card__label">{{ t('metrics.totalRevenue', { year: selectedYear }) }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-card__value">{{ avgOccupancy.toFixed(1) }}%</div>
          <div class="stat-card__label">{{ t('metrics.avgOccupancy', { year: selectedYear }) }}</div>
        </div>
      </div>

      <!-- Occupancy table -->
      <h4 style="margin-bottom: 0.75rem">{{ t('metrics.occupancy') }}</h4>
      <div class="table-wrap" style="margin-bottom: 1.5rem">
        <table>
          <thead>
            <tr>
              <th>{{ t('metrics.month') }}</th>
              <th>{{ t('metrics.bookedNights') }}</th>
              <th>{{ t('metrics.totalNights') }}</th>
              <th>{{ t('metrics.occupancyRate') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="o in occupancyForYear" :key="`${o.year}-${o.month}`">
              <td>{{ monthName(o.month) }}</td>
              <td>{{ o.bookedNights }}</td>
              <td>{{ o.totalNights }}</td>
              <td>{{ o.occupancyRate.toFixed(1) }}%</td>
            </tr>
            <tr v-if="occupancyForYear.length === 0">
              <td colspan="4" class="text-muted" style="text-align: center">{{ t('metrics.noData') }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Revenue table -->
      <h4 style="margin-bottom: 0.75rem">{{ t('metrics.revenue') }}</h4>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>{{ t('metrics.month') }}</th>
              <th>{{ t('metrics.revenue') }}</th>
              <th>{{ t('metrics.cumulative') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in revenueForYear" :key="`${r.year}-${r.month}`">
              <td>{{ monthName(r.month) }}</td>
              <td>€{{ r.revenue.toFixed(2) }}</td>
              <td>€{{ r.cumulativeRevenue.toFixed(2) }}</td>
            </tr>
            <tr v-if="revenueForYear.length === 0">
              <td colspan="3" class="text-muted" style="text-align: center">{{ t('metrics.noData') }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
