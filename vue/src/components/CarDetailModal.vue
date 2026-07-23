<script setup lang="ts">
import { ref, watch } from 'vue'
import { getCar, type CarDetail } from '@/api/cars'

const props = defineProps<{
  carId: number | null
}>()

const emit = defineEmits<{
  close: []
}>()

const car = ref<CarDetail | null>(null)
const loading = ref(false)
const error = ref('')

watch(
  () => props.carId,
  async (id) => {
    car.value = null
    error.value = ''
    if (id === null) return
    loading.value = true
    try {
      const result = await getCar(id)
      if (id !== props.carId) return
      car.value = result
    } catch {
      if (id !== props.carId) return
      error.value = 'Could not load car details.'
    } finally {
      if (id === props.carId) loading.value = false
    }
  },
  { immediate: true },
)
</script>

<template>
  <div v-if="carId !== null" class="modal-backdrop" @click.self="emit('close')">
    <div class="modal">
      <button class="modal-close" type="button" @click="emit('close')">×</button>

      <p v-if="loading">Loading…</p>
      <p v-else-if="error" class="error">{{ error }}</p>

      <div v-else-if="car" class="detail">
        <h2>{{ car.year }} {{ car.make }} {{ car.model }}</h2>
        <img v-if="car.image_url" :src="car.image_url" :alt="`${car.make} ${car.model}`" />
        <dl>
          <dt>Trim</dt><dd>{{ car.trim }}</dd>
          <dt>Horsepower</dt><dd>{{ car.horsepower }}</dd>
          <dt>Cylinders</dt><dd>{{ car.cylinders }}</dd>
          <dt>Displacement</dt><dd>{{ car.displacement }}</dd>
          <dt>Fuel type</dt><dd>{{ car.fuel_type }}</dd>
          <dt>Transmission</dt><dd>{{ car.transmission }}</dd>
          <dt>Body class</dt><dd>{{ car.body_class }}</dd>
        </dl>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}
.modal {
  position: relative;
  background: #fff;
  color: #111;
  border-radius: 8px;
  padding: 1.5rem;
  max-width: 480px;
  width: 100%;
  max-height: 90vh;
  overflow: auto;
}
.modal-close {
  position: absolute;
  top: 0.5rem;
  right: 0.75rem;
  border: none;
  background: none;
  font-size: 1.5rem;
  cursor: pointer;
  line-height: 1;
}
.detail img {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
}
.detail dl {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.25rem 1rem;
}
.detail dt {
  font-weight: 600;
}
.detail dd {
  margin: 0;
}
.error {
  color: #c00;
}
</style>
