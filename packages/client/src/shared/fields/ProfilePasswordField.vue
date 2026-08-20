<script setup lang="ts">
import { ref, nextTick } from 'vue'
import AppIcon from '../AppIcon.vue'

const props = defineProps<{
  text: string
  modelValue: string
  autocomplete?: string
  minlength?: number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const editing = ref(false)
const draft = ref('')
const visible = ref(false)
const inputRef = ref<HTMLInputElement | null>(null)

function startEdit() {
  draft.value = ''
  visible.value = false
  editing.value = true
  nextTick(() => inputRef.value?.focus())
}

function cancel() {
  editing.value = false
  draft.value = ''
}

function commit() {
  editing.value = false
  if (draft.value) emit('update:modelValue', draft.value)
  draft.value = ''
}
</script>

<template>
  <div
    :class="['detail-field', editing && 'detail-field--editing']"
    @click="!editing && startEdit()"
  >
    <span class="detail-field__label">{{ text }}</span>
    <span v-if="!editing" class="detail-field__val text-muted">
      {{ modelValue ? '••••••••' : '—' }}
    </span>
    <div v-else class="pf-pw-wrap" @click.stop>
      <input
        ref="inputRef"
        v-model="draft"
        :type="visible ? 'text' : 'password'"
        :autocomplete="autocomplete"
        :minlength="minlength"
        @blur="commit"
        @keydown.enter.prevent="commit"
        @keydown.escape.prevent="cancel"
      />
      <!--
        mousedown fires before blur; preventing its default keeps focus on the
        input, so revealing the password does not commit and close the editor.
      -->
      <button
        type="button"
        class="pf-pw-eye"
        tabindex="-1"
        :aria-label="visible ? 'Hide' : 'Show'"
        @mousedown.prevent
        @click="visible = !visible"
      >
        <AppIcon :name="visible ? 'eye-off' : 'eye'" :size="14" />
      </button>
    </div>
  </div>
</template>
