const canvas = document.getElementById('canvas1');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let particlesArray = [];
const textInput = document.getElementById('textInput');
const createBtn = document.getElementById('createBtn');
const voiceBtn = document.getElementById('voiceBtn');
const resetBtn = document.getElementById('resetBtn');

// Settings controls
const ballColorPicker = document.getElementById('ballColor');
const textColorPicker = document.getElementById('textColor');
const fontStyleSelect = document.getElementById('fontStyle');
const trailEffectCheckbox = document.getElementById('trailEffect');
const continuousVoiceCheckbox = document.getElementById('continuousVoice');

// Settings values
let ballColor = '#6450c8';
let textColor = '#788cff';
let fontStyle = 'Verdana';
let trailEffect = false;
let continuousVoiceMode = false;
let recognition = null;
let rotationAngle = 0; // Global rotation angle for ball formation

// Settings event listeners
ballColorPicker.addEventListener('change', (e) => {
    ballColor = e.target.value;
    resetToBall();
});

textColorPicker.addEventListener('change', (e) => {
    textColor = e.target.value;
    if (textInput.value.trim()) {
        animateParticlesToText();
    }
});

fontStyleSelect.addEventListener('change', (e) => {
    fontStyle = e.target.value;
    if (textInput.value.trim()) {
        animateParticlesToText();
    }
});

trailEffectCheckbox.addEventListener('change', (e) => {
    trailEffect = e.target.checked;
});

continuousVoiceCheckbox.addEventListener('change', (e) => {
    continuousVoiceMode = e.target.checked;
    if (recognition) {
        recognition.continuous = continuousVoiceMode;
    }
});

// Speech Recognition Setup
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (!SpeechRecognition) {
    voiceBtn.disabled = true;
    voiceBtn.style.opacity = '0.5';
    voiceBtn.style.cursor = 'not-allowed';
} else {
    recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = continuousVoiceMode;

    let listening = false;
    let resultIndex = 0;

    recognition.addEventListener('start', () => {
        listening = true;
        voiceBtn.textContent = 'ðŸŽ¤ Listening...';
        voiceBtn.style.background = 'linear-gradient(135deg, #00bfa5 0%, #1de9b6 100%)';
    });

    recognition.addEventListener('end', () => {
        listening = false;
        voiceBtn.textContent = 'Speak';
        voiceBtn.style.background = 'linear-gradient(135deg, #4d9fff 0%, #2575fc 100%)';
        resultIndex = 0;
    });

    recognition.addEventListener('result', (event) => {
        // In continuous mode, process each new result
        for (let i = resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i]?.[0]?.transcript?.trim();
            if (!transcript) continue;

            const spokenWord = transcript.split(/\s+/)[0];
            textInput.value = spokenWord;
            animateParticlesToText();
            resultIndex = i + 1;
        }
    });

    recognition.addEventListener('error', (event) => {
        console.error('Speech recognition error:', event.error);
        voiceBtn.textContent = 'Speak';
        voiceBtn.style.background = 'linear-gradient(135deg, #4d9fff 0%, #2575fc 100%)';
    });

    voiceBtn.addEventListener('click', () => {
        if (listening) {
            recognition.stop();
        } else {
            try {
                recognition.start();
            } catch (error) {
                console.warn('Recognition start failed:', error);
            }
        }
    });
}

// Handle window resize
window.addEventListener('resize', function() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

// Particle Class
class Particle {
    constructor(x, y) {
        this.size = 1.8; // Smaller particles for better distinctness
        this.color = 'rgba(255, 255, 255, 0.8)';
        
        // Store initial angle and radius for rotation
        this.baseAngle = Math.random() * Math.PI * 2;
        this.baseRadius = Math.sqrt(Math.random()) * 150;
        this.isInBallMode = true;
        
        // Define the random position in the ball formation
        this.setBallTarget();
        
        // Initialize position at the ball target
        this.x = this.targetX;
        this.y = this.targetY;
        
        // Physics properties
        this.vx = 0;
        this.vy = 0;
        this.ease = 0.05; // Slower ease for smoother movement
        this.friction = 0.9; // Friction for physics feel
    }

    setBallTarget() {
        const radius = 150; // Larger radius for more spread out particles
        
        // Calculate position using stored angle and rotation
        const currentAngle = this.baseAngle + rotationAngle;
        
        this.targetX = canvas.width / 2 + Math.cos(currentAngle) * this.baseRadius;
        this.targetY = canvas.height / 2 + Math.sin(currentAngle) * this.baseRadius;
        
        // Convert hex to rgba with alpha
        const hexToRgba = (hex, alpha) => {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        };
        
        this.color = hexToRgba(ballColor, 0.9);
        this.size = 1.8; // Smaller distinct particle size
        this.isInBallMode = true;
    }

    update() {
        // If in ball mode, update target position for rotation
        if (this.isInBallMode) {
            const currentAngle = this.baseAngle + rotationAngle;
            this.targetX = canvas.width / 2 + Math.cos(currentAngle) * this.baseRadius;
            this.targetY = canvas.height / 2 + Math.sin(currentAngle) * this.baseRadius;
        }
        
        // Simple easing logic to move towards targetX, targetY
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        
        this.x += dx * this.ease;
        this.y += dy * this.ease;
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
    }
}

// Initialize the ball of particles
function init() {
    particlesArray = [];
    const numberOfParticles = 4000; // Lower count for more spacing between particles
    for (let i = 0; i < numberOfParticles; i++) {
        particlesArray.push(new Particle());
    }
}

// Function to scan text and get coordinates of non-transparent pixels
function scanText(text) {
    // 1. Draw text on canvas once to get pixel data
    // Temporarily clear to draw clean text for analysis
    // We do this inside the frame but instantly overwrite it with particles, so it might flicker if not handled,
    // but standard game loop redraws immediately after.
    ctx.clearRect(0,0, canvas.width, canvas.height);
    
    // Configurable font size based on screen width
    const fontSize = Math.min(100, canvas.width / 10);
    ctx.font = 'bold ' + fontSize + 'px ' + fontStyle;
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Draw text in desired position (center of screen)
    // We adjust Y slightly up to not be covered by controls
    const textY = canvas.height / 2 - 50;
    ctx.fillText(text, canvas.width/2, textY);

    // Get image data
    // Optimization: we could scan just the bounding box of the text, but full screen is safer for centering
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = pixels.data; // rgba array
    
    const textCoordinates = [];
    const gap = 10; // Increased gap for more spacing and distinct particles
    
    for (let y = 0; y < canvas.height; y += gap) {
        for (let x = 0; x < canvas.width; x += gap) {
            // Check alpha value (every 4th value)
            const alpha = data[(y * pixels.width + x) * 4 + 3];
            if (alpha > 128) {
                textCoordinates.push({x: x, y: y});
            }
        }
    }
    
    return textCoordinates;
}

function animateParticlesToText() {
    const text = textInput.value;
    if (!text.trim()) return;

    const coords = scanText(text);
    
    // Assign targets
    // Strategy: Use existing particles. Unused particles scatter to background.
    
    // Shuffle particles array to make the transition look more organic (random particles go to random spots)
    // a simple shuffle
    particlesArray.sort(() => Math.random() - 0.5);

    for (let i = 0; i < particlesArray.length; i++) {
        if (i < coords.length) {
            // Particle used for text
            particlesArray[i].targetX = coords[i].x;
            particlesArray[i].targetY = coords[i].y;
            particlesArray[i].isInBallMode = false;
            
            // Convert hex to rgba
            const hexToRgba = (hex, alpha) => {
                const r = parseInt(hex.slice(1, 3), 16);
                const g = parseInt(hex.slice(3, 5), 16);
                const b = parseInt(hex.slice(5, 7), 16);
                return `rgba(${r}, ${g}, ${b}, ${alpha})`;
            };
            
            particlesArray[i].color = hexToRgba(textColor, 1);
            particlesArray[i].size = 2; // Smaller for text visibility
        } else {
            // Unused particle - scatter randomly across the screen
            particlesArray[i].targetX = Math.random() * canvas.width;
            particlesArray[i].targetY = Math.random() * canvas.height;
            particlesArray[i].isInBallMode = false;
            
            // Make them visible but dimmer so they spread out across screen
            particlesArray[i].color = 'rgba(80, 70, 150, 0.4)'; 
            particlesArray[i].size = 1.5;
        }
    }
}

function resetToBall() {
    for (let i = 0; i < particlesArray.length; i++) {
        particlesArray[i].setBallTarget();
    }
}

createBtn.addEventListener('click', animateParticlesToText);
resetBtn.addEventListener('click', resetToBall);

// Allow Enter key to trigger
textInput.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        animateParticlesToText();
    }
});

// Animation Loop
function animate() {
    // Increment rotation angle for ball
    rotationAngle += 0.005;
    
    // Trail effect: use semi-transparent overlay instead of full clear
    if (trailEffect) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    
    for (let i = 0; i < particlesArray.length; i++) {
        particlesArray[i].update();
        particlesArray[i].draw();
    }
    requestAnimationFrame(animate);
}

// Start
init();
animate();
