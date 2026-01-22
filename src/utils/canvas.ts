import type { Field, TextField, ImageField, CanvasConfig, ExcelRecord, Anchor } from '@/types'

// 用于存储已加载的图片
const imageCache = new Map<string, HTMLImageElement>()

/**
 * 加载图片并缓存
 */
async function loadImage(src: string): Promise<HTMLImageElement> {
  if (imageCache.has(src)) {
    return imageCache.get(src)!
  }
  
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      imageCache.set(src, img)
      resolve(img)
    }
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`))
    img.src = src
  })
}

/**
 * 格式化模板字符串，替换 {字段名} 为实际值
 * @returns 格式化后的字符串，如果存在未匹配的占位符则返回 null
 */
export function formatTemplate(template: string, record: ExcelRecord, index: number): string | null {
  let result = template
  
  // 替换 {index} 和 {index:XXd} 格式
  result = result.replace(/\{index(?::(\d+)d)?\}/g, (_, padding) => {
    if (padding) {
      return String(index).padStart(parseInt(padding), '0')
    }
    return String(index)
  })
  
  // 替换其他字段
  for (const [key, value] of Object.entries(record)) {
    const regex = new RegExp(`\\{${key}\\}`, 'g')
    result = result.replace(regex, String(value ?? ''))
  }
  
  // 检查是否还有未替换的占位符
  // 如果存在未匹配的占位符 {xxx}，则返回 null 表示该字段不应显示
  if (/\{[^}]+\}/.test(result)) {
    return null
  }
  
  return result
}

/**
 * 计算锚点偏移
 */
function getAnchorOffset(
  anchor: Anchor,
  width: number,
  height: number,
  ascent: number
): { dx: number; dy: number } {
  let dx = 0
  let dy = 0
  
  // 水平对齐
  if (anchor.startsWith('m')) {
    dx = -width / 2
  } else if (anchor.startsWith('r')) {
    dx = -width
  }
  
  // 垂直对齐
  const verticalPart = anchor.charAt(1)
  if (verticalPart === 'a') {
    // 基线对齐 - 使用 ascent
    dy = -ascent
  } else if (verticalPart === 't') {
    dy = 0
  } else if (verticalPart === 'm') {
    dy = -height / 2
  } else if (verticalPart === 'b') {
    dy = -height
  }
  
  return { dx, dy }
}

/**
 * 文字换行处理
 */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  letterSpacing: number = 0
): string[] {
  const lines: string[] = []
  const paragraphs = text.split('\n')
  
  for (const paragraph of paragraphs) {
    if (!paragraph) {
      lines.push('')
      continue
    }
    
    let currentLine = ''
    
    for (const char of paragraph) {
      const testLine = currentLine + char
      const metrics = ctx.measureText(testLine)
      const testWidth = metrics.width + (testLine.length - 1) * letterSpacing
      
      if (testWidth > maxWidth && currentLine) {
        lines.push(currentLine)
        currentLine = char
      } else {
        currentLine = testLine
      }
    }
    
    if (currentLine) {
      lines.push(currentLine)
    }
  }
  
  return lines
}

/**
 * 绘制带字间距的文字
 */
function drawTextWithSpacing(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  letterSpacing: number = 0
): number {
  if (letterSpacing === 0) {
    ctx.fillText(text, x, y)
    return ctx.measureText(text).width
  }
  
  let currentX = x
  for (const char of text) {
    ctx.fillText(char, currentX, y)
    currentX += ctx.measureText(char).width + letterSpacing
  }
  return currentX - x
}

/**
 * 计算文字总宽度（含字间距）
 */
function measureTextWithSpacing(
  ctx: CanvasRenderingContext2D,
  text: string,
  letterSpacing: number = 0
): number {
  if (letterSpacing === 0) {
    return ctx.measureText(text).width
  }
  return ctx.measureText(text).width + (text.length - 1) * letterSpacing
}

/**
 * 绘制文字字段
 */
function drawTextField(
  ctx: CanvasRenderingContext2D,
  field: TextField,
  record: ExcelRecord,
  index: number
): void {
  const text = formatTemplate(field.text, record, index)
  // 如果返回 null（存在未匹配的占位符）或空字符串，则不绘制
  if (text === null || text === '') return
  
  // 设置字体
  const fontWeight = field.fontWeight || 400
  const fontSize = field.fontSize || 32
  const fontFamily = field.fontFamily || 'Microsoft YaHei'
  ctx.font = `${fontWeight} ${fontSize}px "${fontFamily}"`
  ctx.fillStyle = field.color || '#000000'
  ctx.textBaseline = 'alphabetic'
  
  const letterSpacing = field.letterSpacing || 0
  const lineSpacing = field.lineSpacing || 4
  
  // 处理换行
  let lines: string[]
  if (field.wrapWidth && field.wrapWidth > 0) {
    lines = wrapText(ctx, text, field.wrapWidth, letterSpacing)
  } else {
    lines = text.split('\n')
  }
  
  // 计算总高度和最大宽度
  const lineHeight = fontSize + lineSpacing
  const totalHeight = lines.length * lineHeight - lineSpacing
  
  let maxWidth = 0
  for (const line of lines) {
    const w = measureTextWithSpacing(ctx, line, letterSpacing)
    if (w > maxWidth) maxWidth = w
  }
  
  // 计算锚点偏移
  const metrics = ctx.measureText('M')
  const ascent = metrics.actualBoundingBoxAscent || fontSize * 0.8
  const { dx, dy } = getAnchorOffset(field.anchor || 'la', maxWidth, totalHeight, ascent)
  
  // 绘制每一行
  let y = field.position.y + dy + ascent
  for (const line of lines) {
    let lineX = field.position.x + dx
    
    // 处理行内水平对齐
    if (field.anchor.startsWith('m')) {
      const lineWidth = measureTextWithSpacing(ctx, line, letterSpacing)
      lineX = field.position.x - lineWidth / 2
    } else if (field.anchor.startsWith('r')) {
      const lineWidth = measureTextWithSpacing(ctx, line, letterSpacing)
      lineX = field.position.x - lineWidth
    }
    
    drawTextWithSpacing(ctx, line, lineX, y, letterSpacing)
    y += lineHeight
  }
}

/**
 * 绘制图片字段
 */
async function drawImageField(
  ctx: CanvasRenderingContext2D,
  field: ImageField,
  record: ExcelRecord,
  index: number,
  uploadedImages: Map<string, string>
): Promise<void> {
  const path = formatTemplate(field.path, record, index)
  // 如果返回 null（存在未匹配的占位符）或空字符串，则不绘制
  if (path === null || path === '') return
  
  try {
    // 检查是否是上传的图片
    let imgSrc = path
    if (uploadedImages.has(path)) {
      imgSrc = uploadedImages.get(path)!
    }
    
    const img = await loadImage(imgSrc)
    
    let width = img.width
    let height = img.height
    
    // 等比例缩放
    if (field.maxWidth && width > field.maxWidth) {
      const ratio = field.maxWidth / width
      width = field.maxWidth
      height = height * ratio
    }
    if (field.maxHeight && height > field.maxHeight) {
      const ratio = field.maxHeight / height
      height = field.maxHeight
      width = width * ratio
    }
    
    ctx.drawImage(img, field.position.x, field.position.y, width, height)
  } catch (error) {
    console.warn(`Failed to draw image: ${path}`, error)
  }
}

/**
 * 渲染单张名片到 Canvas
 */
export async function renderCard(
  canvas: HTMLCanvasElement,
  config: { canvas: CanvasConfig; fields: Field[] },
  record: ExcelRecord,
  index: number,
  uploadedImages: Map<string, string> = new Map(),
  highlightFieldIndex?: number
): Promise<void> {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  
  const { canvas: canvasConfig, fields } = config
  
  // 设置画布尺寸
  canvas.width = canvasConfig.width
  canvas.height = canvasConfig.height
  
  // 绘制背景
  if (canvasConfig.backgroundImage) {
    try {
      let bgSrc = canvasConfig.backgroundImage
      if (uploadedImages.has(bgSrc)) {
        bgSrc = uploadedImages.get(bgSrc)!
      }
      const bgImg = await loadImage(bgSrc)
      ctx.drawImage(bgImg, 0, 0, canvasConfig.width, canvasConfig.height)
    } catch {
      ctx.fillStyle = canvasConfig.backgroundColor || '#FFFFFF'
      ctx.fillRect(0, 0, canvasConfig.width, canvasConfig.height)
    }
  } else {
    ctx.fillStyle = canvasConfig.backgroundColor || '#FFFFFF'
    ctx.fillRect(0, 0, canvasConfig.width, canvasConfig.height)
  }
  
  // 绘制字段
  for (let i = 0; i < fields.length; i++) {
    const field = fields[i]
    if (!field) continue
    
    if (field.type === 'text') {
      drawTextField(ctx, field, record, index)
    } else if (field.type === 'image') {
      await drawImageField(ctx, field, record, index, uploadedImages)
    }
  }
  
  // 绘制选中框（在所有字段绘制完成后，使用准确的边界框）
  if (highlightFieldIndex !== undefined && highlightFieldIndex >= 0) {
    const bounds = calculateAllFieldBounds(canvas, config, record, index, uploadedImages)
    const selectedBounds = bounds.find(b => b.index === highlightFieldIndex)
    
    if (selectedBounds) {
      ctx.strokeStyle = '#3b82f6'
      ctx.lineWidth = 2
      ctx.setLineDash([5, 3])
      
      const padding = 5
      ctx.strokeRect(
        selectedBounds.x - padding,
        selectedBounds.y - padding,
        selectedBounds.width + padding * 2,
        selectedBounds.height + padding * 2
      )
      
      ctx.setLineDash([])
    }
  }
}

// 离屏 canvas 缓存（用于双缓冲）
let offscreenCanvas: HTMLCanvasElement | null = null
let offscreenCtx: CanvasRenderingContext2D | null = null

/**
 * 使用双缓冲渲染名片（避免闪烁）
 */
export async function renderCardDoubleBuffered(
  canvas: HTMLCanvasElement,
  config: { canvas: CanvasConfig; fields: Field[] },
  record: ExcelRecord,
  index: number,
  uploadedImages: Map<string, string> = new Map(),
  highlightFieldIndex?: number
): Promise<void> {
  const { canvas: canvasConfig, fields } = config
  
  // 创建或复用离屏 canvas
  if (!offscreenCanvas || offscreenCanvas.width !== canvasConfig.width || offscreenCanvas.height !== canvasConfig.height) {
    offscreenCanvas = document.createElement('canvas')
    offscreenCanvas.width = canvasConfig.width
    offscreenCanvas.height = canvasConfig.height
    offscreenCtx = offscreenCanvas.getContext('2d')
  }
  
  if (!offscreenCtx) return
  
  const ctx = offscreenCtx
  
  // 清空离屏 canvas
  ctx.clearRect(0, 0, canvasConfig.width, canvasConfig.height)
  
  // 绘制背景
  if (canvasConfig.backgroundImage) {
    try {
      let bgSrc = canvasConfig.backgroundImage
      if (uploadedImages.has(bgSrc)) {
        bgSrc = uploadedImages.get(bgSrc)!
      }
      const bgImg = await loadImage(bgSrc)
      ctx.drawImage(bgImg, 0, 0, canvasConfig.width, canvasConfig.height)
    } catch {
      ctx.fillStyle = canvasConfig.backgroundColor || '#FFFFFF'
      ctx.fillRect(0, 0, canvasConfig.width, canvasConfig.height)
    }
  } else {
    ctx.fillStyle = canvasConfig.backgroundColor || '#FFFFFF'
    ctx.fillRect(0, 0, canvasConfig.width, canvasConfig.height)
  }
  
  // 绘制字段
  for (let i = 0; i < fields.length; i++) {
    const field = fields[i]
    if (!field) continue
    
    if (field.type === 'text') {
      drawTextField(ctx, field, record, index)
    } else if (field.type === 'image') {
      await drawImageField(ctx, field, record, index, uploadedImages)
    }
  }
  
  // 绘制选中框（在所有字段绘制完成后，使用准确的边界框）
  if (highlightFieldIndex !== undefined && highlightFieldIndex >= 0) {
    const bounds = calculateAllFieldBounds(offscreenCanvas, config, record, index, uploadedImages)
    const selectedBounds = bounds.find(b => b.index === highlightFieldIndex)
    
    if (selectedBounds) {
      ctx.strokeStyle = '#3b82f6'
      ctx.lineWidth = 2
      ctx.setLineDash([5, 3])
      
      const padding = 5
      ctx.strokeRect(
        selectedBounds.x - padding,
        selectedBounds.y - padding,
        selectedBounds.width + padding * 2,
        selectedBounds.height + padding * 2
      )
      
      ctx.setLineDash([])
    }
  }
  
  // 一次性复制到显示 canvas（避免闪烁）
  const displayCtx = canvas.getContext('2d')
  if (displayCtx) {
    canvas.width = canvasConfig.width
    canvas.height = canvasConfig.height
    displayCtx.drawImage(offscreenCanvas, 0, 0)
  }
}

/**
 * 将 Canvas 导出为 Blob
 */
export function canvasToBlob(canvas: HTMLCanvasElement, format: 'PNG' | 'JPEG'): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const mimeType = format === 'JPEG' ? 'image/jpeg' : 'image/png'
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('Failed to create blob'))
        }
      },
      mimeType,
      0.95
    )
  })
}

/**
 * 字段边界框
 */
export interface FieldBounds {
  index: number
  x: number
  y: number
  width: number
  height: number
}

/**
 * 计算文字字段的边界框
 */
function calculateTextFieldBounds(
  ctx: CanvasRenderingContext2D,
  field: TextField,
  record: ExcelRecord,
  index: number,
  fieldIndex: number
): FieldBounds | null {
  const text = formatTemplate(field.text, record, index)
  if (text === null || text === '') return null
  
  const fontWeight = field.fontWeight || 400
  const fontSize = field.fontSize || 32
  const fontFamily = field.fontFamily || 'Microsoft YaHei'
  ctx.font = `${fontWeight} ${fontSize}px "${fontFamily}"`
  
  const letterSpacing = field.letterSpacing || 0
  const lineSpacing = field.lineSpacing || 4
  
  let lines: string[]
  if (field.wrapWidth && field.wrapWidth > 0) {
    lines = wrapText(ctx, text, field.wrapWidth, letterSpacing)
  } else {
    lines = text.split('\n')
  }
  
  const lineHeight = fontSize + lineSpacing
  const totalHeight = lines.length * lineHeight - lineSpacing
  
  let maxWidth = 0
  for (const line of lines) {
    const w = measureTextWithSpacing(ctx, line, letterSpacing)
    if (w > maxWidth) maxWidth = w
  }
  
  const metrics = ctx.measureText('M')
  const ascent = metrics.actualBoundingBoxAscent || fontSize * 0.8
  const { dx, dy } = getAnchorOffset(field.anchor || 'la', maxWidth, totalHeight, ascent)
  
  return {
    index: fieldIndex,
    x: field.position.x + dx,
    y: field.position.y + dy,
    width: maxWidth,
    height: totalHeight
  }
}

/**
 * 计算图片字段的边界框
 */
function calculateImageFieldBounds(
  field: ImageField,
  record: ExcelRecord,
  index: number,
  fieldIndex: number,
  _uploadedImages: Map<string, string>
): FieldBounds | null {
  const path = formatTemplate(field.path, record, index)
  if (path === null || path === '') return null
  
  // 使用配置的最大尺寸或默认值
  const width = field.maxWidth || 100
  const height = field.maxHeight || 100
  
  return {
    index: fieldIndex,
    x: field.position.x,
    y: field.position.y,
    width,
    height
  }
}

/**
 * 计算所有字段的边界框
 */
export function calculateAllFieldBounds(
  canvas: HTMLCanvasElement,
  config: { canvas: CanvasConfig; fields: Field[] },
  record: ExcelRecord,
  index: number,
  uploadedImages: Map<string, string> = new Map()
): FieldBounds[] {
  const ctx = canvas.getContext('2d')
  if (!ctx) return []
  
  const bounds: FieldBounds[] = []
  
  for (let i = 0; i < config.fields.length; i++) {
    const field = config.fields[i]
    if (!field) continue
    
    let fieldBounds: FieldBounds | null = null
    
    if (field.type === 'text') {
      fieldBounds = calculateTextFieldBounds(ctx, field, record, index, i)
    } else if (field.type === 'image') {
      fieldBounds = calculateImageFieldBounds(field, record, index, i, uploadedImages)
    }
    
    if (fieldBounds) {
      bounds.push(fieldBounds)
    }
  }
  
  return bounds
}

/**
 * 根据点击位置查找字段
 * 返回最上层（最后绘制）的字段索引
 */
export function findFieldAtPosition(
  bounds: FieldBounds[],
  x: number,
  y: number
): number | undefined {
  // 从后往前查找（后绘制的在上层）
  for (let i = bounds.length - 1; i >= 0; i--) {
    const b = bounds[i]
    if (!b) continue
    
    if (x >= b.x && x <= b.x + b.width &&
        y >= b.y && y <= b.y + b.height) {
      return b.index
    }
  }
  
  return undefined
}

