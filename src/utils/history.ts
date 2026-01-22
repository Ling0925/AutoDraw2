/**
 * 历史记录管理器
 * 用于实现撤销/重做功能
 */

export class HistoryManager<T> {
  private history: T[] = []
  private currentIndex: number = -1
  private maxHistorySize: number = 50

  constructor(maxHistorySize: number = 50) {
    this.maxHistorySize = maxHistorySize
  }

  /**
   * 添加新的历史记录
   */
  push(state: T): void {
    // 删除当前位置之后的所有历史
    this.history = this.history.slice(0, this.currentIndex + 1)
    
    // 添加新状态
    this.history.push(state)
    
    // 限制历史记录大小
    if (this.history.length > this.maxHistorySize) {
      this.history.shift()
    } else {
      this.currentIndex++
    }
  }

  /**
   * 撤销到上一步
   */
  undo(): T | null {
    if (!this.canUndo()) return null
    this.currentIndex--
    return this.history[this.currentIndex] ?? null
  }

  /**
   * 重做到下一步
   */
  redo(): T | null {
    if (!this.canRedo()) return null
    this.currentIndex++
    return this.history[this.currentIndex] ?? null
  }

  /**
   * 是否可以撤销
   */
  canUndo(): boolean {
    return this.currentIndex > 0
  }

  /**
   * 是否可以重做
   */
  canRedo(): boolean {
    return this.currentIndex < this.history.length - 1
  }

  /**
   * 获取当前状态
   */
  current(): T | null {
    if (this.currentIndex < 0) return null
    return this.history[this.currentIndex] ?? null
  }

  /**
   * 清空历史
   */
  clear(): void {
    this.history = []
    this.currentIndex = -1
  }

  /**
   * 获取历史记录数量
   */
  size(): number {
    return this.history.length
  }

  /**
   * 获取当前索引
   */
  getCurrentIndex(): number {
    return this.currentIndex
  }
}

/**
 * 深度克隆对象（用于保存历史状态）
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}
