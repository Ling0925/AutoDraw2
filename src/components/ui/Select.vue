<script setup lang="ts">
import {
  SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectItemIndicator,
  SelectItemText,
  SelectPortal,
  SelectViewport,
  SelectScrollUpButton,
  SelectScrollDownButton,
} from 'radix-vue'
import { Check, ChevronDown, ChevronUp } from 'lucide-vue-next'
import { cn } from '@/utils'
import { computed } from 'vue'

interface Option {
  label: string
  value: string | number
}

interface Props {
  modelValue?: string | number
  options?: Option[]
  placeholder?: string
  disabled?: boolean
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  options: () => [],
  placeholder: '请选择...'
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
}>()

// 处理选中值更新
const handleUpdate = (value: string) => {
  // 查找原始选项以确定值的类型（数字或字符串）
  const option = props.options.find(o => String(o.value) === value)
  if (option) {
    emit('update:modelValue', option.value)
  } else {
    emit('update:modelValue', value)
  }
}

// 确保 modelValue 转为字符串给 Radix 使用
const stringValue = computed(() => {
  return props.modelValue !== undefined ? String(props.modelValue) : undefined
})
</script>

<template>
  <SelectRoot
    :model-value="stringValue"
    :disabled="disabled"
    @update:model-value="handleUpdate"
  >
    <SelectTrigger
      :class="cn(
        'flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
        props.class
      )"
    >
      <SelectValue :placeholder="placeholder" />
      <ChevronDown class="h-4 w-4 opacity-50" />
    </SelectTrigger>

    <SelectPortal>
      <SelectContent
        class="relative z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 position-popper"
      >
        <SelectScrollUpButton class="flex items-center justify-center h-[25px] bg-popover text-muted-foreground cursor-default">
          <ChevronUp class="h-4 w-4" />
        </SelectScrollUpButton>

        <SelectViewport class="p-1">
          <SelectItem
            v-for="option in options"
            :key="String(option.value)"
            :value="String(option.value)"
            class="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
          >
            <span class="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
              <SelectItemIndicator>
                <Check class="h-4 w-4" />
              </SelectItemIndicator>
            </span>

            <SelectItemText>
              {{ option.label }}
            </SelectItemText>
          </SelectItem>
        </SelectViewport>

        <SelectScrollDownButton class="flex items-center justify-center h-[25px] bg-popover text-muted-foreground cursor-default">
          <ChevronDown class="h-4 w-4" />
        </SelectScrollDownButton>
      </SelectContent>
    </SelectPortal>
  </SelectRoot>
</template>
