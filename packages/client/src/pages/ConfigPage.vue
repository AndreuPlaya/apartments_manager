<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ApartmentsTab from './apartments/ApartmentsTab.vue'
import ChannelsTab from './channels/ChannelsTab.vue'
import UsersTab from './users/UsersTab.vue'

const tabs = ['Apartments', 'Channels', 'Users'] as const
type Tab = (typeof tabs)[number]

const route = useRoute()
const router = useRouter()

const tabParamMap: Record<string, Tab> = {
  apartments: 'Apartments',
  channels:   'Channels',
  users:      'Users',
}

const tabValueMap: Record<Tab, string> = {
  Apartments: 'apartments',
  Channels:   'channels',
  Users:      'users',
}

const activeTab = computed<Tab>(() => {
  const param = route.query.tab as string | undefined
  return (param && tabParamMap[param]) || 'Apartments'
})

function setTab(tab: Tab) {
  router.replace({ query: { tab: tabValueMap[tab] } })
}
</script>

<template>
  <div class="page-container">
    <h2 style="margin-bottom: 1rem">Configuration</h2>
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
    <ApartmentsTab v-if="activeTab === 'Apartments'" :is-admin="true" />
    <ChannelsTab v-else-if="activeTab === 'Channels'" :is-admin="true" />
    <UsersTab v-else-if="activeTab === 'Users'" />
  </div>
</template>
