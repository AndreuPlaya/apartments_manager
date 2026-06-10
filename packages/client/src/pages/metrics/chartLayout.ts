export interface BarRect {
  x: number
  y: number
  w: number
  h: number
  cx: number
  labelY: number
}

export interface GridLine {
  y: number
}

export interface LinePoint {
  x: number
  y: number
}

export interface SmoothLine {
  path: string
  pts: LinePoint[]
}

interface Padding {
  t: number
  r: number
  b: number
  l: number
}

/**
 * Immutable SVG coordinate system for a bar/line chart.
 * All methods are pure — no Vue reactivity involved.
 */
export class ChartLayout {
  readonly cw: number
  readonly ch: number
  readonly pad: Padding
  readonly pw: number
  readonly ph: number

  constructor(
    cw = 600,
    ch = 180,
    pad: Padding = { t: 10, r: 16, b: 38, l: 38 },
  ) {
    this.cw = cw
    this.ch = ch
    this.pad = pad
    this.pw = cw - pad.l - pad.r
    this.ph = ch - pad.t - pad.b
  }

  /** Evenly-spaced horizontal gridlines (steps + 1 lines from top to bottom of plot). */
  gridLines(steps = 4): GridLine[] {
    return Array.from({ length: steps + 1 }, (_, i) => ({
      y: this.pad.t + this.ph * (i / steps),
    }))
  }

  /** Centre x of every slot in an n-column layout. */
  private slotCenters(n: number): number[] {
    const slotW = this.pw / n
    return Array.from({ length: n }, (_, i) => this.pad.l + slotW * i + slotW / 2)
  }

  /**
   * Build bar rectangles from raw values.
   * `max` is the scale ceiling (e.g. 100 for percentages, or Math.max(...values)).
   * Values equal to 0 produce zero-height bars; values > 0 get a 2px minimum height.
   */
  bars(values: number[], max: number, fillRatio = 0.58): BarRect[] {
    const slotW = this.pw / values.length
    const barW = slotW * fillRatio
    const safeMax = Math.max(max, 1)
    const centers = this.slotCenters(values.length)
    return values.map((v, i) => {
      const barH = Math.max(v > 0 ? 2 : 0, this.ph * (v / safeMax))
      const cx = centers[i]
      return {
        x: cx - barW / 2,
        y: this.pad.t + this.ph - barH,
        w: barW,
        h: barH,
        cx,
        labelY: this.pad.t + this.ph + 18,
      }
    })
  }

  /**
   * Build a smooth cubic Bézier SVG path and point array for a line chart.
   * `max` is the scale ceiling; values are mapped to the plot height.
   */
  smoothLine(values: number[], max: number): SmoothLine {
    const safeMax = Math.max(max, 1)
    const centers = this.slotCenters(values.length)
    const pts: LinePoint[] = values.map((v, i) => ({
      x: centers[i],
      y: this.pad.t + this.ph * (1 - v / safeMax),
    }))
    const path = pts
      .map((p, i) => {
        if (i === 0) return `M ${p.x} ${p.y}`
        const prev = pts[i - 1]
        const cpx = (prev.x + p.x) / 2
        return `C ${cpx} ${prev.y} ${cpx} ${p.y} ${p.x} ${p.y}`
      })
      .join(' ')
    return { path, pts }
  }
}
