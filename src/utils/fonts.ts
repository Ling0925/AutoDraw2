/**
 * 字体工具函数
 * 使用 Local Font Access API 获取用户系统中所有可用字体
 */

// 默认字体列表（当 API 不可用时使用）
export const DEFAULT_FONTS = [
  'Microsoft YaHei',
  'SimHei',
  'SimSun',
  'KaiTi',
  'FangSong',
  'Arial',
  'Times New Roman',
  'Georgia',
  'Verdana',
  'Tahoma',
  'Helvetica',
  'Courier New'
]

// 字体信息接口
export interface FontInfo {
  family: string
  fullName: string
  postscriptName: string
  style: string
}

// 扩展 Window 接口以支持 queryLocalFonts
declare global {
  interface Window {
    queryLocalFonts?: () => Promise<FontData[]>
  }
  
  interface FontData {
    family: string
    fullName: string
    postscriptName: string
    style: string
  }
}

/**
 * 检查浏览器是否支持 Local Font Access API
 */
export function isLocalFontAccessSupported(): boolean {
  return 'queryLocalFonts' in window
}

/**
 * 获取系统中所有可用的字体
 * 如果浏览器支持 Local Font Access API，则返回系统字体
 * 否则返回默认字体列表
 */
export async function getAvailableFonts(): Promise<string[]> {
  if (!isLocalFontAccessSupported()) {
    console.log('Local Font Access API not supported, using default fonts')
    return DEFAULT_FONTS
  }
  
  try {
    // 请求字体访问权限
    const fonts = await window.queryLocalFonts!()
    
    // 提取唯一的字体家族名称
    const fontFamilies = new Set<string>()
    for (const font of fonts) {
      fontFamilies.add(font.family)
    }
    
    // 转换为数组并排序
    const sortedFonts = Array.from(fontFamilies).sort((a, b) => {
      // 中文字体优先
      const aIsChinese = /[\u4e00-\u9fa5]/.test(a) || a.startsWith('Microsoft') || a.startsWith('Sim') || a.startsWith('Fang') || a.startsWith('Kai')
      const bIsChinese = /[\u4e00-\u9fa5]/.test(b) || b.startsWith('Microsoft') || b.startsWith('Sim') || b.startsWith('Fang') || b.startsWith('Kai')
      
      if (aIsChinese && !bIsChinese) return -1
      if (!aIsChinese && bIsChinese) return 1
      
      return a.localeCompare(b, 'zh-CN')
    })
    
    console.log(`Found ${sortedFonts.length} fonts on system`)
    return sortedFonts
  } catch (error) {
    // 用户可能拒绝了权限请求
    console.warn('Failed to access local fonts:', error)
    return DEFAULT_FONTS
  }
}

/**
 * 获取字体的详细信息（包括所有样式变体）
 */
export async function getFontDetails(): Promise<FontInfo[]> {
  if (!isLocalFontAccessSupported()) {
    return DEFAULT_FONTS.map(family => ({
      family,
      fullName: family,
      postscriptName: family.replace(/\s/g, '-'),
      style: 'Regular'
    }))
  }
  
  try {
    const fonts = await window.queryLocalFonts!()
    return fonts.map(font => ({
      family: font.family,
      fullName: font.fullName,
      postscriptName: font.postscriptName,
      style: font.style
    }))
  } catch (error) {
    console.warn('Failed to get font details:', error)
    return DEFAULT_FONTS.map(family => ({
      family,
      fullName: family,
      postscriptName: family.replace(/\s/g, '-'),
      style: 'Regular'
    }))
  }
}
