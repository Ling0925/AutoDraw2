import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Anchor } from '@/types'

export function useAnchorOptions() {
  const { t } = useI18n()

  const ANCHOR_OPTIONS = computed<{ value: Anchor; label: string }[]>(() => [
    { value: 'lt', label: t('anchor.topLeft') },
    { value: 'mt', label: t('anchor.topCenter') },
    { value: 'rt', label: t('anchor.topRight') },
    { value: 'la', label: t('anchor.middleLeft') },
    { value: 'mm', label: t('anchor.middleCenter') },
    { value: 'ra', label: t('anchor.middleRight') },
    { value: 'lb', label: t('anchor.bottomLeft') },
    { value: 'mb', label: t('anchor.bottomCenter') },
    { value: 'rb', label: t('anchor.bottomRight') },
  ])

  return { ANCHOR_OPTIONS }
}
