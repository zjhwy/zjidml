/**
 * 家庭记账页面脚本
 * 负责处理收支记录、预算、图表等交互
 */

// 确保主脚本加载完成后再初始化当前页面逻辑
document.addEventListener('DOMContentLoaded', () => {
    if (document.body.contains(document.querySelector('.accounting-header'))) {
        AccountingPage.init();
    }
});

const AccountingPage = {
    chart: null,
    entries: [],
    currentFilter: 'all',
    currentType: 'expense',
    budget: {
        amount: 0,
        spent: 0,
        remaining: 0
    },

    /**
     * 初始化页面
     */
    async init() {
        await this.loadData();
        this.cacheDom();
        this.bindEvents();
        this.renderEntries();
        this.updateStats();
        this.initChart();
        this.updateBudgetUI();
    },

    /**
     * 加载数据
     */
    async loadData() {
        try {
            this.entries = await Storage.getAll('accounts') || [];
            const budgetAmount = await Storage.getSetting('monthlyBudget', 0);
            this.budget.amount = Number(budgetAmount) || 0;
        } catch (error) {
            console.error('加载记账数据失败:', error);
            this.entries = [];
        }
    },

    /**
     * 缓存DOM节点
     */
    cacheDom() {
        this.entriesList = document.getElementById('entriesList');
        this.filterButtons = document.querySelectorAll('.filter-btn');
        this.addEntryBtn = document.getElementById('addEntryBtn');
        this.entryModal = document.getElementById('entryModal');
        this.budgetModal = document.getElementById('budgetModal');
        this.entryForm = document.getElementById('entryForm');
        this.budgetForm = document.getElementById('budgetForm');
        this.typeButtons = document.querySelectorAll('.type-btn');
        this.quickButtons = document.querySelectorAll('.quick-btn');
        this.moreBtn = document.getElementById('moreBtn');
        this.moreMenu = document.getElementById('moreMenu');

        // 预算相关元素
        this.monthIncomeEl = document.getElementById('monthIncome');
        this.monthExpenseEl = document.getElementById('monthExpense');
        this.monthBalanceEl = document.getElementById('monthBalance');
        this.budgetAmountEl = document.getElementById('budgetAmount');
        this.budgetSpentEl = document.getElementById('budgetSpent');
        this.budgetRemainingEl = document.getElementById('budgetRemaining');
        this.budgetProgressBar = document.getElementById('budgetProgressBar');
        this.budgetCard = document.getElementById('budgetCard');
        this.setBudgetBtn = document.getElementById('setBudgetBtn');

        // 表单字段
        this.entryAmount = document.getElementById('entryAmount');
        this.entryCategory = document.getElementById('entryCategory');
        this.entryNote = document.getElementById('entryNote');
        this.entryDate = document.getElementById('entryDate');

        // 弹窗按钮
        this.closeModalBtn = document.getElementById('closeModal');
        this.cancelBtn = document.getElementById('cancelBtn');
        this.closeBudgetModalBtn = document.getElementById('closeBudgetModal');
        this.cancelBudgetBtn = document.getElementById('cancelBudgetBtn');
        this.setBudgetBtn = document.getElementById('setBudgetBtn');

        // 更多菜单按钮
        this.exportBtn = document.getElementById('exportBtn');
        this.backupBtn = document.getElementById('backupBtn');
        this.filterBtn = document.getElementById('filterBtn');
    },

    /**
     * 绑定事件
     */
    bindEvents() {
        // 筛选按钮
        this.filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.filterButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentFilter = btn.dataset.filter;
                this.renderEntries();
            });
        });

        // 快捷录入按钮
        this.quickButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.openEntryModal();
                this.entryCategory.value = btn.dataset.category;
            });
        });

        // 类型选择按钮
        this.typeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.typeButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentType = btn.dataset.type;
            });
        });

        // 新增收支弹窗
        this.addEntryBtn.addEventListener('click', () => this.openEntryModal());
        this.closeModalBtn.addEventListener('click', () => this.closeEntryModal());
        this.cancelBtn.addEventListener('click', () => this.closeEntryModal());

        // 预算弹窗
        this.setBudgetBtn.addEventListener('click', () => this.openBudgetModal());
        this.closeBudgetModalBtn.addEventListener('click', () => this.closeBudgetModal());
        this.cancelBudgetBtn.addEventListener('click', () => this.closeBudgetModal());

        // 表单提交
        this.entryForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveEntry();
        });

        this.budgetForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveBudget();
        });

        // 更多菜单
        this.moreBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.moreMenu.classList.toggle('show');
        });

        document.addEventListener('click', () => {
            this.moreMenu.classList.remove('show');
        });

        this.exportBtn.addEventListener('click', () => this.exportData());
        this.backupBtn.addEventListener('click', () => this.backupData());
        this.filterBtn.addEventListener('click', () => Utils.showToast('筛选功能开发中～', 'info'));
    },

    /**
     * 渲染收支列表
     */
    renderEntries() {
        if (!this.entriesList) return;

        const filteredEntries = this.entries.filter(entry => {
            if (this.currentFilter === 'all') return true;
            return entry.type === this.currentFilter;
        });

        if (filteredEntries.length === 0) {
            this.entriesList.innerHTML = '<div class="card text-center">暂无记录，快来添加吧～</div>';
            return;
        }

        this.entriesList.innerHTML = filteredEntries.map(entry => `
            <div class="entry-item" data-id="${entry.id}">
                <div class="entry-icon">${this.getCategoryIcon(entry.category)}</div>
                <div class="entry-info">
                    <div class="entry-name">${entry.category || '未分类'}</div>
                    <div class="entry-meta">
                        <span>${entry.date || ''}</span>
                        ${entry.note ? `<span>${entry.note}</span>` : ''}
                    </div>
                </div>
                <div class="entry-amount ${entry.type}">${entry.type === 'expense' ? '-' : '+'}${Utils.formatAmount(entry.amount, false)}</div>
                <div class="entry-actions">
                    <button class="entry-action-btn edit-btn" title="编辑" data-id="${entry.id}">✏️</button>
                    <button class="entry-action-btn delete-btn" title="删除" data-id="${entry.id}">🗑️</button>
                </div>
            </div>
        `).join('');

        // 绑定编辑/删除事件
        this.entriesList.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                this.editEntry(id);
            });
        });

        this.entriesList.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                this.deleteEntry(id);
            });
        });
    },

    /**
     * 获取分类图标
     */
    getCategoryIcon(category = '') {
        const icons = {
            '奶茶': '🧋',
            '电影': '🎬',
            '餐饮': '🍔',
            '交通': '🚗',
            '购物': '🛍️',
            '收入': '💰'
        };
        return icons[category] || '💙';
    },

    /**
     * 更新统计数据
     */
    updateStats() {
        const currentMonth = Utils.formatDate(new Date(), 'YYYY-MM');
        const monthEntries = this.entries.filter(entry => entry.date && entry.date.startsWith(currentMonth));

        const income = monthEntries
            .filter(entry => entry.type === 'income')
            .reduce((sum, entry) => sum + Number(entry.amount || 0), 0);

        const expense = monthEntries
            .filter(entry => entry.type === 'expense')
            .reduce((sum, entry) => sum + Number(entry.amount || 0), 0);

        const balance = income - expense;

        if (this.monthIncomeEl) this.monthIncomeEl.textContent = Utils.formatAmount(income);
        if (this.monthExpenseEl) this.monthExpenseEl.textContent = Utils.formatAmount(expense);
        if (this.monthBalanceEl) this.monthBalanceEl.textContent = Utils.formatAmount(balance);

        this.budget.spent = expense;
        this.budget.remaining = Math.max(this.budget.amount - expense, 0);
        this.updateBudgetUI();

        this.updateChart(income, expense);
    },

    /**
     * 初始化图表
     */
    initChart() {
        const ctx = document.getElementById('accountChart');
        if (!ctx) return;

        this.chart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['收入', '支出'],
                datasets: [{
                    data: [0, 0],
                    backgroundColor: ['#4CAF50', '#F44336'],
                    borderWidth: 0,
                    hoverOffset: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            font: { family: getComputedStyle(document.documentElement).getPropertyValue('--font-chinese') }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => `${context.label}: ${Utils.formatAmount(context.parsed)}`,
                        }
                    }
                }
            }
        });
    },

    /**
     * 更新图表数据
     */
    updateChart(income = 0, expense = 0) {
        if (!this.chart) return;
        this.chart.data.datasets[0].data = [income, expense];
        this.chart.update();
    },

    /**
     * 打开新增收支弹窗
     */
    openEntryModal(entry = null) {
        this.entryModal.classList.add('show');
        document.body.style.overflow = 'hidden';

        if (entry) {
            this.currentType = entry.type;
            this.typeButtons.forEach(btn => {
                btn.classList.toggle('active', btn.dataset.type === entry.type);
            });
            this.entryAmount.value = entry.amount;
            this.entryCategory.value = entry.category;
            this.entryNote.value = entry.note || '';
            this.entryDate.value = entry.date;
            this.entryForm.dataset.id = entry.id;
        } else {
            this.entryForm.reset();
            this.entryDate.value = Utils.formatDate(new Date());
            this.entryForm.dataset.id = '';
        }
    },

    /**
     * 关闭新增收支弹窗
     */
    closeEntryModal() {
        this.entryModal.classList.remove('show');
        document.body.style.overflow = '';
        this.entryForm.reset();
        this.entryForm.dataset.id = '';
    },

    /**
     * 保存收支记录
     */
    async saveEntry() {
        const amount = Number(this.entryAmount.value);
        const category = this.entryCategory.value.trim();
        const note = this.entryNote.value.trim();
        const date = this.entryDate.value;

        if (!amount || !category || !date) {
            Utils.showToast('请填写完整信息', 'error');
            return;
        }

        const entry = {
            id: this.entryForm.dataset.id || Utils.generateId(),
            type: this.currentType,
            amount,
            category,
            note,
            date
        };

        try {
            if (this.entryForm.dataset.id) {
                await Storage.update('accounts', entry);
                const index = this.entries.findIndex(item => item.id === entry.id);
                if (index !== -1) this.entries[index] = entry;
                Utils.showToast('修改成功', 'success');
            } else {
                await Storage.add('accounts', entry);
                this.entries.push(entry);
                Utils.showToast('保存成功', 'success');
            }

            this.closeEntryModal();
            this.renderEntries();
            this.updateStats();
        } catch (error) {
            console.error('保存收支记录失败:', error);
            Utils.showToast('保存失败，请稍后重试', 'error');
        }
    },

    /**
     * 编辑收支记录
     */
    editEntry(id) {
        const entry = this.entries.find(item => item.id === id);
        if (!entry) return;
        this.openEntryModal(entry);
    },

    /**
     * 删除收支记录
     */
    async deleteEntry(id) {
        if (!confirm('确定要删除这条记录吗？')) return;
        try {
            await Storage.delete('accounts', id);
            this.entries = this.entries.filter(item => item.id !== id);
            this.renderEntries();
            this.updateStats();
            Utils.showToast('删除成功', 'success');
        } catch (error) {
            console.error('删除记录失败:', error);
            Utils.showToast('删除失败，请稍后重试', 'error');
        }
    },

    /**
     * 打开预算弹窗
     */
    openBudgetModal() {
        this.budgetModal.classList.add('show');
        document.body.style.overflow = 'hidden';
        document.getElementById('budgetInput').value = this.budget.amount || '';
    },

    /**
     * 关闭预算弹窗
     */
    closeBudgetModal() {
        this.budgetModal.classList.remove('show');
        document.body.style.overflow = '';
        this.budgetForm.reset();
    },

    /**
     * 保存预算
     */
    async saveBudget() {
        const amount = Number(document.getElementById('budgetInput').value);
        if (!amount) {
            Utils.showToast('请输入预算金额', 'error');
            return;
        }

        try {
            await Storage.setSetting('monthlyBudget', amount);
            this.budget.amount = amount;
            this.budget.remaining = Math.max(amount - this.budget.spent, 0);
            this.updateBudgetUI();
            this.closeBudgetModal();
            Utils.showToast('预算设置成功', 'success');
        } catch (error) {
            console.error('保存预算失败:', error);
            Utils.showToast('保存失败，请稍后重试', 'error');
        }
    },

    /**
     * 更新预算展示
     */
    updateBudgetUI() {
        if (this.budgetAmountEl) this.budgetAmountEl.textContent = Utils.formatAmount(this.budget.amount);
        if (this.budgetSpentEl) this.budgetSpentEl.textContent = Utils.formatAmount(this.budget.spent);
        if (this.budgetRemainingEl) this.budgetRemainingEl.textContent = Utils.formatAmount(this.budget.remaining);

        const percentage = this.budget.amount > 0 ? Math.min((this.budget.spent / this.budget.amount) * 100, 100) : 0;
        if (this.budgetProgressBar) {
            this.budgetProgressBar.style.width = `${percentage}%`;
            this.budgetProgressBar.classList.toggle('over', this.budget.spent > this.budget.amount);
        }

        if (this.budgetCard) {
            this.budgetCard.classList.toggle('over-budget', this.budget.spent > this.budget.amount && this.budget.amount > 0);
        }
    },

    /**
     * 导出数据
     */
    async exportData() {
        try {
            const data = await Storage.exportAll();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `family-account-${Utils.formatDate(new Date(), 'YYYYMMDDHHmmss')}.json`;
            a.click();
            URL.revokeObjectURL(url);
            Utils.showToast('导出成功', 'success');
        } catch (error) {
            console.error('导出失败:', error);
            Utils.showToast('导出失败，请稍后重试', 'error');
        }
    },

    /**
     * 备份数据（简化为导出）
     */
    async backupData() {
        Utils.showToast('正在备份...', 'info');
        await this.exportData();
    }
};

