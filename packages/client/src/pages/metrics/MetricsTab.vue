<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useMetrics } from './useMetrics'

const { t } = useI18n()
const {
  metrics,
  loading,
  selectedYear,
  availableYears,
  occupancyForYear,
  revenueForYear,
  totalRevenue,
  avgOccupancy,
  occupancyAll,
  revenueAll,
  gridLines,
  occBars,
  revBars,
  cumLine,
  RING_R,
  ringDash,
  ringGap,
  CW,
  CH,
  PAD,
  monthName,
  fmtRevenue,
} = useMetrics()
</script>

<template>
  <div class="ms">
    <!-- Year tabs -->
    <div v-if="availableYears.length" class="ms__years">
      <button
        v-for="y in availableYears"
        :key="y"
        :class="['ms__year-btn', { 'ms__year-btn--active': y === selectedYear }]"
        @click="selectedYear = y"
      >
        {{ y }}
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="empty-state">
      <p>{{ t('common.loading') }}</p>
    </div>

    <template v-else-if="metrics">
      <!-- KPI Row -->
      <div class="ms__kpis">
        <div class="ms__kpi ms__kpi--rev">
          <div class="ms__kpi-label">
            {{ t('metrics.totalRevenue', { year: selectedYear }) }}
          </div>
          <div class="ms__kpi-num ms__kpi-num--rev">
            <sup class="ms__kpi-sup">€</sup>{{ fmtRevenue(totalRevenue) }}
          </div>
          <div class="ms__kpi-sub">{{ revenueForYear.length }}&thinsp;months recorded</div>
        </div>

        <div class="ms__kpi ms__kpi--occ">
          <div class="ms__kpi-label">
            {{ t('metrics.avgOccupancy', { year: selectedYear }) }}
          </div>
          <div class="ms__kpi-ring-row">
            <div>
              <div class="ms__kpi-num ms__kpi-num--occ">
                {{ avgOccupancy.toFixed(1) }}<sup class="ms__kpi-sup">%</sup>
              </div>
              <div class="ms__kpi-sub">{{ occupancyForYear.length }}&thinsp;months recorded</div>
            </div>
            <svg viewBox="0 0 80 80" class="ms__ring">
              <circle cx="40" cy="40" :r="RING_R" fill="none" stroke="var(--border)" stroke-width="5" />
              <circle
                cx="40" cy="40" :r="RING_R"
                fill="none"
                stroke="var(--success)"
                stroke-width="5"
                stroke-linecap="round"
                :stroke-dasharray="`${ringDash} ${ringGap}`"
                transform="rotate(-90 40 40)"
                class="ms__ring-arc"
              />
            </svg>
          </div>
        </div>
      </div>

      <!-- Charts -->
      <div class="ms__charts">
        <!-- Occupancy bars -->
        <div class="ms__chart">
          <div class="ms__chart-header">
            <span class="ms__chart-title">{{ t('metrics.occupancy') }}</span>
            <span class="ms__chart-sub-label">Monthly rate %</span>
          </div>
          <svg :viewBox="`0 0 ${CW} ${CH}`" class="ms__svg">
            <defs>
              <linearGradient id="ms-g-high" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="var(--accent)" />
                <stop offset="100%" stop-color="var(--accent)" stop-opacity="0.08" />
              </linearGradient>
              <linearGradient id="ms-g-mid" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="var(--warning)" />
                <stop offset="100%" stop-color="var(--warning)" stop-opacity="0.08" />
              </linearGradient>
              <linearGradient id="ms-g-low" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="var(--danger)" />
                <stop offset="100%" stop-color="var(--danger)" stop-opacity="0.08" />
              </linearGradient>
            </defs>
            <!-- Grid lines -->
            <line
              v-for="g in gridLines" :key="g.y"
              :x1="PAD.l" :y1="g.y" :x2="CW - PAD.r" :y2="g.y"
              class="ms__grid-line"
            />
            <!-- Bars -->
            <g v-for="b in occBars" :key="b.month" class="ms__bar-grp">
              <rect
                :x="b.x" :y="b.y" :width="b.w" :height="b.h"
                :fill="`url(#ms-g-${b.tier})`"
                rx="3"
                class="ms__bar"
              />
              <text :x="b.cx" :y="b.labelY" text-anchor="middle" class="ms__chart-label">
                {{ b.month }}
              </text>
            </g>
          </svg>
        </div>

        <!-- Revenue bars + cumulative line -->
        <div class="ms__chart">
          <div class="ms__chart-header">
            <span class="ms__chart-title">{{ t('metrics.revenue') }}</span>
            <div class="ms__chart-legend">
              <span class="ms__legend-bar">Monthly</span>
              <span class="ms__legend-line">Cumulative</span>
            </div>
          </div>
          <svg :viewBox="`0 0 ${CW} ${CH}`" class="ms__svg">
            <defs>
              <linearGradient id="ms-g-rev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="var(--success)" stop-opacity="0.55" />
                <stop offset="100%" stop-color="var(--success)" stop-opacity="0.04" />
              </linearGradient>
            </defs>
            <!-- Grid lines -->
            <line
              v-for="g in gridLines" :key="g.y"
              :x1="PAD.l" :y1="g.y" :x2="CW - PAD.r" :y2="g.y"
              class="ms__grid-line"
            />
            <!-- Revenue bars -->
            <rect
              v-for="b in revBars" :key="b.month"
              :x="b.x" :y="b.y" :width="b.w" :height="b.h"
              fill="url(#ms-g-rev)"
              rx="3"
              class="ms__bar"
            />
            <!-- Cumulative line -->
            <path
              :d="cumLine.path"
              fill="none"
              stroke="var(--success)"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <!-- Dots -->
            <circle
              v-for="pt in cumLine.pts" :key="pt.x"
              :cx="pt.x" :cy="pt.y"
              r="2.5"
              fill="var(--success)"
              :style="{ display: pt.cum > 0 ? '' : 'none' }"
            />
            <!-- Month labels -->
            <text
              v-for="b in revBars" :key="`rl-${b.month}`"
              :x="b.cx" :y="b.labelY"
              text-anchor="middle"
              class="ms__chart-label"
            >{{ b.month }}</text>
          </svg>
        </div>
      </div>

      <!-- Month strip -->
      <div class="ms__strip">
        <div v-for="(o, i) in occupancyAll" :key="o.month" class="ms__strip-cell">
          <div class="ms__strip-month">{{ monthName(o.month) }}</div>
          <div
            :class="[
              'ms__strip-rate',
              o.occupancyRate >= 70 ? 'ms__strip-rate--hi'
              : o.occupancyRate >= 40 ? 'ms__strip-rate--md'
              : 'ms__strip-rate--lo',
            ]"
          >
            {{ o.occupancyRate > 0 ? o.occupancyRate.toFixed(0) + '%' : '—' }}
          </div>
          <div class="ms__strip-rev">
            {{ revenueAll[i].revenue > 0 ? '€' + fmtRevenue(revenueAll[i].revenue) : '—' }}
          </div>
        </div>
      </div>
    </template>

    <div v-else class="empty-state">
      <p>{{ t('metrics.noMetrics') }}</p>
    </div>
  </div>
</template>
