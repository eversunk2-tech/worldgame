# Build 서브에이전트 지침 — GitHub Pages 배포 설정

## 역할
`/Users/sungchul/Desktop/play1/spec.md` 15절(배포 — GitHub Pages)을 구현한다. spec 15절이 유일한 기준이다.

## 수정 범위
- 수정: `vite.config.ts`(`base: './'` 한 줄 추가)
- 생성: `.github/workflows/deploy.yml`
- 그 밖의 파일은 수정하지 않는다. 특히 `CLAUDE.md`, `spec.md`, `agents/`, `review.md`, `src/`, `server/`, `package.json`, `package-lock.json`은 건드리지 않는다. 코드 수정이 꼭 필요하다고 판단되면 고치지 말고 완료 보고에 이유와 함께 적는다.
- git 커밋·푸시 금지. 파일 다운로드 금지(npm 패키지 추가 설치 포함).

## 작업
1. `vite.config.ts`의 `defineConfig({ ... })` 맨 위에 `base: './',`를 넣는다. 나머지 설정은 그대로 둔다.
2. `.github/workflows/deploy.yml`을 spec 15절대로 만든다.
   - 공식 액션의 최신 메이저 버전을 `gh api repos/actions/<이름>/releases/latest --jq .tag_name`으로 확인해 `@vN` 형식으로 쓴다(checkout, setup-node, configure-pages, upload-pages-artifact, deploy-pages). 조회가 안 되면 checkout@v4, setup-node@v4, configure-pages@v5, upload-pages-artifact@v3, deploy-pages@v4를 쓰고 보고에 적는다.
   - setup-node는 `node-version: 24`, `cache: npm`.
   - 단계: `npm ci` → `npm test` → `npm run build` → configure-pages → upload-pages-artifact(`path: dist`) → deploy 잡(`needs: build`, `environment: github-pages`, `url: ${{ steps.deployment.outputs.page_url }}`).
   - 트리거: `push`(branches: main), `workflow_dispatch`. 권한과 concurrency는 spec 15절대로.
3. YAML 문법을 확인한다(예: `node -e`로 파싱하거나 `python3 -c 'import yaml'`이 있으면 사용. 새 패키지 설치는 금지).

## 검증
1. `npm run typecheck`, `npm test`, `npm run build` 통과.
2. 하위 경로 검증: `npx vite preview --base=/worldgame/ --port 4173`처럼 빌드 결과를 `/worldgame/` 아래로 서빙하고, 브라우저 도구(`mcp__Claude_Browser__*`)로 http://localhost:4173/worldgame/ 를 연다. 타이틀 화면, 세계지도, 도시 1곳 입장까지 확인하고 `read_network_requests`에서 404가 없는지(그림 시트·manifest.json·폰트·JS), `read_console_messages`에 에러가 없는지 본다. 키 입력은 window에 합성 KeyboardEvent(keyCode 포함)로 보내고, rAF가 멈추면 DEV가 아니므로 화면 확인 위주로 한다.
3. 루트 경로 검증: `PORT=3100 node server/index.js`로 띄워 http://localhost:3100/ 에서 타이틀까지 뜨고 404가 없는지 확인한다.
4. `npm run dev`로 개발 서버(5173)가 여전히 동작하는지 확인한다.
5. 띄운 서버는 모두 종료한다. `preview_start`용 `.claude/launch.json`을 만들었다면 삭제하고, 미리보기 브라우저의 저장을 바꿨다면 원래대로 되돌린다.

## 완료 보고
- 변경·생성한 파일과 내용 요약(워크플로의 액션 버전 포함)
- 검증 1~5 결과(통과/실패, 404·에러 목록)
- 알려진 문제나 사용자가 해야 할 일
