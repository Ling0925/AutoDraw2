<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import type { CardConfig, ExcelRecord, Field } from '@/types'
import { renderCardDoubleBuffered, calculateAllFieldBounds, findFieldAtPosition, type FieldBounds } from '@/utils'
import { Select } from '@/components/ui'

const { t } = useI18n()

interface Props {
  config: CardConfig
  record: ExcelRecord
  recordIndex: number
  selectedFieldIndex?: number
  uploadedImages: Map<string, string>
}

const props = defineProps<Props>()
const emit = defineEmits<{
  selectField: [index: number | undefined]
  updateField: [index: number, field: Field]
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const fieldBounds = ref<FieldBounds[]>([])

// 网格设置
const showGrid = ref(true)
const gridSize = ref(20)
const snapToGrid = ref(true)

// 拖拽状态
const isDragging = ref(false)
const dragFieldIndex = ref<number | undefined>(undefined)
const dragStartPos = ref({ x: 0, y: 0 })
const dragOffset = ref({ x: 0, y: 0 })
let animationFrameId: number | null = null

// 绘制网格
function drawGrid(canvas: HTMLCanvasElement) {
  if (!showGrid.value) return
  
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  
  const width = canvas.width
  const height = canvas.height
  const size = gridSize.value
  
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)'
  ctx.lineWidth = 1
  
  // 绘制垂直线
  for (let x = 0; x <= width; x += size) {
    ctx.beginPath()
    ctx.moveTo(x + 0.5, 0)
    ctx.lineTo(x + 0.5, height)
    ctx.stroke()
  }
  
  // 绘制水平线
  for (let y = 0; y <= height; y += size) {
    ctx.beginPath()
    ctx.moveTo(0, y + 0.5)
    ctx.lineTo(width, y + 0.5)
    ctx.stroke()
  }
  
  // 绘制原点标记
  ctx.strokeStyle = 'rgba(59, 130, 246, 0.5)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.lineTo(20, 0)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.lineTo(0, 20)
  ctx.stroke()
}

// 吸附到网格
function snapValue(value: number): number {
  if (!snapToGrid.value) return value
  const size = gridSize.value
  return Math.round(value / size) * size
}

async function updatePreview() {
  if (!canvasRef.value) return
  
  // 如果正在拖拽，使用临时偏移量渲染
  let modifiedConfig = props.config
  if (isDragging.value && dragFieldIndex.value !== undefined) {
    // 创建一个临时配置，包含拖拽偏移
    modifiedConfig = {
      ...props.config,
      fields: props.config.fields.map((field, index) => {
        if (index === dragFieldIndex.value) {
          return {
            ...field,
            position: {
              x: field.position.x + dragOffset.value.x,
              y: field.position.y + dragOffset.value.y
            }
          }
        }
        return field
      })
    }
  }
  
  await renderCardDoubleBuffered(
    canvasRef.value,
    modifiedConfig,
    props.record,
    props.recordIndex,
    props.uploadedImages,
    props.selectedFieldIndex
  )
  
  // 绘制网格（在内容上方）
  drawGrid(canvasRef.value)
  
  // 更新字段边界框
  fieldBounds.value = calculateAllFieldBounds(
    canvasRef.value,
    modifiedConfig,
    props.record,
    props.recordIndex,
    props.uploadedImages
  )
}

// 使用 requestAnimationFrame 优化的更新函数
function scheduleUpdate() {
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId)
  }
  animationFrameId = requestAnimationFrame(() => {
    updatePreview()
    animationFrameId = null
  })
}

// 获取 Canvas 坐标
function getCanvasCoords(event: MouseEvent): { x: number; y: number } | null {
  if (!canvasRef.value) return null
  
  const canvas = canvasRef.value
  const rect = canvas.getBoundingClientRect()
  
  const scaleX = canvas.width / rect.width
  const scaleY = canvas.height / rect.height
  
  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY
  }
}

// 处理鼠标按下
function handleMouseDown(event: MouseEvent) {
  const coords = getCanvasCoords(event)
  if (!coords) return
  
  const fieldIndex = findFieldAtPosition(fieldBounds.value, coords.x, coords.y)
  
  if (fieldIndex !== undefined) {
    // 开始拖拽
    isDragging.value = true
    dragFieldIndex.value = fieldIndex
    dragStartPos.value = { x: coords.x, y: coords.y }
    dragOffset.value = { x: 0, y: 0 }
    
    // 选中该字段
    emit('selectField', fieldIndex)
    
    // 阻止默认行为
    event.preventDefault()
  } else {
    // 点击空白区域，取消选中
    emit('selectField', undefined)
  }
}

// 处理鼠标移动
function handleMouseMove(event: MouseEvent) {
  const coords = getCanvasCoords(event)
  if (!coords) return
  
  if (isDragging.value && dragFieldIndex.value !== undefined) {
    // 计算偏移量
    let dx = coords.x - dragStartPos.value.x
    let dy = coords.y - dragStartPos.value.y
    
    // 应用网格吸附
    if (snapToGrid.value) {
      const field = props.config.fields[dragFieldIndex.value]
      if (field) {
        const newX = field.position.x + dx
        const newY = field.position.y + dy
        const snappedX = snapValue(newX)
        const snappedY = snapValue(newY)
        dx = snappedX - field.position.x
        dy = snappedY - field.position.y
      }
    }
    
    // 更新临时偏移量
    dragOffset.value = { x: Math.round(dx), y: Math.round(dy) }
    
    // 使用 requestAnimationFrame 优化重绘
    scheduleUpdate()
    
    cursorStyle.value = 'grabbing'
  } else {
    // 非拖拽时的鼠标样式
    const fieldIndex = findFieldAtPosition(fieldBounds.value, coords.x, coords.y)
    cursorStyle.value = fieldIndex !== undefined ? 'grab' : 'default'
  }
}

// 处理鼠标释放
function handleMouseUp() {
  if (isDragging.value && dragFieldIndex.value !== undefined) {
    // 拖拽结束，应用最终位置到配置
    const field = props.config.fields[dragFieldIndex.value]
    if (field && (dragOffset.value.x !== 0 || dragOffset.value.y !== 0)) {
      const newField = {
        ...field,
        position: {
          x: field.position.x + dragOffset.value.x,
          y: field.position.y + dragOffset.value.y
        }
      }
      emit('updateField', dragFieldIndex.value, newField)
    }
    
    isDragging.value = false
    dragFieldIndex.value = undefined
    dragOffset.value = { x: 0, y: 0 }
    cursorStyle.value = 'default'
  }
}

// 处理鼠标离开 Canvas
function handleMouseLeave() {
  if (isDragging.value) {
    // 继续监听 document 上的 mouseup 事件
  }
  if (!isDragging.value) {
    cursorStyle.value = 'default'
  }
}

// 全局鼠标释放事件（处理拖拽时鼠标移出 Canvas 的情况）
function handleGlobalMouseUp() {
  if (isDragging.value && dragFieldIndex.value !== undefined) {
    // 拖拽结束，应用最终位置到配置
    const field = props.config.fields[dragFieldIndex.value]
    if (field && (dragOffset.value.x !== 0 || dragOffset.value.y !== 0)) {
      const newField = {
        ...field,
        position: {
          x: field.position.x + dragOffset.value.x,
          y: field.position.y + dragOffset.value.y
        }
      }
      emit('updateField', dragFieldIndex.value, newField)
    }
    
    isDragging.value = false
    dragFieldIndex.value = undefined
    dragOffset.value = { x: 0, y: 0 }
    cursorStyle.value = 'default'
  }
}

// 鼠标样式
const cursorStyle = ref('default')

// 监听配置变化
watch(
  () => [props.config, props.record, props.selectedFieldIndex],
  () => {
    updatePreview()
  },
  { deep: true }
)

// 单独监听 selectedFieldIndex 的变化，立即更新（即使在拖拽时）
watch(
  () => props.selectedFieldIndex,
  () => {
    // 选中字段变化时立即更新显示
    if (!isDragging.value) {
      updatePreview()
    } else {
      // 如果正在拖拽，也要更新一次以显示选中框
      scheduleUpdate()
    }
  }
)

onMounted(() => {
  updatePreview()
  // 添加全局鼠标释放监听
  document.addEventListener('mouseup', handleGlobalMouseUp)
})

onUnmounted(() => {
  // 移除全局监听
  document.removeEventListener('mouseup', handleGlobalMouseUp)
  // 清理动画帧
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId)
  }
})

// 暴露刷新方法w
defineExpose({ updatePreview })
</script>
<template>
  <div class="preview-container h-full flex flex-col overflow-hidden relative">
    <!-- 网格控制工具栏 - 悬浮胶囊样式 -->
    <div class="relative mt-4 mb-2 mx-auto w-fit flex items-center gap-4 px-4 py-2 bg-background/90 backdrop-blur-sm rounded-full shadow-sm border z-10 transition-all hover:bg-accent/50 hover:shadow-md">
      <label class="flex items-center gap-2 text-sm cursor-pointer hover:text-primary transition-colors text-muted-foreground">
        <input 
          v-model="showGrid" 
          type="checkbox" 
          class="w-4 h-4 rounded border-input text-primary focus:ring-offset-0 focus:ring-1 focus:ring-primary/50 transition-all cursor-pointer"
          @change="updatePreview"
        >
        <span>{{ t('settings.showGrid') }}</span>
      </label>
      
      <div class="w-px h-4 bg-border"></div>

      <label class="flex items-center gap-2 text-sm cursor-pointer hover:text-primary transition-colors text-muted-foreground" :class="{ 'opacity-50 cursor-not-allowed': !showGrid }">
        <input 
          v-model="snapToGrid" 
          type="checkbox" 
          class="w-4 h-4 rounded border-input text-primary focus:ring-offset-0 focus:ring-1 focus:ring-primary/50 transition-all cursor-pointer"
          :disabled="!showGrid"
        >
        <span>{{ t('preview.snapToGrid') || '网格吸附' }}</span>
      </label>
      
      <div class="w-px h-4 bg-border"></div>

      <div class="flex items-center gap-2 text-sm text-muted-foreground">
        <span class="text-muted-foreground/80">{{ t('settings.gridSize') }}</span>
        <Select 
          :model-value="gridSize"
          :options="[
            { label: '5px', value: 5 },
            { label: '10px', value: 10 },
            { label: '20px', value: 20 },
            { label: '25px', value: 25 },
            { label: '50px', value: 50 },
          ]"
          class="h-7 w-20 px-2 py-1"
          @update:model-value="newVal => { gridSize = Number(newVal); updatePreview() }"
        />
      </div>
    </div>
    
    <!-- Canvas 预览区 -->
    <div class="flex-1 flex items-center justify-center p-8 overflow-auto bg-muted/20">
      <div class="relative shadow-2xl transition-all duration-500 hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.25)] hover:scale-[1.002]">
        <canvas
          ref="canvasRef"
          :width="config.canvas.width"
          :height="config.canvas.height"
          class="max-w-full max-h-full select-none relative z-0"
          :style="{
            maxWidth: '100%',
            height: 'auto',
            cursor: cursorStyle
          }"
          @mousedown="handleMouseDown"
          @mousemove="handleMouseMove"
          @mouseup="handleMouseUp"
          @mouseleave="handleMouseLeave"
        />
        
        <!-- 纸质纹理遮罩 -->
        <div 
          class="absolute inset-0 pointer-events-none z-10 mix-blend-multiply opacity-40"
          style="background-image: url(&quot;data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.15'/%3E%3C/svg%3E&quot;);"
        ></div>
        
        <!-- 细微光泽效果 -->
        <div class="absolute inset-0 pointer-events-none z-10 bg-gradient-to-br from-white/20 to-transparent opacity-50 mix-blend-soft-light" style="pointer-events: none;"></div>
      </div>
    </div>
  </div>
</template>
