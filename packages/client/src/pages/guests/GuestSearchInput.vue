<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Guest } from '../../api/client'
import AppIcon from '../../shared/AppIcon.vue'

const { t } = useI18n()

export interface NewGuestData {
  name: string
  email: string
  phoneNumber: string
  identityDocument: string
}

const props = defineProps<{
  guests: Guest[]
  modelValue: string
  newGuest: NewGuestData | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'update:newGuest': [value: NewGuestData | null]
}>()

const wrapperRef = ref<HTMLElement | null>(null)
const inputRef = ref<HTMLInputElement | null>(null)
const query = ref('')
const open = ref(false)
const mode = ref<'search' | 'new'>('search')
const newName = ref('')
const newEmail = ref('')
const newPhone = ref('')
const newIdDoc = ref('')

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return props.guests.slice(0, 8)
  return props.guests.filter((c) => c.name.toLowerCase().includes(q)).slice(0, 8)
})

const showNewOption = computed(() => query.value.trim().length > 0)

const hasValue = computed(
  () => !!props.modelValue || (mode.value === 'new' && newName.value.trim().length > 0),
)

onMounted(() => {
  if (props.modelValue) {
    const found = props.guests.find((c) => c.id === props.modelValue)
    if (found) query.value = found.name
  }
  document.addEventListener('mousedown', onClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('mousedown', onClickOutside)
})

watch(
  () => props.modelValue,
  (id) => {
    if (!id && mode.value === 'search') {
      query.value = ''
    } else if (id) {
      const found = props.guests.find((c) => c.id === id)
      if (found) query.value = found.name
    }
  },
)

function onInput() {
  if (props.modelValue) {
    emit('update:modelValue', '')
    emit('update:newGuest', null)
  }
  if (mode.value === 'new') {
    mode.value = 'search'
    emit('update:newGuest', null)
  }
  open.value = true
}

function onFocus() {
  open.value = true
}

function selectExisting(guest: Guest) {
  query.value = guest.name
  open.value = false
  mode.value = 'search'
  emit('update:modelValue', guest.id)
  emit('update:newGuest', null)
}

function selectNew() {
  const name = query.value.trim()
  mode.value = 'new'
  open.value = false
  newName.value = name
  newEmail.value = ''
  newPhone.value = ''
  newIdDoc.value = ''
  emit('update:modelValue', '')
  emit('update:newGuest', { name, email: '', phoneNumber: '', identityDocument: '' })
}

function cancelNew() {
  mode.value = 'search'
  newName.value = ''
  query.value = ''
  emit('update:modelValue', '')
  emit('update:newGuest', null)
}

function onNewFieldChange() {
  emit('update:newGuest', {
    name: newName.value,
    email: newEmail.value,
    phoneNumber: newPhone.value,
    identityDocument: newIdDoc.value,
  })
}

function clearSelection() {
  query.value = ''
  mode.value = 'search'
  emit('update:modelValue', '')
  emit('update:newGuest', null)
  nextTick(() => inputRef.value?.focus())
}

function onClickOutside(e: MouseEvent) {
  if (wrapperRef.value && !wrapperRef.value.contains(e.target as Node)) {
    open.value = false
  }
}
</script>

<template>
  <div class="guest-search" ref="wrapperRef">
    <template v-if="mode === 'search'">
      <div class="guest-search__input-wrap">
        <input
          ref="inputRef"
          type="text"
          v-model="query"
          :placeholder="t('guests.searchPlaceholder')"
          autocomplete="off"
          @input="onInput"
          @focus="onFocus"
          @keydown.escape="open = false"
          @keydown.tab="open = false"
        />
        <button
          v-if="modelValue"
          type="button"
          class="guest-search__clear"
          tabindex="-1"
          @mousedown.prevent="clearSelection"
        >
          <AppIcon name="x" :size="12" />
        </button>
      </div>

      <input
        :value="hasValue ? '_' : ''"
        required
        aria-hidden="true"
        tabindex="-1"
        class="guest-search__validator"
      />

      <ul v-if="open" class="guest-search__dropdown">
        <li
          v-for="c in filtered"
          :key="c.id"
          class="guest-search__option"
          @mousedown.prevent="selectExisting(c)"
        >
          {{ c.name }}
        </li>
        <li v-if="filtered.length === 0 && !showNewOption" class="guest-search__empty">
          {{ t('guests.noGuestsFound') }}
        </li>
        <li
          v-if="showNewOption"
          class="guest-search__option guest-search__option--new"
          @mousedown.prevent="selectNew"
        >
          {{ t('guests.newGuestPrefix') }}<strong>{{ query.trim() }}</strong>
        </li>
      </ul>
    </template>

    <template v-else>
      <div class="guest-search__new-panel">
        <div class="guest-search__new-header">
          <span class="guest-search__new-label">{{ t('guests.newGuestPanel') }}</span>
          <button type="button" class="btn btn--ghost btn--sm" @click="cancelNew"><AppIcon name="x" :size="12" /> {{ t('common.cancel') }}</button>
        </div>
        <div class="form-group">
          <label>{{ t('guests.fullName') }} *</label>
          <input type="text" v-model="newName" required @input="onNewFieldChange" />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>{{ t('guests.email') }}</label>
            <input type="email" v-model="newEmail" @input="onNewFieldChange" />
          </div>
          <div class="form-group">
            <label>{{ t('guests.phone') }}</label>
            <input type="text" v-model="newPhone" @input="onNewFieldChange" />
          </div>
        </div>
        <div class="form-group">
          <label>{{ t('guests.idDocument') }}</label>
          <input type="text" v-model="newIdDoc" @input="onNewFieldChange" />
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss">
.guest-search {
  position: relative;

  &__input-wrap {
    position: relative;
    display: flex;
    align-items: center;

    input {
      flex: 1;
    }
  }

  &__clear {
    position: absolute;
    right: 0.4rem;
    background: none;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    font-size: 0.75rem;
    padding: 0.2rem 0.3rem;
    line-height: 1;
    border-radius: var(--radius-sm);

    &:hover {
      color: var(--text);
      background: var(--bg);
    }
  }

  &__validator {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    border: 0;
    opacity: 0;
    pointer-events: none;
  }

  &__dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    z-index: 50;
    margin: 2px 0 0;
    padding: 4px 0;
    list-style: none;
    background: var(--card);
    border: 1px solid var(--border-dark);
    border-radius: var(--radius-sm);
    box-shadow: var(--shadow-md);
    max-height: 220px;
    overflow-y: auto;
  }

  &__option {
    padding: 0.45rem 0.65rem;
    font-size: 0.875rem;
    cursor: pointer;
    color: var(--text);

    &:hover {
      background: var(--accent-light);
      color: var(--accent);
    }

    &--new {
      border-top: 1px solid var(--border);
      color: var(--text-muted);
      font-style: italic;

      strong {
        font-style: normal;
        color: var(--accent);
        font-weight: 600;
      }

      &:hover {
        background: var(--accent-light);
        color: var(--accent);
      }
    }
  }

  &__empty {
    padding: 0.45rem 0.65rem;
    font-size: 0.875rem;
    color: var(--text-muted);
    font-style: italic;
  }

  &__new-panel {
    border: 1px solid var(--border-dark);
    border-radius: var(--radius-sm);
    padding: 0.75rem;
    background: var(--bg);
  }

  &__new-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.75rem;
  }

  &__new-label {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
}
</style>
