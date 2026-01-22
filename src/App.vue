<script setup lang="ts">
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
import type { CardConfig, ExcelRecord, Field } from '@/types'
import { getDefaultConfig, createDefaultTextField, createDefaultImageField } from '@/types'
import { parseExcel, exportCards, exportConfig, importConfig, getAvailableFonts, DEFAULT_FONTS, 
         saveConfig, loadConfig, saveRecords, loadRecords, saveCurrentIndex, loadCurrentIndex,
         saveUploadedImages, loadUploadedImages, autoSave, HistoryManager, deepClone } from '@/utils'
import { Button, Select } from '@/components/ui'
import { PreviewCanvas, FieldList, FieldEditor, SettingsPanel } from '@/components/editor'
import { Upload, Download, FileSpreadsheet, Image as ImageIcon, Loader2, Save, Undo2, Redo2 } from 'lucide-vue-next'

// 状态
const config = ref<CardConfig>(getDefaultConfig())
const records = ref<ExcelRecord[]>([])
const currentRecordIndex = ref(0)
const selectedFieldIndex = ref<number | undefined>(undefined)
const uploadedImages = ref<Map<string, string>>(new Map())
const isExporting = ref(false)
const exportProgress = ref({ current: 0, total: 0 })
const lastSaved = ref<Date | null>(null)

// 历史管理
const historyManager = new HistoryManager<CardConfig>(50)
let isUndoRedoOperation = false
const historyState = ref({ canUndo: false, canRedo: false })

// 更新历史状态
function updateHistoryState() {
  historyState.value = {
    canUndo: historyManager.canUndo(),
    canRedo: historyManager.canRedo()
  }
}

// 字体列表（初始使用默认字体，之后加载系统字体）
const fonts = ref<string[]>(DEFAULT_FONTS)
const fontsLoading = ref(false)
const fontsError = ref<string | null>(null)

// 加载系统字体
async function loadSystemFonts() {
  fontsLoading.value = true
  fontsError.value = null
  try {
    fonts.value = await getAvailableFonts()
  } catch (error) {
    fontsError.value = '加载系统字体失败'
    console.error('Failed to load system fonts:', error)
  } finally {
    fontsLoading.value = false
  }
}

// 从本地存储恢复数据
function restoreFromStorage() {
  const savedConfig = loadConfig()
  if (savedConfig) {
    config.value = savedConfig
    console.log('已恢复保存的配置')
  }
  
  const savedRecords = loadRecords()
  if (savedRecords) {
    records.value = savedRecords
    console.log('已恢复保存的数据')
  }
  
  const savedIndex = loadCurrentIndex()
  if (savedIndex !== null && savedIndex < records.value.length) {
    currentRecordIndex.value = savedIndex
  }
  
  const savedImages = loadUploadedImages()
  if (savedImages) {
    uploadedImages.value = savedImages
    console.log('已恢复上传的图片')
  }
}

// 保存到本地存储
function saveToStorage() {
  saveConfig(config.value)
  saveRecords(records.value)
  saveCurrentIndex(currentRecordIndex.value)
  saveUploadedImages(uploadedImages.value)
  lastSaved.value = new Date()
  console.log('已自动保存')
}

// 监听数据变化，自动保存
watch(
  () => [config.value, records.value, currentRecordIndex.value, uploadedImages.value],
  () => {
    autoSave(saveToStorage)
  },
  { deep: true }
)

// 监听配置变化，保存到历史记录
watch(
  () => config.value,
  (newConfig) => {
    if (!isUndoRedoOperation) {
      historyManager.push(deepClone(newConfig))
      updateHistoryState()
    }
  },
  { deep: true }
)

// 撤销操作
function handleUndo() {
  const prevState = historyManager.undo()
  if (prevState) {
    isUndoRedoOperation = true
    config.value = deepClone(prevState)
    updateHistoryState()
    // 等待下一个 tick 后重置标志
    setTimeout(() => {
      isUndoRedoOperation = false
    }, 0)
  }
}

// 重做操作
function handleRedo() {
  const nextState = historyManager.redo()
  if (nextState) {
    isUndoRedoOperation = true
    config.value = deepClone(nextState)
    updateHistoryState()
    // 等待下一个 tick 后重置标志
    setTimeout(() => {
      isUndoRedoOperation = false
    }, 0)
  }
}

// 计算属性：是否可以撤销/重做
const canUndo = computed(() => historyState.value.canUndo)
const canRedo = computed(() => historyState.value.canRedo)

// 键盘快捷键
function handleKeyDown(event: KeyboardEvent) {
  // Ctrl+Z / Cmd+Z - 撤销
  if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
    event.preventDefault()
    handleUndo()
  }
  // Ctrl+Y / Cmd+Shift+Z - 重做
  if ((event.ctrlKey || event.metaKey) && (event.key === 'y' || (event.key === 'z' && event.shiftKey))) {
    event.preventDefault()
    handleRedo()
  }
}

// 组件挂载时加载系统字体和恢复数据
onMounted(() => {
  loadSystemFonts()
  restoreFromStorage()
  
  // 初始化历史记录
  historyManager.push(deepClone(config.value))
  updateHistoryState()
  
  // 添加键盘事件监听
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  // 移除键盘事件监听
  window.removeEventListener('keydown', handleKeyDown)
})

// 计算属性
const currentRecord = computed<ExcelRecord>(() => {
  if (records.value.length === 0) {
    return { 姓名: '张三', 公司: '示例公司', 职称: '工程师' }
  }
  return records.value[currentRecordIndex.value] ?? records.value[0] ?? { 姓名: '张三', 公司: '示例公司', 职称: '工程师' }
})

const selectedField = computed(() => {
  if (selectedFieldIndex.value === undefined) return undefined
  return config.value.fields[selectedFieldIndex.value]
})

// 文件输入 refs
const configFileInput = ref<HTMLInputElement | null>(null)
const excelFileInput = ref<HTMLInputElement | null>(null)

// 方法
function handleAddField(type: 'text' | 'image') {
  const newField = type === 'text' ? createDefaultTextField() : createDefaultImageField()
  config.value.fields.push(newField)
  selectedFieldIndex.value = config.value.fields.length - 1
}

function handleRemoveField(index: number) {
  config.value.fields.splice(index, 1)
  if (selectedFieldIndex.value === index) {
    selectedFieldIndex.value = undefined
  } else if (selectedFieldIndex.value !== undefined && selectedFieldIndex.value > index) {
    selectedFieldIndex.value--
  }
}

function handleSelectField(index: number | undefined) {
  selectedFieldIndex.value = index
}

function handleUpdateField(field: Field) {
  if (selectedFieldIndex.value !== undefined) {
    config.value.fields[selectedFieldIndex.value] = field
  }
}

function handleUpdateFieldByIndex(index: number, field: Field) {
  config.value.fields[index] = field
}

async function handleLoadConfig() {
  configFileInput.value?.click()
}

async function handleConfigFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  
  try {
    const loadedConfig = await importConfig(file)
    config.value = loadedConfig
    selectedFieldIndex.value = undefined
  } catch (error) {
    console.error('Failed to load config:', error)
    alert('配置文件加载失败')
  }
  
  input.value = ''
}

function handleSaveConfig() {
  exportConfig(config.value, 'card-config.json')
}

async function handleLoadExcel() {
  excelFileInput.value?.click()
}

async function handleExcelFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  
  try {
    records.value = await parseExcel(file)
    currentRecordIndex.value = 0
  } catch (error) {
    console.error('Failed to load Excel:', error)
    alert('Excel 文件加载失败')
  }
  
  input.value = ''
}

async function handleExport() {
  if (records.value.length === 0) {
    alert('请先加载 Excel 数据')
    return
  }
  
  isExporting.value = true
  exportProgress.value = { current: 0, total: records.value.length }
  
  try {
    await exportCards(
      config.value,
      records.value,
      uploadedImages.value,
      (current, total) => {
        exportProgress.value = { current, total }
      }
    )
  } catch (error) {
    console.error('Export failed:', error)
    alert('导出失败')
  } finally {
    isExporting.value = false
  }
}
</script>

<template>
  <div class="h-screen flex flex-col bg-background">
    <!-- 顶部工具栏 -->
    <header class="bg-background border-b px-6 py-3">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <h1 class="text-xl font-bold">🎨 AutoDraw</h1>
          <span class="text-sm text-muted-foreground">名片批量生成工具</span>
          <span v-if="lastSaved" class="text-xs text-muted-foreground flex items-center gap-1">
            <Save class="w-3 h-3" />
            已保存 {{ new Date(lastSaved).toLocaleTimeString() }}
          </span>
        </div>
        
        <div class="flex items-center gap-3">
          <!-- 撤销/重做按钮 -->
          <div class="flex items-center gap-1 border-r pr-3">
            <Button 
              variant="ghost" 
              size="sm"
              :disabled="!canUndo" 
              @click="handleUndo"
              title="撤销 (Ctrl+Z)"
            >
              <Undo2 class="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              :disabled="!canRedo" 
              @click="handleRedo"
              title="重做 (Ctrl+Y)"
            >
              <Redo2 class="w-4 h-4" />
            </Button>
          </div>
          
          <Button variant="outline" @click="handleLoadConfig">
            <Upload class="w-4 h-4 mr-2" />
            加载配置
          </Button>
          <Button variant="outline" @click="handleSaveConfig">
            <Download class="w-4 h-4 mr-2" />
            保存配置
          </Button>
          <Button variant="outline" @click="handleLoadExcel">
            <FileSpreadsheet class="w-4 h-4 mr-2" />
            加载 Excel
          </Button>
          <Button :disabled="isExporting" @click="handleExport">
            <Loader2 v-if="isExporting" class="w-4 h-4 mr-2 animate-spin" />
            <ImageIcon v-else class="w-4 h-4 mr-2" />
            {{ isExporting ? `导出中 ${exportProgress.current}/${exportProgress.total}` : '批量生成' }}
          </Button>
        </div>
      </div>
    </header>

    <!-- 主内容区 -->
    <main class="flex flex-1 overflow-hidden">
      <!-- 左侧 - 字段列表 -->
      <FieldList
        :fields="config.fields"
        :selected-index="selectedFieldIndex"
        @select="handleSelectField"
        @add="handleAddField"
        @remove="handleRemoveField"
      />

      <!-- 中间 - 预览区 -->
      <section class="flex-1 flex flex-col bg-muted/30">
        <!-- 数据选择 -->
        <div class="p-4 border-b bg-background flex items-center justify-between">
          <div class="flex items-center gap-4">
            <span class="text-sm text-muted-foreground">预览数据：</span>
            <Select
              :model-value="String(currentRecordIndex)"
              class="w-64"
              :disabled="records.length === 0"
              @update:model-value="currentRecordIndex = parseInt($event)"
            >
              <option v-if="records.length === 0" value="0">请先加载 Excel</option>
              <option v-for="(record, i) in records" :key="i" :value="String(i)">
                第 {{ i + 1 }} 条 - {{ Object.values(record).slice(0, 2).join(' / ') }}
              </option>
            </Select>
          </div>
          <span class="text-sm text-muted-foreground">
            {{ config.canvas.width }} × {{ config.canvas.height }}
          </span>
        </div>

        <!-- Canvas 预览 -->
        <PreviewCanvas
          :config="config"
          :record="currentRecord"
          :record-index="currentRecordIndex + 1"
          :selected-field-index="selectedFieldIndex"
          :uploaded-images="uploadedImages"
          @select-field="handleSelectField"
          @update-field="handleUpdateFieldByIndex"
        />
      </section>

      <!-- 右侧 - 属性面板 -->
      <aside class="w-80 bg-background border-l flex flex-col overflow-hidden">
        <!-- 画布和输出设置 -->
        <SettingsPanel
          :canvas="config.canvas"
          :output="config.output"
          @update:canvas="config.canvas = $event"
          @update:output="config.output = $event"
        />

        <!-- 字段设置 -->
        <div class="flex-1 flex flex-col overflow-hidden border-t">
          <div class="p-4 border-b">
            <h2 class="font-semibold text-sm">字段设置</h2>
          </div>
          
          <div v-if="selectedField" class="flex-1 overflow-hidden">
            <FieldEditor
              :field="selectedField"
              :fonts="fonts"
              @update="handleUpdateField"
            />
          </div>
          <div v-else class="flex-1 flex items-center justify-center text-muted-foreground text-sm">
            选择一个字段进行编辑
          </div>
        </div>
      </aside>
    </main>

    <!-- 隐藏的文件输入 -->
    <input
      ref="configFileInput"
      type="file"
      accept=".json"
      class="hidden"
      @change="handleConfigFileChange"
    >
    <input
      ref="excelFileInput"
      type="file"
      accept=".xlsx,.xls"
      class="hidden"
      @change="handleExcelFileChange"
    >
  </div>
</template>

