import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import type { MetricsData } from '../../api/client'
import { api } from '../../api/client'
import { useAsyncOp } from '../../composables/useAsyncOp'
import { ChartLayout } from './chartLayout'
import { fillMonths, formatRevenue, monthLabel, occupancyTier } from './metricsUtils'

// Shared layout instance — stateless and immutable, safe to reuse across calls.
const LAYOUT = new ChartLayout()

const RING_R = 34
const RING_CIRC = 2 * Math.PI * RING_R

export function useMetrics() {
  const { locale } = useI18n()
  const { loading, run } = useAsyncOp()
  const metrics = ref<MetricsData | null>(null)
  const selectedYear = ref(new Date().getFullYear())

  async function load() {
    const res = await run(() => api.metrics.get())
    if (res) metrics.value = res
  }

  onMounted(load)

  // ── Data slices ──────────────────────────────────────────────────────────────

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

  // ── KPI aggregates ───────────────────────────────────────────────────────────

  const totalRevenue = computed(() =>
    revenueForYear.value.reduce((s, r) => s + r.revenue, 0),
  )

  const avgOccupancy = computed(() => {
    const rows = occupancyForYear.value
    if (!rows.length) return 0
    return rows.reduce((s, r) => s + r.occupancyRate, 0) / rows.length
  })

  // ── Full 12-month arrays (missing months filled with zeros) ─────────────────

  const occupancyAll = computed(() =>
    fillMonths(
      occupancyForYear.value,
      selectedYear.value,
      (month, year) => ({ year, month, occupancyRate: 0, bookedNights: 0, totalNights: 0 }),
    ),
  )

  const revenueAll = computed(() =>
    fillMonths(
      revenueForYear.value,
      selectedYear.value,
      (month, year) => ({ year, month, revenue: 0, cumulativeRevenue: 0 }),
    ),
  )

  // ── Chart data ───────────────────────────────────────────────────────────────

  const gridLines = LAYOUT.gridLines()

  const occBars = computed(() => {
    const geom = LAYOUT.bars(
      occupancyAll.value.map((d) => d.occupancyRate),
      100,
    )
    return geom.map((rect, i) => {
      const d = occupancyAll.value[i]
      return {
        ...rect,
        rate: d.occupancyRate,
        month: monthLabel(d.month, locale.value),
        tier: occupancyTier(d.occupancyRate),
      }
    })
  })

  const revBars = computed(() => {
    const data = revenueAll.value
    const maxRev = Math.max(...data.map((d) => d.revenue), 1)
    const geom = LAYOUT.bars(data.map((d) => d.revenue), maxRev)
    return geom.map((rect, i) => ({
      ...rect,
      revenue: data[i].revenue,
      month: monthLabel(data[i].month, locale.value),
    }))
  })

  const cumLine = computed(() => {
    const data = revenueAll.value
    const maxCum = Math.max(...data.map((d) => d.cumulativeRevenue), 1)
    const { path, pts } = LAYOUT.smoothLine(
      data.map((d) => d.cumulativeRevenue),
      maxCum,
    )
    return {
      path,
      pts: pts.map((p, i) => ({ ...p, cum: data[i].cumulativeRevenue })),
    }
  })

  // ── Occupancy ring ───────────────────────────────────────────────────────────

  const ringDash = computed(() => (avgOccupancy.value / 100) * RING_CIRC)
  const ringGap = computed(() => RING_CIRC - ringDash.value)

  // ── Month strip helper ───────────────────────────────────────────────────────

  function monthName(monthIndex: number): string {
    return monthLabel(monthIndex, locale.value)
  }

  return {
    // state
    metrics,
    loading,
    selectedYear,
    // data slices
    availableYears,
    occupancyForYear,
    revenueForYear,
    // KPIs
    totalRevenue,
    avgOccupancy,
    // 12-month grids
    occupancyAll,
    revenueAll,
    // chart geometry
    gridLines,
    occBars,
    revBars,
    cumLine,
    // ring
    RING_R,
    ringDash,
    ringGap,
    // layout constants (for SVG attributes)
    CW: LAYOUT.cw,
    CH: LAYOUT.ch,
    PAD: LAYOUT.pad,
    // formatters
    monthName,
    fmtRevenue: formatRevenue,
  }
}
