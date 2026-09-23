# Build 서브에이전트 지침 (v2: 2D 학습형 RPG)

## 역할
`/Users/sungchul/Desktop/play1/spec.md`에 정의된 2D 학습형 온라인 롤플레잉 게임 v0.1을 구현한다.
spec.md가 유일한 설계 기준이다. 먼저 spec.md 전체를 읽고 시작한다.
이 프로젝트에는 이전 3D 버전(Three.js) 코드가 남아 있다. spec.md 3절 "기존 코드 처리 계획"에 따라 재사용·수정·삭제한다.

## 수정 범위
- 프로젝트 루트 `/Users/sungchul/Desktop/play1` 아래에 spec.md의 파일 구조에 명시된 파일들을 생성·수정·삭제한다.
  (`package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `.gitignore`, `server/`, `src/`, 테스트 파일)
- spec.md에서 삭제 대상으로 지정한 기존 파일은 삭제한다. 삭제 대상이 아닌데 spec에 없는 기존 파일이 있으면 삭제하지 말고 완료 보고에 명시한다.
- 다음 파일은 절대 수정하지 않는다: `CLAUDE.md`, `spec.md`, `agents/` 폴더, `review.md`
- spec.md에 없는 파일이 꼭 필요하면 만들되, 완료 보고에 이유와 함께 명시한다.
- 외부 에셋(이미지, 폰트 등)을 다운로드하지 않는다. v0.1은 코드로 생성한 픽셀 아트로 완성한다.
- git 커밋은 하지 않는다.

## 구현 규칙
- spec.md의 구현 순서(마일스톤)를 따르고, 각 단계의 완료 기준을 만족한 뒤 다음 단계로 넘어간다.
- TypeScript strict 모드. `npm run typecheck`가 오류 없이 통과해야 한다.
- `src/shared`는 phaser, DOM, window, localStorage 등 브라우저/렌더링 의존성을 import하지 않는다.
- 학습 콘텐츠(학습 카드, 퀴즈 문항)는 spec.md의 문항을 그대로 쓰되, 사실 관계가 의심되는 문항은 수정하지 말고 완료 보고에 표시한다.
- vitest 단위 테스트를 spec에서 지정한 shared 로직에 작성하고 `npm test`로 통과시킨다.
- 의존성 설치는 `npm install`로 한다. 네트워크 문제로 실패하면 재시도 후에도 안 되면 보고한다.
- 구현 중 spec.md와 충돌하거나 불명확한 지점이 있으면 합리적인 선택을 하고 완료 보고에 "설계 판단"으로 기록한다. spec.md 자체는 고치지 않는다.
- 이 머신의 3000 포트는 다른 프로세스가 사용 중이다. 서버 기본 포트는 3100이다.

## 완료 전 자체 확인
1. `npm install` 성공
2. `npm run typecheck` 통과
3. `npm test` 통과
4. `npm run build` 성공 (dist 생성)
5. `npm run dev`로 개발 서버를 띄우고 브라우저 도구(`mcp__Claude_Browser__*`)로 타이틀 → 세계지도 → 도시 맵 → 미니게임 → 아바타 룸 흐름이 실제로 동작하는지, 콘솔 에러가 없는지 확인 (확인 후 종료)
6. `node server/index.js`로 서버가 뜨고 `/health`와 빌드된 게임이 응답하는지 확인 (확인 후 종료)
7. 삭제 대상 3D 파일이 남아 있지 않은지 확인 (`grep -r "three" src package.json`)

## 완료 보고 형식
- 생성·수정·삭제한 파일 목록 (한 줄 설명)
- 실행 방법 (명령어)
- 자체 확인 결과 (위 7개 항목 각각 통과/실패)
- 설계 판단 목록
- 미구현 또는 알려진 문제
