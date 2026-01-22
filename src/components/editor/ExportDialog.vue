<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { OutputConfig } from '@/types'
import { Dialog, Input, Select, Label, Button } from '@/components/ui'

const { t } = useI18n()

interface Props {
  open: boolean
  output: OutputConfig
  isExporting: boolean
  progress: { current: number; total: number }
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:open': [value: boolean]
  'update:output': [output: OutputConfig]
  'export': []
}>()

const localOutput = ref<OutputConfig>({ ...props.output })

function updateOutput(updates: Partial<OutputConfig>) {
  localOutput.value = { ...localOutput.value, ...updates }
  emit('update:output', localOutput.value)
}

function handleExport() {
  emit('export')
}
</script>

<template>
  <Dialog :open="open" :title="t('header.exportCards')" @update:open="emit('update:open', $event)">
    <div class="space-y-4 py-4">
      <div>
        <Label>文件格式</Label>
        <Select
          :model-value="localOutput.format"
          :options="[
            { label: 'PNG', value: 'PNG' },
            { label: 'JPEG', value: 'JPEG' }
          ]"
          @update:model-value="updateOutput({ format: $event as 'PNG' | 'JPEG' })"
        />
      </div>
      
      <div>
        <Label>文件名模板</Label>
        <Input
          :model-value="localOutput.filename"
          class="font-mono"
          @update:model-value="updateOutput({ filename: $event })"
        />
        <p class="text-xs text-muted-foreground mt-1">
          使用 <code class="bg-muted px-1 rounded">{字段名}</code> 或 <code class="bg-muted px-1 rounded">{index}</code>
        </p>
      </div>

      <div v-if="isExporting" class="py-4">
        <div class="flex items-center justify-between text-sm mb-2">
          <span>{{ t('export.exporting') }}</span>
          <span class="font-mono">{{ progress.current }} / {{ progress.total }}</span>
        </div>
        <div class="w-full bg-muted rounded-full h-2 overflow-hidden">
          <div 
            class="bg-primary h-full transition-all duration-300"
            :style="{ width: `${(progress.current / progress.total) * 100}%` }"
          />
        </div>
      </div>

      <div class="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" @click="emit('update:open', false)" :disabled="isExporting">
          取消
        </Button>
        <Button @click="handleExport" :disabled="isExporting">
          {{ isExporting ? t('export.exporting') : '开始导出' }}
        </Button>
      </div>
    </div>
  </Dialog>
</template>
