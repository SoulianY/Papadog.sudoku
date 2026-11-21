import { startSudoku } from './src/app.js';
import { LEVELS } from './puzzles.js';

startSudoku({ title: '스도쿠', boxRows: 3, boxCols: 3, levels: LEVELS });
