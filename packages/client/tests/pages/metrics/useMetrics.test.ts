import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent, type ShallowUnwrapRef } from 'vue'
import { createI18n } from 'vue-i18n'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../../src/api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../src/api/client')>()
  return { ...actual, api: { metrics: { get: vi.fn() } } }
})

import { api } from '../../../src/api/client'
import { useMetrics } from '../../../src/pages/metrics/useMetrics'

// The instance proxy unwraps the refs that useMetrics returns.
type Metrics = ShallowUnwrapRef<ReturnType<typeof useMetrics>>

const occupancy = (year: number, month: number, occupancyRate: number) => ({
  year, month, occupancyRate, bookedNights: 0, totalNights: 30,
})
const revenue = (year: number, month: number, rev: number, cumulative: number) => ({
  year, month, revenue: rev, cumulativeRevenue: cumulative,
})

const THIS_YEAR = new Date().getFullYear()

async function setup(locale = 'en'): Promise<Metrics> {
  const i18n = createI18n({ legacy: false, locale, fallbackLocale: 'en', messages: { en: {}, es: {} } })
  const Host = defineComponent({ setup: () => useMetrics(), template: '<div />' })
  const wrapper = mount(Host, { global: { plugins: [i18n] } })
  await flushPromises()
  return wrapper.vm as unknown as Metrics
}

beforeEach(() => {
  vi.mocked(api.metrics.get).mockReset()
  vi.mocked(api.metrics.get).mockResolvedValue({ occupancy: [], revenue: [] })
})

describe('useMetrics — loading', () => {
  it('fetches metrics on mount', async () => {
    await setup()
    expect(api.metrics.get).toHaveBeenCalledOnce()
  })

  it('stores the fetched payload', async () => {
    const payload = { occupancy: [occupancy(THIS_YEAR, 1, 50)], revenue: [] }
    vi.mocked(api.metrics.get).mockResolvedValue(payload)

    expect((await setup()).metrics).toEqual(payload)
  })

  it('leaves metrics null and stays usable when the request fails', async () => {
    vi.mocked(api.metrics.get).mockRejectedValue(new Error('boom'))

    const m = await setup()

    expect(m.metrics).toBeNull()
    expect(m.availableYears).toEqual([])
    expect(m.occupancyForYear).toEqual([])
    expect(m.revenueForYear).toEqual([])
    expect(m.avgOccupancy).toBe(0)
    expect(m.totalRevenue).toBe(0)
  })

  it('clears the loading flag once resolved', async () => {
    expect((await setup()).loading).toBe(false)
  })
})

describe('useMetrics — data slices', () => {
  it('lists the distinct years present, sorted', async () => {
    vi.mocked(api.metrics.get).mockResolvedValue({
      occupancy: [occupancy(2026, 1, 10), occupancy(2024, 1, 10), occupancy(2026, 2, 10)],
      revenue: [],
    })

    expect((await setup()).availableYears).toEqual([2024, 2026])
  })

  it('filters occupancy and revenue to the selected year', async () => {
    vi.mocked(api.metrics.get).mockResolvedValue({
      occupancy: [occupancy(THIS_YEAR, 1, 80), occupancy(THIS_YEAR - 1, 1, 20)],
      revenue: [revenue(THIS_YEAR, 1, 500, 500), revenue(THIS_YEAR - 1, 1, 100, 100)],
    })

    const m = await setup()

    expect(m.occupancyForYear).toHaveLength(1)
    expect(m.occupancyForYear[0]!.occupancyRate).toBe(80)
    expect(m.revenueForYear).toHaveLength(1)
    expect(m.revenueForYear[0]!.revenue).toBe(500)
  })

  it('follows selectedYear when it changes', async () => {
    vi.mocked(api.metrics.get).mockResolvedValue({
      occupancy: [occupancy(THIS_YEAR, 1, 80), occupancy(THIS_YEAR - 1, 1, 20)],
      revenue: [],
    })

    const m = await setup()
    m.selectedYear = THIS_YEAR - 1

    expect(m.occupancyForYear[0]!.occupancyRate).toBe(20)
  })
})

describe('useMetrics — KPIs', () => {
  it('sums revenue for the selected year', async () => {
    vi.mocked(api.metrics.get).mockResolvedValue({
      occupancy: [],
      revenue: [revenue(THIS_YEAR, 1, 500, 500), revenue(THIS_YEAR, 2, 250, 750)],
    })

    expect((await setup()).totalRevenue).toBe(750)
  })

  it('averages occupancy over the reported months only', async () => {
    vi.mocked(api.metrics.get).mockResolvedValue({
      occupancy: [occupancy(THIS_YEAR, 1, 60), occupancy(THIS_YEAR, 2, 40)],
      revenue: [],
    })

    expect((await setup()).avgOccupancy).toBe(50)
  })

  it('reports zero average when the year has no data', async () => {
    expect((await setup()).avgOccupancy).toBe(0)
  })
})

describe('useMetrics — twelve-month grids', () => {
  it('pads occupancy to twelve months with zeros', async () => {
    vi.mocked(api.metrics.get).mockResolvedValue({
      occupancy: [occupancy(THIS_YEAR, 3, 75)],
      revenue: [],
    })

    const all = (await setup()).occupancyAll

    expect(all).toHaveLength(12)
    expect(all[2]!.occupancyRate).toBe(75)
    expect(all[0]).toEqual({ year: THIS_YEAR, month: 1, occupancyRate: 0, bookedNights: 0, totalNights: 0 })
  })

  it('pads revenue to twelve months with zeros', async () => {
    vi.mocked(api.metrics.get).mockResolvedValue({
      occupancy: [],
      revenue: [revenue(THIS_YEAR, 6, 900, 900)],
    })

    const all = (await setup()).revenueAll

    expect(all).toHaveLength(12)
    expect(all[5]!.revenue).toBe(900)
    expect(all[11]).toEqual({ year: THIS_YEAR, month: 12, revenue: 0, cumulativeRevenue: 0 })
  })
})

describe('useMetrics — chart geometry', () => {
  it('builds one occupancy bar per month, tagged with tier and month name', async () => {
    vi.mocked(api.metrics.get).mockResolvedValue({
      occupancy: [occupancy(THIS_YEAR, 1, 80), occupancy(THIS_YEAR, 2, 50), occupancy(THIS_YEAR, 3, 10)],
      revenue: [],
    })

    const bars = (await setup()).occBars

    expect(bars).toHaveLength(12)
    expect(bars.map((b) => b.tier).slice(0, 4)).toEqual(['high', 'mid', 'low', 'low'])
    expect(bars[0]!.rate).toBe(80)
    expect(bars[0]!.month).toMatch(/^Jan/)
  })

  it('localises bar month names', async () => {
    const en = await setup('en')
    const es = await setup('es')

    expect(es.occBars[0]!.month).not.toBe(en.occBars[0]!.month)
  })

  it('scales revenue bars against the busiest month', async () => {
    vi.mocked(api.metrics.get).mockResolvedValue({
      occupancy: [],
      revenue: [revenue(THIS_YEAR, 1, 1000, 1000), revenue(THIS_YEAR, 2, 500, 1500)],
    })

    const bars = (await setup()).revBars

    expect(bars).toHaveLength(12)
    expect(bars[0]!.revenue).toBe(1000)
    expect(bars[1]!.h).toBeCloseTo(bars[0]!.h / 2)
  })

  it('keeps revenue bars finite when every month is zero', async () => {
    const bars = (await setup()).revBars

    expect(bars.every((b) => Number.isFinite(b.h))).toBe(true)
    expect(bars.every((b) => b.h === 0)).toBe(true)
  })

  it('builds the cumulative line with a point per month', async () => {
    vi.mocked(api.metrics.get).mockResolvedValue({
      occupancy: [],
      revenue: [revenue(THIS_YEAR, 1, 500, 500), revenue(THIS_YEAR, 2, 250, 750)],
    })

    const line = (await setup()).cumLine

    expect(line.pts).toHaveLength(12)
    expect(line.pts[0]!.cum).toBe(500)
    expect(line.pts[1]!.cum).toBe(750)
    expect(line.path.startsWith('M ')).toBe(true)
  })

  it('exposes gridlines and canvas constants for the SVG', async () => {
    const m = await setup()

    expect(m.gridLines).toHaveLength(5)
    expect(m.CW).toBe(600)
    expect(m.CH).toBe(180)
    expect(m.PAD).toEqual({ t: 10, r: 16, b: 38, l: 38 })
  })
})

describe('useMetrics — occupancy ring', () => {
  const circumference = 2 * Math.PI * 34

  it('fills the ring in proportion to average occupancy', async () => {
    vi.mocked(api.metrics.get).mockResolvedValue({
      occupancy: [occupancy(THIS_YEAR, 1, 50)],
      revenue: [],
    })

    const m = await setup()

    expect(m.RING_R).toBe(34)
    expect(m.ringDash).toBeCloseTo(circumference / 2)
    expect(m.ringDash + m.ringGap).toBeCloseTo(circumference)
  })

  it('leaves the ring empty with no data', async () => {
    const m = await setup()

    expect(m.ringDash).toBe(0)
    expect(m.ringGap).toBeCloseTo(circumference)
  })
})

describe('useMetrics — formatters', () => {
  it('exposes a locale-aware month name helper', async () => {
    expect((await setup('en')).monthName(1)).toMatch(/^Jan/)
    expect((await setup('es')).monthName(1)).not.toMatch(/^Jan/)
  })

  it('exposes the revenue formatter', async () => {
    expect((await setup()).fmtRevenue(12_345)).toBe('12.3k')
  })
})
