<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import type { CardConfig, ExcelRecord } from '@/types'
import { renderCard } from '@/utils'

interface Props {
  config: CardConfig
  record: ExcelRecord
  recordIndex: number
  selectedFieldIndex?: number
  uploadedImages: Map<string, string>
}

const props = defineProps<Props>()
const canvasRef = ref<HTMLCanvasElement | null>(null)

async function updatePreview() {
  if (!canvasRef.value) return
  
  await renderCard(
    canvasRef.value,
    props.config,
    props.record,
    props.recordIndex,
    props.uploadedImages,
    props.selectedFieldIndex
  )
}

// 监听配置变化
watch(
  () => [props.config, props.record, props.selectedFieldIndex],
  () => updatePreview(),
  { deep: true }
)

onMounted(() => {
  updatePreview()
})

// 暴露刷新方法
defineExpose({ updatePreview })
</script>

<template>
  <div class="preview-container flex-1 flex items-center justify-center p-8 overflow-auto">
    <div class="shadow-2xl">
      <canvas
        ref="canvasRef"
        :width="config.canvas.width"
        :height="config.canvas.height"
        class="max-w-full max-h-full"
        :style="{
          maxWidth: '100%',
          height: 'auto'
        }"
      />
    </div>
  </div>
</template>
