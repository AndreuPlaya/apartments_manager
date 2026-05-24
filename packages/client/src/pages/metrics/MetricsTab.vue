<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import type { MetricsData } from '../../api/client'
import { api } from '../../api/client'
import { useAsyncOp } from '../../composables/useAsyncOp'

const { loading, run } = useAsyncOp()
const metrics = ref<MetricsData | null>(null)
const selectedYear = ref(new Date().getFullYear())

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

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
      <h3>Metrics</h3>
      <div class="page-header__spacer" />
      <select v-model="selectedYear" style="width: auto">
        <option v-for="y in availableYears" :key="y" :value="y">{{ y }}</option>
      </select>
    </div>

    <div v-if="loading" class="empty-state"><p>Loading…</p></div>
    <div v-else-if="!metrics" class="empty-state"><p>No metrics data.</p></div>
    <div v-else>
      <!-- Year summary -->
      <div class="summary-strip" style="margin-bottom: 1.5rem">
        <div class="stat-card">
          <div class="stat-card__value">€{{ totalRevenue.toFixed(0) }}</div>
          <div class="stat-card__label">Total revenue {{ selectedYear }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-card__value">{{ avgOccupancy.toFixed(1) }}%</div>
          <div class="stat-card__label">Avg occupancy {{ selectedYear }}</div>
        </div>
      </div>

      <!-- Occupancy table -->
      <h4 style="margin-bottom: 0.75rem">Occupancy</h4>
      <div class="table-wrap" style="margin-bottom: 1.5rem">
        <table>
          <thead>
            <tr>
              <th>Month</th>
              <th>Booked nights</th>
              <th>Total nights</th>
              <th>Occupancy rate</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="o in occupancyForYear" :key="`${o.year}-${o.month}`">
              <td>{{ MONTHS[o.month - 1] }}</td>
              <td>{{ o.bookedNights }}</td>
              <td>{{ o.totalNights }}</td>
              <td>{{ o.occupancyRate.toFixed(1) }}%</td>
            </tr>
            <tr v-if="occupancyForYear.length === 0">
              <td colspan="4" class="text-muted" style="text-align: center">No data</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Revenue table -->
      <h4 style="margin-bottom: 0.75rem">Revenue</h4>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Month</th>
              <th>Revenue</th>
              <th>Cumulative</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in revenueForYear" :key="`${r.year}-${r.month}`">
              <td>{{ MONTHS[r.month - 1] }}</td>
              <td>€{{ r.revenue.toFixed(2) }}</td>
              <td>€{{ r.cumulativeRevenue.toFixed(2) }}</td>
            </tr>
            <tr v-if="revenueForYear.length === 0">
              <td colspan="3" class="text-muted" style="text-align: center">No data</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
