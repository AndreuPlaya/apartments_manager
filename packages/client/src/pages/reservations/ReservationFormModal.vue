<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Reservation, Listing, Guest, Channel } from '../../api/client'
import { api } from '../../api/client'
import { useAsyncOp } from '../../composables/useAsyncOp'
import GuestSearchInput, { type NewGuestData } from '../guests/GuestSearchInput.vue'
import AppIcon from '../../shared/AppIcon.vue'
import SelectInput from '../../shared/fields/SelectInput.vue'
import DateInput from '../../shared/fields/DateInput.vue'
import NumberInput from '../../shared/fields/NumberInput.vue'
import CurrencyInput from '../../shared/fields/CurrencyInput.vue'
import CheckboxInput from '../../shared/fields/CheckboxInput.vue'
import TextareaInput from '../../shared/fields/TextareaInput.vue'

const { t } = useI18n()

const props = defineProps<{
  reservation: Reservation | null
  listings: Listing[]
  guests: Guest[]
  channels: Channel[]
}>()

const emit = defineEmits<{
  save: []
  close: []
}>()

const { loading, run } = useAsyncOp()

const form = ref({
  listingId: '',
  guestId: '',
  channelId: '',
  checkIn: '',
  checkOut: '',
  adultCount: 1,
  childrenCount: 0,
  cribRequested: false,
  paidDate: '',
  totalAmountDue: 0,
  comment: '',
  newGuestData: null as NewGuestData | null,
})

watch(
  () => props.reservation,
  (b) => {
    if (b) {
      form.value = {
        listingId: b.listingId,
        guestId: b.guestId,
        channelId: b.channelId,
        checkIn: b.checkIn,
        checkOut: b.checkOut,
        adultCount: b.adultCount,
        childrenCount: b.childrenCount,
        cribRequested: b.cribRequested ?? false,
        paidDate: b.paidDate ?? '',
        totalAmountDue: b.totalAmountDue,
        comment: b.comment ?? '',
        newGuestData: null,
      }
    }
  },
  { immediate: true },
)

async function save() {
  let guestId = form.value.guestId

  if (!guestId && form.value.newGuestData) {
    const nd = form.value.newGuestData
    const created = await run(() =>
      api.guests.create({
        name: nd.name,
        email: nd.email || undefined,
        phoneNumber: nd.phoneNumber || undefined,
        identityDocument: nd.identityDocument || undefined,
      }),
    )
    if (!created) return
    guestId = created.id
  }

  const payload = {
    listingId: form.value.listingId,
    guestId,
    channelId: form.value.channelId,
    checkIn: form.value.checkIn,
    checkOut: form.value.checkOut,
    adultCount: Number(form.value.adultCount),
    childrenCount: Number(form.value.childrenCount),
    cribRequested: form.value.cribRequested,
    // Status is deliberately absent. A new reservation is always Confirmed, and
    // an existing one changes state through its lifecycle actions, never through
    // this form (docs/RESERVATION_LIFECYCLE.md L1).
    paidDate: form.value.paidDate || undefined,
    totalAmountDue: Number(form.value.totalAmountDue),
    comment: form.value.comment || undefined,
  }

  let res: unknown
  if (props.reservation) {
    res = await run(() => api.reservations.update(props.reservation!.id, payload))
  } else {
    res = await run(() => api.reservations.create(payload))
  }
  if (res !== undefined) emit('save')
}

const listingOptions = computed(() =>
  props.listings.map(a => ({ value: a.id, label: a.name }))
)
const activeChannelOptions = computed(() =>
  props.channels.filter(c => c.isActive).map(c => ({ value: c.id, label: c.name }))
)
</script>

<template>
  <Teleport to="body">
    <div class="modal-backdrop" @click.self="emit('close')">
      <div class="modal modal--lg">
        <div class="modal__header">
          <h3>{{ reservation ? t('reservations.editReservation') : t('reservations.newReservation') }}</h3>
          <button class="btn btn--ghost btn--sm" @click="emit('close')"><AppIcon name="x" /></button>
        </div>
        <form @submit.prevent="save">
          <div class="modal__body">
            <div class="form-row">
              <SelectInput mode="form" :text="t('reservations.listing') + ' *'" v-model="form.listingId" :options="listingOptions" :placeholder="t('common.select')" required />
              <div class="form-group">
                <label>{{ t('reservations.guest') }} *</label>
                <GuestSearchInput
                  :guests="guests"
                  v-model="form.guestId"
                  v-model:newGuest="form.newGuestData"
                />
              </div>
            </div>
            <div class="form-row">
              <DateInput mode="form" :text="t('reservations.checkin') + ' *'" v-model="form.checkIn" required />
              <DateInput mode="form" :text="t('reservations.checkout') + ' *'" v-model="form.checkOut" required />
            </div>
            <div class="form-row">
              <NumberInput mode="form" :text="t('reservations.adults') + ' *'" v-model="form.adultCount" :min="1" required />
              <NumberInput mode="form" :text="t('reservations.children')" v-model="form.childrenCount" :min="0" />
            </div>
            <div v-if="Number(form.childrenCount) > 0" class="form-row">
              <CheckboxInput mode="form" :text="t('reservations.cribRequested')" v-model="form.cribRequested" />
            </div>
            <div class="form-row">
              <SelectInput mode="form" :text="t('reservations.channel') + ' *'" v-model="form.channelId" :options="activeChannelOptions" :placeholder="t('common.select')" required />
              <DateInput mode="form" :text="t('reservations.paidDate')" v-model="form.paidDate" />
            </div>
            <CurrencyInput mode="form" :text="t('reservations.amount') + ' *'" v-model="form.totalAmountDue" :min="0" required />
            <TextareaInput mode="form" :text="t('reservations.comment')" v-model="form.comment" />
          </div>
          <div class="modal__footer">
            <button type="button" class="btn btn--secondary" @click="emit('close')">{{ t('common.cancel') }}</button>
            <button type="submit" class="btn btn--primary" :disabled="loading">
              {{ loading ? t('common.saving') : t('common.save') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>
