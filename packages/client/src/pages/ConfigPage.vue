<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import ApartmentsTab from './apartments/ApartmentsTab.vue'
import ChannelsTab from './channels/ChannelsTab.vue'
import UsersTab from './users/UsersTab.vue'

const { t } = useI18n()

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

const tabLabels = computed<Record<Tab, string>>(() => ({
  Apartments: t('config.tabApartments'),
  Channels:   t('config.tabChannels'),
  Users:      t('config.tabUsers'),
}))

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
    <h2 style="margin-bottom: 1rem">{{ t('config.title') }}</h2>
    <div class="tabs">
      <button
        v-for="tab in tabs"
        :key="tab"
        :class="['tab-btn', { active: activeTab === tab }]"
        @click="setTab(tab)"
      >
        {{ tabLabels[tab] }}
      </button>
    </div>
    <ApartmentsTab v-if="activeTab === 'Apartments'" :is-admin="true" />
    <ChannelsTab v-else-if="activeTab === 'Channels'" :is-admin="true" />
    <UsersTab v-else-if="activeTab === 'Users'" />
  </div>
</template>
