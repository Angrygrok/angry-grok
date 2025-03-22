const config = {
    type: Phaser.AUTO,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 800,
        height: 600
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 500 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);

let bird, slingshot, enemies, structures, isDragging = false, score = 0, tokenEarned = 0;

function preload() {
    this.load.image('elon', 'https://via.placeholder.com/50x50.png?text=Elon');
    this.load.image('enemy', 'https://via.placeholder.com/30x30.png?text=Enemy');
    this.load.image('block', 'https://via.placeholder.com/40x20.png?text=Block');
    this.load.image('background', 'https://via.placeholder.com/800x600.png?text=Space');
}

function create() {
    this.add.image(400, 300, 'background');

    window.Telegram.WebApp.ready();
    const user = window.Telegram.WebApp.initDataUnsafe.user || { id: 'test_user' };
    this.add.text(16, 40, `Welcome, ${user.id}!`, { fontSize: '16px', fill: '#fff' });

    slingshot = { x: 150, y: 500 };
    bird = this.physics.add.sprite(slingshot.x, slingshot.y, 'elon')
        .setScale(0.5)
        .setCollideWorldBounds(true)
        .setBounce(0.2);

    enemies = this.physics.add.group();
    enemies.create(600, 550, 'enemy');
    enemies.create(650, 550, 'enemy');

    structures = this.physics.add.group();
    structures.create(600, 500, 'block');
    structures.create(650, 500, 'block');
    structures.create(625, 450, 'block');

    this.physics.add.collider(bird, enemies, hitEnemy, null, this);
    this.physics.add.collider(bird, structures);
    this.physics.add.collider(structures, enemies);
    this.physics.add.collider(structures, structures);

    this.scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '20px', fill: '#fff' });
    this.tokenText = this.add.text(16, 60, 'Tokens: 0', { fontSize: '20px', fill: '#fff' });

    this.input.on('pointerdown', startDrag, this);
    this.input.on('pointermove', dragBird, this);
    this.input.on('pointerup', launchBird, this);
}

function startDrag(pointer) {
    if (!bird.body.enable) return;
    isDragging = true;
}

function dragBird(pointer) {
    if (isDragging) {
        bird.x = Math.min(Math.max(pointer.x, slingshot.x - 50), slingshot.x + 50);
        bird.y = Math.min(Math.max(pointer.y, slingshot.y - 50), slingshot.y + 50);
    }
}

function launchBird() {
    if (isDragging) {
        isDragging = false;
        const dx = slingshot.x - bird.x;
        const dy = slingshot.y - bird.y;
        bird.setVelocity(dx * 10, dy * 10);
        bird.body.enable = true;
    }
}

function hitEnemy(bird, enemy) {
    enemy.destroy();
    score += 10;
    tokenEarned += 0.1;
    this.scoreText.setText('Score: ' + score);
    this.tokenText.setText('Tokens: ' + tokenEarned.toFixed(1));
    checkWin();
}

function checkWin() {
    if (enemies.countActive() === 0) {
        const winText = this.add.text(400, 300, `You Win! Earned ${tokenEarned.toFixed(1)} Grok-o-Gram`, { fontSize: '32px', fill: '#fff' }).setOrigin(0.5);
        window.Telegram.WebApp.sendData(JSON.stringify({ score: score, tokens: tokenEarned }));
        setTimeout(() => window.Telegram.WebApp.close(), 2000);
    }
}

function update() {
    if (bird.body.enable && (bird.y > 600 || bird.x > 800 || bird.x < 0)) {
        resetBird();
    }
}

function resetBird() {
    bird.setPosition(slingshot.x, slingshot.y);
    bird.setVelocity(0, 0);
    bird.body.enable = true;
}