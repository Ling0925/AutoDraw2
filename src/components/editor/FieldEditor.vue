<script setup lang="ts">
import { computed, ref, watch, nextTick, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Field, TextField, ImageField, Anchor } from '@/types'
import { Input, Select, Textarea, Label } from '@/components/ui'
import { useAnchorOptions } from '@/composables/useAnchorOptions'

const { t } = useI18n()
const { ANCHOR_OPTIONS } = useAnchorOptions()

// 内置图片列表
const BUILTIN_IMAGES = [
  { name: 'Logo', path: '/src/assets/logo.png', preview: '/src/assets/logo.png' },
  { name: 'QR Code', path: '/src/assets/Qrcode.jpg', preview: '/src/assets/Qrcode.jpg' }
]

interface Props {
  field: Field
  fonts: string[]
}

const props = defineProps<Props>()

// 字体搜索
const fontSearch = ref('')
const fontListRef = ref<HTMLDivElement | null>(null)

// 字体列表：如果当前字体不在列表中，则将其添加到顶部
const displayFonts = computed(() => {
  const currentFont = (isText.value && textField.value?.fontFamily) ? textField.value.fontFamily : ''
  const allFonts = [...props.fonts]
  
  // 如果当前字体不在列表中，添加到顶部
  if (currentFont && typeof currentFont === 'string' && currentFont.trim() && !allFonts.includes(currentFont)) {
    allFonts.unshift(currentFont)
  }
  
  return allFonts
})

const filteredFonts = computed(() => {
  if (!fontSearch.value) {
    return displayFonts.value
  }
  const search = fontSearch.value.toLowerCase()
  return displayFonts.value.filter(font => font.toLowerCase().includes(search))
})

// 滚动到当前字体的函数
function scrollToCurrentFont() {
  if (!isText.value || !textField.value?.fontFamily) return
  
  const currentFont = textField.value.fontFamily
  if (!currentFont || typeof currentFont !== 'string') return
  
  // 使用 setTimeout 确保在 Transition 动画完成后执行
  setTimeout(() => {
    if (!fontListRef.value) return
    
    const fontButton = fontListRef.value.querySelector(`[data-font="${CSS.escape(currentFont)}"]`)
    if (fontButton) {
      fontButton.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, 100)
}

// 监听字段变化，自动滚动到当前字体
watch(
  () => props.field,
  async () => {
    // 重置搜索框
    fontSearch.value = ''
    
    await nextTick()
    scrollToCurrentFont()
  }
)

// 组件挂载时也执行一次滚动
onMounted(() => {
  scrollToCurrentFont()
})

const emit = defineEmits<{
  update: [field: Field]
}>()

const isText = computed(() => props.field.type === 'text')
const textField = computed(() => props.field as TextField)
const imageField = computed(() => props.field as ImageField)

function updateField(updates: Partial<Field>) {
  emit('update', { ...props.field, ...updates } as Field)
}

function updatePosition(key: 'x' | 'y', value: string) {
  updateField({
    position: {
      ...props.field.position,
      [key]: parseFloat(value) || 0
    }
  })
}

function updateTextField(updates: Partial<TextField>) {
  if (isText.value) {
    emit('update', { ...props.field, ...updates } as TextField)
  }
}

function updateImageField(updates: Partial<ImageField>) {
  if (!isText.value) {
    emit('update', { ...props.field, ...updates } as ImageField)
  }
}
</script>

<template>
  <div class="p-4 space-y-4 overflow-y-auto h-full">
    <!-- 基本设置 -->
    <div>
      <div class="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
        <span>📋</span>
        <span>{{ t('editor.basicSettings') }}</span>
        <div class="flex-1 h-px bg-border" />
      </div>
      
      <div class="space-y-3">
        <div>
          <Label>{{ t('editor.type') }}</Label>
          <Select
            :model-value="field.type"
            :options="[
              { label: t('editor.typeText'), value: 'text' },
              { label: t('editor.typeImage'), value: 'image' }
            ]"
            @update:model-value="updateField({ type: $event as 'text' | 'image' })"
          />
        </div>
        
        <div class="grid grid-cols-2 gap-2">
          <div>
            <Label>{{ t('editor.x') }}</Label>
            <Input
              type="number"
              :model-value="String(field.position.x)"
              @update:model-value="updatePosition('x', $event)"
            />
          </div>
          <div>
            <Label>{{ t('editor.y') }}</Label>
            <Input
              type="number"
              :model-value="String(field.position.y)"
              @update:model-value="updatePosition('y', $event)"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 文字设置 -->
    <template v-if="isText">
      <!-- 内容 -->
      <div>
        <div class="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          <span>✏️</span>
          <span>{{ t('editor.content') }}</span>
          <div class="flex-1 h-px bg-border" />
        </div>
        
        <div>
          <Textarea
            :model-value="textField.text"
            :placeholder="t('editor.placeholderHint')"
            :rows="2"
            @update:model-value="updateTextField({ text: $event })"
          />
          <p class="text-xs text-muted-foreground mt-1">
            {{ t('editor.placeholderHint') }}
          </p>
        </div>
      </div>

      <!-- 字体 -->
      <div>
        <div class="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          <span>🔤</span>
          <span>{{ t('editor.font') }}</span>
          <span class="text-xs font-normal">({{ fonts.length }})</span>
          <div class="flex-1 h-px bg-border" />
        </div>
        
        <div class="space-y-3">
          <div class="grid grid-cols-2 gap-2">
            <div class="col-span-2">
              <Label>{{ t('editor.font') }}</Label>
              <!-- 字体搜索框 -->
              <Input
                v-model="fontSearch"
                type="text"
                :placeholder="t('editor.searchFont')"
                class="mb-2"
              />
              <!-- 字体选择列表 -->
              <div ref="fontListRef" class="border rounded-md max-h-48 overflow-y-auto bg-background">
                <!-- 字体列表 -->
                <button
                  v-for="font in filteredFonts.slice(0, 100)"
                  :key="font"
                  :data-font="font"
                  type="button"
                  class="w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                  :class="{
                    'bg-accent text-accent-foreground': font === textField.fontFamily,
                    'border-b border-primary/20': font === textField.fontFamily && !props.fonts.includes(font)
                  }"
                  :style="{ fontFamily: font }"
                  @click="updateTextField({ fontFamily: font })"
                >
                  <div class="flex items-center justify-between">
                    <span>{{ font }}</span>
                    <span v-if="!props.fonts.includes(font)" class="text-xs text-primary bg-primary/10 px-1.5 py-0.5 rounded">自定义</span>
                  </div>
                </button>
                
                <!-- 无结果提示 -->
                <div v-if="filteredFonts.length === 0" class="px-3 py-4 text-sm text-center text-muted-foreground">
                  {{ t('editor.noFontsFound') }}
                </div>
                
                <!-- 结果过多提示 -->
                <div v-if="filteredFonts.length > 100" class="px-3 py-2 text-xs text-center text-muted-foreground border-t bg-muted/50">
                  显示前 100 个结果，共 {{ filteredFonts.length }} 个
                </div>
              </div>
              
              <p v-if="fontSearch && filteredFonts.length > 0" class="text-xs text-muted-foreground mt-1">
                找到 {{ filteredFonts.length }} 个匹配字体
              </p>
            </div>
             <div class="col-span-2">
              <Label>{{ t('editor.anchor') }}</Label>
              <Select
                :model-value="textField.anchor"
                :options="ANCHOR_OPTIONS"
                @update:model-value="updateTextField({ anchor: $event as Anchor })"
              />
            </div>
          </div>
          
          <div class="grid grid-cols-2 gap-2">
            <div>
              <Label>{{ t('editor.fontSize') }}</Label>
              <Input
                type="number"
                :model-value="String(textField.fontSize)"
                @update:model-value="updateTextField({ fontSize: parseInt($event) || 32 })"
              />
            </div>
            <div>
              <Label>{{ t('editor.bold') }}</Label>
              <Select
                :model-value="textField.fontWeight"
                :options="[100, 200, 300, 400, 500, 600, 700, 800, 900].map(w => ({ label: String(w), value: w }))"
                @update:model-value="updateTextField({ fontWeight: Number($event) })"
              />
            </div>
           
          </div>
        </div>
      </div>

      <!-- 颜色 -->
      <div>
        <div class="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          <span>🎨</span>
          <span>{{ t('editor.color') }}</span>
          <div class="flex-1 h-px bg-border" />
        </div>
        
        <div class="flex items-center gap-2">
          <input
            type="color"
            :value="textField.color"
            class="w-10 h-10 rounded-lg border border-input cursor-pointer p-0.5"
            @input="updateTextField({ color: ($event.target as HTMLInputElement).value })"
          >
          <Input
            :model-value="textField.color"
            class="flex-1 font-mono"
            @update:model-value="updateTextField({ color: $event })"
          />
        </div>
      </div>

      <!-- 高级选项 -->
      <details class="border rounded-lg bg-muted/30">
        <summary class="p-3 cursor-pointer font-medium text-sm text-muted-foreground hover:text-foreground">
          ⚙️ {{ t('settings.title') }}
        </summary>
        <div class="p-3 pt-0 space-y-3 border-t bg-background rounded-b-lg">
          <div>
            <Label>{{ t('editor.maxWidth') }}</Label>
            <Input
              type="number"
              :model-value="String(textField.wrapWidth || '')"
              :placeholder="t('editor.maxWidth')"
              @update:model-value="updateTextField({ wrapWidth: $event ? parseInt($event) : undefined })"
            />
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <Label>{{ t('editor.lineHeight') }}</Label>
              <Input
                type="number"
                :model-value="String(textField.lineSpacing || '')"
                placeholder="4"
                @update:model-value="updateTextField({ lineSpacing: $event ? parseFloat($event) : undefined })"
              />
            </div>
            <div>
              <Label>{{ t('editor.letterSpacing') || 'Letter Spacing' }}</Label>
              <Input
                type="number"
                :model-value="String(textField.letterSpacing || '')"
                placeholder="0"
                @update:model-value="updateTextField({ letterSpacing: $event ? parseFloat($event) : undefined })"
              />
            </div>
          </div>
        </div>
      </details>
    </template>

    <!-- 图片设置 -->
    <template v-else>
      <div>
        <div class="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          <span>🖼️</span>
          <span>{{ t('editor.imageSettings') }}</span>
          <div class="flex-1 h-px bg-border" />
        </div>
        
        <div class="space-y-3">
          <div>
            <Label>{{ t('editor.imageUrl') }}</Label>
            <Input
              :model-value="imageField.path"
              :placeholder="t('editor.imageUrlHint')"
              @update:model-value="updateImageField({ path: $event })"
            />
          </div>
          
          <!-- 内置图片选择 -->
          <div>
            <Label>{{ t('editor.builtinImages') }}</Label>
            <div class="grid grid-cols-3 gap-2 mt-2">
              <button
                v-for="img in BUILTIN_IMAGES"
                :key="img.path"
                class="relative aspect-square border-2 rounded-lg overflow-hidden hover:border-primary transition-colors"
                :class="imageField.path === img.path ? 'border-primary ring-2 ring-primary/20' : 'border-border'"
                @click="updateImageField({ path: img.path })"
                :title="img.name"
              >
                <img 
                  :src="img.preview" 
                  :alt="img.name"
                  class="w-full h-full object-contain bg-muted/50 p-1"
                >
                <span class="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs py-0.5 text-center truncate">
                  {{ img.name }}
                </span>
              </button>
            </div>
            <p class="text-xs text-muted-foreground mt-2">
              点击选择内置图片，或在上方输入自定义路径
            </p>
          </div>
        </div>
      </div>

      <div>
        <div class="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          <span>📐</span>
          <span>{{ t('settings.title') }}</span>
          <div class="flex-1 h-px bg-border" />
        </div>
        
        <div class="grid grid-cols-2 gap-2">
          <div>
            <Label>{{ t('editor.imageWidth') }}</Label>
            <Input
              type="number"
              :model-value="String(imageField.maxWidth || '')"
              :placeholder="t('editor.maxWidth')"
              @update:model-value="updateImageField({ maxWidth: $event ? parseInt($event) : undefined })"
            />
          </div>
          <div>
            <Label>{{ t('editor.imageHeight') }}</Label>
            <Input
              type="number"
              :model-value="String(imageField.maxHeight || '')"
              :placeholder="t('editor.maxWidth')"
              @update:model-value="updateImageField({ maxHeight: $event ? parseInt($event) : undefined })"
            />
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
