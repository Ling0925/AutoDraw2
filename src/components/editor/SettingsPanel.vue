<script setup lang="ts">
import type { CanvasConfig, OutputConfig } from '@/types'
import { Input, Select, Label } from '@/components/ui'
import { ChevronDown } from 'lucide-vue-next'
import { ref } from 'vue'

interface Props {
  canvas: CanvasConfig
  output: OutputConfig
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:canvas': [canvas: CanvasConfig]
  'update:output': [output: OutputConfig]
}>()

const canvasOpen = ref(true)
const outputOpen = ref(false)

function updateCanvas(updates: Partial<CanvasConfig>) {
  emit('update:canvas', { ...props.canvas, ...updates })
}

function updateOutput(updates: Partial<OutputConfig>) {
  emit('update:output', { ...props.output, ...updates })
}
</script>

<template>
  <div class="border-b">
    <!-- 画布设置 -->
    <div class="border-b">
      <button
        class="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
        @click="canvasOpen = !canvasOpen"
      >
        <h2 class="font-semibold text-sm">画布设置</h2>
        <ChevronDown
          :class="['w-4 h-4 transition-transform', canvasOpen ? 'rotate-180' : '']"
        />
      </button>
      
      <div v-show="canvasOpen" class="px-4 pb-4 space-y-3">
        <div class="grid grid-cols-2 gap-2">
          <div>
            <Label>宽度 (px)</Label>
            <Input
              type="number"
              :model-value="String(canvas.width)"
              @update:model-value="updateCanvas({ width: parseInt($event) || 1050 })"
            />
          </div>
          <div>
            <Label>高度 (px)</Label>
            <Input
              type="number"
              :model-value="String(canvas.height)"
              @update:model-value="updateCanvas({ height: parseInt($event) || 600 })"
            />
          </div>
        </div>
        
        <div>
          <Label>背景颜色</Label>
          <div class="flex items-center gap-2">
            <input
              type="color"
              :value="canvas.backgroundColor"
              class="w-10 h-10 rounded-lg border border-input cursor-pointer p-0.5"
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
          <Label>背景图片</Label>
          <Input
            :model-value="canvas.backgroundImage || ''"
            placeholder="路径（可选）"
            @update:model-value="updateCanvas({ backgroundImage: $event || undefined })"
          />
        </div>
      </div>
    </div>

    <!-- 输出设置 -->
    <div>
      <button
        class="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
        @click="outputOpen = !outputOpen"
      >
        <h2 class="font-semibold text-sm">输出设置</h2>
        <ChevronDown
          :class="['w-4 h-4 transition-transform', outputOpen ? 'rotate-180' : '']"
        />
      </button>
      
      <div v-show="outputOpen" class="px-4 pb-4 space-y-3">
        <div>
          <Label>文件格式</Label>
          <Select
            :model-value="output.format"
            @update:model-value="updateOutput({ format: $event as 'PNG' | 'JPEG' })"
          >
            <option value="PNG">PNG</option>
            <option value="JPEG">JPEG</option>
          </Select>
        </div>
        
        <div>
          <Label>文件名模板</Label>
          <Input
            :model-value="output.filename"
            class="font-mono"
            @update:model-value="updateOutput({ filename: $event })"
          />
          <p class="text-xs text-muted-foreground mt-1">
            使用 <code class="bg-muted px-1 rounded">{字段名}</code> 或 <code class="bg-muted px-1 rounded">{index}</code>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
