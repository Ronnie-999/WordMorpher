# WordMorpher

An interactive particle animation application that morphs thousands of particles from a spherical formation into text shapes. Features voice recognition for hands-free text input.

## Overview

WordMorpher creates a mesmerizing visual effect where 4,000 individual particles smoothly transition from a ball formation into the shape of any word you type or speak. The particles use physics-based easing to create fluid, organic movements.

## Features

- **Particle Ball Formation**: 4,000 particles arranged in a perfect sphere using uniform distribution
- **Voice Recognition**: Speak a word to automatically create it from particles
- **Continuous Voice Mode**: Keep speaking multiple words in sequence without stopping
- **Manual Input**: Type any word and click "Create" to morph particles
- **Particle Trail Effects**: Enable ghosting trails for mesmerizing motion blur
- **Color Customization**: Customize ball and text particle colors in real-time
- **Font Style Selection**: Choose from 6 different fonts for text morphing
- **Smooth Animation**: Physics-based easing with 60 FPS animation loop
- **Reset Functionality**: Return all particles to ball formation
- **Responsive Canvas**: Automatically adjusts to window size
- **Dark Theme**: Immersive black background with vibrant particle colors

## How It Works

### User Experience

1. **Initial State**: Application loads with particles forming a blue/purple sphere in the center
2. **Input Methods**:
   - **Type**: Enter text manually in the input field, press Enter or click "Create"
   - **Voice**: Click "Speak" button, say a word, particles auto-morph into that word
   - **Continuous Voice**: Enable continuous mode to speak multiple words in sequence
3. **Morphing**: Particles smoothly transition from sphere to text shape
4. **Customization**: Adjust colors, fonts, and effects via settings panel
5. **Reset**: Click "Reset" to return particles to sphere formation

### Technical Implementation

#### Particle System

**Initialization**
- 4,000 `Particle` objects created on page load
- Each particle initialized with random position within a sphere (radius: 150px)
- Uniform distribution achieved using `sqrt(random())` for radius calculation
- Particles positioned at canvas center using polar coordinates

**Particle Class Properties**
```javascript
- x, y: Current position
- targetX, targetY: Destination coordinates
- size: 2.5px (ball) or 3px (text)
- color: rgba values (purple for ball, blue for text)
- ease: 0.05 (controls movement speed)
- friction: 0.9 (physics simulation)
```

**Animation Loop**
- Uses `requestAnimationFrame` for 60 FPS rendering
- Each frame: clear canvas → update all particles → draw all particles
- Update logic: Simple easing `x += (targetX - x) * ease`

#### Text-to-Particle Mapping

**Scanning Process**
1. Draw text on canvas using bold Verdana font (size: min(100px, canvas.width/10))
2. Use `getImageData()` to read pixel data from entire canvas
3. Sample every 7th pixel (gap=7) for performance optimization
4. Check alpha channel value (>128 = opaque = text pixel)
5. Store coordinates of all text pixels in array

**Assignment Algorithm**
1. Shuffle particle array for organic transition effect
2. First N particles (where N = text pixel count) → assigned to text positions
3. Remaining particles → scattered randomly across screen (dimmed, smaller)
4. Text particles: bright blue (#788CFF), size 3px
5. Excess particles: dim purple (rgba(80,70,150,0.4)), size 2px

#### Voice Recognition

**Web Speech API Integration**
- Uses `SpeechRecognition` or `webkitSpeechRecognition`
- Configuration:
  - Language: 'en-US'
  - Continuous: toggleable (single word or multiple words)
  - Interim results: false (only final transcription)
  
**Event Flow**
1. User clicks "Speak" → `recognition.start()`
2. Button changes to "🎤 Listening..." with green gradient
3. User speaks words
4. `result` event fires → extract first word from each transcript
5. Set input field value
6. Automatically call `animateParticlesToText()`
7. In continuous mode: keeps listening until manually stopped
8. Recognition ends → button resets to "Speak"

**Error Handling**
- Invalid state errors caught with try-catch
- Unsupported browsers → button disabled with 50% opacity
- Error events logged to console

#### Canvas Rendering

**Setup**
- Full window dimensions: `canvas.width = window.innerWidth`
- 2D context with `getContext('2d')`
- Resize listener updates canvas dimensions dynamically

**Drawing Method**
- Particles drawn as circles using `arc()`
- Color and size set per particle based on user preferences
- Trail effect: uses semi-transparent overlay (`rgba(0,0,0,0.05)`) instead of `clearRect()`
- Normal mode: `clearRect()` clears previous frame before redrawing

#### Customization Features

**Color System**
- HTML5 color pickers for ball and text colors
- Real-time hex-to-rgba conversion for particle rendering
- Ball color updates on reset, text color updates on morph
- Alpha channel preserved for particle opacity

**Font Selection**
- Dropdown with 6 font options: Verdana, Arial, Georgia, Times New Roman, Courier New, Impact
- Font applied dynamically to canvas text rendering
- Changes take effect immediately on next morph

**Trail Effects**
- Toggle checkbox enables/disables particle trails
- Implementation: semi-transparent black overlay vs full clear
- Creates motion blur and ghosting effect
- Particles leave fading traces of their paths

**Continuous Voice Mode**
- Checkbox toggles `recognition.continuous` property
- Single mode: stops after one word
- Continuous mode: processes multiple words until manually stopped
- Result index tracking prevents duplicate processing

## Browser Compatibility

- **Voice Recognition**: Chrome, Edge, Safari (desktop)
- **Canvas Animation**: All modern browsers
- **Recommended**: Chrome or Edge for full voice feature support

## Usage

### Running Locally

```bash
# Using Python
python -m http.server 8001

# Or any static file server
# Navigate to http://localhost:8001
```

### Controls

**Main Controls**
- **Text Input**: Type your word
- **Create Button**: Morph particles into typed word
- **Speak Button**: Voice input (auto-morphs after recognition)
- **Reset Button**: Return particles to ball formation
- **Enter Key**: Alternative to clicking "Create"

**Settings Panel (Top Right)**
- **Ball Color**: Color picker for sphere particles
- **Text Color**: Color picker for text particles
- **Font Style**: Dropdown to select text font
- **Particle Trails**: Checkbox to enable motion blur effect
- **Continuous Voice**: Checkbox for multi-word voice input

## File Structure

```
WordMorpher/
├── index.html      # Main HTML structure and styling
├── code.js         # Particle system and animation logic
└── README.md       # This file
```

## Technical Stack

- **HTML5 Canvas**: Rendering engine
- **Vanilla JavaScript**: No frameworks or dependencies
- **Web Speech API**: Voice recognition
- **CSS3**: Gradient styling and animations

## Performance Considerations

- **Particle Count**: 4,000 particles balanced for visual density vs performance
- **Sampling Gap**: 7px gap reduces text coordinates from ~10,000 to manageable count
- **RequestAnimationFrame**: Syncs with display refresh rate (typically 60 FPS)
- **Easing Factor**: 0.05 provides smooth movement without lag

## Future Enhancements

- Export animation as video/GIF
- Multiple language support for voice recognition
- Particle size control
- Animation speed adjustment
- Save/load custom presets

## License

Open source - feel free to modify and use as needed.