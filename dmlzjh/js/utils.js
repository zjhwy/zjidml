/**
 * 工具函数库
 * 提供通用工具方法
 */

// 工具对象
const Utils = {
    /**
     * 格式化日期
     * @param {Date} date - 日期对象
     * @param {string} format - 格式字符串，默认 'YYYY-MM-DD'
     * @returns {string} 格式化后的日期字符串
     */
    formatDate(date, format = 'YYYY-MM-DD') {
        if (!date) date = new Date();
        if (typeof date === 'string') date = new Date(date);
        
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        
        return format
            .replace('YYYY', year)
            .replace('MM', month)
            .replace('DD', day)
            .replace('HH', hours)
            .replace('mm', minutes)
            .replace('ss', seconds);
    },
    
    /**
     * 格式化金额
     * @param {number} amount - 金额
     * @param {boolean} showSymbol - 是否显示货币符号
     * @returns {string} 格式化后的金额字符串
     */
    formatAmount(amount, showSymbol = true) {
        const symbol = showSymbol ? '¥' : '';
        return symbol + Number(amount).toFixed(2);
    },
    
    /**
     * 显示提示消息
     * @param {string} message - 提示消息
     * @param {string} type - 消息类型：'success', 'error', 'info'
     * @param {number} duration - 显示时长（毫秒）
     */
    showToast(message, type = 'info', duration = 2000) {
        // 创建提示元素
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        // 添加样式
        Object.assign(toast.style, {
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '12px 24px',
            borderRadius: '8px',
            backgroundColor: type === 'success' ? '#E6FFE6' : type === 'error' ? '#FFE6E6' : '#E6F3FF',
            color: '#1E3A8A',
            border: `2px solid ${type === 'success' ? '#87CEFA' : type === 'error' ? '#FF6B6B' : '#87CEFA'}`,
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
            zIndex: '10000',
            fontSize: '14px',
            fontWeight: '500',
            animation: 'slideUp 0.3s ease'
        });
        
        document.body.appendChild(toast);
        
        // 自动移除
        setTimeout(() => {
            toast.style.animation = 'fadeOut 0.2s ease';
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 200);
        }, duration);
    },
    
    /**
     * 显示加载动画
     * @param {boolean} show - 是否显示
     */
    showLoading(show = true) {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            if (show) {
                overlay.classList.add('show');
            } else {
                overlay.classList.remove('show');
            }
        }
    },
    
    /**
     * 防抖函数
     * @param {Function} func - 要执行的函数
     * @param {number} wait - 等待时间（毫秒）
     * @returns {Function} 防抖后的函数
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    /**
     * 节流函数
     * @param {Function} func - 要执行的函数
     * @param {number} limit - 时间限制（毫秒）
     * @returns {Function} 节流后的函数
     */
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },
    
    /**
     * 压缩图片
     * @param {File} file - 图片文件
     * @param {number} maxWidth - 最大宽度
     * @param {number} maxHeight - 最大高度
     * @param {number} quality - 压缩质量（0-1）
     * @returns {Promise<Blob>} 压缩后的图片Blob
     */
    compressImage(file, maxWidth = 800, maxHeight = 800, quality = 0.8) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    
                    // 计算缩放比例
                    if (width > height) {
                        if (width > maxWidth) {
                            height = (height * maxWidth) / width;
                            width = maxWidth;
                        }
                    } else {
                        if (height > maxHeight) {
                            width = (width * maxHeight) / height;
                            height = maxHeight;
                        }
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    canvas.toBlob((blob) => {
                        resolve(blob);
                    }, 'image/jpeg', quality);
                };
                img.onerror = reject;
                img.src = e.target.result;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    },
    
    /**
     * 检测设备类型
     * @returns {string} 'mobile' 或 'desktop'
     */
    getDeviceType() {
        return window.innerWidth < 768 ? 'mobile' : 'desktop';
    },
    
    /**
     * 检测是否为移动设备
     * @returns {boolean}
     */
    isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    },
    
    /**
     * 计算两个日期之间的天数差
     * @param {Date|string} date1 - 日期1
     * @param {Date|string} date2 - 日期2
     * @returns {number} 天数差
     */
    daysBetween(date1, date2) {
        const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
        const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
        const diffTime = Math.abs(d2 - d1);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    },
    
    /**
     * 生成唯一ID
     * @returns {string} 唯一ID
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },
    
    /**
     * 深拷贝对象
     * @param {*} obj - 要拷贝的对象
     * @returns {*} 拷贝后的对象
     */
    deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    },
    
    /**
     * 检查网络连接状态
     * @returns {boolean} 是否在线
     */
    isOnline() {
        return navigator.onLine;
    },
    
    /**
     * 添加点击动画效果
     * @param {HTMLElement} element - 要添加动画的元素
     */
    addClickAnimation(element) {
        if (!element) return;
        element.addEventListener('click', function() {
            this.classList.add('click-animation');
            setTimeout(() => {
                this.classList.remove('click-animation');
            }, 200);
        });
    }
};

// 导出工具对象
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Utils;
}

