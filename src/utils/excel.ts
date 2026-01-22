import * as XLSX from 'xlsx'
import type { ExcelRecord } from '@/types'

/**
 * 解析 Excel 文件并返回记录数组
 */
export async function parseExcel(file: File): Promise<ExcelRecord[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        
        // 获取第一个工作表
        const sheetName = workbook.SheetNames[0]
        if (!sheetName) {
          resolve([])
          return
        }
        const worksheet = workbook.Sheets[sheetName]
        if (!worksheet) {
          resolve([])
          return
        }
        
        // 转换为 JSON
        const records = XLSX.utils.sheet_to_json<ExcelRecord>(worksheet, {
          defval: '' // 空单元格默认为空字符串
        })
        
        resolve(records)
      } catch (error) {
        reject(error)
      }
    }
    
    reader.onerror = () => reject(reader.error)
    reader.readAsArrayBuffer(file)
  })
}

/**
 * 获取 Excel 记录中的所有字段名
 */
export function getFieldNames(records: ExcelRecord[]): string[] {
  if (records.length === 0) return []
  const first = records[0]
  if (!first) return []
  return Object.keys(first)
}
