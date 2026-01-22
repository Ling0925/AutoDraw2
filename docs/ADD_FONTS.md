# 如何添加内置字体

本指南将帮助你在 AutoDraw 中添加内置字体。系统支持**自动扫描**和**手动配置**两种方式。

## 🚀 自动扫描模式（推荐）

### 步骤 1: 准备字体文件

将字体文件（支持 `.ttf`、`.woff`、`.woff2`、`.otf` 格式）放入 `public/fonts/` 目录。

**重要**：按照规范命名字体文件！

### 步骤 2: 字体文件命名规范

系统会自动扫描 `public/fonts/` 目录并解析文件名。

**基本格式**：`字体名称-粗细-样式.扩展名`

**支持的粗细标识**：
- `Thin` 或 `100` → 100
- `ExtraLight` 或 `200` → 200
- `Light` 或 `300` → 300
- `Regular` 或 `400` → 400（默认）
- `Medium` 或 `500` → 500
- `SemiBold` 或 `600` → 600
- `Bold` 或 `700` → 700
- `ExtraBold` 或 `800` → 800
- `Black` 或 `900` → 900

**支持的样式标识**：
- 包含 `Italic` → 斜体
- 不包含 → 正常（默认）

**命名示例**：
```
SourceHanSansCN-Regular.ttf          → 思源黑体, weight: 400, style: normal
SourceHanSansCN-Bold.ttf             → 思源黑体, weight: 700, style: normal
SourceHanSansCN-BoldItalic.ttf       → 思源黑体, weight: 700, style: italic
MyFont-300.woff2                     → MyFont, weight: 300, style: normal
MyFont.ttf                           → MyFont, weight: 400, style: normal
```

### 步骤 3: 完成

将字体文件放入 `public/fonts/` 后，刷新页面即可。系统会自动：
- ✅ 扫描所有字体文件
- ✅ 按字体名称分组
- ✅ 生成 `@font-face` CSS 规则
- ✅ 添加到字体选择列表的最前面

## 🔧 手动配置模式（可选）

如果你需要**自定义显示名称**或特殊配置，可以手动添加字体配置。

编辑 `src/utils/builtin-fonts.ts` 文件，在 `MANUAL_FONTS` 数组中添加：

```typescript
const MANUAL_FONTS: BuiltinFont[] = [
  {
    name: 'Source Han Sans CN',           // font-family 名称
    displayName: '思源黑体',              // 自定义显示名称
    files: [
      { weight: 400, style: 'normal', file: '/fonts/SourceHanSansCN-Regular.ttf' },
      { weight: 700, style: 'normal', file: '/fonts/SourceHanSansCN-Bold.ttf' },
    ]
  },
  // 添加更多字体...
]

## 📦 推荐字体资源

### 免费商用字体

1. **思源黑体（Source Han Sans）**
   - 下载：https://github.com/adobe-fonts/source-han-sans
   - 优秀的中文字体，支持多种粗细
   - 建议命名：`SourceHanSansCN-Light.otf`, `SourceHanSansCN-Regular.otf`, `SourceHanSansCN-Bold.otf`

2. **思源宋体（Source Han Serif）**
   - 下载：https://github.com/adobe-fonts/source-han-serif
   - 优雅的中文衬线字体
   - 建议命名：`SourceHanSerifCN-Regular.otf`, `SourceHanSerifCN-Bold.otf`

3. **霞鹜文楷（LXGW WenKai）**
   - 下载：https://github.com/lxgw/LxgwWenKai
   - 手写风格的中文字体
   - 建议命名：`LXGWWenKai-Regular.ttf`, `LXGWWenKai-Bold.ttf`

4. **阿里巴巴普惠体（Alibaba PuHuiTi）**
   - 下载：https://www.alibabafonts.com/#/font
   - 现代简洁的中文字体
   - 建议命名：`AlibabaPuHuiTi-Regular.ttf`, `AlibabaPuHuiTi-Bold.ttf`

5. **站酷系列字体**
   - 下载：https://www.zcool.com.cn/special/zcoolfonts/
   - 多种风格的免费字体

## ⚙️ 工作原理

系统使用 Vite 的 `import.meta.glob` 功能在**构建时**扫描 `public/fonts/` 目录：

1. 查找所有 `.ttf`、`.woff`、`.woff2`、`.otf` 文件
2. 从文件名中提取字体基础名称、粗细、样式
3. 按字体名称分组，生成完整的字体配置
4. 自动生成 `@font-face` CSS 规则

**优势**：
- ✅ 无需手动配置
- ✅ 添加字体只需复制文件
- ✅ 自动识别字体变体（粗细、斜体）
- ✅ 构建时处理，运行时无性能开销

## ⚠️ 注意事项

1. **文件大小**：字体文件会增加应用体积
   - 推荐使用 `.woff2` 格式（压缩率更高）
   - 只包含必需的字体粗细变体
   - 中文字体通常较大（5-20MB），考虑使用字体子集化工具

2. **授权许可**：确保你有使用字体的合法授权
   - 商用项目请仔细阅读字体的许可协议
   - 推荐使用 OFL（Open Font License）或 Apache License 字体

3. **命名规范**：严格遵循文件命名规范
   - 错误的命名可能导致字体无法正确识别
   - 建议使用英文字体名称（避免中文路径问题）

4. **浏览器兼容性**：
   - `.woff2` - 现代浏览器（推荐）
   - `.woff` - 较旧浏览器
   - `.ttf` - 通用格式
