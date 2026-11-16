<script setup lang="ts">
withDefaults(
  defineProps<{
    label?: string
    required?: boolean
    error?: string
    modelValue?: string
    rows?: number
    placeholder?: string
    disabled?: boolean
  }>(),
  { label: '', required: false, error: '', modelValue: '', rows: 3, placeholder: '', disabled: false }
)

const emit = defineEmits<{ (e: 'update:modelValue', value: string): void }>()
</script>

<template>
  <div class="form-group">
    <label v-if="label" class="label">
      {{ label }}<span v-if="required" class="text-red-500 ml-0.5">*</span>
    </label>
    <textarea
      class="input resize-none"
      :class="error ? 'border-red-400' : ''"
      :rows="rows"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :required="required"
      @input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
    />
    <p v-if="error" class="text-xs text-red-500 mt-1">{{ error }}</p>
  </div>
</template>
