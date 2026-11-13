# 스도쿠

9×9 스도쿠 웹 게임. 초급·중급·상급·최상급 각 100판, 총 400판.

## 실행

ES 모듈을 쓰므로 정적 서버로 엽니다 (빌드 없음).

```sh
npm start            # 또는: python3 -m http.server
```

## 기능

- 난이도별 100판 목록, 완료(파란색)·진행 중(점) 표시
- 메모(연필) 모드, 지우기, 실행취소, 힌트
- 틀린 숫자 빨간색 표시, 같은 숫자·행/열/박스 강조
- 정답 입력 시 같은 행/열/박스의 메모 자동 제거
- 타이머, 최고 기록, 진행 상황 자동 저장 (localStorage)
- 키보드: `1-9` 입력, `Backspace`/`0` 지우기, `N` 메모, 방향키 이동, `Ctrl+Z` 실행취소
- 라이트/다크 모드 자동

## 퍼즐 난이도

`src/puzzles.js`는 [QQwing](https://qqwing.com)으로 생성하며, 풀이에 필요한 기법으로 난이도를 나눕니다.

| 단계 | QQwing 등급 | 필요한 기법 |
|---|---|---|
| 초급 | Simple | 네이키드 싱글 |
| 중급 | Easy | 히든 싱글 |
| 상급 | Intermediate | 페어, 포인팅, 박스/라인 |
| 최상급 | Expert | 추측(가정) 필요 |

모든 퍼즐은 해가 하나뿐이고, 단계 안에서는 주어진 숫자가 많은 순으로 정렬됩니다.

```sh
npm run generate     # 퍼즐 400판 새로 생성
npm test             # 퍼즐 데이터 검증 (개수, 유일해, 정답, 난이도)
```

## 구조

```
index.html, styles.css
src/app.js        화면·라우팅 (#/, #/easy, #/easy/12)
src/game.js       한 판의 상태: 입력, 메모, 실행취소, 힌트
src/sudoku.js     보드 헬퍼 (행/열/박스, PEERS)
src/storage.js    진행 저장
src/puzzles.js    생성된 퍼즐 데이터
scripts/generate-puzzles.mjs
test/puzzles.test.mjs
```
