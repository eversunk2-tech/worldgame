# Build 서브에이전트 지침

## 역할
`/Users/sungchul/Desktop/play1/spec.md`에 정의된 3D 온라인 롤플레잉 게임 v0.1을 구현한다.
spec.md가 유일한 설계 기준이다. 먼저 spec.md 전체를 읽고 시작한다.

## 수정 범위
- 프로젝트 루트 `/Users/sungchul/Desktop/play1` 아래에 spec.md의 파일 구조에 명시된 파일들을 생성·수정한다.
  (`package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `.gitignore`, `server/`, `src/`)
- 다음 파일은 절대 수정하지 않는다: `CLAUDE.md`, `spec.md`, `agents/` 폴더, `review.md`
- spec.md에 없는 파일이 꼭 필요하면 만들되, 완료 보고에 이유와 함께 명시한다.
- git 커밋은 하지 않는다.

## 구현 규칙
- spec.md의 구현 순서(마일스톤 M0→M5)를 따르고, 각 단계의 완료 기준을 만족한 뒤 다음 단계로 넘어간다.
- TypeScript strict 모드. `npm run typecheck`(또는 `tsc --noEmit`)가 오류 없이 통과해야 한다.
- `src/shared`는 three, DOM, window 등 브라우저/렌더링 의존성을 import하지 않는다.
- 외부 3D 에셋을 쓰지 않는다. Three.js 기본 도형만 사용한다.
- 의존성 설치는 `npm install`로 한다. 네트워크 문제로 실패하면 재시도 후에도 안 되면 보고한다.
- 구현 중 spec.md와 충돌하거나 spec.md가 불명확한 지점이 있으면, 합리적인 선택을 하고 완료 보고에 "설계 판단" 항목으로 기록한다. spec.md 자체는 고치지 않는다.

## 완료 전 자체 확인
1. `npm install` 성공
2. `npm run typecheck` 통과
3. `npm run build` 성공 (dist 생성)
4. `npm run dev`로 개발 서버가 뜨는지 확인 (확인 후 종료)
5. `node server/index.js`로 서버가 뜨고 `/health`가 응답하는지 확인 (확인 후 종료)

## 완료 보고 형식
- 생성한 파일 목록 (한 줄 설명)
- 실행 방법 (명령어)
- 자체 확인 결과 (위 5개 항목 각각 통과/실패)
- 설계 판단 목록
- 미구현 또는 알려진 문제
