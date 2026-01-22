import { createI18n } from 'vue-i18n'
import zhCN from './zh-CN'
import en from './en'
import ko from './ko'

// 获取浏览器语言或本地存储的语言
function getDefaultLocale(): string {
  const saved = localStorage.getItem('app-locale')
  if (saved && ['zh-CN', 'en', 'ko'].includes(saved)) {
    return saved
  }
  
  const browserLang = navigator.language.toLowerCase()
  if (browserLang.startsWith('zh')) return 'zh-CN'
  if (browserLang.startsWith('ko')) return 'ko'
  return 'en'
}

export const i18n = createI18n({
  legacy: false,
  locale: getDefaultLocale(),
  fallbackLocale: 'en',
  messages: {
    'zh-CN': zhCN,
    en,
    ko,
  },
})

export const availableLocales = [
  { code: 'zh-CN', name: '简体中文' },
  { code: 'en', name: 'English' },
  { code: 'ko', name: '한국어' },
]

export function setLocale(locale: string) {
  i18n.global.locale.value = locale as any
  localStorage.setItem('app-locale', locale)
}
