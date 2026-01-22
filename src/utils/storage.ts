/**
 * 浏览器本地存储工具
 * 用于保存和恢复应用配置和数据
 */

import type { CardConfig, ExcelRecord } from '@/types'

const STORAGE_KEYS = {
  CONFIG: 'autodraw_config',
  RECORDS: 'autodraw_records',
  CURRENT_INDEX: 'autodraw_current_index',
  UPLOADED_IMAGES: 'autodraw_uploaded_images'
}

/**
 * 保存配置到本地存储
 */
export function saveConfig(config: CardConfig): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config))
  } catch (error) {
    console.error('Failed to save config to localStorage:', error)
  }
}

/**
 * 从本地存储加载配置
 */
export function loadConfig(): CardConfig | null {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.CONFIG)
    if (!data) return null
    return JSON.parse(data) as CardConfig
  } catch (error) {
    console.error('Failed to load config from localStorage:', error)
    return null
  }
}

/**
 * 保存 Excel 记录到本地存储
 */
export function saveRecords(records: ExcelRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(records))
  } catch (error) {
    console.error('Failed to save records to localStorage:', error)
  }
}

/**
 * 从本地存储加载 Excel 记录
 */
export function loadRecords(): ExcelRecord[] | null {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.RECORDS)
    if (!data) return null
    return JSON.parse(data) as ExcelRecord[]
  } catch (error) {
    console.error('Failed to load records from localStorage:', error)
    return null
  }
}

/**
 * 保存当前记录索引
 */
export function saveCurrentIndex(index: number): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CURRENT_INDEX, String(index))
  } catch (error) {
    console.error('Failed to save current index to localStorage:', error)
  }
}

/**
 * 加载当前记录索引
 */
export function loadCurrentIndex(): number | null {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.CURRENT_INDEX)
    if (!data) return null
    return parseInt(data, 10)
  } catch (error) {
    console.error('Failed to load current index from localStorage:', error)
    return null
  }
}

/**
 * 保存上传的图片（转为 base64）
 */
export function saveUploadedImages(images: Map<string, string>): void {
  try {
    const obj: Record<string, string> = {}
    images.forEach((value, key) => {
      obj[key] = value
    })
    localStorage.setItem(STORAGE_KEYS.UPLOADED_IMAGES, JSON.stringify(obj))
  } catch (error) {
    console.error('Failed to save uploaded images to localStorage:', error)
  }
}

/**
 * 加载上传的图片
 */
export function loadUploadedImages(): Map<string, string> | null {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.UPLOADED_IMAGES)
    if (!data) return null
    const obj = JSON.parse(data) as Record<string, string>
    const map = new Map<string, string>()
    Object.entries(obj).forEach(([key, value]) => {
      map.set(key, value)
    })
    return map
  } catch (error) {
    console.error('Failed to load uploaded images from localStorage:', error)
    return null
  }
}

/**
 * 清除所有保存的数据
 */
export function clearAllStorage(): void {
  try {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key)
    })
  } catch (error) {
    console.error('Failed to clear localStorage:', error)
  }
}

/**
 * 自动保存功能（防抖）
 */
let saveTimeout: number | null = null

export function autoSave(callback: () => void, delay: number = 1000): void {
  if (saveTimeout !== null) {
    clearTimeout(saveTimeout)
  }
  saveTimeout = window.setTimeout(() => {
    callback()
    saveTimeout = null
  }, delay)
}
