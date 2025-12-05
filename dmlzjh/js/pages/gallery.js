/**
 * 家庭相册页面脚本（简化高性能版）
 * - 支持批量上传照片
 * - 使用 IndexedDB 的 photos 表存储元信息 + Base64 缩略图
 * - 按时间 / 场景 / 人物 / 自定义标签分组展示
 */

document.addEventListener('DOMContentLoaded', () => {
    if (document.body.contains(document.querySelector('.gallery-page'))) {
        GalleryPage.init();
    }
});

const GalleryPage = {
    photos: [],
    currentView: 'time',
    currentPhotoId: null,

    async init() {
        this.cacheDom();
        this.bindEvents();
        await this.loadPhotosFromDB();
        this.renderGroups();
    },

    cacheDom() {
        this.photoInput = document.getElementById('photoInput');
        this.photoLocation = document.getElementById('photoLocation');
        this.photoRelations = document.getElementById('photoRelations');
        this.photoScene = document.getElementById('photoScene');
        this.photoCustomTags = document.getElementById('photoCustomTags');
        this.savePhotosBtn = document.getElementById('savePhotosBtn');
        this.photoSearch = document.getElementById('photoSearch');
        this.galleryTabs = document.getElementById('galleryTabs');
        this.galleryGroups = document.getElementById('galleryGroups');

        this.photoDetailModal = document.getElementById('photoDetailModal');
        this.photoDetailPreview = document.getElementById('photoDetailPreview');
        this.photoNote = document.getElementById('photoNote');
        this.photoStyle = document.getElementById('photoStyle');
        this.photoSuggestions = document.getElementById('photoSuggestions');
    },

    bindEvents() {
        this.photoInput.addEventListener('change', () => {
            if (this.photoInput.files && this.photoInput.files.length > 0) {
                Utils.showToast(`已选择 ${this.photoInput.files.length} 张照片`, 'info');
            }
        });

        this.savePhotosBtn.addEventListener('click', () => this.handleSavePhotos());

        this.galleryTabs.querySelectorAll('.gallery-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this.galleryTabs.querySelectorAll('.gallery-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.currentView = tab.dataset.view;
                this.renderGroups();
            });
        });

        this.photoSearch.addEventListener('input', Utils.debounce(() => {
            this.renderGroups();
        }, 300));

        document.getElementById('closePhotoDetail').addEventListener('click', () => this.closeDetail());
        document.getElementById('deletePhotoBtn').addEventListener('click', () => this.deleteCurrentPhoto());
        document.getElementById('savePhotoDetailBtn').addEventListener('click', () => this.savePhotoDetail());
    },

    async loadPhotosFromDB() {
        try {
            const rows = await Storage.getAll('photos');
            this.photos = rows || [];
        } catch (e) {
            console.error('加载相册数据失败:', e);
            this.photos = [];
        }
    },

    async handleSavePhotos() {
        const files = this.photoInput.files;
        if (!files || files.length === 0) {
            Utils.showToast('请先选择要上传的照片～', 'error');
            return;
        }

        // 限制单次上传数量，避免一次性很多张导致明显卡顿
        if (files.length > 30) {
            Utils.showToast('单次最多建议上传 30 张照片，请分批上传～', 'info');
        }

        const location = this.photoLocation.value.trim();
        const relations = this.photoRelations.value.trim();
        const sceneInput = this.photoScene.value;
        const customTags = this.photoCustomTags.value
            .split(',')
            .map(t => t.trim())
            .filter(Boolean);

        Utils.showLoading(true);
        try {
            for (const file of files) {
                // 使用现有工具函数压缩，减小内存占用
                const compressedBlob = await Utils.compressImage(file, 800, 800, 0.8);
                const src = await this.blobToDataUrl(compressedBlob);
                const createdAt = new Date().toISOString();

                const scene = this.detectScene(sceneInput, file.name, customTags);
                const peopleKey = this.detectPeopleCategory(relations);
                const timeKey = this.buildTimeKey(createdAt);

                const photo = {
                    id: Utils.generateId(),
                    src,
                    createdAt,
                    location,
                    relations,
                    scene,
                    tags: customTags,
                    categories: {
                        timeKey,
                        sceneKey: scene,
                        peopleKey,
                        customKeys: customTags
                    },
                    note: '',
                    style: 'none',
                    aiHints: this.mockAiHints()
                };

                await Storage.add('photos', photo);
                this.photos.push(photo);
            }

            Utils.showToast('照片已保存到家庭相册～', 'success');
            this.photoInput.value = '';
            this.photoCustomTags.value = '';
            this.renderGroups();
        } catch (e) {
            console.error('保存照片失败:', e);
            Utils.showToast('保存失败，请稍后重试', 'error');
        } finally {
            Utils.showLoading(false);
        }
    },

    blobToDataUrl(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve(String(e.target?.result || ''));
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    },

    detectScene(sceneInput, fileName, tags) {
        if (sceneInput && sceneInput !== 'auto') return sceneInput;
        const lower = fileName.toLowerCase();
        if (lower.includes('beach') || lower.includes('sea')) return 'travel';
        if (lower.includes('birthday') || tags.includes('生日')) return 'birthday';
        return 'daily';
    },

    detectPeopleCategory(relationsStr) {
        if (!relationsStr) return 'unknown';
        const rels = relationsStr.split(',').map(r => r.trim()).filter(Boolean);
        const hasPet = rels.some(r => r.includes('宠物') || r.toLowerCase().includes('dog') || r.toLowerCase().includes('cat'));
        if (hasPet) return 'with_pet';
        if (rels.length === 1) return 'single';
        if (rels.length === 2) return 'double';
        if (rels.length >= 3) return 'family';
        return 'unknown';
    },

    buildTimeKey(iso) {
        const d = new Date(iso);
        const year = d.getFullYear();
        const month = d.getMonth() + 1;
        let season = '春';
        if ([3, 4, 5].includes(month)) season = '春';
        else if ([6, 7, 8].includes(month)) season = '夏';
        else if ([9, 10, 11].includes(month)) season = '秋';
        else season = '冬';
        return `${year}年·${season}季`;
    },

    mockAiHints() {
        return {
            suggestions: [
                '检测到轻微逆光，建议适当提高亮度和阴影细节。',
                '人物略微偏暗，可增加面部区域补光，让笑容更清晰。'
            ]
        };
    },

    renderGroups() {
        const keyword = this.photoSearch.value.trim().toLowerCase();
        let list = this.photos;

        if (keyword) {
            list = list.filter(p => {
                const text = [
                    p.location,
                    p.relations,
                    p.scene,
                    p.note,
                    ...(p.tags || [])
                ].join(' ').toLowerCase();
                return text.includes(keyword);
            });
        }

        const groupsMap = new Map();
        const getKey = (p) => {
            if (this.currentView === 'scene') return p.categories.sceneKey || '未分类场景';
            if (this.currentView === 'people') return p.categories.peopleKey || '未分类人物';
            if (this.currentView === 'custom') return (p.categories.customKeys && p.categories.customKeys[0]) || '未打标签';
            return p.categories.timeKey || '未分类时间';
        };

        for (const p of list) {
            const key = getKey(p);
            if (!groupsMap.has(key)) groupsMap.set(key, []);
            groupsMap.get(key).push(p);
        }

        if (groupsMap.size === 0) {
            this.galleryGroups.innerHTML = '<div class="card text-center">暂无照片，先上传几张试试吧～</div>';
            return;
        }

        const html = [];
        for (const [key, photos] of groupsMap.entries()) {
            html.push(`
                <div class="gallery-group">
                    <div class="gallery-group-title">${key}</div>
                    <div class="photo-grid">
                        ${photos.map(p => `
                            <div class="photo-card" data-id="${p.id}">
                                <img src="${p.src}" alt="photo" loading="lazy" />
                                <div class="photo-card-overlay">${p.location || ''}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `);
        }
        this.galleryGroups.innerHTML = html.join('');

        this.galleryGroups.querySelectorAll('.photo-card').forEach(card => {
            card.addEventListener('click', () => {
                const id = card.dataset.id;
                this.openDetail(id);
            });
        });
    },

    openDetail(id) {
        const photo = this.photos.find(p => p.id === id);
        if (!photo) return;
        this.currentPhotoId = id;

        this.photoDetailPreview.innerHTML = `<img src="${photo.src}" alt="preview" />`;
        this.photoNote.value = photo.note || '';
        this.photoStyle.value = photo.style || 'none';

        const hints = photo.aiHints?.suggestions || [];
        if (hints.length === 0) {
            this.photoSuggestions.innerHTML = '<li>暂无建议，照片已经很好看啦～</li>';
        } else {
            this.photoSuggestions.innerHTML = hints.map(h => `<li>${h}</li>`).join('');
        }

        this.photoDetailModal.classList.add('show');
        document.body.style.overflow = 'hidden';
    },

    closeDetail() {
        this.photoDetailModal.classList.remove('show');
        document.body.style.overflow = '';
        this.currentPhotoId = null;
    },

    async savePhotoDetail() {
        if (!this.currentPhotoId) return;
        const photo = this.photos.find(p => p.id === this.currentPhotoId);
        if (!photo) return;

        photo.note = this.photoNote.value.trim();
        photo.style = this.photoStyle.value;

        try {
            await Storage.update('photos', photo);
            Utils.showToast('照片信息已更新', 'success');
            this.closeDetail();
            this.renderGroups();
        } catch (e) {
            console.error('更新照片失败:', e);
            Utils.showToast('保存失败，请稍后重试', 'error');
        }
    },

    async deleteCurrentPhoto() {
        if (!this.currentPhotoId) return;
        if (!confirm('确定要删除这张照片吗？')) return;
        const id = this.currentPhotoId;
        try {
            await Storage.delete('photos', id);
            this.photos = this.photos.filter(p => p.id !== id);
            this.closeDetail();
            this.renderGroups();
            Utils.showToast('已删除', 'success');
        } catch (e) {
            console.error('删除照片失败:', e);
            Utils.showToast('删除失败，请稍后重试', 'error');
        }
    }
};
