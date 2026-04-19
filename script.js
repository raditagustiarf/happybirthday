const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });

const bgMusic = new Audio('audio/backsound.mp3');
bgMusic.loop = true; 
bgMusic.volume = 0.3;

const countdownSound = new Audio('audio/countdown.mp3');
countdownSound.volume = 1.0;

const fireworkSound = new Audio('audio/firework.mp3');
fireworkSound.loop = true; 
fireworkSound.volume = 0.8;

let width, height;
let particles = [];
let hearts3D = [];
let rainbowHearts = []; 
let rockets = []; 
let fireworks = []; 
let fireworkParticles = []; 
let phase = 'matrix'; 
let frameCount = 0;

let heartFormedFrame = 0; 
let instructionPhase = 0; 
let instructionTimer = 0;
let explosionTriggered = false;

const particleColors = ['#ff0a54', '#ff477e', '#ff7096', '#c9184a', '#a01a58', '#800f2f'];

function init() {
    resize();
    for(let i = 0; i < 60; i++) {
        hearts3D.push(new Heart3D());
    }
    drawBackground(); 
}

function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);

document.getElementById('start-btn').addEventListener('click', () => {
    const startScreen = document.getElementById('start-screen');
    startScreen.style.opacity = "0";
    setTimeout(() => { startScreen.style.display = "none"; }, 1000);

    bgMusic.play();
    animate();
});

class Heart3D {
    constructor() {
        this.reset(true);
        this.effectType = Math.floor(Math.random() * 3);
        this.pulseOffset = Math.random() * Math.PI * 2; 
    }
    reset(randomY = false) {
        this.x = Math.random() * width;
        this.y = randomY ? Math.random() * height : -50;
        this.z = Math.random() * 0.8 + 0.2; 
        this.speed = this.z * 1.5; 
        this.baseSize = this.z * 0.8; 
        this.baseColor = Math.random() > 0.5 ? '#800f2f' : '#a01a58'; 
    }
    update() {
        this.y += this.speed;
        if (this.y > height + 50) {
            if (phase === 'matrix' || phase === 'fade-matrix') this.reset();
        }
    }
    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        let currentSize = this.baseSize;
        let baseAlpha = phase === 'matrix' ? 0.7 : 0.1;
        let currentAlpha = this.z * baseAlpha; 
        let currentGlow = 15 * this.z;
        let currentColor = this.baseColor;

        if (this.effectType === 1) {
            let beat = Math.sin(frameCount * 0.06 + this.pulseOffset);
            currentSize = this.baseSize * (1 + beat * 0.15); 
        } else if (this.effectType === 2) {
            let shine = Math.sin(frameCount * 0.04 + this.pulseOffset);
            currentGlow = 5 * this.z + (Math.abs(shine) * 25 * this.z);
            currentAlpha = this.z * baseAlpha * (0.4 + Math.abs(shine) * 0.6);
            if (shine > 0.6) currentColor = '#ff477e';
        }
        if (currentAlpha > 1) currentAlpha = 1;
        if (currentAlpha < 0) currentAlpha = 0;

        ctx.scale(currentSize, currentSize);
        ctx.globalAlpha = currentAlpha; 
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(0, -3, -5, -15, -15, -15);
        ctx.bezierCurveTo(-25, -15, -25, -2.5, -25, -2.5);
        ctx.bezierCurveTo(-25, 9, -10, 15.5, 0, 25);
        ctx.bezierCurveTo(10, 15.5, 25, 9, 25, -2.5);
        ctx.bezierCurveTo(25, -2.5, 25, -15, 15, -15);
        ctx.bezierCurveTo(5, -15, 0, -3, 0, 0);
        ctx.fillStyle = currentColor;
        ctx.shadowBlur = currentGlow; 
        ctx.shadowColor = currentColor;
        ctx.fill();
        ctx.restore();
    }
}

class RainbowHeartTrail {
    constructor(x, y, hue) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 1.5 + 0.8; 
        this.alpha = 1;
        this.hue = hue;
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = (Math.random() - 0.5) * 2;
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.alpha -= 0.015; 
    }
    draw() {
        if (this.alpha <= 0) return;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.scale(this.size, this.size);
        ctx.globalAlpha = this.alpha;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(0, -3, -5, -15, -15, -15);
        ctx.bezierCurveTo(-25, -15, -25, -2.5, -25, -2.5);
        ctx.bezierCurveTo(-25, 9, -10, 15.5, 0, 25);
        ctx.bezierCurveTo(10, 15.5, 25, 9, 25, -2.5);
        ctx.bezierCurveTo(25, -2.5, 25, -15, 15, -15);
        ctx.bezierCurveTo(5, -15, 0, -3, 0, 0);
        let colorStr = `hsl(${this.hue}, 100%, 60%)`;
        ctx.fillStyle = colorStr;
        ctx.shadowBlur = 10;
        ctx.shadowColor = colorStr;
        ctx.fill();
        ctx.restore();
    }
}

class HeartRocket {
    constructor() {
        this.x = -50; 
        this.y = height; 
        this.vx = (width + 100) / 120; 
        this.vy = -(height * 0.028); 
        this.gravity = height * 0.0004; 
        this.hue = 0; 
        this.active = true;
    }
    update() {
        if (!this.active) return;
        this.x += this.vx;
        this.vy += this.gravity; 
        this.y += this.vy;
        this.hue += 4; 
        for(let i = 0; i < 4; i++) {
            let offsetX = (Math.random() - 0.5) * 20;
            let offsetY = (Math.random() - 0.5) * 20;
            rainbowHearts.push(new RainbowHeartTrail(this.x + offsetX, this.y + offsetY, this.hue));
        }
        if (this.y > height + 100 && this.vy > 0) this.active = false;
    }
}

class Firework {
    constructor() {
        this.x = Math.random() * (width * 0.8) + (width * 0.1); 
        this.y = height;
        this.targetY = height * 0.1 + Math.random() * (height * 0.4); 
        this.speed = Math.random() * 4 + 8;
        this.color = `hsl(${Math.random() * 360}, 100%, 60%)`; 
        this.active = true;
    }
    update() {
        if (!this.active) return;
        this.y -= this.speed;
        fireworkParticles.push(new FireworkParticle(this.x, this.y, this.color, true));
        if (this.y <= this.targetY) {
            this.active = false;
            this.explode();
        }
    }
    explode() {
        for (let i = 0; i < 80; i++) {
            fireworkParticles.push(new FireworkParticle(this.x, this.y, this.color, false));
        }
    }
}

class FireworkParticle {
    constructor(x, y, color, isTrail = false) {
        this.x = x;
        this.y = y;
        this.isTrail = isTrail;
        this.alpha = 1;
        this.color = color;
        if (isTrail) {
            this.vx = (Math.random() - 0.5) * 0.5;
            this.vy = Math.random() * 1;
            this.friction = 1;
            this.gravity = 0;
            this.decay = 0.05;
        } else {
            let angle = Math.random() * Math.PI * 2;
            let speed = Math.random() * 6 + 2;
            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed;
            this.friction = 0.95; 
            this.gravity = 0.15; 
            this.decay = Math.random() * 0.015 + 0.005;
            if (Math.random() > 0.8) this.color = `hsl(${Math.random() * 360}, 100%, 60%)`;
        }
    }
    update() {
        this.vx *= this.friction;
        this.vy *= this.friction;
        this.vy += this.gravity;
        this.x += this.vx;
        this.y += this.vy;
        this.alpha -= this.decay;
    }
    draw() {
        if (this.alpha <= 0) return;
        ctx.globalAlpha = this.alpha;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.isTrail ? 1.5 : 2.5, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = this.color;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
    }
}

class Particle {
    constructor(x, y) {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.targetX = x;
        this.targetY = y;
        this.nextTargetX = x;
        this.nextTargetY = y;
        this.color = particleColors[Math.floor(Math.random() * particleColors.length)];
        this.size = Math.random() * 2.5 + 2.0; 
        this.vx = 0;
        this.vy = 0;
        this.friction = 0.82; 
        this.ease = 0.04; 
        this.isSwipe = false;
        this.alpha = 1;
        this.activationFrame = 0;

        this.isExploding = false;
        this.decay = 0;
    }
    update() {
        if (this.isExploding) {
            this.vx *= this.friction;
            this.vy *= this.friction;
            this.x += this.vx;
            this.y += this.vy;
            this.alpha -= this.decay;
            if (this.alpha < 0) this.alpha = 0;
            return; 
        }

        if (frameCount >= this.activationFrame) {
            this.targetX = this.nextTargetX;
            this.targetY = this.nextTargetY;
            if (this.isSwipe && this.alpha < 1) this.alpha += 0.05;
        }
        let dx = this.targetX - this.x;
        let dy = this.targetY - this.y;
        this.vx += dx * this.ease;
        this.vy += dy * this.ease;
        this.vx *= this.friction;
        this.vy *= this.friction;
        this.x += this.vx;
        this.y += this.vy;
    }
    draw() {
        if (this.alpha <= 0) return; 
        ctx.globalAlpha = this.alpha;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 8; 
        ctx.shadowColor = this.color;
        ctx.fill();
        ctx.shadowBlur = 0; 
        ctx.globalAlpha = 1; 
    }
}

function createTextParticles(text, fontSizeStr, effectType = 'normal') {
    const offscreenCanvas = document.createElement('canvas');
    const offCtx = offscreenCanvas.getContext('2d', { willReadFrequently: true });
    offscreenCanvas.width = width;
    offscreenCanvas.height = height;

    offCtx.fillStyle = 'white';
    offCtx.font = `900 ${fontSizeStr} 'Segoe UI', Arial, sans-serif`;
    offCtx.textAlign = 'center';
    offCtx.textBaseline = 'middle';
    offCtx.letterSpacing = "6px"; 
    offCtx.fillText(text, width / 2, height / 2);

    const imageData = offCtx.getImageData(0, 0, width, height).data;
    const newTargets = [];
    const step = 5; 

    for (let y = 0; y < height; y += step) {
        for (let x = 0; x < width; x += step) {
            const index = (y * width + x) * 4;
            if (imageData[index + 3] > 128) newTargets.push({ x: x, y: y });
        }
    }

    let minX = width, maxX = 0;
    if (effectType === 'swipe') {
        newTargets.forEach(t => {
            if (t.x < minX) minX = t.x;
            if (t.x > maxX) maxX = t.x;
        });
    }

    newTargets.sort(() => Math.random() - 0.5);

    for (let i = 0; i < newTargets.length; i++) {
        let p;
        if (particles[i]) {
            p = particles[i];
            p.nextTargetX = newTargets[i].x;
            p.nextTargetY = newTargets[i].y;
            p.color = particleColors[Math.floor(Math.random() * particleColors.length)];
        } else {
            p = new Particle(newTargets[i].x, newTargets[i].y);
            particles.push(p);
        }

        if (effectType === 'swipe') {
            let normalizedX = (newTargets[i].x - minX) / (maxX - minX || 1);
            p.targetX = p.nextTargetX;
            p.targetY = p.nextTargetY;
            p.alpha = 0; 
            p.isSwipe = true;
            p.activationFrame = frameCount + (normalizedX * 100); 
            p.x = newTargets[i].x - 50; 
            p.y = newTargets[i].y + (Math.random() - 0.5) * 20; 
        } 
        else if (effectType === 'drone') {
            p.isSwipe = false;
            p.activationFrame = frameCount + (Math.random() * 15); 
        } 
        else {
            p.targetX = p.nextTargetX;
            p.targetY = p.nextTargetY;
            p.activationFrame = 0;
            p.isSwipe = false;
        }
    }
    if (newTargets.length < particles.length) particles.splice(newTargets.length);
}

function createGiantHeart() {
    const offscreenCanvas = document.createElement('canvas');
    const offCtx = offscreenCanvas.getContext('2d', { willReadFrequently: true });
    offscreenCanvas.width = width;
    offscreenCanvas.height = height;

    offCtx.fillStyle = 'white';
    offCtx.translate(width / 2, height / 2 - 30); 
    
   let scale = Math.min(width, height) / 100; 
    offCtx.scale(scale, scale);
    
    offCtx.beginPath();
    offCtx.moveTo(0, 0);
    offCtx.bezierCurveTo(0, -3, -5, -15, -15, -15);
    offCtx.bezierCurveTo(-25, -15, -25, -2.5, -25, -2.5);
    offCtx.bezierCurveTo(-25, 9, -10, 15.5, 0, 25);
    offCtx.bezierCurveTo(10, 15.5, 25, 9, 25, -2.5);
    offCtx.bezierCurveTo(25, -2.5, 25, -15, 15, -15);
    offCtx.bezierCurveTo(5, -15, 0, -3, 0, 0);
    offCtx.fill();

    const imageData = offCtx.getImageData(0, 0, width, height).data;
    const newTargets = [];
    const step = 10; 

    for (let y = 0; y < height; y += step) {
        for (let x = 0; x < width; x += step) {
            const index = (y * width + x) * 4;
            if (imageData[index + 3] > 128) newTargets.push({ x: x, y: y });
        }
    }

    newTargets.sort(() => Math.random() - 0.5);

    for (let i = 0; i < newTargets.length; i++) {
        if (particles[i]) {
            particles[i].nextTargetX = newTargets[i].x;
            particles[i].nextTargetY = newTargets[i].y;
            particles[i].activationFrame = frameCount + (Math.random() * 80); 
            particles[i].isSwipe = false;
        } else {
            let p = new Particle(newTargets[i].x, newTargets[i].y);
            p.nextTargetX = newTargets[i].x;
            p.nextTargetY = newTargets[i].y;
            p.activationFrame = frameCount + (Math.random() * 80);
            particles.push(p);
        }
    }

    if (newTargets.length < particles.length) {
        particles.splice(newTargets.length);
    }
}

function drawBackground() {
    ctx.fillStyle = 'rgba(5, 5, 5, 0.2)'; 
    ctx.fillRect(0, 0, width, height);
    for(let i = 0; i < hearts3D.length; i++) {
        hearts3D[i].update();
        hearts3D[i].draw();
    }
}

function drawInstructionText() {
    if (instructionPhase === 0 || explosionTriggered) return;

    ctx.save();
    let fontSize = Math.min(width / 18, 35);
    ctx.font = `800 ${fontSize}px 'Segoe UI', Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    let text = "tap loveenya jepanyaaa";
    let textWidth = ctx.measureText(text).width;
    let startX = (width / 2) - (textWidth / 2);
    
    let textY = (height / 2) + (Math.min(width, height) * 0.35); 
    
    if (instructionPhase === 1) {
        let progress = Math.min(instructionTimer / 45, 1); 
        ctx.beginPath();
        ctx.rect(startX - 20, 0, (textWidth + 40) * progress, height);
        ctx.clip(); 
        ctx.globalAlpha = 1;
    } else if (instructionPhase === 2) {
        let fadeOutProgress = Math.max(1 - (frameCount - heartFormedFrame - 400) / 20, 0);
        ctx.globalAlpha = fadeOutProgress;
    }

    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#ff477e';
    ctx.fillText(text, width / 2, textY); 
    ctx.restore();
}

function animate() {
    frameCount++;

    if (frameCount === 300) { 
        phase = 'fade-matrix'; 
        createTextParticles('3', '350px'); 
        countdownSound.currentTime = 0;
        countdownSound.play();
    }
    else if (frameCount === 400) { 
        createTextParticles('2', '350px'); 
        countdownSound.currentTime = 0;
        countdownSound.play();
    }
    else if (frameCount === 500) { 
        createTextParticles('1', '350px'); 
        countdownSound.currentTime = 0;
        countdownSound.play();
    }
    else if (frameCount === 620) { 
        phase = 'birthday'; 
        let finalFontSize = Math.min(width / 7, 120) + 'px';
        createTextParticles('Happy Birthday!', finalFontSize); 
    }
    else if (frameCount === 850) {
        phase = 'scramble';
        let nameFontSize = Math.min(width / 6, 140) + 'px';
        createTextParticles('Bocil Emellllll', nameFontSize, 'swipe'); 
    }
    else if (frameCount === 1100) {
        phase = 'sheera';
        let nameFontSize = Math.min(width / 6, 140) + 'px';
        createTextParticles('Sheera Zefanya', nameFontSize, 'drone');
    }
    else if (frameCount === 1250) {
        rockets.push(new HeartRocket());
    }
    else if (frameCount === 1400) {
        fireworkSound.play();
    }
    else if (frameCount === 1800) {
        phase = 'heart_finale';
        createGiantHeart();
        heartFormedFrame = frameCount; 
    }

    if (phase === 'heart_finale' && !explosionTriggered) {
        let framesSinceHeart = frameCount - heartFormedFrame;
        
        if (framesSinceHeart === 300) { 
            instructionPhase = 1; 
        }
        
        if (instructionPhase === 1) {
            instructionTimer++;
            if (instructionTimer > 90) { 
                instructionPhase = 2; 
            }
        }
    }

    if (frameCount > 1400) {
        if (frameCount % 45 === 0) {
            fireworks.push(new Firework());
        }
    }

    drawBackground(); 
    drawInstructionText(); 

    if (phase === 'sheera' || phase === 'scramble' || phase === 'heart_finale') {
        rockets.forEach(rocket => rocket.update());
        for (let i = rainbowHearts.length - 1; i >= 0; i--) {
            rainbowHearts[i].update();
            rainbowHearts[i].draw();
            if (rainbowHearts[i].alpha <= 0) rainbowHearts.splice(i, 1);
        }

        for (let i = fireworks.length - 1; i >= 0; i--) {
            fireworks[i].update();
            if (!fireworks[i].active) fireworks.splice(i, 1);
        }
        for (let i = fireworkParticles.length - 1; i >= 0; i--) {
            fireworkParticles[i].update();
            fireworkParticles[i].draw();
            if (fireworkParticles[i].alpha <= 0) fireworkParticles.splice(i, 1);
        }
    }

    if (phase !== 'matrix') {
        for (let i = 0; i < particles.length; i++) {
            particles[i].update();
            particles[i].draw();
        }
    }

    requestAnimationFrame(animate);
}

init();

canvas.addEventListener('pointerdown', () => {
    if (phase === 'heart_finale' && !explosionTriggered && frameCount > heartFormedFrame + 300) {
        explosionTriggered = true;
        
        for (let i = 0; i < particles.length; i++) {
            let p = particles[i];
            let angle = Math.random() * Math.PI * 2;
            let speed = Math.random() * 15 + 5; 
            
            p.vx = Math.cos(angle) * speed;
            p.vy = Math.sin(angle) * speed;
            p.friction = 0.94; 
            p.decay = Math.random() * 0.02 + 0.01; 
            p.isExploding = true;
        }

        setTimeout(() => {
            canvas.style.transition = "opacity 2s ease";
            canvas.style.opacity = "0.3"; 
            
            fireworkSound.pause();
            
            document.getElementById('book-wrapper').classList.add('visible');
        }, 2000); 
    }
});