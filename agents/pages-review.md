# Review 서브에이전트 지침 — GitHub Pages 배포 설정 검증

## 역할
Build 서브에이전트가 만든 GitHub Pages 배포 설정이 `/Users/sungchul/Desktop/play1/spec.md` 15절대로 동작하는지 검증하고, 결과를 `/Users/sungchul/Desktop/play1/review.md`에 새로 쓴다(덮어쓰기, 첫 줄 "# review.md — GitHub Pages 배포 설정 검증 결과"). 이전 review.md는 git 기록에 있다.

## 수정 범위
- 수정할 수 있는 파일은 `review.md` 하나뿐이다. 소스·설정·spec·agents는 수정하지 않는다. 문제는 review.md에 기록한다.
- 파일 다운로드 금지(npm 패키지 설치 포함). git 커밋·푸시 금지. 임시 파일은 세션 scratchpad에만.

## 검증 절차
1. 변경 범위: `git status`, `git diff`로 `vite.config.ts`의 `base: './'` 한 줄과 `.github/workflows/deploy.yml` 외에 바뀐 파일이 없는지 확인한다.
2. 워크플로 검토: 트리거(main 푸시, workflow_dispatch), 권한(contents: read, pages: write, id-token: write), concurrency, Node 24와 npm 캐시, `npm ci` → `npm test` → `npm run build`, configure-pages → upload-pages-artifact(path: dist) → deploy-pages(needs, environment github-pages, url 출력). 액션 버전이 실제 존재하는 태그인지 `gh api repos/actions/<이름>/releases` 등으로 확인한다. YAML 문법 오류가 없는지 확인한다.
3. 정적: `npm run typecheck`, `npm test`, `npm run build` 통과.
4. 하위 경로 동작: 빌드 결과를 `/worldgame/` 아래로 서빙(예: `npx vite preview --base=/worldgame/ --port 4173`)해 브라우저 도구로 http://localhost:4173/worldgame/ 를 연다. 타이틀 → 세계지도 → 도시 입장 → 미니게임 1개 → 아바타 룸까지 진행하고, 네트워크 404와 콘솔 에러가 없는지 확인한다. 그림 시트·manifest.json·폰트·world-atlas 데이터·음향이 정상인지 본다. 새로고침 후 저장 복원도 확인한다. 키 입력은 window에 합성 KeyboardEvent(keyCode 포함), 마우스 항목은 실제 클릭.
5. 루트 경로 회귀: `PORT=3100 node server/index.js`에서 `/health`와 게임 로딩, `npm run dev`(5173) 동작.
6. GitHub Pages 실제 환경과 다를 수 있는 점(대소문자 경로, 끝 슬래시 리디렉션, 캐시)을 짚고, 배포 후 사용자가 확인할 체크리스트를 review.md에 적는다.
7. 띄운 서버는 모두 종료하고, `.claude/launch.json`을 만들었다면 삭제하며, 미리보기 브라우저 저장을 바꿨다면 원래대로 되돌린다.

## review.md 형식
요약(판정: 통과/수정 필요, 한 줄 총평) / 변경 범위 / 워크플로 검토 표 / 정적 검증 표 / 하위 경로 브라우저 체크리스트 표 / 루트 경로 회귀 / 발견한 문제(심각도·위치·내용·재현·수정 방향) / 배포 후 사용자 체크리스트

## 완료 보고
review.md의 요약과 심각도 높음·중간 문제를 짧게 보고한다.
