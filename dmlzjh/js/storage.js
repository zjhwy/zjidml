/**
 * 数据存储模块
 * 使用IndexedDB进行本地数据存储
 */

const Storage = {
    dbName: 'FamilyAccountDB',
    dbVersion: 1,
    db: null,
    
    /**
     * 初始化数据库
     * @returns {Promise} 初始化Promise
     */
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            
            request.onerror = () => {
                console.error('数据库打开失败');
                reject(request.error);
            };
            
            request.onsuccess = () => {
                this.db = request.result;
                console.log('数据库打开成功');
                resolve(this.db);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // 记账数据表
                if (!db.objectStoreNames.contains('accounts')) {
                    const accountStore = db.createObjectStore('accounts', { keyPath: 'id', autoIncrement: false });
                    accountStore.createIndex('date', 'date', { unique: false });
                    accountStore.createIndex('type', 'type', { unique: false });
                }
                
                // 日志数据表
                if (!db.objectStoreNames.contains('diaries')) {
                    const diaryStore = db.createObjectStore('diaries', { keyPath: 'id', autoIncrement: false });
                    diaryStore.createIndex('date', 'date', { unique: false });
                }
                
                // 游戏数据表
                if (!db.objectStoreNames.contains('games')) {
                    const gameStore = db.createObjectStore('games', { keyPath: 'id', autoIncrement: false });
                    gameStore.createIndex('gameType', 'gameType', { unique: false });
                }
                
                // 选菜数据表
                if (!db.objectStoreNames.contains('foods')) {
                    const foodStore = db.createObjectStore('foods', { keyPath: 'id', autoIncrement: false });
                    foodStore.createIndex('name', 'name', { unique: false });
                }
                
                // 食材数据表
                if (!db.objectStoreNames.contains('ingredients')) {
                    const ingredientStore = db.createObjectStore('ingredients', { keyPath: 'id', autoIncrement: false });
                    ingredientStore.createIndex('category', 'category', { unique: false });
                }
                
                // 设置数据表
                if (!db.objectStoreNames.contains('settings')) {
                    db.createObjectStore('settings', { keyPath: 'key' });
                }
                
                // 照片数据表
                if (!db.objectStoreNames.contains('photos')) {
                    const photoStore = db.createObjectStore('photos', { keyPath: 'id', autoIncrement: false });
                    photoStore.createIndex('date', 'date', { unique: false });
                }
            };
        });
    },
    
    /**
     * 添加数据
     * @param {string} storeName - 存储对象名称
     * @param {Object} data - 要添加的数据
     * @returns {Promise} 添加Promise
     */
    async add(storeName, data) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.add(data);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },
    
    /**
     * 获取数据
     * @param {string} storeName - 存储对象名称
     * @param {string|number} id - 数据ID
     * @returns {Promise} 获取Promise
     */
    async get(storeName, id) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(id);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },
    
    /**
     * 获取所有数据
     * @param {string} storeName - 存储对象名称
     * @returns {Promise<Array>} 所有数据的Promise
     */
    async getAll(storeName) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();
            
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    },
    
    /**
     * 更新数据
     * @param {string} storeName - 存储对象名称
     * @param {Object} data - 要更新的数据
     * @returns {Promise} 更新Promise
     */
    async update(storeName, data) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(data);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },
    
    /**
     * 删除数据
     * @param {string} storeName - 存储对象名称
     * @param {string|number} id - 数据ID
     * @returns {Promise} 删除Promise
     */
    async delete(storeName, id) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(id);
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    },
    
    /**
     * 通过索引查询数据
     * @param {string} storeName - 存储对象名称
     * @param {string} indexName - 索引名称
     * @param {*} value - 查询值
     * @returns {Promise<Array>} 查询结果Promise
     */
    async getByIndex(storeName, indexName, value) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const index = store.index(indexName);
            const request = index.getAll(value);
            
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    },
    
    /**
     * 获取设置
     * @param {string} key - 设置键
     * @param {*} defaultValue - 默认值
     * @returns {Promise} 设置值Promise
     */
    async getSetting(key, defaultValue = null) {
        try {
            const result = await this.get('settings', key);
            return result ? result.value : defaultValue;
        } catch (error) {
            return defaultValue;
        }
    },
    
    /**
     * 设置设置
     * @param {string} key - 设置键
     * @param {*} value - 设置值
     * @returns {Promise} 设置Promise
     */
    async setSetting(key, value) {
        return this.update('settings', { key, value });
    },
    
    /**
     * 导出所有数据（备份）
     * @returns {Promise<Object>} 所有数据的Promise
     */
    async exportAll() {
        const data = {
            accounts: await this.getAll('accounts'),
            diaries: await this.getAll('diaries'),
            games: await this.getAll('games'),
            foods: await this.getAll('foods'),
            ingredients: await this.getAll('ingredients'),
            photos: await this.getAll('photos'),
            settings: await this.getAll('settings'),
            exportDate: new Date().toISOString()
        };
        
        return data;
    },
    
    /**
     * 导入数据（恢复）
     * @param {Object} data - 要导入的数据
     * @returns {Promise} 导入Promise
     */
    async importAll(data) {
        try {
            // 清空现有数据
            const stores = ['accounts', 'diaries', 'games', 'foods', 'ingredients', 'photos', 'settings'];
            
            for (const storeName of stores) {
                if (data[storeName] && Array.isArray(data[storeName])) {
                    for (const item of data[storeName]) {
                        await this.update(storeName, item);
                    }
                }
            }
            
            return true;
        } catch (error) {
            console.error('导入数据失败:', error);
            throw error;
        }
    }
};

// 初始化数据库
Storage.init().catch(err => {
    console.error('数据库初始化失败:', err);
});

