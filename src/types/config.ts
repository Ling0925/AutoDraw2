// 字段位置
export interface Position {
  x: number
  y: number
}

// 文字字段配置
export interface TextField {
  type: 'text'
  text: string
  position: Position
  fontFamily: string
  fontStyle: string
  fontSize: number
  fontWeight: number
  color: string
  anchor: Anchor
  wrapWidth?: number
  lineSpacing?: number
  letterSpacing?: number
}

// 图片字段配置
export interface ImageField {
  type: 'image'
  path: string
  position: Position
  maxWidth?: number
  maxHeight?: number
}

// 字段类型
export type Field = TextField | ImageField

// 锚点类型
export type Anchor = 'la' | 'lt' | 'lb' | 'ma' | 'mt' | 'mb' | 'mm' | 'ra' | 'rt' | 'rb'

// 锚点选项
export const ANCHOR_OPTIONS: { value: Anchor; label: string }[] = [
  { value: 'la', label: '左-基线' },
  { value: 'lt', label: '左-顶部' },
  { value: 'lb', label: '左-底部' },
  { value: 'ma', label: '中-基线' },
  { value: 'mt', label: '中-顶部' },
  { value: 'mb', label: '中-底部' },
  { value: 'mm', label: '中-中间' },
  { value: 'ra', label: '右-基线' },
  { value: 'rt', label: '右-顶部' },
  { value: 'rb', label: '右-底部' }
]

// 画布配置
export interface CanvasConfig {
  width: number
  height: number
  backgroundColor: string
  backgroundImage?: string
}

// 输出配置
export interface OutputConfig {
  directory: string
  format: 'PNG' | 'JPEG'
  filename: string
}

// 完整配置
export interface CardConfig {
  canvas: CanvasConfig
  output: OutputConfig
  fields: Field[]
}

// Excel 记录
export type ExcelRecord = Record<string, string | number>

// 默认配置
export function getDefaultConfig(): CardConfig {
  return {
    canvas: {
      width: 1050,
      height: 600,
      backgroundColor: '#F7F8FA'
    },
    output: {
      directory: 'output',
      format: 'PNG',
      filename: '{姓名}_{公司}_{index:03d}'
    },
    fields: []
  }
}

// 默认文字字段
export function createDefaultTextField(): TextField {
  return {
    type: 'text',
    text: '{姓名}',
    position: { x: 100, y: 100 },
    fontFamily: 'Microsoft YaHei',
    fontStyle: 'Regular',
    fontSize: 32,
    fontWeight: 400,
    color: '#000000',
    anchor: 'la'
  }
}

// 默认图片字段
export function createDefaultImageField(): ImageField {
  return {
    type: 'image',
    path: '',
    position: { x: 100, y: 100 },
    maxWidth: 200,
    maxHeight: 200
  }
}
