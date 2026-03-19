// Game controller and 3D rendering
class CubeController {
    constructor() {
        this.cube = new RubiksCube();
        this.container = document.getElementById('cube-container');
        this.moveCount = 0;
        this.startTime = null;
        this.timerInterval = null;
        this.isDragging = false;
        this.lastMousePos = { x: 0, y: 0 };
        this.rotation = { x: -20, y: -30 };
        
        this.init();
    }

    init() {
        this.render();
        this.setupEventListeners();
        this.startTimer();
    }

    render() {
        this.container.innerHTML = '';
        
        const scene = document.createElement('div');
        scene.className = 'scene';
        scene.style.transform = `rotateX(${this.rotation.x}deg) rotateY(${this.rotation.y}deg)`;
        scene.id = 'scene';

        // Create the cube with individual cubies
        const cube = this.createCube();
        scene.appendChild(cube);

        this.container.appendChild(scene);
    }

    createCube() {
        const cube = document.createElement('div');
        cube.className = 'cube';

        // Create 27 cubies (3x3x3)
        const cubies = [];
        for (let x = -1; x <= 1; x++) {
            for (let y = -1; y <= 1; y++) {
                for (let z = -1; z <= 1; z++) {
                    const cubie = this.createCubie(x, y, z);
                    cubies.push(cubie);
                }
            }
        }

        cubies.forEach(cubie => cube.appendChild(cubie));
        return cube;
    }

    createCubie(x, y, z) {
        const cubie = document.createElement('div');
        cubie.className = 'cubie';
        cubie.style.transform = `translate3D(${x * 50}px, ${y * 50}px, ${z * 50}px)`;

        const size = 48;
        const faces = [
            { dir: 'front', transform: `translateZ(${size/2}px)` },
            { dir: 'back', transform: `translateZ(-${size/2}px) rotateY(180deg)` },
            { dir: 'right', transform: `translateX(${size/2}px) rotateY(90deg)` },
            { dir: 'left', transform: `translateX(-${size/2}px) rotateY(-90deg)` },
            { dir: 'top', transform: `translateY(-${size/2}px) rotateX(90deg)` },
            { dir: 'bottom', transform: `translateY(${size/2}px) rotateX(-90deg)` }
        ];

        const faceColors = {
            'U': '#ffffff',
            'D': '#ffff00',
            'F': '#00ff00',
            'B': '#0000ff',
            'R': '#ff0000',
            'L': '#ff8800'
        };

        faces.forEach(face => {
            const faceDiv = document.createElement('div');
            faceDiv.className = `cubie-face ${face.dir}`;
            faceDiv.style.transform = face.transform;
            
            // Determine which cube face this represents based on position
            let faceColor = this.getCubieFaceColor(x, y, z, face.dir);
            if (faceColor) {
                faceDiv.style.backgroundColor = faceColors[faceColor];
            } else {
                faceDiv.style.backgroundColor = '#333';
                faceDiv.style.border = '1px solid #666';
            }
            
            cubie.appendChild(faceDiv);
        });

        return cubie;
    }

    getCubieFaceColor(x, y, z, direction) {
        // Determine which cube face this direction represents
        switch (direction) {
            case 'front':
                if (z === 1) return 'F';
                break;
            case 'back':
                if (z === -1) return 'B';
                break;
            case 'right':
                if (x === 1) return 'R';
                break;
            case 'left':
                if (x === -1) return 'L';
                break;
            case 'top':
                if (y === -1) return 'U';
                break;
            case 'bottom':
                if (y === 1) return 'D';
                break;
        }
        return null;
    }

    setupEventListeners() {
        // Mouse drag for cube rotation
        this.container.addEventListener('mousedown', (e) => this.onMouseDown(e));
        document.addEventListener('mousemove', (e) => this.onMouseMove(e));
        document.addEventListener('mouseup', () => this.onMouseUp());

        // Touch events
        this.container.addEventListener('touchstart', (e) => this.onTouchStart(e));
        document.addEventListener('touchmove', (e) => this.onTouchMove(e));
        document.addEventListener('touchend', () => this.onTouchEnd());

        // Keyboard controls
        document.addEventListener('keydown', (e) => this.onKeyDown(e));
    }

    onMouseDown(e) {
        this.isDragging = true;
        this.lastMousePos = { x: e.clientX, y: e.clientY };
        this.container.style.cursor = 'grabbing';
    }

    onMouseMove(e) {
        if (!this.isDragging) return;
        
        const deltaX = e.clientX - this.lastMousePos.x;
        const deltaY = e.clientY - this.lastMousePos.y;
        
        this.rotation.y += deltaX * 0.5;
        this.rotation.x -= deltaY * 0.5;
        
        this.lastMousePos = { x: e.clientX, y: e.clientY };
        this.updateRotation();
    }

    onMouseUp() {
        this.isDragging = false;
        this.container.style.cursor = 'grab';
    }

    onTouchStart(e) {
        e.preventDefault();
        const touch = e.touches[0];
        this.isDragging = true;
        this.lastMousePos = { x: touch.clientX, y: touch.clientY };
    }

    onTouchMove(e) {
        e.preventDefault();
        if (!this.isDragging) return;
        
        const touch = e.touches[0];
        const deltaX = touch.clientX - this.lastMousePos.x;
        const deltaY = touch.clientY - this.lastMousePos.y;
        
        this.rotation.y += deltaX * 0.5;
        this.rotation.x -= deltaY * 0.5;
        
        this.lastMousePos = { x: touch.clientX, y: touch.clientY };
        this.updateRotation();
    }

    onTouchEnd() {
        this.isDragging = false;
    }

    onKeyDown(e) {
        const key = e.key.toUpperCase();
        const shiftPressed = e.shiftKey;
        
        const faceMap = {
            'U': 'U', 'D': 'D', 'L': 'L', 'R': 'R',
            'F': 'F', 'B': 'B'
        };

        if (faceMap[key]) {
            e.preventDefault();
            this.handleMove(faceMap[key], !shiftPressed);
        }
    }

    handleMove(face, clockwise = true) {
        this.cube.rotateFace(face, clockwise);
        this.moveCount++;
        this.updateMoveCount();
        this.render();
        this.checkSolved();
    }

    updateMoveCount() {
        document.getElementById('move-count').textContent = `步数: ${this.moveCount}`;
    }

    startTimer() {
        this.startTime = Date.now();
        this.timerInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
            const minutes = String(Math.floor(elapsed / 60)).padStart(2, '0');
            const seconds = String(elapsed % 60).padStart(2, '0');
            document.getElementById('timer').textContent = `时间: ${minutes}:${seconds}`;
        }, 1000);
    }

    updateRotation() {
        const scene = document.getElementById('scene');
        if (scene) {
            scene.style.transform = `rotateX(${this.rotation.x}deg) rotateY(${this.rotation.y}deg)`;
        }
    }

    checkSolved() {
        if (this.cube.isSolved()) {
            clearInterval(this.timerInterval);
            const elapsed = document.getElementById('timer').textContent.split(': ')[1];
            alert(`恭喜！你完成了魔方！\n步数: ${this.moveCount}\n时间: ${elapsed}`);
            document.querySelector('.solve-btn').disabled = false;
        }
    }

    shuffle() {
        this.cube.shuffle(20);
        this.moveCount = 0;
        this.updateMoveCount();
        this.render();
        this.startTimer();
        document.querySelector('.solve-btn').disabled = true;
    }

    reset() {
        this.cube.reset();
        this.moveCount = 0;
        this.updateMoveCount();
        this.render();
        this.startTimer();
        document.querySelector('.solve-btn').disabled = true;
    }

    solve() {
        // Simple solve by reversing move history
        const history = [...this.cube.moveHistory];
        for (let i = history.length - 1; i >= 0; i--) {
            const move = history[i];
            this.handleMove(move.face, !move.clockwise);
        }
    }
}

// Global functions for button clicks
let controller;

function rotateFace(face, clockwise) {
    controller.handleMove(face, clockwise);
}

function shuffleCube() {
    controller.shuffle();
}

function resetCube() {
    controller.reset();
}

function solveCube() {
    controller.solve();
}

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    controller = new CubeController();
});

// Make controller available globally for testing
window.Controller = CubeController;