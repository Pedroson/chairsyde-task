<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  errors?: Record<string, string[]>
  loading?: boolean
}>()

const emit = defineEmits<{
  search: [payload: { make: string; year?: number; model?: string }]
}>()

const make = ref('')
const year = ref<number | string>('')
const model = ref('')

function onSubmit() {
  const payload: { make: string; year?: number; model?: string } = {
    make: make.value.trim(),
  }
  if (year.value !== '') payload.year = Number(year.value)
  if (model.value.trim() !== '') payload.model = model.value.trim()
  emit('search', payload)
}
</script>

<template>
  <form class="search-form" @submit.prevent="onSubmit">
    <div class="field">
      <label for="make">Make *</label>
      <input id="make" name="make" v-model="make" required />
      <p v-if="errors?.make" class="error">{{ errors.make.join(' ') }}</p>
    </div>

    <div class="field">
      <label for="year">Year</label>
      <input id="year" name="year" type="number" v-model="year" />
      <p v-if="errors?.year" class="error">{{ errors.year.join(' ') }}</p>
    </div>

    <div class="field">
      <label for="model">Model</label>
      <input id="model" name="model" v-model="model" />
      <p v-if="errors?.model" class="error">{{ errors.model.join(' ') }}</p>
    </div>

    <button type="submit" :disabled="loading">Search</button>
  </form>
</template>

<style scoped>
.search-form {
  display: flex;
  gap: 1rem;
  align-items: flex-end;
  flex-wrap: wrap;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.error {
  color: #c00;
  font-size: 0.85rem;
  margin: 0;
}
</style>
