# spec.md — 3D 온라인 롤플레잉 게임 v0.1 계획

## 1. 개요와 v0.1 범위

### 1.1 개요
플레이어 캐릭터가 로우폴리(박스) 3D 맵을 돌아다니며 NPC에게 미션을 받고, 몬스터를 처치해 경험치를 얻고 레벨업하는 브라우저 게임.
v0.1은 **싱글플레이**로 완성하되, 시뮬레이션 상태와 렌더링/입력을 분리해 이후 서버 동기화(멀티플레이)를 붙이기 쉬운 구조로 만든다.

### 1.2 v0.1 포함
| 영역 | 내용 |
|---|---|
| 이동/카메라 | WASD 이동(카메라 기준), Space 점프, 중력, 바닥/장애물 충돌, **점프로 오를 수 있는 낮은 발판(윗면 착지)**, 마우스 좌클릭 드래그로 3인칭 카메라 회전, 휠로 거리 조절 |
| 맵 | 120×120 평지, 마을(NPC 구역), 몬스터 필드 2곳, 발판 4개(마을 1, 필드 1, 언덕 2단 — 언덕 꼭대기가 도달 목표 지점), 박스 장애물(집·벽·기둥), 맵 경계 |
| NPC/미션 | NPC 2명, 미션 3개(처치형 2, 도달형 1), E 키로 수락·진행 확인·완료 보고, 보상 경험치 |
| 전투 | 몬스터 2종(slime, golem), F 키 근접 공격(전방 부채꼴 판정), 몬스터 HP 바, 추적/공격 AI, 처치 시 경험치, 몬스터 리스폰 |
| 플레이어 | HP, 피격, 사망, 3초 후 마을 리스폰 |
| 성장 | 경험치 획득, 레벨업(HP/공격력 상승, 전체 회복), 레벨 테이블 |
| HUD | HP 바, 레벨/XP 바, 미션 추적, 상호작용 안내, 대화 패널, 알림 로그, 사망 오버레이, 조작 안내, **진행 초기화 버튼** |
| 저장 | localStorage에 레벨/XP/스탯, 미션 진행, 플레이어 위치 저장. 레벨업·미션 상태 변경 시 + 5초 주기 저장, 시작 시 로드, 초기화 버튼 |
| 서버 | Node.js(Express) 정적 파일 서빙 + `/health`, 실시간 통신 접점(빈 함수)만 준비 |

### 1.3 v0.1 제외
- 멀티플레이(Socket.IO 통신, 서버 권위 시뮬레이션), 계정/로그인, 서버 측 저장
- 인벤토리, 아이템, 장비, 스킬, 원거리 공격, 골드
- 외부 3D 모델·텍스처·사운드, 애니메이션(스켈레탈). 간단한 프로시저럴 모션(공격 시 팔 회전, 피격 시 색 깜빡임)만 허용
- 경사 지형, 높이맵. 높이는 "발판(AABB)" 윗면 착지로만 표현하며 집·벽·기둥 등 일반 장애물은 올라갈 수 없는 벽으로 취급
- 다중 저장 슬롯, 저장 데이터 내보내기/가져오기
- 모바일 터치 조작

---

## 2. 기술 스택과 의존성

- 언어: **TypeScript** (Vite가 즉시 트랜스파일, 별도 tsc 빌드 단계 없음). `strict: true`
- 클라이언트: **Three.js** `^0.170.0` (WebGLRenderer, 기본 Geometry/Material만 사용)
- 빌드/개발 서버: **Vite** `^6.0.0`
- 서버: **Node.js 20 이상**, **Express** `^4.21.0` (정적 서빙)
- 타입: `@types/three`, `@types/express`, `typescript ^5.6`
- 미설치(추후 확장용, 주석으로만 언급): `socket.io`, `socket.io-client`

`package.json` 스크립트:
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "start": "node server/index.js",
    "typecheck": "tsc --noEmit"
  }
}
```
- `npm run dev` → Vite 개발 서버 `http://localhost:5173`
- `npm run build && npm start` → Express가 `dist/`를 `http://localhost:3100`에서 서빙

---

## 3. 파일/폴더 구조

```
play1/
├── package.json
├── tsconfig.json              # strict, target ES2022, moduleResolution bundler
├── vite.config.ts             # root=".", build.outDir="dist"
├── index.html                 # <canvas id="game">, <div id="hud">, <script type="module" src="/src/client/main.ts">
├── .gitignore                 # node_modules, dist
├── server/
│   └── index.js               # Express: dist/ 정적 서빙, GET /health, attachRealtime(httpServer) 빈 접점
└── src/
    ├── shared/                # ★ 서버/클라이언트 공용. three·DOM·window 의존 금지(순수 TS)
    │   ├── types.ts           # GameState, PlayerState, MonsterState, QuestProgress, Command, SimEvent 등 타입
    │   ├── vec.ts             # {x,y,z} 순수 벡터 유틸(add, sub, scale, length, normalize, distXZ)
    │   ├── constants.ts       # 물리 상수, 쿨다운, 리스폰 시간, 맵 크기
    │   ├── data/
    │   │   ├── map.ts         # 맵 정의: 경계, 장애물 AABB, 발판(platform) AABB, 플레이어 스폰, 몬스터 스폰 구역, 도달 지점
    │   │   ├── monsters.ts    # 몬스터 종류 정의(MonsterDef)
    │   │   ├── npcs.ts        # NPC 정의(NPCDef)
    │   │   ├── quests.ts      # 미션 정의(QuestDef)
    │   │   └── levels.ts      # 레벨별 필요 XP·스탯 계산 함수
    │   └── sim/
    │       ├── createState.ts # 초기 GameState 생성(플레이어, 몬스터 스폰, 미션 진행 테이블)
    │       ├── step.ts        # stepSimulation(state, cmd, dt): SimEvent[] — 시스템 호출 순서의 단일 진입점
    │       ├── collision.ts   # 원(반지름) vs AABB XZ 충돌 해소, 발판 윗면 높이 조회(groundHeightAt), 맵 경계 클램프
    │       ├── playerSim.ts   # 이동, 점프, 중력, 바닥/발판 착지, 사망/리스폰 타이머
    │       ├── monsterSim.ts  # 몬스터 FSM(idle/chase/attack/return/dead), 리스폰
    │       ├── combatSim.ts   # 플레이어 공격 판정, 몬스터 공격 적용, HP/사망 처리
    │       ├── questSim.ts    # NPC 상호작용(수락/보고), 처치 카운트, 도달 판정
    │       └── levelSim.ts    # XP 적립, 레벨업, 스탯 재계산
    └── client/                # 브라우저 전용
        ├── main.ts            # 엔트리: new Game(canvas).start()
        ├── Game.ts            # 게임 루프(고정 timestep), 입력→Command 변환, sim 호출, 뷰/HUD 갱신, 저장 트리거
        ├── Input.ts           # 키보드·마우스 상태 수집(눌림 집합, 이번 프레임 눌린 키, 드래그 delta, 휠)
        ├── CameraController.ts# 3인칭 오빗 카메라(yaw/pitch/distance), 부드러운 추적
        ├── persistence.ts     # localStorage 저장/로드/초기화(SaveData ↔ GameState), 버전 검증
        ├── view/
        │   ├── meshFactory.ts # 박스 캐릭터·몬스터·NPC·장애물·발판·마커 메시 생성 함수
        │   ├── WorldView.ts   # 바닥, 그리드, 조명, 장애물, 발판, 도달 마커, 스폰 구역 표시
        │   ├── PlayerView.ts  # 플레이어 메시 ↔ PlayerState 동기화, 공격 모션, 피격 깜빡임
        │   ├── MonsterView.ts # 몬스터 메시 풀 ↔ MonsterState[] 동기화, 머리 위 HP 바(Sprite)
        │   ├── NPCView.ts     # NPC 메시, 이름표(Sprite), 머리 위 미션 표시(!/?)
        │   └── labelSprite.ts # Canvas 텍스처 기반 텍스트 Sprite 유틸
        └── ui/
            ├── HUD.ts         # DOM 오버레이 갱신(HP/XP/레벨/미션/안내/대화/로그/사망/초기화 버튼)
            └── hud.css        # HUD 스타일
```

의존 방향(단방향): `client → shared`. `shared`는 `client`를 절대 import하지 않는다. 뷰 클래스는 상태를 읽기만 하고 수정하지 않는다. sim 밖에서 상태를 쓰는 유일한 예외는 `client/persistence.ts`의 로드(시작 시 1회)와 초기화다.

---

## 4. 핵심 시스템 설계

### 4.0 공통 타입 (`src/shared/types.ts`)

```ts
export interface Vec3 { x: number; y: number; z: number }
export interface AABB { min: Vec3; max: Vec3 }

export interface PlayerState {
  id: string;            // 'p1' (멀티 시 서버가 부여)
  pos: Vec3; vel: Vec3; yaw: number;   // yaw: 바라보는 방향(rad), +Z 기준
  onGround: boolean;
  hp: number; maxHp: number; atk: number;
  level: number; xp: number;
  alive: boolean; respawnTimer: number;       // 사망 시 3 → 0으로 감소
  attackCooldown: number; attackAnim: number; // 초 단위 남은 시간
  invulnTimer: number;                        // 피격 후 0.5초 무적
}

export type MonsterAIState = 'idle' | 'chase' | 'attack' | 'return' | 'dead';
export interface MonsterState {
  id: string; typeId: string;
  pos: Vec3; yaw: number; spawnPos: Vec3;
  hp: number; maxHp: number;
  ai: MonsterAIState;
  attackCooldown: number; respawnTimer: number; hitFlash: number;
}

export type QuestStatus = 'locked' | 'available' | 'active' | 'completed' | 'turnedIn';
export interface QuestProgress { questId: string; status: QuestStatus; count: number }

export interface GameState {
  tick: number; time: number;                 // 고정 스텝 누적
  player: PlayerState;
  monsters: MonsterState[];
  quests: Record<string, QuestProgress>;
}

/** 클라이언트 입력을 시뮬레이션이 이해하는 형태로 변환한 것. 한 틱에 하나 */
export interface Command {
  move: { x: number; z: number };  // 월드 좌표계 이동 방향(카메라 기준 변환 완료, 길이 0~1)
  jump: boolean; attack: boolean; interact: boolean;  // 이번 틱에 눌림(edge)
}

export type SimEvent =
  | { type: 'player:damaged'; amount: number; by: string }
  | { type: 'player:died' } | { type: 'player:respawned' }
  | { type: 'player:xp'; amount: number } | { type: 'player:levelup'; level: number }
  | { type: 'monster:damaged'; id: string; amount: number }
  | { type: 'monster:killed'; id: string; typeId: string }
  | { type: 'quest:accepted' | 'quest:progress' | 'quest:completed' | 'quest:turnedIn'; questId: string }
  | { type: 'npc:talk'; npcId: string; text: string }  // 대화 패널에 표시할 문장
  | { type: 'ui:message'; text: string };               // 알림 로그
```

원칙: **GameState는 JSON 직렬화 가능한 순수 데이터**여야 한다(Three.js 객체, 함수, 클래스 인스턴스 금지).

### 4.1 게임 루프 (`client/Game.ts`)

- `requestAnimationFrame` 기반. 고정 timestep `FIXED_DT = 1/60`, 누적기(accumulator) 패턴, 프레임당 최대 5스텝(탭 전환 후 폭주 방지), 프레임 dt는 0.1초로 클램프.
- 한 프레임의 순서:
  1. `Input.poll()` → `cmd = buildCommand(input, camera.yaw, pendingEdges)` (WASD를 카메라 yaw 기준 월드 방향으로 변환, edge 키는 스텝이 소비할 때까지 `PendingEdges`에 보류(OR 누적)했다가 첫 스텝 후 리셋)
  2. accumulator만큼 `events.push(...stepSimulation(state, cmd, FIXED_DT))` 반복. 두 번째 스텝부터는 edge 입력(jump/attack/interact)을 false로 리셋한 cmd 사용
  3. `CameraController.update(state.player, frameDt)`
  4. `PlayerView/MonsterView/NPCView.sync(state, frameDt)` — 상태를 메시에 반영
  5. `HUD.update(state, events, frameDt)` — 이벤트로 로그/대화/깜빡임 트리거, 상태로 바 갱신
  6. `persistence.maybeSave(state, events, frameDt)` — `player:levelup`/`quest:*` 이벤트가 있거나 마지막 저장 후 5초 경과 시 저장
  7. `renderer.render(scene, camera)`
- 시작 시: `state = createState(); persistence.load(state)` (저장 데이터가 있으면 덮어씀) → 뷰 생성 → 루프 시작.
- `stepSimulation` 내부 호출 순서(`shared/sim/step.ts`):
  `playerSim → monsterSim → combatSim → questSim → levelSim`, 각 함수는 `(state, cmd, dt, events)` 시그니처로 events 배열에 push. 마지막에 `state.tick++`, `state.time += dt`.

### 4.2 입력 (`client/Input.ts`)

- `keysDown: Set<string>`(`e.code` 기준: KeyW, KeyA, KeyS, KeyD, Space, KeyF, KeyE), `keysPressed: Set<string>`(이번 프레임에 새로 눌림, poll 후 초기화)
- 마우스: 캔버스 위 `mousedown`(좌클릭) 시 드래그 시작, `mousemove`로 `dragDelta {dx, dy}` 누적, `mouseup`/`mouseleave`로 종료. `wheel` → `wheelDelta`. 포인터 락 사용 안 함.
- 캔버스 `contextmenu` 기본 동작 차단, Space·방향키의 스크롤 방지.
- 키 바인딩 상수는 `client/Input.ts` 상단 `KEYS` 객체 하나에 모은다.

| 동작 | 기본 키 |
|---|---|
| 이동 | W A S D |
| 점프 | Space |
| 공격 | F |
| 상호작용(NPC) | E |
| 카메라 회전 | 마우스 좌클릭 드래그 |
| 카메라 거리 | 마우스 휠 |

### 4.3 플레이어 (`shared/sim/playerSim.ts`)

상수(`constants.ts`): `MOVE_SPEED=6`, `JUMP_SPEED=9`, `GRAVITY=-25`(최대 점프 높이 ≈ 1.62m), `PLAYER_RADIUS=0.5`, `PLAYER_HEIGHT=1.8`, `STEP_TOLERANCE=0.35`(이 높이 이하의 턱은 점프 없이 올라감), `RESPAWN_TIME=3`, `ATTACK_COOLDOWN=0.5`, `ATTACK_RANGE=2.2`, `ATTACK_ARC=Math.PI/2`(전방 90°), `INVULN_TIME=0.5`.

- 살아 있을 때(순서 중요):
  1. `vel.x = move.x * MOVE_SPEED`, `vel.z = move.z * MOVE_SPEED`; 이동 입력이 있으면 `yaw = atan2(move.x, move.z)`
  2. `jump && onGround` → `vel.y = JUMP_SPEED`, `onGround=false`
  3. XZ 이동: `pos.x += vel.x*dt; pos.z += vel.z*dt`
  4. XZ 충돌: `collision.resolveCircleVsAABBs(pos, PLAYER_RADIUS, walls)` — `walls` = `map.obstacles` 전체 + **발판 중 `top > pos.y + STEP_TOLERANCE`인 것**(발 높이보다 충분히 높은 발판만 벽으로 취급). 축별 최소 침투 방향으로 밀어냄. 이어서 `collision.clampToBounds(pos, map.bounds)`
  5. Y 이동: `vel.y += GRAVITY*dt; pos.y += vel.y*dt`
  6. 착지: `floorY = collision.groundHeightAt(pos, PLAYER_RADIUS, map.platforms)` — 플레이어 XZ 원이 발판 footprint와 겹치고 `top <= pos.y + STEP_TOLERANCE`인 발판들의 `top` 중 최댓값, 없으면 0. `vel.y <= 0 && pos.y <= floorY` → `pos.y = floorY; vel.y = 0; onGround = true`, 그 외 `onGround = false`(발판 가장자리를 걸어 나가면 자연스럽게 낙하)
  7. 타이머 감소: `attackCooldown, attackAnim, invulnTimer`
- 발판 밑으로 걸어 들어갈 수 없다(발판 높이는 모두 `STEP_TOLERANCE`보다 높으므로 아래에서는 벽으로 작동). 발판 아래 공간(다리 형태)은 v0.1에서 만들지 않는다.
- 저장된 위치로 로드될 때도 6번 규칙이 첫 틱에 적용되므로 발판 위 위치가 그대로 복원된다.
- 사망 상태(`alive=false`): 입력 무시, `respawnTimer -= dt`, 0 이하가 되면 `pos = map.playerSpawn`, `hp = maxHp`, `alive = true`, `events.push({type:'player:respawned'})`. **사망 페널티 없음**(XP·레벨 유지).

### 4.4 카메라 (`client/CameraController.ts`)

- 오빗 파라미터: `yaw`(초기 0), `pitch`(초기 0.35, 범위 `[-0.1, 1.2]`), `distance`(초기 8, 범위 `[3, 16]`)
- 드래그: `yaw -= dx * 0.005`, `pitch += dy * 0.005`; 휠: `distance += deltaY * 0.01`
- 타깃 = `player.pos + (0, 1.5, 0)`. 카메라 위치 = 타깃 + 구면 좌표(yaw, pitch, distance). 위치는 `lerp(current, desired, 1 - exp(-12*dt))`로 부드럽게, `lookAt(target)`.
- 카메라는 장애물 관통 허용(v0.1). `yaw`는 Game이 Command 생성 시 사용한다(카메라가 sim에 들어가지 않고, 변환된 방향만 들어감).

### 4.5 맵 (`shared/data/map.ts`, `client/view/WorldView.ts`)

```ts
export interface MapDef {
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number }; // ±58 (바닥 120, 여유 2)
  playerSpawn: Vec3;                              // (0, 0, 6)
  obstacles: { id: string; center: Vec3; size: Vec3; color: number }[]; // AABB = center ± size/2, 올라갈 수 없는 벽
  platforms: { id: string; center: Vec3; size: Vec3; color: number }[]; // AABB, 윗면(top = center.y + size.y/2)에 착지 가능
  monsterSpawns: { typeId: string; center: Vec3; radius: number; count: number }[];
  reachPoints: { id: string; pos: Vec3; radius: number }[];   // 도달형 미션 목표(pos.y = 서 있어야 할 발 높이)
}
```
- 구성(마을 원점 반경 ~15): 집 3채(4×3×4 박스, 갈색), 우물(원기둥), 울타리 벽 몇 개. 슬라임 필드 `(30,0,0)` 반경 10, 골렘 필드 `(-35,0,28)` 반경 10. 필드 사이에 기둥 장애물 몇 개 배치.
- 발판(모두 바닥에 붙어 있고 `size.y`가 곧 높이, 최대 점프 높이 1.62m 이하의 단차만 사용):

| id | center | size | 용도 |
|---|---|---|---|
| plat_village | (-8, 0.5, 4) | 4×1.0×4 | 마을 연습용, 점프 튜토리얼 |
| plat_field | (22, 0.7, -10) | 5×1.4×5 | 슬라임 필드 옆, 몬스터가 못 올라오는 피난처 |
| plat_hill_1 | (0, 0.6, -43) | 8×1.2×8 | 언덕 1단 |
| plat_hill_2 | (0, 1.2, -46) | 4×2.4×4 | 언덕 2단(1단 위에서 1.2m 단차), 윗면 y=2.4 |

- 도달 지점 `hill_sign`: `pos=(0, 2.4, -46)`, `radius=2.5`, 즉 `plat_hill_2` 윗면 중앙. 노란 링(`TorusGeometry`)을 윗면 위에 눕혀 두고 기둥 표지판을 세운다. 도달 판정은 3D 거리(4.6절)이므로 발판 아래 바닥에서는 완료되지 않는다.
- `WorldView`: `PlaneGeometry(120,120)` 초록 바닥(MeshLambertMaterial), `GridHelper`, `HemisphereLight + DirectionalLight(그림자 없음)`, 배경색 하늘색, 안개(Fog) 옵션. 장애물·발판은 `BoxGeometry`로 `map.obstacles`, `map.platforms` 그대로 생성(발판은 밝은 회색/돌색으로 장애물과 구분). 도달 지점은 링 + 기둥으로 표시.
- `collision.ts`:
  - `resolveCircleVsAABBs(pos, r, boxes)` — 각 AABB에 대해 원 중심에서 가장 가까운 점 계산, 거리 < r이면 침투 축(작은 쪽)으로 밀어냄. 2회 반복.
  - `groundHeightAt(pos, r, platforms)` — XZ 원과 footprint가 겹치고 `top <= pos.y + STEP_TOLERANCE`인 발판 `top`의 최댓값, 없으면 0.
  - `clampToBounds(pos, bounds)`.
  - 몬스터는 `groundHeightAt`을 쓰지 않고 항상 y=0, 발판은 항상 벽으로 취급(`walls = obstacles + platforms`). 몬스터의 공격 사거리 판정은 3D 거리(4.7절)이므로 발판 가장자리에서 조금만 안쪽으로 서면 안전하다.

### 4.6 NPC / 미션 (`shared/data/npcs.ts`, `quests.ts`, `shared/sim/questSim.ts`)

```ts
export interface NPCDef { id: string; name: string; pos: Vec3; color: number; questIds: string[] }
export type QuestObjective =
  | { type: 'kill'; monsterTypeId: string; count: number }
  | { type: 'reach'; reachPointId: string };
export interface QuestDef {
  id: string; title: string; description: string; giverNpcId: string;
  objective: QuestObjective; rewardXp: number; prerequisiteQuestId?: string;
  acceptText: string; progressText: string; completeText: string;
}
```
초기 데이터:
| id | NPC | 목표 | 보상 | 선행 |
|---|---|---|---|---|
| q_slime | 촌장 (0,0,-3) | slime 3마리 처치 | 60 XP | 없음 |
| q_sign | 파수꾼 (6,0,-3) | hill_sign 도달 | 50 XP | 없음 |
| q_golem | 촌장 | golem 2마리 처치 | 150 XP | q_slime 보고 완료 |

`NPC_INTERACT_RANGE = 3`. 진행 규칙(`questSim`):
- 매 틱 `activeQuests` 중 `reach` 목표: 플레이어 `pos`와 `reachPoint.pos`의 **3D 거리** ≤ radius → `status='completed'`, `quest:completed` 이벤트. (hill_sign은 발판 윗면 높이에 있으므로 발판에 올라가야 완료된다)
- `monster:killed` 이벤트(같은 틱 앞선 combatSim이 push한 것)를 읽어 `kill` 목표 카운트 증가 → `quest:progress`, 달성 시 `completed`.
- `cmd.interact`가 true이면 가장 가까운 범위 내 NPC를 찾고, 그 NPC의 `questIds` 순서대로:
  1. `completed`인 미션이 있으면 → `turnedIn`, `levelSim`이 읽을 수 있게 `player:xp` 이벤트 push, `npc:talk(completeText)`, 선행 조건이 풀린 미션을 `available`로 변경
  2. 아니면 `active`인 미션이 있으면 → `npc:talk(progressText + " (n/N)")`
  3. 아니면 `available`인 미션이 있으면 → `active`, `npc:talk(acceptText)`, `quest:accepted`
  4. 아무것도 없으면 → `npc:talk("오늘은 부탁할 게 없네.")`
- 미션은 동시에 여러 개 `active` 가능. 선택 메뉴 없음(한 번의 E로 한 단계 진행).

### 4.7 몬스터 / 전투 (`shared/data/monsters.ts`, `monsterSim.ts`, `combatSim.ts`)

```ts
export interface MonsterDef {
  typeId: string; name: string; color: number; size: Vec3;   // 박스 크기
  maxHp: number; atk: number; speed: number;
  aggroRange: number; attackRange: number; attackInterval: number; leashRange: number;
  xpReward: number; respawnTime: number;
}
```
| typeId | HP | 공격 | 속도 | 감지 | 사거리 | 공격 간격 | 리쉬 | XP | 리스폰 |
|---|---|---|---|---|---|---|---|---|---|
| slime | 30 | 5 | 2.5 | 8 | 1.5 | 1.2s | 13 | 20 | 10s |
| golem | 120 | 18 | 2.0 | 10 | 2.0 | 1.8s | 22 | 80 | 15s |

몬스터 FSM(`monsterSim`, 플레이어가 죽어 있으면 모두 `idle`로 복귀):
- `idle`: 플레이어 거리 < aggroRange → `chase`
- `chase`: 플레이어 쪽으로 `speed*dt` 이동(XZ), `yaw` 갱신, 충돌 해소(`walls = obstacles + platforms`). **3D 거리** ≤ attackRange → `attack`. spawnPos에서 leashRange 초과 → `return`(귀환 중 aggro 무시·회복 없음, 타격은 가능) → spawnPos 도착 시 HP 전체 회복 후 `idle`. 감지(aggro)·리쉬 판정은 XZ 거리.
- `attack`: `attackCooldown` 0이면 플레이어에게 `atk` 피해(combatSim이 처리하도록 `pendingHits`에 기록하거나, 단순히 monsterSim에서 직접 `applyDamageToPlayer` 호출 — **직접 호출로 통일**, 함수는 combatSim이 export), `attackCooldown = attackInterval`. 3D 거리 > attackRange*1.3 → `chase`
- `dead`: `respawnTimer -= dt`, 0 이하 → `pos=spawnPos, hp=maxHp, ai='idle'`
- `hitFlash -= dt`

플레이어 공격(`combatSim.playerAttack`): `cmd.attack && alive && attackCooldown<=0` → `attackCooldown=0.5, attackAnim=0.25`. 살아 있는 몬스터 중 XZ 거리 ≤ `ATTACK_RANGE` 이고 플레이어 yaw 기준 각도 차 ≤ `ATTACK_ARC/2`인 **모든** 몬스터에 `player.atk` 피해 → `monster:damaged`, `hitFlash=0.15`. HP ≤ 0 → `ai='dead', respawnTimer=respawnTime`, `monster:killed`, `player:xp(xpReward)`.

피격(`combatSim.applyDamageToPlayer(state, amount, by, events)`): `invulnTimer>0`이면 무시. `hp -= amount`, `invulnTimer=INVULN_TIME`, `player:damaged`. `hp ≤ 0` → `hp=0, alive=false, respawnTimer=RESPAWN_TIME`, `player:died`.

`MonsterView`: 몬스터마다 `BoxGeometry(size)` + 눈(작은 검은 박스 2개) 그룹. `dead`면 `visible=false`. 머리 위 HP 바는 `Sprite`(캔버스 텍스처, HP 변화 시에만 다시 그림). `hitFlash>0`이면 material color를 빨강으로, 아니면 원색.

### 4.8 경험치 / 레벨 (`shared/data/levels.ts`, `shared/sim/levelSim.ts`)

```ts
export const MAX_LEVEL = 20;
export function xpToNext(level: number): number { return 100 * level; }        // Lv1→2: 100, Lv2→3: 200 …
export function statsForLevel(level: number) {
  return { maxHp: 100 + 20 * (level - 1), atk: 10 + 3 * (level - 1) };
}
```
- `levelSim`: 같은 틱의 events 중 `player:xp`를 합산해 `player.xp`에 더함. `while (level < MAX_LEVEL && xp >= xpToNext(level))` → `xp -= xpToNext(level); level++`, `statsForLevel`로 `maxHp/atk` 갱신, `hp = maxHp`(전체 회복), `player:levelup` push.
- 초기 플레이어: Lv1, HP 100, ATK 10, XP 0.
- 밸런스 참고: slime 3마리(60)+q_slime(60)=120 → Lv2 도달. golem은 Lv2(ATK 13) 기준 10타 필요, 골렘 피해 18로 HP 120 기준 6~7회 피격 허용.

### 4.9 HUD (`client/ui/HUD.ts`, `index.html`, `hud.css`)

`#hud` 안 DOM 요소(모두 `pointer-events: none`, 캔버스 입력 방해 금지):
- `#hp-bar`(좌상단, 텍스트 `HP 80/100`), `#level`(`Lv 3`), `#xp-bar`(`XP 40/300`)
- `#quest-tracker`(우상단): `active/completed` 미션 목록, `"슬라임 처치 2/3"`, completed는 `"완료 — 촌장에게 보고"`
- `#interact-hint`(중앙 하단): NPC 범위 내일 때 `[E] 촌장과 대화`, 그 외 숨김
- `#dialog`(중앙 하단): `npc:talk` 이벤트 시 NPC 이름 + 문장 표시, 4초 후 숨김
- `#log`(좌하단): `ui:message`, XP 획득, 레벨업, 미션 이벤트를 한 줄씩(최대 5줄, 5초 후 사라짐)
- `#damage-flash`: `player:damaged` 시 화면 가장자리 붉은 비네트 0.2초
- `#death-overlay`: `alive=false`일 때 `"쓰러졌습니다… n초 후 부활"` 전체 화면
- `#controls`(우하단): 조작 안내 텍스트 고정 표시
- `#reset-btn`(우하단, `#controls` 아래): "진행 초기화" 버튼. 이 요소만 `pointer-events: auto`. 클릭 → `window.confirm("저장된 진행을 삭제하고 처음부터 시작할까요?")` → 확인 시 `persistence.clear()` 후 `location.reload()`. 클릭 후 캔버스로 포커스가 돌아가도록 `canvas.focus()` 또는 키 이벤트를 `window`에 바인딩.
- `#save-indicator`(우상단 미션 추적창 아래): 저장 직후 "저장됨" 텍스트를 1초 표시.
- `HUD.update(state, events, frameDt)`는 값이 바뀐 요소만 textContent/style을 갱신(매 프레임 DOM 재생성 금지).

### 4.9.1 저장/로드 (`client/persistence.ts`)

```ts
export const SAVE_KEY = 'play1.save';
export const SAVE_VERSION = 1;
export interface SaveData {
  version: number; savedAt: number;                       // Date.now()
  player: { level: number; xp: number; maxHp: number; atk: number; hp: number; pos: Vec3; yaw: number };
  quests: Record<string, QuestProgress>;
}
export function load(state: GameState): boolean;          // 저장 데이터가 있고 유효하면 state에 적용, 적용 여부 반환
export function save(state: GameState): void;             // SaveData 생성 → localStorage.setItem(JSON)
export function maybeSave(state: GameState, events: SimEvent[], dt: number): void;
export function clear(): void;                            // localStorage.removeItem(SAVE_KEY)
```
- 저장 대상: 플레이어 레벨/XP/maxHp/atk/hp, 위치·yaw, `state.quests` 전체. 몬스터 상태·타이머는 저장하지 않는다(로드 시 초기 스폰).
- 저장 시점(`maybeSave`): events에 `player:levelup` 또는 `quest:*`(accepted/progress/completed/turnedIn)가 있을 때 즉시, 그 외 마지막 저장 후 `SAVE_INTERVAL = 5`초 경과 시. 추가로 `window.addEventListener('beforeunload', () => save(state))`.
- 위치 저장 규칙: `player.alive && player.onGround`일 때만 현재 `pos`를 기록, 아니면 직전 저장의 `pos` 유지(공중·사망 중 위치를 복원하지 않기 위함). 저장된 데이터가 없으면 `map.playerSpawn`.
- 로드(`load`): `JSON.parse` 실패, `version !== SAVE_VERSION`, 필수 필드 누락/타입 불일치, 존재하지 않는 questId, 맵 경계 밖 pos 중 하나라도 해당하면 무시하고 `console.warn` 후 새 게임으로 시작(잘못된 데이터는 `clear()`). 유효하면 `state.player`의 해당 필드와 `state.quests`를 덮어쓴다. `hp`는 `min(hp, maxHp)`, 0 이하이면 `maxHp`로.
- `shared`는 저장을 전혀 모른다. 로드는 `createState()` 직후, 루프 시작 전에 1회만 수행하며 이후 상태 변경은 모두 sim을 통한다.
- 로드 성공 시 HUD 로그에 "저장된 진행을 불러왔습니다 (Lv n)" 표시.

### 4.10 시스템 의존 관계

```
Input ──▶ Game(buildCommand, camera.yaw) ──▶ Command
                                               │
   GameState ◀── stepSimulation(step.ts) ◀─────┘
       │           ├ playerSim   (map, collision, constants)
       │           ├ monsterSim  (monsters data, collision, combatSim.applyDamageToPlayer)
       │           ├ combatSim   (constants)  → monster:killed, player:xp
       │           ├ questSim    (quests/npcs/map data)  ← monster:killed  → player:xp
       │           └ levelSim    (levels data)           ← player:xp
       ▼
  PlayerView / MonsterView / NPCView / WorldView (읽기 전용) ──▶ Three.js Scene
  CameraController(player.pos) ──▶ Camera
  HUD(state, events) ──▶ DOM
```

---

## 5. 멀티플레이 확장을 위한 설계 고려사항

1. **상태와 표현의 분리**: `GameState`는 순수 JSON 데이터. Three.js 메시는 `client/view/*`가 상태를 보고 매 프레임 동기화만 한다. 서버는 `shared/`만 import해서 동일한 `stepSimulation`을 돌릴 수 있다.
2. **입력의 명령화**: 키 입력은 클라이언트에서 `Command`(월드 방향 이동, edge 플래그)로 변환된 뒤에만 sim에 들어간다. 멀티 시에는 이 `Command`를 틱 번호와 함께 서버에 전송하고, 서버가 `stepSimulation`으로 권위 상태를 만든다.
3. **이벤트 반환 방식**: sim은 전역 이벤트 버스 대신 `SimEvent[]`를 반환한다. 서버는 이 배열을 그대로 클라이언트에 브로드캐스트해 HUD/연출을 재생할 수 있다.
4. **shared 순수성 규칙**: `src/shared/**`는 `three`, `document`, `window`, `performance`, `Math.random` 직접 호출을 금지한다(난수가 필요하면 `state`에 시드 기반 RNG 필드 추가). Build 시 `shared`에 `three` import가 없는지 grep으로 검증한다.
5. **플레이어 다수 대비**: `PlayerState.id`를 이미 두고, 몬스터 타깃 로직은 `state.player`를 직접 참조하되 `getTargetPlayer(state)` 헬퍼를 통해서만 접근한다. 나중에 `players: Record<string, PlayerState>`로 바꿀 때 이 헬퍼와 questSim의 소유자 판정만 수정하면 된다.
6. **서버 접점**: `server/index.js`에 `attachRealtime(httpServer)` 함수를 두고 v0.1에서는 빈 구현 + 주석(`// TODO(multiplayer): socket.io 서버 부착, 'cmd' 수신 → stepSimulation → 'state' 브로드캐스트`). `server/`는 ESM(`"type": "module"`)으로 두어 나중에 `src/shared`를 tsx/빌드 산출물로 import하기 쉽게 한다.
7. **고정 timestep + tick 번호**: 서버/클라 동일 dt로 결정론에 가깝게 유지(부동소수 차이는 스냅샷 보정으로 흡수 예정).
8. **저장은 클라이언트 어댑터**: `persistence.ts`의 `SaveData`는 `GameState`의 부분집합을 그대로 직렬화한다. 멀티 전환 시 같은 `SaveData` 형식을 서버 DB 저장으로 옮기고 클라이언트의 localStorage 저장은 끄면 된다(sim·데이터 정의 변경 없음).

---

## 6. 구현 순서 (마일스톤)

| 단계 | 내용 | 완료 기준 |
|---|---|---|
| M0 스캐폴드 | package.json, tsconfig, vite.config, index.html, `.gitignore`, `server/index.js`, `shared/types.ts`, `vec.ts`, `constants.ts`, 빈 HUD | `npm install && npm run dev`로 빈 하늘색 화면이 뜨고 콘솔 에러 없음. `npm run typecheck` 통과 |
| M1 맵+플레이어+카메라 | `map.ts`(장애물+발판), `WorldView`, `collision.ts`(`groundHeightAt` 포함), `playerSim`, `PlayerView`, `Input`, `CameraController`, `Game` 루프 | WASD로 카메라 기준 이동, 드래그 회전, 휠 줌, 점프 후 착지, 집·벽에 막힘, 맵 밖으로 못 나감. 점프로 `plat_village`(1.0m)에 올라가고 가장자리에서 걸어 내려오면 낙하, 발판 옆면은 아래에서 벽으로 막힘, `plat_hill_1 → plat_hill_2` 2단 점프 가능 |
| M2 몬스터+전투 | `monsters.ts`, `monsterSim`, `combatSim`, `MonsterView`, HP 바 스프라이트 | 슬라임이 접근 시 추적·공격, F로 타격 시 붉게 깜빡이며 HP 감소, 처치 시 사라지고 10초 후 리스폰, 플레이어 HP 감소·사망·3초 후 마을 부활 |
| M3 경험치+레벨+HUD | `levels.ts`, `levelSim`, `HUD` 전체(HP/XP/레벨/로그/사망 오버레이/피격 비네트) | 처치 시 XP 로그, 누적 100에서 Lv2·HP/ATK 상승·전체 회복이 HUD에 반영 |
| M4 NPC+미션 | `npcs.ts`, `quests.ts`, `questSim`, `NPCView`, 상호작용 안내·대화 패널·미션 추적 | 촌장에게 E → 수락, 슬라임 3마리 처치 시 추적창 "완료", 보고 시 60 XP, q_golem 해금. 파수꾼 미션은 `plat_hill_2` 위 표지판 링에 올라섰을 때만 완료(발판 아래 바닥에서는 미완료) |
| M5 저장/로드 | `persistence.ts`, `Game`의 `maybeSave` 연결, HUD `#reset-btn`·`#save-indicator`, `beforeunload` 저장 | 레벨업·미션 변경·5초 주기·탭 닫기 시 localStorage에 기록, 새로고침 후 레벨/XP/스탯/미션/위치가 복원, 손상된 데이터는 무시하고 새 게임, 초기화 버튼 → confirm → 새 게임 |
| M6 마무리 | `npm run build` + `npm start` 확인, `shared` 순수성 grep, 조작 안내, 밸런스 미세 조정, 코드 주석 | 빌드 산출물이 3100 포트에서 동일하게 동작, `/health`가 `{"ok":true}` 반환 |

각 단계 종료 시 `npm run typecheck`가 통과해야 한다.

---

## 7. 검증 방법 (Review 단계)

### 7.1 실행 명령
```bash
cd /Users/sungchul/Desktop/play1
npm install
npm run typecheck                 # 타입 에러 0
grep -rn "from 'three'" src/shared && echo "FAIL: shared에 three 의존" || echo "OK"
grep -rnE "document\.|window\.|localStorage" src/shared && echo "FAIL: shared에 DOM/저장 의존" || echo "OK"
npm run dev                       # http://localhost:5173
npm run build && npm start        # http://localhost:3100 , curl http://localhost:3100/health
```

### 7.2 브라우저 체크리스트
- [ ] 페이지 로드 시 콘솔 에러/경고 없음, 60fps 근처(성능 탭 또는 체감)
- [ ] WASD 이동이 카메라 방향 기준으로 동작, 대각선 이동 속도가 직선과 같음(정규화)
- [ ] 좌클릭 드래그로 카메라 회전, pitch가 바닥 아래/머리 위로 넘어가지 않음, 휠로 3~16 범위 줌
- [ ] Space 점프 → 착지, 공중에서 재점프 불가
- [ ] 집·벽·기둥을 통과하지 못하고 미끄러지듯 막힘, 맵 가장자리에서 멈춤
- [ ] 마을 발판(1.0m)을 걸어서는 못 올라가고(옆면에 막힘) 점프하면 올라감, 위에서 걸어 나가면 낙하해 바닥에 착지
- [ ] 언덕 1단(1.2m) → 2단(단차 1.2m) 순서로 점프해 올라갈 수 있고, 바닥에서 2단(2.4m)으로 바로는 못 올라감
- [ ] 발판 위에서 점프·착지가 발판 윗면 높이에서 이루어지고, 발판 안으로 파고들거나 떨리지 않음
- [ ] 슬라임 필드 접근 시 슬라임이 추적, 근접 시 HP 5씩 감소, 피격 비네트 표시, 0.5초 무적
- [ ] 슬라임을 등지고 F를 눌러도 피해 없음(전방 판정), 마주보고 F → 붉게 깜빡이고 HP 바 감소, 3타(30HP)에 처치
- [ ] 처치 시 로그에 "+20 XP", HUD XP 바 갱신, 10초 후 같은 자리에 리스폰
- [ ] 필드에서 멀리 도망가면 몬스터가 스폰 지점으로 돌아가고 HP 회복
- [ ] 촌장 근처에서 `[E] 촌장과 대화` 표시, E → 수락 대사, 추적창에 "슬라임 처치 0/3"
- [ ] 3마리 처치 → 추적창 "완료 — 촌장에게 보고", 보고 시 "+60 XP", Lv2 달성, HP 120/120·ATK 13
- [ ] 보고 후 다시 E → 골렘 미션 수락 가능(해금 확인)
- [ ] 파수꾼 미션 수락 후 언덕 2단 발판 위 노란 링에 올라서면 즉시 완료 처리, 발판 아래 바닥에서 링 바로 밑에 서 있어도 완료되지 않음
- [ ] 슬라임이 추적 중일 때 `plat_field` 위에 올라가 안쪽에 서면 피해를 받지 않고, 슬라임은 발판 옆에 막혀 올라오지 못함
- [ ] 골렘에게 죽으면 사망 오버레이·카운트다운, 3초 후 마을에서 HP 풀로 부활, 레벨·XP·미션 진행 유지
- [ ] 브라우저 탭을 30초 전환했다 돌아와도 시뮬레이션이 폭주하지 않음
- [ ] 저장: 레벨업 직후·미션 수락/완료/보고 직후 우상단에 "저장됨" 표시, 아무 일 없어도 5초마다 표시. DevTools → Application → Local Storage에 `play1.save` 키의 JSON 존재
- [ ] 새로고침 후 레벨/XP/HP/ATK, 미션 추적창 내용, 플레이어 위치(발판 위 포함)가 그대로 복원되고 로그에 "저장된 진행을 불러왔습니다" 표시
- [ ] 공중에서 또는 사망 중에 탭을 닫았다 열어도 마지막 지상 위치 또는 마을에서 시작
- [ ] Local Storage 값을 손으로 깨뜨린 뒤(`{"version":99}` 등) 새로고침하면 콘솔 경고와 함께 새 게임으로 시작하고 에러 없음
- [ ] "진행 초기화" 버튼 → confirm 취소 시 아무 변화 없음, 확인 시 새로고침되어 Lv1·미션 없음·마을 스폰
- [ ] `npm start`로 띄운 3100 포트에서도 동일하게 동작

### 7.3 코드 리뷰 포인트
- `src/shared/`에 브라우저·three 의존 없음, `GameState`에 비직렬화 값 없음
- 뷰 클래스가 `state`를 변경하지 않음
- HUD가 매 프레임 DOM을 재생성하지 않음(변경 시에만 갱신)
- 이벤트 처리 순서(combat → quest → level)가 같은 틱 안에서 보장됨

---

## 8. 위험 요소와 대안

| 위험 | 영향 | 대안 |
|---|---|---|
| Three.js 버전에 따라 API 차이(`0.170+`의 `Sprite`/색 관리, `outputColorSpace`) | 빌드 에러 또는 색 왜곡 | 설치된 버전에 맞춰 `@types/three` 동일 버전 고정, 색은 `MeshLambertMaterial({color})`만 사용, 문제 시 `renderer.outputColorSpace = THREE.SRGBColorSpace` 명시 |
| 축별 AABB 밀어내기에서 모서리 끼임/떨림 | 이동감 저하 | 침투가 작은 축 하나만 해소, 두 번 반복 적용. 그래도 문제면 장애물 간격을 플레이어 지름 이상으로 조정 |
| 카메라 yaw 기준 이동 변환 부호 실수(전후좌우 뒤집힘) | 조작 불가 | M1 완료 기준에 "W가 카메라 정면"을 명시적으로 확인, 변환 함수 단위 예시 값 주석으로 기록 |
| 스프라이트 HP 바를 매 프레임 다시 그리면 성능 저하 | 프레임 드랍 | HP 값이 바뀔 때만 캔버스 재그리기, 몬스터 수 10마리 내외 유지 |
| 도달형 미션이 "수락 전 이미 도착"한 경우 | 완료 판정 누락 | 판정은 `active` 상태에서만 하되 매 틱 검사하므로 수락 후 링 안에 서 있으면 즉시 완료됨 |
| 고정 timestep과 렌더 프레임 차이로 미세 떨림 | 시각 품질 | v0.1은 무시. 필요 시 뷰에서 이전/현재 상태 보간 추가(상태 분리 구조라 나중에 붙이기 쉬움) |
| 동일 틱에 여러 몬스터가 공격해 HP가 한 번에 크게 감소 | 난이도 급상승 | 무적 시간 0.5초로 완화. 그래도 어려우면 골렘 공격 간격 상향 |
| Express 4/5 차이(와일드카드 라우트 문법) | 서버 실행 실패 | `express.static` + `app.get('/health')`만 사용하고 와일드카드 라우트를 쓰지 않음 |
| 발판 가장자리에서 XZ 충돌(벽)과 착지(바닥) 판정이 충돌해 튕기거나 끼임 | 발판 오르기 실패 | 벽 판정은 `top > pos.y + STEP_TOLERANCE`일 때만, 착지는 `top <= pos.y + STEP_TOLERANCE`일 때만으로 조건을 상호 배타적으로 유지. 발판 단차는 1.4m 이하로 제한(최대 점프 1.62m에 여유) |
| 점프 정점 근처에서 발판 윗면에 살짝 못 미쳐 옆면에 걸림 | 조작감 저하 | `STEP_TOLERANCE`(0.35)가 마지막 턱을 흡수. 그래도 불편하면 `JUMP_SPEED`를 9.5로 상향 |
| localStorage 접근 불가(프라이빗 모드, 용량 초과, 차단) | 시작 시 예외로 게임이 안 뜸 | `persistence`의 모든 read/write를 try/catch로 감싸고 실패 시 경고 로그 후 저장 없이 진행 |
| 저장 형식 변경 시 옛 데이터와 충돌 | 로드 오류 | `SAVE_VERSION` 불일치 시 무시·삭제. 향후 마이그레이션이 필요하면 `load` 안에 버전별 변환 추가 |
| 미션 이벤트가 잦은 구간(연속 처치)에서 저장이 매 틱 발생 | 불필요한 I/O | `maybeSave`에 최소 간격 0.5초 스로틀(단, 마지막 이벤트는 반드시 반영되도록 dirty 플래그 유지) |

---

## 9. 확정된 결정 사항

사용자 승인(2026-09-23) 시 확정된 항목. Build/Review 단계에서 임의로 바꾸지 않는다.

1. **언어**: TypeScript(`strict: true`).
2. **키 바인딩**: 공격 `F`, 상호작용 `E`, 점프 `Space`, 카메라 회전 = 마우스 좌클릭 드래그, 휠 줌. 포인터 락 사용하지 않음.
3. **미션 완료 방식**: 목표 달성 후 NPC에게 돌아가 E로 보고해야 보상(XP) 지급. 달성 시점에는 `completed`로만 표시.
4. **사망 페널티 없음**: XP/레벨/미션 진행 유지, 3초 후 마을 스폰에서 HP 풀로 부활.
5. **발판 포함**: 점프로 오를 수 있는 발판(AABB, 높이 있음)을 맵 데이터 `platforms`로 정의. 총 4개(마을 1, 필드 1, 언덕 2단), 언덕 2단 윗면이 도달형 미션 `q_sign`의 목표 지점. 착지 판정은 바닥(y=0)과 발판 윗면 모두에 적용(4.3·4.5절).
6. **진행 저장 포함**: localStorage(`play1.save`)에 플레이어 레벨/XP/스탯(maxHp, atk, hp), 미션 진행 상태, 플레이어 위치·yaw를 저장. 저장 시점은 레벨업, 미션 상태 변경, 5초 주기, 탭 닫기. 시작 시 로드. 코드는 `client/persistence.ts`에만 두고 `shared`는 순수 유지. 초기화 수단은 HUD의 "진행 초기화" 버튼 하나(confirm 후 삭제·새로고침).
7. **서버**: Express(`^4.21`) 정적 서빙 + `/health`, `attachRealtime` 빈 접점.
8. **몬스터 밸런스**: 4.7절 표의 수치와 슬라임 6마리·골렘 3마리를 초안으로 유지. Build 후 플레이 테스트 결과에 따라 Review 단계에서 조정 제안만 한다(임의 변경 금지).
