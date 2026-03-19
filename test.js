// Node.js测试入口 - 模拟浏览器环境运行cube.js

// 模拟全局对象
global.window = {};
global.document = {
    addEventListener: () => {},
    getElementById: () => null,
    createElement: () => ({ style: {}, className: '', appendChild: () => {} })
};

// 动态读取并执行cube.js
const fs = require('fs');
const vm = require('vm');

const cubeCode = fs.readFileSync('./cube.js', 'utf8');
const context = vm.createContext(global);
vm.runInContext(cubeCode, context);

// 从上下文中获取RubiksCube类
const RubiksCube = context.window.RubiksCube;

class CubeTestRunner {
    constructor() {
        this.passed = 0;
        this.failed = 0;
        this.results = [];
    }

    test(description, testFn) {
        try {
            testFn();
            this.passed++;
            this.results.push({ status: 'PASS', description });
            console.log(`✓ ${description}`);
        } catch (error) {
            this.failed++;
            this.results.push({ status: 'FAIL', description, error: error.message });
            console.log(`✗ ${description}`);
            console.log(`  Error: ${error.message}`);
        }
    }

    assert(condition, message) {
        if (!condition) {
            throw new Error(message || 'Assertion failed');
        }
    }

    assertEqual(actual, expected, message) {
        if (JSON.stringify(actual) !== JSON.stringify(expected)) {
            throw new Error(message || `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
        }
    }

    runAllTests() {
        console.log('=== 魔方核心逻辑测试 ===\n');

        this.test('创建魔方实例', () => {
            const cube = new RubiksCube();
            this.assert(cube !== null, '应该能创建实例');
            this.assert(typeof cube.rotateFace === 'function', '应该有rotateFace方法');
        });

        this.test('初始状态应该是已解决的', () => {
            const cube = new RubiksCube();
            this.assert(cube.isSolved(), '新魔方应该是已解决状态');
        });

        this.test('魔方应该有6个面', () => {
            const cube = new RubiksCube();
            const state = cube.getState();
            this.assertEqual(Object.keys(state).length, 6, '应该有6个面');
            
            const expectedFaces = ['U', 'D', 'F', 'B', 'R', 'L'];
            expectedFaces.forEach(face => {
                this.assert(state.hasOwnProperty(face), `应该有${face}面`);
            });
        });

        this.test('每个面应该有9个色块', () => {
            const cube = new RubiksCube();
            const state = cube.getState();
            for (let face in state) {
                this.assertEqual(state[face].length, 9, `${face}面应该有9个色块`);
            }
        });

        this.test('U面旋转应该改变状态', () => {
            const cube = new RubiksCube();
            const before = JSON.stringify(cube.getState());
            cube.rotateFace('U', true);
            const after = JSON.stringify(cube.getState());
            this.assert(before !== after, '旋转后状态应该改变');
        });

        this.test('正反旋转应该相互抵消', () => {
            const cube = new RubiksCube();
            cube.rotateFace('U', true);
            cube.rotateFace('U', false);
            this.assert(cube.isSolved(), '正反旋转应该回到解决状态');
        });

        this.test('所有面都应该能旋转', () => {
            const cube = new RubiksCube();
            const faces = ['U', 'D', 'L', 'R', 'F', 'B'];
            
            faces.forEach(face => {
                cube.rotateFace(face, true);
                this.assert(!cube.isSolved(), `${face}旋转后应该不是解决状态`);
            });
        });

        this.test('一次旋转后解决状态检查', () => {
            const cube = new RubiksCube();
            cube.rotateFace('F', true);
            const solved = cube.isSolved();
            this.assert(!solved, '单次旋转后不应该解决');
        });

        this.test('多次旋转工作正常', () => {
            const cube = new RubiksCube();
            const moves = [
                { face: 'U', clockwise: true },
                { face: 'R', clockwise: true },
                { face: 'F', clockwise: false }
            ];
            
            moves.forEach(move => {
                cube.rotateFace(move.face, move.clockwise);
            });
            
            this.assert(!cube.isSolved(), '多次旋转后应该不是解决状态');
        });

        this.test('打乱功能', () => {
            const cube = new RubiksCube();
            cube.shuffle(10);
            this.assert(!cube.isSolved(), '打乱后应该不是解决状态');
            
            // 检查所有面仍然有9个色块
            const state = cube.getState();
            for (let face in state) {
                this.assertEqual(state[face].length, 9, `${face}面应该有9个色块`);
            }
        });

        this.test('重置功能', () => {
            const cube = new RubiksCube();
            cube.shuffle(5);
            this.assert(!cube.isSolved(), '打乱后应该不是解决状态');
            cube.reset();
            this.assert(cube.isSolved(), '重置后应该回到解决状态');
            this.assertEqual(cube.moveHistory.length, 0, '重置后历史应该为空');
        });

        this.test('克隆功能', () => {
            const cube = new RubiksCube();
            cube.rotateFace('R', true);
            const clone = cube.clone();
            
            // 克隆应该独立
            clone.rotateFace('U', true);
            this.assert(!cube.isSolved(), '原魔方旋转克隆后应该受影响');
            this.assert(!clone.isSolved(), '克隆魔方旋转后应该不是解决状态');
        });

        this.test('导出和导入状态', () => {
            const cube = new RubiksCube();
            cube.rotateFace('F', true);
            cube.rotateFace('U', false);
            
            const exported = cube.exportState();
            const newCube = new RubiksCube();
            newCube.importState(exported);
            
            this.assertEqual(newCube.getState(), cube.getState(), '导入状态应该匹配原魔方');
        });

        this.test('移动历史记录', () => {
            const cube = new RubiksCube();
            this.assertEqual(cube.moveHistory.length, 0, '初始历史应该为空');
            
            cube.rotateFace('U', true);
            this.assertEqual(cube.moveHistory.length, 1, '一次旋转后应该有1条记录');
            
            cube.rotateFace('R', false);
            this.assertEqual(cube.moveHistory.length, 2, '两次旋转后应该有2条记录');
            
            const lastMove = cube.moveHistory[cube.moveHistory.length - 1];
            this.assertEqual(lastMove.face, 'R', '最后一条记录应该是R面');
            this.assertEqual(lastMove.clockwise, false, '最后一条记录应该是逆时针');
        });

        this.printSummary();
    }

    printSummary() {
        console.log('\n=== 测试总结 ===');
        console.log(`总计: ${this.passed + this.failed} 个测试`);
        console.log(`通过: ${this.passed}`);
        console.log(`失败: ${this.failed}`);
        console.log(`成功率: ${((this.passed / (this.passed + this.failed)) * 100).toFixed(1)}%`);
        
        if (this.failed === 0) {
            console.log('🎉 所有测试通过！');
        } else {
            console.log('❌ 有测试失败，请检查上面错误信息');
            process.exit(1);
        }
    }
}

// 运行测试
const runner = new CubeTestRunner();
runner.runAllTests();