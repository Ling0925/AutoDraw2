export * from './excel'
export * from './canvas'
export * from './export'
export * from './fonts'
export * from './storage'
export * from './history'

import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
