<script setup lang="ts">
import { computed } from 'vue'
import type { Field, TextField, ImageField, Anchor } from '@/types'
import { ANCHOR_OPTIONS } from '@/types'
import { Input, Select, Textarea, Label } from '@/components/ui'

interface Props {
  field: Field
  fonts: string[]
}

const props = defineProps<Props>()
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
        <span>基本</span>
        <div class="flex-1 h-px bg-border" />
      </div>
      
      <div class="space-y-3">
        <div>
          <Label>类型</Label>
          <Select
            :model-value="field.type"
            @update:model-value="updateField({ type: $event as 'text' | 'image' })"
          >
            <option value="text">文字</option>
            <option value="image">图片</option>
          </Select>
        </div>
        
        <div class="grid grid-cols-2 gap-2">
          <div>
            <Label>X 坐标 (px)</Label>
            <Input
              type="number"
              :model-value="String(field.position.x)"
              @update:model-value="updatePosition('x', $event)"
            />
          </div>
          <div>
            <Label>Y 坐标 (px)</Label>
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
          <span>内容</span>
          <div class="flex-1 h-px bg-border" />
        </div>
        
        <div>
          <Textarea
            :model-value="textField.text"
            placeholder="输入文字内容..."
            :rows="2"
            @update:model-value="updateTextField({ text: $event })"
          />
          <p class="text-xs text-muted-foreground mt-1">
            使用 <code class="bg-muted px-1 rounded">{字段名}</code> 插入 Excel 数据
          </p>
        </div>
      </div>

      <!-- 字体 -->
      <div>
        <div class="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          <span>🔤</span>
          <span>字体</span>
          <div class="flex-1 h-px bg-border" />
        </div>
        
        <div class="space-y-3">
          <div class="grid grid-cols-2 gap-2">
            <div class="col-span-2">
              <Label>字体</Label>
              <Select
                :model-value="textField.fontFamily"
                @update:model-value="updateTextField({ fontFamily: $event })"
              >
                <option v-for="font in fonts" :key="font" :value="font">
                  {{ font }}
                </option>
              </Select>
            </div>
          </div>
          
          <div class="grid grid-cols-3 gap-2">
            <div>
              <Label>字号</Label>
              <Input
                type="number"
                :model-value="String(textField.fontSize)"
                @update:model-value="updateTextField({ fontSize: parseInt($event) || 32 })"
              />
            </div>
            <div>
              <Label>字重</Label>
              <Select
                :model-value="String(textField.fontWeight)"
                @update:model-value="updateTextField({ fontWeight: parseInt($event) })"
              >
                <option v-for="w in [100, 200, 300, 400, 500, 600, 700, 800, 900]" :key="w" :value="String(w)">
                  {{ w }}
                </option>
              </Select>
            </div>
            <div>
              <Label>对齐</Label>
              <Select
                :model-value="textField.anchor"
                @update:model-value="updateTextField({ anchor: $event as Anchor })"
              >
                <option v-for="opt in ANCHOR_OPTIONS" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </option>
              </Select>
            </div>
          </div>
        </div>
      </div>

      <!-- 颜色 -->
      <div>
        <div class="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          <span>🎨</span>
          <span>颜色</span>
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
          ⚙️ 高级选项
        </summary>
        <div class="p-3 pt-0 space-y-3 border-t bg-background rounded-b-lg">
          <div>
            <Label>自动换行宽度 (px)</Label>
            <Input
              type="number"
              :model-value="String(textField.wrapWidth || '')"
              placeholder="留空则不换行"
              @update:model-value="updateTextField({ wrapWidth: $event ? parseInt($event) : undefined })"
            />
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <Label>行间距</Label>
              <Input
                type="number"
                :model-value="String(textField.lineSpacing || '')"
                placeholder="4"
                @update:model-value="updateTextField({ lineSpacing: $event ? parseFloat($event) : undefined })"
              />
            </div>
            <div>
              <Label>字间距</Label>
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
          <span>图片</span>
          <div class="flex-1 h-px bg-border" />
        </div>
        
        <div>
          <Label>图片路径</Label>
          <Input
            :model-value="imageField.path"
            placeholder="路径或 {字段名}"
            @update:model-value="updateImageField({ path: $event })"
          />
        </div>
      </div>

      <div>
        <div class="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          <span>📐</span>
          <span>尺寸限制</span>
          <div class="flex-1 h-px bg-border" />
        </div>
        
        <div class="grid grid-cols-2 gap-2">
          <div>
            <Label>最大宽度 (px)</Label>
            <Input
              type="number"
              :model-value="String(imageField.maxWidth || '')"
              placeholder="不限制"
              @update:model-value="updateImageField({ maxWidth: $event ? parseInt($event) : undefined })"
            />
          </div>
          <div>
            <Label>最大高度 (px)</Label>
            <Input
              type="number"
              :model-value="String(imageField.maxHeight || '')"
              placeholder="不限制"
              @update:model-value="updateImageField({ maxHeight: $event ? parseInt($event) : undefined })"
            />
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
