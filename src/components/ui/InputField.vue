<script setup lang="ts">
withDefaults(
  defineProps<{
    label?: string
    required?: boolean
    error?: string
    hint?: string
    modelValue?: string | number
    type?: string
    placeholder?: string
    disabled?: boolean
    maxlength?: number | string
    autofocus?: boolean
    class?: string
  }>(),
  { label: '', required: false, error: '', hint: '', modelValue: '', type: 'text', placeholder: '', disabled: false, class: '' }
)

const emit = defineEmits<{ (e: 'update:modelValue', value: string): void }>()
</script>

<template>
  <div class="form-group">
    <label v-if="label" class="label">
      {{ label }}<span v-if="required" class="text-red-500 ml-0.5">*</span>
    </label>
    <input
      class="input"
      :class="[error ? 'border-red-400 focus:ring-red-300 focus:border-red-400' : '', $props.class]"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :maxlength="maxlength"
      :autofocus="autofocus"
      @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
    <p v-if="error" class="text-xs text-red-500 mt-1">{{ error }}</p>
    <p v-else-if="hint" class="text-xs text-slate-400 mt-1">{{ hint }}</p>
  </div>
</template>
