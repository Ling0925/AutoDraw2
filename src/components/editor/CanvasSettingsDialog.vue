<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { CanvasConfig } from '@/types'
import { Dialog, Input, Label } from '@/components/ui'

const { t } = useI18n()

interface Props {
  open: boolean
  canvas: CanvasConfig
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:open': [value: boolean]
  'update:canvas': [canvas: CanvasConfig]
}>()

function updateCanvas(updates: Partial<CanvasConfig>) {
  emit('update:canvas', { ...props.canvas, ...updates })
}
</script>

<template>
  <Dialog :open="open" :title="t('settings.cardSettings')" @update:open="emit('update:open', $event)">
    <div class="space-y-4 py-4">
      <div class="grid grid-cols-2 gap-3">
        <div>
          <Label>{{ t('settings.width') }}</Label>
          <Input
            type="number"
            :model-value="String(canvas.width)"
            @update:model-value="updateCanvas({ width: parseInt($event) || 1050 })"
          />
        </div>
        <div>
          <Label>{{ t('settings.height') }}</Label>
          <Input
            type="number"
            :model-value="String(canvas.height)"
            @update:model-value="updateCanvas({ height: parseInt($event) || 600 })"
          />
        </div>
      </div>
      
      <div>
        <Label>{{ t('settings.backgroundColor') }}</Label>
        <div class="flex items-center gap-2">
          <input
            type="color"
            :value="canvas.backgroundColor"
            class="w-12 h-12 rounded-lg border border-input cursor-pointer p-1"
            @input="updateCanvas({ backgroundColor: ($event.target as HTMLInputElement).value })"
          >
          <Input
            :model-value="canvas.backgroundColor"
            class="flex-1 font-mono"
            @update:model-value="updateCanvas({ backgroundColor: $event })"
          />
        </div>
      </div>
      
      <div>
        <Label>{{ t('settings.backgroundImage') }}</Label>
        <Input
          :model-value="canvas.backgroundImage || ''"
          :placeholder="t('settings.noImage')"
          @update:model-value="updateCanvas({ backgroundImage: $event || undefined })"
        />
      </div>
    </div>
  </Dialog>
</template>
