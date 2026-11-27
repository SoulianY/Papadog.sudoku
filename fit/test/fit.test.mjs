import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PIECES, byId, orientations, rotate, flip, normalize } from '../src/pieces.js';
import { tile } from '../src/solver.js';

const cards = JSON.parse(readFileSync(new URL('../boards.json', import.meta.url)));
const unpack = (n) => [Math.floor(n / 10), n % 10];

test('each piece has the right number of distinct orientations', () => {
  const expected = { i2: 2, i3: 2, l3: 4, o4: 1, t4: 4, s4: 4, l4: 8, i4: 2, p5: 8, u5: 4 };
  for (const p of PIECES) assert.equal(orientations(p.cells).length, expected[p.id], p.id);
});

test('rotating four times or flipping twice gives the shape back', () => {
  const l = byId.l4.cells;
  assert.deepEqual(rotate(rotate(rotate(rotate(l)))), normalize(l));
  assert.deepEqual(flip(flip(l)), normalize(l));
  assert.notDeepEqual(flip(l), normalize(l));
});

test('the solver fills a board exactly, or reports that it cannot', () => {
  const square = ['0,0', '0,1', '1,0', '1,1'];
  assert.equal(tile(square, ['o4']).length, 1);
  assert.equal(tile(square, ['l3']), null); // wrong area
  assert.ok(tile(['0,0', '0,1', '0,2', '0,3', '0,4'], ['i2', 'i3']));
});

for (const [mode, size, count] of [['easy', 3, 100], ['hard', 4, 200]]) {
  test(`${mode}: ${count} different cards, six different fitting piece sets each`, () => {
    const list = cards[mode];
    assert.equal(list.length, count);
    assert.equal(new Set(list.map((c) => c.board.slice().sort().join())).size, count);
    for (const [n, { board, faces }] of list.entries()) {
      assert.equal(faces.length, 6);
      assert.equal(new Set(faces.map((f) => f.pieces.join())).size, 6, `card ${n} faces differ`);
      const boardSet = new Set(board);
      for (const { pieces, solution } of faces) {
        assert.equal(pieces.length, size);
        assert.deepEqual(solution.map((s) => s.id).sort(), pieces.slice().sort());
        const covered = solution.flatMap((s) => s.cells);
        assert.equal(covered.length, board.length, `card ${n} area`);
        assert.equal(new Set(covered).size, covered.length, `card ${n} overlap`);
        assert.ok(covered.every((k) => boardSet.has(k)), `card ${n} inside`);
        for (const { id, cells } of solution) {
          const shape = JSON.stringify(normalize(cells.map(unpack)));
          assert.ok(orientations(byId[id].cells).some((o) => JSON.stringify(o) === shape), `card ${n} ${id} shape`);
        }
      }
    }
  });
}
