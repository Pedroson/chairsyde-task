<script setup lang="ts">
import { ref, computed } from 'vue'
import { searchCars, type CarSummary, type CarSearchParams } from '@/api/cars'
import CarSearchForm from '@/components/CarSearchForm.vue'
import CarTable from '@/components/CarTable.vue'
import CarDetailModal from '@/components/CarDetailModal.vue'

const LIMIT = 20

const cars = ref<CarSummary[]>([])
const hasSearched = ref(false)
const loading = ref(false)
const error = ref('')
const validationMessages = ref<string[]>([])
const offset = ref(0)
const selectedCarId = ref<string | null>(null)

// Filters from the last submitted search (make required for pagination refetch).
const filters = ref<{ make: string; year?: number; model?: string } | null>(null)

const hasValidationErrors = computed(() => validationMessages.value.length > 0)

async function runSearch() {
  if (!filters.value) return
  loading.value = true
  error.value = ''
  validationMessages.value = []
  const params: CarSearchParams = {
    make: filters.value.make,
    limit: LIMIT,
    offset: offset.value,
  }
  if (filters.value.year !== undefined) params.year = filters.value.year
  if (filters.value.model !== undefined) params.model = filters.value.model

  try {
    cars.value = await searchCars(params)
    hasSearched.value = true
  } catch (e: unknown) {
    const err = e as { response?: { status?: number; data?: { message?: string | string[] } } }
    if (err.response?.status === 422 && err.response.data?.message) {
      const message = err.response.data.message
      validationMessages.value = Array.isArray(message) ? message : [message]
    } else {
      error.value = 'Something went wrong while searching. Please try again.'
    }
    cars.value = []
  } finally {
    loading.value = false
  }
}

function onSearch(payload: { make: string; year?: number; model?: string }) {
  filters.value = payload
  offset.value = 0
  runSearch()
}

function next() {
  offset.value += LIMIT
  runSearch()
}

function prev() {
  offset.value = Math.max(0, offset.value - LIMIT)
  runSearch()
}
</script>

<template>
  <main class="cars-view">
    <h1>Cars</h1>

    <CarSearchForm :loading="loading" @search="onSearch" />

    <p v-if="error" class="error">{{ error }}</p>
    <ul v-if="hasValidationErrors" class="field-errors">
      <li v-for="(message, i) in validationMessages" :key="i" class="error">{{ message }}</li>
    </ul>
    <p v-if="loading" class="status">Loading…</p>

    <template v-if="hasSearched">
      <CarTable :cars="cars" @select="selectedCarId = $event" />

      <div class="pager">
        <button class="prev" type="button" :disabled="loading || offset === 0" @click="prev">
          Previous
        </button>
        <button
          class="next"
          type="button"
          :disabled="loading || cars.length < LIMIT"
          @click="next"
        >
          Next
        </button>
      </div>
    </template>

    <p v-else-if="!loading && !hasValidationErrors" class="status">
      Search for cars by make to get started.
    </p>

    <CarDetailModal :carId="selectedCarId" @close="selectedCarId = null" />
  </main>
</template>

<style scoped>
.cars-view {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem 1rem;
}
.pager {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}
.status {
  color: #666;
}
.error {
  color: #c00;
}
</style>
