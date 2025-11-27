// Flappy Bird Clone with Assets
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const WIDTH = 400;
const HEIGHT = 600;
canvas.width = WIDTH;
canvas.height = HEIGHT;

// Load Assets
const sprites = {
    bg: new Image(),
    base: new Image(),
    bird: [new Image(), new Image(), new Image()], // up, mid, down (yellow)
    blueBird: [new Image(), new Image(), new Image()], // up, mid, down (blue)
    pipeGreen: new Image(),
    pipeRed: new Image(),
    gameOver: new Image()
};

let assetsLoaded = 0;
const totalAssets = 11; // bg, base, 3 yellow birds, 3 blue birds, 2 pipes, gameover

function onAssetLoad() {
    assetsLoaded++;
    if (assetsLoaded === totalAssets) {
        loop();
    }
}

// Load Sounds
const sounds = {
    wing: new Audio('flappy-bird-assets-1.1.0/audio/wing.wav'),
    point: new Audio('flappy-bird-assets-1.1.0/audio/point.wav'),
    hit: new Audio('flappy-bird-assets-1.1.0/audio/hit.wav'),
    swoosh: new Audio('flappy-bird-assets-1.1.0/audio/swoosh.wav'),
    die: new Audio('flappy-bird-assets-1.1.0/audio/die.wav')
};

sprites.bg.src = 'flappy-bird-assets-1.1.0/sprites/background-day.png';
sprites.bg.onload = onAssetLoad;

sprites.base.src = 'flappy-bird-assets-1.1.0/sprites/base.png';
sprites.base.onload = onAssetLoad;

// Yellow Bird
sprites.bird[0].src = 'flappy-bird-assets-1.1.0/sprites/yellowbird-upflap.png';
sprites.bird[0].onload = onAssetLoad;
sprites.bird[1].src = 'flappy-bird-assets-1.1.0/sprites/yellowbird-midflap.png';
sprites.bird[1].onload = onAssetLoad;
sprites.bird[2].src = 'flappy-bird-assets-1.1.0/sprites/yellowbird-downflap.png';
sprites.bird[2].onload = onAssetLoad;

// Blue Bird
sprites.blueBird[0].src = 'flappy-bird-assets-1.1.0/sprites/bluebird-upflap.png';
sprites.blueBird[0].onload = onAssetLoad;
sprites.blueBird[1].src = 'flappy-bird-assets-1.1.0/sprites/bluebird-midflap.png';
sprites.blueBird[1].onload = onAssetLoad;
sprites.blueBird[2].src = 'flappy-bird-assets-1.1.0/sprites/bluebird-downflap.png';
sprites.blueBird[2].onload = onAssetLoad;

sprites.pipeGreen.src = 'flappy-bird-assets-1.1.0/sprites/pipe-green.png';
sprites.pipeGreen.onload = onAssetLoad;

sprites.pipeRed.src = 'flappy-bird-assets-1.1.0/sprites/pipe-red.png';
sprites.pipeRed.onload = onAssetLoad;

sprites.gameOver.src = 'flappy-bird-assets-1.1.0/sprites/gameover.png';
sprites.gameOver.onload = onAssetLoad;

// Game state
let bird = { x: 50, y: HEIGHT / 2, width: 34, height: 24, velocity: 0, rotation: 0 };
let pipes = [];
let frame = 0;
let score = 0;
let highScore = 0;
let gameOver = false;
let groundX = 0;

// Draw functions
function drawBird() {
    let currentBirdSprites = sprites.bird;
    let birdImg = currentBirdSprites[1]; // default midflap

    if (bird.velocity < 0) {
        // Flapping animation when going up
        const flapIndex = Math.floor(frame / 5) % 3;
        birdImg = currentBirdSprites[flapIndex];
        bird.rotation = -25 * Math.PI / 180;
    } else {
        // Falling - static midflap
        birdImg = currentBirdSprites[1];
        bird.rotation += 2 * Math.PI / 180;
        if (bird.rotation > 90 * Math.PI / 180) bird.rotation = 90 * Math.PI / 180;
    }

    ctx.save();
    ctx.translate(bird.x + bird.width / 2, bird.y + bird.height / 2);
    ctx.rotate(bird.rotation);
    ctx.drawImage(birdImg, -bird.width / 2, -bird.height / 2, bird.width, bird.height);
    ctx.restore();
}

function drawPipe(p) {
    let pipeImg = sprites.pipeGreen;

    // Top pipe (flipped)
    ctx.save();
    ctx.translate(p.x, p.top);
    ctx.scale(1, -1);
    ctx.drawImage(pipeImg, 0, 0, p.width, 320); // 320 is arbitrary long height to ensure it covers
    ctx.restore();

    // Bottom pipe
    ctx.drawImage(pipeImg, p.x, p.bottom, p.width, 320);
}

function drawBackground() {
    ctx.drawImage(sprites.bg, 0, 0, WIDTH, HEIGHT);
}

function drawGround() {
    ctx.drawImage(sprites.base, groundX, HEIGHT - 112, WIDTH + 20, 112); // Ground height approx 112
    ctx.drawImage(sprites.base, groundX + WIDTH, HEIGHT - 112, WIDTH + 20, 112);

    if (!gameOver) {
        groundX -= 2;
        if (groundX <= -WIDTH) groundX = 0;
    }
}

function update() {
    if (gameOver) return;

    // Bird physics
    bird.velocity += 0.15;
    bird.y += bird.velocity;

    // Pipe generation
    if (frame % 120 === 0) {
        const gap = 100;
        const pipeHeight = 320; // max pipe height
        const minPipe = 50;
        // Calculate random position
        // Available space for pipes = HEIGHT - groundHeight (112)
        // We want the gap to be reachable.
        const groundY = HEIGHT - 112;

        // Minimum top pipe height (so pipe zyada upar na jaye)
        const minTopPipe = 120;

        // Minimum bottom pipe height (so bottom bahut low na ho)
        const minBottomPipe = 120;

        // Maximum top pipe height => jitna zyada ho sake, bina rules tode
        const maxTopPipe = groundY - minBottomPipe - gap;

        // Random top pipe with safe constraints
        const topY = Math.floor(Math.random() * (maxTopPipe - minTopPipe + 1)) + minTopPipe;

        pipes.push({
            x: WIDTH,
            width: 52,
            top: topY,
            bottom: topY + gap,
            passed: false
        });
    }

    // Move pipes
    pipes.forEach(p => p.x -= 2);
    pipes = pipes.filter(p => p.x + p.width > 0);

    // Collision
    const groundY = HEIGHT - 112;
    // Ground collision
    if (bird.y + bird.height >= groundY) {
        bird.y = groundY - bird.height;
        gameOver = true;
        sounds.hit.play();
        setTimeout(() => sounds.die.play(), 200);
    }

    // Pipe collision
    // Simple AABB
    // Bird hitbox slightly smaller than sprite for fairness
    const bx = bird.x + 2;
    const by = bird.y + 2;
    const bw = bird.width - 4;
    const bh = bird.height - 4;

    for (const p of pipes) {
        // Top pipe rect: x: p.x, y: p.top - 320, w: p.width, h: 320
        // But logic is simpler: check if bird is within x range, then check y
        if (bx + bw > p.x && bx < p.x + p.width) {
            // Inside pipe horizontal area
            if (by < p.top || by + bh > p.bottom) {
                gameOver = true;
                sounds.hit.play();
                setTimeout(() => sounds.die.play(), 200); // slight delay for effect
            }
        }
    }

    // Score
    pipes.forEach(p => {
        if (!p.passed && p.x + p.width < bird.x) {
            p.passed = true;
            score++;
            sounds.point.play();
        }
    });

    frame++;
}

function render() {
    drawBackground();
    pipes.forEach(drawPipe);
    drawGround();
    drawBird();

    // Score Display
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.font = '900 28px "Arial Black", sans-serif';
    ctx.textAlign = 'left';

    // Draw Score
    ctx.fillText('Score: ' + score, 10, 30);
    ctx.strokeText('Score: ' + score, 10, 30);

    // Draw High Score
    ctx.fillText('Best: ' + highScore, 10, 60);
    ctx.strokeText('Best: ' + highScore, 10, 60);

    if (gameOver) {
        const goW = 192;
        const goH = 42;
        ctx.drawImage(sprites.gameOver, WIDTH / 2 - goW / 2, HEIGHT / 2 - goH / 2);
    }
}

function loop() {
    update();
    render();
    if (!gameOver || bird.y < HEIGHT - 112 - bird.height) {
        // Continue loop even if gameover to show bird falling to ground?
        // If gameover, we stop update but maybe want bird to fall?
        // For now, if gameover, we stop loop in previous logic.
        // Let's keep it simple: stop loop if gameover?
        // Actually standard flappy bird: bird falls to ground then stops.
        if (gameOver) {
            // Fall to ground
            if (bird.y < HEIGHT - 112 - bird.height) {
                bird.velocity += 0.5;
                bird.y += bird.velocity;
                bird.rotation += 5 * Math.PI / 180;
                render(); // re-render to show fall
                requestAnimationFrame(loop);
                return;
            }
        } else {
            requestAnimationFrame(loop);
        }
    }
}

function flap() {
    if (!gameOver) {
        bird.velocity = -4;
        bird.rotation = -25 * Math.PI / 180;
        sounds.wing.currentTime = 0;
        sounds.wing.play();
    } else {
        // Restart only if bird hit ground
        if (bird.y >= HEIGHT - 112 - bird.height - 5) {
            resetGame();
            sounds.swoosh.play();
        }
    }
}

function resetGame() {
    if (score > highScore) {
        highScore = score;
    }
    bird = { x: 50, y: HEIGHT / 2, width: 34, height: 24, velocity: 0, rotation: 0 };
    pipes = [];
    frame = 0;
    score = 0;
    gameOver = false;
    loop();
}

document.addEventListener('keydown', e => { if (e.code === 'Space') flap(); });
document.addEventListener('click', flap);
