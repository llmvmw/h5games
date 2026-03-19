// Rubik's Cube Core Logic
class RubiksCube {
    constructor() {
        this.colors = ['white', 'yellow', 'green', 'blue', 'red', 'orange'];
        this.state = this.createSolvedCube();
        this.moveHistory = [];
    }

    createSolvedCube() {
        // Create a solved cube (each face has uniform color)
        const cube = {
            // 上下面
            U: Array(9).fill('white'),  // 上白
            D: Array(9).fill('yellow'), // 下黄
            // 前后左右
            F: Array(9).fill('green'),  // 前绿
            B: Array(9).fill('blue'),   // 后蓝
            R: Array(9).fill('red'),    // 右红
            L: Array(9).fill('orange')  // 左橙
        };
        return cube;
    }

    clone() {
        const newCube = new RubiksCube();
        newCube.state = JSON.parse(JSON.stringify(this.state));
        newCube.moveHistory = [...this.moveHistory];
        return newCube;
    }

    // Face rotations
    rotateFace(face, clockwise = true) {
        const oldState = JSON.parse(JSON.stringify(this.state));
        this.moveHistory.push({ face, clockwise });

        // Rotate the face itself (4x4 center rotation)
        this.rotateFaceStickers(face, clockwise);

        // Rotate the adjacent edges
        this.rotateEdges(face, clockwise);

        return oldState;
    }

    rotateFaceStickers(face, clockwise) {
        const faceStickers = this.state[face];
        const rotated = [0, 0, 0, 0, 0, 0, 0, 0, 0];

        if (clockwise) {
            rotated[0] = faceStickers[6];
            rotated[1] = faceStickers[3];
            rotated[2] = faceStickers[0];
            rotated[3] = faceStickers[7];
            rotated[4] = faceStickers[4];
            rotated[5] = faceStickers[1];
            rotated[6] = faceStickers[8];
            rotated[7] = faceStickers[5];
            rotated[8] = faceStickers[2];
        } else {
            rotated[0] = faceStickers[2];
            rotated[1] = faceStickers[5];
            rotated[2] = faceStickers[8];
            rotated[3] = faceStickers[1];
            rotated[4] = faceStickers[4];
            rotated[5] = faceStickers[7];
            rotated[6] = faceStickers[0];
            rotated[7] = faceStickers[3];
            rotated[8] = faceStickers[6];
        }

        this.state[face] = rotated;
    }

    rotateEdges(face, clockwise) {
        // Edge rotation helper using clear data structure
        const edgeRotations = {
            U: {
                clockwise: [['B',2], ['B',1], ['B',0], ['L',0], ['L',1], ['L',2], ['F',0], ['F',1], ['F',2], ['R',0], ['R',1], ['R',2]],
                counterclockwise: [['R',0], ['R',1], ['R',2], ['F',0], ['F',1], ['F',2], ['L',0], ['L',1], ['L',2], ['B',2], ['B',1], ['B',0]]
            },
            D: {
                clockwise: [['F',6], ['F',7], ['F',8], ['R',6], ['R',7], ['R',8], ['B',6], ['B',7], ['B',8], ['L',6], ['L',7], ['L',8]],
                counterclockwise: [['L',6], ['L',7], ['L',8], ['B',6], ['B',7], ['B',8], ['R',6], ['R',7], ['R',8], ['F',6], ['F',7], ['F',8]]
            },
            F: {
                clockwise: [['U',6], ['U',7], ['U',8], ['R',0], ['R',3], ['R',6], ['D',2], ['D',1], ['D',0], ['L',8], ['L',5], ['L',2]],
                counterclockwise: [['L',2], ['L',5], ['L',8], ['D',0], ['D',1], ['D',2], ['R',6], ['R',3], ['R',0], ['U',6], ['U',7], ['U',8]]
            },
            B: {
                clockwise: [['U',2], ['U',1], ['U',0], ['L',6], ['L',3], ['L',0], ['D',6], ['D',7], ['D',8], ['R',2], ['R',5], ['R',8]],
                counterclockwise: [['R',8], ['R',5], ['R',2], ['D',8], ['D',7], ['D',6], ['L',0], ['L',3], ['L',6], ['U',0], ['U',1], ['U',2]]
            },
            R: {
                clockwise: [['U',2], ['U',5], ['U',8], ['B',0], ['B',3], ['B',6], ['D',2], ['D',5], ['D',8], ['F',2], ['F',5], ['F',8]],
                counterclockwise: [['F',2], ['F',5], ['F',8], ['D',2], ['D',5], ['D',8], ['B',6], ['B',3], ['B',0], ['U',2], ['U',5], ['U',8]]
            },
            L: {
                clockwise: [['U',0], ['U',3], ['U',6], ['F',0], ['F',3], ['F',6], ['D',0], ['D',3], ['D',6], ['B',8], ['B',5], ['B',2]],
                counterclockwise: [['B',2], ['B',5], ['B',8], ['D',6], ['D',3], ['D',0], ['F',6], ['F',3], ['F',0], ['U',0], ['U',3], ['U',6]]
            }
        };

        const rotation = clockwise ? 'clockwise' : 'counterclockwise';
        const sequence = edgeRotations[face][rotation];

        if (!sequence) return;

        // Save the first three elements
        const temp = [
            this.state[sequence[0][0]][sequence[0][1]],
            this.state[sequence[1][0]][sequence[1][1]],
            this.state[sequence[2][0]][sequence[2][1]]
        ];

        // Rotate the remaining groups
        for (let group = 1; group < 4; group++) {
            for (let i = 0; i < 3; i++) {
                const sourceIndex = group * 3 + i;
                const targetIndex = (group - 1) * 3 + i;
                this.state[sequence[targetIndex][0]][sequence[targetIndex][1]] = 
                    this.state[sequence[sourceIndex][0]][sequence[sourceIndex][1]];
            }
        }

        // Put saved elements in last group
        for (let i = 0; i < 3; i++) {
            this.state[sequence[9 + i][0]][sequence[9 + i][1]] = temp[i];
        }
    }

    shuffle(numMoves = 20) {
        const faces = ['U', 'D', 'L', 'R', 'F', 'B'];
        for (let i = 0; i < numMoves; i++) {
            const face = faces[Math.floor(Math.random() * faces.length)];
            const clockwise = Math.random() > 0.5;
            this.rotateFace(face, clockwise);
        }
    }

    reset() {
        this.state = this.createSolvedCube();
        this.moveHistory = [];
    }

    isSolved() {
        for (let face in this.state) {
            const firstColor = this.state[face][0];
            for (let sticker of this.state[face]) {
                if (sticker !== firstColor) return false;
            }
        }
        return true;
    }

    getState() {
        return JSON.parse(JSON.stringify(this.state));
    }

    // Additional helper methods for debugging and testing
    printCube() {
        console.log('Cube state:');
        for (let face in this.state) {
            console.log(`${face}: ${this.state[face].join(' ')}`);
        }
    }

    // Export and import state for persistence
    exportState() {
        return {
            state: JSON.parse(JSON.stringify(this.state)),
            moveHistory: [...this.moveHistory]
        };
    }

    importState(data) {
        this.state = JSON.parse(JSON.stringify(data.state));
        this.moveHistory = [...data.moveHistory];
    }
}

// Make available globally
window.RubiksCube = RubiksCube;