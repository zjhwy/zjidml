/**
 * 家庭美食小管家脚本
 */

document.addEventListener('DOMContentLoaded', () => {
    if (document.body.contains(document.querySelector('.food-header'))) {
        FoodPage.init();
    }
});

const FoodPage = {
    // 菜品基础数据，后续可替换为 IndexedDB / 接口数据
    dishes: [
        {
            id: '1',
            name: '番茄牛腩',
            tags: ['家常菜', '不辣'],
            image: '',
            favorite: false,
            // 所需食材列表
            ingredients: ['牛腩', '番茄', '洋葱'],
            // 简易做法文本
            steps: '牛腩焯水后与番茄、洋葱一起小火炖煮60分钟，加入少许盐和胡椒调味即可。',
            // 预估烹饪时间（分钟）
            cookTime: 60,
            difficulty: 'medium',       // 烹饪难度：easy / medium / hard
            cuisine: '川菜'            // 菜系：川菜 / 粤菜 / 鲁菜 / 豫菜 / 家常菜 等
        },
        {
            id: '2',
            name: '麻婆豆腐',
            tags: ['川菜', '辣'],
            image: '',
            favorite: true,
            ingredients: ['豆腐', '牛肉末', '豆瓣酱'],
            steps: '炒香牛肉末和豆瓣酱，加入豆腐轻轻翻动，小火收汁后撒上花椒面。',
            cookTime: 25,
            difficulty: 'easy',
            cuisine: '川菜'
        },
        {
            id: '3',
            name: '青椒土豆丝',
            tags: ['家常菜', '素菜'],
            image: '',
            favorite: false,
            ingredients: ['土豆', '青椒', '蒜'],
            steps: '土豆切丝泡水去淀粉，与青椒丝一同入锅快炒，加入蒜末和少许醋提香。',
            cookTime: 15,
            difficulty: 'easy',
            cuisine: '家常菜'
        }
    ],
    // 食材列表（实际可从 IndexedDB 读取）
    ingredients: [],
    // 采购清单
    purchaseList: [],

    /**
     * 初始化页面
     * - 先尝试从 IndexedDB 读取食材/菜品（若有后端可在此扩展）
     * - 再渲染页面，保证进入页面后各按钮都有响应
     */
    async init() {
        await Storage.init().catch(() => {});
        await this.loadFromDB();
        this.cacheDom();
        this.renderDishes();
        this.renderIngredients();
        this.renderRecommendations();
        this.bindEvents();
    },

    /**
     * 从 IndexedDB 加载已有数据（如存在）
     */
    async loadFromDB() {
        try {
            const [dbFoods, dbIngredients] = await Promise.all([
                Storage.getAll('foods'),
                Storage.getAll('ingredients')
            ]);

            if (Array.isArray(dbFoods) && dbFoods.length > 0) {
                // foods 表结构与 dishes 字段尽量保持一致
                this.dishes = dbFoods;
            }
            if (Array.isArray(dbIngredients) && dbIngredients.length > 0) {
                this.ingredients = dbIngredients;
            }
        } catch (e) {
            console.warn('从 IndexedDB 加载食材/菜品失败，使用内置示例数据。', e);
        }
    },

    cacheDom() {
        this.dishGrid = document.getElementById('dishGrid');
        this.ingredientTags = document.getElementById('ingredientTags');
        this.recommendList = document.getElementById('recommendList');
        this.randomDishBtn = document.getElementById('randomDishBtn');
        this.addIngredientBtn = document.getElementById('addIngredientBtn');

        // 食材弹窗相关
        this.ingredientModal = document.getElementById('ingredientModal');
        this.ingredientForm = document.getElementById('ingredientForm');
        this.ingredientModalTitle = document.getElementById('ingredientModalTitle');
        this.ingredientName = document.getElementById('ingredientName');
        this.ingredientQuantity = document.getElementById('ingredientQuantity');
        this.ingredientUnit = document.getElementById('ingredientUnit');
        this.ingredientFreshness = document.getElementById('ingredientFreshness');
        this.ingredientStorage = document.getElementById('ingredientStorage');
        this.ingredientPurchaseDate = document.getElementById('ingredientPurchaseDate');
        this.ingredientThreshold = document.getElementById('ingredientThreshold');
        this.ingredientImageInput = document.getElementById('ingredientImage');
        this.ingredientImagePreview = document.getElementById('ingredientImagePreview');
        this.ingredientBrightness = document.getElementById('ingredientBrightness');

        // 采购清单
        this.purchaseListEl = document.getElementById('purchaseList');
        this.exportPurchaseTextBtn = document.getElementById('exportPurchaseTextBtn');

        // 推荐筛选
        this.recommendBtn = document.getElementById('recommendBtn');
        this.filterTime = document.getElementById('filterTime');
        this.filterDifficulty = document.getElementById('filterDifficulty');
        this.filterCuisine = document.getElementById('filterCuisine');

        // 回做菜品卡片
        this.favoriteCard = document.getElementById('favoriteDishesCard');
    },

    bindEvents() {
        if (this.randomDishBtn) {
            this.randomDishBtn.addEventListener('click', () => this.randomDish());
        }

        // 打开录入食材弹窗（顶部快捷/管理区按钮共用）
        if (this.addIngredientBtn) {
            this.addIngredientBtn.addEventListener('click', () => this.openIngredientModal());
        }
        const recordBtn = document.getElementById('recordIngredientBtn');
        if (recordBtn) {
            recordBtn.addEventListener('click', () => this.openIngredientModal());
        }

        // 关闭弹窗
        const closeIng = document.getElementById('closeIngredientModal');
        const cancelIng = document.getElementById('cancelIngredientBtn');
        if (closeIng) closeIng.addEventListener('click', () => this.closeIngredientModal());
        if (cancelIng) cancelIng.addEventListener('click', () => this.closeIngredientModal());

        // 保存食材
        if (this.ingredientForm) {
            this.ingredientForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveIngredient();
            });
        }

        // 图片上传预览
        if (this.ingredientImageInput) {
            this.ingredientImageInput.addEventListener('change', (e) => this.handleIngredientImage(e));
        }
        // 亮度调节（简单通过 filter 实现预览）
        if (this.ingredientBrightness) {
            this.ingredientBrightness.addEventListener('input', () => this.updateImageBrightness());
        }

        // 导出采购清单文本
        if (this.exportPurchaseTextBtn) {
            this.exportPurchaseTextBtn.addEventListener('click', () => this.exportPurchaseList());
        }

        // 推荐按钮 + 筛选条件
        if (this.recommendBtn) {
            this.recommendBtn.addEventListener('click', () => this.renderRecommendations());
        }
        [this.filterTime, this.filterDifficulty, this.filterCuisine].forEach(sel => {
            if (sel) {
                sel.addEventListener('change', () => this.renderRecommendations());
            }
        });

        // 回做菜品：点击卡片，快速跳到菜品区域并高亮已收藏
        if (this.favoriteCard) {
            const btn = this.favoriteCard.querySelector('.btn-primary');
            if (btn) {
                btn.addEventListener('click', () => this.scrollToFavorites());
            } else {
                this.favoriteCard.addEventListener('click', () => this.scrollToFavorites());
            }
        }
    },

    /**
     * 渲染菜品卡片
     * - 支持点击展开/收起做法与食材
     * - 鼠标悬停显示收藏/编辑/删除按钮
     * - 点击食材 pill 跳转到上方食材列表
     */
    renderDishes() {
        this.dishGrid.innerHTML = this.dishes.map(dish => `
            <div class="dish-card" data-id="${dish.id}">
                <!-- 顶部图片区域 -->
                <div class="dish-image" style="background-image: url(${dish.image || 'https://placehold.co/300x200?text=Yummy'});"></div>

                <!-- 悬浮操作工具条 -->
                <div class="dish-toolbar">
                    <button class="dish-toolbar-btn toolbar-fav" data-id="${dish.id}">❤ 收藏</button>
                    <button class="dish-toolbar-btn toolbar-edit" data-id="${dish.id}">✏ 编辑</button>
                    <button class="dish-toolbar-btn toolbar-del" data-id="${dish.id}">🗑 删除</button>
                </div>

                <!-- 右上角收藏星星（方便手机端点击） -->
                <div class="favorite-star ${dish.favorite ? 'star-mark-animation' : ''}" data-id="${dish.id}">
                    ${dish.favorite ? '⭐' : '☆'}
                </div>

                <!-- 文本内容区：主信息 + 可展开内容 -->
                <div class="dish-content">
                    <!-- 主信息：名称 + 标签 + 按钮 -->
                    <div class="dish-main">
                        <h4>${dish.name}</h4>
                        <div class="dish-tags">
                            ${dish.tags.map(tag => `<span class="dish-tag">${tag}</span>`).join('')}
                        </div>
                        <button class="btn-secondary view-recipe-btn" data-id="${dish.id}">
                            展开 / 收起做法
                        </button>
                    </div>

                    <!-- 展开内容：所需食材 + 烹饪时间 + 做法 -->
                    <div class="dish-extra">
                        <div class="dish-extra-row">
                            <span class="dish-extra-label">所需食材</span>
                            <span class="dish-ingredients-inline">
                                ${dish.ingredients.map(ing => `
                                    <span class="dish-ingredient-link" data-ingredient="${ing}">${ing}</span>
                                `).join('')}
                            </span>
                        </div>
                        <div class="dish-extra-row">
                            <span class="dish-extra-label">烹饪时间</span>
                            <span>${dish.cookTime || 0} 分钟</span>
                        </div>
                        <div class="dish-extra-row">
                            <span class="dish-extra-label">做法步骤</span>
                            <span>${dish.steps || '步骤待补充～'}</span>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        // 收藏星星（手机端易点区域）
        this.dishGrid.querySelectorAll('.favorite-star').forEach(star => {
            star.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = e.currentTarget.dataset.id;
                this.toggleFavorite(id);
            });
        });

        // 悬浮工具条 - 收藏 / 编辑 / 删除
        this.dishGrid.querySelectorAll('.toolbar-fav').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = e.currentTarget.dataset.id;
                this.toggleFavorite(id);
            });
        });

        this.dishGrid.querySelectorAll('.toolbar-edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = e.currentTarget.dataset.id;
                this.editDish(id);
            });
        });

        this.dishGrid.querySelectorAll('.toolbar-del').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = e.currentTarget.dataset.id;
                this.deleteDish(id);
            });
        });

        // 展开 / 收起做法
        this.dishGrid.querySelectorAll('.view-recipe-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const card = e.currentTarget.closest('.dish-card');
                card.classList.toggle('expanded');
            });
        });

        // 点击卡片其它空白区域也可展开/收起
        this.dishGrid.querySelectorAll('.dish-card').forEach(card => {
            card.addEventListener('click', (e) => {
                // 避免点击按钮时重复触发展开
                if ((e.target instanceof HTMLElement) && e.target.closest('button')) return;
                card.classList.toggle('expanded');
            });
        });

        // 点击展开区中的食材 pill，跳转到上方食材列表
        this.dishGrid.querySelectorAll('.dish-ingredient-link').forEach(pill => {
            pill.addEventListener('click', (e) => {
                e.stopPropagation();
                const ingName = e.currentTarget.dataset.ingredient;
                this.scrollToIngredient(ingName);
            });
        });
    },

    /**
     * 收藏 / 取消收藏 菜品
     */
    toggleFavorite(id) {
        const dish = this.dishes.find(d => d.id === id);
        if (!dish) return;
        dish.favorite = !dish.favorite;
        this.renderDishes();

        // 同步到 IndexedDB 的 foods 表，避免刷新后丢失“回做”标记
        Storage.update('foods', dish).catch(() => {});

        Utils.showToast(dish.favorite ? '加入回做清单～' : '已取消回做', 'success');
    },

    /**
     * 查看做法（可扩展为弹窗形式）
     */
    viewRecipe(id) {
        const dish = this.dishes.find(d => d.id === id);
        if (!dish) return;
        alert(`${dish.name} 的做法：\n1. 准备食材\n2. 加入爱心\n3. 美味出锅～`);
    },

    /**
     * 简单编辑入口（示例：通过 prompt 修改名称）
     */
    editDish(id) {
        const dish = this.dishes.find(d => d.id === id);
        if (!dish) return;
        const newName = prompt('修改菜名：', dish.name);
        if (!newName) return;
        dish.name = newName;
        this.renderDishes();
        Utils.showToast('菜品名称已更新～', 'success');
    },

    /**
     * 删除菜品
     */
    deleteDish(id) {
        const dish = this.dishes.find(d => d.id === id);
        if (!dish) return;
        if (!confirm(`确定删除「${dish.name}」吗？`)) return;
        this.dishes = this.dishes.filter(d => d.id !== id);
        this.renderDishes();
        this.renderRecommendations();

        Storage.delete('foods', id).catch(() => {});
        Utils.showToast('菜品已删除', 'success');
    },

    /**
     * 回做清单跳转：只突出显示已收藏菜品
     */
    scrollToFavorites() {
        const favorites = this.dishes.filter(d => d.favorite);
        if (favorites.length === 0) {
            Utils.showToast('暂时还没有标记「回做」的菜品～', 'info');
            return;
        }

        // 简单方式：滚动到菜品区域，并给收藏卡片一个闪烁边框
        if (this.dishGrid) {
            this.dishGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
            const favCards = Array.from(this.dishGrid.querySelectorAll('.dish-card'))
                .filter(card => {
                    const id = card.getAttribute('data-id');
                    return favorites.some(d => d.id === id);
                });
            favCards.forEach(card => {
                card.style.boxShadow = '0 0 0 3px rgba(246, 209, 84, 0.9)';
                setTimeout(() => {
                    card.style.boxShadow = '';
                }, 1000);
            });
        }
    },

    /**
     * 打开录入 / 编辑食材弹窗
     * @param {Object|null} ing 传入则为编辑模式
     */
    openIngredientModal(ing = null) {
        this.ingredientForm.dataset.id = ing ? ing.id : '';
        this.ingredientModalTitle.textContent = ing ? '编辑食材' : '录入食材';

        if (ing) {
            this.ingredientName.value = ing.name;
            this.ingredientQuantity.value = ing.quantity ?? '';
            this.ingredientUnit.value = ing.unit ?? '';
            this.ingredientFreshness.value = ing.freshness ?? 'fresh';
            this.ingredientStorage.value = ing.storage ?? '';
            this.ingredientPurchaseDate.value = ing.purchaseDate ?? '';
            this.ingredientThreshold.value = ing.threshold ?? '';
            this.ingredientBrightness.value = ing.brightness ?? 100;
            if (ing.image) {
                this.ingredientImagePreview.innerHTML = `<img src="${ing.image}" style="filter:brightness(${this.ingredientBrightness.value}%);">`;
            } else {
                this.ingredientImagePreview.textContent = '暂无图片';
            }
        } else {
            this.ingredientForm.reset();
            this.ingredientImagePreview.textContent = '暂无图片';
            this.ingredientForm.dataset.id = '';
        }

        this.ingredientModal.classList.add('show');
        document.body.style.overflow = 'hidden';
    },

    /**
     * 关闭食材弹窗
     */
    closeIngredientModal() {
        this.ingredientModal.classList.remove('show');
        document.body.style.overflow = '';
    },

    /**
     * 处理图片上传并预览
     */
    handleIngredientImage(event) {
        const file = event.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const url = e.target?.result;
            if (!url) return;
            this.ingredientImagePreview.innerHTML = `<img src="${url}" style="filter:brightness(${this.ingredientBrightness.value}%);">`;
            // 临时存储在 form dataset，保存时写入 ingredients
            this.ingredientForm.dataset.image = String(url);
        };
        reader.readAsDataURL(file);
    },

    /**
     * 更新预览亮度
     */
    updateImageBrightness() {
        const img = this.ingredientImagePreview.querySelector('img');
        if (img) {
            img.style.filter = `brightness(${this.ingredientBrightness.value}%)`;
        }
    },

    /**
     * 保存食材（新增或编辑）
     */
    saveIngredient() {
        const name = this.ingredientName.value.trim();
        if (!name) {
            Utils.showToast('请输入食材名称', 'error');
            return;
        }

        const ing = {
            id: this.ingredientForm.dataset.id || Utils.generateId(),
            name,
            quantity: Number(this.ingredientQuantity.value || 0),
            unit: this.ingredientUnit.value.trim(),
            freshness: this.ingredientFreshness.value,
            storage: this.ingredientStorage.value.trim(),
            purchaseDate: this.ingredientPurchaseDate.value,
            threshold: Number(this.ingredientThreshold.value || 0),
            image: this.ingredientForm.dataset.image || '',
            brightness: Number(this.ingredientBrightness.value || 100)
        };

        const index = this.ingredients.findIndex(i => i.id === ing.id);
        if (index !== -1) {
            this.ingredients[index] = ing;
            Utils.showToast('食材已更新', 'success');
            Storage.update('ingredients', ing).catch(() => {});
        } else {
            this.ingredients.push(ing);
            Utils.showToast('食材已添加', 'success');
            Storage.add('ingredients', ing).catch(() => {});
        }

        this.closeIngredientModal();
        this.renderIngredients();
        this.renderRecommendations();
    },

    /**
     * 渲染上方已录入食材标签
     */
    renderIngredients() {
        if (this.ingredients.length === 0) {
            this.ingredientTags.innerHTML = '<div class="ingredient-pill">暂未录入食材</div>';
            return;
        }
        this.ingredientTags.innerHTML = this.ingredients.map(ing => {
            const isLow = ing.threshold && ing.quantity <= ing.threshold;
            return `
                <div class="ingredient-pill ${isLow ? 'ingredient-status-low' : ''}" data-id="${ing.id}">
                    <div class="ingredient-name">
                        ${ing.name}
                        ${isLow ? '<span style="color:#F97373;font-size:11px;">（库存偏低）</span>' : ''}
                    </div>
                    <div class="ingredient-meta">
                        ${ing.freshness === 'expire_soon' ? '临期 · ' : ''}
                        ${ing.storage || ''}
                    </div>
                    <div class="ingredient-qty">
                        <button class="ing-qty-dec" data-id="${ing.id}">-</button>
                        <span>${ing.quantity || 0} ${ing.unit || ''}</span>
                        <button class="ing-qty-inc" data-id="${ing.id}">+</button>
                    </div>
                    <div class="ingredient-actions">
                        <button class="ingredient-add-purchase" data-id="${ing.id}">加入采购</button>
                        <button class="ingredient-edit" data-id="${ing.id}">编辑</button>
                        <button class="ingredient-delete" data-id="${ing.id}">删除</button>
                    </div>
                </div>
            `;
        }).join('');

        // 数量增减
        this.ingredientTags.querySelectorAll('.ing-qty-inc').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                const ing = this.ingredients.find(i => i.id === id);
                if (!ing) return;
                ing.quantity = (ing.quantity || 0) + 1;
                this.renderIngredients();
                this.renderRecommendations();
            });
        });
        this.ingredientTags.querySelectorAll('.ing-qty-dec').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                const ing = this.ingredients.find(i => i.id === id);
                if (!ing) return;
                ing.quantity = Math.max((ing.quantity || 0) - 1, 0);
                this.renderIngredients();
                this.renderRecommendations();
            });
        });

        // 加入采购清单
        this.ingredientTags.querySelectorAll('.ingredient-add-purchase').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                this.addToPurchaseList(id);
            });
        });

        // 编辑 / 删除食材
        this.ingredientTags.querySelectorAll('.ingredient-edit').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                const ing = this.ingredients.find(i => i.id === id);
                if (ing) this.openIngredientModal(ing);
            });
        });

        this.ingredientTags.querySelectorAll('.ingredient-delete').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                this.ingredients = this.ingredients.filter(i => i.id !== id);
                this.renderIngredients();
                this.renderRecommendations();
            });
        });

        // 低库存提示：可选弹出 toast
        if (this.ingredients.some(i => i.threshold && i.quantity <= i.threshold)) {
            Utils.showToast('有食材库存偏低，记得及时补货～', 'info');
        }
    },

    /**
     * 渲染推荐结果区（基于当前录入食材粗略匹配）
     */
    /**
     * 渲染推荐菜品（结合筛选条件）
     * 优先推荐只用现有食材的菜，再推荐缺少少量食材的菜
     */
    renderRecommendations() {
        if (this.ingredients.length === 0) {
            this.recommendList.innerHTML = '<div class="card text-center">录入食材后即可获得推荐菜品～</div>';
            return;
        }

        // 当前库存名称集合（简单按名称包含）
        const stockNames = this.ingredients.map(i => i.name);

        // 先计算每道菜缺失的食材列表
        let candidates = this.dishes.map(dish => {
            const missing = dish.ingredients.filter(ing => !stockNames.some(name => name.includes(ing)));
            return { dish, missing };
        });

        // 推荐策略：先无缺失，再缺少 1-2 个，最后其他
        const exact = candidates.filter(c => c.missing.length === 0);
        const fewMissing = candidates.filter(c => c.missing.length > 0 && c.missing.length <= 2);
        const others = candidates.filter(c => c.missing.length > 2);
        candidates = [...exact, ...fewMissing, ...others];

        // 应用筛选条件
        const timeFilter = this.filterTime.value;
        const diffFilter = this.filterDifficulty.value;
        const cuisineFilter = this.filterCuisine.value;

        const filtered = candidates.filter(({ dish }) => {
            // 时间
            if (timeFilter === 'short' && !(dish.cookTime <= 15)) return false;
            if (timeFilter === 'medium' && !(dish.cookTime > 15 && dish.cookTime <= 30)) return false;
            if (timeFilter === 'long' && !(dish.cookTime > 30)) return false;
            // 难度
            if (diffFilter !== 'all' && dish.difficulty !== diffFilter) return false;
            // 菜系（允许菜品标签或 cuisine 字段包含）
            if (cuisineFilter !== 'all') {
                const matchCuisine = dish.cuisine === cuisineFilter || (dish.tags || []).some(t => t.includes(cuisineFilter));
                if (!matchCuisine) return false;
            }
            return true;
        });

        if (filtered.length === 0) {
            this.recommendList.innerHTML = '<div class="card text-center">当前条件下暂无合适菜品，试试放宽筛选条件～</div>';
            return;
        }

        this.recommendList.innerHTML = filtered.map(({ dish, missing }) => `
            <div class="recommend-card" data-id="${dish.id}">
                <h4>${dish.name}</h4>
                <p>所需食材：${dish.ingredients.join('、')}</p>
                ${
                    missing.length
                        ? `<p class="missing-ingredient">缺失：${missing.join('、')}</p>`
                        : '<p>全部食材已备齐，可以直接开火啦～</p>'
                }
                <p>预计用时：${dish.cookTime} 分钟 · 难度：${dish.difficulty === 'easy' ? '简单' : dish.difficulty === 'medium' ? '中等' : '复杂'} · 菜系：${dish.cuisine}</p>
                <button class="btn-primary recommend-view-recipe" data-id="${dish.id}">查看详细做法</button>
                ${
                    missing.length
                        ? `<button class="btn-secondary recommend-add-missing" data-id="${dish.id}">一键加入缺失食材到采购清单</button>`
                        : ''
                }
            </div>
        `).join('');

        // 查看做法（可以复用 viewRecipe，后续可替换为弹窗）
        this.recommendList.querySelectorAll('.recommend-view-recipe').forEach(btn => {
            btn.addEventListener('click', () => this.viewRecipe(btn.dataset.id));
        });

        // 一键将缺失食材加入采购清单
        this.recommendList.querySelectorAll('.recommend-add-missing').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                const dish = this.dishes.find(d => d.id === id);
                if (!dish) return;
                const missing = dish.ingredients.filter(ing => !stockNames.some(name => name.includes(ing)));
                missing.forEach(name => this.addRawToPurchaseList(name));
                Utils.showToast('缺失食材已加入采购清单', 'success');
            });
        });
    },

    /**
     * 随机选菜
     */
    randomDish() {
        const dish = this.dishes[Math.floor(Math.random() * this.dishes.length)];
        Utils.showToast(`今晚吃：${dish.name}！`, 'success');
    },

    /**
     * 滚动到指定食材标签，并做高亮提示
     * @param {string} name 食材名称
     */
    scrollToIngredient(name) {
        if (!this.ingredientTags) return;

        // 如果上方还没有这个食材，可以考虑自动添加一条
        if (!this.ingredients.some(ing => ing.name.includes(name))) {
            this.ingredients.push({
                id: Utils.generateId(),
                name,
                category: '自动添加',
                quantity: 0,
                unit: '',
                threshold: 0
            });
            this.renderIngredients();
        }

        // 查找对应 pill 并滚动到视口
        const targets = Array.from(this.ingredientTags.querySelectorAll('.ingredient-pill'))
            .filter(el => el.textContent && el.textContent.includes(name));

        if (targets.length > 0) {
            const target = targets[0];
            target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
            // 简单高亮闪烁效果
            target.style.boxShadow = '0 0 0 3px rgba(135,206,250,0.6)';
            setTimeout(() => {
                target.style.boxShadow = '';
            }, 800);
        }
    },

    /**
     * 将已有食材加入采购清单
     */
    addToPurchaseList(ingredientId) {
        const ing = this.ingredients.find(i => i.id === ingredientId);
        if (!ing) return;
        const exist = this.purchaseList.find(p => p.ingredientId === ingredientId);
        if (exist) {
            exist.quantity = (exist.quantity || 0) + 1;
        } else {
            this.purchaseList.push({
                id: Utils.generateId(),
                ingredientId,
                name: ing.name,
                quantity: 1,
                unit: ing.unit || ''
            });
        }
        this.renderPurchaseList();
        Utils.showToast('已加入采购清单', 'success');
    },

    /**
     * 直接用食材名加入采购清单（用于缺失食材）
     */
    addRawToPurchaseList(name) {
        const exist = this.purchaseList.find(p => p.name === name);
        if (exist) {
            exist.quantity = (exist.quantity || 0) + 1;
        } else {
            this.purchaseList.push({
                id: Utils.generateId(),
                ingredientId: '',
                name,
                quantity: 1,
                unit: ''
            });
        }
        this.renderPurchaseList();
    },

    /**
     * 渲染采购清单
     */
    renderPurchaseList() {
        if (this.purchaseList.length === 0) {
            this.purchaseListEl.innerHTML = '<div class="text-center">当前暂无待采购食材～</div>';
            return;
        }

        this.purchaseListEl.innerHTML = this.purchaseList.map(item => `
            <div class="purchase-item" data-id="${item.id}">
                <div>${item.name}</div>
                <div class="purchase-qty">
                    <input type="number" class="input" min="0" step="0.1" value="${item.quantity}" data-id="${item.id}">
                    <span>${item.unit || ''}</span>
                </div>
                <button class="purchase-remove-btn" data-id="${item.id}">已采购</button>
            </div>
        `).join('');

        // 数量编辑
        this.purchaseListEl.querySelectorAll('input').forEach(input => {
            input.addEventListener('change', () => {
                const id = input.dataset.id;
                const item = this.purchaseList.find(p => p.id === id);
                if (!item) return;
                item.quantity = Number(input.value || 0);
            });
        });

        // 已采购按钮：从清单删除，并联动增加库存
        this.purchaseListEl.querySelectorAll('.purchase-remove-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                const index = this.purchaseList.findIndex(p => p.id === id);
                if (index === -1) return;
                const item = this.purchaseList[index];

                // 如果关联了具体食材，则把采购数量加回库存
                if (item.ingredientId) {
                    const ing = this.ingredients.find(i => i.id === item.ingredientId);
                    if (ing) {
                        ing.quantity = (ing.quantity || 0) + (item.quantity || 0);
                    }
                }

                this.purchaseList.splice(index, 1);
                this.renderPurchaseList();
                this.renderIngredients();
                this.renderRecommendations();
                Utils.showToast('已标记为已采购并同步到库存', 'success');
            });
        });
    },

    /**
     * 导出采购清单为文本文件
     */
    exportPurchaseList() {
        if (this.purchaseList.length === 0) {
            Utils.showToast('暂无可导出的采购清单', 'info');
            return;
        }
        const lines = this.purchaseList.map(item =>
            `- ${item.name} x ${item.quantity || 0} ${item.unit || ''}`.trim()
        );
        const content = `家庭采购清单\n\n${lines.join('\n')}\n\n生成时间：${Utils.formatDate(new Date(), 'YYYY-MM-DD HH:mm')}`;
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `采购清单-${Utils.formatDate(new Date(), 'YYYYMMDDHHmmss')}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        Utils.showToast('采购清单已导出为文本文件', 'success');
    }
};

