# review.md — GitHub Pages 배포 설정 검증 결과

- **검증 대상:** Build 서브에이전트가 만든 GitHub Pages 배포 설정. 미커밋 작업 트리이고, 기준 커밋은 `65d7c55`다.
- **기준:** `spec.md` 15절 "배포 — GitHub Pages". 검증 시점 기준 spec.md 812~819행이고, v0.3 재작성 전 내용이다.
- **검증 일시:** 2026-09-26
- **환경:** macOS (Darwin 25.6), Node 24.21.0, npm 11.19.0, Vite 6.4.3, vitest 3.2.7, Phaser 3.90.0, gh 2.101.0
- **브라우저:** Claude Browser. 패널은 숨김 상태였지만 rAF는 약 64fps로 돌았다.

### 검증 방법
- **정적 검사**
  - `git status`와 `git diff`를 보고 워크플로를 정독했다.
  - YAML은 Ruby Psych로 파싱했다.
  - `gh api`로 액션의 릴리스·태그·`action.yml`을 조회했다. 저장소의 Pages·environment·Actions 설정도 같은 방법으로 읽었다(읽기 전용).
- **CI 재현**
  - scratchpad에 깨끗한 체크아웃을 만들었다: `git archive HEAD` + 새 `vite.config.ts` + node_modules 복제. 복제는 APFS clone이라 설치·다운로드가 없다.
  - 그 안에서 `CI=true npm test`, `npm run build`를 돌리고 산출물을 프로젝트 dist와 비교했다.
- **하위 경로 서빙**
  - `vite preview`는 Pages와 다르게 동작해서 404 검출에 못 쓴다. 없는 파일에도 index.html(200)을 돌려주고, 끝 슬래시 없는 `/worldgame`에는 404를 낸다.
  - 그래서 GitHub Pages 규칙을 흉내 낸 정적 서버를 따로 만들었다: scratchpad `pages-sim.mjs`, 포트 4174. 대소문자 구분, 디렉터리 301, 404, `Cache-Control: max-age=600`을 따른다.
  - 이 서버로 깨끗한 체크아웃의 dist를 `/worldgame/` 아래에 서빙하고 전체 흐름을 돌렸다.
  - 규칙이 실제와 같은지는 같은 계정의 실제 Pages 사이트(`/class1/`)에 HEAD 요청을 보내 확인했다.
  - `vite preview --base=/worldgame/ --port 4173`도 로딩만 따로 확인했다.
- **프로덕션 빌드 조작**
  - 프로덕션 빌드에는 `window.__play1`이 없다. Phaser 번들이 설정하는 `window.Phaser`에서 `InputManager.prototype.onMouseMove`와 `onMouseDown`을 감싸 게임 인스턴스를 잡았다.
  - 이름 입력 `prompt`는 페이지에서 대체했다. `AudioContext`는 감싸서 오디오 노드 생성 수를 셌다.
  - 모두 페이지 JS 상태만 바꾼 것이고 소스는 건드리지 않았다.
  - 키 입력은 window에 합성 KeyboardEvent(keyCode 포함)로 넣었다. 버튼·퀴즈 보기·상점 항목은 실제로 클릭했다.
- **대소문자 대조:** 빌드 산출물이 참조하는 모든 URL을 dist의 실제 파일 이름과 대소문자까지 비교했다(scratchpad `casecheck.mjs`).

### 정리
- **수정 범위:** 수정한 파일은 `review.md` 하나다. 소스·설정·spec·agents는 건드리지 않았다. 다운로드·커밋·푸시도 하지 않았고, gh는 읽기 전용 조회에만 썼다.
- **서버:** 띄운 서버 4개는 모두 종료했다(4174 시뮬레이터, 4173 vite preview, 3100 Express, 5173 dev). 네 포트가 모두 비어 있음을 확인했다.
- **설정 파일:** `.claude/launch.json`은 만들지 않았다(없음 확인).
- **브라우저 탭:** 새 탭을 만들어 쓰고 닫았다. 기존 탭(tab-1)은 건드리지 않았다.
- **미리보기 브라우저 저장**
  - 4174: 비어 있던 저장을 테스트 뒤 다시 비웠다.
  - 3100: 테스트 뒤 비웠다. 빈 상태 해시가 처음과 같다.
  - 4173: 처음부터 비어 있었고 바뀌지 않았다.
  - 5173: 이전 리뷰어 저장(40P, `play1.progress` SHA-256 `7e56f7e1…`)이 테스트 전후로 같다.
  - 저장 확인은 게임 코드가 돌지 않는 같은 오리진의 `manifest.json` 페이지에서 했다.

## 요약
판정: **통과**. spec 15절 요구 사항을 모두 충족한다. 하위 경로(`/worldgame/`), 루트 경로(`npm start`), 개발 서버 모두 404와 콘솔 에러 없이 동작한다.

발견 건수: 높음 0 · 중간 0 · 낮음 2(선택 개선) · 참고 7

- **변경 범위:** `vite.config.ts`의 `base: './'` 한 줄과 새 파일 `.github/workflows/deploy.yml`뿐이다.
- **워크플로 구성:** 다음 항목이 spec 15절과 공식 예제(starter-workflows `pages/static.yml`)에 맞는다.
  - 트리거, 권한, concurrency
  - Node 24와 npm 캐시
  - 단계 순서와 deploy 잡 구성
- **액션 버전:** Build 보고와 일치한다.
  - 5개 모두 실제로 있는 최신 메이저 태그다. 태그 커밋이 최신 릴리스 커밋과 같다.
  - 모두 node24 런타임이다.
  - YAML 파싱도 정상이다.
- **저장소 설정:** Build 보고대로다.
  - Pages Source는 이미 GitHub Actions(`build_type: workflow`)다.
  - `github-pages` environment는 main 배포만 허용한다.
  - 원격에는 아직 워크플로가 없다. 첫 main 푸시가 첫 배포가 되고, 현재 URL은 404다.
- **정적 검사:** typecheck 0, 테스트 16파일 163개, build 모두 통과했다.
  - 깨끗한 체크아웃(git이 추적하는 파일만)에서도 테스트와 빌드가 통과한다. dist는 바이트 단위로 같다.
  - 참조 URL 12개가 대소문자까지 모두 일치한다. 루트 절대 경로는 0개다.
- **하위 경로 흐름:** `/worldgame/`에서 다음 흐름을 끝까지 통과했다.
  - 타이틀 → 세계지도 → 서울 입장 → 4지선다 퀴즈 5/5 → 아바타 룸 구매·장착 → 새로고침 복원
  - 그림 시트 4장, manifest, 폰트 4종, world-atlas(번들 포함), 음향(Web Audio)이 모두 정상이다.
- **낮음 2건:** 둘 다 spec 위반은 아니다.
  - L1: CI에 typecheck가 없어서 타입 에러가 있어도 배포된다. 재현했다.
  - L2: 권한이 워크플로 전체에 걸려 있어 build 잡도 `pages: write`와 `id-token: write`를 가진다.

## 변경 범위
| 파일 | 상태 | 내용 | 판정 |
|---|---|---|---|
| `vite.config.ts` | 수정(+1) | `defineConfig` 맨 위에 `base: './',` | 지침대로 |
| `.github/workflows/deploy.yml` | 신규(60행) | Pages 배포 워크플로 | 지침대로 |
| `CLAUDE.md`, `agents/plan.md` | 수정 | v0.3 그래픽 계획 작업(코디네이터) | 검증 대상 아님 |
| `spec.md` | 수정(+9) | 15절 추가(코디네이터). v0.3 재작성 진행 중 | 검증 대상 아님(기준 문서) |
| `agents/pages-build.md`, `agents/pages-review.md` | 신규 | 서브에이전트 지침(코디네이터) | 검증 대상 아님 |

- 지침 파일이 생긴 뒤(04:23) 바뀐 파일은 다음 경로에 없다: `src/`, `server/`, `public/`, `index.html`, `package.json`, `package-lock.json`, `tsconfig.json`.
- Build가 만든 두 파일의 수정 시각은 04:25다.

## 워크플로 검토
| 항목 | 기준(spec 15절·지침) | `deploy.yml` | 판정 |
|---|---|---|---|
| 트리거 | main 푸시, 수동 실행 | `push.branches: [main]`, `workflow_dispatch` | 통과 |
| 권한 | contents read, pages write, id-token write | 워크플로 최상위에 세 권한 | 통과(L2 참고) |
| concurrency | 그룹 `pages` | `group: pages`, `cancel-in-progress: false`. 공식 예제와 같다(진행 중 배포는 끝까지 가고, 대기 중인 실행만 최신 것으로 바뀜) | 통과 |
| 러너 | — | 두 잡 모두 `ubuntu-latest` | 통과 |
| Node·캐시 | Node 24, npm 캐시 | `setup-node`에 `node-version: 24`, `cache: npm`(루트 `package-lock.json`) | 통과 |
| 빌드 단계 | npm ci → npm test → npm run build | 같은 순서 | 통과(L1 참고) |
| Pages 단계 | configure-pages → upload-pages-artifact(dist) | `configure-pages@v6` → `upload-pages-artifact@v5`(`path: dist`) | 통과 |
| deploy 잡 | needs build, environment github-pages, url 출력 | `needs: build`, `environment.name: github-pages`, `url: ${{ steps.deployment.outputs.page_url }}`, `deploy-pages@v5`(`id: deployment`) | 통과 |
| YAML 문법 | 오류 없음 | Ruby Psych 파싱 정상, 탭 없음, LF·끝 줄바꿈 있음. YAML 1.1 파서는 `on`을 `true`로 읽지만 GitHub 파서와는 무관하다 | 통과 |
| 입력·출력 호환 | — | `action.yml`로 확인: setup-node v7에 `cache` 입력, upload-pages-artifact v5에 `path` 입력, deploy-pages v5에 `page_url` 출력이 있다 | 통과 |

### 액션 버전
조회 방법: `gh api repos/actions/<이름>/releases`, `gh api repos/actions/<이름>/git/ref/tags/vN`

| 액션 | 사용 | 최신 릴리스(게시일) | 메이저 태그 커밋 | 런타임 |
|---|---|---|---|---|
| actions/checkout | `@v7` | v7.0.1 (2026-07-20) | `3d3c42e5aac5` = v7.0.1 | node24 |
| actions/setup-node | `@v7` | v7.0.0 (2026-07-14) | `820762786026` = v7.0.0 | node24 |
| actions/configure-pages | `@v6` | v6.0.0 (2026-03-25) | `45bfe0192ca1` = v6.0.0 | node24 |
| actions/upload-pages-artifact | `@v5` | v5.0.0 (2026-04-10) | `fc324d354710` = v5.0.0 | composite(내부 upload-artifact v7.0.0, node24) |
| actions/deploy-pages | `@v5` | v5.0.1 (2026-09-01) | `368f82528645` = v5.0.1 | node24 |

### 저장소 설정(`gh api`, 읽기 전용)
| 항목 | 값 | 판정 |
|---|---|---|
| 저장소 | `eversunk2-tech/worldgame`, public, 기본 브랜치 main | 통과 |
| Pages | `build_type: workflow`(Source = GitHub Actions), `html_url` https://eversunk2-tech.github.io/worldgame/, `https_enforced: true` | 통과(Build 보고와 일치) |
| environment `github-pages` | 배포 브랜치 정책: `main`만 허용 | 통과(다른 브랜치에서 수동 실행하면 deploy 단계에서 막힘, 참고 R6) |
| Actions | 사용 중, 모든 액션 허용, SHA 고정 강제 없음. 기본 토큰 권한은 read이고 워크플로의 `permissions`가 우선한다 | 통과 |
| 원격 상태 | 원격 main에 `.github/` 없음, 워크플로 실행 기록 0, 현재 URL 404 | 배포 전 상태 |

## 정적 검증
| 항목 | 결과 | 비고 |
|---|---|---|
| `npm run typecheck` | 통과 | 에러 0 |
| `npm test` | 통과 | 16파일 163개 |
| `npm run build` | 통과 | 124모듈, dist 18파일 3.6MB. 참조 방식은 아래와 같다.<br>• `index.html`: `./assets/…`<br>• 폰트: `new URL(…, import.meta.url)`<br>• 시트·manifest: 페이지 기준 상대 경로 `assets/vendor/…` |
| 깨끗한 체크아웃 재현 | 통과 | git이 추적하는 파일 + 새 `vite.config.ts`만으로 `CI=true` 테스트 163개와 빌드가 통과했다. `diff -r` 결과 프로젝트 dist와 같다. `TZ=UTC LANG=C.UTF-8`에서도 테스트가 통과한다. git이 무시하는 `.cache/`는 빌드·테스트가 참조하지 않는다 |
| 참조 경로 대소문자 | 통과 | 참조 12개(HTML 2, 폰트 4, 청크 import 1, 시트 4, manifest 1)가 모두 dist 파일 이름과 정확히 같다. 루트 절대 경로(`/assets/…`)는 0개다 |
| lockfile | 통과 | package.json과 lock의 루트 의존성이 같고 `npm ls --all`도 정상이다. 리눅스용 선택 바이너리(`@rollup/rollup-linux-x64-gnu` 4.63.4, `@esbuild/linux-x64` 0.25.12)가 lock에 있어 ubuntu에서 `npm ci`가 된다 |
| world-atlas | 통과 | `land-110m` 토폴로지가 index JS에 들어 있어 별도 요청이 없다 |

## 하위 경로 브라우저 체크리스트
대상: `http://localhost:4174/worldgame/`(Pages 시뮬레이터)

| # | 항목 | 결과 | 근거 |
|---|---|---|---|
| 1 | 끝 슬래시 없는 `/worldgame` | 통과 | 301로 `/worldgame/`에 이동한 뒤 로딩 |
| 2 | 타이틀 | 통과 | 세계지도 배경·"새로 시작"·안내문이 보인다. "에셋 미설치" 경고 없음 |
| 3 | 그림 시트 4장·`manifest.json` | 통과 | 모두 200이고 크기가 파일과 같다(94,579 / 25,426 / 11,137 / 22,169 B, manifest 2,474 B) |
| 4 | 폰트 | 통과 | Galmuri11·11 Bold·14·9 woff2가 200이고 `document.fonts` 4개가 loaded. 화면 글꼴 정상 |
| 5 | world-atlas | 통과 | 세계지도 해안선 정상(폴백 그림 아님), 경고 없음 |
| 6 | 음향 | 통과 | 첫 클릭 뒤 AudioContext가 `running`. 오실레이터가 5개에서 33개로 늘고 버퍼 소스 2개가 생겼다(BGM·효과음 코드 생성이 동작) |
| 7 | 새로 시작 → 세계지도 | 통과 | 이름 입력 뒤 WorldMap으로 이동. `play1.progress` v3 저장 생성 |
| 8 | 도시 입장 | 통과 | Enter로 서울 입장(City+Hud). Kenney 타일·경복궁·NPC·미니맵·이모지 바가 보인다 |
| 9 | 미니게임 1개 | 통과 | 한별에게 학습 카드 "서울의 지형"을 보고 미션 수락 → 4지선다 퀴즈 5/5(보기는 실제 클릭) → 성공. 미션 turnedIn, 45P |
| 10 | 아바타 룸 | 통과 | M으로 세계지도, R로 아바타 룸. "긴 갈색 머리"(25P)를 실제 클릭으로 구매(45→20P)하고 장착 |
| 11 | 새로고침 후 저장 복원 | 통과 | "이어하기 (리뷰어)" → 세계지도 20P → 아바타 룸에 긴 갈색 머리 유지. 새로고침은 `max-age=600` 때문에 브라우저 캐시로 로딩됐다(Pages와 같은 동작) |
| 12 | 네트워크 404 | 게임 자원 0건 | 서버 로그 기준 페이지 요청 14건: 301 1건, 200 12건, 404 1건. 404는 브라우저가 오리진 루트로 자동 요청한 `/favicon.ico`뿐 |
| 13 | 콘솔 | 에러·경고 0 | Phaser 배너 log와 Chrome의 "Slow network … fallback font" info 4건만 있다 |
| 14 | `vite preview --base=/worldgame/`(4173) | 통과 | 타이틀 표시, 자원 11개 200(실제 크기), 콘솔 에러 0. 다만 이 서버는 404 검출용으로 부적합하다: 없는 파일에도 index.html(200)로 답하고 `/worldgame`에는 404를 낸다 |

## 루트 경로 회귀
| 항목 | 결과 | 근거 |
|---|---|---|
| `PORT=3100 node server/index.js`의 `/health` | 통과 | `{"ok":true}` 200 |
| 3100 게임 로딩 | 통과 | 자원 11개 200, 폰트 4개 loaded. 타이틀 → 새로 시작 → 세계지도 → 서울 입장, 콘솔 에러 0. 없는 파일은 404(폴백 없음) |
| `npm run dev`(5173) | 통과 | Vite ready 166ms. 개발 서버에서는 base가 `/`로 동작한다(`/src/client/main.ts`). 타이틀(이어하기) 표시, 폰트 loaded, 자원 118개 중 4xx 0, 콘솔 에러 0. `window.__play1` 개발 훅도 그대로다 |

## GitHub Pages 실제 환경과 다를 수 있는 점
실제 동작은 같은 계정의 기존 Pages 사이트(`/class1/`)에 HEAD 요청을 보내 확인했다(2026-09-26).

| 항목 | 로컬 검증 | 실제 Pages | 영향·대응 |
|---|---|---|---|
| 대소문자 | macOS 파일 시스템은 대소문자를 구분하지 않는다 | 구분한다(`/CLASS1/`, `/class1/INDEX.html` → 404) | 참조 12개의 철자 일치를 스크립트로 확인했다. 주소도 소문자 `/worldgame/` 그대로 써야 한다 |
| 끝 슬래시 | 시뮬레이터는 301, vite preview는 404 | `/class1` → 301 `/class1/` | `base: './'`는 끝 슬래시가 붙은 주소를 전제한다. Pages가 리디렉션하므로 문제없다 |
| 없는 파일 | vite preview는 200(index.html)을 돌려준다 | 404 | 로컬 확인은 404를 내는 서버로 해야 한다(이번 검증 방식) |
| 캐시 | 서버마다 다르다 | `Cache-Control: max-age=600` | 배포 직후 최대 10분 동안 옛 버전이 보일 수 있다 → 강력 새로고침. JS·폰트는 해시 이름이지만 `index.html`과 `assets/vendor/*`는 이름이 고정이다(참고 R3) |
| favicon | 3100에서도 404 | 오리진 루트 `/favicon.ico` 404 | 브라우저 자동 요청이고 콘솔 에러는 아니다(참고 R4) |
| 저장(localStorage) | localhost 포트마다 따로 | 오리진 `https://eversunk2-tech.github.io`를 같은 계정의 class1·m1·m12 사이트와 공유한다 | localhost에서 한 진행은 옮겨지지 않는다. 브라우저·기기마다 따로 저장된다. 다른 사이트가 `play1.progress` 키를 쓰지 않는 한 충돌은 없다 |
| 네트워크 | localhost | 실제 인터넷, HTTPS 강제 | 첫 방문 다운로드는 약 2.3MB다(JS gzip 0.46MB, 폰트 1.67MB, 시트 0.15MB). 폰트 대기는 3초 타임아웃(spec 5.9)이라, 느린 망에서는 타이틀이 기본 글꼴로 보일 수 있다 |
| 서버 | Express `/health` | 없음 | spec 15절대로 쓰지 않는다. 클라이언트 코드에 서버 요청(fetch)이 없다 |

## 발견한 문제
### 높음 — 없음
### 중간 — 없음
### 낮음
**L1. CI가 타입 검사를 하지 않는다**
- **위치:** `.github/workflows/deploy.yml` build 잡(Test 단계 앞)
- **내용:**
  - `vite build`(esbuild)와 `vitest`는 타입을 검사하지 않는다. 그래서 `tsc` 에러가 있는 커밋도 main에 푸시되면 공개 사이트에 배포된다.
  - 지금 코드는 typecheck 0이라 당장 문제는 없다.
  - spec 15절 단계 목록에도 typecheck가 없으므로 spec 위반은 아니다.
- **재현:**
  - scratchpad의 깨끗한 체크아웃에서 `src/client/config.ts`에 `export const __typeProbe: number = 'not a number';`를 넣었다.
  - `npm test`와 `npm run build`는 exit 0이었고, `npm run typecheck`만 TS2322로 exit 2였다.
  - 재현 뒤 원복했다.
- **수정 방향:** Test 앞에 `- name: Typecheck` / `run: npm run typecheck` 단계를 추가한다. spec 15절 단계 목록을 바꾸는 일이므로 코디네이터 승인 뒤에 한다.

**L2. 배포 권한이 build 잡에도 주어진다**
- **위치:** `deploy.yml` 11~14행(워크플로 최상위 `permissions`)
- **내용:**
  - `pages: write`와 `id-token: write`가 build 잡에도 적용된다.
  - build 잡은 `npm ci`로 의존성 설치 스크립트를 실행한다. 의존성이 오염되면 그 권한으로 OIDC 토큰을 발급받거나 Pages API를 호출할 수 있다.
  - 공식 예제와 같은 구성이고 spec 15절도 권한 위치를 정하지 않았으므로 위반은 아니다.
- **재현:** 해당 없음(구성 검토).
- **수정 방향(선택):**
  - 최상위에는 `contents: read`만 둔다.
  - deploy 잡: `permissions: { pages: write, id-token: write }`
  - build 잡: `contents: read`, `pages: read`(configure-pages가 Pages 정보를 읽어야 한다)
  - 바꾸면 `workflow_dispatch`로 한 번 돌려 확인한다.

### 참고(문제 아님)
- **R1.** 액션을 메이저 태그(`@v7` 등)로 고정했다. GitHub 공식 액션이고 저장소가 SHA 고정을 강제하지 않으므로 그대로 둬도 된다.
- **R2.** upload-pages-artifact v5는 숨김 파일을 기본으로 뺀다. dist의 숨김 파일은 `assets/.gitkeep`(0B, `public/assets/.gitkeep` 복사본)뿐이라 영향이 없다.
- **R3.** `assets/vendor/*`(시트·manifest)는 해시 없는 고정 이름이다.
  - v0.3에서 시트를 같은 이름으로 바꾸면, 배포 직후 캐시가 만료될 때까지 옛 시트가 잠깐 보일 수 있다.
  - v0.3 계획 때 Vite `?url` import(해시 이름)나 `?v=` 쿼리를 고려한다.
- **R4.** `index.html`에 아이콘 지정이 없어서 브라우저가 `https://eversunk2-tech.github.io/favicon.ico`(404)를 요청한다. 콘솔 에러는 아니다. 원하면 `<link rel="icon" …>`을 추가한다.
- **R5.** Galmuri 폰트의 공개 재배포에 문제가 없다. woff2 안(name ID 0·13·14)에 저작권과 OFL 1.1 고지·URL이 들어 있고, `assets/vendor/LICENSES.md`도 함께 배포된다.
- **R6.** `github-pages` environment가 main만 허용한다. 다른 브랜치에서 수동 실행하면 deploy 잡이 보호 규칙에 막혀 실패한다(정상 동작).
- **R7.** 워크플로 파일을 푸시하려면 `workflow` 권한이 필요하다.
  - git은 `osxkeychain` 자격 증명을 쓴다. gh 토큰에는 `workflow` 범위가 있다.
  - 푸시가 "refusing to allow … without `workflow` scope"로 거부되면 `gh auth setup-git`을 실행한 뒤 다시 푸시한다.

## 배포 후 사용자 체크리스트
커밋·푸시 전
- [ ] 커밋에 `vite.config.ts`와 `.github/workflows/deploy.yml`(그리고 spec 15절·지침·review.md)을 넣는다. v0.3 계획 작업분은 섞이지 않게 한다: `CLAUDE.md`의 그래픽 문구, `agents/plan.md`, 재작성 중인 `spec.md`.
- [ ] main에 푸시하면 곧바로 공개 사이트가 바뀐다. v0.3 작업의 중간 커밋은 작업 브랜치에 두는 것이 안전하다.

배포 확인
1. [ ] GitHub 저장소 → Actions → "Deploy to GitHub Pages" 실행에서 build와 deploy가 모두 초록색인지 본다(Test 단계 163개 통과). 실패하면 로그를 확인하고, 고친 뒤 Actions 탭의 Run workflow(main)로 다시 돌린다.
2. [ ] deploy 잡 요약의 주소가 https://eversunk2-tech.github.io/worldgame/ 인지 본다.
3. [ ] 주소를 소문자 그대로 연다. 끝 슬래시가 없는 https://eversunk2-tech.github.io/worldgame 도 `/worldgame/`로 바뀌어 열리는지 본다.
4. [ ] 이미 연 적이 있으면 강력 새로고침을 한다(Mac Cmd+Shift+R, Windows Ctrl+F5). Pages는 10분 동안 캐시한다.
5. [ ] 개발자 도구(F12)로 네트워크와 콘솔을 확인한다.
   - 다음 파일이 모두 200이어야 한다: `assets/index-….js`, `assets/phaser-….js`, `assets/vendor/…/sheet.png` 4장, `manifest.json`, Galmuri woff2 4개. `/favicon.ico` 404는 무시해도 된다.
   - 콘솔에 빨간 에러가 없어야 한다.
6. [ ] 타이틀 글자가 픽셀 글꼴(Galmuri)인지, 클릭한 뒤 배경음악이 나오는지 본다(N 키로 음소거).
7. [ ] 다음 흐름을 해 본다: 새로 시작 → 세계지도 → 서울 입장 → 한별과 대화해 퀴즈 1개 → 세계지도에서 R로 아바타 룸.
8. [ ] 새로고침한 뒤 "이어하기"로 들어가 포인트와 아바타가 그대로인지 본다.
9. [ ] 가능하면 학교에서 쓸 기기·브라우저(태블릿, Safari 등)와 느린 망(개발자 도구 네트워크 제한 "Slow 4G")에서도 타이틀 글꼴과 로딩을 확인한다.

사용자에게 알릴 점
- 진행은 브라우저의 localStorage에 저장된다.
  - localhost에서 한 진행은 옮겨지지 않는다.
  - 기기나 브라우저를 바꾸거나 사이트 데이터를 지우면 처음부터 시작한다.
  - 시크릿 창에서 한 진행은 창을 닫으면 사라진다.
  - Safari는 7일(사용일 기준) 넘게 방문하지 않은 사이트의 저장을 지울 수 있다.
- 이후 main에 푸시할 때마다 자동으로 다시 배포된다.
