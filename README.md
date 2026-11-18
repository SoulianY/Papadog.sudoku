# 파파독 게임

▶ https://souliany.github.io/Papadog.sudoku/ — 게임 선택 화면

| 게임 | 주소 | 폴더 |
|---|---|---|
| 스도쿠 | https://souliany.github.io/Papadog.sudoku/sudoku/ | `sudoku/` |
| 블록 퍼즐 | https://souliany.github.io/Papadog.sudoku/blocks/ | `blocks/` |
| 잇다 | https://souliany.github.io/Papadog.sudoku/itda/ | `itda/` |
| 낙하 | https://souliany.github.io/Papadog.sudoku/drop/ | `drop/` |
| 차례 | https://souliany.github.io/Papadog.sudoku/charye/ | `charye/` |
| 출차 | https://souliany.github.io/Papadog.sudoku/chulcha/ | `chulcha/` |

루트에는 게임 선택 화면(`index.html`, `hub.css`)과 공용 PWA 파일(`manifest.webmanifest`, `sw.js`, `icons/`)만 있습니다.

## 스도쿠 (`sudoku/`)

9×9 스도쿠. 초급·중급·상급·최상급 각 100판, 총 400판.

## 실행

ES 모듈을 쓰므로 정적 서버로 엽니다 (빌드 없음).

```sh
npm start            # 또는: python3 -m http.server
```

## 블록 퍼즐 (`blocks/`)


8×8 판에 아래 블록 3개를 끌어다 놓아 가로·세로 줄을 채우면 지워집니다. 놓을 곳이 없으면 게임 끝.

- 점수: 놓은 칸 1점, 한 번에 n줄 지우면 10·n²점 × 콤보(연속으로 줄을 지운 횟수)
- 놓을 위치 미리보기, 지워질 줄 표시, 놓을 수 없는 블록은 흐리게
- 블록 배분 (`blocks/src/dealer.js`): 모든 블록에 매번 가중치를 매겨 뽑습니다.
  - **크기 단계**: 쉬움(1–3칸, 2×2, 작은 ㄱ) · 보통(4칸 막대, ㄴ/T, 2×3) · 어려움(5칸 막대, S/Z, 큰 ㄱ, 3×3). 점수가 오를수록 어려움 비율 증가.
  - **판 적합도(0–1)**: 지금 판에서 줄을 완성할 수 있는지(절반) + 가장 좋은 자리에 놓았을 때 벽·블록에 얼마나 꼭 맞는지(절반).
  - 가중치 = 크기 단계 비율 × e^(도움도 × 적합도). 도움도는 0점에서 4로 시작해 2500점에서 0이 되어, 초반엔 빈 공간에 딱 맞는 블록이, 후반엔 판과 무관한 블록이 나옵니다.
  - 300점 전까지는 3개 모두 놓을 수 있는 블록만 나옵니다.
- 진행 중인 게임과 최고 점수 자동 저장

```
blocks/src/pieces.js   블록 모양 (회전형 자동 생성)
blocks/src/board.js    판 판정: 놓을 수 있는지, 꽉 찬 줄
blocks/src/dealer.js   다음 블록 3개 고르기 (난이도 곡선, 적합도)
blocks/src/engine.js   규칙: 배치, 줄 지우기, 점수, 게임 끝 판정
blocks/src/app.js      화면과 드래그 앤 드롭
blocks/test/           규칙 테스트
```

## 잇다 — 한붓 숫자 잇기 (`itda/`)

1에서 시작해 숫자를 순서대로 지나며 모든 칸을 한 번씩 채우고 마지막 숫자에서 끝내는 경로 퍼즐. 굵은 벽은 넘을 수 없습니다.

- 500단계, 단계마다 난이도 무작위: 쉬움(5–6칸) · 보통(6–7칸, 벽) · 어려움(7–8칸, 벽 많고 단서 최소)
- 모든 단계는 해가 하나뿐 (생성 시 솔버로 검증)
- 끌어서 그리기, 지나온 칸을 되짚으면 되돌아감, 되돌리기·처음부터
- 타이머, 단계별 최고 기록, 완료 표시 (localStorage)

```
itda/src/puzzle.js              규칙: 경로 연장·되돌리기·완성 판정
itda/src/board.js               SVG 판 그리기, 포인터(터치) 입력
itda/src/main.js                화면 전환, 타이머
itda/src/storage.js             진행 저장
itda/tools/generate-levels.mjs  백바이트 알고리즘으로 무작위 해밀턴 경로 → 해가 하나로 유지되는 한 단서 제거
```

```sh
node itda/tools/generate-levels.mjs   # itda/levels.json 재생성 (고정 시드)
```

## 낙하 (`drop/`)

10×20 판에 떨어지는 네 칸짜리 블록 7종을 쌓아 가로줄을 채우면 지워집니다. 블록이 나올 자리가 막히면 게임 끝.

- 조작(휴대폰): 탭 회전 · 좌우로 끌기 이동 · 아래로 끌기 천천히 내리기 · 아래로 튕기기 바로 놓기 · 위로 튕기기 또는 보관 칸 탭 보관
- 조작(키보드): ←→ 이동, ↓ 내리기, ↑/X 회전, Z 반대 회전, Space 바로 놓기, C/Shift 보관, P/Esc 일시정지
- 7종을 한 묶음씩 섞어 내보내기(같은 블록 가뭄 없음), 다음 3개 미리보기, 착지 위치 미리보기, 보관(블록당 1번)
- 점수: 1·2·3·4줄 = 100·300·500·800 × 레벨, 내리기 1칸 1점, 바로 놓기 1칸 2점. 10줄마다 레벨이 오르고 빨라짐
- 바닥에 닿은 뒤 0.5초 안에 움직이면 고정이 미뤄짐(최대 15번). 앱이 가려지면 자동 일시정지. 최고 점수 저장

```
drop/src/pieces.js   블록 모양·회전, 7종 묶음 섞기
drop/src/engine.js   규칙: 이동·회전(벽 밀어내기)·중력·고정·줄 지우기·점수
drop/src/render.js   캔버스 그리기
drop/src/input.js    터치 제스처·키보드
drop/src/app.js      게임 루프, 화면
drop/test/           규칙 테스트
```

## 차례 (`charye/`)

판에 흩어진 숫자를 1부터 차례로 누르는 게임. 누른 칸에는 아직 안 나온 다음 숫자가 나타나고, 마지막 숫자까지 다 나오면 누른 칸은 빈칸으로 남습니다.

- 300단계: 5×5부터 10×10까지 크기마다 50단계. 크기마다 첫 단계는 칸 수만큼(5×5는 1–25), 단계마다 마지막 숫자가 하나씩 늘어남 (5×5 50단계는 1–74, 10×10 50단계는 1–149)
- 숫자 배치는 매번 무작위. 앞 단계를 깨면 다음 단계가 열림
- 시간은 1을 누르는 순간부터. 틀린 숫자는 빨갛게 흔들리기만 하고 벌점 없음. 단계별 최고 기록 저장
- 칸은 손가락이 닿는 순간 눌림(빠른 연타용). 결과 창은 마지막 손가락을 뗀 뒤 뜸

```
charye/src/stages.js  단계 번호 → 판 크기·마지막 숫자
charye/src/round.js   한 판의 규칙: 배치, 누르기, 다음 숫자 채우기
charye/src/main.js    화면, 시간, 단계 열림
charye/test/          규칙 테스트
```

## 출차 (`chulcha/`)

6×6 주차장에서 블록을 밀어 길을 열고 노란 블록을 오른쪽 출구로 빼내는 퍼즐. 블록은 놓인 방향(가로/세로)으로만 움직입니다.

- 500단계, 최소 15수 판에서 시작해 마지막엔 40수 안팎까지 고르게 어려워짐. 단계마다 최소 몇 수에 풀리는지 표시
- 블록을 끌면 손가락을 따라 움직이고 놓으면 칸에 맞춰짐. 한 블록을 한 번 옮기면 1수
- 되돌리기·처음부터, 단계별 최소 사용 수 저장, 최소 수로 풀면 노란색 표시
- 퍼즐 생성 (`chulcha/tools/generate-levels.mjs`): 언덕 오르기. 블록 배치를 조금씩 바꿔(추가·제거·이동) 더 어려워지면 채택. 배치의 난이도는 그 블록들이 갈 수 있는 모든 배치를 탐색해 풀린 배치에서 가장 먼 배치까지의 수. 도중에 만난 15수 이상 배치를 모아, 단계마다 목표 수(15→40)에 맞춰 서로 다른 탐색 줄기에서 고르게 뽑음. CPU 코어 수만큼 병렬 실행

```
chulcha/src/board.js    판 규칙: 블록 칸, 밀 수 있는 범위, 완료 판정
chulcha/src/solver.js   최소 수 탐색 (너비 우선)
chulcha/src/main.js     화면, 끌기, 되돌리기
chulcha/test/           퍼즐 검증 (500판, 겹침 없음, 최소 수 일치, 정렬)
```

```sh
node chulcha/tools/generate-levels.mjs 20   # chulcha/levels.json 재생성 (코어당 20분 탐색)
```

## 휴대폰 앱으로 설치

HTTPS 정적 호스팅(GitHub Pages, Netlify, Cloudflare Pages 등)에 올리면 PWA로 설치됩니다.

- Android Chrome: 메뉴 → **홈 화면에 추가**(앱 설치)
- iPhone Safari: 공유 → **홈 화면에 추가**

한 번 열고 나면 오프라인에서도 플레이됩니다 (`sw.js`).

## 스도쿠 기능

- 난이도별 100판 목록, 완료(파란색)·진행 중(점) 표시
- 메모(연필) 모드, 지우기, 실행취소, 힌트
- 틀린 숫자 빨간색 표시, 같은 숫자·행/열/박스 강조
- 정답 입력 시 같은 행/열/박스의 메모 자동 제거
- 타이머, 최고 기록, 진행 상황 자동 저장 (localStorage)
- 키보드: `1-9` 입력, `Backspace`/`0` 지우기, `N` 메모, 방향키 이동, `Ctrl+Z` 실행취소
- 라이트/다크 모드 자동

## 스도쿠 퍼즐 난이도

`sudoku/src/puzzles.js`는 [sudoku-core](https://github.com/komeilmehranfar/sudoku-core)로 생성합니다.
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

## 스도쿠 구조

```
sudoku/index.html, sudoku/styles.css
sudoku/src/app.js        화면·라우팅 (#easy, #easy-12)
sudoku/src/game.js       한 판의 상태: 입력, 메모, 실행취소, 힌트
sudoku/src/sudoku.js     보드 헬퍼 (행/열/박스, PEERS)
sudoku/src/storage.js    진행 저장
sudoku/src/puzzles.js    생성된 퍼즐 데이터
sudoku/scripts/generate-puzzles.mjs
sudoku/test/puzzles.test.mjs
```
