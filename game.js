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
            gravity: { y: 400 },
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

let rocket, slingshot, stations, blocks, score = 0, tokens = 0, isDragging = false;
let scoreText, tokenText;

function preload() {
    this.load.image('rocket', 'https://via.placeholder.com/60x30.png?text=ElonRocket');
    this.load.image('station', 'https://via.placeholder.com/40x40.png?text=Station');
    this.load.image('block', 'https://via.placeholder.com/40x20.png?text=Block');
}

function create() {
    const scene = this; // نگه داشتن مرجع به this برای استفاده در توابع دیگر

    this.add.rectangle(400, 300, 800, 600, 0x000033); 

    window.Telegram.WebApp.ready();
    const user = window.Telegram.WebApp.initDataUnsafe.user || { id: 'test_user' };
    this.add.text(16, 40, `Rescue Elon, ${user.id}!`, { fontSize: '16px', fill: '#fff' });

    slingshot = { x: 150, y: 500 };
    rocket = this.physics.add.sprite(slingshot.x, slingshot.y, 'rocket')
        .setScale(0.5)
        .setCollideWorldBounds(true)
        .setBounce(0.3);

    stations = this.physics.add.group();
    stations.create(600, 550, 'station').setImmovable(true);
    stations.create(650, 500, 'station').setImmovable(true);

    blocks = this.physics.add.group();
    blocks.create(620, 450, 'block').setImmovable(true);
    blocks.create(630, 400, 'block').setImmovable(true);

    this.physics.add.collider(rocket, stations, (rocket, station) => hitStation(scene, rocket, station));
    this.physics.add.collider(rocket, blocks, (rocket, block) => hitBlock(scene, rocket, block));
    this.physics.add.collider(blocks, stations);

    scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '20px', fill: '#fff' });
    tokenText = this.add.text(16, 60, 'Tokens: 0', { fontSize: '20px', fill: '#fff' });

    this.add.text(150, 450, 'Grok: Launch Elon to Mars!', { fontSize: '16px', fill: '#fff' });

    this.input.on('pointerdown', startDrag, this);
    this.input.on('pointermove', dragRocket, this);
    this.input.on('pointerup', () => launchRocket(scene));
}

function startDrag(pointer) {
    if (!rocket.body.enable) return;
    isDragging = true;
}

function dragRocket(pointer) {
    if (isDragging) {
        rocket.x = Phaser.Math.Clamp(pointer.x, slingshot.x - 50, slingshot.x + 50);
        rocket.y = Phaser.Math.Clamp(pointer.y, slingshot.y - 50, slingshot.y + 50);
    }
}

function launchRocket(scene) {
    if (isDragging) {
        isDragging = false;
        const dx = slingshot.x - rocket.x;
        const dy = slingshot.y - rocket.y;
        rocket.setVelocity(dx * 15, dy * 15);
        rocket.body.enable = true;

        for (let i = 0; i < 5; i++) {
            let smoke = scene.add.circle(rocket.x, rocket.y, 5, 0xaaaaaa);
            scene.tweens.add({
                targets: smoke,
                scale: 0,
                alpha: 0,
                duration: 500,
                delay: i * 50
            });
        }
    }
}

function hitStation(scene, rocket, station) {
    station.destroy();
    score += 20;
    tokens += 0.2;
    scoreText.setText('Score: ' + score);
    tokenText.setText('Tokens: ' + tokens.toFixed(1));
    checkWin(scene);

    for (let i = 0; i < 10; i++) {
        let spark = scene.add.circle(station.x, station.y, 3, 0xff0000);
        scene.tweens.add({
            targets: spark,
            x: spark.x + Phaser.Math.Between(-20, 20),
            y: spark.y + Phaser.Math.Between(-20, 20),
            scale: 0,
            alpha: 0,
            duration: 300
        });
    }
}

function hitBlock(scene, rocket, block) {
    block.destroy();
    score += 10;
    tokens += 0.1;
    scoreText.setText('Score: ' + score);
    tokenText.setText('Tokens: ' + tokens.toFixed(1));
}

function checkWin(scene) {
    if (stations.countActive(true) === 0) {
        scene.add.text(400, 300, `Elon’s Saved! ${tokens.toFixed(1)} Grok-o-Gram`, { fontSize: '32px', fill: '#fff' }).setOrigin(0.5);
        window.Telegram.WebApp.sendData(JSON.stringify({ score: score, tokens: tokens }));
        setTimeout(() => window.Telegram.WebApp.close(), 2000);
    }
}

function update() {
    if (rocket.body.enable && (rocket.y > 600 || rocket.x > 800 || rocket.x < 0)) {
        resetRocket();
    }
}

function resetRocket() {
    rocket.setPosition(slingshot.x, slingshot.y);
    rocket.setVelocity(0, 0);
    rocket.body.enable = true;
