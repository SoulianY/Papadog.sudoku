import { startSudoku } from '../sudoku/src/app.js';
import { LEVELS } from './puzzles.js';

startSudoku({ title: '스도쿠 (쉬움)', boxRows: 3, boxCols: 3, levels: LEVELS });
