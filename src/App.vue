<script setup lang="ts">
import { ref, computed } from 'vue'
import type { CardConfig, ExcelRecord, Field } from '@/types'
import { getDefaultConfig, createDefaultTextField, createDefaultImageField } from '@/types'
import { parseExcel, exportCards, exportConfig, importConfig } from '@/utils'
import { Button, Select } from '@/components/ui'
import { PreviewCanvas, FieldList, FieldEditor, SettingsPanel } from '@/components/editor'
import { Upload, Download, FileSpreadsheet, Image as ImageIcon, Loader2 } from 'lucide-vue-next'

// 状态
const config = ref<CardConfig>(getDefaultConfig())
const records = ref<ExcelRecord[]>([])
const currentRecordIndex = ref(0)
const selectedFieldIndex = ref<number | undefined>(undefined)
const uploadedImages = ref<Map<string, string>>(new Map())
const isExporting = ref(false)
const exportProgress = ref({ current: 0, total: 0 })

// 常用字体列表
const fonts = ref([
  'Microsoft YaHei',
  'SimHei',
  'SimSun',
  'KaiTi',
  'FangSong',
  'Arial',
  'Times New Roman',
  'Georgia',
  'Verdana'
])

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

function handleSelectField(index: number) {
  selectedFieldIndex.value = index
}

function handleUpdateField(field: Field) {
  if (selectedFieldIndex.value !== undefined) {
    config.value.fields[selectedFieldIndex.value] = field
  }
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
        </div>
        
        <div class="flex items-center gap-3">
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

