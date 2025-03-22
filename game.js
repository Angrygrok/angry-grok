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
    this.load.image('rocket', 'https://example.com/rocket.png');  // تصویر واقعی بذار
    this.load.image('station', 'https://example.com/station.png');
    this.load.image('block', 'https://example.com/block.png');
}

function create() {
    this.cameras.main.setBackgroundColor('#222244');  // پس‌زمینه تیره فضایی
    
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

    this.physics.add.collider(rocket, stations, hitStation, null, this);
    this.physics.add.collider(rocket, blocks, hitBlock, null, this);
    this.physics.add.collider(blocks, stations);

    scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '20px', fill: '#fff' });
    tokenText = this.add.text(16, 60, 'Tokens: 0', { fontSize: '20px', fill: '#fff' });

    this.input.on('pointerdown', startDrag, this);
    this.input.on('pointermove', dragRocket, this);
    this.input.on('pointerup', launchRocket, this);
}

function startDrag(pointer) {
    if (!rocket.body.enable) return;
    isDragging = true;
}

function dragRocket(pointer) {
    if (isDragging) {
        rocket.x = Phaser.Math.Clamp(pointer.x, slingshot.x - 100, slingshot.x + 100);
        rocket.y = Phaser.Math.Clamp(pointer.y, slingshot.y - 100, slingshot.y + 100);
    }
}

function launchRocket() {
    if (isDragging) {
        isDragging = false;
        let dx = slingshot.x - rocket.x;
        let dy = slingshot.y - rocket.y;
        rocket.setVelocity(dx * 5, dy * 5);
        rocket.body.enable = true;
    }
}

function hitStation(rocket, station) {
    station.destroy();
    score += 20;
    tokens += 0.2;
    scoreText.setText('Score: ' + score);
    tokenText.setText('Tokens: ' + tokens.toFixed(1));
}

function hitBlock(rocket, block) {
    block.destroy();
    score += 10;
    tokens += 0.1;
    scoreText.setText('Score: ' + score);
    tokenText.setText('Tokens: ' + tokens.toFixed(1));
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
}
