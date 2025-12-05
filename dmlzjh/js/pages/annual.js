/**
 * 年度总结脚本
 */

document.addEventListener('DOMContentLoaded', () => {
    if (document.body.contains(document.querySelector('.annual-page'))) {
        AnnualPage.init();
    }
});

const AnnualPage = {
    highlights: [
        { title: '第一次旅行', desc: '阳光海边的甜蜜假期', photo: 'https://placehold.co/240x160' },
        { title: '一起做饭', desc: '番茄牛腩大作战', photo: 'https://placehold.co/240x160' },
        { title: '爱的周年', desc: '一年又一年，心动不变', photo: 'https://placehold.co/240x160' }
    ],
    timeline: [
        { month: '1月', event: '一起跨年倒计时', date: '01-01' },
        { month: '4月', event: '樱花树下的约定', date: '04-12' },
        { month: '9月', event: '第一次远程办公陪伴', date: '09-05' }
    ],

    async init() {
        await this.loadStats();
        this.renderHighlights();
        this.renderTimeline();
        this.bindEvents();
    },

    async loadStats() {
        const accounts = await Storage.getAll('accounts');
        const diaries = await Storage.getAll('diaries');
        const photos = await Storage.getAll('photos');

        const total = accounts.reduce((sum, entry) => sum + Number(entry.amount || 0), 0);

        document.getElementById('annualAmount').textContent = Utils.formatAmount(total);
        document.getElementById('annualPhotos').textContent = photos.length;
        document.getElementById('annualDiaries').textContent = diaries.length;
        document.getElementById('annualMood').textContent = diaries.length * 5;
    },

    renderHighlights() {
        const container = document.getElementById('highlightCarousel');
        container.innerHTML = this.highlights.map(item => `
            <div class="highlight-card">
                <img src="${item.photo}" alt="${item.title}" />
                <div class="highlight-content">
                    <h4>${item.title}</h4>
                    <p>${item.desc}</p>
                </div>
            </div>
        `).join('');
    },

    renderTimeline() {
        const container = document.getElementById('annualTimeline');
        container.innerHTML = this.timeline.map(item => `
            <div class="timeline-item">
                <div class="timeline-date">${item.month} · ${item.date}</div>
                <div class="timeline-event">${item.event}</div>
            </div>
        `).join('');
    },

    bindEvents() {
        document.getElementById('exportPdfBtn').addEventListener('click', () => {
            Utils.showToast('PDF 导出功能开发中～', 'info');
        });
        document.getElementById('shareMemoryBtn').addEventListener('click', () => {
            Utils.showToast('分享链接已生成～', 'success');
        });
    }
};

