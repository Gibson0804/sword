/**
 * 事件发射器类
 * 用于实现组件间的事件通信
 */
export default class EventEmitter {
  constructor() {
    this.events = {};
  }

  /**
   * 注册事件监听器
   * @param {string} event - 事件名称
   * @param {Function} callback - 回调函数
   */
  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }

  /**
   * 注册一次性事件监听器
   * @param {string} event - 事件名称
   * @param {Function} callback - 回调函数
   */
  once(event, callback) {
    const onceWrapper = (...args) => {
      callback.apply(this, args);
      this.off(event, onceWrapper);
    };
    this.on(event, onceWrapper);
  }

  /**
   * 移除事件监听器
   * @param {string} event - 事件名称
   * @param {Function} callback - 回调函数
   */
  off(event, callback) {
    if (this.events[event]) {
      this.events[event] = this.events[event].filter(cb => cb !== callback);
    }
  }

  /**
   * 触发事件
   * @param {string} event - 事件名称
   * @param {...any} args - 传递给回调函数的参数
   */
  emit(event, ...args) {
    if (this.events[event]) {
      this.events[event].forEach(callback => {
        callback.apply(this, args);
      });
    }
  }

  /**
   * 清除所有事件监听器
   */
  clear() {
    this.events = {};
  }
}
