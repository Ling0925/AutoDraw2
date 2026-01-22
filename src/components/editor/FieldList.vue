<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { Field } from '@/types'
import { Button } from '@/components/ui'
import { Type, Image, GripVertical, Trash2 } from 'lucide-vue-next'

const { t } = useI18n()

interface Props {
  fields: Field[]
  selectedIndex?: number
}

const props = defineProps<Props>()
const emit = defineEmits<{
  select: [index: number]
  add: [type: 'text' | 'image']
  remove: [index: number]
  reorder: [from: number, to: number]
}>()

function getFieldLabel(field: Field, index: number): string {
  if (field.type === 'text') {
    const text = field.text.substring(0, 20)
    return text.length < field.text.length ? text + '...' : text
  }
  return t('fields.fieldName', { index: index + 1 })
}
</script>

<template>
  <div class="flex flex-col h-full bg-transparent">
    <!-- 标题和添加按钮 -->
    <div class="p-4 border-b border-border/50 bg-muted/30">
      <h2 class="font-semibold text-sm mb-3">{{ t('fields.title') }}</h2>
      <div class="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          class="flex-1 text-xs"
          @click="emit('add', 'text')"
        >
          <Type class="w-3 h-3 mr-1" />
          {{ t('fields.addText') }}
        </Button>
        <Button
          variant="outline"
          size="sm"
          class="flex-1 text-xs"
          @click="emit('add', 'image')"
        >
          <Image class="w-3 h-3 mr-1" />
          {{ t('fields.addImage') }}
        </Button>
      </div>
    </div>

    <!-- 字段列表 -->
    <div class="flex-1 overflow-y-auto p-2 space-y-1">
      <div
        v-for="(field, index) in fields"
        :key="index"
        :class="[
          'group flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors',
          selectedIndex === index
            ? 'bg-primary/10 border border-primary/30'
            : 'hover:bg-muted border border-transparent'
        ]"
        @click="emit('select', index)"
      >
        <GripVertical class="w-4 h-4 text-muted-foreground cursor-grab" />
        
        <div
          :class="[
            'w-6 h-6 rounded flex items-center justify-center text-xs',
            field.type === 'text' 
              ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-300' 
              : 'bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-300'
          ]"
        >
          <Type v-if="field.type === 'text'" class="w-3 h-3" />
          <Image v-else class="w-3 h-3" />
        </div>
        
        <span class="flex-1 text-sm truncate">
          {{ getFieldLabel(field, index) }}
        </span>
        
        <button
          class="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/10 rounded transition-opacity"
          @click.stop="emit('remove', index)"
        >
          <Trash2 class="w-3 h-3 text-destructive" />
        </button>
      </div>

      <div
        v-if="fields.length === 0"
        class="text-center py-8 text-muted-foreground text-sm"
      >
        {{ t('fields.noFields') }}
      </div>
    </div>
  </div>
</template>
