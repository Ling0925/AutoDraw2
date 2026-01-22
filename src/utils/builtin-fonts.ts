/**
 * 内置字体配置
 */

export interface BuiltinFontFile {
  weight: number;
  style: 'normal' | 'italic';
  file: string;
}

export interface BuiltinFont {
  name: string;
  displayName: string;
  files: BuiltinFontFile[];
}

/**
 * 从文件名中提取字体信息
 * 支持的命名格式：
 * - FontName-Regular.ttf
 * - FontName-Bold.ttf
 * - FontName-Italic.ttf
 * - FontName-BoldItalic.ttf
 * - FontName-400.ttf (数字表示 weight)
 * - FontName.ttf (默认为 Regular)
 */
function parseFontFileName(path: string): { baseName: string; weight: number; style: 'normal' | 'italic' } {
  const fileName = path.split('/').pop()!.replace(/\.(ttf|woff2?|otf)$/i, '');
  
  // 检测斜体
  const isItalic = /italic/i.test(fileName);
  const style: 'normal' | 'italic' = isItalic ? 'italic' : 'normal';
  
  // 移除斜体标记
  let cleanName = fileName.replace(/-?italic/i, '');
  
  // 检测粗细
  let weight = 400;
  const weightMatch = cleanName.match(/-(thin|extralight|light|regular|medium|semibold|bold|extrabold|black|[1-9]00)$/i);
  
  if (weightMatch && weightMatch[1]) {
    const weightStr = weightMatch[1].toLowerCase();
    const weightMap: Record<string, number> = {
      'thin': 100,
      'extralight': 200,
      'light': 300,
      'regular': 400,
      'medium': 500,
      'semibold': 600,
      'bold': 700,
      'extrabold': 800,
      'black': 900,
    };
    
    weight = weightMap[weightStr] || parseInt(weightStr) || 400;
    cleanName = cleanName.replace(weightMatch[0], '');
  }
  
  // 移除可能的分隔符
  const baseName = cleanName.replace(/[-_]$/, '');
  
  return { baseName, weight, style };
}

/**
 * 自动扫描 public/fonts 目录下的字体文件
 */
function scanFontFiles(): BuiltinFont[] {
  // 使用 Vite 的 import.meta.glob 扫描字体文件
  const fontFiles = import.meta.glob('/public/fonts/**/*.{ttf,woff,woff2,otf}', { 
    eager: true,
    as: 'url' 
  });
  
  // 按字体名称分组
  const fontGroups = new Map<string, BuiltinFontFile[]>();
  
  for (const path in fontFiles) {
    const { baseName, weight, style } = parseFontFileName(path);
    
    // 转换为相对于 public 的路径
    const publicPath = path.replace('/public', '');
    
    if (!fontGroups.has(baseName)) {
      fontGroups.set(baseName, []);
    }
    
    fontGroups.get(baseName)!.push({
      weight,
      style,
      file: publicPath
    });
  }
  
  // 转换为 BuiltinFont 数组
  const fonts: BuiltinFont[] = [];
  for (const [baseName, files] of fontGroups) {
    fonts.push({
      name: baseName,
      displayName: baseName,
      files: files.sort((a, b) => {
        // 先按 weight 排序，再按 style 排序
        if (a.weight !== b.weight) return a.weight - b.weight;
        return a.style === 'normal' ? -1 : 1;
      })
    });
  }
  
  return fonts;
}

/**
 * 手动配置的字体（可选）
 * 如果你需要自定义显示名称或特殊配置，可以在这里手动添加
 */
const MANUAL_FONTS: BuiltinFont[] = [
  // 示例：
  // {
  //   name: 'Source Han Sans CN',
  //   displayName: '思源黑体',
  //   files: [
  //     { weight: 400, style: 'normal', file: '/fonts/SourceHanSansCN-Regular.ttf' },
  //     { weight: 700, style: 'normal', file: '/fonts/SourceHanSansCN-Bold.ttf' },
  //   ]
  // }
];

/**
 * 内置字体列表（自动扫描 + 手动配置）
 */
export const BUILTIN_FONTS: BuiltinFont[] = [
  ...scanFontFiles(),
  ...MANUAL_FONTS
]

/**
 * 生成 @font-face CSS 规则
 */
export function generateFontFaceCSS(): string {
  let css = ''
  
  for (const font of BUILTIN_FONTS) {
    for (const file of font.files) {
      // 根据文件扩展名自动判断格式
      const ext = file.file.split('.').pop()?.toLowerCase();
      let format = 'truetype';
      if (ext === 'woff2') format = 'woff2';
      else if (ext === 'woff') format = 'woff';
      else if (ext === 'otf') format = 'opentype';
      
      css += `
@font-face {
  font-family: '${font.name}';
  font-weight: ${file.weight};
  font-style: ${file.style};
  src: url('${file.file}') format('${format}');
  font-display: swap;
}
`
    }
  }
  
  return css
}

/**
 * 动态加载内置字体
 */
export function loadBuiltinFonts(): void {
  const styleId = 'builtin-fonts-style'
  
  // 如果已经加载，不重复加载
  if (document.getElementById(styleId)) {
    return
  }
  
  const style = document.createElement('style')
  style.id = styleId
  style.textContent = generateFontFaceCSS()
  document.head.appendChild(style)
}

/**
 * 获取内置字体名称列表
 */
export function getBuiltinFontNames(): string[] {
  return BUILTIN_FONTS.map(font => font.name)
}

/**
 * 获取内置字体显示名称映射
 */
export function getBuiltinFontDisplayNames(): Record<string, string> {
  const map: Record<string, string> = {}
  for (const font of BUILTIN_FONTS) {
    map[font.name] = font.displayName
  }
  return map
}
