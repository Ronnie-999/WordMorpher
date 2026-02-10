const canvas = document.getElementById('canvas1');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let particlesArray = [];
const textInput = document.getElementById('textInput');
const createBtn = document.getElementById('createBtn');
const voiceBtn = document.getElementById('voiceBtn');
const resetBtn = document.getElementById('resetBtn');

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (!SpeechRecognition) {
    voiceBtn.disabled = true;
    voiceBtn.style.opacity = '0.5';
    voiceBtn.style.cursor = 'not-allowed';
} else {
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    let listening = false;

    

    recognition.addEventListener('start', () => {
        listening = true;
        setVoiceState('Listening for a single wordâ€¦', true);
    });

    recognition.addEventListener('end', () => {
        listening = false;
        setVoiceState('Voice command ready', false);
    });

    recognition.addEventListener('result', (event) => {
        const transcript = event.results[0]?.[0]?.transcript?.trim();
        if (!transcript) {
            return;
        }

        const spokenWord = transcript.split(/\s+/)[0];
        textInput.value = spokenWord;
        setVoiceState(`Heard â€œ${spokenWord}â€. Creatingâ€¦`, false);
        animateParticlesToText();
    });

    recognition.addEventListener('error', (event) => {
        setVoiceState(`Voice error: ${event.error}`, false);
        console.error('SpeechRecognition error:', event.error);
    });

    voiceBtn.addEventListener('click', () => {
        if (listening) {
            recognition.stop();
        } else {
            try {
                recognition.start();
            } catch (error) {
                console.warn('Voice recognition could not start', error);
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
        this.size = 2.5; // Larger particles for better distinctness
        this.color = 'rgba(255, 255, 255, 0.8)';
        
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
        // Random point in circle
        const angle = Math.random() * Math.PI * 2;
        // Use square root of random for uniform distribution
        const r = Math.sqrt(Math.random()) * radius; 
        
        this.targetX = canvas.width / 2 + Math.cos(angle) * r;
        this.targetY = canvas.height / 2 + Math.sin(angle) * r;
        
        // Ball Color: Brighter purple/blue for better visibility
        this.color = 'rgba(100, 80, 200, 0.9)'; // Brighter purple
        this.size = 2.5; // Distinct particle size
    }

    update() {
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
    ctx.font = 'bold ' + fontSize + 'px Verdana';
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
    const gap = 7; // Larger gap for clear, distinct spacing between particles
    
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
            
            // Text Color: Bright, distinct color
            particlesArray[i].color = 'rgba(120, 150, 255, 1)'; // Bright blue for text
            particlesArray[i].size = 3; // Larger for text visibility
        } else {
            // Unused particle - scatter randomly across the screen
            particlesArray[i].targetX = Math.random() * canvas.width;
            particlesArray[i].targetY = Math.random() * canvas.height;
            
            // Make them visible but dimmer so they spread out across screen
            particlesArray[i].color = 'rgba(80, 70, 150, 0.4)'; 
            particlesArray[i].size = 2;
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
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < particlesArray.length; i++) {
        particlesArray[i].update();
        particlesArray[i].draw();
    }
    requestAnimationFrame(animate);
}

// Start
init();
animate();
