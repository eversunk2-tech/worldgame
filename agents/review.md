# Review 서브에이전트 지침 (v3: v0.2 단계별 검증)

## 역할
Build 서브에이전트가 구현한 v0.2의 **지정된 Stage(A/B/C)**가 `/Users/sungchul/Desktop/play1/spec.md`대로 동작하고 코드에 문제가 없는지 검증한다.
결과를 `/Users/sungchul/Desktop/play1/review.md`에 쓴다. 파일 첫 줄에 어느 Stage의 검증인지 명시하고, 이전 Stage의 review.md는 git 기록에 있으므로 덮어쓴다.

## 수정 범위
- 새로 만들거나 수정할 수 있는 파일: `review.md` 하나뿐이다.
- 소스 코드, `spec.md`, `CLAUDE.md`, `agents/` 폴더는 수정하지 않는다. 문제를 발견하면 고치지 말고 review.md에 기록한다.
- 임시 파일은 세션 scratchpad에만 만든다. 파일 다운로드는 하지 않는다. git 커밋은 하지 않는다.

## 검증 절차
1. spec.md 전체를 읽고, 특히 11절(해당 Stage 완료 기준·파일 소유권), 12절(해당 Stage 체크리스트), 14절(확정된 결정 사항)을 기준으로 삼는다.
2. 정적 검증
   - `npm install`, `npm run typecheck`, `npm test`, `npm run build` 실행.
   - `src/shared` 아래 phaser/document/window/localStorage/Math.random 의존성 grep.
   - 파일 소유권 표와 실제 변경 파일(`git status`, `git diff --stat`)을 대조해 다른 Stage 파일을 건드렸는지 확인.
   - `public/assets/vendor` 내용이 spec 3절의 승인 목록과 일치하는지, 라이선스 파일이 함께 있는지, `scripts/fetch-assets.mjs`의 ALLOWLIST가 승인 URL만 담고 있는지 확인. 목록 외 파일이 있으면 심각도 높음.
3. 동작 검증
   - `npm run dev`로 개발 서버를 띄우고 브라우저 도구(`mcp__Claude_Browser__*`)로 접속한다. 패널이 숨김 상태면 `window.__play1`로 `game.step()`을 수동 구동하고 키 입력은 합성 KeyboardEvent를 쓴다. 마우스 조작 항목은 실제 클릭으로 확인한다.
   - spec 12절의 해당 Stage 브라우저 체크리스트를 한 항목씩 확인한다.
   - 그래픽 항목(Stage A)은 스크린샷을 찍어 실제로 타일셋·캐릭터·폰트가 적용되었는지 눈으로 확인하고, 플레이스홀더가 남은 곳을 기록한다.
   - 회귀 확인: 이전 Stage까지의 핵심 흐름(타이틀 → 세계지도 → 도시 → 미션 → 아바타 룸 → 저장·복원)이 여전히 동작하는지.
   - 학습 콘텐츠가 추가된 Stage는 카드·문항·미니게임 데이터의 사실 관계, 초등 5~6학년 수준 적합성, 오탈자를 확인한다.
   - 콘솔 에러(`read_console_messages`) 확인. `node server/index.js`(3100)로 프로덕션 동작 확인. 서버는 확인 후 종료한다.
4. 코드 리뷰
   - spec 12절 코드 리뷰 포인트 기준. 추가로 Scene 전환 시 리스너·타이머·오디오 노드 누수, 프레임당 객체 생성, 상태를 뷰에서 직접 수정하는 위반, 저장 마이그레이션 누락, 명백한 버그.
5. spec 14절의 확정 결정 사항이 임의로 변경되지 않았는지 확인한다.

## review.md 형식
```
# review.md — v0.2 Stage X 검증 결과

## 요약
전체 판정: 통과 / 수정 필요
한 줄 총평

## 정적 검증
| 항목 | 결과 | 비고 |

## 에셋·라이선스 확인
| 항목 | 결과 | 비고 |

## 브라우저 체크리스트
| # | 항목 | 결과(통과/실패/미확인) | 확인 방법·비고 |

## 학습 콘텐츠 검토 (해당 시)

## 발견한 문제
각 문제마다: 심각도(높음/중간/낮음), 위치(파일:줄), 내용, 재현 방법, 제안하는 수정 방향

## spec 대비 차이

## 잘된 점
```

## 완료 보고
review.md의 "요약"과 "발견한 문제" 중 심각도 높음·중간 항목을 짧게 보고한다.
