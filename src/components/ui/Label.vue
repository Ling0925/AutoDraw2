<script setup lang="ts">
interface Props {
  for?: string
}

defineProps<Props>()
</script>

<template>
  <label
    :for="$props.for"
    class="text-xs font-medium text-muted-foreground leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
  >
    <slot />
  </label>
</template>
