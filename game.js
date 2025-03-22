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
            gravity: { y: 300 },
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

let rocket, slingshot, stations, stars, score = 0, tokens = 0, isDragging = false;

function preload() {
    this.load.image('rocket', 'https://via.placeholder.com/60x30.png?text=Rocket'); // موشک ایلان
    this.load.image('station', 'https://via.placeholder.com/40x40.png?text=Station'); // ایستگاه
    this.load.image('star', 'https://via.placeholder.com/10x10.png?text=Star'); // ستاره
}

function create() {
    // پس‌زمینه کهکشانی
    this.add.rectangle(400, 300, 800, 600, 0x000033); // آبی تیره
    stars = this.add.group();
    for (let i = 0; i < 50; i++) {
        let star = stars.create(Phaser.Math.Between(0, 800), Phaser.Math.Between(0, 600), 'star');
        star.setScale(0.5).setAlpha(Phaser.Math.FloatBetween(0.3, 1));
    }

    // تلگرام Web App
    window.Telegram.WebApp.ready();
    const user = window.Telegram.WebApp.initDataUnsafe.user || { id: 'test_user' };
    this.add.text(16, 40, `Rescue Elon, ${user.id}!`, { fontSize: '16px', fill: '#fff' });

    // تیرکمون
    slingshot = { x: 150, y: 500 };
    rocket = this.physics.add.sprite(slingshot.x, slingshot.y, 'rocket')
        .setScale(0.5)
        .setCollideWorldBounds(true)
        .setBounce(0.3);

    // ایستگاه‌های فضایی
    stations = this.physics.add.group();
    stations.create(600, 550, 'station');
    stations.create(650, 500, 'station');

    // برخورد‌ها
    this.physics.add.collider(rocket, stations, hitStation, null, this);

    // متن‌ها
    this.scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '20px', fill: '#fff' });
    this.tokenText = this.add.text(16, 60, 'Tokens: 0', { fontSize: '20px', fill: '#fff' });

    // کنترل‌ها
    this.input.on('pointerdown', startDrag, this);
    this.input.on('pointermove', dragRocket, this);
    this.input.on('pointerup', launchRocket, this);

    // پیام طنز گروک
    this.add.text(150, 450, 'Grok says: Save Elon for Mars!', { fontSize: '16px', fill: '#fff' });
}

function startDrag(pointer) {
    if (!rocket.body.enable) return;
    isDragging = true;
}

function dragRocket(pointer) {
    if (isDragging) {
        rocket.x = Math.min(Math.max(pointer.x, slingshot.x - 50), slingshot.x + 50);
        rocket.y = Math.min(Math.max(pointer.y, slingshot.y - 50), slingshot.y + 50);
    }
}

function launchRocket() {
    if (isDragging) {
        isDragging = false;
        const dx = slingshot.x - rocket.x;
        const dy = slingshot.y - rocket.y;
        rocket.setVelocity(dx * 12, dy * 12); // پرتاب قوی‌تر
        rocket.body.enable = true;

        // دود موشک (انیمیشن ساده)
        for (let i = 0; i < 5; i++) {
            let smoke = this.add.circle(rocket.x, rocket.y, 5, 0xaaaaaa);
            this.tweens.add({
                targets: smoke,
                scale: 0,
                alpha: 0,
                duration: 500,
                delay: i * 50
            });
        }
    }
}

function hitStation(rocket, station) {
    station.destroy();
    score += 20;
    tokens += 0.2;
    this.scoreText.setText('Score: ' + score);
    this.tokenText.setText('Tokens: ' + tokens.toFixed(1));

    // انفجار ایستگاه
    for (let i = 0; i < 10; i++) {
        let spark = this.add.circle(station.x, station.y, 3, 0xff0000);
        this.tweens.add({
            targets: spark,
            x: spark.x + Phaser.Math.Between(-20, 20),
            y: spark.y + Phaser.Math.Between(-20, 20),
            scale: 0,
            alpha: 0,
            duration: 300
        });
    }

    checkWin();
}

function checkWin() {
    if (stations.countActive() === 0) {
        this.add.text(400, 300, `Elon’s Safe! Earned ${tokens.toFixed(1)} Grok-o-Gram`, { fontSize: '32px', fill: '#fff' }).setOrigin(0.5);
        window.Telegram.WebApp.sendData(JSON.stringify({ score: score, tokens: tokens }));
        setTimeout(() => window.Telegram.WebApp.close(), 2000);
    }
}

function update() {
    if (rocket.body.enable && (rocket.y > 600 || rocket.x > 800 || rocket.x < 0)) {
        resetRocket();
    }
    // چشمک زدن ستاره‌ها
    stars.getChildren().forEach(star => {
        star.setAlpha(Phaser.Math.FloatBetween(0.3, 1));
    });
}

function resetRocket() {
    rocket.setPosition(slingshot.x, slingshot.y);
    rocket.setVelocity(0, 0);
    rocket.body.enable = true;
}
