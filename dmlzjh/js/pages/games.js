/**
 * 情侣小游戏脚本
 */

document.addEventListener('DOMContentLoaded', () => {
    if (document.body.contains(document.querySelector('.games-header'))) {
        GamesPage.init();
    }
});

const GamesPage = {
    games: [
        { id: 'rps', name: '甜蜜猜拳', icon: '✊', desc: '猜拳赢得甜蜜奖励', component: 'renderRps' },
        { id: 'draw', name: '你画我猜', icon: '🎨', desc: '画画传情猜词', component: 'renderDraw' },
        { id: 'truth', name: '真心话', icon: '💬', desc: '温柔问答拉近距离', component: 'renderTruth' },
        { id: 'dice', name: '幸运骰子', icon: '🎲', desc: '掷骰子决定惊喜', component: 'renderDice' }
    ],
    records: [],

    init() {
        this.cacheDom();
        this.renderGameCards();
        this.bindEvents();
        this.renderGame('rps');
    },

    cacheDom() {
        this.gameGrid = document.getElementById('gameGrid');
        this.gamePlayContainer = document.getElementById('gamePlayContainer');
        this.recordsPanel = document.getElementById('recordsPanel');
        this.viewRecordsBtn = document.getElementById('viewRecordsBtn');
        this.winRateEl = document.getElementById('winRate');
        this.medalCountEl = document.getElementById('medalCount');
    },

    bindEvents() {
        this.viewRecordsBtn.addEventListener('click', () => {
            this.recordsPanel.classList.toggle('show');
        });
    },

    renderGameCards() {
        this.gameGrid.innerHTML = this.games.map(game => `
            <div class="game-card" data-id="${game.id}">
                <div class="game-icon">${game.icon}</div>
                <div class="game-title">${game.name}</div>
                <div class="game-desc">${game.desc}</div>
                <button class="btn-primary game-start-btn">开始游戏</button>
            </div>
        `).join('');

        this.gameGrid.querySelectorAll('.game-card').forEach(card => {
            card.addEventListener('click', () => {
                const id = card.dataset.id;
                this.renderGame(id);
            });
        });
    },

    renderGame(id) {
        const game = this.games.find(g => g.id === id);
        if (!game) return;
        const renderer = this[game.component];
        if (renderer) renderer.call(this);
    },

    renderRps() {
        this.gamePlayContainer.innerHTML = `
            <div class="rps-game">
                <h3 class="section-title">甜蜜猜拳</h3>
                <div class="rps-buttons">
                    <button class="rps-btn" data-choice="rock">✊ 石头</button>
                    <button class="rps-btn" data-choice="paper">✋ 布</button>
                    <button class="rps-btn" data-choice="scissors">✌️ 剪刀</button>
                </div>
                <div class="rps-result" id="rpsResult">等待选择...</div>
            </div>
        `;

        this.gamePlayContainer.querySelectorAll('.rps-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const choices = ['rock', 'paper', 'scissors'];
                const userChoice = btn.dataset.choice;
                const partnerChoice = choices[Math.floor(Math.random() * choices.length)];
                const result = this.getRpsResult(userChoice, partnerChoice);
                document.getElementById('rpsResult').textContent = result.message;
                this.addRecord('甜蜜猜拳', result.message);
            });
        });
    },

    getRpsResult(user, partner) {
        if (user === partner) return { message: '平局～继续加油！' };
        const win = (user === 'rock' && partner === 'scissors') ||
                    (user === 'paper' && partner === 'rock') ||
                    (user === 'scissors' && partner === 'paper');
        return { message: win ? '你赢啦！奖励一个甜蜜拥抱～' : '小可爱输了，轮到你宠我啦～' };
    },

    renderDraw() {
        this.gamePlayContainer.innerHTML = `
            <div class="draw-game">
                <h3 class="section-title">你画我猜</h3>
                <canvas id="drawCanvas" width="400" height="300"></canvas>
                <div class="draw-actions">
                    <input type="text" class="input" id="guessInput" placeholder="猜猜画了什么？">
                    <button class="btn-primary" id="submitGuess">提交答案</button>
                </div>
            </div>
        `;

        const canvas = document.getElementById('drawCanvas');
        const ctx = canvas.getContext('2d');
        let drawing = false;

        canvas.addEventListener('mousedown', () => drawing = true);
        canvas.addEventListener('mouseup', () => drawing = false);
        canvas.addEventListener('mousemove', (e) => {
            if (!drawing) return;
            ctx.fillStyle = '#87CEFA';
            ctx.beginPath();
            ctx.arc(e.offsetX, e.offsetY, 5, 0, Math.PI * 2);
            ctx.fill();
        });

        document.getElementById('submitGuess').addEventListener('click', () => {
            const guess = document.getElementById('guessInput').value.trim();
            if (!guess) return Utils.showToast('先输入你猜的内容哦～', 'info');
            this.addRecord('你画我猜', `回答：${guess}`);
            Utils.showToast('答案已记录～', 'success');
        });
    },

    renderTruth() {
        const questions = ['今天最想感谢我的哪件小事？', '最近想一起去的地方是哪里？', '形容我最可爱的瞬间～'];
        const question = questions[Math.floor(Math.random() * questions.length)];

        this.gamePlayContainer.innerHTML = `
            <div class="truth-game">
                <h3 class="section-title">真心话</h3>
                <div class="truth-question">${question}</div>
                <textarea class="input" id="truthAnswer" rows="4" placeholder="用心回答对方吧～"></textarea>
                <button class="btn-primary" id="submitTruth">发送答案</button>
            </div>
        `;

        document.getElementById('submitTruth').addEventListener('click', () => {
            const answer = document.getElementById('truthAnswer').value.trim();
            if (!answer) return Utils.showToast('要认真回答哦～', 'info');
            this.addRecord('真心话', `回答：${answer}`);
            Utils.showToast('答案已发送给Ta～', 'success');
        });
    },

    renderDice() {
        this.gamePlayContainer.innerHTML = `
            <div class="dice-game">
                <h3 class="section-title">幸运骰子</h3>
                <div class="dice-display" id="diceDisplay">🎲?</div>
                <button class="btn-primary" id="rollDiceBtn">点击随机</button>
            </div>
        `;

        document.getElementById('rollDiceBtn').addEventListener('click', () => {
            const result = Math.ceil(Math.random() * 6);
            const messages = ['约会一次', '甜蜜语音1分钟', '拥抱10秒', '共舞一曲', '分享童年趣事', '互写情书'];
            document.getElementById('diceDisplay').textContent = `🎲 ${result}`;
            this.addRecord('幸运骰子', `点数${result}：${messages[result - 1]}`);
        });
    },

    addRecord(game, content) {
        this.records.unshift({
            game,
            content,
            time: Utils.formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss')
        });
        this.renderRecords();
    },

    renderRecords() {
        if (this.records.length === 0) {
            this.recordsPanel.innerHTML = '<div class="text-center">暂无战绩记录～</div>';
            return;
        }
        this.recordsPanel.innerHTML = this.records.slice(0, 5).map(record => `
            <div class="record-item">
                <div>${record.game}</div>
                <small>${record.time}</small>
                <p>${record.content}</p>
            </div>
        `).join('');

        const wins = this.records.filter(r => r.content.includes('赢')).length;
        const winRate = this.records.length ? Math.round((wins / this.records.length) * 100) : 0;

        this.winRateEl.textContent = `${winRate}%`;
        this.medalCountEl.textContent = this.records.length;
    }
};

