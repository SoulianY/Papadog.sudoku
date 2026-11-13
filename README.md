# 스도쿠

9×9 스도쿠 웹 게임. 초급·중급·상급·최상급 각 100판, 총 400판.

▶ 플레이: https://souliany.github.io/Papadog.sudoku/

## 실행

ES 모듈을 쓰므로 정적 서버로 엽니다 (빌드 없음).

```sh
npm start            # 또는: python3 -m http.server
```

## 블록 퍼즐 (`blocks/`)

▶ 플레이: https://souliany.github.io/Papadog.sudoku/blocks/

8×8 판에 아래 블록 3개를 끌어다 놓아 가로·세로 줄을 채우면 지워집니다. 놓을 곳이 없으면 게임 끝.

- 점수: 놓은 칸 1점, 한 번에 n줄 지우면 10·n²점 × 콤보(연속으로 줄을 지운 횟수)
- 놓을 위치 미리보기, 지워질 줄 표시, 놓을 수 없는 블록은 흐리게
- 난이도 곡선: 블록을 쉬움(1–3칸, 2×2, 작은 ㄱ) · 보통(4칸 막대, ㄴ/T, 2×3) · 어려움(5칸 막대, S/Z, 큰 ㄱ, 3×3)으로 나누고,
  점수가 오를수록 어려운 블록 비율이 늘어납니다 (`engine.js`의 `CURVE`). 300점 전까지는 새로 나오는 3개가 모두 놓을 수 있는 블록입니다.
- 진행 중인 게임과 최고 점수 자동 저장

```
blocks/src/pieces.js   블록 모양 (회전형 자동 생성)
blocks/src/engine.js   규칙: 배치, 줄 지우기, 점수, 게임 끝 판정
blocks/src/app.js      화면과 드래그 앤 드롭
blocks/test/           규칙 테스트
```

## 휴대폰 앱으로 설치

HTTPS 정적 호스팅(GitHub Pages, Netlify, Cloudflare Pages 등)에 올리면 PWA로 설치됩니다.

- Android Chrome: 메뉴 → **홈 화면에 추가**(앱 설치)
- iPhone Safari: 공유 → **홈 화면에 추가**

한 번 열고 나면 오프라인에서도 플레이됩니다 (`sw.js`).

## 기능

- 난이도별 100판 목록, 완료(파란색)·진행 중(점) 표시
- 메모(연필) 모드, 지우기, 실행취소, 힌트
- 틀린 숫자 빨간색 표시, 같은 숫자·행/열/박스 강조
- 정답 입력 시 같은 행/열/박스의 메모 자동 제거
- 타이머, 최고 기록, 진행 상황 자동 저장 (localStorage)
- 키보드: `1-9` 입력, `Backspace`/`0` 지우기, `N` 메모, 방향키 이동, `Ctrl+Z` 실행취소
- 라이트/다크 모드 자동

## 퍼즐 난이도

`src/puzzles.js`는 [sudoku-core](https://github.com/komeilmehranfar/sudoku-core)로 생성합니다.
사람이 쓰는 풀이 기법 순서로 L1–L10 등급을 매기며, 각 퍼즐은 **풀기 위해 꼭 필요한 가장 어려운 기법**으로 등급이 정해집니다.

| 단계 | 등급 | 필요한 기법 | 주어진 숫자 |
|---|---|---|---|
| 초급 | L2 | 히든 싱글 | 42–43 |
| 중급 | L3–L4 | 네이키드 싱글, 포인팅 | 25–34 |
| 상급 | L5–L6 | 네이키드/히든 페어·트리플, X-Wing, Swordfish | 21–29 |
| 최상급 | L7–L8 | Skyscraper, Kite, Y-Wing, W-Wing, 컬러링 | 22–27 |

모든 퍼즐은 해가 하나뿐이고 추측 없이 논리로 풀립니다.
단계 안에서는 낮은 등급 → 높은 등급, 같은 등급은 풀이 작업량(score) 순이라 1번이 가장 쉽고 100번이 가장 어렵습니다.

```sh
npm run generate     # 퍼즐 400판 새로 생성
npm test             # 퍼즐 데이터 검증 (개수, 유일해, 정답, 난이도)
```

## 구조

```
index.html, styles.css
manifest.webmanifest, sw.js, icons/   PWA 설치·오프라인
src/app.js        화면·라우팅 (#easy, #easy-12)
src/game.js       한 판의 상태: 입력, 메모, 실행취소, 힌트
src/sudoku.js     보드 헬퍼 (행/열/박스, PEERS)
src/storage.js    진행 저장
src/puzzles.js    생성된 퍼즐 데이터
scripts/generate-puzzles.mjs
test/puzzles.test.mjs
```
