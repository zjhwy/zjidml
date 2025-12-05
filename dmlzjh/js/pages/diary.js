/**
 * 日志页面脚本
 */

document.addEventListener('DOMContentLoaded', () => {
    if (document.body.contains(document.querySelector('.diary-header'))) {
        DiaryPage.init();
    }
});

const DiaryPage = {
    moods: ['😀', '😊', '🥰', '😌', '😢', '😡'],
    selectedMood: '😊',
    selectedDate: Utils.formatDate(new Date()),
    tags: [],
    diaries: [],

    async init() {
        await this.loadDiaries();
        this.cacheDom();
        this.renderDateNav();
        this.renderMoodButtons();
        this.renderTags();
        this.renderDiaryList();
        this.bindEvents();
    },

    async loadDiaries() {
        try {
            this.diaries = await Storage.getAll('diaries') || [];
        } catch (error) {
            console.error('加载日志失败:', error);
            this.diaries = [];
        }
    },

    cacheDom() {
        this.dateNav = document.getElementById('dateNav');
        this.diaryContent = document.getElementById('diaryContent');
        this.moodSelector = document.getElementById('moodSelector');
        this.tagList = document.getElementById('tagList');
        this.diaryList = document.getElementById('diaryList');
        this.addTagBtn = document.getElementById('addTagBtn');
        this.saveDiaryBtn = document.getElementById('saveDiaryBtn');
    },

    bindEvents() {
        this.addTagBtn.addEventListener('click', () => this.addTag());
        this.saveDiaryBtn.addEventListener('click', () => this.saveDiary());
    },

    renderDateNav() {
        const today = new Date();
        const dates = [];

        for (let i = 29; i >= 0; i--) {
            const date = new Date();
            date.setDate(today.getDate() - i);
            dates.push(Utils.formatDate(date));
        }

        this.dateNav.innerHTML = dates.map(date => {
            const isToday = date === Utils.formatDate(today);
            const isSelected = date === this.selectedDate;
            return `
                <button class="date-button ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}" data-date="${date}">
                    <div>${date.slice(5)}</div>
                    <small>${this.hasDiary(date) ? '已记录' : '未记录'}</small>
                </button>
            `;
        }).join('');

        this.dateNav.querySelectorAll('.date-button').forEach(btn => {
            btn.addEventListener('click', () => {
                this.selectedDate = btn.dataset.date;
                this.renderDateNav();
                this.loadDiaryForDate();
            });
        });
    },

    renderMoodButtons() {
        this.moodSelector.innerHTML = this.moods.map(mood => `
            <button class="mood-btn ${this.selectedMood === mood ? 'active' : ''}" data-mood="${mood}">
                ${mood}
            </button>
        `).join('');

        this.moodSelector.querySelectorAll('.mood-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.selectedMood = btn.dataset.mood;
                this.renderMoodButtons();
            });
        });
    },

    renderTags() {
        if (this.tags.length === 0) {
            this.tagList.innerHTML = '<div class="tag-pill">暂无标签</div>';
            return;
        }

        this.tagList.innerHTML = this.tags.map((tag, index) => `
            <div class="tag-pill">
                ${tag}
                <button data-index="${index}" class="tag-remove">×</button>
            </div>
        `).join('');

        this.tagList.querySelectorAll('.tag-remove').forEach(btn => {
            btn.addEventListener('click', () => {
                const index = btn.dataset.index;
                this.tags.splice(index, 1);
                this.renderTags();
            });
        });
    },

    renderDiaryList() {
        if (this.diaries.length === 0) {
            this.diaryList.innerHTML = '<div class="card text-center">暂无日志，快来记录吧～</div>';
            return;
        }

        const sorted = [...this.diaries].sort((a, b) => b.date.localeCompare(a.date));
        this.diaryList.innerHTML = sorted.map(diary => `
            <div class="diary-card">
                <div class="diary-card-header">
                    <div class="diary-card-title">
                        <span>${diary.mood || '😊'}</span>
                        <span>${diary.date}</span>
                    </div>
                    <div class="diary-card-tags">
                        ${(diary.tags || []).map(tag => `<span class="tag-pill">${tag}</span>`).join('')}
                    </div>
                </div>
                <div class="diary-card-content">${diary.content || '（暂无内容）'}</div>
            </div>
        `).join('');
    },

    addTag() {
        const tag = prompt('请输入标签文案（如：甜蜜、旅行）');
        if (!tag) return;
        this.tags.push(tag);
        this.renderTags();
    },

    async saveDiary() {
        const content = this.diaryContent.value.trim();
        if (!content) {
            Utils.showToast('请输入日志内容', 'error');
            return;
        }

        const diary = {
            id: this.selectedDate,
            date: this.selectedDate,
            content,
            mood: this.selectedMood,
            tags: this.tags
        };

        try {
            await Storage.update('diaries', diary);
            const index = this.diaries.findIndex(item => item.id === diary.id);
            if (index !== -1) {
                this.diaries[index] = diary;
            } else {
                this.diaries.push(diary);
            }

            this.renderDiaryList();
            this.renderDateNav();
            Utils.showToast('日志保存成功', 'success');
        } catch (error) {
            console.error('保存日志失败:', error);
            Utils.showToast('保存失败，请稍后重试', 'error');
        }
    },

    hasDiary(date) {
        return this.diaries.some(diary => diary.date === date);
    },

    loadDiaryForDate() {
        const diary = this.diaries.find(item => item.date === this.selectedDate);
        if (diary) {
            this.diaryContent.value = diary.content;
            this.selectedMood = diary.mood || '😊';
            this.tags = diary.tags || [];
        } else {
            this.diaryContent.value = '';
            this.selectedMood = '😊';
            this.tags = [];
        }
        this.renderMoodButtons();
        this.renderTags();
    }
};

