import { describe, expect, it } from 'vitest'
import { ChartLayout } from '../../../src/pages/metrics/chartLayout'

// Default geometry: 600x180 canvas, padding { t:10, r:16, b:38, l:38 }
// => plot area 546 wide, 132 tall, starting at x=38, y=10.
const layout = new ChartLayout()

describe('ChartLayout construction', () => {
  it('derives the plot area from canvas size and padding', () => {
    expect(layout.pw).toBe(600 - 38 - 16)
    expect(layout.ph).toBe(180 - 10 - 38)
  })

  it('accepts a custom canvas and padding', () => {
    const custom = new ChartLayout(200, 100, { t: 5, r: 5, b: 5, l: 5 })

    expect(custom.cw).toBe(200)
    expect(custom.ch).toBe(100)
    expect(custom.pw).toBe(190)
    expect(custom.ph).toBe(90)
  })
})

describe('gridLines', () => {
  it('returns steps + 1 lines spanning the plot area', () => {
    const lines = layout.gridLines(4)

    expect(lines).toHaveLength(5)
    expect(lines[0]!.y).toBe(layout.pad.t)
    expect(lines[4]!.y).toBe(layout.pad.t + layout.ph)
  })

  it('spaces the lines evenly', () => {
    const lines = layout.gridLines(4)
    const gaps = lines.slice(1).map((l, i) => l.y - lines[i]!.y)

    expect(new Set(gaps.map((g) => g.toFixed(6))).size).toBe(1)
  })

  it('supports a different number of steps', () => {
    expect(layout.gridLines(2)).toHaveLength(3)
  })
})

describe('bars', () => {
  it('centres each bar in its slot', () => {
    const [first, second] = layout.bars([50, 50], 100)
    const slotW = layout.pw / 2

    expect(first!.cx).toBeCloseTo(layout.pad.l + slotW / 2)
    expect(second!.cx).toBeCloseTo(layout.pad.l + slotW + slotW / 2)
  })

  it('scales height against the given max', () => {
    const [full, half] = layout.bars([100, 50], 100)

    expect(full!.h).toBeCloseTo(layout.ph)
    expect(half!.h).toBeCloseTo(layout.ph / 2)
  })

  it('anchors bars to the bottom of the plot area', () => {
    const [bar] = layout.bars([100], 100)

    expect(bar!.y).toBeCloseTo(layout.pad.t)
    expect(bar!.y + bar!.h).toBeCloseTo(layout.pad.t + layout.ph)
  })

  it('gives a zero value no height at all', () => {
    expect(layout.bars([0], 100)[0]!.h).toBe(0)
  })

  it('gives a tiny non-zero value a visible 2px minimum', () => {
    expect(layout.bars([0.0001], 100)[0]!.h).toBe(2)
  })

  it('treats a max of zero as one so bars never blow up', () => {
    const [bar] = layout.bars([0], 0)

    expect(Number.isFinite(bar!.h)).toBe(true)
    expect(bar!.h).toBe(0)
  })

  it('applies the fill ratio to bar width', () => {
    const slotW = layout.pw / 4

    expect(layout.bars([1, 1, 1, 1], 1)[0]!.w).toBeCloseTo(slotW * 0.58)
    expect(layout.bars([1, 1, 1, 1], 1, 1)[0]!.w).toBeCloseTo(slotW)
  })

  it('puts every label on the same baseline below the plot', () => {
    const bars = layout.bars([10, 90], 100)

    expect(bars[0]!.labelY).toBe(layout.pad.t + layout.ph + 18)
    expect(bars[1]!.labelY).toBe(bars[0]!.labelY)
  })
})

describe('smoothLine', () => {
  it('produces one point per value, aligned with bar centres', () => {
    const { pts } = layout.smoothLine([10, 20, 30], 100)
    const barCenters = layout.bars([10, 20, 30], 100).map((b) => b.cx)

    expect(pts).toHaveLength(3)
    expect(pts.map((p) => p.x)).toEqual(barCenters)
  })

  it('maps the max value to the top and zero to the bottom of the plot', () => {
    const { pts } = layout.smoothLine([0, 100], 100)

    expect(pts[0]!.y).toBeCloseTo(layout.pad.t + layout.ph)
    expect(pts[1]!.y).toBeCloseTo(layout.pad.t)
  })

  it('starts the path with a move and joins the rest with cubic curves', () => {
    const { path } = layout.smoothLine([10, 20, 30], 100)

    expect(path.startsWith('M ')).toBe(true)
    expect(path.match(/C /g)).toHaveLength(2)
  })

  it('emits a bare move command for a single value', () => {
    const { path } = layout.smoothLine([10], 100)

    expect(path).toMatch(/^M [\d.]+ [\d.]+$/)
  })

  it('produces an empty path for no values', () => {
    expect(layout.smoothLine([], 100)).toEqual({ path: '', pts: [] })
  })

  it('treats a max of zero as one so points stay finite', () => {
    const { pts } = layout.smoothLine([0, 0], 0)

    expect(pts.every((p) => Number.isFinite(p.y))).toBe(true)
  })
})
