# spec.md — 2D 학습형 RPG v0.2 계획 (그래픽 업그레이드 · 도시 4곳 추가 · 미니게임 4종 추가 · ZEP 요소)

이 문서는 Build 서브에이전트의 유일한 설계 기준이다. v0.1 spec(git `8cd46f6`의 `spec.md`)을 대체한다. v0.1 코드는 그대로 두고 **확장·교체**한다(3D 시절 같은 전면 삭제는 없다).
프로젝트 루트: `/Users/sungchul/Desktop/play1`. 개발 서버 5173, 프로덕션 서버 3100(3000은 다른 프로세스가 사용 중).

---

## 1. 개요와 v0.2 범위

### 1.1 v0.1 현황(Build의 출발점)
- Phaser 3.90 + Vite 6 + TypeScript strict + vitest(43개 통과) + Express(3100). 서울·파리 2개 도시, 4지선다·OX 미니게임, 몬스터 4종, 아바타 22개 아이템(레이어 합성), 아바타 룸 8×6, 저장 `play1.progress` v2.
- 그래픽은 전부 `src/client/assets/placeholders.ts`가 Canvas로 그린 플레이스홀더(타일 32px, 캐릭터 시트 32px × 3열 × 4행)이며, `manifest.ts`가 교체 지점이다.
- 미니게임은 `src/shared/logic/minigame/{types,quiz,ox,registry}.ts`(순수 로직) + `src/client/scenes/minigames/{MinigameHost,QuizScene,OxScene}.ts`(씬)의 플러그인 구조다.
- 진행 상태는 `shared/logic/reducer.ts`의 `applyAction` 한 곳에서만 바뀌고, 클라이언트는 `session.dispatch()`만 호출한다. `src/shared`는 phaser/DOM/localStorage/Math.random을 쓰지 않는다(grep으로 검증).
- `review.md`(v0.1) 낮음 항목 7개는 미해결이며 **Stage A에서 함께 처리**한다(11.1절 A-0).

### 1.2 v0.2 포함
| 영역 | 내용 |
|---|---|
| 에셋 | Kenney CC0 팩 4개(Roguelike/RPG, Roguelike Modern City, Roguelike Characters, Roguelike Indoors) 시트를 `scripts/fetch-assets.mjs`로 받아 `public/assets/vendor/`에 두고 git에 포함. Galmuri(npm) 픽셀 폰트, world-atlas + topojson-client(npm) 세계지도 윤곽 |
| 그래픽 | 16px 타일을 2배(32px 월드 좌표 유지)로 표시하는 아틀라스 파이프라인, 의미 타일 목록 → 시트 인덱스 매핑(`tileAtlas.ts`), 자동 타일링(물가·길·건물), 도시별 테마, 랜드마크 11종(코드 생성 스프라이트), 캐릭터 파츠 시스템(Kenney 파츠 + 코드 생성 4방향 걷기), 그림자, 몬스터 12종, 세계지도(world-atlas 윤곽 픽셀 렌더), Galmuri 폰트·9-slice 패널 UI, 아바타 룸(Indoors 타일) |
| ZEP 요소 | 머리 위 이름표, NPC 말풍선, 이모지 리액션(1~6 키 + 화면 버튼, 2초), 미니맵(Tab), Web Audio 코드 생성 BGM(도시 6곡 + 세계지도 + 아바타 룸) · 발소리 · 효과음(포인트/정답/오답/UI 클릭 등), 음소거 토글(N 키 + 버튼, 저장) |
| 미니게임 | 짝맞추기(`match`), 지도 위치 찾기(`mapfind`), 순서 맞추기(`order`), 빈칸 채우기(`blank`) 추가. 기존 `quiz`·`ox` 유지. 미션마다 도시당 3종 이상 사용 |
| 도시 | 카이로(아프리카)·뉴욕(북아메리카)·시드니(오세아니아)·리우데자네이루(남아메리카) 추가 → 6대륙 각 1곳. 도시마다 학습 카드 3장, 4지선다 6 + OX 5, 짝 8쌍, 지도 목표 5개, 순서 문제 2개, 빈칸 문장 4개, 40×30 맵, NPC 3명, 미션 5개, 몬스터 2종, 기념품 1개 |
| 서울·파리 | 맵을 새 타일셋·랜드마크로 다시 그림(오브젝트 좌표는 거의 유지), 새 미니게임 미션 각 2개 추가 |
| 아이템 | 22개 유지 + 짙은 피부(`body_dark`) + 도시 테마 착용 4개 + 기념품 가구 4개 = 31개 |
| 저장 | v2 → v3 마이그레이션(`settings.muted`, 새 도시·미션·도장 검증). 기존 v2 저장이 그대로 열린다 |
| 테스트 | 기존 8개 파일 갱신 + 신규(자동 타일링, 건물 사각형, 지리 판정, 미니게임 4종, 해금 규칙(A안 확정), 저장 v3) |

### 1.3 v0.2 제외
- 멀티플레이·서버 계정·서버 저장(10절 설계 고려만). `server/index.js`는 변경 없음
- 베이징·런던·나이로비 콘텐츠(마커는 "준비 중" 유지)
- CC0 음악·효과음 팩, Ninja Adventure·Tiny Dungeon 등 추가 아트 팩 — 3.8에 후속 사이클 후보로 기록만 하며 이번 사이클에는 사용·다운로드하지 않는다(14절 1·3·6·14항 확정)
- 마우스 클릭 이동, 모바일 터치, 게임패드, 다중 저장 슬롯, 클라이언트 자동 테스트

---

## 2. 기술 스택·의존성 변경

- TypeScript strict, Phaser `^3.90.0`(4.x 금지), Vite `^6`, vitest `^3`, Express `^4.21`, Node 20+ — 모두 유지.
- 추가 의존성(`npm install`):

| 패키지 | 버전 | 라이선스 | 용도 |
|---|---|---|---|
| `galmuri` | `^2.40.3` (조사 시 최신 2.40.3) | SIL OFL 1.1 | 한글 픽셀 폰트. `dist/Galmuri11.woff2`(505KB), `Galmuri11-Bold.woff2`(167KB), `Galmuri14.woff2`(565KB), `Galmuri9.woff2`(430KB)만 사용 |
| `world-atlas` | `^2.0.2` | ISC(데이터는 Natural Earth 퍼블릭 도메인) | `land-110m.json`(55,207B) 세계 육지 윤곽 TopoJSON |
| `topojson-client` | `^3.1.0` | ISC | `feature()`로 TopoJSON → GeoJSON 디코딩(ESM `src/index.js`, 67KB) |
| `@types/topojson-client` (dev) | `^3.1.5` | MIT | 타입 |
| `@types/topojson-specification` (dev) | `^1.0.5` | MIT | `Topology` 타입 |

- `package.json` 변경: `"version": "0.2.0"` 유지(이미 0.2.0), `description`을 v0.2로, scripts에 `"assets": "node scripts/fetch-assets.mjs"`, `"assets:check": "node scripts/fetch-assets.mjs --check"`(다운로드 없이 manifest·파일 존재·크기·격자 검증) 추가.
- `tsconfig.json`: `"resolveJsonModule": true` 추가(world-atlas JSON import). `include`에 `scripts`는 넣지 않는다(mjs).
- `vite.config.ts`: 변경 최소. `test.include`는 그대로 `src/shared/**/*.test.ts`. `assetsInclude` 불필요(`?url` import 사용).
- `index.html`: `<style>`에 Galmuri `@font-face` 4개를 **직접 선언하지 않는다** — 폰트는 `src/client/assets/fonts.ts`가 `FontFace` API로 로드한다(5.9절). `font-family` 폴백 목록은 유지.
- `.gitignore`에 `.cache/` 추가(다운로드한 zip 보관 폴더).

---

## 3. 에셋 조사 결과 · 다운로드 목록 · 파이프라인 · 타일 인덱스 도구 · 의미 타일 목록

### 3.1 조사 결과(2026-09-24, WebFetch/HEAD 요청으로 확인)

| 팩 | 공식 페이지 | zip URL(직접 다운로드) | zip 크기 | 타일 규격 | 시트 파일(예상) | 격자 | 게임에 쓸 내용 | 라이선스 |
|---|---|---|---|---|---|---|---|---|
| Roguelike/RPG pack (v1.0, 2015, 1,700+ 타일) | https://kenney.nl/assets/roguelike-rpg-pack | https://kenney.nl/media/pages/assets/roguelike-rpg-pack/12c03cd78b-1677697420/kenney_roguelike-rpg-pack.zip | 715,373 B (≈699KB) | 16×16, 타일 사이 **1px spacing**, margin 0 | `Spritesheet/roguelikeSheet_transparent.png` **968×526** = 57열×31행(1,767칸) — 제3자 자료(NicePNG, samclane.dev의 ImageMagick 57×31 자르기, Phaser 예제 `spacing:1`)로 교차 확인 | 57×31 | 풀·흙·모래·꽃 지면, 물·물가, 흙길, 다리, 울타리, 나무(둥근·침엽)·덤불, 바위, 건물 벽·지붕·문·창, 가구, 표지판, 농경지, UI 패널 조각 | CC0 (zip 안 `License.txt`, https://creativecommons.org/publicdomain/zero/1.0/) |
| Roguelike Characters (v2.0, 2015/2024 시트 수정, 450 에셋) | https://kenney.nl/assets/roguelike-characters | https://kenney.nl/media/pages/assets/roguelike-characters/53ffff4133-1729196490/kenney_roguelike-characters.zip | 63,243 B (≈62KB) | 16×16, 1px spacing | `Spritesheet/roguelikeChar_transparent.png` (예상 918×203 = 54열×12행; 스크립트가 실측·검증) | 54×12(예상) | 몸(피부색 여러 개), 머리카락(여러 모양·색), 셔츠·튜닉·바지·드레스·로브, 모자·후드·투구·왕관, 망토, 방패·무기, 조합 예시 | CC0 |
| Roguelike Modern City (v1.0, 2015, 1,036 에셋) | https://kenney.nl/assets/roguelike-modern-city | https://kenney.nl/media/pages/assets/roguelike-modern-city/0ff3dfff2b-1677694743/kenney_roguelike-modern-city.zip | 519,937 B (≈508KB) | 16×16, 1px spacing | `Spritesheet/roguelikeCity_transparent.png` (예상 628×475 = 37열×28행 = 정확히 1,036칸) | 37×28(예상) | 아스팔트 도로(차선·교차로·횡단보도), 인도, 현대식 건물 벽·창·지붕, 자동차, 가로등·벤치·표지판·신호등·쓰레기통, 도시 나무 | CC0 |
| Roguelike Indoors (v1.0, 2015, 480 에셋) | https://kenney.nl/assets/roguelike-indoors | https://kenney.nl/media/pages/assets/roguelike-indoors/4d5b520b03-1702169567/kenney_roguelike-indoors.zip | 112,227 B (≈110KB) | 16×16, 1px spacing | `Spritesheet/roguelikeIndoor_transparent.png` (예상 458×305 = 27열×18행) | 27×18(예상) | 바닥(나무·타일·카펫), 벽, 문·창, 부엌 가구, 식탁·의자·소파, 침대, 책장, 화분·그림·램프 | CC0 |
| Galmuri | https://github.com/quiple/galmuri , https://galmuri.quiple.dev | npm `galmuri@2.40.3` (unpacked 68.1MB, 47파일 — woff2만 씀) | woff2 4개 합계 ≈1.67MB | Galmuri11 = 12px 디자인(볼드·컨덴스드 있음), Galmuri14 = 15px, Galmuri9 = 10px, Galmuri7 = 8px, GalmuriMono 계열 | `dist/galmuri.css`가 `@font-face` 전부 선언(2.7KB) | — | 한글·라틴·가나·한자 일부 | OFL-1.1 (`dist/LICENSE.txt`) |
| world-atlas | https://github.com/topojson/world-atlas (2023-03 아카이브, 읽기 전용이나 배포는 유지) | npm `world-atlas@2.0.2` (unpacked 8.2MB) | `land-110m.json` 55,207 B | 위경도(WGS84) 구면 좌표, 양자화됨·투영 안 됨 | `land-110m.json`, `countries-110m.json`(107,761B, 미사용) | — | 육지 윤곽(남극 포함) | ISC |
| topojson-client | https://github.com/topojson/topojson-client | npm `topojson-client@3.1.0` | 67,594 B | `feature(topology, topology.objects.land)` → GeoJSON MultiPolygon | — | — | 디코딩 | ISC |

확인된 핵심 사실:
1. **Roguelike Characters에는 걷기 애니메이션 프레임이 없다.** 모든 캐릭터·파츠는 정면(down) 1프레임 정지 스프라이트다(OpenGameArt 배포 페이지 댓글 "the characters come without animations", 팩 설명 "mix and match bodies, clothes and weapons"). 4방향·걷기는 코드로 만든다(5.5절, 14절 1항에서 코드 생성 방식으로 확정).
2. Kenney 시트는 타일 이름이 없다. Build가 3.5절 도구로 인덱스를 눈으로 찾아 `tileAtlas.ts`/`charAtlas.ts`에 적는다.
3. 시트 실제 크기는 Characters/City/Indoors가 "예상"이다. `fetch-assets.mjs`가 PNG 헤더에서 폭·높이를 읽어 `(w+1)%17==0 && (h+1)%17==0`을 검증하고 `manifest.json`에 열·행 수를 기록한다. 예상과 다르면 실측값을 쓰면 되고, 나머지 코드는 manifest의 열 수만 참조한다.
4. 랜드마크(에펠탑·피라미드·자유의 여신상·오페라 하우스·예수상·남산타워·경복궁 등)는 어느 팩에도 없다 → Canvas 코드 생성(5.4절).
5. 야자수·선인장·한옥 지붕·고층 빌딩 유리창 등은 팩에 없거나 부족할 수 있다 → 의미 타일마다 `fallback: 'code'`를 허용(3.6절).

### 3.2 확정된 다운로드 목록(이 목록 외 다운로드 금지)

| # | 파일명(저장 위치) | 출처(URL) | 크기 |
|---|---|---|---|
| 1 | `.cache/assets/kenney_roguelike-rpg-pack.zip` → 추출 `public/assets/vendor/kenney-roguelike-rpg/sheet.png`, `License.txt` | https://kenney.nl/media/pages/assets/roguelike-rpg-pack/12c03cd78b-1677697420/kenney_roguelike-rpg-pack.zip | zip 715,373 B |
| 2 | `.cache/assets/kenney_roguelike-modern-city.zip` → `public/assets/vendor/kenney-roguelike-city/sheet.png`, `License.txt` | https://kenney.nl/media/pages/assets/roguelike-modern-city/0ff3dfff2b-1677694743/kenney_roguelike-modern-city.zip | zip 519,937 B |
| 3 | `.cache/assets/kenney_roguelike-characters.zip` → `public/assets/vendor/kenney-roguelike-characters/sheet.png`, `License.txt` | https://kenney.nl/media/pages/assets/roguelike-characters/53ffff4133-1729196490/kenney_roguelike-characters.zip | zip 63,243 B |
| 4 | `.cache/assets/kenney_roguelike-indoors.zip` → `public/assets/vendor/kenney-roguelike-indoors/sheet.png`, `License.txt` | https://kenney.nl/media/pages/assets/roguelike-indoors/4d5b520b03-1702169567/kenney_roguelike-indoors.zip | zip 112,227 B |
| 5 | `node_modules/galmuri/dist/{Galmuri11,Galmuri11-Bold,Galmuri14,Galmuri9}.woff2` (npm) | npm registry `galmuri@2.40.3` | 504,736 / 166,632 / 564,892 / 429,612 B |
| 6 | `node_modules/world-atlas/land-110m.json` (npm) | npm registry `world-atlas@2.0.2` | 55,207 B |
| 7 | `node_modules/topojson-client` (+ `@types/topojson-client`, `@types/topojson-specification`) (npm) | npm registry | 67,594 B |

zip 안의 실제 경로가 예상(`Spritesheet/roguelikeSheet_transparent.png` 등)과 다를 수 있으므로 스크립트는 정규식 `/Spritesheet\/roguelike\w*_transparent\.png$/i`로 찾고(`_magenta` 버전 무시), 없으면 zip 목록을 출력하고 실패한다.
**이 목록 외의 파일(추가 아트 팩·음악 팩·다른 폰트·지도 데이터 등)은 어느 단계에서도 다운로드하지 않는다**(14절 14항 확정). 필요한 것이 생기면 Build는 완료 보고에 후보로만 적고, 코드 생성 폴백으로 완성한다.

### 3.3 저장 위치와 git 포함
```
public/assets/vendor/
├── LICENSES.md                      # 팩별 출처·라이선스 요약(Kenney CC0 ×4, Galmuri OFL, Natural Earth/world-atlas ISC, topojson-client ISC)
├── manifest.json                    # fetch-assets.mjs가 생성: {pack: {source, zipBytes, zipSha256, file, width, height, cols, rows, fetchedAt}}
├── kenney-roguelike-rpg/sheet.png + License.txt
├── kenney-roguelike-city/sheet.png + License.txt
├── kenney-roguelike-characters/sheet.png + License.txt
└── kenney-roguelike-indoors/sheet.png + License.txt
```
- 시트 PNG 4개(합계 1MB 미만 예상)와 라이선스 텍스트를 **git에 포함**한다(clone만으로 실행 가능; 14절 9항 확정). zip은 `.cache/`(gitignore)에만 둔다.
- 폰트·지도 데이터는 npm 패키지에서 Vite `?url`/JSON import로 가져오므로 리포에 복사하지 않는다.

### 3.4 `scripts/fetch-assets.mjs` 설계 (Node 20+, 외부 패키지 없음)
- `ALLOWLIST`: 위 3.2의 zip URL 4개를 상수 배열로 고정(`{ id, url, expectBytes, dest }`). 명령행 인자로 URL을 받지 않는다. 배열 밖 URL 요청 코드가 없어야 한다(Review가 grep).
- 흐름: `.cache/assets/<name>.zip`이 있고 크기가 `expectBytes`와 같으면 재사용, 아니면 `fetch(url)` → `Buffer` 저장. `--check`면 다운로드 없이 검증만.
- zip 해제는 자체 구현(의존성 없음): End of Central Directory(시그니처 `0x06054b50`)를 끝에서 탐색 → Central Directory 항목 순회(`0x02014b50`) → 파일명·압축 방식(0=stored, 8=deflate)·local header offset → local header(`0x04034b50`)에서 데이터 시작 → `zlib.inflateRawSync` 또는 그대로 복사. 정규식에 맞는 PNG 1개와 `License.txt`만 추출한다.
- PNG IHDR(오프셋 16~23, big-endian width/height)로 크기를 읽고 `(w+1)%17===0 && (h+1)%17===0`을 단언, `cols=(w+1)/17`, `rows=(h+1)/17`을 manifest에 기록. sha256(`node:crypto`)도 기록.
- 출력: `public/assets/vendor/<pack>/sheet.png`, `License.txt`, `manifest.json` 갱신, 콘솔에 팩별 `cols×rows` 표.
- 실패 시 exit 1과 원인(네트워크, 크기 불일치, 패턴 미발견, 격자 불일치).

### 3.5 타일 인덱스 조사 도구
1. **`tools/tile-index.html`**(순수 HTML+JS, 빌드 불필요, Vite가 정적 서빙 → `http://localhost:5173/tools/tile-index.html?sheet=kenney-roguelike-rpg&scale=4`).
   - `manifest.json`을 읽어 열·행을 알아낸 뒤 `/assets/vendor/<sheet>/sheet.png`를 `image-rendering: pixelated`로 `scale`배 확대해 그린다. 17px 간격(16 + spacing 1)으로 격자를 긋고, `scale ≥ 4`이면 각 칸에 **선형 인덱스**(`col + row*cols`)를 작은 글씨로 겹쳐 쓴다.
   - 마우스 호버: 상단 바에 `(col,row) idx=N` 표시와 8배 확대 미리보기. 클릭: 오른쪽 목록에 추가(이름 입력란 포함), `idx`를 클립보드에 복사. [JSON 내보내기] 버튼은 `{ "name": idx, ... }`를 textarea에 출력(그대로 `tileAtlas.ts`에 붙여 넣기).
   - `?sheet=` 값: `kenney-roguelike-rpg | kenney-roguelike-city | kenney-roguelike-characters | kenney-roguelike-indoors`.
   - Build는 브라우저 도구(`mcp__Claude_Browser__*`)로 이 페이지를 열어 스크린샷·줌으로 후보 칸을 찾고 인덱스를 기록한다.
2. **`src/client/scenes/DebugAtlasScene.ts`**: `import.meta.env.DEV`이고 URL에 `?debug=atlas`가 있으면 Boot가 Title 대신 실행. 3.6절 의미 타일 전부와 3.7절 캐릭터 파츠, 몬스터·랜드마크 스프라이트를 이름표와 함께 격자로 보여 준다(페이지 ←/→). 매핑이 틀리면 여기서 바로 보인다. Review 체크리스트에 포함.

### 3.6 의미 타일 목록(`src/client/assets/tileAtlas.ts`의 `TILE_NAMES`)
형식: `name: { sheet: 'rpg'|'city'|'indoor', index: number } | { code: string }`(코드 생성 폴백). 이름은 아래를 **전부** 정의해야 한다(빠지면 `DebugAtlasScene`에서 분홍 칸으로 표시되고 `atlasBuilder`가 콘솔 경고). 같은 인덱스를 여러 이름이 가리켜도 된다.

| 그룹 | 이름 | 비고 |
|---|---|---|
| 지면 | `grass`, `grass_2`, `grass_flower`, `dark_grass`, `dirt`, `sand`, `sand_2`, `dark_sand`, `farm`, `plaza`, `sidewalk`, `crosswalk_h`, `crosswalk_v` | `grass_2/sand_2`는 변주. `plaza`는 밝은 포장. `sidewalk`/`crosswalk`는 City 팩 |
| 흙길(`road_dirt_*`) | `road_dirt_h`, `road_dirt_v`, `road_dirt_cross`, `road_dirt_t_n`, `_t_e`, `_t_s`, `_t_w`, `road_dirt_c_ne`, `_c_nw`, `_c_se`, `_c_sw`, `road_dirt_end_n`, `_end_e`, `_end_s`, `_end_w`, `road_dirt_lone` | 15+1. 팩에 없는 모양은 가장 가까운 것 재사용 허용(예: end → h/v) |
| 돌길(`road_cobble_*`) | 위와 같은 16개 | 서울·파리. RPG 팩의 돌바닥/자갈길. 없으면 `road_dirt_*` 재사용 |
| 아스팔트(`road_asphalt_*`) | 위와 같은 16개 | City 팩(차선·교차로) |
| 물 | `water`, `water_2`, `water_edge_n`, `_e`, `_s`, `_w`, `water_c_ne`, `_nw`, `_se`, `_sw`(바깥 모서리), `water_in_ne`, `_nw`, `_se`, `_sw`(안쪽 모서리, 없으면 `water`), `bridge_h`, `bridge_v`, `sea`, `sea_edge_n/e/s/w` | `sea*`는 바다 테마(색 다른 물). 없으면 `water*` 재사용 |
| 자연 | `tree_round`, `tree_pine`, `tree_palm`, `tree_tropical`, `tree_plane`, `tree_gum`, `bush`, `flower_a`, `flower_b`, `rock`, `rock_2`, `hill`, `cactus` | `tree_palm/tropical/gum/cactus`는 없으면 `{code}` |
| 건물(스타일 × 11) | 스타일 `village, hanok, parisian, sandstone, skyscraper, colorful, modern` 각각: `roof_tl, roof_t, roof_tr, roof_l, roof_m, roof_r, wall_l, wall_m, wall_r, door, window` → 이름 `bld_<style>_<part>` | 팩 지붕색 부족 시 `recolor: 0xRRGGBB`(단색 재칠, 5.2절)로 변주. `hanok`(짙은 기와)·`skyscraper`(유리창)는 `{code}` 폴백 허용 |
| 장식·오브젝트 | `bench`, `lamp`, `fence_h`, `fence_v`, `fence_post`, `wall_stone`, `hedge`, `cafe_table`, `stall_red`, `stall_blue`, `car_yellow`, `car_red`, `car_blue`, `sign_post`, `hydrant`, `trash_can`, `traffic_light` | City 팩 위주 |
| 실내(아바타 룸, 3배 아틀라스) | `floor_wood`, `floor_tile`, `floor_carpet`, `wall_top_a`, `wall_top_b`, `wall_face`, `fur_chair`, `fur_plant`, `fur_rug`(2×2: `_tl,_tr,_bl,_br` 4칸 또는 1칸 확대), `fur_desk`(2×1: `_l,_r`), `fur_bookshelf`(1×2: `_t,_b`), `fur_bed`(2×1: `_l,_r`) | Indoors 팩. 기념품 가구 6개는 `{code}` |
| 아이콘(코드 생성, 팩 미사용) | `icon_coin, icon_lock, icon_pin, icon_pin_gray, icon_stamp, icon_heart, icon_speaker_on, icon_speaker_off, icon_map` | `uiSkin.ts` |

### 3.7 캐릭터 파츠 목록(`src/client/assets/charAtlas.ts`의 `CHAR_PARTS`)
`itemId → { sheet:'char', index, recolor:'mono'|'none', overlay?: 'stripes'|'hanbok_ribbon'|'crown_gem'|'none' } | { code: '<kind>' }`. 아이템 31개 중 착용 25개(몸 3, 머리 4, 옷 5, 모자 6)와 NPC용 추가 파츠(`robe_white`, `dress_plain`)를 정의한다. 5.6절 표가 각 항목의 파츠 종류·색·오버레이를 정한다. Kenney에 비슷한 모양이 없으면 `{code}`(16px 코드 그림)로 대체한다.

### 3.8 후속 사이클 후보(기록용 — 이번 사이클에는 사용·다운로드 금지, 14절 1·3·6항 확정)
| 용도 | 후보 | 라이선스 | URL | 크기 |
|---|---|---|---|---|
| 4방향 걷기 캐릭터·애니 몬스터·음악 | Ninja Adventure Asset Pack (pixel-boy) | CC0 1.0 (페이지 명시) | https://pixel-boy.itch.io/ninja-adventure-asset-pack | zip 89MB(전체) |
| 몬스터 스프라이트 | Kenney Tiny Dungeon (16px, 130 파일) | CC0 | https://kenney.nl/media/pages/assets/tiny-dungeon/f8422efb44-1674742415/kenney_tiny-dungeon.zip | 98,530 B |
| UI 효과음 | Kenney Interface Sounds (100개) | CC0 | https://kenney.nl/media/pages/assets/interface-sounds/fa43c1dd4d-1677589452/kenney_interface-sounds.zip | 834,536 B |
| 발소리·타격음 | Kenney RPG Audio (50개) | CC0 | https://kenney.nl/media/pages/assets/rpg-audio/8e99002d76-1677590336/kenney_rpg-audio.zip | 964,837 B |
| 짧은 음악 | Kenney Music Jingles (85개) | CC0 | https://kenney.nl/media/pages/assets/music-jingles/f37e530b9e-1677590399/kenney_music-jingles.zip | 1,239,525 B |
이 표는 기록용이다. 걷기 캐릭터(Ninja Adventure)·몬스터(Tiny Dungeon)·오디오 팩 모두 이번 사이클에는 쓰지 않고 코드 생성으로 완성한다.

---

## 4. 파일/폴더 구조 변경

`+` 신규, `~` 수정, `-` 삭제. (괄호)는 담당 Stage(11절).

```
play1/
├── package.json (~A)  tsconfig.json (~A)  vite.config.ts (~A)  index.html (~A)  .gitignore (~A)
├── scripts/fetch-assets.mjs (+A)              # 3.4 다운로드·추출·검증
├── tools/tile-index.html (+A)                 # 3.5 시트 인덱스 조사 페이지
├── public/assets/vendor/… (+A)                # 3.3 시트·라이선스·manifest.json
├── server/index.js (유지)
└── src/
    ├── shared/
    │   ├── types.ts (~A,~B,~C)                # CityTheme, LandmarkDef, NpcDef.bubble, EmoteId, Progress.settings / MinigameKind·Spec·Result 확장 / CityId 확정
    │   ├── constants.ts (~A,~B)               # EMOTE_SHOW_MS, BUBBLE_RANGE, MINIMAP 상수 / 미니게임 기본값
    │   ├── content/
    │   │   ├── index.ts (~A,~B,~C)            # validateContent 확장(건물 사각형·랜드마크·테마·풀 크기·미션 종류 ≥3), minigamePool()
    │   │   ├── tiles.ts (~A)                  # 범례 27종(5.3)
    │   │   ├── continents.ts (~C)             # 4개 마커 playable + 해금 규칙(A안 확정)
    │   │   ├── regions.ts (+B)                # 대륙·대양 폴리곤(부록 B), resolveRegion()
    │   │   ├── monsters.ts (~C)               # +8종
    │   │   ├── items.ts (~C)                  # +9개
    │   │   ├── cities/seoul.ts (~A,~B)        # 맵 재작성·테마·랜드마크·말풍선 / 추가 미션 2개
    │   │   ├── cities/paris.ts (~A,~B)
    │   │   ├── cities/{cairo,newyork,sydney,rio}.ts (+C)
    │   │   ├── quizzes/{cairo,newyork,sydney,rio}.ts (+C)
    │   │   └── minigames/{seoul,paris}.ts (+B), {cairo,newyork,sydney,rio}.ts (+C)   # 짝·지도 목표·순서·빈칸 데이터
    │   ├── map/
    │   │   ├── autotile.ts (+A)               # 순수: 비트마스크 → 변형 이름(물·길)
    │   │   └── buildings.ts (+A)              # 순수: '#'/'P' 연결 영역 → 사각형, 건물 파트 배치
    │   ├── logic/
    │   │   ├── geo.ts (+B)                    # 등장방형 투영, 점-다각형 포함, 거리(px/km)
    │   │   ├── missions.ts (~B)               # 별점 보너스, 새 목표 종류
    │   │   ├── reducer.ts (~A,~B)             # settings.setMuted / 미니게임 결과 확장
    │   │   ├── events.ts (~A,~B)              # Action/Event 추가
    │   │   ├── unlock.ts (~C)                 # unlockHint 데이터 기반
    │   │   └── minigame/
    │   │       ├── types.ts (~B)              # 일반화된 MinigameLogic<S,A>, ContentPool
    │   │       ├── quiz.ts, ox.ts (~B)        # act() 명명 통일(answer 유지 가능)
    │   │       ├── match.ts, mapfind.ts, order.ts, blank.ts (+B)
    │   │       └── registry.ts (~B)
    │   ├── save/schema.ts (~A,~C)             # v3, migrate v2→v3
    │   └── __tests__/
    │       ├── autotile.test.ts, buildings.test.ts (+A), save.test.ts (~A,~C), content.test.ts (~A,~B,~C)
    │       ├── geo.test.ts, match.test.ts, mapfind.test.ts, order.test.ts, blank.test.ts (+B), minigame.test.ts, missions.test.ts, reducer.test.ts (~B)
    │       └── unlock.test.ts (~C)
    └── client/
        ├── main.ts (~A)                       # __play1 DEV 가드, 오디오 unlock 리스너
        ├── config.ts (~A,~B)                  # DebugAtlas 씬 / 미니게임 씬 4개 등록
        ├── session.ts (~A)                    # settings 접근자
        ├── storage.ts (유지)
        ├── assets/
        │   ├── manifest.ts (~A)               # vendor 시트 경로·키, 아틀라스 키, 폰트 URL
        │   ├── vendorSheets.ts (+A)           # manifest.json 로드, 시트 → 16px 셀 추출
        │   ├── atlasBuilder.ts (+A)           # 셀 추출·재칠·2배/3배 확대·패킹 → Phaser 텍스처, 프레임 조회
        │   ├── tileAtlas.ts (+A)              # TILE_NAMES 매핑(3.6), 테마별 건물/나무/길 해석
        │   ├── charAtlas.ts (+A,~C)           # CHAR_PARTS 매핑(3.7)
        │   ├── pixelArt.ts (+A)               # 16격자 그리기 헬퍼(px, rect, flipX, shift, recolor, eraseFace, legLift)
        │   ├── avatarCompositor.ts (~A)       # 파츠 합성 + 4방향 3프레임 생성(5.5)
        │   ├── landmarks.ts (+A,~C)           # 랜드마크 코드 스프라이트 11종
        │   ├── monsterArt.ts (+A,~C)          # 몬스터 12종 코드 스프라이트(placeholders에서 이동)
        │   ├── emotes.ts (+A)                 # 이모지 6종 픽셀 아이콘
        │   ├── uiSkin.ts (+A)                 # 9-slice 패널/버튼 텍스처, 아이콘, 핀
        │   ├── worldMap.ts (+A)               # world-atlas → 960×540 픽셀 지도 텍스처
        │   ├── fonts.ts (+A)                  # Galmuri FontFace 로드 대기
        │   └── placeholders.ts (~A)           # 축소: 시트 로드 실패 시 폴백(단색 타일·단순 캐릭터)만 남김
        ├── audio/AudioEngine.ts, sfx.ts, bgm.ts, themes.ts (+A,~C)
        ├── map/buildCityMap.ts (~A)           # 3레이어(ground/deco/objects) + 자동 타일링 + 건물·랜드마크 배치
        ├── entities/
        │   ├── ActorDecor.ts (+A)             # 그림자·이름표·말풍선·이모지를 스프라이트에 부착(플레이어/NPC/원격 공용)
        │   ├── Player.ts (~A), Npc.ts (~A,~C), Monster.ts (~A,~C), spawn.ts (유지)
        ├── scenes/
        │   ├── BootScene.ts (~A)              # 로딩 바, 시트·폰트·지도 로드, 아틀라스 빌드
        │   ├── DebugAtlasScene.ts (+A)
        │   ├── TitleScene.ts (~A,~C), WorldMapScene.ts (~A,~C), CityScene.ts (~A,~B), HudScene.ts (~A,~B), AvatarRoomScene.ts (~A,~C)
        │   └── minigames/MinigameHost.ts (~A,~B), QuizScene.ts (~A), OxScene.ts (~A), MatchScene.ts, MapFindScene.ts, OrderScene.ts, BlankScene.ts (+B)
        └── ui/
            ├── theme.ts (~A), Panel.ts (~A: 9-slice), Button.ts (~A), DialogBox.ts (~A), LearnCard.ts (~A)
            ├── NameTag.ts, SpeechBubble.ts, EmoteBubble.ts, EmoteBar.ts, Minimap.ts (+A)
```
의존 방향은 v0.1과 같다(`client → shared`만). `src/shared/map/*`·`content/regions.ts`·`logic/geo.ts`는 순수 TS(테스트 대상).

---

## 5. 그래픽 시스템 설계

### 5.1 좌표계·스케일
- 월드 좌표는 v0.1 그대로 **타일 32px, 맵 40×30 = 1280×960, 카메라 zoom 1, 960×540 뷰포트**. 물리 상수(`PLAYER_SPEED` 등)·엔티티 body 크기·`tileCenter`·미니게임·저장 모두 변경 없음.
- 16px 원본 아트는 **텍스처를 만들 때 2배(nearest-neighbor) 업스케일**해서 32px 프레임으로 등록한다(`atlasBuilder`). Phaser `pixelArt: true, roundPixels: true`와 `Scale.FIT` 유지(14절 8항 확정). 따라서 화면의 아트 픽셀 1개 = 캔버스 2×2px로, 모든 코드 생성 아트(몬스터·랜드마크·아이콘·이모지)도 **16px 격자로 그린 뒤 2배**해 픽셀 밀도를 맞춘다(`pixelArt.ts`의 `px(x,y,c)`는 2×2 사각형을 찍는다).
- 아바타 룸만 3배(16 → 48px 칸)로 별도 아틀라스를 만든다(5.10).

### 5.2 아틀라스 빌더(`client/assets/atlasBuilder.ts`, `vendorSheets.ts`)
1. `BootScene.preload`: `manifest.json`(`this.load.json`)과 시트 4개(`this.load.image('sheet:rpg', 'assets/vendor/kenney-roguelike-rpg/sheet.png')` 등)를 로드. 실패하면 `placeholders.ts` 폴백으로 진행하고 HUD/Title에 "에셋 미설치: `npm run assets` 실행" 경고 1회.
2. `vendorSheets.cell(sheet, index)`: `col = index % cols, row = floor(index / cols)`, 원본 픽셀 `(col*17, row*17, 16, 16)`을 `drawImage`로 16×16 캔버스에 복사(스페이싱 1px는 이렇게 건너뛰므로 Phaser `spacing` 설정 불필요).
3. `atlasBuilder.build(name, entries, scale)`: 이름 → 16×16 셀(또는 코드 그림 함수) 목록을 받아 `scale`배로 확대해 한 캔버스에 격자(16열)로 패킹하고 `textures.addCanvas` + `tex.add(frameName, …)`으로 **이름 프레임**을 등록. 반환: `frameIndex(name) → number`(Tilemap용 정수 인덱스)와 `frameName(name)`.
   - 재칠(`recolor`): 셀의 불투명 픽셀마다 밝기 `L`을 구해 `item.color`의 HSL 밝기에 `L`을 곱한 색으로 바꾼다(단색 파츠·지붕 변주용). 투명도는 유지.
   - 픽셀 번짐 방지: 타일 아틀라스는 프레임 사이에 2px 여백을 두고 각 프레임 가장자리를 1px 바깥으로 복제(extrude)한다. Tilemap 타일셋 등록은 `map.addTilesetImage(key, key, 32, 32, margin, spacing)`으로 여백을 알려 준다.
4. 아틀라스 3개: `atlas:tiles`(3.6 지면~장식, 2배), `atlas:room`(실내, 3배), `atlas:char`(파츠 원본 16px, 합성 전용 — 텍스처 등록 없이 캔버스만 보관).

### 5.3 타일맵 렌더링(`content/tiles.ts`, `shared/map/*`, `client/map/buildCityMap.ts`)

**범례 v0.2(27종, id 0~15는 v0.1과 동일)**

| 문자 | id | 이름 | 충돌 | 렌더 | 문자 | id | 이름 | 충돌 | 렌더 |
|---|---|---|---|---|---|---|---|---|---|
| `.` | 0 | grass | × | 테마 지면 + 변주 | `*` | 15 | flower | × | 지면 + `flower_a/b` 데코 |
| `,` | 1 | darkGrass | × | `dark_grass`(몬스터 존) | `-` | 16 | sidewalk | × | `sidewalk` |
| `=` | 2 | road | × | 테마 길 자동 타일링 | `x` | 17 | crosswalk | × | 이웃 길 방향에 따라 `crosswalk_h/v` |
| `~` | 3 | water | ○ | 물 자동 타일링(강/바다 테마) | `p` | 18 | palm | ○ | 지면 + `tree_palm` |
| `B` | 4 | bridge | × | 이웃 물 방향에 따라 `bridge_h/v` | `d` | 19 | dirt | × | `dirt` |
| `T` | 5 | tree | ○ | 지면 + 테마 나무 | `f` | 20 | fence | ○ | 이웃에 따라 `fence_h/v/post` |
| `R` | 6 | rock | ○ | `rock`/`hill`(덩어리 안쪽은 `hill`) | `b` | 21 | bench | ○ | 지면 + `bench` |
| `#` | 7 | building | ○ | 사각형 감지 → 건물 파트 | `l` | 22 | lamp | ○ | 지면 + `lamp` |
| `S` | 8 | sand | × | `sand` + 변주 | `t` | 23 | cafeTable | ○ | 지면 + `cafe_table` |
| `s` | 9 | darkSand | × | `dark_sand` | `m` | 24 | stall | ○ | 지면 + `stall_red/blue`(교대) |
| `F` | 10 | farm | × | `farm` | `v` | 25 | car | ○ | `sidewalk` + `car_*`(교대) |
| `Y` | 11 | streetTree | ○ | 지면 + 테마 가로수 | `Q` | 26 | plaza | × | `plaza` |
| `P` | 12 | landmark | ○ | 지면만(스프라이트는 5.4) | | | | | |
| `W` | 13 | wall | ○ | `wall_stone`/`hedge`(테마) | | | | | |
| `E` | 14 | entrance | × | 길 타일 + 출입구 표시 데코 | | | | | |

`tiles.ts`는 v0.1 API(`tileForChar`, `isWalkable`, `rowsToGrid`, `SOLID_TILE_IDS`)를 유지하고 항목만 늘린다. v0.1 맵 문자열은 그대로 유효하다.

**CityDef 확장(`types.ts`)**
```ts
export type BuildingStyle = 'village' | 'hanok' | 'parisian' | 'sandstone' | 'skyscraper' | 'colorful' | 'modern';
export type TreeKind = 'round' | 'pine' | 'palm' | 'tropical' | 'plane' | 'gum';
export type RoadStyle = 'dirt' | 'cobble' | 'asphalt';
export interface CityTheme { ground: 'grass' | 'sand'; road: RoadStyle; building: BuildingStyle; tree: TreeKind; streetTree: TreeKind; water: 'river' | 'sea'; wall: 'stone' | 'hedge'; bgm: BgmId }
export type LandmarkKind = 'gyeongbokgung' | 'namsan_tower' | 'eiffel' | 'arc' | 'louvre' | 'notredame' | 'pyramids' | 'sphinx' | 'mosque' | 'museum' | 'empire' | 'liberty' | 'opera' | 'harbour_bridge' | 'maracana' | 'christ' | 'sugarloaf';
export interface LandmarkDef { id: string; kind: LandmarkKind; at: TilePos /* 좌상단 */; w: number; h: number; overhang?: number /* 위로 튀어나오는 타일 수 */; solid?: boolean /* 기본 true: 사각형이 전부 'P' */ }
export interface CityDef { …v0.1…; theme: CityTheme; landmarks: LandmarkDef[] }
export interface NpcDef { …v0.1…; bubble: string /* 말풍선 12자 이내 */ }
```

**레이어와 그리기(`buildCityMap`)**
- Tilemap 레이어 3개(모두 `atlas:tiles` 타일셋): `ground`(깊이 0, 충돌 없음), `deco`(깊이 1, 꽃·출입구 표시·횡단보도, 충돌 없음), `objects`(깊이 2, 나무·바위·건물·울타리·벤치·가로등·테이블·노점·차·담, `setCollision`으로 충돌). 플레이어·NPC·몬스터·랜드마크는 `setDepth(y)`로 y 정렬(오브젝트 레이어보다 깊이가 크므로 나무 위를 걸으면 캐릭터가 앞에 그려진다 — v0.1과 같은 규칙, 충돌 타일이라 겹치는 건 머리 부분뿐).
- 충돌은 v0.1처럼 **범례의 `solid`**로 결정한다(렌더 결과와 무관). `objects` 레이어에는 solid 타일 자리에만 프레임을 놓고 나머지는 -1.
- 지면 결정: `.`은 테마 `ground`(`grass`/`sand`), 변주는 `hash(tx,ty)`(순수 함수 `shared/map/autotile.ts`의 `variant(tx,ty,n)`)로 85% 기본, 10% `_2`, 5% 꽃/조약돌. `S/s/d/F/Q/-`는 고정.
- 물 자동 타일링(`autotile.waterMask(rows, tx, ty)` → 8방향 비트 → `waterVariant(mask)`): 4방향 이웃이 물이 아니면 가장자리(`water_edge_*`), 두 변이 열리면 바깥 모서리(`water_c_*`), 대각선만 열리면 안쪽 모서리(`water_in_*`, 없으면 `water`). 다리·출입구·맵 밖은 물로 간주. 바다 테마면 `sea*` 이름 우선.
- 길 자동 타일링(`autotile.roadMask` 4방향, 이웃이 `=`·`B`·`E`·`x`면 연결): 0100/0001 등 → `_h/_v/_cross/_t_*/_c_*/_end_*/_lone`. 테마 `road`에 따라 `road_dirt_*` 등 접두사.
- 건물(`shared/map/buildings.ts`): `#` 4연결 영역을 찾아 **반드시 w≥2, h≥2 사각형**(아니면 `validateContent` 오류). 파트 배치: 지붕 행 수 `rh = max(1, floor(h/2))`; 위 `rh`행은 `roof_*`(첫 행 `roof_tl/t/tr`, 나머지 `roof_l/m/r`), 아래 행들은 `wall_*`; **맨 아래 행** 가운데 열(`x0 + floor(w/2)`)은 `door`, 그 양옆 짝수 칸은 `window`. 스타일별 이름 `bld_<style>_<part>`. 같은 도시 안 건물마다 `hash(x0,y0)`로 지붕 재칠 색을 팔레트에서 골라 변주(`CITY_ROOF_PALETTE[style]` 3~4색).
- 오브젝트 교대: `m`(노점)은 `hash`로 빨강/파랑, `v`는 노랑/빨강/파랑, `T`는 테마 나무(`tree`), `Y`는 `streetTree`.
- 미니맵 색표(`Minimap.ts`): grass 0x5fa84a, darkGrass 0x3f8a3a, road 0xc9b48a(아스팔트 0x555a66), sidewalk 0xbdbdbd, water 0x3a7bd5(바다 0x2a6fbf), bridge 0x9c6b3c, tree/palm/streetTree 0x2e7d32, rock 0x7d7d7d, building 0xa0443c, sand 0xe6d5a0, darkSand 0xcbb77f, farm 0x8a6b3c, landmark 0xffd166, wall/fence 0x8a8a8a, plaza 0xdcd3c0, 기타 solid 0x6d6d6d, entrance 0xffffff.

### 5.4 랜드마크(`client/assets/landmarks.ts`)
- `drawLandmark(kind, w, h, overhang) → HTMLCanvasElement` (아트 크기 `w*16 × (h+overhang)*16`, 2배 등록 키 `landmark:<kind>`). `buildCityMap`이 `LandmarkDef`마다 `this.add.image(at.tx*32, (at.ty - overhang)*32, key).setOrigin(0,0).setDepth((at.ty + h) * 32)`(바닥 y로 정렬). `solid:false`(오버레이)는 충돌 없이 `deco` 위에만 그린다.
- 종류와 크기(타일): `gyeongbokgung` 6×4(+1 지붕), `namsan_tower` 2×2(+3), `eiffel` 2×2(+3), `arc` 2×2(+1), `louvre` 8×3(+1, 가운데 유리 피라미드), `notredame` 2×2(+2 쌍탑), `pyramids` 4×3(+1, 큰 피라미드 1 + 작은 피라미드 2), `sphinx` 2×2(+0), `mosque` 4×3(+2 첨탑·돔), `museum` 4×3(+0, 분홍 신고전 건물 "이집트 박물관"), `empire` 2×3(+4), `liberty` 2×2(+3), `opera` 4×2(+2 흰 돛 지붕 3개), `harbour_bridge` 2×8(+1, `solid:false`, 다리 위 아치), `maracana` 4×3(+0, 타원 경기장), `christ` 2×2(+3, 팔 벌린 흰 동상), `sugarloaf` 3×3(+2, 둥근 바위산 + 케이블카).
- 그리기 규칙: 16격자·팔레트 6색 이내·1px 외곽선(어두운 색)·아래쪽 그림자 1px. 각 kind는 20~40줄의 `px/rect/tri` 호출로 구성한다.

### 5.5 캐릭터 시스템(`charAtlas.ts`, `pixelArt.ts`, `avatarCompositor.ts`, `entities/ActorDecor.ts`)
플레이어·NPC·(이후) 원격 플레이어가 같은 파이프라인을 쓴다(코드 생성 걷기 — 14절 1항 확정). 출력 규격은 v0.1과 동일: **32px 프레임, 3열(걷기1·정지·걷기2) × 4행(down/left/right/up) = 96×128 시트**, `ensureCharAnims`·`animKey`·`idleFrame`·`textureKeyFor(scene, equip)` API 유지 → `Player/Npc/AvatarRoom` 코드 변화 최소.

1. `partCanvas(itemId) → 16×16`: `CHAR_PARTS[itemId]`가 `{sheet,index}`면 `vendorSheets.cell('char', index)` 복사 후 `recolor:'mono'`면 `item.color`로 재칠, `overlay`가 있으면 코드로 덧그림(`stripes`: 몸통 영역에 2px 간격 가로 줄무늬 `item.color`, `hanbok_ribbon`: 가슴에 흰 옷고름 2×3px, `crown_gem`: 가운데 빨간 점). `{code}`면 `pixelArt.drawPart(kind, color)`.
2. `composeFront(equip) → 16×16`: `body → top → hair → hat` 순서로 겹친다(v0.1 순서 유지).
3. `makeFrames(front, bodyPart)`: 12프레임 생성(모두 16×16, 마지막에 2배로 시트에 배치)
   - `down.idle = front`
   - `down.walk1 = legLift(front, 'left')`, `down.walk2 = legLift(front, 'right')`. `legLift`: 불투명 픽셀이 있는 가장 아래 행을 `feet`로 잡고, `feet-2..feet` 행에서 가운데 열(`x=7,8`)을 기준으로 왼쪽/오른쪽 픽셀 그룹을 다리로 본다. 지정한 다리의 픽셀을 1px 위로 옮기고(맨 아래 행 비움) 반대 다리는 그대로 → 발이 번갈아 들리는 2프레임. 추가로 몸통(행 `< feet-2`)을 위로 1px 옮겨 살짝 바운스.
   - `right.* = lean(down.*, +1)`: 머리 영역(불투명 픽셀이 있는 첫 행부터 5행)을 오른쪽으로 1px 옮겨 방향감을 준다. `left.* = flipX(right.*)`.
   - `up.*`: `bodyBack = eraseFace(bodyPart)` — 몸 파츠에서 머리 영역(위 8행) 안의 어두운 픽셀(밝기 < 90, 피부색과 다른 색: 눈·입)을 피부색(파츠에서 가장 많은 불투명 색)으로 채운 뒤 `bodyBack → top → hair → hat`으로 다시 합성하고 같은 `legLift`를 적용한다. 머리카락·모자는 그대로라 뒷모습으로 보인다.
   - 재생: 기존 `ensureCharAnims`(`[walk1, idle, walk2, idle]` 8fps) 그대로.
4. 캐시: `textureKeyFor`는 v0.1처럼 조합 키로 캐시. 파츠 16px 캔버스도 `Map`에 캐시. NPC/플레이어 텍스처는 도시 재입장 시 재생성 없음(v0.1 리뷰 조건 유지).
5. **그림자·장식(`ActorDecor`)**: `attach(scene, sprite, { name?, nameColor?, showBubble? })` → 발밑 타원 그림자(`shadow` 텍스처 16×6 → 2배, alpha 0.35, depth = sprite.depth − 1), 이름표(6.1), 말풍선(6.2), 이모지(6.3)를 만들고 `update()`에서 스프라이트 위치를 따라간다. `destroy()`로 함께 제거. 원격 플레이어 스프라이트에도 그대로 붙일 수 있게 Phaser 스프라이트만 받는다(엔티티 클래스 의존 없음).
6. 발소리: `Player.update`에서 걷기 애니 프레임이 `walk1`/`walk2`로 바뀔 때마다 `sfx.step(theme.ground)`(6.5). 이동이 멈추면 없음.

### 5.6 아바타 아이템 → 파츠 매핑 표(Build가 `index`를 채운다; 색은 `ItemDef.color`)
| itemId | 슬롯 | 파츠 종류(Kenney 시트에서 찾을 모양) | 재칠 | 오버레이/폴백 |
|---|---|---|---|---|
| body_light / body_tan / body_dark(신규, 0P, 기본 보유) | body | 기본 몸(팔 내린 정면). 피부색은 시트의 밝은/중간/어두운 몸을 각각 고르거나 하나를 골라 `mono` 재칠 | none 또는 mono | — |
| hair_short_black | hair | 짧은 머리 | mono | — |
| hair_long_brown | hair | 긴 생머리 | mono | — |
| hair_curly_red | hair | 곱슬/뭉친 머리 | mono | — |
| hair_pony_blue | hair | 포니테일(없으면 긴 머리 + `{code}` 꼬리) | mono | code 허용 |
| top_tshirt_blue | top | 반팔 셔츠 | mono | — |
| top_hoodie_green | top | 후드/튜닉 | mono | — |
| top_hanbok | top | 로브/드레스 | mono | `hanbok_ribbon` |
| top_mariniere | top | 셔츠(흰색 기준) | none(흰) | `stripes`(0x1f3c88) |
| top_brazil(신규, 40P) | top | 셔츠 | mono(0xf9d342 노랑) | `stripes` 대신 초록 깃 1px(`{code}` 허용) |
| hat_cap_red | hat | 챙 있는 모자 | mono | — |
| hat_gat | hat | 넓은 챙 모자(없으면 `{code}`) | mono | code 허용 |
| hat_beret | hat | 베레/둥근 모자 | mono | — |
| hat_crown | hat | 왕관 | mono(0xffc300) | `crown_gem` |
| hat_pharaoh(신규, 45P) | hat | 파라오 머리 장식 — `{code}`(파랑·금 줄무늬 네메스) | — | code |
| hat_liberty(신규, 45P) | hat | 7갈래 왕관 — `{code}`(청록) | — | code |
| hat_cork(신규, 40P) | hat | 챙 모자 + 코르크 점 3개 | mono(0xb08850) | `{code}` 점 |
| NPC 전용 `robe_white`, `dress_plain` | top | 로브, 드레스 | mono | 상점 미판매(`ItemDef` 없이 `charAtlas`에만) |

가구 6개(`fur_chair … fur_bed`)는 Indoors 셀(3.6 실내 그룹)로, 기념품 6개(남산타워·에펠탑·피라미드·자유의 여신상·오페라 하우스·예수상 모형)는 `{code}` 16×16(3배)로 그린다. 상점 카드 아이콘은 착용 파츠 16px 캔버스 2배, 가구는 룸 텍스처를 32px로 축소 표시(`setDisplaySize`).

NPC 외형(`Npc.ts`의 `NPC_LOOKS`, 모두 위 파츠 조합) — 기존 6명 유지, 신규 12명:
| NPC | body | top | hair | hat |
|---|---|---|---|---|
| 아미르(카이로 guide) | body_tan | robe_white | hair_short_black | — |
| 나디아(카이로 teacher) | body_tan | top_tshirt_blue | hair_long_brown(검정 재칠 0x222222 변형은 불필요, 그대로) | — |
| 카림(카이로 guard) | body_dark | top_hoodie_green | hair_short_black | hat_cap_red |
| 에밀리(뉴욕 guide) | body_light | top_hoodie_green | hair_long_brown | — |
| 노아(뉴욕 teacher) | body_tan | top_tshirt_blue | hair_curly_red | hat_cap_red |
| 잭슨(뉴욕 guard) | body_dark | top_tshirt_blue | hair_short_black | hat_cap_red |
| 올리비아(시드니 guide) | body_light | top_tshirt_blue | hair_pony_blue | — |
| 잭(시드니 teacher) | body_tan | top_hoodie_green | hair_short_black | hat_cork |
| 루비(시드니 guard) | body_dark | top_hoodie_green | hair_curly_red | — |
| 루카스(리우 guide) | body_tan | top_brazil | hair_short_black | — |
| 이자벨라(리우 teacher) | body_dark | dress_plain | hair_long_brown | — |
| 페드루(리우 guard) | body_light | top_tshirt_blue | hair_curly_red | hat_cap_red |

### 5.7 몬스터 12종(`client/assets/monsterArt.ts`, `content/monsters.ts`)
- 아트(코드 생성 확정, 14절 3항): 16격자 코드 그림(2배), 프레임 3×4 시트(기존 `registerSheet` 규격). 프레임 0/2는 1px 바운스 또는 날개/꼬리 변화, 좌우는 `flipX`, up은 눈 생략. 팔레트 4~5색 + 1px 외곽선. v0.1의 4종은 같은 컨셉으로 16격자에 다시 그린다.
- 새 8종 수치(단위 px·초, v0.1 표와 같은 필드):

| id | 도시 | 이름 | 컨셉 | HP | 공격 | 속도 | 감지 | 사거리 | 간격 | 리쉬 | 포인트 | 리스폰 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| scarab | 카이로 | 반짝 풍뎅이 | 파란빛 도는 둥근 딱정벌레(스카라베) | 25 | 6 | 60 | 140 | 24 | 1.2 | 220 | 2 | 25 |
| mummy_cat | 카이로 | 붕대 고양이 | 붕대를 감은 하얀 고양이, 느리지만 튼튼 | 40 | 9 | 55 | 160 | 28 | 1.4 | 260 | 4 | 30 |
| pizza_rat | 뉴욕 | 피자 생쥐 | 피자 조각을 든 회색 생쥐, 빠름 | 20 | 5 | 85 | 150 | 24 | 1.0 | 240 | 2 | 25 |
| taxi_bug | 뉴욕 | 노란 택시 벌레 | 노란 택시 무늬 무당벌레 | 35 | 8 | 90 | 160 | 24 | 1.1 | 260 | 3 | 30 |
| kangaroo | 시드니 | 통통 캥거루 | 주머니에 새끼가 든 갈색 캥거루, 점프 바운스 | 35 | 8 | 75 | 150 | 26 | 1.2 | 240 | 3 | 30 |
| seagull | 시드니 | 심술 갈매기 | 감자튀김을 노리는 흰 갈매기 | 20 | 5 | 85 | 140 | 24 | 1.0 | 220 | 2 | 25 |
| monkey | 리우 | 장난꾸러기 원숭이 | 바나나 든 작은 갈색 원숭이(마모셋) | 25 | 6 | 80 | 150 | 24 | 1.0 | 240 | 2 | 25 |
| toucan | 리우 | 큰부리새 | 주황 큰 부리의 검은 새(투칸) | 30 | 7 | 70 | 150 | 26 | 1.2 | 240 | 3 | 30 |

### 5.8 세계지도(`client/assets/worldMap.ts`)
1. `import land from 'world-atlas/land-110m.json'`(타입 `Topology`), `feature(land, land.objects.land)` → `MultiPolygon`.
2. 480×270 오프스크린 캔버스에 바다색(0x2f5f9e)을 채우고, 각 링의 `[lon,lat]`을 `lonLatToXY(…, 480, 270)`(기존 `continents.ts` 함수, 폭·높이 인자)로 투영해 `Path2D`로 육지(0x86c46a)를 채운다(`evenodd`). 남위 60° 아래는 얼음색(0xe8f1f8)으로 덮는다(남극).
3. 2배 nearest 확대(960×540) 후 육지 가장자리에 1px 어두운 외곽선(이웃 픽셀이 바다인 육지 픽셀을 0x4f8a3f로), 30° 간격 경위선(알파 0.08), 적도(0.2)를 그린다. `TEX.worldmap`으로 등록. `placeholders.createWorldMapTexture`는 폴백으로만 남긴다.
4. 마커 좌표는 `lonLatToXY` 그대로이므로 위치가 맞는다. 핀·자물쇠·도장 아이콘은 `uiSkin.ts` 16px 픽셀 아이콘(2배). 라벨은 Galmuri(대륙 15px 볼드 + 검은 외곽선, 대양 12px 이탤릭 대신 밝은 파랑).
5. 같은 텍스처를 `MapFindScene`(7.2)이 0.8배로 재사용한다.

### 5.9 UI(`fonts.ts`, `uiSkin.ts`, `ui/*`, `theme.ts`)
- 폰트 로드: `fonts.ts`가 `import url from 'galmuri/dist/Galmuri11.woff2?url'` 등 4개를 `new FontFace('Galmuri11', \`url(${url})\`)`로 만들어 `document.fonts.add` 후 `Promise.all(load())`에 3초 타임아웃(`Promise.race`)을 걸어 Boot에서 기다린다. 실패해도 진행(폴백 폰트). Phaser Text 생성 전에 로드가 끝나야 폭 계산이 맞으므로 Boot의 `create` 전에 await한다(Phaser 씬에서 `preload`의 커스텀 로더 대신 `create`를 `async`로 두고 끝나면 `scene.start`).
- 크기 규칙(`theme.ts`): Galmuri는 비트맵 기반이라 **디자인 크기의 정수배**로만 쓴다. `font.small = 'Galmuri11' 12px`, `font.body = 'Galmuri14' 15px`, `font.bold = 'Galmuri11 Bold' 12px`(강조 소형), `font.title = 'Galmuri11' 24px`(2배), `font.big = 'Galmuri14' 30px`. 기존 `textStyle()`/`titleStyle()`은 이 값을 쓰도록 바꾸고 `fontSize` 오버라이드는 위 5개 중 하나만 허용한다(리뷰 grep: 다른 px 값 사용 금지).
- 9-slice(`uiSkin.ts`): 24×24(3×3, 8px 셀) 패널 텍스처를 코드로 그린다 — 짙은 남색 채움(0x2b2d4a), 2px 밝은 테두리(0x8f9bff), 모서리 픽셀 깎기, 안쪽 1px 하이라이트. 버튼용 `btn`(보통/호버/눌림/비활성 4장)과 말풍선용 `bubble`(흰 바탕·검은 테두리 + 꼬리 별도 이미지)도 생성. `Panel`은 `this.add.nineslice(x, y, 'ui:panel', undefined, w, h, 8, 8, 8, 8)`로 재구현(API 유지: `Panel(scene,x,y,{width,height,title,…})`, `bg`는 nineslice 객체로 바뀌고 `redraw`는 크기·틴트만).
- `Button`·`DialogBox`·`LearnCard`·툴팁·상점 카드·미니게임 패널을 모두 새 스킨·폰트로 통일. 색 팔레트는 v0.1 `THEME` 유지(강조 0xffd166, 성공 0x6bd77b, 위험 0xff6b6b).
- HUD 상단 바: 이름·등급·코인·HP를 한 줄 패널로 정리(`ui:panel` 반투명).

### 5.10 아바타 룸(`AvatarRoomScene.ts`)
- 격자 8×6, 칸 48px 유지. 바닥은 `atlas:room`의 `floor_wood`(칸마다), 위쪽 벽 띠는 `wall_top_a/b` 1행(칸 48 높이 → 벽 텍스처 3배로 정확히 맞음), 좌우 가장자리 `wall_face` 세로 띠 없음(간단히).
- 가구 텍스처: Indoors 셀을 3배로 등록(`fur:<id>`), 2×2 러그는 4셀 또는 1셀 확대, 2×1/1×2는 2셀 조합. 기념품은 `{code}`. 미리보기 아바타는 16px 합성 프레임을 6배(96px)로 표시(정수배).
- 상단 문구 겹침(v0.1 리뷰 낮음 항목) 해결: 제목을 벽 띠 위 패널 제목 자리로 이동.

---

## 6. ZEP 요소 설계

### 6.1 이름표(`ui/NameTag.ts`)
- 머리 위 `y - 26`에 `Galmuri11 12px` 흰 글자 + 반투명 검정 둥근 배경(글자 폭 + 8, 높이 16). 플레이어는 `progress.profile.name`(변경 이벤트 `profile.changed`에 반영), NPC는 `def.name`(역할별 색: guide 0xffd166, teacher 0x8ecbff, guard 0xa5ff9b), 원격 플레이어는 스냅샷의 이름. 몬스터는 없음(HP 바 유지).
- NPC의 `!`/`?` 마커는 이름표 위 `y - 44`로 올린다.

### 6.2 NPC 말풍선(`ui/SpeechBubble.ts`)
- 플레이어가 NPC와 `BUBBLE_RANGE = 96px` 이내로 들어오면 `def.bubble`(12자 이내, 예 "봉주르!")을 흰 9-slice 말풍선(꼬리 아래)으로 이름표 위에 0.5초 페이드 인, 벗어나면 페이드 아웃. 대화창이 열려 있으면 숨김. 프레임마다 텍스트를 다시 만들지 않는다(NPC당 1개 생성, 표시/숨김만).

### 6.3 이모지 리액션(`assets/emotes.ts`, `ui/EmoteBubble.ts`, `ui/EmoteBar.ts`)
- 6종(`EmoteId`): `smile`(1) 😊, `heart`(2) ❤, `laugh`(3) 😂, `wow`(4) 😮, `thumbs`(5) 👍, `question`(6) ❓ — 16px 픽셀 아이콘을 코드로 그린다(시스템 이모지 폰트 미사용, 픽셀 스타일 통일).
- 입력: City에서 숫자키 1~6(`JustDown`, 모달·미니게임 중 무시) 또는 HUD 왼쪽 아래 `EmoteBar`(아이콘 6개, 클릭). 표시: 머리 위 `y - 48`에 아이콘(2배 32px)이 튀어나오며(스케일 0.6→1 트윈 150ms) `EMOTE_SHOW_MS = 2000` 후 사라짐. 같은 시간에 다시 누르면 교체. `sfx.emote()`.
- 구조: `ActorDecor.showEmote(id)`로 어떤 스프라이트에도 붙는다. 진행 상태(`Progress`)에는 저장하지 않는다. 멀티 대비 `session.events.emit('presence.emote', { id })`를 발생시킨다(현재 수신자 없음).

### 6.4 미니맵(`ui/Minimap.ts`)
- HUD 오른쪽 위(도시명 아래), 40×30 타일 × 4px = 160×120 + 2px 테두리. 도시 진입 시 `rows`를 5.3 색표로 한 번 `Graphics`에 그려 `generateTexture`(정적). 그 위에 플레이어 점(노랑 3×3, 매 프레임 위치 갱신), NPC 점(파랑 2×2), 출입구(흰 2×2), 카메라 뷰포트 사각형(흰 선, 알파 0.6). 몬스터는 표시하지 않는다(탐색 재미).
- Tab 키로 표시/숨김(`keyboard.addCapture(TAB)`으로 브라우저 포커스 이동 방지). 미션 추적창은 미니맵 아래로 내린다.

### 6.5 오디오(`client/audio/*`, Web Audio API, 파일 없음)
- `AudioEngine`(싱글턴): `AudioContext`는 첫 사용자 입력에서 만든다 — `main.ts`가 `window`에 `pointerdown`/`keydown` 1회 리스너를 달아 `engine.unlock()`(`ctx.resume()`) 호출. 그래프: `master(0.6) ← bgmGain(0.35), sfxGain(0.6)`. `setMuted(b)`: master 0/0.6, `progress.settings.muted`와 동기화(`session.dispatch({type:'settings.setMuted'})`). `document.visibilitychange`로 숨김 시 BGM 스케줄 정지·복귀 시 재개.
- **SFX(`sfx.ts`)**: 오실레이터 + 게인 엔벌로프. `click`(square 880Hz 40ms), `open`(triangle 440→660Hz 80ms), `correct`(triangle C5-E5-G5 각 70ms), `wrong`(sawtooth 220→110Hz 200ms + lowpass), `coin`(square 1200→1800Hz 60ms ×2), `step(ground)`(노이즈 버스트 25ms, grass: lowpass 700Hz, sand: 1200Hz, road/sidewalk/plaza: 2500Hz 짧게, 다리: 400Hz), `hit`(노이즈 60ms + square 150Hz), `hurt`(sawtooth 300→120Hz 150ms), `defeat`(square 800→1600→400 "뿅"), `emote`(sine 700→1000Hz 80ms), `stamp`(C5-E5-G5-C6 4음 팡파르), `unlock`(triangle 상승 아르페지오 6음), `flip`(카드 뒤집기, square 500Hz 30ms). 호출 지점: HUD 이벤트 핸들러(포인트 +, 미션 완료, 해금, 도장), 미니게임(정답·오답·클릭·카드 뒤집기), 버튼(`Button` pointerdown → `click`), 전투(`Player.takeHit` → hurt, `Monster.hit` → hit, `die` → defeat), 이모지, 대화창 열기(`open`).
- **BGM(`bgm.ts`, `themes.ts`)**: 스텝 시퀀서. 25ms `setInterval`로 0.12초 앞까지 노트를 예약(룩어헤드 스케줄링). 트랙 3개: `lead`(square, 게인 0.12), `bass`(triangle, 0.18), `drums`(kick: sine 150→40Hz 100ms, snare: 노이즈 80ms + bandpass 1.8kHz, hat: 노이즈 20ms highpass 6kHz). 패턴 형식:
  ```ts
  export type Step = [note: string /* 'C5' | '-' */, beats: number];
  export type DrumStep = [kind: 'k' | 's' | 'h' | 'ks' | '-', beats: number];
  export interface BgmTheme { id: BgmId; bpm: number; beatsPerBar: 3 | 4; lead: Step[]; bass: Step[]; drums: DrumStep[]; leadWave?: OscillatorType; swing?: number /* 0~0.3 */ }
  export type BgmId = 'world' | 'room' | 'seoul' | 'paris' | 'cairo' | 'newyork' | 'sydney' | 'rio';
  ```
  세 트랙의 총 박 수는 같아야 하며(테스트 대신 `themes.ts` 로드 시 `console.assert`) 끝나면 처음부터 반복. 분위기 지침(각 8~16마디, 부록 C에 `world` 전체 예시):
  | id | BPM·박자 | 음계·리듬 | 씬 |
  |---|---|---|---|
  | world | 72, 4/4 | C장조 아르페지오, 드럼 없음(hat만 약하게), 잔잔한 여행 느낌 | Title(첫 입력 후)·WorldMap |
  | room | 84, 4/4 | F장조 로파이, kick+hat 느리게 | AvatarRoom |
  | seoul | 108, 4/4 | 5음계(C D E G A) 국악풍 선율, 드럼 장단(kick-hat-snare-hat) | 서울 |
  | paris | 150, 3/4 | G장조 왈츠(bass 1박 + lead 2·3박), 아코디언 느낌 square | 파리 |
  | cairo | 100, 4/4 | 히자즈 음계(D Eb F# G A Bb C), 낮은 bass 지속음, 사막 느낌 | 카이로 |
  | newyork | 126, 4/4 | 12마디 블루스(C7-F7-G7), swing 0.2, 워킹 베이스 | 뉴욕 |
  | sydney | 132, 4/4 | A장조 밝은 서프 리듬, 8분음 hat | 시드니 |
  | rio | 104, 4/4 | 보사노바(Am7-D7), 싱코페이션 bass, hat 16분 | 리우 |
- 씬 연결: `WorldMap.create → bgm.play('world')`, `City.create → bgm.play(city.theme.bgm)`, `AvatarRoom → 'room'`, 미니게임 진입 시 `bgm.duck(0.4)`·종료 시 `duck(1)`. 같은 곡이면 재시작하지 않는다. 씬 shutdown에서 정지하지 않고 다음 씬이 `play`로 교체(크로스페이드 300ms).
- HUD·WorldMap·AvatarRoom 오른쪽 위에 스피커 버튼(아이콘 `icon_speaker_on/off`), N 키 토글. 음소거는 저장(9절).

---

## 7. 미니게임 4종 설계

### 7.0 공통 인터페이스 변경(`shared/logic/minigame/types.ts`, `shared/types.ts`)
```ts
export type MinigameKind = 'quiz' | 'ox' | 'match' | 'mapfind' | 'order' | 'blank';
export type MinigameSpec =
  | { kind: 'quiz' | 'ox'; cityId: CityId; topics?: QuizTopic[]; count: number; passCount: number }   // v0.1 그대로
  | { kind: 'match'; cityId: CityId; pairs: 6 | 8; maxAttempts: number }
  | { kind: 'mapfind'; cityId: CityId; count: number; passCount: number }
  | { kind: 'order'; cityId: CityId; count: number; passCount: number; triesPerQuestion: number }
  | { kind: 'blank'; cityId: CityId; count: number; passCount: number };
export interface MinigameResult { kind: MinigameKind; success: boolean; correct: number; total: number; answeredIds: string[]; stars?: 1 | 2 | 3 }

export type RegionId = ContinentId | 'pacific' | 'atlantic' | 'indian' | 'arctic' | 'southern';
export interface MatchPair { id: string; cityId: CityId; topic: QuizTopic; left: string; right: string }
export interface MapTarget { id: string; cityId: CityId; prompt: string; hint: string;
  target: { type: 'city'; id: CityId } | { type: 'region'; id: RegionId } }
export interface OrderItem { id: string; cityId: CityId; prompt: string; direction: 'asc' | 'desc';
  items: { label: string; value: number; note?: string }[] /* 3~5개, 정답 = value를 direction으로 정렬 */; explanation: string }
export interface BlankItem { id: string; cityId: CityId; text: string /* '[0]', '[1]'이 빈칸 */;
  blanks: { answer: string; options: [string, string, string, string] }[] /* 1~2개, options에 answer 포함 */; explanation: string }
export interface ContentPool { quiz: QuizItem[]; pairs: MatchPair[]; mapTargets: MapTarget[]; orders: OrderItem[]; blanks: BlankItem[] }

export interface ActFeedback { correct: boolean; explanation: string }
export interface MinigameLogic<S, A> {
  kind: MinigameKind;
  create(spec: MinigameSpec, pool: ContentPool, seed: number): S;   // 모든 난수는 mulberry32(seed)
  act(s: S, action: A): ActFeedback;                                // 상태를 제자리 변경
  isDone(s: S): boolean;
  result(s: S): MinigameResult;
}
export interface QuizLikeLogic<S> extends MinigameLogic<S, number | boolean> { current(s: S): QuizItem | null }
```
- `quiz.ts`/`ox.ts`: `answer` → `act`로 이름 통일(`QuizLikeLogic` 구현, `current` 유지). `registry.ts`: `MINIGAME_LOGIC: Record<MinigameKind, MinigameLogic<any, any>>`. `content/index.ts`: `minigamePool(cityId): ContentPool`(`quizPool`은 유지).
- `MinigameHost.ts`: `MINIGAME_SCENE = { quiz:'Quiz', ox:'Ox', match:'Match', mapfind:'MapFind', order:'Order', blank:'Blank' }`. `MinigameBaseScene`에서 공통 껍데기 `MinigameShellScene`(어두운 배경, 820×460 패널, 제목, 진행 텍스트, 입력 유예 300ms, 결과 패널, `emitDone` 1회 보장, SFX 훅 `onCorrect/onWrong/onClick`)을 분리하고, 퀴즈 베이스와 새 씬 4개가 이를 상속한다. 결과 패널은 `stars`가 있으면 ★ 표시와 보너스 포인트를 함께 보여 준다.
- 미션 연결: `MissionObjective`는 그대로(`{ type:'minigame', spec }`). `missions.applyMinigameResult`는 성공 시 `rewardPoints + STAR_BONUS[result.stars ?? 1]`(`{1:0, 2:5, 3:10}`)를 지급하고 `progress.stats.minigames += 1`. `quizAnswered/quizCorrect`는 quiz/ox만 누적. 실패 시 v0.1처럼 `attempts++`·`active` 유지·재도전 무제한.
- `validateContent` 추가 검사: 미션 spec별 풀 크기(`match`: 쌍 ≥ `pairs`, `mapfind`/`order`/`blank`: 항목 ≥ `count`), `passCount ≤ count`, `BlankItem.text`의 `[n]` 개수 = `blanks.length`이고 `options`에 `answer` 포함, `OrderItem.items` 3~5개·value 중복 없음, `MapTarget.target.id`가 마커/영역에 존재, **도시마다 미니게임 미션 종류가 3개 이상**.
- 실패 조건(14절 13항 확정): match 6쌍 14회(8쌍 20회) 안에 전부 맞추기, mapfind 5문항 중 4개, order 2문제 모두(문제당 2회), blank 4문장 중 3개. 실패해도 재도전 무제한(v0.1과 동일).

### 7.1 짝맞추기 `match` (`shared/logic/minigame/match.ts`, `client/scenes/minigames/MatchScene.ts`)
- 데이터: `MatchPair`(도시당 8쌍, 부록 A). 스펙 기본 `{ pairs: 6, maxAttempts: 14 }` → 카드 12장(4열×3행). `pairs: 8`이면 16장(4×4), `maxAttempts: 20`.
- 상태: `{ spec, cards: { pairId, side:'left'|'right', text }[], faceUp: number[], matched: boolean[], attempts, done }`.
- 로직: `create` = 풀에서 `cityId` 쌍을 시드로 섞어 `pairs`개 선택(풀이 모자라면 있는 만큼), 카드 2N장을 시드로 섞음. `act(s, { type:'flip', index })`: 이미 맞춘 카드·이미 뒤집힌 카드·`faceUp.length === 2`이면 무시(`{correct:false, explanation:''}`). 2장이 되면 `attempts++`; 같은 `pairId`면 `matched` 표시 후 `faceUp = []`, `{correct:true, explanation:'왼쪽 — 오른쪽'}`; 다르면 `{correct:false, explanation:'다시 기억해 봐요'}`이고 씬이 700ms 뒤 `act(s, { type:'hide' })`로 되돌린다. `isDone` = 전부 맞춤 또는 `attempts ≥ maxAttempts`. `result`: `success` = 전부 맞춤(시도 한도 안), `correct` = 맞춘 쌍 수, `total` = N, `stars`(성공 시): `attempts ≤ N+2` → 3, `≤ 2N` → 2, 그 외 1.
- 테스트(`match.test.ts`): 같은 시드 동일 배치·다른 시드 상이, 카드 2N장에 각 pairId 정확히 2번, 같은 카드 두 번 뒤집기 무시, 세 번째 카드 무시, 맞춤/불일치 흐름과 `hide`, 별점 경계(N+2, 2N), 시도 한도 실패, 풀 부족 시 축소.
- 씬: 카드 150×90(4×3) / 150×66(4×4), 뒷면 = 9-slice 패널 + "?", 앞면 = 텍스트(`font.body`, 워드랩). 마우스 클릭 또는 방향키 커서 이동 + Enter/Space. 상단 `시도 n / max`, `남은 짝 k`. 맞추면 초록 고정, 틀리면 빨강 깜빡임 후 뒤집힘(`sfx.flip/correct/wrong`). 첫 뒤집기 전 1.5초 동안 전체 카드를 보여 주는 "미리보기"는 **없다**(기억 게임 유지). 결과 패널에 ★.

### 7.2 지도 위치 찾기 `mapfind` (`shared/logic/minigame/mapfind.ts`, `shared/logic/geo.ts`, `shared/content/regions.ts`, `client/scenes/minigames/MapFindScene.ts`)
- 데이터: `MapTarget` 도시당 5개(부록 A). `target.type:'city'`는 `CITY_MARKERS`의 경위도를 정답으로 하고 허용 반경 `MAPFIND_CITY_RADIUS_PX = 36`(960×540 기준 ≈ 경도 13.5°). `type:'region'`은 부록 B 폴리곤으로 판정.
- `geo.ts`(순수): `lonLatToXY/xyToLonLat(w,h)`, `pointInPolygon(lon, lat, poly)`(레이 캐스팅, `lon`·`lon±360` 모두 시도해 날짜변경선 처리), `resolveRegion(lon, lat): RegionId | null`(대륙 6개 먼저, 그다음 대양; `lat ≥ 68`이고 대륙 밖이면 `arctic`, `lat ≤ -58`이면 `southern`), `distancePx(a, b)`.
- 로직: `create` = 시드로 `count`개 선택. `act(s, { lon, lat })`: 현재 목표가 도시면 `distancePx(투영(click), 투영(marker)) ≤ 36`, 영역이면 `resolveRegion === id`. 문항당 1회 답변, 정답 여부와 `hint`(오답 시)·정답 위치를 피드백에 담아 다음으로. `result.success = correct ≥ passCount`.
- 테스트(`geo.test.ts`, `mapfind.test.ts`): `resolveRegion` 대표 좌표 — (127,37.5)→asia, (2,49)→europe, (20,5)→africa, (-100,45)→north_america, (-60,-15)→south_america, (135,-25)→oceania, (-150,0)→pacific, (170,-40)→pacific(뉴질랜드 부근은 오세아니아 폴리곤 안이라 oceania — 테스트는 (-140,-30)→pacific), (-35,15)→atlantic, (78,-25)→indian, (0,80)→arctic, (0,-70)→southern; 날짜변경선 근처 (179,0)·(-179,0)→pacific; 도시 반경 안/밖; 채점·합격 경계·결정론.
- 씬: 세계지도 텍스처(5.8)를 0.8배(768×432)로 패널 안에 배치(라벨·마커 없음). 상단 프롬프트("카이로는 어디일까요?"), 하단 진행. 마우스 클릭으로 답하고, 키보드는 십자선(방향키 8px, Shift로 32px, Enter 확정). 답변 후: 클릭 지점 핀(빨강/초록)과 정답 표시(도시: 노란 핀 + 이름, 영역: 폴리곤 외곽선 Graphics 강조) 1.5초(클릭으로 스킵) 후 다음. `sfx.correct/wrong`.

### 7.3 순서 맞추기 `order` (`shared/logic/minigame/order.ts`, `client/scenes/minigames/OrderScene.ts`)
- 데이터: `OrderItem` 도시당 2개(부록 A). 스펙 기본 `{ count: 2, passCount: 2, triesPerQuestion: 2 }`.
- 로직: `create` = 시드로 `count`개 선택, 문항마다 초기 배열은 시드 셔플하되 정답과 같으면 다시 섞음. 상태 `{ questions: { item, arrangement: number[], tries, solved, revealed }[], index }`. `act(s, { type:'swap', a, b })`/`{ type:'move', from, to }`는 배열만 바꾸고 `{correct:false, explanation:''}`. `act(s, { type:'submit' })`: 정답이면 `solved`·`correct:true`; 아니면 `tries++`, 제자리에 있는 항목 수를 설명에 담아(`"2개가 제자리에 있어요"`) `correct:false`; `tries ≥ triesPerQuestion`이면 `revealed`(정답 순서 공개) 후 다음 문항. `result.correct` = solved 수.
- 테스트(`order.test.ts`): 초기 배열이 정답이 아님, swap/move, 정답 제출, 시도 한도 후 공개·다음, 결정론, `direction:'desc'` 처리.
- 씬: 항목 카드(140×90, 최대 5개) 가로 배치, 왼쪽에 "1번째 →" 표시, 아래 [제출] 버튼. 키보드: ←/→ 커서, Space로 집기/놓기(집은 상태에서 ←/→는 이웃과 교환), Enter 제출. 마우스: 카드를 드래그해 다른 자리에 놓으면 `move`, 클릭-클릭은 `swap`. 제출 후 카드마다 초록/빨강, 설명 표시, 공개 시 정답 순서로 재배열 애니메이션(300ms).

### 7.4 빈칸 채우기 `blank` (`shared/logic/minigame/blank.ts`, `client/scenes/minigames/BlankScene.ts`)
- 데이터: `BlankItem` 도시당 4개(부록 A). 스펙 기본 `{ count: 4, passCount: 3 }`.
- 로직: `create` = 시드로 `count`개 선택, 빈칸마다 보기 순서 시드 셔플(정답 인덱스 재계산). 상태 `{ items, index, chosen: (number|null)[] }`. `act(s, { type:'choose', blank, option })` 선택(설명 없음), `act(s, { type:'submit' })`: 빈칸이 하나라도 비었으면 `{correct:false, explanation:'빈칸을 모두 채워요'}`이고 진행하지 않음, 모두 채웠으면 전부 정답일 때만 `correct:true`, 설명에 정답 문장을 담아 다음 문항. `result.correct` = 맞힌 문장 수.
- 테스트(`blank.test.ts`): `[n]` 파싱(문장 조각 수 = 빈칸 + 1), 보기 셔플 후 정답 유지, 미완성 제출 거부, 채점, 결정론.
- 씬: 문장을 조각으로 렌더(`font.body`)하고 빈칸은 밑줄 박스(선택 값 표시, 현재 빈칸은 강조). 보기 버튼 4개(키 1~4), 선택하면 다음 빈칸으로 이동, Tab으로 빈칸 순환, 빈칸이 1개면 선택 즉시 자동 제출, 2개면 Enter/[제출]. 피드백: 빈칸별 초록/빨강 + 설명.

### 7.5 도시별 미니게임 배분(전체)
| 도시 | quiz | ox | match | mapfind | order | blank | defeat |
|---|---|---|---|---|---|---|---|
| 서울 | m_seoul_quiz | m_seoul_ox | m_seoul_match(신규) | m_seoul_map(신규) | — | — | m_seoul_defeat |
| 파리 | m_paris_quiz | m_paris_ox | — | — | m_paris_order(신규) | m_paris_blank(신규) | m_paris_defeat |
| 카이로 | m_cairo_quiz | m_cairo_ox | m_cairo_match | m_cairo_map | — | — | m_cairo_defeat |
| 뉴욕 | m_newyork_quiz | m_newyork_ox | — | — | m_newyork_order | m_newyork_blank | m_newyork_defeat |
| 시드니 | m_sydney_quiz | — | m_sydney_match | m_sydney_map | — | m_sydney_blank | m_sydney_defeat |
| 리우 | m_rio_quiz | m_rio_ox | — | — | m_rio_order | m_rio_blank | m_rio_defeat |
(모든 도시가 미니게임 3종 이상, 6종 모두 2곳 이상에서 사용)

---

## 8. 도시 콘텐츠와 해금 규칙(요약 — 전문은 부록 A)

### 8.1 도시 개요
| cityId | 이름 | 대륙 | 테마(ground/road/building/tree/streetTree/water/wall/bgm) | 출입구 → 스폰(방향) | NPC(guide/teacher/guard) | 몬스터 | 랜드마크 | 기념품 |
|---|---|---|---|---|---|---|---|---|
| seoul | 서울 | 아시아 | grass/cobble/hanok/round/plane/river/stone/seoul | (0,10) → (2,10) right | 한별/온유/호랑 | dust_dokkaebi, magpie | 경복궁, 남산타워 | 남산타워 모형 |
| paris | 파리 | 유럽 | grass/cobble/parisian/round/plane/river/hedge/paris | (39,10) → (37,10) left | 마리/루이/피에르 | pigeon, gargoyle | 개선문, 루브르, 노트르담, 에펠탑 | 에펠탑 모형 |
| cairo | 카이로 | 아프리카 | sand/dirt/sandstone/palm/palm/river/stone/cairo | (39,10) → (37,10) left | 아미르/나디아/카림 | scarab, mummy_cat | 피라미드, 스핑크스, 모스크, 이집트 박물관 | 피라미드 모형 |
| newyork | 뉴욕 | 북아메리카 | grass/asphalt/skyscraper/round/round/sea/hedge/newyork | (39,14) → (36,14) left | 에밀리/노아/잭슨 | pizza_rat, taxi_bug | 엠파이어 스테이트 빌딩, 자유의 여신상 | 자유의 여신상 모형 |
| sydney | 시드니 | 오세아니아 | grass/asphalt/modern/gum/palm/sea/hedge/sydney | (39,15) → (37,15) left | 올리비아/잭/루비 | kangaroo, seagull | 오페라 하우스, 하버 브리지(오버레이) | 오페라 하우스 모형 |
| rio | 리우데자네이루 | 남아메리카 | grass/asphalt/colorful/tropical/palm/sea/hedge/rio | (0,9) → (2,9) right | 루카스/이자벨라/페드루 | monkey, toucan | 마라카낭, 예수상, 팡지아수카르 | 예수상 모형 |

`CityId` 타입은 v0.1의 9개 그대로(베이징·런던·나이로비는 `comingSoon`). `PLAYABLE_CITIES` 순서: seoul, paris, cairo, newyork, sydney, rio.

### 8.2 해금 규칙
- **확정(A안, 자유 여행 — 14절 2항)**: 서울 `m_seoul_quiz`·`m_seoul_ox` 보고 완료 시 파리·카이로·뉴욕·시드니·리우 5곳이 동시에 열린다(`continents.ts` 마커 5개의 `unlock: { type:'missionsTurnedIn', missionIds:['m_seoul_quiz','m_seoul_ox'] }`). 학습용으로 대륙을 자유롭게 비교하며 다닐 수 있다. 세계지도 안내 문구: "서울 퀴즈 2개를 풀면 5개 도시가 모두 열려요".
- 확장 경로(이번 사이클 미구현): 순차 해금이 필요해지면 마커의 `unlock.missionIds` 데이터만 바꾸면 된다(예: 카이로 ← `m_paris_quiz`). 그래서 `unlockHint(marker)`는 미션 제목을 조합해 생성한다(`"서울 지리 퀴즈·서울 OX 퀴즈를 완료하면 열려요"`).
- 도장: 새 도시 4곳은 미션 5개 전부 `turnedIn` → 도장 + 기념품. 서울·파리 `stampMissionIds`는 v0.1의 3개를 유지한다(추가 미션 2개는 보너스; 기존 도장 보유자와 규칙 충돌 없음) — 14절 5항 확정.
- `city.unlocked` 이벤트가 5개 동시에 나오면 HUD 로그는 "파리·카이로·뉴욕·시드니·리우가 열렸어요!" 한 줄로 합친다(HudScene에서 같은 프레임의 이벤트를 모아 처리).

### 8.3 서울·파리 추가 미션
| id | 도시 | NPC | 목표 | 보상 | 선행 |
|---|---|---|---|---|---|
| m_seoul_match | 서울 | 한별(guide) | match: 서울 짝 6쌍, 14회 안에 | 30(+★보너스) | m_seoul_quiz |
| m_seoul_map | 서울 | 온유(teacher) | mapfind: 5문항 중 4개 | 30 | m_seoul_ox |
| m_paris_blank | 파리 | 마리(guide) | blank: 4문장 중 3개 | 30 | m_paris_quiz |
| m_paris_order | 파리 | 루이(teacher) | order: 2문제 모두(문제당 2번) | 30 | m_paris_ox |
NPC `missionIds` 순서: 한별 `['m_seoul_quiz','m_seoul_match']`, 온유 `['m_seoul_ox','m_seoul_map']`, 마리 `['m_paris_quiz','m_paris_blank']`, 루이 `['m_paris_ox','m_paris_order']`. 선행 미션 보고 시 `unlockDependents`가 `locked → available`로 바꾸고 HUD "새 미션" 로그(v0.1 구현 그대로).

### 8.4 아이템 추가(`items.ts`, 총 31개 — 14절 4항 확정)
| id | 슬롯 | 이름 | 가격 | 비고 |
|---|---|---|---|---|
| body_dark | body | 짙은 피부 | 0 | 기본 보유(STARTER) |
| hat_pharaoh | hat | 파라오 머리 장식 | 45 | 카이로 문화, color 0x2a6fd6 |
| hat_liberty | hat | 자유의 여신상 왕관 | 45 | 뉴욕, color 0x7fc8a9 |
| hat_cork | hat | 코르크 모자 | 40 | 시드니, color 0xb08850 |
| top_brazil | top | 브라질 축구 유니폼 | 40 | 리우, color 0xf9d342 |
| fur_souvenir_cairo | furniture | 피라미드 모형 | 0 | 1×1, `unlockStamp:'cairo'` |
| fur_souvenir_newyork | furniture | 자유의 여신상 모형 | 0 | 1×1, `unlockStamp:'newyork'` |
| fur_souvenir_sydney | furniture | 오페라 하우스 모형 | 0 | 1×1, `unlockStamp:'sydney'` |
| fur_souvenir_rio | furniture | 예수상 모형 | 0 | 1×1, `unlockStamp:'rio'` |
포인트 예산: 도시당 미션 5개(40+30×4 = 160, ★보너스 최대 +10)+카드 15 ≈ 175, 서울·파리는 기존 100+카드 15+추가 60 ≈ 175 → 6도시 약 1,050 + 몬스터. 유료 아이템 합계 750(v0.1 580 + 170) → 전부 클리어하면 모든 아이템 구매 가능, 절반 진행이면 절반 정도. 상점 탭 "가구"에 기념품 6개가 늘어나므로 카드 4열 × 최대 3행 → 12칸 초과 시 스크롤 대신 페이지 버튼(◀ ▶) 추가.

### 8.5 콘텐츠 작성 규칙
초등 5~6학년 사회 수준, 사실 확인 가능한 것만(12.4 검증표), 외래어 표기법(리우데자네이루·코르코바두·팡지아수카르·본다이·캔버라·애버리지니·맨해튼·워싱턴 D.C.·칸 엘 칼릴리). 시차 서술은 표준시 기준이며 서머타임을 괄호로 병기한다(14절 11항 확정)(이집트는 2023년부터 서머타임 재시행, 미국·오스트레일리아 시행, 브라질은 2019년 폐지).

---

## 9. 저장 v3(`shared/save/schema.ts`)
```ts
export const SAVE_VERSION = 3;
export interface SaveData { version: 3; savedAt: number; progress: Progress }
export interface Progress { …v0.1…; settings: { muted: boolean }; stats: { defeated: number; quizAnswered: number; quizCorrect: number; minigames: number } }
```
- `migrate(raw)`: `version === 2` → `progress.settings = { muted:false }`, `stats.minigames = 0`, `version = 3`로 바꾼 뒤 `validate`; `3` → `validate`; 그 외 `null`(새 게임). v1 계열 키 `play1.save`는 계속 삭제.
- `validate` 추가: `settings.muted`는 boolean(아니면 false), `stats.minigames` 음이 아닌 정수, `stamps`·`lastCity`는 `isPlayableCityId`(이제 6곳), `missions`는 `ALL_MISSIONS`(26개) 기준 표를 만들고 저장에 있는 항목만 덮어씀(새 미션은 자동으로 `available`/`locked`), 저장의 `owned`에 없는 `body_dark`는 STARTER라 자동 추가, v0.1 리뷰 낮음 항목(잘못된 status → 해당 미션 기본값 복원 시 `stamps`와 불일치)은 "`stamps`에 있는 도시의 `stampMissionIds`는 강제로 `turnedIn`"으로 보정.
- Action `{ type:'settings.setMuted'; muted: boolean }` → 이벤트 `{ type:'settings.changed'; muted }`. `session.dispatch`가 저장까지 처리(기존 흐름).
- 테스트(`save.test.ts`): v0.1 저장 fixture(v2, 서울 도장·파리 해금·머리 구매·룸 배치 포함)를 `migrate` → v3, `settings.muted === false`, 도장·아이템·배치 유지, 새 미션 26개 표 존재(`m_cairo_quiz` available, `m_seoul_match` locked); `muted:true` 왕복; `stats.minigames` 보정; `stamps:['cairo']`인데 미션이 available이면 `turnedIn`으로 보정; version 1/4/문자열 → null.

---

## 10. 멀티플레이·서버 계정 확장 고려사항
v0.1 7절의 8개 원칙(단일 변경 경로 `applyAction`, shared 순수성, 저장 = 서버 문서, id 안정성, 실시간 상태 분리, `attachRealtime` 접점, `profile.id` 예약, 미니게임 결정론)을 그대로 유지하고 다음을 더한다.
9. **장식은 스프라이트에 붙는다**: `ActorDecor.attach(sprite, …)`는 Phaser 스프라이트만 요구하므로 원격 플레이어 스프라이트(위치 스냅샷 보간)에도 이름표·말풍선·이모지·그림자가 그대로 붙는다. 이모지는 `EmoteId`(shared)로 직렬화되고 `session.events 'presence.emote'`로 방송 훅이 이미 있다(현재 수신자 없음).
10. **프레즌스 타입 예약**(`shared/types.ts`, 미사용): `PresenceSnapshot { id, name, cityId, x, y, facing, moving, avatar: AvatarEquip, emote?: EmoteId }`. 아바타 합성은 `AvatarEquip`만 있으면 어느 클라이언트에서든 같은 텍스처를 만든다(파츠 매핑이 콘텐츠 상수).
11. **새 미니게임도 시드 결정론**: 카드 배치·목표 선택·초기 배열·보기 순서가 모두 `mulberry32(seed)`이므로 서버가 `seed`와 행동 로그로 결과를 재현할 수 있다. 행동 타입(`flip/hide/swap/move/submit/choose/{lon,lat}`)이 JSON 직렬화 가능.
12. **오디오·그래픽·미니맵은 client 전용**이며 `Progress`에 남기는 것은 `settings.muted`뿐이다. 서버는 `settings`를 저장만 하면 된다.
13. **지리 판정·콘텐츠 풀은 shared**(`geo.ts`, `regions.ts`, `content/minigames/*`)라 서버 검증에 재사용 가능.
14. **이름표는 `profile.name`**을 쓰고 `normalizeName`(shared)이 길이를 제한하므로 서버 검증과 일치한다.
15. `server/index.js`는 이번에도 손대지 않는다.

---

## 11. 구현 단계 A / B / C

### 11.0 공통 규칙
- 단계마다 **Build → Review → 커밋**. 각 단계의 Build는 11.4 소유권 표에서 그 단계에 표시된 파일만 만들고 고친다(다음 단계가 같은 파일을 이어서 고치는 것은 허용 — 순차). 표에 없는 파일이 꼭 필요하면 완료 보고에 이유를 적는다.
- 단계 종료 조건(공통): `npm run typecheck`·`npm test`·`npm run build` 통과, 12.1의 grep 전부 OK, 개발 서버에서 해당 단계 브라우저 체크리스트 통과, 콘솔 에러 0.
- spec과 충돌·불명확한 점은 합리적으로 정하고 완료 보고에 "설계 판단"으로 기록한다(spec 수정 금지). 시트 인덱스는 Build가 정하되 `DebugAtlasScene`으로 확인한다.
- 커밋 메시지(메인 세션이 수행): `v0.2 Stage A: asset pipeline, tile atlas, character system, ZEP features` 등.

### 11.1 Stage A — 에셋 파이프라인 + 그래픽 업그레이드 + ZEP 요소
작업 순서:
- **A-0 v0.1 리뷰 낮음 항목 처리**: ① `CityScene.create`가 `buildCityMap`의 반환 `layer`를 사용 ② `Monster.hit` 넉백을 `body.velocity` 기반 짧은 속도(플레이어와 같은 방식)로 ③ 학습 카드 탭 전환 키를 LEFT/RIGHT에서 **`1`/`2`/`3`(탭 직접 선택, 카드가 열린 동안만)** 으로 바꾸고 `Player`와 LEFT/RIGHT 키 객체 공유를 제거(이모지 1~6은 모달이 닫혀 있을 때만 동작하므로 충돌 없음) ④ 아바타 룸 제목 겹침 ⑤ `schema.ts` 잘못된 미션 status 보정(9절) ⑥ `TitleScene`의 `'worldmap'` 리터럴 → `TEX.worldmap` ⑦ `window.__play1`을 `import.meta.env.DEV` 가드.
- **A-1** 의존성·설정: `package.json`(deps 5개, scripts `assets`/`assets:check`), `tsconfig.json`(`resolveJsonModule`), `.gitignore`(`.cache/`), `index.html`(제목 v0.2).
- **A-2** `scripts/fetch-assets.mjs` 작성·실행 → `public/assets/vendor/*`, `manifest.json`, `LICENSES.md`. 완료 보고에 manifest의 실측 `cols×rows`를 적는다.
- **A-3** `tools/tile-index.html` 작성 → 브라우저 도구로 시트를 보며 3.6·3.7의 모든 이름에 인덱스를 배정해 `tileAtlas.ts`·`charAtlas.ts`에 기록(없는 것은 `{code}`). 배정 근거를 파일 주석에 `// rpg 57x31: row 3 col 12 = 풀` 식으로 남긴다.
- **A-4** `vendorSheets.ts`, `atlasBuilder.ts`, `pixelArt.ts`, `manifest.ts` 개편, `placeholders.ts` 축소(폴백 전용), `BootScene`(로딩 바: 시트·폰트·지도 → 아틀라스 빌드 → 저장 로드 → Title; `?debug=atlas`면 DebugAtlas).
- **A-5** `tiles.ts`(27종), `types.ts`(`CityTheme`, `LandmarkDef`, `NpcDef.bubble`, `EmoteId`, `PresenceSnapshot`, `Progress.settings/stats.minigames`), `shared/map/autotile.ts`·`buildings.ts` + 테스트, `buildCityMap.ts` 재작성(3레이어·자동 타일링·건물·랜드마크), `landmarks.ts`(서울·파리 6종), `cities/seoul.ts`·`paris.ts`(부록 A.1·A.2의 v0.2 맵·테마·랜드마크·`bubble`; 오브젝트 좌표는 부록 값), `content/index.ts` 검증 확장(사각형·랜드마크·테마).
- **A-6** 캐릭터: `avatarCompositor.ts` 재작성(5.5), `ActorDecor.ts`, `Player.ts`(그림자·이름표·발소리·이모지), `Npc.ts`(이름표·말풍선·마커 위치), `Monster.ts`(그림자, 새 아트 키), `monsterArt.ts`(기존 4종 16격자 재작업).
- **A-7** 세계지도: `worldMap.ts`, `WorldMapScene.ts`(새 텍스처·픽셀 핀·폰트·BGM·스피커 버튼).
- **A-8** UI: `fonts.ts`, `uiSkin.ts`, `theme.ts`(폰트 5종), `Panel/Button/DialogBox/LearnCard`, `HudScene`(상단 바·미니맵 자리·이모지 바·스피커·로그 위치), `AvatarRoomScene`(실내 아틀라스·미리보기 6배·제목 위치), `TitleScene`(스킨, 첫 입력 후 BGM).
- **A-9** ZEP: `NameTag/SpeechBubble/EmoteBubble/EmoteBar/Minimap`, `emotes.ts`, `CityScene`(1~6 이모지, Tab 미니맵, N 음소거, 말풍선 거리 갱신), `constants.ts`(EMOTE_SHOW_MS 2000, BUBBLE_RANGE 96, MINIMAP_SCALE 4).
- **A-10** 오디오: `AudioEngine/sfx/bgm/themes.ts`(`world/room/seoul/paris` 4곡 완성, 나머지 4개 id는 `seoul` 패턴을 임시 참조), `main.ts` unlock 리스너, 씬 연결, 효과음 훅 배치.
- **A-11** 저장 v3(9절: `settings.muted`, `stats.minigames`, `migrate`, 보정) + `reducer/events`(`settings.setMuted`) + `session.ts` 접근자 + `save.test.ts`·`content.test.ts` 갱신, `DebugAtlasScene.ts`.

완료 기준: 서울·파리가 새 타일셋·랜드마크·자동 타일링으로 그려지고(물가·길 이음새가 자연스러움), 캐릭터가 Kenney 파츠 조합으로 4방향 걷기·그림자·이름표와 함께 움직이며, 아바타 22개 아이템 장착이 모두 보이는 모습이 다르고, 세계지도가 실제 대륙 윤곽이며, Galmuri 폰트·9-slice UI로 통일되고, 이모지·말풍선·미니맵·BGM·효과음·음소거가 동작하고, v0.1 저장이 v3로 열리며, `DebugAtlasScene`에 분홍(누락) 칸이 없다. 기존 43개 테스트 + 신규(autotile 8+, buildings 6+, save v3 6+) 통과.

Review 체크리스트(A): 12.1 명령 전부, 12.2-A 항목 전부, `public/assets/vendor` 4개 PNG·라이선스·manifest 존재와 격자 검증, `fetch-assets.mjs`에 ALLOWLIST 밖 URL 없음, `DebugAtlasScene` 스크린샷 검토(누락·오배치·색 튐), 캐릭터 4방향 프레임 스크린샷(뒷모습에 눈이 없음, 좌우 반전), 폰트 px 값 grep, 오디오 unlock 전 예외 없음(콘솔), v0.1 낮음 항목 7개 해결 확인.

### 11.2 Stage B — 미니게임 4종
- **B-1** `shared/types.ts`·`logic/minigame/types.ts`(7.0), `quiz.ts`·`ox.ts` `act` 통일, `registry.ts`, `content/index.ts`의 `minigamePool`·검증 확장.
- **B-2** `content/regions.ts`(부록 B), `logic/geo.ts` + `geo.test.ts`; `content/minigames/seoul.ts`·`paris.ts`(부록 A.1·A.2의 짝·지도 목표·순서·빈칸).
- **B-3** `match.ts`·`mapfind.ts`·`order.ts`·`blank.ts` + 테스트 4개, `minigame.test.ts` 갱신.
- **B-4** `MinigameHost.ts`(Shell 분리, 레지스트리 6종, ★ 결과 패널), `MatchScene/MapFindScene/OrderScene/BlankScene`, `config.ts` 씬 등록, `QuizScene/OxScene`(Shell 상속만).
- **B-5** `missions.ts`(★ 보너스, `stats.minigames`), `reducer.ts`·`events.ts`(필요 시), `missions.test.ts`·`reducer.test.ts` 갱신.
- **B-6** `cities/seoul.ts`·`paris.ts` 추가 미션 4개 + NPC `missionIds`·대사(부록 A.1·A.2), `HudScene`(동시 이벤트 로그 병합, 미션 추적 문구).

완료 기준: 서울에서 한별 quiz → match, 온유 ox → mapfind, 파리에서 마리 quiz → blank, 루이 ox → order가 키보드·마우스 모두로 끝까지 되고 ★ 보너스가 지급되며, 신규 테스트(geo 12+, match 8+, mapfind 6+, order 6+, blank 6+) 통과, `validateContent` 오류 0.

Review 체크리스트(B): 12.2-B 전부, 각 미니게임을 키보드만·마우스만으로 1회씩 완주, 결과 이벤트 1회 발생, City 재개 후 키 잔류 없음, 시드 재현(같은 seed → 같은 카드 배치, 콘솔에서 `MINIGAME_LOGIC.match.create` 호출로 확인), 지도 판정 경계(파리 클릭이 유럽, 지중해 가운데 클릭은 어느 대륙도 아님).

### 11.3 Stage C — 도시 4곳
- **C-1** 콘텐츠: `cities/{cairo,newyork,sydney,rio}.ts`, `quizzes/*.ts` 4개, `minigames/*.ts` 4개(부록 A.3~A.6 전문), `monsters.ts`(+8), `items.ts`(+9, 8.4), `continents.ts`(4개 `playable` + 해금 규칙 확정안), `content/index.ts` 등록.
- **C-2** 아트: `landmarks.ts`(+11종), `monsterArt.ts`(+8), `charAtlas.ts`(신규 착용 4 + `robe_white/dress_plain`), `Npc.ts` 외형 12명, `uiSkin.ts` 기념품 아이콘 없음(가구 텍스처 사용).
- **C-3** 오디오 `themes.ts`(cairo/newyork/sydney/rio 4곡).
- **C-4** `logic/unlock.ts`(`unlockHint` 데이터 기반), `WorldMapScene`(안내 문구·마커 상태), `TitleScene`(부제 "6대륙 6개 도시"), `AvatarRoomScene`(상점 페이지 버튼), `HudScene`(도시명 표시는 자동).
- **C-5** 테스트: `content.test.ts`(6도시·풀 크기·미션 종류·맵 검증), `unlock.test.ts`(확정 규칙: 서울 2미션 후 5곳 open, 도장 → 기념품 4개), `save.test.ts`(새 도시 `lastCity`·`stamps` 검증), `missions.test.ts`(새 NPC 선행 체인).
- **C-6** 저장 v3 최종 확인(스키마 변경 없음, 검증만).

완료 기준: 세계지도에서 6개 도시 입장·탐험·미션 5개·몬스터 2종·표지판 3개·기념품이 모두 동작, 각 도시 맵이 테마(사막·격자 도로·항구·해변)를 알아볼 수 있고 랜드마크가 배치돼 있으며, BGM 8곡이 씬마다 바뀌고, 학습 콘텐츠가 부록 A와 1:1로 일치하며 12.4 사실 확인표를 통과한다. 전체 테스트 통과, `validateContent` 오류 0.

Review 체크리스트(C): 12.2-C 전부, 도시 4곳 완주(각 미션 5개 → 도장 → 기념품), 해금 규칙, 콘텐츠 사실·표기·수준 검토(12.4), 몬스터 존이 NPC에서 150px 이상 떨어져 있는지(부록 A 좌표는 검증됨), 성능(도시 진입 1초 이내, 프레임 55fps 이상 유지 — 브라우저 도구 `performance.now` 샘플).

### 11.4 파일 소유권 표
| 파일/폴더 | A | B | C |
|---|---|---|---|
| `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `.gitignore` | 수정 | — | — |
| `scripts/fetch-assets.mjs`, `tools/tile-index.html`, `public/assets/vendor/**` | 생성 | — | — |
| `src/shared/types.ts` | 수정(5.3, 6.3, 9) | 수정(7.0) | 수정(필요 시) |
| `src/shared/constants.ts` | 수정 | 수정 | — |
| `src/shared/content/tiles.ts` | 수정 | — | — |
| `src/shared/content/index.ts` | 수정 | 수정 | 수정 |
| `src/shared/content/continents.ts` | — | — | 수정 |
| `src/shared/content/regions.ts` | — | 생성 | — |
| `src/shared/content/monsters.ts`, `items.ts` | — | — | 수정 |
| `src/shared/content/cities/seoul.ts`, `paris.ts` | 수정(맵·테마·랜드마크·bubble) | 수정(미션·missionIds) | — |
| `src/shared/content/cities/{cairo,newyork,sydney,rio}.ts`, `quizzes/{…4}.ts`, `minigames/{…4}.ts` | — | — | 생성 |
| `src/shared/content/minigames/seoul.ts`, `paris.ts` | — | 생성 | — |
| `src/shared/map/autotile.ts`, `buildings.ts` | 생성 | — | — |
| `src/shared/logic/geo.ts`, `minigame/{match,mapfind,order,blank}.ts` | — | 생성 | — |
| `src/shared/logic/minigame/{types,quiz,ox,registry}.ts`, `missions.ts` | — | 수정 | — |
| `src/shared/logic/reducer.ts`, `events.ts` | 수정(settings) | 수정(필요 시) | — |
| `src/shared/logic/unlock.ts` | — | — | 수정 |
| `src/shared/save/schema.ts` | 수정(v3) | — | 검증만 |
| `src/shared/__tests__/*` | autotile·buildings 생성, save·content 수정 | geo·match·mapfind·order·blank 생성, minigame·missions·reducer·content 수정 | content·unlock·save·missions 수정 |
| `src/client/main.ts`, `session.ts` | 수정 | — | — |
| `src/client/config.ts` | 수정(DebugAtlas) | 수정(씬 4개) | — |
| `src/client/assets/{manifest,placeholders,avatarCompositor}.ts` | 수정 | — | — |
| `src/client/assets/{vendorSheets,atlasBuilder,tileAtlas,charAtlas,pixelArt,landmarks,monsterArt,emotes,uiSkin,worldMap,fonts}.ts` | 생성 | — | `charAtlas`·`landmarks`·`monsterArt` 수정 |
| `src/client/audio/*` | 생성 | — | `themes.ts` 수정 |
| `src/client/map/buildCityMap.ts` | 수정 | — | — |
| `src/client/entities/ActorDecor.ts` | 생성 | — | — |
| `src/client/entities/{Player,Npc,Monster}.ts` | 수정 | — | `Npc` 수정(외형) |
| `src/client/scenes/{Boot,Title,WorldMap,City,Hud,AvatarRoom}Scene.ts` | 수정 | `City`·`Hud` 수정 | `Title`·`WorldMap`·`AvatarRoom` 수정 |
| `src/client/scenes/DebugAtlasScene.ts` | 생성 | — | — |
| `src/client/scenes/minigames/{MinigameHost,QuizScene,OxScene}.ts` | 수정(스킨·SFX) | 수정(Shell·레지스트리) | — |
| `src/client/scenes/minigames/{Match,MapFind,Order,Blank}Scene.ts` | — | 생성 | — |
| `src/client/ui/{theme,Panel,Button,DialogBox,LearnCard}.ts` | 수정 | — | — |
| `src/client/ui/{NameTag,SpeechBubble,EmoteBubble,EmoteBar,Minimap}.ts` | 생성 | — | — |
| `server/index.js`, `CLAUDE.md`, `agents/*`, `spec.md`, `review.md`(Review만) | 변경 없음 | | |

---

## 12. 검증 방법(Review 단계)

### 12.1 실행 명령(모든 단계)
```bash
cd /Users/sungchul/Desktop/play1
npm install
npm run assets:check                # vendor 파일·manifest·격자 검증(다운로드 없음). 없으면 npm run assets
npm run typecheck
npm test
npm run build
# 순수성·규칙 grep
grep -rnE "from 'phaser'|from \"phaser\"" src/shared && echo "FAIL: shared에 phaser" || echo OK
grep -rnE "document\.|window\.|localStorage|performance\.|Math\.random|AudioContext" src/shared && echo "FAIL: shared 순수성" || echo OK
grep -rn "three" src package.json index.html && echo "FAIL" || echo OK
grep -nE "https?://" scripts/fetch-assets.mjs | grep -v "kenney.nl/media/pages/assets/roguelike-(rpg-pack|modern-city|characters|indoors)" | grep -v "creativecommons.org" && echo "FAIL: 허용 외 URL" || echo OK
grep -rnE "fontSize: '([0-9]+)px'" src/client | grep -vE "'(12|15|24|30)px'" && echo "FAIL: 폰트 크기 규칙" || echo OK
du -sh public/assets/vendor            # 1MB 안팎 확인
npm run dev                          # http://localhost:5173  (도구 페이지 /tools/tile-index.html?sheet=kenney-roguelike-rpg, 디버그 /?debug=atlas)
npm run build && npm start           # http://localhost:3100 , curl http://localhost:3100/health
```

### 12.2 브라우저 체크리스트
**A(그래픽·ZEP)**
- [ ] 로드: 로딩 바 → 타이틀(Galmuri 폰트, 9-slice 버튼). 콘솔 에러 0(오디오 unlock 전 경고 없음). 첫 클릭/키 후 BGM `world` 재생, N 키·스피커 버튼으로 음소거, 새로고침 후 음소거 유지
- [ ] `?debug=atlas`: 의미 타일·파츠·몬스터·랜드마크 전부 표시, 분홍 칸 0, 이름과 그림이 일치(풀/모래/물가/길 모양/문·창)
- [ ] 세계지도: 실제 대륙 윤곽(남극 포함), 라벨 11개, 픽셀 핀, 서울·파리 마커 위치가 v0.1과 동일(투영 동일)
- [ ] 서울: 물가 가장자리 타일이 강 둘레에 맞게 이어지고 다리가 강 방향에 맞음, 길 교차·모서리 자연스러움, 경복궁·남산타워 랜드마크가 보이며 막힘, 한옥 지붕 건물에 문·창, 나무·벤치·가로등·꽃, 미니맵(Tab 토글)에 플레이어 점이 따라옴
- [ ] 캐릭터: 파츠 조합 아바타, 4방향 걷기(좌우 반전·뒷모습에 눈 없음), 발밑 그림자, 머리 위 이름표(이름 변경 시 갱신), 걸을 때 발소리(지면 종류 따라 다름), NPC 이름표(역할 색)·96px 안에서 말풍선·`!`/`?` 마커 위치
- [ ] 이모지 1~6 키·이모지 바 클릭: 머리 위 2초 표시·교체·효과음, 대화창 열린 동안 무시
- [ ] 효과음: 버튼 클릭, 대화창 열기, 정답/오답, 포인트 획득, 피격/처치, 도장(팡파르), 해금
- [ ] 파리: 센강·시테섬 물가, 에펠탑·개선문·루브르·노트르담 랜드마크, 카페 테이블, 파리 BGM(왈츠)으로 전환, 서울로 돌아오면 서울 BGM
- [ ] 아바타 룸: 실내 바닥·벽, 가구 아이콘이 Indoors 아트, 배치·회수, 미리보기 6배 아바타, 상점 카드가 파츠 아이콘
- [ ] 아이템 22개를 순서대로 장착하며 미리보기가 모두 다르게 보임(스크린샷 4장 이상)
- [ ] v0.1 저장(v2 JSON을 localStorage에 넣고 새로고침) → 이어하기 → 포인트·도장·아바타·룸 복원, `version:3`으로 재저장
- [ ] 기존 v0.1 체크리스트 핵심 흐름(서울 미션 3개 → 파리 해금 → 파리 미션 3개 → 기절/부활 → 파밍 밸런스) 회귀 통과
- [ ] 3100 프로덕션 빌드에서 vendor 시트·폰트·지도가 로드됨(네트워크 탭 200)

**B(미니게임)**
- [ ] 서울 한별: quiz 완료 → "새 미션: 서울 짝맞추기" → match 12장: 클릭·방향키+Enter 모두, 틀리면 700ms 후 뒤집힘, 시도 카운트, 별점·보너스(+10/+5) 로그, 14회 초과 시 실패·재도전
- [ ] 서울 온유: ox 완료 → mapfind 5문항: 클릭·십자선 모두, 서울 근처 클릭 정답, 아프리카 가운데 클릭 오답 + 힌트 + 정답 위치 표시, 4/5 이상 성공
- [ ] 파리 마리: quiz → blank 4문장(빈칸 1·2개), 1~4 키·클릭, Tab 빈칸 이동, 미완성 제출 거부, 3/4 이상 성공
- [ ] 파리 루이: ox → order 2문제, 드래그·클릭-클릭·키보드 교환, 오답 시 "n개가 제자리" 힌트, 2번 틀리면 공개 후 다음, 2/2 성공
- [ ] 각 미니게임 중 City 정지·HUD 숨김, 종료 후 재개·키 잔류 없음, `minigame:done` 1회, BGM 덕킹/복귀
- [ ] `validateContent()` 오류 0, 콘솔 에러 0

**C(도시 4곳)**
- [ ] 세계지도: 서울 quiz+ox 완료 시 로그 "파리·카이로·뉴욕·시드니·리우가 열렸어요!"(확정 규칙), 6개 마커 노란 핀, 툴팁 거리(카이로 약 8,490km·뉴욕 11,050·시드니 8,330·리우 18,130)
- [ ] 카이로: 사막·나일강·야자수·피라미드·스핑크스·모스크·박물관·노점, NPC 3·표지판 3·풍뎅이/붕대 고양이, 미션 5개(quiz→map 체인, match→ox 체인, defeat) → 도장 → "피라미드 모형", 카이로 BGM
- [ ] 뉴욕: 격자 도로·인도·횡단보도·고층 빌딩·센트럴 파크(연못·울타리)·타임스 스퀘어 광장·엠파이어 스테이트·자유의 여신상 섬·브루클린 다리 입구, 피자 생쥐/택시 벌레, 미션 5개(quiz→blank, order→ox, defeat), 뉴욕 BGM(블루스)
- [ ] 시드니: 항구·하버 브리지(오버레이 아치, 다리 위 걷기)·오페라 하우스 곶·해변·공원, 캥거루/갈매기, 미션 5개(quiz→match, map→blank, defeat), 시드니 BGM
- [ ] 리우: 마라카낭·언덕 위 예수상·팡지아수카르·라군·해변·알록달록 집·열대 나무, 원숭이/큰부리새, 미션 5개(quiz→order, blank→ox, defeat), 리우 BGM(보사노바)
- [ ] 새 착용 아이템 4개 구매·장착이 미리보기·도시에서 보임, `body_dark` 기본 보유, 기념품 가구 6개 배치, 상점 페이지 버튼
- [ ] 각 도시 학습 카드 3장·퀴즈 11문항·짝·지도 목표·순서·빈칸이 부록 A와 일치(소스 대조), 해설 표시
- [ ] 6도시 완주 후 포인트 약 1,000±100(몬스터 제외), 등급 "세계 여행가"
- [ ] 저장: `lastCity:'rio'`, `stamps` 6개 복원, 손상 저장 처리 유지

### 12.3 코드 리뷰 포인트
- v0.1 항목(순수성, `applyAction` 단일 경로, 리스너 해제, HUD 변경 시 갱신, 텍스처 캐시, 미니게임 결과 1회, 저장 검증) 유지.
- `atlasBuilder`가 Boot에서 1회만 실행되고 씬 전환 시 재생성하지 않음(`textures.exists` 가드), 캔버스 총 크기 합리적(타일 아틀라스 ≤ 2048×2048).
- `buildCityMap`이 프레임마다 아무것도 하지 않음(생성 시 1회), 미니맵 정적 텍스처 1회 + 점만 갱신, 말풍선/이름표 Text 객체 재생성 없음.
- 자동 타일링·건물 사각형 로직이 `src/shared/map`에 순수 함수로 있고 테스트됨. `tileAtlas.ts`의 `{code}` 폴백 목록이 완료 보고와 일치.
- `fetch-assets.mjs` ALLOWLIST 외 URL 없음, zip 파서가 경로 탈출(`../`)을 거부, 추출 파일이 PNG 시그니처 검사 통과.
- 오디오: `AudioContext`가 사용자 입력 전에 생성되지 않음, 노드 누수 없음(`onended`로 disconnect), BGM 스케줄러가 씬 전환·탭 숨김에 안전, 음소거 시 CPU 사용 최소(스케줄 정지).
- 폰트 로드 실패 시 폴백, 텍스트 폭 계산이 폰트 로드 후에만 일어남(`Title` 이전).
- 미니게임: 모든 난수가 `mulberry32(seed)`, 씬은 상태를 직접 바꾸지 않고 `act`만 호출, 키보드/마우스 경로가 같은 함수로 수렴.
- 저장 v3: `migrate` 순서(v2→v3→validate), `stamps`–미션 보정, `settings` 기본값.
- 콘텐츠: id 규칙(`<city>_c01`, `<city>_o01`, `<city>_p01`(짝), `<city>_t01`(지도), `<city>_r01`(순서), `<city>_b01`(빈칸), `m_<city>_<kind>`), 외래어 표기.

### 12.4 콘텐츠 사실 확인표(Review가 문항과 대조)
| 항목 | 기준값 |
|---|---|
| 서울–도시 대권거리 | 파리 8,965km, 카이로 8,486, 뉴욕 11,052, 시드니 8,330, 리우 18,133, 베이징 953(하버사인, `continents.ts` 좌표) |
| 시차(서울 낮 12시) | 파리 새벽 4시(여름 5시), 카이로 새벽 5시(여름 6시), 뉴욕 전날 밤 10시(여름 11시), 시드니 오후 1시(호주 여름 2시), 리우 밤 12시(서머타임 없음) |
| 카이로 | 나일강 약 6,650km·남→북·지중해, 연 강수 약 25mm, 여름 낮 35°C 안팎·겨울 낮 20°C 안팎, 대피라미드 약 4,500년 전·현재 높이 약 138m, 스핑크스 약 20m, 인구 약 1,000만(권역 2,000만+), 아랍어·이집트 파운드, 코샤리·아이쉬, 칸 엘 칼릴리, 캄신(봄 모래바람) |
| 뉴욕 | 5개 자치구·맨해튼섬·허드슨강, 인구 약 830만, 1월 평균 약 1°C·7월 약 25°C, 연 강수 약 1,200mm 고른 분포, 자유의 여신상 1886년·프랑스 선물·93m(받침 포함), 엠파이어 1931년, 브루클린 다리 1883년, 원 월드 트레이드 센터 2014년, 수도 워싱턴 D.C., 달러 |
| 시드니 | 인구 약 540만, 수도 캔버라, 오페라 하우스 1973년(세계유산 2007), 하버 브리지 1932년, 1월 평균 약 23°C·7월 약 13°C, 연 강수 약 1,200mm, 남반구 계절 반대, 남십자성 국기, 2000년 올림픽, 애버리지니·부메랑·디저리두, 캥거루·코알라·오리너구리 고유종 |
| 리우 | 인구 약 620만(2022년 인구조사), 1960년까지 수도(현 브라질리아), 포르투갈어·헤알, 예수상 1931년·30m+받침 8m, 팡지아수카르 396m·코르코바두 710m, 열대 기후(1월 평균 약 27°C·7월 약 21°C), 연 강수 약 1,100mm, 카니발 2~3월, 월드컵 5회 우승, 2016년 올림픽, 아마존 세계 최대 열대 우림 |
| 순서 문제 값 | 부록 A의 `value`가 위 기준값·연도·위경도와 일치하고 정렬 방향이 맞는지 |

---

## 13. 위험 요소와 대안
| 위험 | 영향 | 대안 |
|---|---|---|
| Kenney 시트 실제 격자가 예상과 다름 | 인덱스 전부 어긋남 | 스크립트가 실측 열 수를 manifest에 기록하고 코드는 manifest만 참조. 인덱스 도구도 manifest 사용 |
| zip 안 파일명이 다름 | 추출 실패 | 정규식 탐색 + 실패 시 목록 출력. 최악의 경우 Build가 파일명만 ALLOWLIST 항목에 추가(URL은 불변) |
| 필요한 모양(야자수·한옥·유리 빌딩·갓·파라오 장식)이 팩에 없음 | 도시 특색 약화 | 의미 타일마다 `{code}` 폴백 허용. 코드 그림도 16격자로 밀도 통일 |
| 코드 생성 걷기 프레임의 품질(뒷모습·다리 들기) | 어색한 애니 | `legLift` 실패(다리 픽셀 구분 불가) 시 1px 바운스만 적용. Ninja Adventure(3.8 후보)는 후속 사이클에서만 검토(이번 사이클은 코드 생성으로 확정) |
| 재칠(`mono`)로 파츠 디테일 손실 | 밋밋한 옷 | 밝기 보존 재칠(5.2)로 명암 유지, `overlay`로 특징 추가 |
| 텍스처 번짐(타일 경계 줄) | 화면 줄무늬 | 아틀라스 extrude 1px + margin/spacing 등록, `roundPixels`. 문제 시 카메라 정수 위치 스냅 |
| 아틀라스 빌드 시간(Boot) | 첫 로딩 지연 | 필요한 셀만 복사(수백 개), 실측 < 200ms 예상. 로딩 바 표시 |
| Galmuri 비정수배 스케일(FIT) 흐림 | 글자 품질 | 폰트 크기를 디자인 정수배로 제한, 캔버스 스케일이 정수가 아니면 감수. FIT 유지 확정(14절 8항). 품질 문제가 크면 후속 사이클에서 `Scale.NONE` + CSS 정수 배율 검토 |
| FontFace 로드 지연/실패 | 텍스트 폭 어긋남 | 3초 타임아웃 후 폴백 진행, 로드 후에만 Text 생성 |
| 브라우저 오디오 자동재생 정책 | 소리 없음 | 첫 입력에서 unlock, 그 전에는 재생 요청을 큐에 두지 않고 무시. Title에 "클릭하면 소리가 켜져요" 안내 |
| BGM 스케줄러와 Phaser 일시정지 불일치 | 탭 복귀 시 밀린 노트 몰림 | `visibilitychange`에서 정지, 복귀 시 현재 시각부터 재개(누적 큐 버림) |
| world-atlas JSON import 타입 | 빌드 오류 | `resolveJsonModule` + `as unknown as Topology`. 실패 시 `?url`로 fetch |
| Phaser NineSlice API 차이 | UI 깨짐 | 3.90은 `this.add.nineslice(x,y,key,frame,w,h,l,r,t,b)` 지원. 문제 시 9장 이미지 조합으로 대체 |
| 숫자키 충돌(이모지 1~6 vs 카드 탭 1~3 vs 미니게임 1~4) | 오동작 | City: 모달 열림이면 카드 탭, 아니면 이모지; 미니게임 중 City는 pause. 리뷰에서 상태별 확인 |
| 지도 판정 폴리곤이 거칠어 경계 근처 오판 | 학습 오해 | 목표는 대륙·대양 중심부 클릭을 기대. 오답 시 정답 영역 외곽선을 보여 줌. 폴리곤은 테스트 좌표로 고정 |
| 콘텐츠 사실 오류·표기 오류 | 교육 목적 훼손 | 12.4 기준값으로 Review 대조. 의심 문항은 Build가 보고에 표시 |
| 맵 수정으로 v0.1 오브젝트 좌표 변경 | 회귀 | 부록 A.1·A.2 좌표는 검증 스크립트로 도달 가능성·NPC-몬스터 거리 확인됨. 위치 변경은 피에르 (14,19)→(12,19) 1건 |
| 저장 v3 마이그레이션 실수로 v0.1 저장 소실 | 진행 손실 | `save.test.ts`에 실제 v0.1 저장 fixture 포함, 실패 시 v2 원본을 `play1.progress.backup`에 1회 보관 |
| vendor PNG를 git에 넣어 리포 크기 증가 | 미미(≈1MB) | 허용. 크면 `Spritesheet`만 유지 |

---

## 14. 확정된 결정 사항

사용자 승인(2026-09-24) 시 확정된 항목. Build/Review 단계에서 임의로 바꾸지 않는다. 미확정으로 남아 있던 본문 문구는 모두 아래 확정안으로 정리했다.

1. **캐릭터 걷기 애니메이션: A안(코드 생성 걷기) 확정.** Roguelike Characters에는 걷기 프레임이 없으므로(3.1) Kenney 파츠를 그대로 합성한 뒤 다리 교차 2프레임(`legLift`)·1px 바운스·머리 1px 기울임(좌우)·좌우 반전·얼굴 지우기(뒷모습)로 3열×4행 시트를 만든다(5.5). 22개(+4) 착용 아이템의 레이어 커스터마이징을 그대로 유지한다. Ninja Adventure는 3.8에 후속 사이클 후보로만 기록하며 이번 사이클에는 다운로드·사용하지 않는다.
2. **세계지도 해금 규칙: A안(자유 여행) 확정.** 서울 `m_seoul_quiz`·`m_seoul_ox` 보고 완료 시 파리·카이로·뉴욕·시드니·리우 5곳이 동시에 열린다(8.2). 순차 해금은 마커 `unlock.missionIds` 데이터만 바꾸면 되는 확장 경로로만 남긴다(구현하지 않음).
3. **몬스터 아트: 코드 생성(16격자, 2배) 확정.** 12종 모두 `monsterArt.ts`에서 그린다(5.7). Kenney Tiny Dungeon은 3.8 후보 기록만.
4. **아이템 9개 추가 확정**(총 31개, 유료 합계 750): `body_dark`(무료·기본 보유), `hat_pharaoh` 45, `hat_liberty` 45, `hat_cork` 40, `top_brazil` 40, 기념품 가구 4개(도장 시 지급). 8.4·5.6 표 기준.
5. **서울·파리 도장: 기존 미션 3개 기준 유지 확정.** 추가 미션 4개(`m_seoul_match`, `m_seoul_map`, `m_paris_blank`, `m_paris_order`)는 보너스이며 `stampMissionIds`에 넣지 않는다. 새 도시 4곳은 미션 5개 전부.
6. **오디오: Web Audio 코드 생성 확정.** BGM 8곡(world/room/seoul/paris/cairo/newyork/sydney/rio)·효과음 13종·음소거 토글 저장(6.5). CC0 음악·효과음 팩은 3.8 후속 후보로만 기록한다.
7. **조작키 확정**: 이동 방향키/WASD, 대화·읽기 E(Space 겸용), 공격 F, 세계지도 M, 닫기 Esc, 아바타 룸 R(세계지도에서), 이모지 1~6(도시, 모달·미니게임 중 무시), 미니맵 Tab(포커스 이동 방지 capture), 음소거 N, 학습 카드 탭 1/2/3(카드가 열린 동안), 미니게임 답 1~4·O/X·←/→·Enter. 마우스는 세계지도·상점·미니게임·이모지 바·스피커 버튼·대화창 닫기.
8. **픽셀 선명도: `Scale.FIT` 유지 확정.** 폰트는 Galmuri 디자인 크기의 정수배(12/15/24/30px)만 사용(5.9). `Scale.NONE` 전환은 후속 검토 항목.
9. **vendor 시트 git 포함 확정**(3.3): `public/assets/vendor/` PNG 4개·`License.txt`·`LICENSES.md`·`manifest.json`을 커밋하고 zip은 `.cache/`(gitignore)에만 둔다.
10. **카이로 문화 카드의 종교 서술 확정**: "이슬람교를 믿는 사람이 많아 모스크(이슬람 사원)가 많다." — 한 문장, 가치 판단 없이 교과서 수준의 사실로만 서술한다(부록 A.3 `card_cairo_culture`). 퀴즈 문항으로는 내지 않는다.
11. **시차 서술: 표준시 기준 + 서머타임 괄호 병기 확정**(8.5, 12.4 기준값). 카이로 새벽 5시(여름 6시), 뉴욕 전날 밤 10시(여름 11시), 시드니 오후 1시(호주 여름 2시), 리우 밤 12시, 파리 새벽 4시(여름 5시).
12. **남산타워 위치 확정**: 서울 맵 남동쪽 바위 언덕 위 `(35,22)` 2×2(overhang 3), 도달 불가 감상용(부록 A.1).
13. **미니게임 실패 조건 확정**: 짝맞추기 6쌍 14회(8쌍 20회), 지도 위치 찾기 5문항 중 4개, 순서 맞추기 2문제 모두(문제당 2회), 빈칸 채우기 4문장 중 3개, 4지선다·OX 5문항 중 4개. 실패 시 재도전 무제한, 별점 보너스 3★ +10 / 2★ +5(7절).
14. **다운로드 목록 확정**(3.2 표 그대로): Kenney Roguelike/RPG·Modern City·Characters·Indoors zip 4개 + npm `galmuri`·`world-atlas`·`topojson-client`(+`@types/topojson-client`, `@types/topojson-specification`). **이 목록 외에는 어느 단계에서도 다운로드하지 않는다.**
15. v0.1 확정 사항(6대륙·5대양, 5문항 중 4, 재도전 무제한, 레벨 폐지·포인트 등급, 저장 키 `play1.progress`, Phaser ^3.90(4.x 금지), vitest, shared 순수성, LPC 등 CC-BY-SA 미사용)은 그대로 유지된다.

---

## 부록 A. 도시 콘텐츠 전문

공통 규칙: 맵은 30행×40자(범례 5.3), 좌표는 `(tx,ty)`. NPC `facing`은 모두 `down`. 미니게임 미션 `spec`의 기본값은 7절(quiz/ox `count:5, passCount:4`, match `pairs:6, maxAttempts:14`, mapfind `count:5, passCount:4`, order `count:2, passCount:2, triesPerQuestion:2`, blank `count:4, passCount:3`). 모든 맵은 검증 스크립트로 행 길이·문자·도달 가능성(스폰에서 NPC·표지판·존·출입구까지)·건물 사각형(≥2×2)·랜드마크 사각형·몬스터 스폰–NPC 거리(≥150px)를 확인했다. `validateContent`가 같은 검사를 한다.

### A.1 서울(v0.2 갱신분)
- 테마 `{ ground:'grass', road:'cobble', building:'hanok', tree:'round', streetTree:'plane', water:'river', wall:'stone', bgm:'seoul' }`
- 랜드마크: `lm_seoul_palace`(gyeongbokgung, at (14,3), 6×4, overhang 1), `lm_seoul_tower`(namsan_tower, at (35,22), 2×2, overhang 3 — 바위 언덕 위, 도달 불가)
- 출입구 (0,10), 스폰 (2,10) right. NPC: 한별 guide (3,9) `missionIds:['m_seoul_quiz','m_seoul_match']` bubble "안녕! 서울이야", 온유 teacher (17,8) `['m_seoul_ox','m_seoul_map']` bubble "표지판 읽어 봐", 호랑 guard (12,21) `['m_seoul_defeat']` bubble "도깨비 조심!". 표지판·존·카드·퀴즈·기존 미션 3개·`stampMissionIds`(3개)는 v0.1과 동일.
```
RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR
RRTTRRRTTRRRRTTTRRRRRRTTTRRRRTTRRRRTTTRR
T......................................T
T..####.......PPPPPP......####.........T
T..####.......PPPPPP......####.....T...T
T..####...==..PPPPPP..==..####.........T
T..####...==..PPPPPP..==..####..T......T
T...*.....==..QQQQQQ..==......*........T
T.........==..QQQQQQ..==...............T
T....l....==.b........==.........T..l..T
E=====================================.T
T.........==..........==...............T
T..####...==..........==..####.........T
T..####...==....T.....==..####.........T
T..####...==..........==..####.....T...T
T=====================================.T
T....b....==...*......==.....b.........T
T~~~~~~~~~BB~~~~~~~~~~BB~~~~~~~~~~~~~~~T
T~~~~~~~~~BB~~~~~~~~~~BB~~~~~~~~~~~~~~~T
T~~~~~~~~~BB~~~~~~~~~~BB~~~~~~~~~~~~~~~T
T~~~~~~~~~BB~~~~~~~~~~BB~~~~~~~~~~~~~~~T
T.........==..........==.........RRRRR.T
T....,....==....,.....==......,..RRPPR.T
T...,,,...==...,,,....==.....,,,.RRPPR.T
T..,,,,,..==..,,,,,...==....,,,,,RRRRR.T
T...,,,...==...,,,....==.....,,,.......T
T....,....==....,.....==......,........T
T...T.....==......T...==.......T...b...T
T......................................T
TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT
```
**짝(`seoul_p01`~`p08`, topic 순서 geo·geo·culture·culture·climate·climate·culture·culture)**: 서울이 속한 대륙–아시아 / 서울을 흐르는 강–한강 / 조선의 궁궐–경복궁 / 세종대왕이 만든 글자–한글 / 사계절이 뚜렷한 기후–온대 기후 / 겨울에 부는 찬 바람–북서풍 / 우리나라의 명절–설·추석 / 우리나라 전통 옷–한복
**지도 목표(`seoul_t01`~`t05`)**: t01 city seoul "서울은 어디일까요?" 힌트 "아시아 대륙 동쪽, 한반도 가운데예요" / t02 region asia "서울이 속한 아시아 대륙을 찾아 보세요" "지도 오른쪽 위의 가장 큰 대륙이에요" / t03 region pacific "한반도 동쪽의 넓은 바다, 태평양은 어디일까요?" "지도 오른쪽 끝과 왼쪽 끝에 걸친 가장 넓은 바다예요" / t04 city beijing "서울에서 가장 가까운 외국 수도, 베이징은?" "서울 서쪽, 중국에 있어요" / t05 region europe "파리가 있는 유럽 대륙은 어디일까요?" "아시아 서쪽, 지도 가운데 위쪽이에요"
**순서(`seoul_r01`, `r02`)**: r01 "서울에서 가까운 도시부터 순서대로" asc, km: 베이징 953 / 시드니 8330 / 파리 8965 / 뉴욕 11052, 설명 "베이징은 950km로 비행기로 2시간, 뉴욕은 11,000km로 14시간쯤 걸려요" / r02 "북쪽에 있는 도시부터 순서대로" desc, 위도: 파리 48.9 / 서울 37.6 / 카이로 30.0 / 시드니 -33.9, 설명 "위도가 높을수록 북쪽이에요. 시드니는 남반구라 위도가 마이너스예요"
**빈칸(`seoul_b01`~`b04`)**: b01 "서울은 [0] 대륙의 [1]에 있다." [유럽·아시아·아프리카·오세아니아 → 아시아] [한반도·이베리아반도·아라비아반도·인도반도 → 한반도] / b02 "서울의 여름에는 [0]에서 덥고 습한 바람이 분다." [남동쪽·북서쪽·북동쪽·남서쪽 → 남동쪽] / b03 "[0]이 만든 글자는 [1]이다." [세종대왕·이순신·장영실·정약용 → 세종대왕] [한글·한자·가나·알파벳 → 한글] / b04 "서울 가운데를 흐르는 강은 [0]이다." [한강·낙동강·금강·나일강 → 한강]. 설명은 정답 문장.
**추가 미션**
| id | NPC | 제목 | 설명 | spec | 보상 | 선행 | 대사(accept / progress / complete / fail) |
|---|---|---|---|---|---|---|---|
| m_seoul_match | 한별 | 서울 짝맞추기 | 한별의 카드 6쌍을 14번 안에 모두 맞히기 | match | 30 | m_seoul_quiz | "퀴즈 박사에게 다음 도전! 카드를 뒤집어 서울에 대한 짝을 맞춰 봐. 준비되면 다시 말 걸어 줘." / "짝맞추기에 도전할래?" / "기억력도 최고네! 서울은 이제 눈 감고도 다니겠어." / "카드 위치를 잘 기억해 두고 다시 해 보자." |
| m_seoul_map | 온유 | 세계지도에서 찾기 | 온유가 말하는 곳을 세계지도에서 5번 중 4번 이상 찾기 | mapfind | 30 | m_seoul_ox | "세계지도에서 서울과 아시아, 바다를 찾을 수 있을까? 준비되면 말 걸어 줘." / "지도 찾기에 도전할래?" / "세계지도가 머릿속에 들어 있구나! 이제 어느 대륙이든 갈 수 있어." / "세계지도를 다시 보고 대륙 모양을 기억해 봐." |

### A.2 파리(v0.2 갱신분)
- 테마 `{ ground:'grass', road:'cobble', building:'parisian', tree:'round', streetTree:'plane', water:'river', wall:'hedge', bgm:'paris' }`
- 랜드마크: `lm_paris_arc`(arc, (4,5), 2×2, overhang 1), `lm_paris_louvre`(louvre, (24,3), 8×3, overhang 1), `lm_paris_notredame`(notredame, (23,16), 2×2, overhang 2), `lm_paris_eiffel`(eiffel, (4,21), 2×2, overhang 3)
- 출입구 (39,10), 스폰 (37,10) left. NPC: 마리 guide (36,8) `['m_paris_quiz','m_paris_blank']` bubble "봉주르!", 루이 teacher (27,7) `['m_paris_ox','m_paris_order']` bubble "루브르야!", 피에르 guard **(12,19)**(v0.1 (14,19)에서 이동 — 비둘기 존과 거리 확보) `['m_paris_defeat']` bubble "비둘기 조심!". 표지판 geo (13,14)·climate (8,7)·culture (8,22), 존 pigeon (6,25) r2 ×3 / pigeon (18,23) r3 ×3 / gargoyle (33,23) r3 ×3, 카드·퀴즈·기존 미션·`stampMissionIds`(3개) 동일.
```
RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR
RRRRRRRTTRRRTTTRRRRTTRRRRRRTTTRRRRRRTTRR
TRRRR..................................T
T.......##..##..........PPPPPPPP.......T
T.......##..##..........PPPPPPPP.......T
T...PP..........==......PPPPPPPP..==...T
T...PP..........==..............t.==...T
T.......*.......==..l...........t.==...T
T.=============.==..####........t.==...T
T.......l.......==..####........t.==...T
T=====================================.E
T...**..........==....**....**....==...T
T..####.........==....####..####..==...T
T..####.........==....####..####..==...T
T.......b.......==..........b.....==...T
T~~~~~~~~~~~~~~~BB~~BB~~~~~~~~~~~~BB~~~T
T~~~~~~~~~~~~~..BB.....PP.~~~~~~~~BB~~~T
T~~~~~~~~~~~~~..BB.....PP.~~~~~~~~BB~~~T
T~~~~~~~~~~~~~~~BB~~BB~~~~~~~~~~~~BB~~~T
T...............==................==...T
T====================================..T
T...PP..........,,....*.........,,,....T
T...PP.........,,,,..........T.,,,,,...T
T..............,,,,,,........T.,,,,,...T
T....,,,.......,,,,,,..........,,,,,...T
T...,,,,,.......,,,,......T.....,,,....T
T....,,,....l.....................T....T
T.......T.............T................T
T......................................T
TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT
```
**짝(`paris_p01`~`p08`)**: 파리가 속한 대륙–유럽 / 파리를 흐르는 강–센강 / 1889년에 세운 철탑–에펠탑 / 모나리자가 있는 곳–루브르 박물관 / 프랑스의 화폐–유로 / 비가 고르게 오는 기후–서안 해양성 기후 / 프랑스의 빵–바게트 / 파리의 언덕–몽마르트르
**지도 목표(`paris_t01`~`t05`)**: t01 city paris "파리는 어디일까요?" "유럽 대륙 서쪽이에요" / t02 region europe "파리가 속한 유럽 대륙은?" "아시아 서쪽, 지도 가운데 위쪽이에요" / t03 region atlantic "파리 서쪽의 큰 바다, 대서양은?" "유럽·아프리카와 아메리카 사이의 바다예요" / t04 region africa "지중해 건너 남쪽의 아프리카 대륙은?" "유럽 바로 아래, 지도 가운데예요" / t05 city london "영국의 수도 런던은?" "파리 북서쪽, 바다 건너 섬나라예요"
**순서(`paris_r01`, `r02`)**: r01 "먼저 지어진 것부터 순서대로" asc, 연도: 노트르담 대성당 1163(짓기 시작) / 개선문 1836 / 에펠탑 1889 / 루브르 유리 피라미드 1989 / r02 "서울과 시차가 작은 도시부터(겨울 기준)" asc, 시간: 시드니 1 / 카이로 7 / 파리 8 / 뉴욕 14, 설명 "동쪽으로 갈수록 시간이 빨라요. 시드니는 서울보다 1시간 빠르고 뉴욕은 14시간 느려요"
**빈칸(`paris_b01`~`b04`)**: b01 "파리는 [0] 대륙에 있는 [1]의 수도이다." [유럽·아시아·아프리카·북아메리카 → 유럽] [프랑스·영국·독일·이탈리아 → 프랑스] / b02 "파리의 기후는 대서양과 [0]의 영향을 받는 [1] 기후이다." [편서풍·계절풍·무역풍·태풍 → 편서풍] [서안 해양성·사막·열대 우림·툰드라 → 서안 해양성] / b03 "1889년에 세운 [0]은 파리의 상징이다." [에펠탑·빅벤·피사의 사탑·남산타워 → 에펠탑] / b04 "프랑스에서는 화폐로 [0]를 쓴다." [유로·달러·파운드·원 → 유로]
**추가 미션**
| id | NPC | 제목 | 설명 | spec | 보상 | 선행 | 대사 |
|---|---|---|---|---|---|---|---|
| m_paris_blank | 마리 | 파리 빈칸 채우기 | 마리의 문장 4개 중 3개 이상 빈칸 채우기 | blank | 30 | m_paris_quiz | "이번엔 문장의 빈칸을 채워 볼까? 보기 중에서 알맞은 말을 골라 봐." / "빈칸 채우기에 도전할래?" / "파르페(완벽해)! 파리를 문장으로도 설명할 수 있구나." / "표지판의 문장을 다시 읽어 보고 도전해 봐." |
| m_paris_order | 루이 | 순서대로 맞추기 | 루이의 순서 문제 2개를 모두 맞히기(문제당 2번까지) | order | 30 | m_paris_ox | "박물관답게 순서 문제야. 오래된 것부터, 가까운 것부터 늘어놓아 봐." / "순서 맞추기에 도전할래?" / "역사와 지리를 한 줄로 꿰었구나. 브라보!" / "카드 아래 숫자를 떠올리며 다시 해 보자." |

### A.3 카이로(이집트, 아프리카) — 신규
- 테마 `{ ground:'sand', road:'dirt', building:'sandstone', tree:'palm', streetTree:'palm', water:'river', wall:'stone', bgm:'cairo' }`
- 랜드마크: `lm_cairo_pyramids`(pyramids, (4,4), 4×3, overhang 1), `lm_cairo_sphinx`(sphinx, (5,8), 2×2), `lm_cairo_mosque`(mosque, (23,16), 4×3, overhang 2), `lm_cairo_museum`(museum, (32,14), 4×3)
- 출입구 (39,10), 스폰 (37,10) left. 나일강(열 14~17)이 남북으로 흐르고 다리 2개(행 10~11, 20~21), 강가에 농경지(`F`)·야자수, 서쪽은 사막과 피라미드, 동쪽은 시장(`m`)·모스크·박물관.
```
RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR
RSSSSSSSSSSSSF~~~~FSSSSSSSSSSSSSSSSSSSSR
RSSSSSSSSSSSpF~~~~FpSSSSS####SSSS####SSR
RSSSSSSSSSSSSF~~~~FSSSSSS####SSSS####SSR
RSSSPPPPSSSSpF~~~~FpSSSSS####SSSS####SSR
RSSSPPPPSSSSSF~~~~FSSSSSSSS==SSSSSS==SSR
RSSSPPPPSSSSpF~~~~FpSSSSSSS==SSSSlS==SSR
RSSSSSSSSSSSSF~~~~FSSSSSSSS==SSSSSS==SSR
RSSSSPPSSSSSSF~~~~FSSSbSSSS==SSSSSS==bSR
RSSSSPPSSSSSpF~~~~FpSSSSSSS==SSSSSS==SSR
R=============BBBB=====================E
RSSSSSSSSSSSSFBBBBFSSSSSSSSSSSSSSSSSSSSR
RSSSSSSSSSSSpF~~~~FpSSSSmSmSmSSSSSSSSSSR
RSSSSSSSSSSSSF~~~~FSSSSSSSSSSSSSSSSSSSSR
RSSSSSSSSSSSSF~~~~FSSSSmSmSmSSSSPPPPSSSR
RSSsSSSSSSSSpF~~~~FpSSSSSSSSSSSSPPPPSSSR
RSsssSSSSSSSSF~~~~FSSSSPPPPSSSSSPPPPSSSR
RSSsSSSSSSSSSF~~~~FSSSSPPPPSSSSSSSSSSSSR
RSSSSSSSSSSSpF~~~~FpSSSPPPPSSSSlSSSSSSSR
RSSSSSSSSSSSSF~~~~FSSSSSSSSSSSSSSSSSSSSR
RSSSSS========BBBB====================SR
RSSSSSSSSSSSSFBBBBFSSSSSSSSSSSSSSSSSSSSR
RSSSSSSSSSSSpF~~~~FpSSSSSSSSSSSSSSSSSSSR
RSSSsSSSSSSSSF~~~~FSSSSSSSSSSSsSSSSSSSSR
RSSsssSSSSSSSF~~~~FSSSSSSSSSSsssSSSSSSSR
RSsssssSSSSSpF~~~~FpSSSSSSSSSsssssSSSSSR
RSSsssSSSSSSSF~~~~FSSSSSSSSSSsssSSSSSSSR
RSSSsSSSSSSSSF~~~~FSSSSSSSSSSSsSSSSSSSSR
RSSSSSSSSSSSSF~~~~FSSSSSSSSSSSSSSSSSSSSR
RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR
```
**NPC**
| id | 이름 | 역할 | 위치 | missionIds | cardId | bubble | idleText |
|---|---|---|---|---|---|---|---|
| npc_amir | 아미르 | guide | (36,11) | m_cairo_quiz, m_cairo_map | card_cairo_geo | 아흘란! 환영해 | 카이로에 온 걸 환영해. 다리를 건너 서쪽으로 가면 피라미드가 보여. |
| npc_nadia | 나디아 | teacher | (33,17) | m_cairo_match, m_cairo_ox | — | 박물관이야 | 여기는 이집트 박물관이야. 파라오의 황금 마스크가 안에 있지. |
| npc_karim | 카림 | guard | (9,12) | m_cairo_defeat | — | 풍뎅이 조심! | 사막 남쪽 모래밭에 반짝 풍뎅이가 잔뜩 있어. 조심해! |
표지판: geo (12,20) 다리 옆 강가, climate (8,7) 피라미드 앞 사막, culture (22,13) 시장. 몬스터 존: scarab (4,25) r3 ×3, scarab (31,25) r3 ×3, mummy_cat (3,16) r2 ×2. `stampMissionIds`: 5개 전부.
**학습 카드**
- `card_cairo_geo` "카이로의 지형": 아프리카 대륙 북동쪽에 있는 이집트의 수도이다. / 세계에서 가장 긴 나일강(약 6,650km)이 남쪽에서 북쪽으로 흘러 지중해로 간다. / 이집트 땅의 대부분은 사하라 사막이라 사람들은 나일강 가의 좁은 땅에 모여 산다. / 도시 바로 옆 기자에 피라미드와 스핑크스가 있다. / 서울에서 약 8,500km 떨어져 있다.
- `card_cairo_climate` "카이로의 기후": 비가 거의 오지 않는 사막 기후이다(1년에 약 25mm). / 여름 낮은 35°C가 넘게 덥고 겨울 낮은 20°C 안팎으로 따뜻하다. / 낮과 밤의 기온 차가 커서 사막의 밤은 서늘하다. / 봄에는 '캄신'이라는 뜨거운 모래바람이 분다. / 서울이 낮 12시일 때 카이로는 새벽 5시(여름에는 6시)이다.
- `card_cairo_culture` "카이로의 문화": 아랍어를 쓰고 화폐는 이집트 파운드이다. / 약 4,500년 전 파라오의 무덤인 피라미드, 상형 문자, 미라 같은 고대 이집트 문명의 유산이 있다. / 이슬람교를 믿는 사람이 많아 모스크(이슬람 사원)가 많다. / 칸 엘 칼릴리 같은 전통 시장이 있고 코샤리·아이쉬(빵)를 먹는다. / 인구는 약 1,000만 명(주변까지 합치면 2,000만 명이 넘는다).
**퀴즈(`quizzes/cairo.ts`)**
| id | kind | topic | 문제 | 선택지/정답 | 해설 |
|---|---|---|---|---|---|
| cairo_c01 | choice | geo | 카이로가 속한 대륙은? | 아프리카 / 아시아 / 유럽 / 남아메리카 → 0 | 카이로는 아프리카 대륙 북동쪽 이집트에 있어요 |
| cairo_c02 | choice | geo | 카이로 옆을 흐르는, 세계에서 가장 긴 강은? | 나일강 / 아마존강 / 한강 / 센강 → 0 | 나일강은 약 6,650km로 남쪽에서 북쪽으로 흘러 지중해로 가요 |
| cairo_c03 | choice | climate | 카이로처럼 비가 거의 오지 않고 낮에 매우 더운 기후는? | 사막 기후 / 온대 기후 / 열대 우림 기후 / 한대 기후 → 0 | 카이로에는 1년에 비가 약 25mm밖에 오지 않아요 |
| cairo_c04 | choice | climate | 이집트 땅의 대부분을 차지하는 것은? | 사막 / 숲 / 초원 / 빙하 → 0 | 이집트는 대부분 사하라 사막이라 사람들은 나일강 가에 모여 살아요 |
| cairo_c05 | choice | culture | 기자에 있는 고대 이집트 왕의 무덤은? | 피라미드 / 에펠탑 / 경복궁 / 자유의 여신상 → 0 | 대피라미드는 약 4,500년 전에 지어졌고 높이가 약 140m예요 |
| cairo_c06 | choice | culture | 이집트에서 주로 쓰는 말은? | 아랍어 / 영어 / 프랑스어 / 한국어 → 0 | 이집트 사람들은 아랍어를 쓰고 화폐는 이집트 파운드예요 |
| cairo_o01 | ox | culture | 카이로는 이집트의 수도이다. | O | 카이로는 이집트의 수도이자 아프리카에서 가장 큰 도시 중 하나예요 |
| cairo_o02 | ox | climate | 카이로에는 여름마다 장마가 있어 비가 많이 온다. | X | 카이로는 사막 기후라 1년 내내 비가 거의 오지 않아요 |
| cairo_o03 | ox | geo | 나일강은 남쪽에서 북쪽으로 흐른다. | O | 나일강은 아프리카 남쪽에서 시작해 북쪽 지중해로 흘러요 |
| cairo_o04 | ox | culture | 고대 이집트 사람들은 그림 같은 상형 문자를 썼다. | O | 신전과 피라미드 벽에 상형 문자가 새겨져 있어요 |
| cairo_o05 | ox | climate | 사막은 밤에도 낮처럼 덥다. | X | 사막은 낮과 밤의 기온 차가 커서 밤에는 서늘해요 |
**짝(`cairo_p01`~`p08`)**: 카이로가 있는 나라–이집트 / 카이로 옆을 흐르는 강–나일강 / 카이로가 속한 대륙–아프리카 / 파라오의 무덤–피라미드 / 이집트의 큰 사막–사하라 사막 / 고대 이집트의 글자–상형 문자 / 이집트의 음식–코샤리 / 비가 거의 없는 기후–사막 기후
**지도 목표(`cairo_t01`~`t05`)**: t01 city cairo "카이로는 어디일까요?" "아프리카 북동쪽, 나일강 근처예요" / t02 region africa "카이로가 속한 아프리카 대륙은?" "지도 가운데, 유럽 아래의 큰 대륙이에요" / t03 region indian "아프리카 동쪽의 인도양은?" "아프리카와 오스트레일리아 사이의 바다예요" / t04 region europe "지중해 건너 북쪽의 유럽 대륙은?" "아프리카 바로 위예요" / t05 city nairobi "케냐의 수도 나이로비는?" "카이로 남쪽, 아프리카 동쪽 적도 근처예요"
**순서(`cairo_r01`, `r02`)**: r01 "높이가 낮은 것부터 순서대로" asc, m: 스핑크스 20 / 예수상(리우) 38 / 자유의 여신상(뉴욕) 93 / 대피라미드 138, 설명 "대피라미드는 지금도 약 138m로 가장 높아요" / r02 "인구가 적은 도시부터 순서대로" asc, 만 명: 시드니 540 / 리우데자네이루 620 / 뉴욕 830 / 카이로 1000, 설명 "카이로는 주변까지 합치면 2,000만 명이 넘는 큰 도시예요"
**빈칸(`cairo_b01`~`b04`)**: b01 "카이로는 [0] 대륙 북동쪽, [1] 가에 있다." [아프리카·아시아·유럽·남아메리카 → 아프리카] [나일강·센강·한강·아마존강 → 나일강] / b02 "카이로는 비가 거의 오지 않는 [0] 기후이다." [사막·온대·열대·한대 → 사막] / b03 "기자의 [0]는 약 4,500년 전 [1]의 무덤으로 지어졌다." [피라미드·에펠탑·경복궁·오페라 하우스 → 피라미드] [파라오·황제·대통령·왕비 → 파라오] / b04 "이집트에서는 [0]를 쓴다." [아랍어·영어·프랑스어·포르투갈어 → 아랍어]
**미션(`stampMissionIds` = 5개 전부)**
| id | NPC | 제목 | 설명 | spec | 보상 | 선행 | 대사(accept / progress / complete / fail) |
|---|---|---|---|---|---|---|---|
| m_cairo_quiz | 아미르 | 카이로 지리 퀴즈 | 아미르가 내는 카이로 퀴즈 5문제 중 4개 이상 맞히기 | quiz | 40 | — | "카이로에 대해 얼마나 아는지 퀴즈를 내 볼게! 표지판을 먼저 읽고 오면 쉬울 거야. 준비되면 다시 말 걸어 줘." / "퀴즈에 도전할 준비가 됐어?" / "대단해! 나일강처럼 지식이 길구나." / "아깝다! 표지판을 읽고 다시 도전해 봐." |
| m_cairo_map | 아미르 | 아프리카를 찾아라 | 아미르가 말하는 곳을 세계지도에서 5번 중 4번 이상 찾기 | mapfind | 30 | m_cairo_quiz | "세계지도에서 카이로와 아프리카, 주변 바다를 찾아볼래? 준비되면 말 걸어 줘." / "지도 찾기에 도전할래?" / "지도 박사구나! 아프리카는 이제 눈 감고도 찾겠어." / "세계지도에서 아프리카 모양을 다시 살펴봐." |
| m_cairo_match | 나디아 | 카이로 짝맞추기 | 나디아의 카드 6쌍을 14번 안에 모두 맞히기 | match | 30 | — | "이집트 카드 짝맞추기를 해 보자. 카드를 뒤집어 짝을 찾아 봐. 준비되면 말 걸어 줘." / "짝맞추기에 도전할래?" / "기억력이 파라오급이야!" / "카드 위치를 기억하며 다시 해 보자." |
| m_cairo_ox | 나디아 | 카이로 OX 퀴즈 | 나디아가 내는 OX 퀴즈 5문제 중 4개 이상 맞히기 | ox | 30 | m_cairo_match | "이집트의 기후와 문화에 대해 OX 퀴즈를 내 볼게. 준비되면 다시 말 걸어 줘!" / "OX 퀴즈에 도전해 볼래?" / "훌륭해! 사막 기후를 정확히 알고 있구나." / "아깝다! 표지판을 읽고 다시 도전해 봐." |
| m_cairo_defeat | 카림 | 반짝 풍뎅이 소탕 | 사막 모래밭의 반짝 풍뎅이 3마리 처치 | defeat scarab ×3 | 30 | — | "사막의 반짝 풍뎅이가 시장까지 내려와. 3마리만 뿅 하고 쫓아 줄래? F 키로 공격할 수 있어." / "풍뎅이는 아직 남아 있어?" / "슈크란(고마워)! 덕분에 시장이 조용해졌어." / — |
기념품: `fur_souvenir_cairo` 피라미드 모형(도장 시). 착용 아이템: `hat_pharaoh` 파라오 머리 장식(45P).

### A.4 뉴욕(미국, 북아메리카) — 신규
- 테마 `{ ground:'grass', road:'asphalt', building:'skyscraper', tree:'round', streetTree:'round', water:'sea', wall:'hedge', bgm:'newyork' }`
- 랜드마크: `lm_newyork_empire`(empire, (23,10), 2×3, overhang 4), `lm_newyork_liberty`(liberty, (5,27), 2×2, overhang 3 — 남쪽 항구의 섬, 도달 불가)
- 출입구 (39,14), 스폰 (36,14) left(브루클린 다리 `BB`를 건너 들어옴). 서쪽 허드슨강(열 0~1)과 산책로(열 2), 동쪽 이스트강(열 37~39), 남쪽 항구(행 26~29). 격자 도로: 애비뉴(세로) 열 8~9·20~21·32~33, 스트리트(가로) 행 9·14·19·24. 센트럴 파크 행 1~8 열 10~19(연못·울타리·벤치), 타임스 스퀘어 광장 행 10~13 열 13~18, 인도 `-`, 주차된 차 `v`.
```
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
~~-TTTTT==TTTTTTTTTT==TTTTTTTTTT==TTT~~~
~~--###-==.T......T.==-####-###-==-##~~~
~~--###-==..........==-####-###-==-##~~~
~~--###-==...~~~....==-####-###-==-##~~~
~~--###-==.b.~~~..b.==-####-###-==-##~~~
~~------==..........==----------==---~~~
~~--###-==.T..*...T.==-###--###-==-##~~~
~~--###-==ffff..ffff==-###--###-==-##~~~
~~-==================================~~~
~~--###-==-##QQQQQQ-==-PP--####-==-##~~~
~~--###-==-##QQQQQQ-==-PP--####-==-##~~~
~~--###-==-##QQQQQQ-==-PP--####-==-##~~~
~~--###-==-##lQQQQl-==-bb--####-==-##~~~
~~-==================================BBE
~~--###-==-####-###-==-###--###-==-##~~~
~~--###-==-####-###-==-###--###-==-##~~~
~~--###-==-####-###-==-###--###-==-##~~~
~~------==-v--------==-------v--==---~~~
~~-==================================~~~
~~--###-==-##-,,,,,,==,,,,,,-##-==-##~~~
~~--###-==-##-,,,,,,==,,,,,,-##-==-##~~~
~~--###-==-##-,,,,,,==,,,,,,-##-==-##~~~
~~------==----,,,,,,==,,,,,,----==---~~~
~~-==================================~~~
~~------==----------==----------==---~~~
~~~~SSSS~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
~~~~SPPS~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
~~~~SPPS~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
```
**NPC**
| id | 이름 | 역할 | 위치 | missionIds | cardId | bubble | idleText |
|---|---|---|---|---|---|---|---|
| npc_emily | 에밀리 | guide | (34,13) | m_newyork_quiz, m_newyork_blank | card_newyork_geo | 헬로! 뉴욕이야 | 브루클린 다리를 건너면 맨해튼이야. 도로가 바둑판처럼 반듯하지? |
| npc_noah | 노아 | teacher | (17,6) | m_newyork_order, m_newyork_ox | — | 센트럴 파크야 | 여기는 센트럴 파크. 고층 빌딩 사이에 있는 커다란 공원이야. |
| npc_jackson | 잭슨 | guard | (16,11) | m_newyork_defeat | — | 택시 벌레 조심! | 남쪽 공터에 노란 택시 벌레가 붕붕 돌아다녀. 조심해! |
표지판: geo (2,12) 허드슨강 산책로, climate (16,3) 센트럴 파크, culture (14,12) 타임스 스퀘어. 몬스터 존: pizza_rat (11,6) r2 ×3, taxi_bug (16,21) r2 ×3, taxi_bug (24,21) r2 ×3. `stampMissionIds`: 5개 전부.
**학습 카드**
- `card_newyork_geo` "뉴욕의 지형": 북아메리카 대륙 동쪽, 미국 동해안에 있는 미국에서 가장 큰 도시이다(인구 약 830만 명). / 허드슨강이 대서양으로 흘러드는 곳에 있고 도심은 맨해튼이라는 섬이다. / 도로가 바둑판처럼 격자 모양(애비뉴와 스트리트)으로 뻗어 있고 고층 빌딩이 많다. / 맨해튼 한가운데에 넓은 센트럴 파크가 있다. / 서울에서 약 11,000km, 비행기로 14시간쯤 걸린다.
- `card_newyork_climate` "뉴욕의 기후": 서울과 위도가 비슷해 사계절이 뚜렷하다. / 여름은 덥고 습하며(7월 평균 약 25°C) 겨울은 춥고 눈이 온다(1월 평균 약 1°C). / 비와 눈이 1년 내내 고르게 내린다(1년 약 1,200mm). / 서울과 달리 여름 한철에 비가 몰리지 않는다. / 서울이 낮 12시일 때 뉴욕은 전날 밤 10시(여름에는 11시)이다.
- `card_newyork_culture` "뉴욕의 문화": 영어를 쓰고 화폐는 달러이다. / 프랑스가 선물한 자유의 여신상(1886년), 엠파이어 스테이트 빌딩, 타임스 스퀘어, 브루클린 다리가 있다. / 세계 여러 나라에서 온 이민자가 모여 살아 다양한 문화가 섞여 있다. / 핫도그·베이글·피자를 즐겨 먹고 노란 택시와 지하철이 유명하다. / 미국의 수도는 뉴욕이 아니라 워싱턴 D.C.이다.
**퀴즈(`quizzes/newyork.ts`)**
| id | kind | topic | 문제 | 선택지/정답 | 해설 |
|---|---|---|---|---|---|
| newyork_c01 | choice | geo | 뉴욕이 속한 대륙은? | 북아메리카 / 남아메리카 / 유럽 / 아시아 → 0 | 뉴욕은 북아메리카 대륙 동쪽, 미국의 동해안에 있어요 |
| newyork_c02 | choice | geo | 뉴욕 도심이 있는 섬의 이름은? | 맨해튼 / 시테섬 / 제주도 / 시칠리아 → 0 | 맨해튼은 허드슨강과 이스트강 사이에 있는 섬이에요 |
| newyork_c03 | choice | climate | 뉴욕의 기후를 서울과 비교하면? | 서울처럼 사계절이 뚜렷하다 / 1년 내내 덥다 / 1년 내내 춥다 / 비가 전혀 오지 않는다 → 0 | 뉴욕은 서울과 위도가 비슷해 여름은 덥고 겨울에는 눈이 와요 |
| newyork_c04 | choice | climate | 서울이 낮 12시일 때 뉴욕(겨울)은 몇 시일까요? | 전날 밤 10시 / 같은 날 낮 12시 / 다음 날 아침 8시 / 전날 새벽 4시 → 0 | 뉴욕은 서울보다 14시간(여름에는 13시간) 느려요 |
| newyork_c05 | choice | culture | 프랑스가 미국에 선물한 뉴욕의 동상은? | 자유의 여신상 / 예수상 / 스핑크스 / 모아이 → 0 | 1886년에 세워졌고 원래 구리색이었지만 녹이 슬어 초록색이 되었어요 |
| newyork_c06 | choice | culture | 미국의 수도는? | 워싱턴 D.C. / 뉴욕 / 로스앤젤레스 / 시카고 → 0 | 뉴욕은 미국에서 가장 큰 도시지만 수도는 워싱턴 D.C.예요 |
| newyork_o01 | ox | geo | 뉴욕은 대서양 가에 있는 항구 도시이다. | O | 허드슨강이 대서양으로 흘러드는 곳에 있어 큰 항구가 발달했어요 |
| newyork_o02 | ox | geo | 뉴욕의 도로는 바둑판처럼 반듯한 격자 모양이다. | O | 남북으로 뻗은 애비뉴와 동서로 뻗은 스트리트가 격자를 이뤄요 |
| newyork_o03 | ox | climate | 뉴욕에는 겨울에 눈이 오지 않는다. | X | 뉴욕 겨울은 춥고 눈보라가 치기도 해요 |
| newyork_o04 | ox | culture | 뉴욕에는 여러 나라에서 온 이민자가 모여 산다. | O | 차이나타운·리틀 이탈리아·코리아타운처럼 다양한 문화가 어울려요 |
| newyork_o05 | ox | culture | 미국에서는 유로를 화폐로 쓴다. | X | 미국의 화폐는 달러예요 |
**짝(`newyork_p01`~`p08`)**: 뉴욕이 있는 나라–미국 / 뉴욕 도심이 있는 섬–맨해튼 / 맨해튼 한가운데의 공원–센트럴 파크 / 프랑스가 선물한 동상–자유의 여신상 / 미국의 화폐–달러 / 뉴욕 서쪽을 흐르는 강–허드슨강 / 뉴욕의 길거리 음식–핫도그 / 미국의 수도–워싱턴 D.C.
**지도 목표(`newyork_t01`~`t05`)**: t01 city newyork "뉴욕은 어디일까요?" "북아메리카 동쪽 바닷가예요" / t02 region north_america "뉴욕이 속한 북아메리카 대륙은?" "지도 왼쪽 위의 큰 대륙이에요" / t03 region atlantic "뉴욕 동쪽의 대서양은?" "아메리카와 유럽·아프리카 사이의 바다예요" / t04 region south_america "북아메리카 아래에 이어진 남아메리카 대륙은?" "지도 왼쪽 아래예요" / t05 region pacific "북아메리카 서쪽의 태평양은?" "지도 왼쪽 끝의 넓은 바다예요"
**순서(`newyork_r01`, `r02`)**: r01 "먼저 만들어진 것부터 순서대로" asc, 연도: 브루클린 다리 1883 / 자유의 여신상 1886 / 엠파이어 스테이트 빌딩 1931 / 원 월드 트레이드 센터 2014, 설명 "브루클린 다리가 가장 오래됐고, 원 월드 트레이드 센터는 미국에서 가장 높은 건물이에요" / r02 "서쪽에 있는 도시부터 순서대로" asc, 경도: 뉴욕 -74 / 리우데자네이루 -43 / 파리 2 / 카이로 31, 설명 "경도가 작을수록(서경일수록) 서쪽이에요"
**빈칸(`newyork_b01`~`b04`)**: b01 "뉴욕은 [0] 대륙 동쪽, [1] 가에 있다." [북아메리카·남아메리카·유럽·아시아 → 북아메리카] [대서양·태평양·인도양·지중해 → 대서양] / b02 "뉴욕의 도로는 바둑판처럼 [0] 모양이다." [격자·방사형·미로·원 → 격자] / b03 "[0]은 [1]가 미국에 선물한 것이다." [자유의 여신상·예수상·스핑크스·모아이 → 자유의 여신상] [프랑스·영국·독일·에스파냐 → 프랑스] / b04 "미국의 수도는 뉴욕이 아니라 [0]이다." [워싱턴 D.C.·시카고·보스턴·로스앤젤레스 → 워싱턴 D.C.]
**미션(`stampMissionIds` = 5개 전부)**
| id | NPC | 제목 | 설명 | spec | 보상 | 선행 | 대사(accept / progress / complete / fail) |
|---|---|---|---|---|---|---|---|
| m_newyork_quiz | 에밀리 | 뉴욕 지리 퀴즈 | 에밀리가 내는 뉴욕 퀴즈 5문제 중 4개 이상 맞히기 | quiz | 40 | — | "뉴욕에 대해 퀴즈를 내 볼게! 표지판을 먼저 읽고 오면 쉬울 거야. 준비되면 다시 말 걸어 줘." / "퀴즈에 도전할 준비가 됐어?" / "어썸! 뉴욕은 이제 네 손바닥 안이야." / "아깝다! 표지판을 읽고 다시 도전해 봐." |
| m_newyork_blank | 에밀리 | 뉴욕 빈칸 채우기 | 에밀리의 문장 4개 중 3개 이상 빈칸 채우기 | blank | 30 | m_newyork_quiz | "이번엔 문장 빈칸이야. 보기에서 알맞은 말을 골라 봐." / "빈칸 채우기에 도전할래?" / "완벽해! 뉴욕을 문장으로도 설명할 수 있구나." / "표지판 문장을 다시 읽고 도전해 봐." |
| m_newyork_order | 노아 | 순서대로 맞추기 | 노아의 순서 문제 2개를 모두 맞히기(문제당 2번까지) | order | 30 | — | "센트럴 파크 벤치에서 순서 문제 하나 어때? 오래된 것부터, 서쪽부터 늘어놓아 봐." / "순서 맞추기에 도전할래?" / "정확해! 역사와 지도를 한 줄로 꿰었어." / "카드 아래 숫자를 떠올리며 다시 해 보자." |
| m_newyork_ox | 노아 | 뉴욕 OX 퀴즈 | 노아가 내는 OX 퀴즈 5문제 중 4개 이상 맞히기 | ox | 30 | m_newyork_order | "뉴욕의 기후와 문화에 대해 OX 퀴즈를 내 볼게. 준비되면 다시 말 걸어 줘!" / "OX 퀴즈에 도전해 볼래?" / "굿 잡! 뉴욕의 사계절을 잘 알고 있구나." / "아깝다! 표지판을 읽고 다시 도전해 봐." |
| m_newyork_defeat | 잭슨 | 택시 벌레 소탕 | 남쪽 공터의 노란 택시 벌레 3마리 처치 | defeat taxi_bug ×3 | 30 | — | "남쪽 공터에 노란 택시 벌레가 너무 많아. 3마리만 뿅 하고 없애 줄래? F 키로 공격할 수 있어." / "택시 벌레는 아직 남아 있어?" / "땡큐! 덕분에 거리가 조용해졌어." / — |
기념품: `fur_souvenir_newyork` 자유의 여신상 모형. 착용 아이템: `hat_liberty` 자유의 여신상 왕관(45P).

### A.5 시드니(오스트레일리아, 오세아니아) — 신규
- 테마 `{ ground:'grass', road:'asphalt', building:'modern', tree:'gum', streetTree:'palm', water:'sea', wall:'hedge', bgm:'sydney' }`
- 랜드마크: `lm_sydney_opera`(opera, (22,9), 4×2, overhang 2 — 항구로 튀어나온 곶 위), `lm_sydney_bridge`(harbour_bridge, (14,2), 2×8, overhang 1, `solid:false` — 다리 타일 `B` 위 아치 오버레이)
- 출입구 (39,15), 스폰 (37,15) left. 북쪽 항구(행 2~11)를 하버 브리지(열 14~15)가 남북으로 잇고 북쪽 기슭 산책로(행 1 열 14~15)까지 걸어갈 수 있다. 서큘러 키 산책로(행 12), 도심 블록(행 13~14, 광장 열 19~22), 남서쪽 공원(캥거루), 남동쪽 본다이 해변(모래·갈매기), 동쪽 바다.
```
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
~~TTTTTTTTTTTT..TTTTTTTTTTTTTTTTTTTTTT~~
~~T.....~~~~~~BB~~~~~~~~~~~~~~~~.....T~~
~~T.b...~~~~~~BB~~~~~~~~~~~~~~~~...b.T~~
~~T.....~~~~~~BB~~~~~~~~~~~~~~~~.....T~~
~~TT.T..~~~~~~BB~~~~~~~~~~~~~~~~..T..T~~
~~T.....~~~~~~BB~~~~~~~~~~~~~~~~.....T~~
~~T..l..~~~~~~BB~~~~~~~~~~~~~~~~..l..T~~
~~T.....~~~~~~BB~~~~~~QQQQ~~~~~~.....T~~
~~T.....~~~~~~BB~~~~~~PPPP~~~~~~.....T~~
~~T.....~~~~~~BB~~~~~~PPPP~~~~~~.....T~~
~~T..............~~~~~QQQQ~~~~~......T~~
~~T----------------------------------T~~
~~T-####-####-####-QQQQ-####-####-##-T~~
~~T-####-####-####-QQQQ-####-####-##-T~~
~~T====================================E
~~T...........-####-####-............T~~
~~T..T.....T..-####-####-....T.......T~~
~~T...........-----------............T~~
~~T..,,,...........l.........SSSSSSS~~~~
~~T.,,,,,...................SSSSSSSS~~~~
~~T..,,,..........T........SSSSSSSSS~~~~
~~T........................SSSSsSSSS~~~~
~~T....T........-####-....SSSSsssSSS~~~~
~~T.............-####-....SSSSSsSSSS~~~~
~~T......,,,..............SSSSSSSSSS~~~~
~~T.....,,,,,......b.....SSSSSSSSSSS~~~~
~~T......,,,.............SSSSSSSSSSS~~~~
~~TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT~~~~
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
```
**NPC**
| id | 이름 | 역할 | 위치 | missionIds | cardId | bubble | idleText |
|---|---|---|---|---|---|---|---|
| npc_olivia | 올리비아 | guide | (36,16) | m_sydney_quiz, m_sydney_match | card_sydney_geo | 굿다이! 시드니야 | 항구 쪽으로 가면 오페라 하우스와 하버 브리지가 보여. |
| npc_jack | 잭 | teacher | (23,12) | m_sydney_map, m_sydney_blank | — | 오페라 하우스야 | 돛 모양 지붕 보여? 1973년에 완성된 오페라 하우스야. |
| npc_ruby | 루비 | guard | (26,18) | m_sydney_defeat | — | 갈매기 조심! | 해변의 갈매기가 감자튀김을 노려. 조심해! |
표지판: geo (16,11) 항구 기슭, climate (12,17) 공원, culture (20,13) 도심 광장. 몬스터 존: kangaroo (6,20) r2 ×3, kangaroo (8,26) r2 ×2, seagull (31,23) r3 ×3. `stampMissionIds`: 5개 전부.
**학습 카드**
- `card_sydney_geo` "시드니의 지형": 오세아니아 대륙(오스트레일리아) 남동쪽 바닷가에 있는 오스트레일리아에서 가장 큰 도시이다(인구 약 540만 명). / 세계에서 손꼽히게 큰 천연 항구(시드니 항)를 둘러싸고 도시가 있다. / 항구에 돛 모양 지붕의 오페라 하우스와 하버 브리지가 있다. / 서쪽에는 유칼립투스 숲으로 덮인 블루마운틴이 있고 대륙 안쪽은 넓은 사막이다. / 서울에서 약 8,300km, 비행기로 10시간쯤 걸린다.
- `card_sydney_climate` "시드니의 기후": 남반구에 있어 계절이 우리나라와 반대이다(12~2월이 여름). / 여름(1월 평균 약 23°C)은 따뜻하고 겨울(7월 평균 약 13°C)은 포근해 눈이 거의 오지 않는다. / 비는 1년 내내 고르게 내리며 1년 약 1,200mm이다. / 크리스마스를 여름 해변에서 보낸다. / 서울이 낮 12시일 때 시드니는 오후 1시(호주 여름에는 2시)이다.
- `card_sydney_culture` "시드니의 문화": 영어를 쓰고 화폐는 오스트레일리아 달러이다. / 오스트레일리아의 수도는 시드니가 아니라 캔버라이다. / 원주민 애버리지니의 부메랑·디저리두 문화가 있고 여러 나라에서 온 이민자가 함께 산다. / 캥거루·코알라·오리너구리처럼 다른 대륙에는 없는 동물이 산다. / 국기에는 남십자성 별이 있고 2000년에 시드니 올림픽이 열렸다.
**퀴즈(`quizzes/sydney.ts`)**
| id | kind | topic | 문제 | 선택지/정답 | 해설 |
|---|---|---|---|---|---|
| sydney_c01 | choice | geo | 시드니가 속한 대륙은? | 오세아니아 / 아시아 / 아프리카 / 남아메리카 → 0 | 시드니는 오세아니아 대륙 오스트레일리아 남동쪽 바닷가에 있어요 |
| sydney_c02 | choice | geo | 시드니 항구에 있는 돛 모양 지붕의 건물은? | 오페라 하우스 / 루브르 박물관 / 경복궁 / 피라미드 → 0 | 1973년에 완성된 오페라 하우스는 세계 문화유산이에요 |
| sydney_c03 | choice | climate | 시드니에서 12월은 어떤 계절일까요? | 여름 / 겨울 / 봄 / 가을 → 0 | 남반구는 계절이 우리나라와 반대라 크리스마스가 여름이에요 |
| sydney_c04 | choice | climate | 서울이 낮 12시일 때 시드니(호주 겨울)는 몇 시일까요? | 오후 1시 / 오전 11시 / 밤 12시 / 새벽 4시 → 0 | 시드니는 서울보다 1시간(호주 여름에는 2시간) 빨라요 |
| sydney_c05 | choice | culture | 오스트레일리아의 수도는? | 캔버라 / 시드니 / 멜버른 / 브리즈번 → 0 | 시드니는 가장 큰 도시지만 수도는 캔버라예요 |
| sydney_c06 | choice | culture | 오스트레일리아에만 사는 동물이 아닌 것은? | 판다 / 캥거루 / 코알라 / 오리너구리 → 0 | 판다는 중국에 살아요. 캥거루·코알라·오리너구리는 오스트레일리아에만 살아요 |
| sydney_o01 | ox | geo | 시드니는 오스트레일리아 남동쪽 바닷가에 있다. | O | 시드니는 태평양 쪽 바닷가에 있는 항구 도시예요 |
| sydney_o02 | ox | geo | 오스트레일리아 대륙의 한가운데에는 큰 사막이 있다. | O | 안쪽은 건조한 사막(아웃백)이라 사람들은 대부분 바닷가에 살아요 |
| sydney_o03 | ox | climate | 시드니의 겨울은 서울의 겨울보다 따뜻하다. | O | 7월 평균 기온이 약 13°C로 눈이 거의 오지 않아요 |
| sydney_o04 | ox | culture | 오스트레일리아 원주민을 애버리지니라고 부른다. | O | 부메랑과 디저리두는 원주민 문화예요 |
| sydney_o05 | ox | climate | 시드니 사람들은 12월에 눈 내리는 크리스마스를 보낸다. | X | 12월은 여름이라 해변에서 크리스마스를 즐겨요 |
**짝(`sydney_p01`~`p08`)**: 시드니가 있는 나라–오스트레일리아 / 시드니가 속한 대륙–오세아니아 / 돛 모양 지붕 건물–오페라 하우스 / 시드니 항구의 다리–하버 브리지 / 시드니의 유명한 해변–본다이 / 주머니에 새끼를 키우는 동물–캥거루 / 오스트레일리아의 수도–캔버라 / 오스트레일리아 원주민–애버리지니
**지도 목표(`sydney_t01`~`t05`)**: t01 city sydney "시드니는 어디일까요?" "오스트레일리아 남동쪽 바닷가예요" / t02 region oceania "시드니가 속한 오세아니아 대륙은?" "지도 오른쪽 아래의 대륙이에요" / t03 region pacific "시드니 동쪽의 태평양은?" "오스트레일리아와 아메리카 사이의 넓은 바다예요" / t04 region indian "오스트레일리아 서쪽의 인도양은?" "아프리카와 오스트레일리아 사이의 바다예요" / t05 region asia "오스트레일리아 북쪽의 아시아 대륙은?" "지도 오른쪽 위의 가장 큰 대륙이에요"
**순서(`sydney_r01`, `r02`)**: r01 "남쪽에 있는 도시부터 순서대로" asc, 위도: 시드니 -33.9 / 리우데자네이루 -22.9 / 카이로 30.0 / 파리 48.9, 설명 "남반구 도시는 위도가 마이너스예요. 시드니와 리우는 남반구예요" / r02 "시드니의 계절을 12월부터 순서대로" asc: 여름(12~2월) 1 / 가을(3~5월) 2 / 겨울(6~8월) 3 / 봄(9~11월) 4, 설명 "남반구는 12월이 여름이고 6월이 겨울이에요"
**빈칸(`sydney_b01`~`b04`)**: b01 "시드니는 [0] 대륙의 [1]에 있다." [오세아니아·아시아·유럽·남아메리카 → 오세아니아] [오스트레일리아·뉴질랜드·인도네시아·캐나다 → 오스트레일리아] / b02 "시드니는 [0]에 있어 12월이 [1]이다." [남반구·북반구·적도·북극 → 남반구] [여름·겨울·봄·가을 → 여름] / b03 "돛 모양 지붕의 [0]는 시드니 항구에 있다." [오페라 하우스·에펠탑·피라미드·경복궁 → 오페라 하우스] / b04 "오스트레일리아의 수도는 시드니가 아니라 [0]이다." [캔버라·멜버른·퍼스·브리즈번 → 캔버라]
**미션(`stampMissionIds` = 5개 전부)**
| id | NPC | 제목 | 설명 | spec | 보상 | 선행 | 대사(accept / progress / complete / fail) |
|---|---|---|---|---|---|---|---|
| m_sydney_quiz | 올리비아 | 시드니 지리 퀴즈 | 올리비아가 내는 시드니 퀴즈 5문제 중 4개 이상 맞히기 | quiz | 40 | — | "시드니에 대해 퀴즈를 내 볼게! 표지판을 먼저 읽고 오면 쉬울 거야. 준비되면 다시 말 걸어 줘." / "퀴즈에 도전할 준비가 됐어?" / "노 워리스! 완벽해. 시드니 박사라고 불러도 되겠어." / "아깝다! 표지판을 읽고 다시 도전해 봐." |
| m_sydney_match | 올리비아 | 시드니 짝맞추기 | 올리비아의 카드 6쌍을 14번 안에 모두 맞히기 | match | 30 | m_sydney_quiz | "이번엔 카드 짝맞추기! 오스트레일리아 동물과 명소 짝을 찾아 봐." / "짝맞추기에 도전할래?" / "기억력이 코알라급… 아니 캥거루급이야!" / "카드 위치를 기억하며 다시 해 보자." |
| m_sydney_map | 잭 | 남반구를 찾아라 | 잭이 말하는 곳을 세계지도에서 5번 중 4번 이상 찾기 | mapfind | 30 | — | "세계지도에서 시드니와 오세아니아, 주변 바다를 찾아볼래? 준비되면 말 걸어 줘." / "지도 찾기에 도전할래?" / "지도 박사구나! 남반구는 이제 눈 감고도 찾겠어." / "세계지도에서 오세아니아 위치를 다시 살펴봐." |
| m_sydney_blank | 잭 | 시드니 빈칸 채우기 | 잭의 문장 4개 중 3개 이상 빈칸 채우기 | blank | 30 | m_sydney_map | "이번엔 문장 빈칸이야. 남반구의 계절을 떠올리며 골라 봐." / "빈칸 채우기에 도전할래?" / "완벽해! 남반구의 계절까지 정확히 알고 있구나." / "표지판 문장을 다시 읽고 도전해 봐." |
| m_sydney_defeat | 루비 | 심술 갈매기 소탕 | 본다이 해변의 심술 갈매기 3마리 처치 | defeat seagull ×3 | 30 | — | "해변의 갈매기가 감자튀김을 자꾸 훔쳐 가. 3마리만 뿅 하고 쫓아 줄래? F 키로 공격할 수 있어." / "갈매기는 아직 남아 있어?" / "땡스 메이트! 덕분에 해변이 평화로워졌어." / — |
기념품: `fur_souvenir_sydney` 오페라 하우스 모형. 착용 아이템: `hat_cork` 코르크 모자(40P).

### A.6 리우데자네이루(브라질, 남아메리카) — 신규
- 테마 `{ ground:'grass', road:'asphalt', building:'colorful', tree:'tropical', streetTree:'palm', water:'sea', wall:'hedge', bgm:'rio' }`
- 랜드마크: `lm_rio_maracana`(maracana, (3,2), 4×3), `lm_rio_christ`(christ, (19,3), 2×2, overhang 3 — 바위 언덕(코르코바두) 꼭대기, 도달 불가), `lm_rio_sugarloaf`(sugarloaf, (33,17), 3×3, overhang 2 — 바다로 튀어나온 바위산, 도달 불가)
- 출입구 (0,9), 스폰 (2,9) right. 북쪽 바위 언덕에 예수상, 북서쪽 마라카낭 경기장, 북동쪽 언덕 위 알록달록 집(흙길 `d`), 서쪽 열대 숲(원숭이), 가운데 라군(호수), 남쪽 코파카바나 해변(큰부리새)과 대서양, 동쪽 팡지아수카르.
```
RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR
RT.........TRRRRRRRRRRRRRTdddddddddddddR
RT.PPPP....TRRRRRRRRRRRRRTd##d##d##d##dR
RT.PPPP....TRRRRRRRPPRRRRTd##d##d##d##dR
RT.PPPP....TRRRRRRRPPRRRRTdddddddddddddR
RT.........TRRRRRRRRRRRRRTd##d##d##d##dR
RT.........TRRRRRRRRRRRRRTd##d##d##d##dR
RT.........TTRRRRRRRRRRRTTdddddddddddddR
R......................................R
E=====================================.R
RT.T.T....T.==........~~~~~~.........~~~
RT.,,,....T.==.......~~~~~~~~........~~~
RT,,,,,..T..==.......~~~~~~~~..b.....~~~
RT.,,,....T.==........~~~~~~.........~~~
RTT.T.T.T.T.==.......................~~~
RT..........==.......................~~~
RT..........==.................RRRRRR~~~
RT..........==.................RRPPPR~~~
R==============================RRPPPR~~~
RT..........==.................RRPPPR~~~
RT..........==.................RRRRRR~~~
RT..b.......==.....b...............RR~~~
RTSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS~~~
RTSSSSSSSsSSSSSSSSSSSSSSSSSSSsSSSSSSS~~~
RTSSSSSSsssSSSSSSSSSSSSSSSSSsssSSSSSS~~~
RTSSSSSSSsSSSSSSSSSSSSSSSSSSSsSSSSSSS~~~
RTSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS~~~
R~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
```
**NPC**
| id | 이름 | 역할 | 위치 | missionIds | cardId | bubble | idleText |
|---|---|---|---|---|---|---|---|
| npc_lucas | 루카스 | guide | (8,8) | m_rio_quiz, m_rio_order | card_rio_geo | 올라! 리우야 | 언덕 위 예수상이 보여? 남쪽으로 내려가면 해변이야. |
| npc_isabela | 이자벨라 | teacher | (20,8) | m_rio_blank, m_rio_ox | — | 코르코바두산이야 | 저 위가 코르코바두산이야. 예수상이 도시를 내려다보고 있지. |
| npc_pedro | 페드루 | guard | (16,21) | m_rio_defeat | — | 원숭이 조심! | 서쪽 숲의 원숭이들이 바나나를 훔쳐 가. 조심해! |
표지판: geo (25,15) 라군 남쪽(팡지아수카르 조망), climate (6,22) 해변, culture (5,5) 마라카낭 앞. 몬스터 존: monkey (4,12) r2 ×3, toucan (9,24) r2 ×3, toucan (29,24) r2 ×2. `stampMissionIds`: 5개 전부.
**학습 카드**
- `card_rio_geo` "리우의 지형": 남아메리카 대륙 동쪽, 브라질의 대서양 바닷가에 있는 도시이다(인구 약 620만 명). / 팡지아수카르(슈거로프산)·코르코바두산 같은 바위산이 바다 바로 옆에 솟아 있다. / 코파카바나·이파네마 같은 길고 아름다운 모래 해변이 있다. / 브라질은 남아메리카에서 가장 큰 나라이고, 북쪽에는 세계에서 가장 넓은 열대 우림인 아마존이 있다. / 서울에서 약 18,000km로 지구 거의 반대편이라 비행기로 하루가 넘게 걸린다.
- `card_rio_climate` "리우의 기후": 1년 내내 덥고 습한 열대 기후이다. / 남반구라 12~2월이 여름(낮 30°C 안팎)이고 6~8월이 겨울(낮 25°C 안팎)로 우리나라와 반대이다. / 여름에 비가 더 많이 오고 눈은 오지 않는다(1년 약 1,100mm). / 산에는 열대 우림(치주카 숲)이 우거져 있다. / 서울이 낮 12시일 때 리우는 밤 12시(자정)로 낮과 밤이 정반대이다.
- `card_rio_culture` "리우의 문화": 포르투갈어를 쓰고 화폐는 헤알이다. / 1960년까지 브라질의 수도였고 지금 수도는 브라질리아이다. / 매년 2~3월 삼바 춤과 화려한 퍼레이드로 유명한 카니발이 열린다. / 코르코바두산 꼭대기의 예수상(1931년, 받침대 포함 약 38m)이 도시를 내려다본다. / 축구를 아주 좋아하고(월드컵 5번 우승), 페이조아다·슈하스쿠를 먹으며, 2016년에 리우 올림픽이 열렸다.
**퀴즈(`quizzes/rio.ts`)**
| id | kind | topic | 문제 | 선택지/정답 | 해설 |
|---|---|---|---|---|---|
| rio_c01 | choice | geo | 리우데자네이루가 속한 대륙은? | 남아메리카 / 북아메리카 / 아프리카 / 유럽 → 0 | 리우는 남아메리카 대륙 동쪽, 브라질의 바닷가에 있어요 |
| rio_c02 | choice | geo | 리우의 코르코바두산 꼭대기에 있는 커다란 동상은? | 예수상 / 자유의 여신상 / 스핑크스 / 모아이 → 0 | 1931년에 세워진 예수상은 높이 약 30m(받침대 포함 38m)예요 |
| rio_c03 | choice | climate | 리우의 기후는? | 1년 내내 덥고 습한 열대 기후 / 사계절이 뚜렷한 온대 기후 / 비가 거의 없는 사막 기후 / 1년 내내 추운 한대 기후 → 0 | 리우는 적도에 가까운 남반구 바닷가라 1년 내내 따뜻해요 |
| rio_c04 | choice | climate | 서울이 낮 12시일 때 리우는 몇 시일까요? | 밤 12시(자정) / 낮 12시 / 아침 6시 / 저녁 6시 → 0 | 리우는 서울보다 12시간 느려서 낮과 밤이 정반대예요 |
| rio_c05 | choice | culture | 브라질 사람들이 주로 쓰는 말은? | 포르투갈어 / 에스파냐어 / 영어 / 프랑스어 → 0 | 브라질은 오래전 포르투갈의 식민지였어요. 남아메리카의 다른 나라는 대부분 에스파냐어를 써요 |
| rio_c06 | choice | culture | 매년 2~3월 리우에서 열리는, 삼바 춤을 추는 큰 축제는? | 카니발 / 올림픽 / 추석 / 할로윈 → 0 | 리우 카니발은 세계에서 가장 큰 축제 중 하나예요 |
| rio_o01 | ox | geo | 리우데자네이루는 브라질의 수도이다. | X | 1960년까지는 수도였지만 지금 수도는 브라질리아예요 |
| rio_o02 | ox | geo | 리우에는 산과 바다가 가까이 붙어 있다. | O | 팡지아수카르(슈거로프산)와 코파카바나 해변이 이웃해 있어요 |
| rio_o03 | ox | climate | 리우에서는 겨울에 눈이 자주 온다. | X | 리우의 겨울은 낮 25°C 안팎으로 눈이 오지 않아요 |
| rio_o04 | ox | culture | 브라질은 축구를 아주 좋아하는 나라이다. | O | 브라질은 월드컵에서 5번 우승했어요 |
| rio_o05 | ox | geo | 세계에서 가장 넓은 열대 우림인 아마존은 브라질에 있다. | O | 아마존은 '지구의 허파'라고 불려요 |
**짝(`rio_p01`~`p08`)**: 리우가 있는 나라–브라질 / 브라질에서 쓰는 말–포르투갈어 / 삼바 춤을 추는 축제–카니발 / 코르코바두산 위의 동상–예수상 / 리우의 유명한 해변–코파카바나 / 브라질의 춤–삼바 / 브라질의 수도–브라질리아 / 세계에서 가장 넓은 열대 우림–아마존
**지도 목표(`rio_t01`~`t05`)**: t01 city rio "리우데자네이루는 어디일까요?" "남아메리카 동쪽 바닷가예요" / t02 region south_america "리우가 속한 남아메리카 대륙은?" "지도 왼쪽 아래의 대륙이에요" / t03 region atlantic "리우 동쪽의 대서양은?" "남아메리카와 아프리카 사이의 바다예요" / t04 region north_america "남아메리카 위에 이어진 북아메리카 대륙은?" "지도 왼쪽 위예요" / t05 region africa "대서양 건너 동쪽의 아프리카 대륙은?" "지도 가운데, 남아메리카 오른쪽이에요"
**순서(`rio_r01`, `r02`)**: r01 "먼저 열린 올림픽부터 순서대로" asc, 연도: 서울 1988 / 시드니 2000 / 리우데자네이루 2016 / 파리 2024, 설명 "리우 올림픽은 남아메리카에서 처음 열린 올림픽이에요" / r02 "키가 작은 것부터 순서대로" asc, m: 예수상 38 / 남산(서울) 243 / 팡지아수카르 396 / 코르코바두산 710, 설명 "예수상은 코르코바두산(710m) 꼭대기에 서 있어요"
**빈칸(`rio_b01`~`b04`)**: b01 "리우데자네이루는 [0] 대륙의 [1]에 있다." [남아메리카·북아메리카·아프리카·오세아니아 → 남아메리카] [브라질·아르헨티나·멕시코·에스파냐 → 브라질] / b02 "리우는 1년 내내 덥고 습한 [0] 기후이다." [열대·온대·사막·한대 → 열대] / b03 "브라질에서는 [0]를 쓰고, 매년 [1]이 열린다." [포르투갈어·에스파냐어·영어·프랑스어 → 포르투갈어] [카니발·올림픽·추석·할로윈 → 카니발] / b04 "코르코바두산 꼭대기에는 [0]이 서 있다." [예수상·자유의 여신상·스핑크스·에펠탑 → 예수상]
**미션(`stampMissionIds` = 5개 전부)**
| id | NPC | 제목 | 설명 | spec | 보상 | 선행 | 대사(accept / progress / complete / fail) |
|---|---|---|---|---|---|---|---|
| m_rio_quiz | 루카스 | 리우 지리 퀴즈 | 루카스가 내는 리우 퀴즈 5문제 중 4개 이상 맞히기 | quiz | 40 | — | "리우에 대해 퀴즈를 내 볼게! 표지판을 먼저 읽고 오면 쉬울 거야. 준비되면 다시 말 걸어 줘." / "퀴즈에 도전할 준비가 됐어?" / "무이투 벵(아주 좋아)! 리우 박사구나." / "아깝다! 표지판을 읽고 다시 도전해 봐." |
| m_rio_order | 루카스 | 순서대로 맞추기 | 루카스의 순서 문제 2개를 모두 맞히기(문제당 2번까지) | order | 30 | m_rio_quiz | "올림픽과 산 이야기로 순서 문제를 낼게. 먼저 열린 것부터, 낮은 것부터 늘어놓아 봐." / "순서 맞추기에 도전할래?" / "정확해! 리우의 산과 역사를 한 줄로 꿰었어." / "카드 아래 숫자를 떠올리며 다시 해 보자." |
| m_rio_blank | 이자벨라 | 리우 빈칸 채우기 | 이자벨라의 문장 4개 중 3개 이상 빈칸 채우기 | blank | 30 | — | "문장의 빈칸을 채워 볼까? 보기 중에서 알맞은 말을 골라 봐. 준비되면 말 걸어 줘." / "빈칸 채우기에 도전할래?" / "완벽해! 브라질을 문장으로도 설명할 수 있구나." / "표지판 문장을 다시 읽고 도전해 봐." |
| m_rio_ox | 이자벨라 | 리우 OX 퀴즈 | 이자벨라가 내는 OX 퀴즈 5문제 중 4개 이상 맞히기 | ox | 30 | m_rio_blank | "리우의 기후와 문화에 대해 OX 퀴즈를 내 볼게. 준비되면 다시 말 걸어 줘!" / "OX 퀴즈에 도전해 볼래?" / "브라보! 열대 기후와 남반구를 정확히 알고 있구나." / "아깝다! 표지판을 읽고 다시 도전해 봐." |
| m_rio_defeat | 페드루 | 장난꾸러기 원숭이 소탕 | 서쪽 숲의 장난꾸러기 원숭이 3마리 처치 | defeat monkey ×3 | 30 | — | "서쪽 숲의 원숭이들이 관광객 바나나를 다 훔쳐 가. 3마리만 뿅 하고 쫓아 줄래? F 키로 공격할 수 있어." / "원숭이는 아직 남아 있어?" / "오브리가두(고마워)! 덕분에 숲이 조용해졌어." / — |
기념품: `fur_souvenir_rio` 예수상 모형. 착용 아이템: `top_brazil` 브라질 축구 유니폼(40P).

---

## 부록 B. 대륙·대양 영역 폴리곤(`src/shared/content/regions.ts`)
`[lon, lat]` 꼭짓점 목록. 판정 순서: 대륙 6개 → 대양(태평양·대서양·인도양) → `lat ≥ 68` → `arctic`, `lat ≤ -58` → `southern` → 그 외 `null`. 태평양은 경도 180을 넘는 값으로 적었으므로 `pointInPolygon`은 `lon`과 `lon + 360`을 모두 시도한다. 거친 근사이며 학습용 클릭(대륙·대양 중심부)을 판정하는 용도다. 라벨 좌표(`continents.ts`)는 모두 자기 영역 안에 있어야 한다(`content.test.ts`).
```ts
export const REGIONS: Record<RegionId, [number, number][]> = {
  asia: [[26,42],[60,72],[100,78],[140,72],[180,68],[180,60],[160,58],[140,45],[122,30],[110,10],[104,1],[95,8],[78,6],[70,20],[58,24],[56,14],[43,12],[38,18],[35,26],[34,30],[36,36],[26,40]],
  europe: [[-10,36],[-11,44],[-6,50],[-12,58],[-1,62],[12,66],[20,72],[35,72],[60,72],[60,50],[50,46],[40,44],[28,40],[26,36],[15,37],[5,38],[-6,36]],
  africa: [[-18,36],[-18,14],[-10,4],[6,2],[8,-6],[12,-18],[15,-36],[22,-36],[35,-32],[50,-27],[52,-10],[52,12],[43,12],[38,18],[35,26],[33,31],[20,32],[10,37],[-6,36]],
  north_america: [[-170,66],[-170,72],[-120,74],[-90,76],[-60,84],[-15,84],[-15,70],[-50,58],[-52,45],[-70,42],[-74,34],[-80,24],[-77,18],[-83,8],[-92,12],[-106,18],[-120,30],[-128,40],[-135,55],[-170,52]],
  south_america: [[-82,12],[-60,12],[-50,2],[-33,-8],[-38,-24],[-50,-34],[-56,-40],[-64,-52],[-72,-58],[-78,-50],[-72,-38],[-72,-18],[-82,-6]],
  oceania: [[112,-10],[132,-8],[142,-8],[152,-6],[160,-8],[180,-12],[180,-50],[164,-50],[150,-42],[138,-40],[128,-34],[112,-36]],
  pacific: [[120,58],[160,58],[195,60],[235,42],[255,20],[280,6],[288,-20],[288,-56],[150,-56],[112,-40],[112,-12],[104,0],[110,10],[122,28]],
  atlantic: [[-70,60],[-40,66],[-20,66],[-10,58],[-10,36],[-18,14],[-10,4],[6,2],[8,-6],[12,-18],[16,-36],[20,-55],[-65,-55],[-64,-50],[-55,-38],[-48,-30],[-38,-22],[-33,-6],[-50,4],[-60,12],[-77,18],[-80,26],[-74,36],[-68,44],[-52,50]],
  indian: [[20,-56],[20,-36],[36,-30],[42,-14],[52,10],[58,20],[72,20],[78,6],[96,10],[104,0],[112,-12],[114,-36],[150,-56]],
  arctic: [[-180,68],[180,68],[180,90],[-180,90]],
  southern: [[-180,-90],[180,-90],[180,-58],[-180,-58]],
};
```
필수 테스트 좌표(7.2)와 함께, 지중해 가운데 `(15,35)`는 어느 대륙도 아니어야 하고(`null`), `(0,0)`(기니만)은 `atlantic`, `(-179,0)`과 `(179,0)`은 `pacific`, 카이로 `(31.24,30.04)`는 `africa`(홍해 가운데를 아시아·아프리카 경계로 삼음), `(45,25)`(아라비아반도)는 `asia`, `(20,-20)`(아프리카 남부 내륙)은 `africa`여야 한다. 9개 마커 도시와 라벨 11개도 모두 자기 영역으로 판정된다(위 좌표 전부 검증 스크립트로 확인함).

## 부록 C. BGM 예시 패턴(`world` 테마 전체, 나머지는 6.5의 지침대로 Build가 작곡)
```ts
export const WORLD_THEME: BgmTheme = {
  id: 'world', bpm: 72, beatsPerBar: 4, leadWave: 'triangle',
  // 8마디 = 32박. lead: C장조 아르페지오(I–vi–IV–V), 각 음 0.5박
  lead: [
    ['C5',.5],['E5',.5],['G5',.5],['C6',.5],['G5',.5],['E5',.5],['C5',.5],['E5',.5],
    ['A4',.5],['C5',.5],['E5',.5],['A5',.5],['E5',.5],['C5',.5],['A4',.5],['C5',.5],
    ['F4',.5],['A4',.5],['C5',.5],['F5',.5],['C5',.5],['A4',.5],['F4',.5],['A4',.5],
    ['G4',.5],['B4',.5],['D5',.5],['G5',.5],['D5',.5],['B4',.5],['G4',.5],['B4',.5],
    ['C5',.5],['E5',.5],['G5',.5],['C6',.5],['E6',1],['D6',.5],['C6',.5],
    ['A4',.5],['C5',.5],['E5',.5],['A5',.5],['C6',1],['B5',.5],['A5',.5],
    ['F4',.5],['A4',.5],['C5',.5],['F5',.5],['A5',1],['G5',.5],['F5',.5],
    ['G4',.5],['B4',.5],['D5',.5],['G5',.5],['B5',1],['C6',1],
  ],
  // bass: 마디마다 근음 2박 + 5도 2박
  bass: [['C3',2],['G3',2],['A2',2],['E3',2],['F2',2],['C3',2],['G2',2],['D3',2],
         ['C3',2],['G3',2],['A2',2],['E3',2],['F2',2],['C3',2],['G2',2],['G2',2]],
  // drums: hat만 2박마다(잔잔)
  drums: Array.from({ length: 16 }, () => ['h', 2] as DrumStep),
};
```
검증: `sum(lead beats) === sum(bass beats) === sum(drums beats) === 32`. 다른 테마도 같은 규칙(3/4 왈츠는 마디당 3박, 총 박 수 = 마디 수 × 3).
