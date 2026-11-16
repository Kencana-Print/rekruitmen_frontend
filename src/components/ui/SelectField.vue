<script setup lang="ts">
export interface SelectOption {
  value: string | number
  label: string
}

withDefaults(
  defineProps<{
    label?: string
    modelValue?: string | number
    options?: SelectOption[]
    placeholder?: string
    required?: boolean
    disabled?: boolean
  }>(),
  { label: '', modelValue: '', options: () => [], placeholder: 'Pilih...', required: false, disabled: false }
)

const emit = defineEmits<{ (e: 'update:modelValue', value: string): void }>()
</script>

<template>
  <div class="form-group">
    <label v-if="label" class="label">
      {{ label }}<span v-if="required" class="text-red-500 ml-0.5">*</span>
    </label>
    <select
      class="input"
      :value="modelValue"
      :disabled="disabled"
      :required="required"
      @change="emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
    >
      <option value="">{{ placeholder }}</option>
      <option v-for="o in options" :key="o.value" :value="o.value">{{ o.label }}</option>
    </select>
  </div>
</template>
