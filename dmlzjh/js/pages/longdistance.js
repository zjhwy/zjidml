/**
 * 异地相思馆脚本
 */

document.addEventListener('DOMContentLoaded', () => {
    if (document.body.contains(document.querySelector('.longdistance-page'))) {
        LongDistancePage.init();
    }
});

const LongDistancePage = {
    meetDate: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 5),
    todos: [
        { id: 1, text: '视频通话', done: false },
        { id: 2, text: '分享日常', done: true }
    ],
    messages: [],
    gallery: [
        { src: 'https://placehold.co/200x140', text: '第一次异地前的约定' },
        { src: 'https://placehold.co/200x140', text: '我们一起的云看电影' }
    ],

    init() {
        this.cacheDom();
        this.updateCountdown();
        this.renderTodos();
        this.renderMessages();
        this.renderGallery();
        this.bindEvents();
    },

    cacheDom() {
        this.countdownValue = document.getElementById('countdownValue');
        this.todoContainer = document.getElementById('longdistanceTodo');
        this.messageInput = document.getElementById('messageInput');
        this.messageList = document.getElementById('messageList');
        this.galleryCarousel = document.getElementById('galleryCarousel');
    },

    bindEvents() {
        document.getElementById('selfCheckinBtn').addEventListener('click', () => {
            Utils.showToast('今日打卡成功～', 'success');
        });

        document.getElementById('addTodoBtn').addEventListener('click', () => {
            const text = prompt('输入新的异地待办');
            if (!text) return;
            this.todos.push({ id: Utils.generateId(), text, done: false });
            this.renderTodos();
        });

        document.getElementById('sendMessageBtn').addEventListener('click', () => {
            const content = this.messageInput.value.trim();
            if (!content) return Utils.showToast('先写点思念再发送～', 'info');
            this.messages.unshift({ content, time: Utils.formatDate(new Date(), 'MM-DD HH:mm') });
            this.messageInput.value = '';
            this.renderMessages();
            Utils.showToast('已发送给Ta，心跳传达中～', 'success');
        });
    },

    updateCountdown() {
        const days = Utils.daysBetween(new Date(), this.meetDate);
        this.countdownValue.textContent = `${days} 天`;
    },

    renderTodos() {
        this.todoContainer.innerHTML = this.todos.map(todo => `
            <div class="todo-item">
                <label>
                    <input type="checkbox" ${todo.done ? 'checked' : ''} data-id="${todo.id}">
                    ${todo.text}
                </label>
                <button data-id="${todo.id}">删除</button>
            </div>
        `).join('');

        this.todoContainer.querySelectorAll('input').forEach(input => {
            input.addEventListener('change', () => {
                const id = input.dataset.id;
                const todo = this.todos.find(item => item.id == id);
                if (todo) todo.done = input.checked;
            });
        });

        this.todoContainer.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                this.todos = this.todos.filter(todo => todo.id != id);
                this.renderTodos();
            });
        });
    },

    renderMessages() {
        if (this.messages.length === 0) {
            this.messageList.innerHTML = '<div class="card text-center">暂无留言，快来表达思念吧～</div>';
            return;
        }
        this.messageList.innerHTML = this.messages.map(msg => `
            <div class="message-item">
                <div>${msg.content}</div>
                <small>${msg.time}</small>
            </div>
        `).join('');
    },

    renderGallery() {
        this.galleryCarousel.innerHTML = this.gallery.map(item => `
            <div class="gallery-card">
                <img src="${item.src}" alt="${item.text}">
                <div class="gallery-caption">${item.text}</div>
            </div>
        `).join('');
    }
};

