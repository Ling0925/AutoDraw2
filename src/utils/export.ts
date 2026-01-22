import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import type { CardConfig, ExcelRecord } from '@/types'
import { renderCard, canvasToBlob, formatTemplate } from './canvas'

/**
 * 批量生成名片并导出为 ZIP
 */
export async function exportCards(
  config: CardConfig,
  records: ExcelRecord[],
  uploadedImages: Map<string, string>,
  onProgress?: (current: number, total: number) => void
): Promise<void> {
  const zip = new JSZip()
  const canvas = document.createElement('canvas')
  
  for (let i = 0; i < records.length; i++) {
    const record = records[i]
    if (!record) continue
    const index = i + 1
    
    // 渲染名片
    await renderCard(canvas, config, record, index, uploadedImages)
    
    // 生成文件名（如果返回 null，使用默认文件名）
    const filename = formatTemplate(config.output.filename, record, index) ?? `card_${index}`
    const extension = config.output.format.toLowerCase()
    
    // 导出为 Blob
    const blob = await canvasToBlob(canvas, config.output.format)
    zip.file(`${filename}.${extension}`, blob)
    
    // 报告进度
    onProgress?.(i + 1, records.length)
  }
  
  // 生成 ZIP 文件
  const zipBlob = await zip.generateAsync({ type: 'blob' })
  saveAs(zipBlob, 'cards.zip')
}

/**
 * 导出配置为 JSON 文件
 */
export function exportConfig(config: CardConfig, filename: string = 'config.json'): void {
  // 转换为后端兼容格式
  const exportData = {
    canvas: {
      width: config.canvas.width,
      height: config.canvas.height,
      background_color: config.canvas.backgroundColor,
      background: config.canvas.backgroundImage || null
    },
    output: {
      directory: config.output.directory,
      format: config.output.format,
      filename: config.output.filename
    },
    fields: config.fields.map(field => {
      if (field.type === 'text') {
        return {
          type: 'text',
          text: field.text,
          position: { x: field.position.x, y: field.position.y },
          font_family: field.fontFamily,
          font_style: field.fontStyle,
          font_size: field.fontSize,
          font_weight: field.fontWeight,
          color: field.color,
          anchor: field.anchor,
          wrap_width: field.wrapWidth || null,
          line_spacing: field.lineSpacing || null,
          letter_spacing: field.letterSpacing || null
        }
      } else {
        return {
          type: 'image',
          path: field.path,
          position: { x: field.position.x, y: field.position.y },
          max_width: field.maxWidth || null,
          max_height: field.maxHeight || null
        }
      }
    })
  }
  
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
  saveAs(blob, filename)
}

/**
 * 从 JSON 导入配置
 */
export async function importConfig(file: File): Promise<CardConfig> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)
        
        // 转换从后端格式到前端格式
        const config: CardConfig = {
          canvas: {
            width: data.canvas?.width || 1050,
            height: data.canvas?.height || 600,
            backgroundColor: data.canvas?.background_color || '#F7F8FA',
            backgroundImage: data.canvas?.background || undefined
          },
          output: {
            directory: data.output?.directory || 'output',
            format: data.output?.format || 'PNG',
            filename: data.output?.filename || '{姓名}_{index:03d}'
          },
          fields: (data.fields || []).map((f: Record<string, unknown>) => {
            if (f.type === 'text') {
              return {
                type: 'text',
                text: f.text || '',
                position: { x: (f.position as Record<string, number>)?.x || 0, y: (f.position as Record<string, number>)?.y || 0 },
                fontFamily: f.font_family || 'Microsoft YaHei',
                fontStyle: f.font_style || 'Regular',
                fontSize: f.font_size || 32,
                fontWeight: f.font_weight || 400,
                color: f.color || '#000000',
                anchor: f.anchor || 'la',
                wrapWidth: f.wrap_width || undefined,
                lineSpacing: f.line_spacing || undefined,
                letterSpacing: f.letter_spacing || undefined
              }
            } else {
              return {
                type: 'image',
                path: f.path || '',
                position: { x: (f.position as Record<string, number>)?.x || 0, y: (f.position as Record<string, number>)?.y || 0 },
                maxWidth: f.max_width || undefined,
                maxHeight: f.max_height || undefined
              }
            }
          })
        }
        
        resolve(config)
      } catch (error) {
        reject(error)
      }
    }
    
    reader.onerror = () => reject(reader.error)
    reader.readAsText(file)
  })
}
