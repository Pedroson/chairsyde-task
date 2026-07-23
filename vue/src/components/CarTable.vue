<script setup lang="ts">
import type { CarSummary } from '@/api/cars'

defineProps<{
  cars: CarSummary[]
}>()

const emit = defineEmits<{
  select: [id: number]
}>()
</script>

<template>
  <table v-if="cars.length" class="car-table">
    <thead>
      <tr>
        <th>ID</th>
        <th>Make</th>
        <th>Model</th>
        <th>Year</th>
      </tr>
    </thead>
    <tbody>
      <tr
        v-for="car in cars"
        :key="car.id"
        class="car-row"
        @click="emit('select', car.id)"
      >
        <td>{{ car.id }}</td>
        <td>{{ car.make }}</td>
        <td>{{ car.model }}</td>
        <td>{{ car.year }}</td>
      </tr>
    </tbody>
  </table>
  <p v-else class="empty">No cars to show.</p>
</template>

<style scoped>
.car-table {
  width: 100%;
  border-collapse: collapse;
}
.car-table th,
.car-table td {
  text-align: left;
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid #ddd;
}
.car-row {
  cursor: pointer;
}
.car-row:hover {
  background: #f4f4f4;
}
.empty {
  color: #666;
}
</style>
