<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ListingsTab from './listings/ListingsTab.vue'
import GuestsTab from './guests/GuestsTab.vue'
import ChannelsTab from './channels/ChannelsTab.vue'
import UsersTab from './users/UsersTab.vue'
import MetricsTab from './metrics/MetricsTab.vue'

const tabs = ['Listings', 'Guests', 'Channels', 'Users', 'Metrics'] as const
type Tab = (typeof tabs)[number]

const route = useRoute()
const router = useRouter()

const tabParamMap: Record<string, Tab> = {
  listings: 'Listings',
  guests:    'Guests',
  channels:   'Channels',
  users:      'Users',
  metrics:    'Metrics',
}

const tabValueMap: Record<Tab, string> = {
  Listings: 'listings',
  Guests:    'guests',
  Channels:   'channels',
  Users:      'users',
  Metrics:    'metrics',
}

const activeTab = computed<Tab>(() => {
  const param = route.query.tab as string | undefined
  return (param && tabParamMap[param]) || 'Listings'
})

function setTab(tab: Tab) {
  router.replace({ query: { tab: tabValueMap[tab] } })
}
</script>

<template>
  <div class="page-container">
    <h2 style="margin-bottom: 1rem">Administration</h2>
    <div class="tabs">
      <button
        v-for="t in tabs"
        :key="t"
        :class="['tab-btn', { active: activeTab === t }]"
        @click="setTab(t)"
      >
        {{ t }}
      </button>
    </div>
    <ListingsTab v-if="activeTab === 'Listings'" :is-admin="true" />
    <GuestsTab v-else-if="activeTab === 'Guests'" :is-admin="true" />
    <ChannelsTab v-else-if="activeTab === 'Channels'" :is-admin="true" />
    <UsersTab v-else-if="activeTab === 'Users'" />
    <MetricsTab v-else-if="activeTab === 'Metrics'" />
  </div>
</template>
