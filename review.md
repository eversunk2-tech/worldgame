# review.md — v0.1 검증 결과

검증 일시: 2026-09-23 · 환경: macOS (Darwin 25.6), Node v24.21.0, three 0.170.0 / @types/three 0.170.0 / vite 6.4.3 / express 4.22.3
검증 방법: 정적 검사 → `src/shared` 시뮬레이션을 esbuild로 번들해 Node에서 헤드리스 시나리오 실행 → Vite 개발 서버(5173)에 브라우저 도구로 접속해 실제 마우스 드래그·휠·클릭과 키 이벤트 디스패치로 spec 7.2 체크리스트 수행 → 프로덕션 서버(3100) 확인. 브라우저 검증 중 게임 상태는 Three.js `Scene`을 훅으로 읽어(플레이어·몬스터 메시 위치, 카메라 위치) HUD DOM·localStorage와 함께 확인했다.

## 요약
전체 판정: **통과** (재검증 후. 심각도 높음 0건, 중간 0건, 낮음 5건 — 모두 개선 권장 수준)
1차 검증에서 발견한 중간 문제 2건(0스텝 프레임의 엣지 입력 유실, 리쉬 경계 정지·무적)과 낮음 1건(저장 데이터 스탯 정합성)을 Build가 수정했고, 재검증에서 모두 해결됨을 확인했다. spec 7.2 체크리스트 25항목 중 24항목 통과·1항목 코드 검토로만 확인. 게임은 처음부터 끝까지(미션 3개 수락·완료·보고, 레벨업, 사망·부활, 저장·복원) 정상 진행되며 구조(shared 순수성, 상태/뷰 분리)도 spec대로다. 남은 낮음 항목(부활 시 카메라 스냅, 추적창 문구 하드코딩, 틱당 소규모 할당 등)은 v0.1 출시를 막지 않는다.

### 재검증 (2차) 결과 요약
| 확인 항목 | 결과 | 확인 방법 |
|---|---|---|
| `npm run typecheck` / `npm run build` / shared 순수성 grep | 통과 | 타입 에러 0, 빌드 514.23 kB(js), grep 모두 OK |
| 엣지 입력 유실(문제 1) | **해결됨** | rAF 8 ms(≈105 fps, 0스텝 프레임 43%) 에뮬레이션에서 Space 20/20, F 15/15 등록(수정 전 12/20). 16 ms에서도 12/12 |
| 리쉬 정지·무적(문제 2) | **해결됨** | 브라우저: (24,0) 슬라임을 마을로 끌고 가자 x=11.3(leash 13 경계)에서 돌아서서 2.5 m/s로 x=23.84까지 귀환, 도중 정지 없음. 귀환 후 다시 접근하면 재어그로(거리 2.4까지 추적·공격). 헤드리스: 귀환 중 3타에 처치 가능(HP 30→0, `dead`), 플레이어 사망 시 `return`→귀환→`idle` |
| `return` 상태의 뷰/HUD | 이상 없음 | 귀환 중 메시 계속 표시, 색 정상, idle 흔들림만 꺼짐(`sy=1`), HUD는 `ai`를 참조하지 않음. 콘솔 에러 없음 |
| 저장 데이터 정합성(문제 5) | **해결됨** | 저장값을 `maxHp 9999, atk 9999, hp 5000, xp 5000, q_golem.count -7`로 조작 후 새로고침 → HUD `Lv 2 / HP 120/120 / XP 199/200`, 다음 저장에 `maxHp 120, atk 13, xp 199, count 0`으로 기록 |
| 회귀 확인(미션 흐름·저장) | 통과 | 촌장 수락 → 슬라임 3마리 처치(3타·붉은 플래시·+20 XP·추적창 갱신) → 보고 시 +60 XP·Lv2·HP120/ATK13·골렘 미션 해금·수락 → 새로고침 후 레벨/XP/미션/위치 복원. 3100 포트 `/health`·빌드 산출물 정상 |
| spec.md 갱신 | 확인 | 4.5 표 `plat_hill_2 (0, 1.2, -46)`, 4.1/4.9 `HUD.update(state, events, frameDt)`로 구현과 일치 |

## 정적 검증
| 항목 | 결과 | 비고 |
|---|---|---|
| `npm install` | 통과 | 경고 없음(esbuild/fsevents install-script 안내만) |
| `npm run typecheck` | 통과 | 타입 에러 0 |
| `npm run build` | 통과 | `dist/assets/index-*.js` 514.23 kB (gzip 133.5 kB, 재검증 시), css 2.95 kB. chunkSizeWarningLimit 700으로 경고 억제 |
| `grep "from 'three'" src/shared` | 통과 | 없음 |
| `grep "document\.|window\.|localStorage" src/shared` | 통과 | 없음 |
| 추가 grep `performance\.|Math\.random|requestAnimationFrame|console\.` in shared | 통과 | 없음(몬스터 스폰은 링 배치로 결정론적) |
| shared → client import | 통과 | 없음(주석의 "client" 단어만 매치) |
| 파일 구조 vs spec 3절 | 통과 | 누락 없음. 추가 파일 없음. `types.ts`에 MapDef/MonsterDef/NPCDef/QuestDef/BoxDef/SimSystem이 함께 정의됨(spec은 각 data 파일에 두었으나 문제 없음). `.gitignore`에 `.DS_Store`, `*.log` 추가 |
| `package.json` 스크립트/의존성 | 통과 | spec 2절과 동일. socket.io 미설치(주석만) |
| `server/index.js` | 통과 | ESM, `express.static(dist)`, `GET /health` → `{"ok":true}`, `attachRealtime` 빈 접점+TODO 주석. 기본 포트 3100(사용자 변경, 문제 아님) |
| spec 9절 확정 사항 | 통과 | TS strict, 키 바인딩(F/E/Space/좌드래그/휠, 포인터락 없음), 보고형 완료, 사망 페널티 없음, 발판 4개, localStorage 저장·초기화 버튼, Express `/health`, 몬스터 마릿수(슬라임 6·골렘 3)와 수치는 spec 값 그대로. 단 슬라임 `leashRange` 18→13은 Review 제안(문제 2)에 따른 조정으로, spec 4.7 표도 13으로 맞추기를 권장 |

헤드리스 시뮬레이션(Node)에서 추가 확인한 것: 최대 점프 높이 1.546 m, 4개 발판 모두 걷기로는 옆면에 막히고 점프로 올라감(1.0/1.4/1.2/1.2→2.4), 바닥에서 2단(2.4 m) 직행 불가, 집·경계 충돌, q_slime→보고→Lv2(HP120/ATK13)→q_golem 해금, 두 슬라임이 같은 틱에 공격해도 무적으로 1회만 피해, 골렘에게 사망→3초 후 (0,0,6) HP 풀 부활, 슬라임 10초 리스폰, `GameState` JSON 직렬화 가능.

## 브라우저 체크리스트
| # | 항목 | 결과 | 확인 방법·비고 |
|---|---|---|---|
| 1 | 로드 시 콘솔 에러 없음, 60fps | 통과 | 게임 관련 에러/경고 없음(개발 서버 재시작으로 인한 vite HMR 웹소켓 재접속 로그만 있음). 렌더 훅으로 측정한 fps ≈ 60 |
| 2 | WASD 카메라 기준 이동, 대각선 정규화 | 통과 | yaw 0에서 W 1초: Δz −6.1, D 1초: Δx +6.0, S+A 1초: 변위 6.0(−4.24, +4.24) |
| 3 | 좌클릭 드래그 회전, pitch 한계, 휠 3~16 | 통과 | 실제 마우스 드래그: 오른쪽 100px → 카메라 yaw −0.636, 되돌리면 0.000. 아래로 300px → pitch 1.196(상한 1.2), 위로 400px → −0.095(하한 −0.1). 휠 3틱 → 8→11, 계속 내리면 16에서 정지, 올리면 3에서 정지 |
| 4 | Space 점프→착지, 공중 재점프 불가 | 통과 | 최고 1.54 m, 0.72초 후 y=0. 공중에서 다시 Space → 최고 높이 변화 없음 |
| 5 | 집·벽·기둥 막힘, 맵 가장자리 | 통과 | house_1 앞에서 W 유지 → z=−5.5에서 정지(미끄러짐 정상). 경계는 헤드리스에서 z=58 확인 |
| 6 | 마을 발판(1.0 m) 걷기 불가/점프 가능/걸어 나가면 낙하 | 통과 | 옆면 z=1.5에서 막힘 → S+Space → y=1.0 착지 → 걸어 나가면 y=0 |
| 7 | 언덕 1단→2단 점프, 바닥→2단 직행 불가 | 통과 | z=−38.5 막힘→점프 y=1.2 → z=−43.5 막힘→점프 y=2.4. 바닥→2단 직행은 헤드리스에서 실패 확인(y=0 유지) |
| 8 | 발판 위 점프·착지가 윗면 높이, 파고들기/떨림 없음 | 통과 | 발판 위 정지 시 y 샘플 [1.0]/[1.4]/[2.4] 단일값. 발판 위 점프 최고 2.55 → 1.0 착지 |
| 9 | 슬라임 추적, HP 5씩, 비네트, 0.5초 무적 | 통과 | 피해 간격 1.18~1.21초(=1.2 s), HP 100→95→90…, `#damage-flash.show` 약 0.2초, 플레이어 메시 붉은 깜빡임. 무적은 헤드리스로 확인 |
| 10 | 등지고 F 무피해, 마주보고 F 붉게 깜빡·3타 처치 | 통과 | 등진 상태 F: 슬라임 색 변화·로그 없음. 마주보고 F×3: `ff1744` 플래시 관찰, 3번째에 비표시(처치) |
| 11 | 처치 시 "+20 XP", XP 바 갱신, 10초 후 리스폰 | 통과 | 로그 "슬라임 처치", "+20 XP", XP 20/100. 처치 후 10초 뒤 스폰 지점(24,0)에 다시 표시 |
| 12 | 멀리 도망가면 스폰으로 귀환·HP 회복 | 통과 | 1차: 감지 범위 밖으로 나가자 (23.83, 0)으로 귀환(플레이어가 리쉬 경계 근처에 머물면 정지하는 문제 2가 있었음). 2차(수정 후): 리쉬 초과 즉시 `return` 상태로 귀환, 도착 시 회복·idle, 플레이어가 가까이 있어도 정지하지 않음 |
| 13 | 촌장 근처 `[E] 촌장과 대화`, 수락 대사, 추적창 0/3 | 통과 | 힌트 표시/범위 밖 숨김, 대화 패널 4초 후 숨김, "슬라임 소탕: 슬라임 처치 0/3", NPC 머리 위 `!` 사라짐 |
| 14 | 3마리 처치→"완료 — 촌장에게 보고", 보고 시 +60 XP, Lv2, HP120/ATK13 | 통과 | 로그 "미션 완료: 슬라임 소탕", "+60 XP", "새 미션 해금: 골렘 토벌", "레벨 업! Lv 2 — HP 120 / ATK 13", HUD HP 120/120, XP 40/200 |
| 15 | 보고 후 다시 E → 골렘 미션 수락 | 통과 | 대사·추적창 "골렘 토벌: 골렘 처치 0/2" |
| 16 | 파수꾼 미션: 2단 링 위에서 즉시 완료, 아래 바닥에서는 미완료 | 통과 | 링 바로 아래 바닥 (0.4, 0, −50.4)에서 미완료 → 2단 착지 즉시 "미션 목표 달성", 추적창 "완료 — 파수꾼에게 보고", 파수꾼 `?` 표시 |
| 17 | plat_field 위 안쪽에서 무피해, 슬라임은 옆에 막힘 | 통과 | 6초간 HP 불변, 슬라임은 발판 옆 z=−7.0에 고정 |
| 18 | 사망 오버레이·카운트다운, 3초 후 마을 부활, 진행 유지 | 통과 | "쓰러졌습니다… 3/2/1초 후 부활" 순서 표시, 플레이어 메시 숨김, 부활 위치 (0,0,6), HP 풀, XP/레벨/미션 유지. 사망 원인은 슬라임(골렘 사망은 헤드리스에서만 확인) |
| 19 | 탭 전환 30초 후 폭주 없음 | 통과(대체 확인) | 메인 스레드 2.5초 정지 후 위치·HP 변화 없음. 코드: frameDt 0.1 클램프, 최대 5스텝, 초과 시 accumulator 리셋 |
| 20 | 저장 표시(이벤트 즉시·5초 주기), localStorage `play1.save` | 통과 | setItem 훅: 5.0초 간격 저장 + 수락/진행/완료/보고/레벨업 직후 즉시 저장, "저장됨" 표시 |
| 21 | 새로고침 후 레벨/XP/HP/ATK·미션·위치(발판 위) 복원, 로그 표시 | 통과 | 2단 발판 위(0.1, 2.4, −46.1)에서 새로고침 → 같은 위치·Lv2·HP120/120·XP40/200·미션 상태 복원, "저장된 진행을 불러왔습니다 (Lv 2)" |
| 22 | 공중/사망 중 탭 닫기 → 마지막 지상 위치 또는 마을 | 미확인(코드 검토) | `buildSaveData`가 `alive && onGround`일 때만 위치를 갱신하고 그 외엔 직전 지상 위치를 유지함을 코드로 확인. 브라우저에서 직접 재현하지는 않음 |
| 23 | 손상 데이터(`{"version":99}`, 비JSON) → 경고 후 새 게임 | 통과 | `[persistence] invalid save data` / `corrupt save (JSON)` 경고, 키 삭제, Lv1·스폰에서 시작, 에러 없음 |
| 24 | 초기화 버튼 confirm 취소/확인 | 통과 | 실제 클릭 → `confirm("저장된 진행을 삭제하고 처음부터 시작할까요?")` 호출 확인. 취소: 상태·저장 불변, 포커스 캔버스 복귀. 확인(브라우저 도구가 네이티브 대화상자를 막아 stub으로 true 반환): 저장 삭제 후 새로고침, Lv1·미션 없음·(0,0,6) |
| 25 | 프로덕션 서버(3100)에서 동일 동작 | 통과 | `/health` 200 `{"ok":true}`, index/assets 200, 게임 렌더, 콘솔 메시지 0건 |

## 발견한 문제

### 문제 1 — 시뮬레이션 스텝이 0회인 프레임에서 점프/공격/상호작용 입력이 유실됨 — **해결됨**
- 상태: 해결됨(2차 검증). `Game.ts`에 `PendingEdges` 버퍼가 추가되어 edge 입력을 OR 누적하고 첫 스텝이 소비한 뒤에만 비운다. rAF 8 ms 에뮬레이션(0스텝 프레임 43%)에서 Space 20/20, F 15/15 등록.
- 심각도(수정 전): **중간** (60Hz에서는 간헐적, 120Hz 이상 디스플레이에서는 입력의 40~50%가 무시되어 조작감이 크게 나빠짐)
- 위치(수정 전): `src/client/Game.ts:129-146` → 수정 후 `src/client/Game.ts:52-56, 73, 140-160`
- 내용: `buildCommand`가 이번 프레임의 edge 입력(`keysPressed`)으로 `cmd`를 만들고, `while (accumulator >= FIXED_DT)` 루프 안에서만 소비한다. 프레임 dt가 1/60보다 짧아 이번 프레임에 스텝이 0회이면 `cmd.jump/attack/interact = true`가 그대로 버려지고, 다음 프레임에는 `Input.poll()`이 `keysPressed`를 이미 비웠으므로 입력이 사라진다. rAF가 120Hz로 돌면 프레임의 약 절반이 0스텝이다.
- 재현 방법: rAF 주기를 8 ms로 에뮬레이션(120Hz 디스플레이와 동일)한 상태에서 Space를 20회 눌렀을 때 12회만 점프(0스텝 프레임 비율 43%, 유실 8회 전부 0스텝 프레임과 일치). 16 ms 에뮬레이션에서도 dt 지터로 12회 중 4회 유실된 시도가 있었다.
- 제안: edge 입력을 스텝이 소비할 때까지 보류한다. 예: `Game`에 `pendingJump/pendingAttack/pendingInteract` 플래그를 두고 `snap.keysPressed`로 OR 갱신 → 첫 스텝에 넣은 뒤 false로 리셋(스텝이 0회면 다음 프레임으로 이월). 또는 `Input`이 `keysPressed`를 poll 시점이 아니라 "소비" 시점에 비우도록 API를 바꾼다.

### 문제 2 — 리쉬 경계에서 몬스터가 정지하고 매 틱 완전 회복되어 죽일 수 없음 — **해결됨**
- 상태: 해결됨(2차 검증). `MonsterAIState`에 `'return'`이 추가되어 리쉬 초과·플레이어 사망 시 귀환 상태로 전환, 귀환 중 어그로 무시, 도착(0.2 m 이내) 시 1회 회복 후 `idle`. 브라우저에서 x=11.3에서 돌아서 스폰까지 귀환·재어그로 확인, 헤드리스에서 귀환 중 타격·처치 가능 확인. 슬라임 `leashRange` 18→13 조정 반영(마을 x=6까지 끌려오던 문제 해소, 경계 x≈11).
- 심각도(수정 전): **중간** (spec 4.7 "spawnPos로 귀환 후 idle" 위반, 실제 플레이에서 재현됨)
- 위치(수정 전): `src/shared/sim/monsterSim.ts:62-68` (idle), `:70-76` (chase의 leash 처리) → 수정 후 `src/shared/sim/monsterSim.ts:51-56, 66-76, 100-109`, `src/shared/types.ts:18`, `src/shared/data/monsters.ts:7-8`
- 내용: `chase`에서 스폰 거리 > leashRange이면 `ai='idle'`, `hp=maxHp`로만 바꾸고 귀환 상태가 없다. 다음 틱 `idle`에서 플레이어가 aggroRange 안에 있으면 즉시 다시 `chase`가 되고(이 틱에는 이동 없음), 그 다음 틱 다시 leash → idle+회복… 이 두 상태를 매 틱 번갈아가며 제자리에 멈추고 매 틱 HP가 최대로 채워진다. 플레이어가 aggroRange(8) 밖으로 나가야만 `returnHome`이 실행된다.
- 재현 방법: (브라우저) 슬라임 필드에서 (24,0) 스폰 슬라임을 끌고 마을 (0,0)까지 오면 슬라임이 리쉬 경계 x=6.00(파수꾼 옆)에 멈춰 선 채 움직이지 않음. (헤드리스) 같은 상황에서 8회 타격해도 HP 30 유지, `ai`는 idle/chase 교대. 플레이어가 x≤−2로 물러나야 귀환 시작.
- 제안: 귀환 상태를 추가한다(예: `MonsterAIState`에 `'return'` 추가 또는 `idle`에서 `distXZ(pos, spawnPos) > 0.5`이면 aggro 판정을 건너뛰고 `returnHome`만 수행). 회복은 도착 시 1회만. 함께 슬라임 leash 18은 스폰 (24,0) 기준 마을 x=6까지 도달하므로 12~14로 줄이는 밸런스 조정을 제안한다(spec 9.8에 따라 제안만).

### 문제 3 — spec 4.5 `plat_hill_2` center.y 1.8 → 1.2 변경 검토
- 심각도: 낮음 (코드 문제 아님, spec 표 수정 권장)
- 위치: `src/shared/data/map.ts:40-42`, `spec.md` 4.5 발판 표
- 내용: spec 표의 center (0,1.8,−46)·size 4×2.4×4는 아랫면 0.6·윗면 3.0이 되어 같은 절의 "모두 바닥에 붙어 있고", "윗면 y=2.4", "1단 위에서 1.2 m 단차", `hill_sign pos.y=2.4`와 모순되고, 1단(1.2)에서 3.0까지 1.8 m 단차는 최대 점프 1.62+0.35 m로 불가능하다. Build의 1.2 변경은 표 외의 모든 서술과 일치하며 타당하다. 브라우저에서 1단→2단 점프, 링 위 즉시 완료, 바닥·1단에서 미완료를 모두 확인했다.
- 제안: spec 4.5 표의 해당 행을 `(0, 1.2, -46)`으로 고친다. 코드 변경 불필요.

### 문제 4 — `HUD.update(state, events, dt)` 시그니처가 spec과 다름
- 심각도: 낮음
- 위치: `src/client/ui/HUD.ts:65`, `src/client/Game.ts:154`
- 내용: spec 4.9는 `HUD.update(state, events)`. 대화 4초·로그 5초·비네트 0.2초·저장 표시 1초 타이머에 프레임 dt가 필요해 인자를 추가한 것으로 합리적이다.
- 제안: spec 4.1/4.9의 시그니처를 갱신하거나, `state.time` 차이로 타이머를 계산해 spec 시그니처를 유지한다.

### 문제 5 — 저장 데이터 검증이 레벨과 스탯의 정합성을 확인하지 않음 — **해결됨**
- 상태: 해결됨(2차 검증). 로드 시 `level`을 `1..MAX_LEVEL`로 클램프하고 `statsForLevel(level)`로 `maxHp/atk`를 재계산, `xp`를 `0..xpToNext(level)-1`, `count`를 0 이상으로 클램프한다(`src/client/persistence.ts:87-100`). 조작한 저장값(`maxHp 9999, atk 9999, xp 5000, count -7`)이 `120/13/199/0`으로 정정됨을 확인.
- 심각도(수정 전): 낮음
- 위치(수정 전): `src/client/persistence.ts:39-58, 86-97`
- 내용: `maxHp/atk/xp/count`가 숫자인지만 검사한다. `{"level":2,"maxHp":99999,"atk":9999,...}`처럼 손으로 고친 값이 그대로 적용되고, `xp >= xpToNext(level)`인 값은 다음 XP 획득 때까지 레벨업이 지연된다. 음수 `count`도 통과한다.
- 제안: 로드 시 `statsForLevel(level)`로 `maxHp/atk`를 재계산하고, `level`을 `1..MAX_LEVEL`, `xp`를 `0..xpToNext(level)-1`, `count`를 `0 이상`으로 클램프한다.

### 문제 6 — 사망 후 부활 시 카메라가 필드에서 마을까지 lerp로 이동
- 심각도: 낮음 (연출)
- 위치: `src/client/CameraController.ts:57-59`(`snap()` 미사용), `src/client/Game.ts`
- 내용: `player:respawned` 시 카메라가 약 30~50 m를 0.5초 정도 미끄러져 온다(부활 직후 카메라-타깃 거리 15.4 관측). `snap()`이 준비되어 있으나 호출처가 없다.
- 제안: `Game.frame`에서 `player:respawned` 이벤트가 있으면 `cameraCtl.snap()` 호출.

### 문제 7 — 추적창의 도달형 미션 문구 하드코딩
- 심각도: 낮음
- 위치: `src/client/ui/HUD.ts:202-203`
- 내용: `reach` 목표는 미션 데이터와 무관하게 `"언덕 표지판까지 이동"`으로 고정되어 있어 도달형 미션을 추가하면 문구가 틀린다.
- 제안: `QuestDef.description`을 쓰거나 reachPoint에 표시 이름을 추가한다.

### 문제 8 — 틱/프레임마다 소규모 할당
- 심각도: 낮음 (현재 규모에서는 체감 없음)
- 위치: `src/shared/sim/playerSim.ts:44`(`concat` + `platformsAsWalls` 배열), `src/shared/sim/questSim.ts:73`(`events.filter`), `src/client/Input.ts:48-53`(매 프레임 `new Set`, 객체 생성), `src/client/Game.ts:156-160`(edge 리셋 시 `{...cmd}`)
- 제안: 벽 배열 버퍼 재사용, `for` 루프로 필터 대체, `InputSnapshot`을 재사용 객체로 채우기.

### 문제 9 — 개발 서버 콘솔에 vite HMR 웹소켓 재접속 로그
- 심각도: 낮음 (앱 문제 아님, 기록용)
- 내용: 검증 중 `npm install`로 lockfile이 바뀌어 Vite가 의존성을 재최적화하며 페이지를 강제 새로고침했고, 그 과정의 `WebSocket connection failed / server connection lost` 로그가 남았다. 게임 코드에서 발생한 에러·경고는 없었다.

## spec 대비 차이
- **변경(spec 반영 완료)**: `plat_hill_2.center.y` 1.8 → 1.2 (문제 3, 타당). 메인 세션에서 spec 4.5 표를 1.2로 갱신해 현재는 차이 없음.
- **변경(spec 반영 완료)**: `HUD.update(state, events, frameDt)` (문제 4). spec 4.1/4.9가 갱신되어 현재는 차이 없음.
- **변경**: 몬스터 FSM에 `'return'` 상태 추가(spec 4.0 `MonsterAIState`에는 idle/chase/attack/dead만 있음). 리쉬 초과·플레이어 사망 시 `return`으로 귀환하고 도착 시 회복·`idle` — spec 4.7의 "spawnPos로 귀환 후 idle" 의도와 일치. `idle`은 더 이상 귀환 이동을 하지 않음(항상 스폰 위치에서만 idle이므로 문제 없음). spec 4.0 타입 정의에 `'return'` 추가를 권장.
- **변경(밸런스, Review 제안 반영)**: 슬라임 `leashRange` 18 → 13 (`src/shared/data/monsters.ts:7-8`). spec 4.7 표·9.8은 아직 18이므로 spec 갱신 권장.
- **변경**: `buildCommand(input, cameraYaw, pending?)` — 세 번째 인자 `PendingEdges`가 추가됨(spec 4.1 `buildCommand(input, camera.yaw)`). 엣지 입력 보류 버퍼용.
- **변경**: `collision.resolveCircleVsAABBs` — 원 중심이 박스 밖일 때는 spec의 축별 최소 침투 대신 최근접점 방향으로 밀어냄(모서리에서 더 자연스러움), 중심이 안에 있을 때만 축별 최소 침투. 2회 반복은 동일.
- **변경**: 몬스터 스폰 위치 — 구역 반경 내 임의 배치 대신 반경×0.6 링에 균등 배치(shared에 `Math.random` 금지 규칙 준수, 결정론적).
- **추가**: `persistence.setOnSaved(cb)` 콜백(저장 표시용), `HUD.pushLog` public, `HUD.showSaved`, `EMPTY_COMMAND`, `SimSystem` 타입, `boxAABB`/`OBSTACLE_AABBS`/`PLATFORM_AABBS`/`ALL_WALL_AABBS` 사전 계산, 상수 `ATTACK_ANIM_TIME`, `HIT_FLASH_TIME`, `MONSTER_ATTACK_LEAVE_FACTOR`, `MAP_SIZE`, `MAX_STEPS_PER_FRAME`, `MAX_FRAME_DT`.
- **추가(연출)**: 우물을 원기둥으로 렌더(충돌은 AABB), 스폰 구역 반투명 원판, 발판 모서리 선, 몬스터 idle 상하 흔들림, NPC 팔 흔들림, 플레이어 눈. 모두 spec 1.3이 허용하는 프로시저럴 모션·기본 지오메트리 범위.
- **위치 차이**: 초기화 버튼 클릭 핸들러가 `HUD`가 아니라 `Game` 생성자에 있음(동작은 spec대로). 키 이벤트는 spec 허용대로 `window`에 바인딩.
- **문구 차이**: 추적창 `"슬라임 소탕: 슬라임 처치 2/3"`(spec 예시 `"슬라임 처치 2/3"`에 제목 접두), 처치 시 `"슬라임 처치"` 로그가 `"+20 XP"`와 함께 출력.
- **서버**: 기본 포트 3100(사용자 변경, 문제 아님). `/health`·정적 서빙·`attachRealtime`은 spec대로.
- **누락**: 없음. spec 3절 파일 전부 존재, 7.2 항목 중 "골렘에게" 사망은 브라우저에서 슬라임 사망으로 대체 확인(메커니즘 동일, 골렘 사망은 헤드리스 확인).

## 잘된 점
- `src/shared`가 완전히 순수하다(three/DOM/window/performance/Math.random 없음). `GameState`는 JSON 직렬화 가능한 순수 데이터이고, 뷰 클래스는 상태를 읽기만 한다. `stepSimulation`이 playerSim → monsterSim → combatSim → questSim → levelSim 순서를 한 곳에서 보장하고 같은 틱의 `monster:killed` → `player:xp` 흐름이 정확히 이어진다.
- 발판 물리(벽/착지 판정의 상호 배타 조건)가 spec 4.3·4.5대로 구현되어 4개 발판 모두 파고들기·떨림 없이 동작하고, 2단 언덕·피난처·도달 판정이 모두 의도대로 작동한다.
- HUD는 변경된 값만 DOM에 쓰고(캐시 키 비교), 스프라이트 HP 바는 양자화된 값이 바뀔 때만 다시 그린다. 렌더 훅으로 측정한 fps가 60으로 안정적이다.
- 저장/로드: `try/catch`, 버전·타입·questId·맵 경계 검증, 손상 데이터 자동 삭제, 0.5초 스로틀+dirty 플래그, `beforeunload` 저장, 지상 위치만 기록하는 규칙이 모두 구현되어 있고 실제로 발판 위 위치까지 복원된다.
- `buildCommand`에 카메라 yaw별 예시 값이 주석으로 있고(spec 8절 위험 대응), 실제로 W가 카메라 정면, 대각선 속도가 정규화되어 있다.
- `getTargetPlayer` 헬퍼, `attachRealtime` 접점, ESM 서버 등 멀티플레이 확장 고려사항(5절)이 빠짐없이 반영되어 있다.
- 2차 수정이 최소 범위로 정확했다: 엣지 입력 버퍼는 `Game` 내부에만, 귀환 상태는 FSM에 한 상태만 추가(뷰·HUD 변경 불필요), 저장 정합성은 `load` 한 곳에서 처리되어 회귀 없이 세 문제가 모두 닫혔다.
