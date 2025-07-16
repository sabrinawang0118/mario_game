// A scene that runs once to handle asset loading
class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        // Create a 1x1 white pixel texture for solid shapes
        this.textures.generate('pixel', { data: ['1'], pixelWidth: 1 });
        
        // Create a simple circle texture for particles
        this.textures.generate('particle', {
            data: [
                '..11..',
                '.1111.',
                '111111',
                '111111',
                '.1111.',
                '..11..'
            ],
            pixelWidth: 4
        });
        
        // --- NEW: Create an 8-bit coin texture ---
        this.textures.generate('coin', {
            data: [
                '..11..',
                '.1221.',
                '122221',
                '122221',
                '.1221.',
                '..11..'
            ],
            palette: {
                1: '#a58e48', // Darker gold for outline
                2: '#f6d86b'  // Bright gold for body
            },
            pixelWidth: 4
        });

        // --- NEW: Create an 8-bit hill texture ---
        this.textures.generate('hill', {
            data: [
                '..........1.........',
                '.........111........',
                '........11111.......',
                '.......1111111......',
                '......111111111.....',
                '.....11111111111....',
                '....1111111111111...',
                '...11111111111111..',
                '..1111111111111111.',
                '.111111111111111111',
                '11111111111111111111'
            ],
            pixelWidth: 16 // The width of each 'pixel' in the data array
        });

        // --- NEW: Create a more human-like 8-bit player sprite with hair and skin ---
        this.textures.generate('playerSprite', {
            data: [
                '...6666...', // hair
                '..655556..', // hair/face
                '.65555556.', // hair/face
                '.65555556.', // face
                '..233332..', // neck/shoulders
                '.23333332.', // arms
                '233222233.', // arms/body
                '.3322233..', // body
                '..32223...', // legs
                '.322..23..', // legs/feet
            ],
            palette: {
                2: '#1976d2', // Blue shirt/body
                3: '#795548', // Brown pants/legs
                5: '#ffdbac', // Flesh skin tone (face, hands)
                6: '#222222'  // Dark hair
            },
            pixelWidth: 4
        });

        // --- NEW: Create an 8-bit enemy sprite ---
        this.textures.generate('enemySprite', {
            data: [
                '...4444...',
                '..433334..',
                '.43333334.',
                '.43344334.',
                '.44444444.',
                '..444444..',
                '..434434..',
                '.43344334.',
                '4334..4334',
                '4......44.'
            ],
            palette: {
                3: '#800080', // Purple body
                4: '#000000'  // Black outline/feet
            },
            pixelWidth: 4
        });
    }

    create() {
        this.scene.start('GameScene');
    }
}


class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        this.player = null;
        this.platforms = null;
        this.cursors = null;
        this.coins = null; // Changed from 'stars'
        this.score = 0;
        this.scoreText = null;
        this.enemies = null;
        this.lives = 3;
        this.livesText = null;
        this.jumpCount = 0;
        this.projectiles = null;
        this.fireKey = null;
        this.lastFired = 0;
        this.playerDirection = 'right';
    }

    // Preload is no longer needed here as it's handled by BootScene

    create() {
        // --- WORLD SETUP ---
        this.physics.world.setBounds(0, 0, 3200, 600);

        // --- BACKGROUND ELEMENTS ---
        // Palette is now only shades of brown for a consistent look
        const hillColors = [0x8B4513, 0xA0522D, 0xCD853F]; 

        // Hills are now colored from the brown-only palette
        this.add.image(400, 450, 'hill').setTint(Phaser.Math.RND.pick(hillColors)).setScrollFactor(0.5).setDepth(-1);
        this.add.image(1200, 480, 'hill').setScale(1.2, 1.1).setTint(Phaser.Math.RND.pick(hillColors)).setScrollFactor(0.5).setDepth(-1);
        this.add.image(2100, 460, 'hill').setScale(0.9, 1.0).setTint(Phaser.Math.RND.pick(hillColors)).setScrollFactor(0.5).setDepth(-1);
        this.add.image(2900, 500, 'hill').setScale(0.8, 0.8).setTint(Phaser.Math.RND.pick(hillColors)).setScrollFactor(0.5).setDepth(-1);
        
        // Clouds (move at 20% of the camera speed)
        this.add.image(300, 150, 'pixel').setScale(150, 50).setTint(0xffffff).setScrollFactor(0.2).setDepth(-1);
        this.add.image(800, 100, 'pixel').setScale(200, 60).setTint(0xffffff).setScrollFactor(0.2).setDepth(-1);
        this.add.image(1500, 180, 'pixel').setScale(180, 55).setTint(0xffffff).setScrollFactor(0.2).setDepth(-1);
        this.add.image(2200, 120, 'pixel').setScale(220, 65).setTint(0xffffff).setScrollFactor(0.2).setDepth(-1);
        this.add.image(2800, 160, 'pixel').setScale(160, 50).setTint(0xffffff).setScrollFactor(0.2).setDepth(-1);


        // --- PLATFORM CREATION ---
        this.platforms = this.physics.add.staticGroup();
        // Ground platform is now much wider
        this.platforms.create(1600, 568, 'pixel').setScale(3200, 64).setTint(0x008000).refreshBody();
        // Existing platforms
        this.platforms.create(600, 400, 'pixel').setScale(200, 32).setTint(0x008000).refreshBody();
        this.platforms.create(50, 250, 'pixel').setScale(200, 32).setTint(0x008000).refreshBody();
        this.platforms.create(750, 220, 'pixel').setScale(200, 32).setTint(0x008000).refreshBody();
        this.platforms.create(1100, 350, 'pixel').setScale(150, 32).setTint(0x008000).refreshBody();
        this.platforms.create(1400, 250, 'pixel').setScale(150, 32).setTint(0x008000).refreshBody();
        // New platforms for the extended level
        this.platforms.create(1800, 400, 'pixel').setScale(200, 32).setTint(0x008000).refreshBody();
        this.platforms.create(2100, 300, 'pixel').setScale(200, 32).setTint(0x008000).refreshBody();
        this.platforms.create(2500, 200, 'pixel').setScale(200, 32).setTint(0x008000).refreshBody();


        // --- PLAYER CREATION (use sprite) ---
        this.player = this.physics.add.sprite(100, 450, 'playerSprite');
        this.player.setBounce(0); // Remove bounciness for a more solid feel
        this.player.setCollideWorldBounds(true);
        this.player.displayWidth = 40;
        this.player.displayHeight = 40;

        // --- CAMERA SETUP ---
        this.cameras.main.setBounds(0, 0, 3200, 600);
        this.cameras.main.startFollow(this.player, true, 0.05, 0.05);

        // --- COIN CREATION (Using the new sprite) ---
        this.coins = this.physics.add.group({
            key: 'coin', // Use the new 'coin' texture
            repeat: 20,
            setXY: { x: 150, y: 0, stepX: 140 }
        });

        this.coins.children.iterate((child) => {
            child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
            // We no longer need setTint or displayWidth/Height as the texture is pre-styled
        });

        // --- ENEMY CREATION (use sprite) ---
        this.enemies = this.physics.add.group();
        const enemy1 = this.enemies.create(650, 350, 'enemySprite');
        const enemy2 = this.enemies.create(1850, 350, 'enemySprite'); // Add a second enemy
        this.setupEnemy(enemy1);
        this.setupEnemy(enemy2);
        

        // --- UI DISPLAY ---
        this.scoreText = this.add.text(16, 16, `Score: ${this.score}`, { fontSize: '32px', fill: '#000' });
        this.scoreText.setScrollFactor(0);
        
        this.livesText = this.add.text(16, 50, `Lives: ${this.lives}`, { fontSize: '32px', fill: '#000' });
        this.livesText.setScrollFactor(0);

        // --- COLLISION SETUP ---
        this.physics.add.collider(this.player, this.platforms);
        this.physics.add.collider(this.coins, this.platforms);
        this.physics.add.collider(this.enemies, this.platforms);
        this.physics.add.overlap(this.player, this.coins, this.collectCoin, null, this); // Changed from 'stars' and 'collectStar'
        this.physics.add.collider(this.player, this.enemies, this.hitEnemy, null, this);
        
        // Add colliders for projectiles
        this.projectiles = this.physics.add.group({
            defaultKey: 'pixel',
            maxSize: 20
        });
        this.physics.add.collider(this.projectiles, this.platforms, this.projectileHitPlatform, null, this);
        this.physics.add.collider(this.projectiles, this.enemies, this.projectileHitEnemy, null, this);

        // --- INPUT SETUP ---
        this.cursors = this.input.keyboard.createCursorKeys();
        this.fireKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    }
    
    // Helper function to set up enemy properties
    setupEnemy(enemy) {
        enemy.setTint(0x800080); // Purple
        enemy.displayWidth = 32;
        enemy.displayHeight = 32;
        enemy.setBounce(1, 0.2);
        enemy.setCollideWorldBounds(true);
        enemy.setVelocityX(Phaser.Math.RND.pick([-100, 100])); // Start in a random direction
    }


    collectCoin(player, coin) { // Renamed from collectStar
        coin.disableBody(true, true);
        this.score += 10;
        this.scoreText.setText('Score: ' + this.score);

        // Check if all coins have been collected
        if (this.coins.countActive(true) === 0) {
            this.physics.pause();
            this.add.text(400, 300, 'You Win!', { fontSize: '64px', fill: '#00ff00', stroke: '#000', strokeThickness: 4 })
                .setOrigin(0.5)
                .setScrollFactor(0);
            this.time.delayedCall(3000, () => {
                this.scene.restart({});
            });
        }
    }

    hitEnemy(player, enemy) {
        // First, check if the player has already been defeated in this interaction
        if (!player.active) {
            return;
        }

        if (player.body.touching.down && enemy.body.touching.up) {
            // --- Stomp Success ---
            const particles = this.add.particles(enemy.x, enemy.y, 'particle', {
                speed: 100,
                scale: { start: 1, end: 0 },
                blendMode: 'ADD',
                lifespan: 300
            });
            particles.explode(16);

            enemy.disableBody(true, true);
            this.score += 50;
            this.scoreText.setText('Score: ' + this.score);
            player.setVelocityY(-200);
        } else {
            // --- Player Gets Hurt ---
            
            // Immediately deactivate the player to prevent multiple hits
            player.setActive(false);

            this.lives--;
            this.livesText.setText('Lives: ' + this.lives);
            this.physics.pause(); // Pause physics for the "death" sequence
            
            // 1. Tint the player gray
            player.setTint(0x555555);
            
            // 2. Apply knockback effect
            player.setVelocity(100, -200); // Knock up and away
            player.setCollideWorldBounds(false); // Allow player to fall off-screen

            // 3. Shake the camera
            this.cameras.main.shake(500, 0.01);

            // 4. Fade out the player over 1 second
            this.tweens.add({
                targets: player,
                alpha: 0,
                duration: 1000,
                ease: 'Power2'
            });


            if (this.lives > 0) {
                // Restart the level after a longer delay to let the animation play out
                this.time.delayedCall(1500, () => {
                    this.scene.restart({ score: this.score, lives: this.lives });
                });
            } else {
                // No lives left - Game Over
                this.livesText.setText('Lives: 0');
                this.add.text(400, 300, 'Game Over', { fontSize: '64px', fill: '#ff0000', stroke: '#000', strokeThickness: 4 })
                    .setOrigin(0.5)
                    .setScrollFactor(0);
                
                this.time.delayedCall(3000, () => {
                    this.scene.restart({});
                });
            }
        }
    }
    
    init(data) {
        // This function now correctly handles both a fresh start and continuing.
        this.lives = data.lives || 3;
        this.score = data.score || 0;
    }

    fireProjectile() {
        // Get a projectile from the group
        const projectile = this.projectiles.get(this.player.x, this.player.y);

        if (projectile) {
            projectile.setActive(true);
            projectile.setVisible(true);
            projectile.setTint(0x0000ff); // Blue
            projectile.displayHeight = 10;
            projectile.displayWidth = 10;
            projectile.body.setAllowGravity(false);
            
            const projectileSpeed = 400;
            const velocity = (this.playerDirection === 'left') ? -projectileSpeed : projectileSpeed;
            projectile.setVelocityX(velocity);
        }
    }

    projectileHitPlatform(projectile, platform) {
        projectile.setActive(false);
        projectile.setVisible(false);
    }

    projectileHitEnemy(projectile, enemy) {
        projectile.setActive(false);
        projectile.setVisible(false);
        enemy.disableBody(true, true);
        this.score += 25; // Award points for shooting an enemy
        this.scoreText.setText('Score: ' + this.score);
    }

    update(time) { // The 'time' parameter is provided by Phaser
        if (!this.player.active || !this.cursors) { return; }

        // --- PLAYER MOVEMENT WITH SPRINT ---
        const baseSpeed = 160;
        const sprintSpeed = 280;
        const isSprinting = this.cursors.shift.isDown;
        let currentSpeed = isSprinting ? sprintSpeed : baseSpeed;

        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-currentSpeed);
            this.playerDirection = 'left';
        } else if (this.cursors.right.isDown) {
            this.player.setVelocityX(currentSpeed);
            this.playerDirection = 'right';
        } else {
            this.player.setVelocityX(0);
        }

        // --- PLAYER JUMPING LOGIC ---
        if (this.player.body.touching.down) {
            this.jumpCount = 2;
        }
        if (Phaser.Input.Keyboard.JustDown(this.cursors.space)) {
            if (this.jumpCount > 0) {
                this.player.setVelocityY(-500);
                this.jumpCount--;
            }
        }
        
        // --- PLAYER SHOOTING LOGIC ---
        if (Phaser.Input.Keyboard.JustDown(this.fireKey) && time > this.lastFired) {
            this.fireProjectile();
            this.lastFired = time + 250; // 250ms cooldown
        }

        // --- ENEMY PATROL LOGIC ---
        this.enemies.children.iterate((enemy) => {
            if (!enemy.active) return; // Skip disabled enemies
            if (enemy.body.velocity.x === 0) {
                enemy.setVelocityX(100);
            } else if (enemy.body.blocked.right) {
                enemy.setVelocityX(-100);
            } else if (enemy.body.blocked.left) {
                enemy.setVelocityX(100);
            }
        });
        
        // --- PROJECTILE LIFECYCLE ---
        this.projectiles.children.each((p) => {
            if (p.active && (p.x < 0 || p.x > this.physics.world.bounds.width)) {
                p.setActive(false);
                p.setVisible(false);
            }
        });
    }
}

// Phaser Game Configuration
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: '#87CEEB',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 800 }, // Increased gravity for a less floaty feel
            debug: false
        }
    },
    scene: [BootScene, GameScene]
};

const game = new Phaser.Game(config); 
