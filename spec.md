# spec.md — 2D 학습형 RPG v0.1 계획 (세계 도시 여행)

이 문서는 Build 서브에이전트의 유일한 설계 기준이다. 기존 3D 버전(spec.md 이전판, git `b5799f0`)을 대체한다.

## 1. 개요와 v0.1 범위

### 1.1 개요
초등 5~6학년 사회(세계의 대륙과 대양, 지형·기후, 각 나라의 생활 모습·문화)를 소재로 한 2D 탑다운 픽셀아트 RPG.
플레이어는 아바타로 세계지도(허브)에서 도시를 골라 들어가 탐험하고, NPC에게 받은 미션(=퀴즈 등 미니게임)을 클리어하고, 귀여운 지역 몬스터를 물리쳐 포인트를 모아 아바타와 아바타 룸을 꾸민다.

v0.1은 **싱글플레이 + 브라우저(localStorage) 저장**이며, 진행 데이터·규칙을 순수 TS(`src/shared`)에 두어 이후 서버 계정·멀티플레이로 확장하기 쉽게 만든다.

### 1.2 v0.1 포함
| 영역 | 내용 |
|---|---|
| 화면 | 타이틀 → 세계지도(허브) → 도시 맵 → 미니게임(오버레이) / 아바타 룸 |
| 세계지도 | 6대륙·5대양 라벨이 있는 세계지도, 도시 마커 9개. 서울·파리만 입장 가능, 나머지는 "준비 중" |
| 도시 | 서울(아시아), 파리(유럽). 각 40×30 타일(32px) 맵, 학습 표지판 3개(지형/기후/문화), NPC 3명, 미션 3개, 몬스터 2종 |
| 이동 | 방향키/WASD 4방향 이동, 타일 충돌, 카메라 추적. 스프라이트 걷기 애니메이션 |
| 학습 | 도시 학습 카드(지형·기후·문화), 표지판/안내원으로 열람. 처음 읽으면 +5포인트 |
| 미션 | 미니게임 미션 2종(4지선다 퀴즈, OX 퀴즈) + 처치 미션 1종. 미니게임은 플러그인식 공통 인터페이스 |
| 전투 | F 키 근접 공격, 몬스터 추적/공격/귀환 FSM, 처치 시 소량 포인트, 리스폰(반복 처치로 포인트 파밍 허용). 플레이어 HP 0 → 도시 입구에서 부활(페널티 없음) |
| 포인트 | 미션 보상·처치·학습 카드로 획득, 상점에서 소비. 누적 포인트로 "여행자 등급" 표시 |
| 테스트 | `vitest`로 `src/shared` 로직 단위 테스트(퀴즈 채점, 포인트, 해금, 저장 검증/마이그레이션 등). Review에서 실행 |
| 아바타 룸 | 프로필(이름·등급·도장), 아바타 미리보기, 상점(머리/옷/모자/가구), 장착, 8×6 격자 가구 배치 |
| 아바타 | 레이어(몸+옷+머리+모자) 합성 스프라이트. 장착 상태가 도시 맵과 룸에 동일하게 반영 |
| 저장 | localStorage(`play1.progress`), 진행 변화 시 즉시 저장 + `beforeunload`, 버전 검증, 초기화 |
| 에셋 | 외부 파일 없이 코드로 생성한 플레이스홀더 텍스처로 동작. 매니페스트 한 곳에서 CC0 팩으로 교체 가능 |
| 서버 | 기존 `server/index.js`(Express 정적 서빙, 3100, `/health`, `attachRealtime` 접점) 유지 |

### 1.3 v0.1 제외
- 멀티플레이, 서버 계정/로그인, 서버 저장(설계 고려만, 7절)
- 서울·파리 외 도시 콘텐츠, 짝맞추기 등 3번째 미니게임(v0.2, 인터페이스만 대비)
- 외부 아트 팩·폰트 다운로드(v0.1은 자체 생성 픽셀 아트로 완성. 후보만 6.10에 기록), 사운드/BGM
- 마우스 클릭 이동, 모바일 터치 조작, 게임패드
- 레벨/경험치 시스템(포인트 체계로 대체), 인벤토리·소비 아이템·장비 스탯
- 다중 저장 슬롯, 저장 내보내기/가져오기
- 클라이언트(Phaser 씬) 자동 테스트(브라우저 체크리스트로 대체)

---

## 2. 기술 스택과 의존성

- 언어: **TypeScript** `strict: true` (기존 `tsconfig.json` 유지)
- 2D 엔진: **Phaser 3** `^3.90.0` (3.x 최신 안정판. 설치 실패 시 `^3.87.0`. 4.x는 API가 다르므로 사용 금지). 자체 타입 포함
- 빌드: **Vite** `^6.0.0` (기존). 서버: **Node 20+**, **Express** `^4.21.0` (기존)
- 테스트: **vitest** `^3.0.0` (`src/shared/**/*.test.ts`만 대상, Node 환경)
- 제거: `three`, `@types/three`
- 미설치(주석만): `socket.io`, `socket.io-client`

`package.json`:
```json
{
  "name": "play1", "version": "0.2.0", "private": true, "type": "module",
  "description": "2D educational RPG v0.1 (elementary social studies, single-player, multiplayer-ready)",
  "scripts": { "dev": "vite", "build": "vite build", "preview": "vite preview", "start": "node server/index.js", "typecheck": "tsc --noEmit", "test": "vitest run", "test:watch": "vitest" },
  "dependencies": { "express": "^4.21.0", "phaser": "^3.90.0" },
  "devDependencies": { "@types/express": "^4.17.21", "@types/node": "^20.14.0", "typescript": "^5.6.0", "vite": "^6.0.0", "vitest": "^3.0.0" },
  "engines": { "node": ">=20" }
}
```
`vite.config.ts`: `build.rollupOptions.output.manualChunks = { phaser: ['phaser'] }`, `chunkSizeWarningLimit: 1500`(Phaser 단독 청크 ≈1.2MB). `server.port: 5173`. `test: { include: ['src/shared/**/*.test.ts'], environment: 'node' }`(vitest 설정을 같은 파일에 둔다. `defineConfig`는 `vitest/config`에서 import).

`index.html`: `<div id="game"></div>` 하나와 `<script type="module" src="/src/client/main.ts">`. HUD DOM은 없다(모든 UI는 Phaser 씬). 배경 `#1b1b2f`, `body { margin:0; overflow:hidden }`. 폰트는 시스템 폰트(`'Galmuri11', 'DungGeunMo', system-ui, sans-serif` 순서, 미설치 시 폴백).

Phaser 설정(`client/config.ts`): `type: AUTO`, `width: 960, height: 540`, `pixelArt: true, roundPixels: true`, `scale: { mode: FIT, autoCenter: CENTER_BOTH }`, `physics: { default: 'arcade', arcade: { debug: false } }`, `parent: 'game'`, `backgroundColor: '#1b1b2f'`, 씬 목록은 5절 순서.

---

## 3. 기존 코드 처리 계획

원칙: Three.js·3D 물리·고정 스텝 루프는 모두 삭제. 재사용은 "패턴/로직"이 중심이며 파일 자체는 대부분 새 위치로 옮겨 다시 쓴다. 삭제 파일은 git에 남아 있으므로 복구 가능.

| 기존 파일 | 처리 | 내용 |
|---|---|---|
| `src/shared/types.ts` | 수정(전면) | Vec3·PlayerState·MonsterState·Command·SimEvent 삭제. `QuestStatus` 상태 집합은 `MissionStatus`로 계승. 새 타입은 6.0절 |
| `src/shared/vec.ts` | 수정 → `vec2.ts` | 2D로 축소: `dist, normalize, clamp, lerp`. Vec3 유틸 삭제 |
| `src/shared/constants.ts` | 수정 | 물리 상수 삭제. TILE_SIZE, 이동 속도, 전투 수치, 포인트 상수로 교체(6.1·6.5절) |
| `src/shared/data/map.ts` | 삭제 | 3D AABB 맵. 도시 타일맵은 `content/cities/*.ts` |
| `src/shared/data/monsters.ts` | 삭제 → `content/monsters.ts` | `MonsterDef` 필드 구조(aggro/attackRange/leash/respawn)와 `getMonsterDef` 패턴 재사용 |
| `src/shared/data/npcs.ts`, `quests.ts` | 삭제 → `content/cities/*.ts` | NPC가 `questIds`를 갖고 `prerequisiteQuestId`로 해금하는 구조 재사용 |
| `src/shared/data/levels.ts` | 삭제 | 레벨 폐지. `statsForLevel` 패턴은 `logic/points.ts`의 `rankForTotal`로 계승 |
| `src/shared/sim/step.ts`, `playerSim.ts`, `collision.ts` | 삭제 | 이동·충돌은 Phaser Arcade가 담당 |
| `src/shared/sim/monsterSim.ts` | 삭제 → `client/entities/Monster.ts` | idle/chase/attack/return/dead FSM, 리쉬 귀환·도착 시 회복 규칙을 2D로 재작성. 피해 계산만 shared(`logic/combat.ts`) |
| `src/shared/sim/combatSim.ts` | 수정 → `logic/combat.ts` | `applyDamageToPlayer`(무적 시간)·처치 보상 규칙을 위치 무관 순수 함수로 |
| `src/shared/sim/questSim.ts` | 수정 → `logic/missions.ts` | `interactWithNpc`의 4단계 결정(보고→진행→수락→없음)과 `unlockDependents` 그대로 계승, 처치 카운트 로직 재사용 |
| `src/shared/sim/levelSim.ts` | 삭제 → `logic/points.ts` | 이벤트 합산 방식만 참고 |
| `src/shared/sim/createState.ts` | 수정 → `logic/progress.ts` | `createState/createQuestTable` 패턴으로 `createProgress()`; 결정론적 링 배치(`createMonsters`)는 `client/entities/spawn.ts`에서 재사용 |
| `src/client/main.ts` | 수정 | `new Phaser.Game(config)` |
| `src/client/Game.ts`, `Input.ts`, `CameraController.ts` | 삭제 | Phaser 씬/입력/카메라로 대체. `PendingEdges` 문제는 Phaser `JustDown`으로 해소 |
| `src/client/view/*` (6개) | 삭제 | Three.js 전용 |
| `src/client/ui/HUD.ts`, `hud.css` | 삭제 → `scenes/HudScene.ts` | "값이 바뀐 요소만 갱신" 캐시 패턴, 로그 TTL, 조사(`josa`) 유틸 재사용 |
| `src/client/persistence.ts` | 수정 → `shared/save/schema.ts` + `client/storage.ts` | validate/try-catch/버전 검증/dirty·스로틀 구조 유지. 검증·직렬화는 shared로, localStorage 접근만 client에 |
| `server/index.js` | 유지 | 변경 없음 |
| `index.html`, `vite.config.ts`, `package.json` | 수정 | 2절 |
| `tsconfig.json`, `.gitignore` | 유지 | |
| `dist/` | 재생성 | `npm run build` |
| `review.md` | 유지 | Review 단계에서 덮어씀 |
| `agents/build.md`, `agents/review.md` | 유지(범위 밖) | 3D 기준 문구가 있어 갱신 필요 — 11절 |

Build 시작 시 `src/client/view`, `src/client/Game.ts`, `Input.ts`, `CameraController.ts`, `src/shared/sim`, `src/shared/data`를 먼저 삭제하고 `npm uninstall three @types/three`를 실행한다.

---

## 4. 파일/폴더 구조

```
play1/
├── package.json  tsconfig.json  vite.config.ts  index.html  .gitignore
├── server/index.js                 # (유지) Express 정적 서빙 + /health + attachRealtime
├── public/assets/.gitkeep          # 교체용 외부 에셋 위치(v0.1 비어 있음)
└── src/
    ├── shared/                     # ★ 순수 TS. phaser/window/document/localStorage/Math.random 금지
    │   ├── types.ts                # 모든 공용 타입(6.0절)
    │   ├── constants.ts            # TILE_SIZE, 속도, 전투, 포인트 상수
    │   ├── vec2.ts                 # 2D 벡터 유틸
    │   ├── rng.ts                  # mulberry32 시드 난수
    │   ├── content/
    │   │   ├── index.ts            # CONTENT 집계·접근자(getCity, getMission, getNpc, getItem, quizPool), validateContent()
    │   │   ├── continents.ts       # 6대륙·5대양 라벨, 도시 마커(위도경도→정규화 좌표, 상태)
    │   │   ├── tiles.ts            # 타일 id·문자 범례·충돌 여부
    │   │   ├── monsters.ts         # MonsterDef 4종
    │   │   ├── items.ts            # 꾸미기 아이템·가구 카탈로그
    │   │   ├── ranks.ts            # 누적 포인트 → 여행자 등급
    │   │   ├── cities/seoul.ts     # CityDef: 학습 카드, ASCII 타일맵, 출입구, 표지판, NPC, 미션, 몬스터 존
    │   │   ├── cities/paris.ts
    │   │   ├── quizzes/seoul.ts    # QuizItem[] (4지선다·OX)
    │   │   └── quizzes/paris.ts
    │   ├── logic/
    │   │   ├── progress.ts         # Progress 타입 생성 createProgress()
    │   │   ├── reducer.ts          # applyAction(progress, action) → ProgressEvent[]  (진행 변경의 단일 진입점)
    │   │   ├── missions.ts         # 미션 상태 전이, decideNpcInteraction(), 처치 카운트
    │   │   ├── unlock.ts           # 도시 잠금/해금/도장 판정
    │   │   ├── points.ts           # 적립/소비, rankForTotal
    │   │   ├── combat.ts           # 피해·무적·처치 보상 순수 함수
    │   │   ├── inventory.ts        # 구매/장착/가구 배치 검증
    │   │   └── minigame/
    │   │       ├── types.ts        # MinigameKind, MinigameSpec, MinigameResult, MinigameLogic 인터페이스
    │   │       ├── quiz.ts         # 4지선다 세션(문항 선택·채점·합격 판정)
    │   │       ├── ox.ts           # OX 세션
    │   │       └── registry.ts     # kind → 로직 팩토리
    │   ├── save/
    │   │   └── schema.ts           # SaveData v2, validate(), toSave()/fromSave(), migrate()
    │   └── __tests__/              # vitest 단위 테스트(shared만 대상)
    │       ├── content.test.ts     # validateContent(): id 참조·타일 좌표 걷기 가능·맵 40×30
    │       ├── minigame.test.ts    # quiz/ox: 시드 고정 문항 선택, 채점, passCount 판정, 풀 부족 처리
    │       ├── missions.test.ts    # decideNpcInteraction 4단계, 처치 카운트, 선행 해금
    │       ├── points.test.ts      # 적립/소비/부족 거부, rankForTotal 경계값
    │       ├── unlock.test.ts      # cityState 4상태, 파리 해금 조건, 도장·기념품
    │       ├── inventory.test.ts   # canBuy/canEquip/canPlace(범위·겹침·중복)
    │       ├── reducer.test.ts     # 시나리오: 수락→미니게임 성공→포인트→파리 해금→구매→장착→배치, rejected 이벤트
    │       └── save.test.ts        # toSave/fromSave 왕복, validate 실패 케이스, 잘못된 itemId 제거, migrate 골격
    └── client/
        ├── main.ts                 # Phaser.Game 생성
        ├── config.ts               # 해상도·물리·씬 등록
        ├── session.ts              # 런타임 전역: progress 보유, dispatch(action) → reducer → 이벤트 emit → 저장
        ├── storage.ts              # localStorage 어댑터(load/save/clear, try/catch, 스로틀)
        ├── assets/
        │   ├── manifest.ts         # 텍스처 키·프레임 규격·외부 파일 경로(교체 지점 한 곳)
        │   ├── placeholders.ts     # Canvas로 타일셋·캐릭터 레이어·몬스터·아이콘·가구 생성
        │   └── avatarCompositor.ts # 장착 레이어 합성 → 텍스처 키, 걷기 애니메이션 등록
        ├── scenes/
        │   ├── BootScene.ts        # 텍스처 준비, 저장 로드, Title로
        │   ├── TitleScene.ts       # 새로 시작/이어하기/초기화
        │   ├── WorldMapScene.ts    # 허브
        │   ├── CityScene.ts        # 도시 탐험(타일맵·플레이어·NPC·몬스터·표지판·출입구)
        │   ├── HudScene.ts         # 도시 위 오버레이(포인트·HP·미션·대화·학습 카드·힌트·로그)
        │   ├── AvatarRoomScene.ts  # 프로필·미리보기·상점·가구 배치
        │   └── minigames/
        │       ├── MinigameHost.ts # 공통 런처(pause/launch/resume, 결과 전달), kind → 씬 키 레지스트리
        │       ├── QuizScene.ts
        │       └── OxScene.ts
        ├── entities/
        │   ├── Player.ts           # Arcade 스프라이트, 4방향 이동/애니, 공격 히트박스, HP
        │   ├── Npc.ts              # 정지 스프라이트 + 머리 위 ! / ? 표시
        │   ├── Monster.ts          # FSM(idle/chase/attack/return/dead), 피격 틴트·넉백, 리스폰
        │   └── spawn.ts            # 존 안 결정론적 스폰 위치 계산(걷기 가능 타일로 스냅)
        ├── map/
        │   └── buildCityMap.ts     # CityDef.rows → Phaser Tilemap + 충돌 설정 + 출입구 존
        └── ui/
            ├── theme.ts            # 색·폰트·패널 스타일 상수
            ├── Panel.ts            # 9-slice 없이 Graphics 사각형 + 텍스트 패널
            ├── Button.ts           # 클릭/호버/비활성 버튼
            ├── DialogBox.ts        # NPC 대화창(이름+본문, 다음/닫기)
            └── LearnCard.ts        # 학습 카드 오버레이(지형/기후/문화 탭)
```

의존 방향: `client → shared`만 허용. `shared`는 `client`·`phaser`를 import하지 않는다. 진행(`Progress`)을 바꾸는 코드는 `shared/logic/reducer.ts` 하나뿐이며 클라이언트는 `session.dispatch()`로만 호출한다. 실시간 상태(위치·HP·몬스터)는 Phaser 엔티티가 갖고 저장하지 않는다.

---

## 5. 화면(Scene) 구성과 전환 흐름

```
Boot ──▶ Title ──(새로 시작/이어하기)──▶ WorldMap ◀──────────────┐
                                          │  도시 마커 클릭          │ 출입구 타일 / M 키
                                          ▼                         │
                                        City(cityId) ──────────────┘
                                          │ ▲  NPC와 대화(E) → 미션 미니게임
                                          ▼ │  (City pause, Hud 숨김)
                                        Quiz / Ox (오버레이) ─ 결과 → City resume
              WorldMap ──(아바타 룸 버튼 / R 키)──▶ AvatarRoom ──(돌아가기/Esc)──▶ WorldMap
```

| 씬 키 | 역할 | 진입 데이터 |
|---|---|---|
| `Boot` | 플레이스홀더 텍스처 생성(`placeholders.ts`), `storage.load()`로 session 초기화, 구 3D 저장 키 `play1.save` 삭제, `Title` 시작 | — |
| `Title` | 제목, 버튼 [새로 시작] [이어하기(저장 있을 때만)] [진행 초기화(저장 있을 때만)]. 새로 시작 시 저장이 있으면 `confirm`. 이름은 `window.prompt('여행자 이름', '여행자')`(취소·빈 값 → '여행자') | — |
| `WorldMap` | 세계지도 배경, 대륙/대양 라벨, 도시 마커, 우상단 포인트·이름, 우하단 [아바타 룸] 버튼, 하단 안내. 마커 호버 툴팁(도시·대륙·상태), 클릭 → 입장 가능하면 `City` | — |
| `City` | 타일맵 탐험. `Hud`를 `scene.launch` 후 위에 유지. 출입구 타일 진입 또는 M 키 → `Hud` stop → `WorldMap` | `{ cityId }` |
| `Hud` | City 위 오버레이. `City`가 launch/stop | `{ cityId }` |
| `Quiz` / `Ox` | `MinigameHost`가 launch. 종료 시 `game.events.emit('minigame:done', result)` 후 자기 stop | `{ spec, seed, missionId }` |
| `AvatarRoom` | 프로필·미리보기·상점·가구 배치 | — |

씬 전환 규칙: `scene.start`로 넘어갈 때 이전 씬은 자동 shutdown. `City.shutdown`에서 `Hud`를 반드시 stop하고 `game.events` 리스너를 해제한다. 미니게임 중 `City`는 `scene.pause`, `Hud`는 `setVisible(false)`; 결과 수신 후 `resume`/`setVisible(true)`. 키보드 입력 충돌 방지를 위해 미니게임 씬은 자기 `input.keyboard`만 쓰고 `City`는 pause 상태라 update가 돌지 않는다.

---

## 6. 핵심 시스템 설계

### 6.0 공용 타입 (`shared/types.ts`)

```ts
export type CityId = 'seoul' | 'paris' | 'beijing' | 'london' | 'cairo' | 'newyork' | 'rio' | 'sydney' | 'nairobi';
export type ContinentId = 'asia' | 'europe' | 'africa' | 'north_america' | 'south_america' | 'oceania';
export type Facing = 'down' | 'left' | 'right' | 'up';
export interface Vec2 { x: number; y: number }
export interface TilePos { tx: number; ty: number }

export interface CityMarker { cityId: CityId; name: string; continent: ContinentId; country: string;
  lonLat: [number, number]; status: 'playable' | 'comingSoon'; unlock: UnlockRule }
export type UnlockRule = { type: 'always' } | { type: 'missionsTurnedIn'; missionIds: string[] };

export interface LearnCard { id: string; cityId: CityId; topic: 'geo' | 'climate' | 'culture'; title: string; lines: string[] }
export interface SignDef { id: string; cardId: string; at: TilePos }
export interface NpcDef { id: string; name: string; role: 'guide' | 'teacher' | 'guard'; at: TilePos; facing: Facing;
  missionIds: string[]; idleText: string; cardId?: string /* guide: 첫 대화에 학습 카드 표시 */ }
export interface MonsterZone { monsterId: string; center: TilePos; radiusTiles: number; count: number }
export interface CityDef { id: CityId; name: string; continent: ContinentId; rows: string[] /* 30행 × 40자 */;
  entrance: TilePos /* 출입구 타일 */; spawn: TilePos; spawnFacing: Facing;
  cards: LearnCard[]; signs: SignDef[]; npcs: NpcDef[]; missions: MissionDef[]; monsterZones: MonsterZone[];
  stampMissionIds: string[] /* 모두 turnedIn → 도장 */ }

export type MinigameKind = 'quiz' | 'ox';           // 'match' 등은 v0.2 후보
export interface MinigameSpec { kind: MinigameKind; cityId: CityId; topics?: QuizTopic[]; count: number; passCount: number }
export interface MinigameResult { kind: MinigameKind; success: boolean; correct: number; total: number; answeredIds: string[] }
export type MissionObjective = { type: 'minigame'; spec: MinigameSpec } | { type: 'defeat'; monsterId: string; count: number };
export interface MissionDef { id: string; cityId: CityId; giverNpcId: string; title: string; description: string;
  objective: MissionObjective; rewardPoints: number; prerequisiteMissionId?: string;
  acceptText: string; progressText: string; completeText: string; failText?: string }
export type MissionStatus = 'locked' | 'available' | 'active' | 'completed' | 'turnedIn';
export interface MissionProgress { missionId: string; status: MissionStatus; count: number; attempts: number }

export type QuizTopic = 'geo' | 'climate' | 'culture';
export type QuizItem =
  | { id: string; cityId: CityId; topic: QuizTopic; kind: 'choice'; question: string; choices: [string, string, string, string]; answer: 0 | 1 | 2 | 3; explanation: string }
  | { id: string; cityId: CityId; topic: QuizTopic; kind: 'ox'; question: string; answer: boolean; explanation: string };

export interface MonsterDef { id: string; cityId: CityId; name: string; color: number; hp: number; atk: number; speed: number;
  aggroRange: number; attackRange: number; attackInterval: number; leashRange: number; points: number; respawnTime: number }

export type ItemSlot = 'body' | 'hair' | 'top' | 'hat' | 'furniture';
export interface ItemDef { id: string; slot: ItemSlot; name: string; price: number; color: number; shape: string;
  size?: { w: number; h: number } /* furniture: 격자 칸 */; default?: boolean; unlockStamp?: CityId /* 기념품 */ }

export interface AvatarEquip { body: string; hair: string; top: string; hat: string | null }
export interface RoomPlacement { itemId: string; gx: number; gy: number }
export interface Progress {
  profile: { name: string; createdAt: number };
  points: number; totalEarned: number;
  missions: Record<string, MissionProgress>;
  stamps: CityId[]; readCards: string[];
  avatar: AvatarEquip; owned: string[]; room: RoomPlacement[];
  lastCity: CityId | null;
  stats: { defeated: number; quizAnswered: number; quizCorrect: number };
}
```
`Progress`는 JSON 직렬화 가능한 순수 데이터여야 한다(클래스·함수·Phaser 객체 금지).

### 6.1 이동·충돌·카메라 (`client/entities/Player.ts`, `client/map/buildCityMap.ts`)

상수(`shared/constants.ts`): `TILE_SIZE=32`, `MAP_COLS=40`, `MAP_ROWS=30`, `PLAYER_SPEED=120`(px/s), `PLAYER_BODY={w:20,h:16, offsetY:14}`(발 부분만 충돌), `ATTACK_COOLDOWN=0.4`, `ATTACK_ACTIVE=0.15`, `ATTACK_REACH=24`, `ATTACK_BOX=28`, `PLAYER_HP=100`, `PLAYER_ATK=10`, `INVULN_TIME=0.6`, `KNOCKBACK=10`, `FAINT_TIME=2`, `INTERACT_RANGE=40`.

- 타일맵: `CityDef.rows`(30행×40자)를 `tiles.ts` 범례로 인덱스 배열로 바꿔 `this.make.tilemap({ data, tileWidth: 32, tileHeight: 32 })`, 타일셋은 플레이스홀더 텍스처 `tiles`(가로 1열, 6.10절). `layer.setCollision(충돌 타일 id 목록)`. 맵 경계 = `physics.world.setBounds(0,0,1280,960)`, `player.setCollideWorldBounds(true)`.
- 범례(`tiles.ts`, 문자 → id, 충돌):

| 문자 | id | 이름 | 충돌 | 문자 | id | 이름 | 충돌 |
|---|---|---|---|---|---|---|---|
| `.` | 0 | 풀 | × | `S` | 8 | 모래 | × |
| `,` | 1 | 짙은 풀(몬스터 존 표시) | × | `s` | 9 | 짙은 모래 | × |
| `=` | 2 | 길 | × | `F` | 10 | 농경지 | × |
| `~` | 3 | 물 | ○ | `Y` | 11 | 가로수(야자수·플라타너스) | ○ |
| `B` | 4 | 다리 | × | `P` | 12 | 랜드마크(탑·기념물) | ○ |
| `T` | 5 | 나무 | ○ | `W` | 13 | 담 | ○ |
| `R` | 6 | 바위/산 | ○ | `E` | 14 | 출입구(트리거) | × |
| `#` | 7 | 건물 | ○ | `*` | 15 | 꽃/장식 | × |

- 입력: `cursors` + WASD. 대각선 입력은 정규화(`body.velocity.normalize().scale(PLAYER_SPEED)`). 마지막 이동 방향을 `facing`으로 저장. 우선순위: 수평·수직 동시 입력 시 마지막으로 누른 축 방향을 facing으로.
- 애니메이션: 텍스처 키별로 `walk_down/left/right/up`(3프레임, 8fps, 반복)과 `idle_*`(가운데 프레임). 정지 시 idle.
- 카메라: `cameras.main.startFollow(player, true, 0.15, 0.15)`, `setBounds(0,0,1280,960)`, `setZoom(1)`. 960×540 뷰포트 안에 맵 1280×960이 스크롤된다. 깊이 정렬: 플레이어·NPC·몬스터는 `setDepth(y)`로 y 정렬.
- 상호작용: E 또는 Space(`JustDown`). 플레이어 중심에서 `INTERACT_RANGE` 이내 가장 가까운 NPC 또는 표지판. 힌트 `[E] 한별과 대화` / `[E] 표지판 읽기`를 Hud에 표시.
- 출입구: `E` 타일 위치에 정적 Zone. overlap 시 `City → WorldMap`(진입 직후 오작동 방지: 스폰 후 1초 동안 무시). M 키도 동일.

### 6.2 세계지도 허브와 도시 잠금/해금 (`content/continents.ts`, `logic/unlock.ts`, `scenes/WorldMapScene.ts`)

- 배경: 960×540 등장방형(equirectangular) 세계지도. v0.1은 `placeholders.ts`가 6대륙을 단순 다각형으로 그린 텍스처 `worldmap`. 마커 좌표는 `lonLat`에서 계산하므로 실제 지도 이미지(예: Natural Earth, 퍼블릭 도메인)로 바꿔도 위치가 맞는다: `x = (lon+180)/360*960`, `y = (90-lat)/180*540`.
- 라벨: 대륙 6개(아시아·유럽·아프리카·북아메리카·남아메리카·오세아니아), 대양 5개(태평양·대서양·인도양·북극해·남극해). 교과서 기준 6대륙을 쓴다(11절 확인 항목 2).
- 도시 마커:

| cityId | 이름 | 대륙 | 위도,경도 | 상태 | 해금 |
|---|---|---|---|---|---|
| seoul | 서울 | 아시아 | 37.57, 126.98 | playable | always |
| paris | 파리 | 유럽 | 48.86, 2.35 | playable | `m_seoul_quiz`, `m_seoul_ox` 보고 완료 |
| beijing | 베이징 | 아시아 | 39.90, 116.40 | comingSoon | — |
| london | 런던 | 유럽 | 51.51, -0.13 | comingSoon | — |
| cairo | 카이로 | 아프리카 | 30.04, 31.24 | comingSoon | — |
| newyork | 뉴욕 | 북아메리카 | 40.71, -74.01 | comingSoon | — |
| rio | 리우데자네이루 | 남아메리카 | -22.91, -43.17 | comingSoon | — |
| sydney | 시드니 | 오세아니아 | -33.87, 151.21 | comingSoon | — |
| nairobi | 나이로비 | 아프리카 | -1.29, 36.82 | comingSoon | — |

- 상태 판정(`unlock.ts`): `cityState(progress, marker) → 'comingSoon' | 'locked' | 'open' | 'stamped'`. `comingSoon`은 항상 회색 "준비 중"; `locked`는 자물쇠 아이콘과 해금 조건 툴팁("서울 퀴즈·OX 미션을 완료하면 열려요"; 파리 마커에서 위도·경도가 서울과 얼마나 떨어졌는지 한 줄 표시); `open`은 노란 핀; `stamped`는 도장 마크. 도장: `CityDef.stampMissionIds`가 모두 `turnedIn`이면 reducer가 `stamps`에 추가하고 `city.stamped` 이벤트(기념품 가구 해금).
- 마커 클릭: `open/stamped` → `dispatch({type:'city.enter'})` 후 `City` 시작. 그 외는 흔들림 + 툴팁만. 키보드: ←/→로 마커 순회, Enter 입장(마우스 없이도 가능).

### 6.3 NPC와 미션 (`logic/missions.ts`, `entities/Npc.ts`)

미션 상태: `locked → available → active → (completed) → turnedIn`. 미니게임 미션은 성공 즉시 `turnedIn`(보고 단계 생략, NPC 앞에서 하기 때문). 처치 미션은 목표 달성 시 `completed`, NPC에게 E로 보고해 `turnedIn`.

`decideNpcInteraction(progress, npc, cityId): NpcAction` (순수) — NPC `missionIds` 순서대로:
1. `completed`인 미션 → `{ kind:'turnIn', missionId }`
2. `active`인 미니게임 미션 → `{ kind:'startMinigame', missionId, spec }`; `active`인 처치 미션 → `{ kind:'progress', text: progressText + ' (n/N)' }`
3. `available`인 미션 → `{ kind:'accept', missionId }`
4. 없음 → `{ kind:'talk', text: npc.idleText }`; guide NPC는 `cardId`가 있고 아직 안 읽었으면 `{ kind:'showCard', cardId }`를 1보다 먼저 반환.

클라이언트(`CityScene.onInteract`)는 결과에 따라 `dispatch`(accept/turnIn/card.read)하고 대화창을 띄우며, `startMinigame`이면 `MinigameHost.launch(spec, missionId)`. 미니게임 결과는 `dispatch({type:'mission.minigameResult', missionId, result})` → reducer가 성공 시 `turnedIn`+포인트, 실패 시 `attempts++`·`active` 유지(`failText` 대화 "아깝다! 표지판을 읽고 다시 도전해 봐."). 재도전 제한 없음.

미니게임 공통 인터페이스(`logic/minigame/types.ts`):
```ts
export interface MinigameLogic<S> {
  kind: MinigameKind;
  create(spec: MinigameSpec, pool: QuizItem[], seed: number): S;      // 문항 선택(시드 난수), 상태 생성
  current(s: S): QuizItem | null;                                     // 현재 문항(없으면 종료)
  answer(s: S, choice: number | boolean): { correct: boolean; explanation: string };
  isDone(s: S): boolean;
  result(s: S): MinigameResult;                                       // success = correct >= passCount
}
```
`registry.ts`: `MINIGAME_LOGIC: Record<MinigameKind, MinigameLogic<any>>`. 클라이언트 `MinigameHost.ts`: `MINIGAME_SCENE: Record<MinigameKind, string>` = `{ quiz:'Quiz', ox:'Ox' }`. 새 미니게임 추가 = shared 로직 1파일 + 씬 1파일 + 두 레지스트리 등록 + `MinigameKind` 확장.

`quiz.ts`: pool에서 `spec.cityId`·`kind:'choice'`·(`topics` 있으면 해당 topic) 필터 → `rng.shuffle` 후 `count`개. 선택지도 시드로 섞고 정답 인덱스 재계산. `ox.ts`: `kind:'ox'` 필터, 동일. 풀이 `count`보다 작으면 있는 만큼 출제하고 `passCount = min(passCount, total)`.

미션 목록(각 도시 3개, 보상은 `rewardPoints`):

| id | 도시 | NPC | 목표 | 보상 | 선행 |
|---|---|---|---|---|---|
| m_seoul_quiz | 서울 | 한별(guide) | quiz: 서울 5문항 중 4개 이상 | 40 | — |
| m_seoul_ox | 서울 | 온유(teacher) | ox: 서울 5문항 중 4개 이상 | 30 | — |
| m_seoul_defeat | 서울 | 호랑(guard) | 먼지 도깨비 3마리 처치 | 30 | — |
| m_paris_quiz | 파리 | 마리(guide) | quiz: 파리 5문항 중 4개 이상 | 40 | — |
| m_paris_ox | 파리 | 루이(teacher) | ox: 파리 5문항 중 4개 이상 | 30 | — |
| m_paris_defeat | 파리 | 피에르(guard) | 심술 비둘기 3마리 처치 | 30 | — |

`stampMissionIds`: 서울 = 3개 전부, 파리 = 3개 전부. 파리 입장 해금은 서울 quiz+ox만 필요(6.2).

### 6.4 학습 콘텐츠 데이터 (`content/cities/*.ts`, `content/quizzes/*.ts`)

학습 카드는 `LearnCard.lines`(문장 배열, 카드당 4~5줄). 아래 내용을 그대로 데이터로 옮긴다(초등 5~6학년 수준, 사실 확인된 내용).

**서울 카드**
- `card_seoul_geo` 지형: 아시아 대륙 동쪽 한반도의 중서부에 있다 / 한강이 도시 가운데를 동서로 흐른다 / 북한산·관악산 등 산으로 둘러싸여 있다 / 우리나라 지형은 동쪽이 높고 서쪽이 낮다(동고서저)
- `card_seoul_climate` 기후: 중위도에 있어 사계절이 뚜렷한 온대 기후 / 여름은 덥고 습하며 장마와 집중호우로 비가 많이 온다 / 겨울은 춥고 건조하며 북서쪽에서 찬 바람이 분다 / 여름에는 남동쪽에서 덥고 습한 바람이 분다(계절풍)
- `card_seoul_culture` 문화: 대한민국의 수도, 인구 약 930만 명 / 조선 시대 궁궐인 경복궁·창덕궁이 있다 / 세종대왕이 만든 한글을 쓴다 / 한복, 김치·비빔밥, 설·추석 같은 명절이 있다

**파리 카드**
- `card_paris_geo` 지형: 유럽 대륙 서쪽, 프랑스의 수도 / 센강이 도시 가운데를 흐르고 강 가운데에 시테섬이 있다 / 넓고 평평한 파리 분지(평야) 위에 있어 높은 산이 없다 / 가장 높은 곳은 몽마르트르 언덕(약 130m) / 서울에서 약 9,000km 떨어져 있어 비행기로 12시간 넘게 걸린다
- `card_paris_climate` 기후: 대서양과 편서풍의 영향을 받는 서안 해양성 기후 / 여름은 서울보다 덜 덥고, 겨울은 서울보다 따뜻하다 / 비가 1년 내내 고르게 조금씩 내린다(1년 약 640mm) / 흐리고 가랑비가 내리는 날이 많다 / 서울이 낮 12시일 때 파리는 새벽 4시(여름에는 5시)로, 서울보다 시간이 느리다
- `card_paris_culture` 문화: 프랑스어를 쓰고 화폐는 유로를 쓴다 / 1889년에 세운 에펠탑, 모나리자가 있는 루브르 박물관, 개선문이 있다 / 바게트·크루아상을 먹고 카페에서 이야기 나누는 문화가 있다 / 프랑스 국기는 파랑·하양·빨강 삼색기 / 2024년 여름 올림픽이 열렸다

**서울 퀴즈(`quizzes/seoul.ts`)** — 4지선다 6개, OX 5개
| id | kind | topic | 문제 | 선택지/정답 | 해설 |
|---|---|---|---|---|---|
| seoul_c01 | choice | geo | 서울이 속한 대륙은? | 아시아 / 유럽 / 아프리카 / 북아메리카 → 0 | 서울은 아시아 대륙 동쪽 한반도에 있어요 |
| seoul_c02 | choice | geo | 서울 한가운데를 흐르는 강은? | 한강 / 낙동강 / 금강 / 영산강 → 0 | 한강은 서울을 동서로 가로질러 흘러요 |
| seoul_c03 | choice | climate | 서울처럼 사계절이 뚜렷한 기후를 무엇이라 할까요? | 열대 기후 / 건조 기후 / 온대 기후 / 한대 기후 → 2 | 중위도의 우리나라는 온대 기후예요 |
| seoul_c04 | choice | climate | 서울 겨울에 차갑고 건조한 바람이 불어오는 방향은? | 북서쪽 / 남동쪽 / 남서쪽 / 북동쪽 → 0 | 겨울에는 북서 계절풍, 여름에는 남동 계절풍이 불어요 |
| seoul_c05 | choice | culture | 조선 시대 왕이 살던 서울의 궁궐은? | 경복궁 / 불국사 / 첨성대 / 석굴암 → 0 | 경복궁은 조선의 첫 번째 궁궐이에요 |
| seoul_c06 | choice | culture | 세종대왕이 만든 우리나라 글자는? | 한글 / 한자 / 가나 / 알파벳 → 0 | 한글은 1443년 세종대왕이 만들었어요 |
| seoul_o01 | ox | culture | 서울은 대한민국의 수도이다. | O | 서울은 대한민국의 수도이자 가장 큰 도시예요 |
| seoul_o02 | ox | climate | 서울은 여름에 장마로 비가 많이 온다. | O | 여름철(6~8월)에 1년 비의 절반 이상이 내려요 |
| seoul_o03 | ox | climate | 서울은 1년 내내 덥고 눈이 오지 않는다. | X | 서울 겨울은 춥고 눈이 와요 |
| seoul_o04 | ox | geo | 우리나라 지형은 동쪽이 높고 서쪽이 낮다. | O | 동고서저라고 해요. 큰 강은 서쪽·남쪽으로 흘러요 |
| seoul_o05 | ox | geo | 서울은 바다에 바로 붙어 있는 항구 도시이다. | X | 서울은 내륙 도시이고, 가까운 항구 도시는 인천이에요 |

**파리 퀴즈(`quizzes/paris.ts`)** — 4지선다 6개, OX 5개
| id | kind | topic | 문제 | 선택지/정답 | 해설 |
|---|---|---|---|---|---|
| paris_c01 | choice | geo | 파리가 속한 대륙은? | 유럽 / 아시아 / 아프리카 / 남아메리카 → 0 | 파리는 유럽 대륙 서쪽 프랑스에 있어요 |
| paris_c02 | choice | geo | 파리 한가운데를 흐르는 강은? | 센강 / 템스강 / 라인강 / 나일강 → 0 | 센강 가운데 시테섬에는 노트르담 대성당이 있어요 |
| paris_c03 | choice | climate | 파리처럼 여름은 서늘하고 겨울은 온화하며 비가 1년 내내 고르게 오는 기후는? | 서안 해양성 기후 / 사막 기후 / 열대 우림 기후 / 툰드라 기후 → 0 | 대서양에서 불어오는 편서풍 덕분이에요 |
| paris_c04 | choice | culture | 1889년에 세워진 파리의 상징인 철탑은? | 에펠탑 / 피사의 사탑 / 빅벤 / 자유의 여신상 → 0 | 에펠탑은 높이 약 330m예요 |
| paris_c05 | choice | culture | 프랑스에서 쓰는 화폐는? | 유로 / 달러 / 파운드 / 원 → 0 | 유로는 유럽의 여러 나라가 함께 쓰는 돈이에요 |
| paris_c06 | choice | culture | 그림 '모나리자'가 있는 파리의 박물관은? | 루브르 박물관 / 대영 박물관 / 국립중앙박물관 / 메트로폴리탄 박물관 → 0 | 루브르는 세계에서 가장 많은 사람이 찾는 박물관 중 하나예요 |
| paris_o01 | ox | culture | 파리는 프랑스의 수도이다. | O | 파리는 프랑스의 수도이자 가장 큰 도시예요 |
| paris_o02 | ox | climate | 파리에는 1년 내내 비가 거의 오지 않는다. | X | 비가 많지는 않지만 1년 내내 고르게 내려요 |
| paris_o03 | ox | geo | 파리는 높은 산으로 둘러싸인 도시이다. | X | 파리는 넓고 평평한 파리 분지에 있어요 |
| paris_o04 | ox | geo | 서울이 낮 12시일 때 파리는 아직 새벽이다. | O | 파리는 서울보다 8시간(여름 7시간) 느려요 |
| paris_o05 | ox | climate | 파리의 겨울은 서울의 겨울보다 따뜻한 편이다. | O | 파리 1월 평균 기온은 약 5°C, 서울은 영하예요 |

`content/index.ts`: `getCity(id)`, `getMission(id)`, `getNpc(cityId, npcId)`, `getMonster(id)`, `getItem(id)`, `quizPool(cityId)`, `ALL_MISSIONS`, `PLAYABLE_CITIES`. 데이터 무결성(NPC missionIds가 존재하는지, 타일 좌표가 걷기 가능한지)은 `validateContent()`로 검사해 Boot에서 `console.assert`.

**도시 타일맵** — 아래 두 맵을 `rows`로 그대로 사용한다(각 30행 40자, 범례는 6.1).

서울(`seoul.ts`): 북쪽 산(바위·나무), 경복궁(가운데 위 6×4 건물)과 광장, 마을 집 4채, 한강(17~20행)과 다리 2개, 남쪽 강변 몬스터 들판. 출입구 `E` (0,10), 스폰 (2,10) 오른쪽 보기.
```
RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR
RRTTRRRTTRRRRTTTRRRRRRTTTRRRRTTRRRRTTTRR
T......................................T
T..####.......######......####.........T
T..####.......######......####.........T
T..####...==..######..==..####.........T
T..####...==..######..==..####.........T
T.........==...****...==...............T
T.........==..........==...............T
T.........==..........==.........T.....T
E=====================================.T
T.........==..........==...............T
T..####...==..........==..####.........T
T..####...==....T.....==..####.........T
T..####...==..........==..####.....T...T
T=====================================.T
T.........==..........==...............T
T~~~~~~~~~BB~~~~~~~~~~BB~~~~~~~~~~~~~~~T
T~~~~~~~~~BB~~~~~~~~~~BB~~~~~~~~~~~~~~~T
T~~~~~~~~~BB~~~~~~~~~~BB~~~~~~~~~~~~~~~T
T~~~~~~~~~BB~~~~~~~~~~BB~~~~~~~~~~~~~~~T
T.........==..........==...............T
T....,....==....,.....==......,........T
T...,,,...==...,,,....==.....,,,.......T
T..,,,,,..==..,,,,,...==....,,,,,......T
T...,,,...==...,,,....==.....,,,.......T
T....,....==....,.....==......,........T
T...T.....==......T...==.......T.......T
T......................................T
TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT
```
서울 오브젝트: NPC 한별(guide, (3,9), cardId `card_seoul_geo`), 온유(teacher, (17,8)), 호랑(guard, (12,21)). 표지판: 지형 (12,16), 기후 (20,9), 문화 (13,7). 몬스터 존: 먼지 도깨비 (5,24) r3 ×3, 먼지 도깨비 (17,26) r3 ×2, 장난꾸러기 까치 (30,24) r3 ×3.

파리(`paris.ts`): 북서쪽 몽마르트르 언덕(바위), 개선문(`P` 2×2, 4~5열 5~6행)과 방사형 광장 길, 대로(10행)를 따라 카페 거리(건물 + `*` 야외 테이블), 북동쪽 루브르(8×3 건물), 센강(15~18행)과 시테섬(16~17행 14~25열, 노트르담 `##`)·다리 3개, 남쪽 에펠탑(`P` 2×2, 4~5열 21~22행)과 잔디 광장·공원 몬스터 존. 출입구 `E` (39,10), 스폰 (37,10) 왼쪽 보기.
```
RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR
RRRRRRRTTRRRTTTRRRRTTRRRRRRTTTRRRRRRTTRR
TRRRR..................................T
T.......##..##..........########.......T
T.......##..##..........########.......T
T...PP..........==......########..==...T
T...PP..........==..............*.==...T
T...............==................==...T
T.=============.==..............*.==...T
T...............==......####....*.==...T
T=====================================.E
T...**..........==....**....**....==...T
T..####.........==....####..####..==...T
T..####.........==....####..####..==...T
T...............==................==...T
T~~~~~~~~~~~~~~~BB~~BB~~~~~~~~~~~~BB~~~T
T~~~~~~~~~~~~~..BB.....##.~~~~~~~~BB~~~T
T~~~~~~~~~~~~~..BB.....##.~~~~~~~~BB~~~T
T~~~~~~~~~~~~~~~BB~~BB~~~~~~~~~~~~BB~~~T
T...............==................==...T
T====================================..T
T...PP..........,,....*.........,,,....T
T...PP.........,,,,..........T.,,,,,...T
T..............,,,,,,........T.,,,,,...T
T....,,,.......,,,,,,..........,,,,,...T
T...,,,,,.......,,,,......T.....,,,....T
T....,,,..........................T....T
T.......T.............T................T
T......................................T
TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT
```
파리 오브젝트: NPC 마리(guide, (36,8), cardId `card_paris_geo`), 루이(teacher, (27,7), 루브르 앞), 피에르(guard, (14,19), 센강 남쪽). 표지판: 지형 (13,14)(센강 북쪽 둑), 기후 (8,7)(개선문 광장), 문화 (8,22)(에펠탑 앞). 몬스터 존: 심술 비둘기 (6,25) r2 ×3, 심술 비둘기 (18,23) r3 ×3, 꼬마 가고일 (33,23) r3 ×3.

### 6.5 몬스터와 전투 (`content/monsters.ts`, `logic/combat.ts`, `entities/Monster.ts`)

몬스터 컨셉: 지역 특색을 가진 귀엽고 무섭지 않은 캐릭터. 처치 연출은 "뿅" 하고 사라지는 정도(폭력성 최소화).

| id | 도시 | 이름 | 컨셉 | HP | 공격 | 속도 | 감지 | 사거리 | 간격 | 리쉬 | 포인트 | 리스폰 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| dust_dokkaebi | 서울 | 먼지 도깨비 | 뿔 달린 회색 먼지 뭉치 | 20 | 5 | 50 | 140 | 24 | 1.2s | 220 | 2 | 25s |
| magpie | 서울 | 장난꾸러기 까치 | 서울시 새 까치, 반짝이는 것을 훔침 | 30 | 8 | 80 | 160 | 24 | 1.0s | 260 | 3 | 30s |
| pigeon | 파리 | 심술 비둘기 | 광장의 통통한 회색 비둘기, 빵 부스러기를 노림 | 20 | 5 | 70 | 140 | 24 | 1.2s | 220 | 2 | 25s |
| gargoyle | 파리 | 꼬마 가고일 | 노트르담 지붕에서 내려온 작은 돌 괴물, 느리지만 튼튼 | 40 | 10 | 45 | 160 | 28 | 1.5s | 260 | 4 | 30s |
(속도·거리 단위 px. 처치 포인트는 의도적으로 낮게: 리스폰을 이용한 반복 처치(파밍)를 허용하되 미션·학습 카드가 주 수입원이 되도록)

- 스폰(`entities/spawn.ts`): 존 중심 주위 반지름 `radiusTiles*0.6` 링에 `count`개를 균등 각도로 배치(기존 `createMonsters` 방식), 각 위치를 가장 가까운 걷기 가능 타일 중심으로 스냅. `Math.random` 없이 결정론적.
- FSM(`Monster.update(dt, player)`): `idle`(제자리 살짝 흔들림) → 플레이어 거리 < aggro → `chase`(플레이어 방향 `speed`, Arcade가 타일 충돌 처리) → 거리 ≤ attackRange → `attack`(간격마다 `combat.damagePlayer`) → 거리 > attackRange×1.3 → `chase`. `chase` 중 스폰에서 leash 초과 또는 플레이어 기절 → `return`(어그로 무시, 스폰 도착 시 HP 전체 회복 후 `idle`). `dead`: 비표시·body 비활성, `respawnTime` 후 스폰 위치에서 `idle`. 몬스터끼리 충돌은 없음(`overlap`만).
- 플레이어 공격: F(`JustDown`) && `cooldown<=0` → `facing` 방향으로 `ATTACK_REACH`만큼 떨어진 `ATTACK_BOX²` 히트박스를 `ATTACK_ACTIVE` 동안 활성. 겹친 살아 있는 모든 몬스터에 `PLAYER_ATK` 피해(`combat.hitMonster`) → 흰색/빨간 틴트 0.15s + 넉백 `KNOCKBACK`px. 플레이어 스프라이트는 공격 중 살짝 앞으로 움찔(트윈 4px). HP ≤ 0 → `dead`, `dispatch({type:'monster.defeated', monsterId, cityId})`(포인트, 처치 미션 카운트).
- `combat.ts`(순수): `damagePlayer(hp, invulnLeft, amount) → {hp, invulnLeft, applied}`(무적 중 무시), `hitMonster(hp, atk) → {hp, dead}`. 위치·Phaser 무관.
- 플레이어 피격: HP 감소, `INVULN_TIME` 동안 깜빡임(alpha 토글), 몬스터 반대 방향 넉백. HP 0 → 기절: 입력 무시, 스프라이트 회전/누움, `FAINT_TIME` 후 `spawn`에서 HP 풀 부활, 몬스터는 모두 `return`. 페널티 없음.
- 몬스터 머리 위 HP 바: 작은 `Graphics`(폭 24), HP 변할 때만 다시 그림. 이름표는 없음(HUD 힌트로 충분).

### 6.6 포인트와 아바타 꾸미기 (`logic/points.ts`, `logic/inventory.ts`, `content/items.ts`)

- 획득: 미션 보상(6.3 표), 처치(`MonsterDef.points`), 학습 카드 첫 열람 +5(`CARD_READ_POINTS`). `points`와 `totalEarned` 동시 증가.
- 예산 설계: 두 도시를 한 번 클리어하면 미션 200 + 카드 30 + 몬스터 1회 처치 약 40 = **약 270포인트**. 아래 가격표(유료 16개 합계 580)에서 270으로 7~8개(전체 22개의 약 1/3)를 살 수 있다. 나머지는 몬스터 반복 처치(처치당 2~4)로 모은다.
- 소비: 상점 구매만. `points >= price`이고 미보유일 때 구매 → `owned`에 추가. 환불·판매 없음.
- 등급(`ranks.ts`, `rankForTotal(totalEarned)`): 0 "새내기 여행자", 100 "동네 탐험가", 250 "대륙 탐험가", 500 "세계 여행가". 프로필과 HUD에 표시만(효과 없음).
- 아이템 카탈로그(`items.ts`), 슬롯별 장착 1개. `default: true`는 새 게임에서 기본 보유·장착:

| id | 슬롯 | 이름 | 가격 | 비고 |
|---|---|---|---|---|
| body_light | body | 밝은 피부 | 0 | default |
| body_tan | body | 건강한 피부 | 0 | 기본 보유 |
| hair_short_black | hair | 짧은 검정 머리 | 0 | default |
| hair_long_brown | hair | 긴 갈색 머리 | 25 | |
| hair_curly_red | hair | 곱슬 빨강 머리 | 30 | |
| hair_pony_blue | hair | 파란 포니테일 | 30 | |
| top_tshirt_blue | top | 파란 티셔츠 | 0 | default |
| top_hoodie_green | top | 초록 후드티 | 30 | |
| top_hanbok | top | 한복 | 40 | 서울 문화 |
| top_mariniere | top | 마리니에르(프랑스 줄무늬 셔츠) | 40 | 파리 문화 |
| hat_cap_red | hat | 빨간 야구 모자 | 30 | |
| hat_gat | hat | 갓 | 40 | 서울 문화 |
| hat_beret | hat | 베레모 | 40 | 파리 문화 |
| hat_crown | hat | 황금 왕관 | 60 | |
| fur_chair | furniture | 의자 | 20 | 1×1 |
| fur_plant | furniture | 화분 | 20 | 1×1 |
| fur_rug | furniture | 러그 | 30 | 2×2 |
| fur_desk | furniture | 책상 | 40 | 2×1 |
| fur_bookshelf | furniture | 책장 | 45 | 1×2 |
| fur_bed | furniture | 침대 | 60 | 2×1 |
| fur_souvenir_seoul | furniture | 남산타워 모형 | 0 | 1×1, `unlockStamp:'seoul'` 도장 시 자동 보유 |
| fur_souvenir_paris | furniture | 에펠탑 모형 | 0 | 1×1, `unlockStamp:'paris'` |

- 장착 반영: `avatarCompositor.textureKeyFor(avatar)`가 `avatar:${body}:${top}:${hair}:${hat}` 키의 합성 텍스처를 (없으면) 만들고 애니메이션을 등록. `Player`와 `AvatarRoom` 미리보기 모두 이 키를 쓴다. `CityScene.create`와 `avatar.changed` 이벤트 시 `player.setTexture(key)`로 갱신. 하나의 캐릭터 시트 규격(6.10)을 모든 레이어가 공유하므로 단순 겹쳐 그리기(body → top → hair → hat 순)로 합성.
- `inventory.ts`(순수): `canBuy(progress, item) → {ok, reason}`, `canEquip(progress, item)`, `canPlace(progress, item, gx, gy) → {ok, reason}`(격자 8×6 범위, 보유, 다른 가구와 겹침 없음, 같은 아이템 중복 배치 없음).

### 6.7 아바타 룸 (`scenes/AvatarRoomScene.ts`)

레이아웃(960×540): 좌측 300px 프로필 패널(이름[클릭 시 `prompt`로 변경], 등급, 포인트, 도장 목록, 아바타 미리보기 3배 확대 + 걷기 애니 토글), 우측 상단 룸 격자(8×6칸, 칸 48px = 384×288, 바닥/벽 플레이스홀더), 우측 하단 상점 탭(머리 / 옷 / 모자 / 가구) 아이템 카드 목록(아이콘·이름·가격·상태[보유/장착/구매]). 
- 아이템 클릭: 미보유 → 구매(`shop.buy`) 시도(포인트 부족 시 붉게 흔들림+메시지). 보유 → 의류는 장착(`avatar.equip`, 모자는 다시 클릭으로 해제), 가구는 배치 모드(격자 위에 반투명 미리보기, 클릭 확정 `room.place`, 우클릭/Esc 취소). 배치된 가구 클릭 → 회수(`room.remove`).
- 하단 [세계지도로] 버튼, Esc 동일.

### 6.8 저장/로드 (`shared/save/schema.ts`, `client/storage.ts`)

```ts
export const SAVE_KEY = 'play1.progress'; export const SAVE_VERSION = 2; export const LEGACY_KEYS = ['play1.save'];
export interface SaveData { version: 2; savedAt: number; progress: Progress }
export function validate(raw: unknown): SaveData | null;   // 구조·타입·범위·콘텐츠 id 존재 검사
export function migrate(raw: unknown): SaveData | null;    // v2만 존재. 미래 버전 대비 switch 골격
export function toSave(p: Progress): SaveData; export function fromSave(s: SaveData): Progress;
```
- 저장 대상: `Progress` 전체. 저장하지 않음: 위치, HP, 몬스터 상태(도시 재입장 시 초기화).
- 저장 시점(`session.dispatch` 후 이벤트가 1개라도 있으면 `storage.requestSave()`): 스로틀 0.5초, dirty 플래그로 마지막 변경 보장. 추가로 씬 전환 시(`City` shutdown, `AvatarRoom` shutdown)와 `beforeunload`에 즉시 저장.
- 로드(Boot): `LEGACY_KEYS` 삭제 → `getItem` → JSON.parse → `validate`. 실패 시 `console.warn` 후 키 삭제, 새 게임. 검증 항목: version, profile.name(1~12자, 아니면 '여행자'로 보정), points/totalEarned 0 이상 정수, missions의 id가 `ALL_MISSIONS`에 존재하고 status가 열거값, `owned`/`avatar`/`room`의 itemId가 카탈로그에 존재, `stamps`가 playable 도시, room 배치가 `canPlace` 규칙 만족(위반 항목만 제거). 기본 아이템은 항상 `owned`에 보정 추가.
- 모든 localStorage 접근은 try/catch, 실패 시 저장 없이 진행(경고 로그, HUD "저장 불가" 표시 1회).
- 초기화: Title의 [진행 초기화] → `confirm` → `storage.clear()` → `session.reset()`.

### 6.9 HUD/UI (`scenes/HudScene.ts`, `client/ui/*`)

`Hud`는 `City` 위에서 항상 실행되며 `session.events`를 구독해 값이 바뀔 때만 텍스트를 갱신한다.
- 좌상단: 이름·등급, 코인 아이콘 + `포인트 120`, HP 바(폭 120, 초록→빨강)
- 우상단: 도시명(`서울 · 아시아`), 미션 추적창(해당 도시의 `active/completed` 미션: `"서울 지리 퀴즈: 한별에게 도전"`, `"먼지 도깨비 처치 1/3"`, `"완료 — 호랑에게 보고"`), 그 아래 저장 표시 "저장됨" 1초
- 하단 중앙: 상호작용 힌트 `[E] …`, 대화창(`DialogBox`: NPC 이름 + 본문, Space/E/클릭으로 닫기. 대화 중 이동 불가)
- 좌하단: 로그(최대 5줄, 5초 TTL): `+2 포인트 (먼지 도깨비)`, `미션 완료: … +40 포인트`, `파리가 열렸어요!`, `서울 도장 획득!`
- 우하단: 조작 안내(`방향키 이동 · E 대화/읽기 · F 공격 · M 세계지도`)
- 피격 시 화면 가장자리 붉은 비네트 0.2s, 기절 시 반투명 오버레이 "어지러워… n초 후 입구에서 다시 시작"
- 학습 카드(`LearnCard`): 화면 중앙 640×360 패널, 상단 탭 3개(지형/기후/문화, 현재 카드 강조), 본문 줄 목록, 하단 [닫기](Esc/E). 열람 시 `dispatch({type:'card.read'})`(첫 열람 +5). 표지판은 자기 카드 탭이 기본 선택, guide NPC는 지형 탭.
- 미니게임 UI(`QuizScene`/`OxScene`): 어두운 반투명 배경, 상단 진행 `3 / 5`와 정답 수, 문제 텍스트(워드랩 폭 760), 4지선다는 세로 버튼 4개(키 1~4도 가능), OX는 큰 O/X 버튼 2개(키 O/X, ←/→). 답 선택 후 정답/오답 색 표시 + 해설 1.5초(또는 클릭) → 다음 문제. 마지막에 결과 패널 `4 / 5 정답 · 성공!`/`3 / 5 · 아쉬워요` [확인] → `minigame:done`.
- 공통 스타일(`theme.ts`): 배경 `#1b1b2f`, 패널 `#2b2d4a` 90%, 테두리 `#8f9bff`, 강조 `#ffd166`, 텍스트 `#ffffff`, 위험 `#ff6b6b`, 성공 `#6bd77b`, 기본 폰트 크기 16, 제목 24.

### 6.10 에셋 전략 (`client/assets/manifest.ts`, `placeholders.ts`)

규격(모든 교체 에셋이 따라야 함):
- 타일: 32×32. 타일셋 텍스처 `tiles` = 가로 1열(32 × (16×32)) 또는 외부 이미지의 경우 `columns` 지정. 타일 id는 6.1 표 순서.
- 캐릭터 레이어 시트(body/top/hair/hat/NPC/몬스터 공통): 프레임 32×32, 3열×4행 = 96×128. 행 순서 `down, left, right, up`, 열 = 걷기 3프레임(가운데가 idle). 레이어는 모두 같은 좌표계에 그려 겹치기만 하면 되도록 한다.
- 아이콘: 24×24(코인, 자물쇠, 도장, 핀, 아이템 아이콘). 가구: 칸당 32×32(2×1은 64×32).
- 세계지도: 960×540 등장방형.

`manifest.ts`는 유일한 교체 지점:
```ts
export const ASSETS = {
  tiles:  { key: 'tiles', frame: 32, source: null /* 'assets/tiles.png' 로 바꾸면 Boot가 파일 로드 */, columns: 1 },
  charLayers: { frame: 32, cols: 3, rows: 4, sources: {} as Partial<Record<string, string>> /* itemId → png 경로 */ },
  monsters: { frame: 32, sources: {} as Partial<Record<string, string>> },
  worldmap: { key: 'worldmap', source: null as string | null },
  icons: { frame: 24, sources: {} as Partial<Record<string, string>> },
} as const;
```
`BootScene`: `source`가 있으면 `this.load.image/spritesheet`로 `public/assets/`에서 로드, 없으면 `placeholders.ts`가 Canvas에 그려 `textures.addCanvas(key, canvas)`(스프라이트시트는 `addSpriteSheet`)로 등록. 플레이스홀더 규칙: 타일은 단색+간단 패턴(물은 물결 선, 나무는 원+줄기, 건물은 벽+지붕, 랜드마크는 탑 모양 삼각형+기둥, 카페 테이블은 원+파라솔), 캐릭터 레이어는 `ItemDef.color/shape`로 도형(몸: 둥근 사각+팔다리 3프레임 위치 변화, 머리: 반원/포니테일, 옷: 몸통 사각, 모자: 상단 도형), 몬스터는 `MonsterDef.color` 도형+눈 2개, 4방향은 눈 위치만 바꿈. 모든 Canvas 그리기는 `imageSmoothingEnabled=false`.

**v0.1은 외부 에셋을 전혀 쓰지 않고 자체 생성 픽셀 아트(플레이스홀더)로 완성한다.** Build는 어떤 파일도 다운로드하지 않는다. 아래는 이후 단계의 교체 후보 기록일 뿐이다(CC0·OFL만. LPC 등 CC-BY-SA 팩은 사용하지 않기로 확정):

| 용도 | 팩 | 라이선스 | URL | 비고 |
|---|---|---|---|---|
| 타일·건물·자연 | Kenney "Tiny Town" | CC0 | https://kenney.nl/assets/tiny-town | 16×16 → `frame:16`으로 두고 카메라 zoom 2, 또는 2배 업스케일 |
| 캐릭터·몬스터 | Kenney "Tiny Dungeon" | CC0 | https://kenney.nl/assets/tiny-dungeon | 16×16, 4방향 아님(좌우 flip으로 대체) |
| RPG 종합(타일+캐릭터) | Kenney "Roguelike/RPG pack" | CC0 | https://kenney.nl/assets/roguelike-rpg-pack | 16×16, 1,700+ 타일 |
| 가구 | Kenney "Roguelike Indoors" | CC0 | https://kenney.nl/assets/roguelike-indoors | 16×16 |
| UI | Kenney "UI Pack" | CC0 | https://kenney.nl/assets/ui-pack | 패널·버튼 |
| 한글 픽셀 폰트 | Galmuri | SIL OFL 1.1 | https://github.com/quiple/galmuri | 웹폰트로 `index.html`에 추가 |
| 세계지도 | Natural Earth (래스터) | 퍼블릭 도메인 | https://www.naturalearthdata.com/ | 등장방형으로 960×540 리사이즈 |

### 6.11 시스템 의존 관계

```
키보드/마우스 ─▶ Phaser Scenes(City/WorldMap/AvatarRoom/Minigame)
                    │ 읽기: content/*, session.progress
                    │ 쓰기: session.dispatch(Action)
                    ▼
        shared/logic/reducer.applyAction ── missions / unlock / points / inventory / combat(규칙)
                    │ ProgressEvent[]
                    ▼
   session.events(EventEmitter) ─▶ HudScene / WorldMapScene / AvatarRoomScene 갱신
                                  ─▶ storage.requestSave() ─▶ shared/save/schema.toSave ─▶ localStorage
실시간(저장 안 함): Player/Monster 엔티티 ↔ Arcade Physics ↔ Tilemap(buildCityMap ← content/cities)
```

`reducer.ts`의 Action/이벤트:
```ts
export type Action =
  | { type: 'profile.setName'; name: string } | { type: 'city.enter'; cityId: CityId }
  | { type: 'mission.accept'; missionId: string } | { type: 'mission.turnIn'; missionId: string }
  | { type: 'mission.minigameResult'; missionId: string; result: MinigameResult }
  | { type: 'monster.defeated'; monsterId: string; cityId: CityId } | { type: 'card.read'; cardId: string }
  | { type: 'shop.buy'; itemId: string } | { type: 'avatar.equip'; slot: Exclude<ItemSlot,'furniture'>; itemId: string | null }
  | { type: 'room.place'; itemId: string; gx: number; gy: number } | { type: 'room.remove'; itemId: string };
export type ProgressEvent =
  | { type: 'points.changed'; delta: number; points: number; reason: string }
  | { type: 'mission.changed'; missionId: string; status: MissionStatus; count: number }
  | { type: 'city.unlocked'; cityId: CityId } | { type: 'city.stamped'; cityId: CityId }
  | { type: 'card.read'; cardId: string; first: boolean } | { type: 'item.bought'; itemId: string }
  | { type: 'avatar.changed' } | { type: 'room.changed' } | { type: 'rank.changed'; rank: string }
  | { type: 'rejected'; action: Action['type']; reason: string };
export function applyAction(progress: Progress, action: Action): ProgressEvent[]; // progress를 제자리 수정
```
규칙 위반(포인트 부족, 잘못된 상태 전이)은 예외 대신 `rejected` 이벤트로 알리고 상태를 바꾸지 않는다. `mission.turnIn`/`minigameResult` 처리 후 `unlock.recheck(progress)`로 도시 해금·도장 이벤트를 붙인다.

---

## 7. 멀티플레이·서버 계정 확장을 위한 설계 고려사항

1. **진행 상태의 단일 변경 경로**: `Progress`는 `applyAction`으로만 바뀐다. 서버 계정 도입 시 같은 reducer를 서버에서 실행해 클라이언트가 보낸 `Action`을 검증·적용하고 결과 `Progress`를 내려주면 된다(치트 방지). 클라이언트는 `session.dispatch`를 로컬 적용에서 서버 요청으로 바꾸기만 한다.
2. **shared 순수성**: `src/shared/**`는 `phaser`, `window`, `document`, `localStorage`, `performance`, `Math.random`을 쓰지 않는다. 난수는 `rng.ts`(시드)로만. Build 시 grep으로 검증(9.1).
3. **저장 형식 = 서버 저장 형식**: `SaveData.progress`를 그대로 서버 DB 문서로 옮길 수 있다. `validate`가 shared에 있으므로 서버도 동일 검증을 쓴다.
4. **콘텐츠 id 안정성**: 도시·미션·아이템·퀴즈 id는 문자열 상수이며 저장에 그대로 들어간다. id를 바꾸면 `migrate`에 변환을 추가한다.
5. **실시간 동기화 경계**: 위치·애니·몬스터는 Phaser 엔티티가 갖는다. 멀티 시 다른 플레이어는 "위치 스냅샷을 받아 보간하는 스프라이트"로 추가하고, 몬스터·전투는 서버 권위로 옮길 수 있게 `Monster` FSM의 결정 부분(다음 상태 계산)을 `decide(state, playerPos, dt)` 순수 메서드로 분리해 둔다(v0.1에서도 이렇게 작성).
6. **서버 접점**: `server/index.js`의 `attachRealtime(httpServer)` 빈 함수와 TODO 주석 유지. 서버는 ESM이므로 이후 `src/shared`를 빌드 산출물로 import 가능.
7. **플레이어 식별**: `Progress.profile`에 `id`는 아직 없다. 계정 도입 시 `profile.id`(서버 발급)를 추가하고 `SAVE_VERSION`을 3으로 올려 `migrate`에서 채운다.
8. **미니게임 결정론**: 문항 선택 `seed`를 Action에 포함하지 않지만, 서버 검증이 필요해지면 `mission.minigameResult`에 `seed`와 `answeredIds`가 이미 있어 재현 가능하다.

---

## 8. 구현 순서 (마일스톤)

| 단계 | 내용 | 완료 기준 |
|---|---|---|
| M0 정리+스캐폴드 | 3절 삭제 목록 제거, `npm uninstall three @types/three && npm install phaser && npm install -D vitest`, `package.json`/`vite.config.ts`/`index.html` 갱신, `config.ts`·`main.ts`·`Boot`·`Title`(버튼만), `shared/types.ts`·`constants.ts`·`vec2.ts`·`rng.ts` | `npm run dev`로 타이틀 화면이 뜨고 콘솔 에러 없음. `npm run typecheck` 통과. `npm test`가 실행됨(테스트 0개여도 성공 종료). 리포에 `three` 문자열 없음 |
| M1 콘텐츠+로직+테스트 | `content/*`(도시 2개, 퀴즈 22개, 몬스터, 아이템, 대륙), `logic/*`(progress, reducer, missions, unlock, points, combat, inventory, minigame/*), `save/schema.ts`, `validateContent()`, `shared/__tests__/*.test.ts` 8개 | typecheck 통과. `npm test` 전부 통과. `reducer.test`의 시나리오(수락→미니게임 성공→포인트→파리 해금→구매→장착→배치→toSave/validate 왕복)가 기대값과 일치 |
| M2 도시 탐험 | `buildCityMap`, `placeholders`(타일·캐릭터), `avatarCompositor`, `Player`, `City`(서울), 카메라, 출입구→`WorldMap`(빈 화면) | 서울 맵이 그려지고 방향키로 걷기 애니와 함께 이동, 물·나무·건물에 막힘, 다리로 강 건넘, 카메라 추적, 출입구에서 세계지도로 |
| M3 NPC·대화·HUD·학습 카드 | `Npc`, `Hud`, `DialogBox`, `LearnCard`, 표지판, `session`+`storage`(저장 연결) | 한별에게 E → 학습 카드(첫 열람 +5 로그) → 다시 E → 미션 수락, 추적창 갱신. 표지판 3개 읽기. 새로고침 후 포인트·읽은 카드 유지 |
| M4 미니게임+미션 | `MinigameHost`, `QuizScene`, `OxScene`, 미션 흐름 | 한별 미션 도전 → 5문항 풀기 → 4개 이상이면 "+40 포인트", 미션 완료. 실패 시 재도전. 온유 OX 동일 |
| M5 몬스터·전투 | `Monster`, `spawn`, 공격 히트박스, 피격·기절·부활, 처치 미션 | 강 남쪽에서 도깨비가 추적·공격, F 2타로 처치(+2), 25초 후 리스폰(다시 처치하면 다시 +2), 3마리 처치 후 호랑에게 보고 +30, 서울 도장·기념품 로그. HP 0 → 2초 후 입구 부활 |
| M6 세계지도·파리 | `WorldMap` 완성(지도·라벨·마커·툴팁·잠금), `paris.ts` 콘텐츠 연결, 해금 | 서울 quiz+ox 완료 전에는 파리 자물쇠, 완료 후 열림. 파리 입장·탐험·미션 3개·몬스터 2종 동작, 다리 3개로 센강·시테섬 이동. 준비 중 도시는 입장 불가 |
| M7 아바타 룸 | `AvatarRoom`, 상점, 장착, 가구 배치, 프로필 | 아이템 구매·장착 → 미리보기와 서울 맵 캐릭터가 같은 모습. 가구 배치·회수, 겹침 거부. 이름 변경 |
| M8 마무리 | Title 이어하기/초기화, 손상 저장 처리, `beforeunload`, 빌드·3100 확인, 순수성 grep, 밸런스 점검, 주석 | 9절 명령 전부 통과, 브라우저 체크리스트 통과 |

각 단계 종료 시 `npm run typecheck`와 `npm test` 통과. spec과 충돌하거나 불명확한 점은 합리적으로 정하고 완료 보고에 "설계 판단"으로 기록한다(spec 수정 금지).

---

## 9. 검증 방법 (Review 단계)

### 9.1 실행 명령
```bash
cd /Users/sungchul/Desktop/play1
npm install
npm run typecheck
npm test                          # vitest: src/shared/__tests__ 전부 통과
grep -rn "three" src package.json index.html && echo "FAIL: three 잔존" || echo "OK"
grep -rnE "from 'phaser'|from \"phaser\"" src/shared && echo "FAIL: shared에 phaser" || echo "OK"
grep -rnE "document\.|window\.|localStorage|performance\.|Math\.random" src/shared && echo "FAIL: shared 순수성" || echo "OK"
npm run dev                       # http://localhost:5173
npm run build && npm start        # http://localhost:3100 , curl http://localhost:3100/health → {"ok":true}
```

### 9.2 브라우저 체크리스트
- [ ] 로드 시 콘솔 에러 없음. 타이틀에 [새로 시작]만 보이고(저장 없음), 이름 prompt 후 세계지도로
- [ ] 세계지도: 대륙 6개·대양 5개 라벨, 마커 9개. 서울만 노란 핀, 파리 자물쇠(툴팁에 조건), 나머지 "준비 중"(클릭해도 입장 안 됨)
- [ ] 서울 입장: (2,10)에 스폰, 방향키/WASD 이동, 걷기 애니, 대각선 속도 동일, 물·나무·건물·바위·담에 막힘, 맵 밖으로 못 나감
- [ ] 카메라가 플레이어를 따라가고 맵 가장자리에서 멈춤. 캐릭터가 나무 뒤/앞 y 정렬로 그려짐
- [ ] 한별 근처에서 `[E] 한별과 대화` 힌트 → E → 학습 카드(지형 탭) + 로그 "+5 포인트" → 닫고 E → 미션 수락 대사, 추적창에 "서울 지리 퀴즈"
- [ ] 표지판 3개 각각 E로 열람, 탭 전환 가능, 첫 열람만 +5(합계 카드 3장 = 15포인트, 지형 카드는 한별과 중복 지급 없음)
- [ ] 한별에게 다시 E → 퀴즈 시작, City 정지·HUD 숨김. 1~4 키와 클릭 모두 동작, 정답/오답 색과 해설 표시, 5문항 후 결과 패널
- [ ] 4개 이상 정답 → "+40 포인트", 미션 완료 로그, 추적창에서 사라짐. 3개 이하 → 실패 대사, 미션 유지, 재도전 가능
- [ ] 온유 OX 미션 동일 흐름(O/X 키·클릭). 두 미니게임 완료 시 로그 "파리가 열렸어요!"
- [ ] 강 남쪽 도깨비 존 접근 시 추적, 접촉 시 HP −5·비네트·깜빡임(0.6초 무적), 등지고 F는 무피해, 마주보고 F 2타에 처치(+2), 25초 후 리스폰. 리스폰한 개체를 다시 처치하면 다시 +2(파밍 가능)
- [ ] 멀리 도망가면 몬스터가 스폰으로 돌아가고 HP 회복. 까치는 더 빠르고 8 피해
- [ ] HP 0 → 기절 오버레이 → 2초 후 (2,10) HP 풀 부활, 포인트·미션 유지
- [ ] 호랑 미션 수락 후 도깨비 3마리 처치 → 추적창 "완료 — 호랑에게 보고" → E → +30, "서울 도장 획득!" 로그
- [ ] 출입구 타일 또는 M → 세계지도. 서울 마커가 도장 표시. 파리 입장 → (37,10) 스폰, 미션 3개·몬스터 2종·표지판 3개 정상, 다리로 센강·시테섬 이동, 에펠탑·개선문·루브르·몽마르트르 바위에 막힘
- [ ] 파리 퀴즈 문항이 6.4 표와 일치(시차·기후·센강 등), 해설이 표시됨
- [ ] 아바타 룸: 프로필(이름·등급·포인트·도장), 미리보기 애니. 포인트 부족 구매 거부 메시지, 구매 → 장착 → 미리보기 반영 → 세계지도 → 서울 입장 시 캐릭터가 같은 모습. 두 도시 클리어 직후 포인트 약 270으로 7~8개 구매 가능
- [ ] 가구 구매·배치·겹침 거부·회수. 서울 도장 후 남산타워 모형이 보유 목록에 있음
- [ ] 이름 변경 후 HUD에 반영
- [ ] 저장: DevTools Local Storage에 `play1.progress`. 새로고침 → 타이틀 [이어하기] → 포인트·미션·아바타·룸·도장 복원. 구 키 `play1.save`를 넣어 두면 부팅 시 삭제됨
- [ ] `{"version":99}`·비JSON으로 손상 시 경고 로그 후 새 게임, 에러 없음. 존재하지 않는 itemId를 room에 넣으면 그 항목만 제거
- [ ] [진행 초기화] confirm 취소 시 변화 없음, 확인 시 새 게임
- [ ] 탭을 30초 전환 후 돌아와도 몬스터가 순간이동하지 않음(Phaser delta 클램프 확인)
- [ ] `npm start` 3100 포트에서 동일 동작, `/health` 응답

### 9.3 코드 리뷰 포인트
- `src/shared`에 phaser/DOM/저장/난수 의존 없음. `Progress`에 비직렬화 값 없음
- `Progress` 변경이 `applyAction` 밖에서 일어나지 않음(grep `progress.` 대입)
- 씬 shutdown 시 `game.events`/`session.events` 리스너 해제(중복 등록으로 이벤트가 두 번 처리되지 않는지: 도시 재입장 후 포인트 로그가 1번만)
- HUD가 매 프레임 텍스트를 재설정하지 않음(변경 시에만)
- `avatarCompositor` 텍스처 캐시(같은 조합 재생성 없음), 씬 전환 시 텍스처 누수 없음
- 미니게임 씬이 pause된 City의 키 입력을 훔치거나, 결과 이벤트가 두 번 발생하지 않음
- 저장 검증이 콘텐츠 id 존재를 확인함

---

## 10. 위험 요소와 대안

| 위험 | 영향 | 대안 |
|---|---|---|
| Phaser 번들 크기(≈1.2MB) | 첫 로딩 지연, Vite 경고 | `manualChunks`로 분리, 경고 한도 상향. v0.1은 허용 |
| `pixelArt` 설정에도 FIT 스케일에서 비정수 배율 흐림 | 픽셀 아트 품질 | `zoom`을 정수로 유지하고 `Scale.FIT`+`roundPixels`. 문제 시 `Scale.NONE`+CSS `image-rendering: pixelated` |
| Canvas 생성 텍스처를 `addSpriteSheet`로 등록할 때 프레임 규격 실수 | 애니 깨짐 | `manifest.ts`의 frame/cols/rows 상수를 생성과 등록 양쪽에서 같은 값으로 사용 |
| 씬 pause/launch 중 키 상태 잔류(E를 누른 채 미니게임 진입 → 첫 문항 즉시 선택) | 오작동 | 미니게임 씬 첫 0.3초 입력 무시, `JustDown`만 사용, City resume 시 `keyboard.resetKeys()` |
| 한글 폰트가 시스템마다 달라 텍스트 폭이 달라짐 | UI 겹침 | 워드랩 폭 고정·패널 여백 넉넉히, `setFixedSize` 사용. 이후 Galmuri 웹폰트로 통일 |
| Arcade 타일 충돌에서 모서리 걸림 | 조작감 | 플레이어 body를 타일보다 작게(20×16), 벽 옆에서 미끄러짐 허용 |
| 몬스터가 타일에 끼여 추적 정지 | 재미 저하 | 몬스터 존을 장애물 없는 열린 지역에 배치(맵에서 확인됨). 2초 이상 이동 없으면 `return` |
| 문항 풀(6/5개)에서 5개 출제라 반복 시 문제가 비슷함 | 학습 반복성 | v0.1은 도시당 11개로 확정(선택지 순서는 섞임). 문항 추가는 v0.2 |
| 포인트 총량(두 도시 약 270)으로 아이템 전부 구매 불가 | 목표 상실 | 확정된 설계(약 1/3 구매 가능, 나머지는 몬스터 반복 처치로 처치당 2~4). 밸런스는 Review 후 조정 제안 |
| 몬스터 파밍이 지나치게 쉬움(입구 근처에서 무한 반복) | 학습보다 전투에 치우침 | 처치 포인트를 2~4로 낮게 유지, 리스폰 25~30초(Review 실측 후 8~12초에서 상향). Review에서 분당 획득량(목표 10~15포인트/분 이하) 측정 후 조정 제안 |
| vitest가 `src/shared` 밖 파일을 수집하거나 Phaser를 import | 테스트 실패 | `vite.config.ts`의 `test.include`를 `src/shared/**/*.test.ts`로 제한, 테스트는 shared만 import |
| `window.prompt`가 일부 환경에서 차단 | 이름 입력 불가 | 취소/차단 시 '여행자'로 진행, 룸에서 재시도 가능 |
| localStorage 불가(프라이빗 모드 등) | 저장 없이 진행 | try/catch, HUD 경고 1회 |
| 콘텐츠 사실 오류 | 교육 목적 훼손 | 6.4 문항은 확인된 내용만 사용. Review에서 문항 사실 재검토 항목 포함 |

---

## 11. 확정된 결정 사항

사용자 승인(2026-09-23) 시 확정된 항목. Build/Review 단계에서 임의로 바꾸지 않는다.

1. **해외 도시: 파리(프랑스, 유럽)**. 학습 축 — 유럽 대륙, 서안 해양성 기후(온화·연중 고른 강수), 센강과 파리 분지(평야), 에펠탑·루브르·개선문 등 문화유산, 프랑스어·유로·바게트 등 생활 문화, 서울과의 시차·거리 비교. 콘텐츠는 6.4(학습 카드 3장, 퀴즈 11문항, 40×30 타일맵), 6.3(NPC 마리·루이·피에르, 미션 3개), 6.5(심술 비둘기·꼬마 가고일), 6.2(마커·해금)에 반영됨. 카이로는 "준비 중" 마커로만 남는다.
2. **대륙 표기: 6대륙·5대양**(교과서 기준). `continents.ts`에 6개 대륙 id 사용.
3. **미니게임: 4지선다 + OX**. 짝맞추기는 v0.2(인터페이스만 대비).
4. **합격 기준**: 5문항 중 4개 이상, 재도전 무제한, 문항 풀 도시당 11개(4지선다 6 + OX 5).
5. **아이템 22개 유지, 가격 조정**: 두 도시 1회 클리어 획득량 약 270포인트로 전체의 약 1/3(7~8개)을 살 수 있도록 6.6 가격표를 낮춤(유료 16개 합계 580). 몬스터는 리스폰하며 반복 처치로 추가 획득 가능하되 처치당 2~4포인트로 낮게 유지.
6. **레벨/경험치 폐지** → 포인트 + 누적 포인트 기반 표시 전용 등급(`ranks.ts`).
7. **키 조작**: 이동 방향키/WASD, 대화·읽기 E(Space 겸용), 공격 F, 세계지도 M, 닫기 Esc. 마우스는 세계지도·상점·미니게임에서만.
8. **이름 입력**: v0.1은 `window.prompt`(취소·빈 값 → '여행자').
9. **저장 키**: `play1.progress`(v2). 구 3D 저장 키 `play1.save`는 부팅 시 삭제.
10. **agents/build.md·agents/review.md 갱신**은 메인 세션에서 수행(Plan 범위 밖).
11. **외부 에셋**: v0.1은 다운로드 없이 자체 생성 픽셀 아트로 완성. Kenney CC0 팩·Galmuri 폰트는 6.10에 후보로만 기록. LPC(CC-BY-SA)는 사용하지 않음.
12. **vitest 도입**: `src/shared/__tests__/*.test.ts`에 퀴즈 채점·포인트·해금·미션·인벤토리·저장 검증/마이그레이션 단위 테스트를 두고 `npm test`로 실행. Review가 실행해 전부 통과해야 한다.
13. **Phaser `^3.90.0`**, 설치 실패 시 `^3.87.0`. 4.x 사용 금지.
