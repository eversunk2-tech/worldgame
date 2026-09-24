# Build 서브에이전트 지침 (v3: v0.2 단계별 구현)

## 역할
`/Users/sungchul/Desktop/play1/spec.md`(v0.2)에 정의된 내용 중, 프롬프트에서 지정한 **Stage(A/B/C) 하나**를 구현한다.
spec.md가 유일한 설계 기준이다. 먼저 spec.md 전체를 읽고, 특히 11절(구현 단계·파일 소유권 표·완료 기준)과 12절(검증 방법)의 해당 Stage 부분을 기준으로 삼는다.

## 수정 범위
- spec.md 11절의 파일 소유권 표에서 **해당 Stage가 소유한 파일만** 생성·수정·삭제한다. 다른 Stage 소유 파일을 고쳐야만 진행이 가능하면, 최소한으로 고치고 완료 보고에 파일명과 이유를 명시한다.
- 허용 경로: `src/`, `public/`, `scripts/`, `tools/`, `package.json`, `package-lock.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `.gitignore`
- 절대 수정하지 않는 파일: `CLAUDE.md`, `spec.md`, `agents/`, `review.md`
- git 커밋은 하지 않는다.

## 다운로드 규칙 (중요)
- 외부 파일 다운로드는 spec.md 3절의 다운로드 목록에 있는 것만 허용된다: Kenney zip 4개(spec에 적힌 kenney.nl URL 그대로)와 npm 패키지(galmuri, world-atlas, topojson-client 및 spec에 적힌 타입 패키지).
- 다운로드는 `scripts/fetch-assets.mjs`를 통해서만 하고, 스크립트의 ALLOWLIST 외 URL은 코드에서 거부해야 한다.
- 목록 외 파일(다른 에셋 팩, 미러, 폰트, 음원, 이미지)은 어떤 이유로도 받지 않는다. URL이 실패하면 대체 주소를 찾지 말고 완료 보고에 실패로 기록한다.
- 받은 zip에서 spec이 지정한 시트 PNG와 라이선스 파일만 추출해 `public/assets/vendor/<pack>/`에 둔다. zip 원본은 scratchpad에 두고 프로젝트에 넣지 않는다.

## 구현 규칙
- spec 11절의 해당 Stage 작업 순서를 따르고, 소단계마다 `npm run typecheck`를 통과시켜 둔다(작업이 중단되어도 이어갈 수 있게).
- TypeScript strict. `src/shared`는 phaser, DOM, window, localStorage, Math.random 등 브라우저·비결정 의존성을 import하지 않는다.
- 학습 콘텐츠(카드·문항·미니게임 데이터)는 spec 부록의 내용을 그대로 쓴다. 사실 관계가 의심되면 수정하지 말고 완료 보고에 표시한다.
- vitest 테스트는 spec이 지정한 항목을 작성하고 `npm test`로 통과시킨다. 기존 테스트가 깨지면 설계 변경에 맞게 갱신한다.
- 타일 인덱스는 spec 3절의 타일 인덱스 도구로 시트를 직접 확인해 매핑한다. 추측으로 인덱스를 적지 않는다.
- 서버 기본 포트는 3100이다(3000은 다른 프로세스가 점유).
- 이 세션의 브라우저 패널은 숨김 상태일 수 있어 requestAnimationFrame이 멈출 수 있다. 그 경우 `window.__play1`로 `game.step()`을 setInterval로 구동하고 키 입력은 합성 KeyboardEvent로 보낸다. 브라우저 작업은 짧게 나눠 진행하고, 띄운 서버는 확인 후 반드시 종료한다.
- spec과 충돌하거나 불명확한 지점은 합리적으로 판단하고 완료 보고의 "설계 판단"에 기록한다. spec 자체는 고치지 않는다.

## 완료 전 자체 확인
1. `npm install` 성공
2. `npm run typecheck` 통과
3. `npm test` 통과
4. `npm run build` 성공
5. spec 12절의 해당 Stage 브라우저 체크리스트를 실제로 확인(콘솔 에러 없음)
6. `node server/index.js`(3100)로 `/health`와 빌드 결과 확인 후 종료
7. shared 순수성 grep 통과, `public/assets/vendor` 아래에 승인 목록 외 파일이 없음

## 완료 보고 형식
- Stage 이름
- 생성·수정·삭제한 파일 목록 (한 줄 설명). 다른 Stage 소유 파일을 건드렸으면 따로 표시
- 다운로드한 파일 목록 (URL, 크기, 저장 위치)
- 자체 확인 결과 (위 7개 항목 각각 통과/실패)
- 설계 판단 목록
- 미구현 또는 알려진 문제
