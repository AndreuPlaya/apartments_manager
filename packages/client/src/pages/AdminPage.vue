<script setup lang="ts">
import { ref } from 'vue'
import ApartmentsTab from './admin/ApartmentsTab.vue'
import ClientsTab from './admin/ClientsTab.vue'
import ChannelsTab from './admin/ChannelsTab.vue'
import UsersTab from './admin/UsersTab.vue'
import MetricsTab from './admin/MetricsTab.vue'

const tabs = ['Apartments', 'Clients', 'Channels', 'Users', 'Metrics'] as const
type Tab = (typeof tabs)[number]
const activeTab = ref<Tab>('Apartments')
</script>

<template>
  <div class="page-container">
    <h2 style="margin-bottom: 1rem">Administration</h2>
    <div class="tabs">
      <button
        v-for="t in tabs"
        :key="t"
        :class="['tab-btn', { active: activeTab === t }]"
        @click="activeTab = t"
      >
        {{ t }}
      </button>
    </div>
    <ApartmentsTab v-if="activeTab === 'Apartments'" />
    <ClientsTab v-else-if="activeTab === 'Clients'" />
    <ChannelsTab v-else-if="activeTab === 'Channels'" />
    <UsersTab v-else-if="activeTab === 'Users'" />
    <MetricsTab v-else-if="activeTab === 'Metrics'" />
  </div>
</template>
