import { startSudoku } from '../sudoku/src/app.js';
import { LEVELS } from './puzzles.js';

startSudoku({ title: '스도쿠 6×6', boxRows: 2, boxCols: 3, levels: LEVELS });
