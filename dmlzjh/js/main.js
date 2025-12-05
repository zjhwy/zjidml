/**
 * 主应用逻辑
 * 处理页面交互和初始化
 */

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

/**
 * 初始化应用
 */
async function initApp() {
    // 初始化侧边栏
    initSidebar();
    
    // 初始化同步功能
    initSync();
    
    // 加载首页数据
    loadHomeData();
    
    // 添加全局事件监听
    addGlobalListeners();
}

/**
 * 初始化侧边栏
 */
function initSidebar() {
    const menuToggle = document.getElementById('menuToggle');
    const closeSidebar = document.getElementById('closeSidebar');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    
    // 打开侧边栏
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.add('open');
            overlay.classList.add('show');
        });
    }
    
    // 关闭侧边栏
    if (closeSidebar) {
        closeSidebar.addEventListener('click', closeSidebarHandler);
    }
    
    if (overlay) {
        overlay.addEventListener('click', closeSidebarHandler);
    }
    
    function closeSidebarHandler() {
        sidebar.classList.remove('open');
        overlay.classList.remove('show');
    }
    
    // 电脑端：点击导航项自动关闭侧边栏（手机端）
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            if (Utils.getDeviceType() === 'mobile') {
                closeSidebarHandler();
            }
        });
    });
}

/**
 * 初始化同步功能
 */
function initSync() {
    const syncBtn = document.getElementById('syncBtn');
    
    if (syncBtn) {
        syncBtn.addEventListener('click', async () => {
            await syncData();
        });
    }
}

/**
 * 同步数据
 */
async function syncData() {
    const syncBtn = document.getElementById('syncBtn');
    if (!syncBtn) return;
    
    // 显示同步动画
    syncBtn.classList.add('sync-animation');
    syncBtn.disabled = true;
    Utils.showLoading(true);
    
    try {
        // 检查网络连接
        if (!Utils.isOnline()) {
            Utils.showToast('网络未连接，无法同步', 'error');
            return;
        }
        
        // 模拟同步过程（实际应调用服务器API）
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // 同步完成动画
        showSyncCompleteAnimation();
        
        Utils.showToast('同步成功！', 'success');
    } catch (error) {
        console.error('同步失败:', error);
        Utils.showToast('同步失败，请重试', 'error');
    } finally {
        syncBtn.classList.remove('sync-animation');
        syncBtn.disabled = false;
        Utils.showLoading(false);
    }
}

/**
 * 显示同步完成动画
 */
function showSyncCompleteAnimation() {
    const syncBtn = document.getElementById('syncBtn');
    if (!syncBtn) return;
    
    // 创建漂浮爱心
    const heart = document.createElement('div');
    heart.className = 'float-heart';
    heart.textContent = '💕';
    heart.style.left = syncBtn.offsetLeft + syncBtn.offsetWidth / 2 + 'px';
    heart.style.top = syncBtn.offsetTop + 'px';
    
    document.body.appendChild(heart);
    
    setTimeout(() => {
        document.body.removeChild(heart);
    }, 500);
}

/**
 * 加载首页数据
 */
async function loadHomeData() {
    try {
        // 加载本月支出
        const accounts = await Storage.getAll('accounts');
        const currentMonth = Utils.formatDate(new Date(), 'YYYY-MM');
        const monthAccounts = accounts.filter(acc => {
            return acc.date && acc.date.startsWith(currentMonth) && acc.type === 'expense';
        });
        const monthExpense = monthAccounts.reduce((sum, acc) => sum + (acc.amount || 0), 0);
        
        const monthExpenseEl = document.getElementById('monthExpense');
        if (monthExpenseEl) {
            monthExpenseEl.textContent = Utils.formatAmount(monthExpense);
        }
        
        // 加载日志数量
        const diaries = await Storage.getAll('diaries');
        const diaryCountEl = document.getElementById('diaryCount');
        if (diaryCountEl) {
            diaryCountEl.textContent = diaries.length;
        }
        
        // 加载照片数量
        const photos = await Storage.getAll('photos');
        const photoCountEl = document.getElementById('photoCount');
        if (photoCountEl) {
            photoCountEl.textContent = photos.length;
        }
    } catch (error) {
        console.error('加载首页数据失败:', error);
    }
}

/**
 * 添加全局事件监听
 */
function addGlobalListeners() {
    // 网络状态监听
    window.addEventListener('online', () => {
        Utils.showToast('网络已连接', 'success');
    });
    
    window.addEventListener('offline', () => {
        Utils.showToast('网络已断开', 'error');
    });
    
    // 快捷键支持（电脑端）
    if (Utils.getDeviceType() === 'desktop') {
        document.addEventListener('keydown', (e) => {
            // Ctrl+J 打开记账
            if (e.ctrlKey && e.key === 'j') {
                e.preventDefault();
                window.location.href = 'pages/accounting.html';
            }
            
            // Ctrl+X 打开相册（如果有）
            if (e.ctrlKey && e.key === 'x') {
                e.preventDefault();
                // 可以跳转到相册页面
            }
        });
    }
    
    // 为所有按钮添加点击动画
    const buttons = document.querySelectorAll('button, .btn-primary, .btn-secondary, .action-card');
    buttons.forEach(btn => {
        Utils.addClickAnimation(btn);
    });
}

