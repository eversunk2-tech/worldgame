// 뉴욕 quiz pool (spec appendix A.4): 6 multiple-choice + 5 OX.
import type { QuizItem } from '../../types';

export const NEWYORK_QUIZ: readonly QuizItem[] = [
  { id: 'newyork_c01', cityId: 'newyork', topic: 'geo', kind: 'choice', question: '뉴욕이 속한 대륙은?',
    choices: ['북아메리카', '남아메리카', '유럽', '아시아'], answer: 0, explanation: '뉴욕은 북아메리카 대륙 동쪽, 미국의 동해안에 있어요' },
  { id: 'newyork_c02', cityId: 'newyork', topic: 'geo', kind: 'choice', question: '뉴욕 도심이 있는 섬의 이름은?',
    choices: ['맨해튼', '시테섬', '제주도', '시칠리아'], answer: 0, explanation: '맨해튼은 허드슨강과 이스트강 사이에 있는 섬이에요' },
  { id: 'newyork_c03', cityId: 'newyork', topic: 'climate', kind: 'choice', question: '뉴욕의 기후를 서울과 비교하면?',
    choices: ['서울처럼 사계절이 뚜렷하다', '1년 내내 덥다', '1년 내내 춥다', '비가 전혀 오지 않는다'], answer: 0, explanation: '뉴욕은 서울과 위도가 비슷해 여름은 덥고 겨울에는 눈이 와요' },
  { id: 'newyork_c04', cityId: 'newyork', topic: 'climate', kind: 'choice', question: '서울이 낮 12시일 때 뉴욕(겨울)은 몇 시일까요?',
    choices: ['전날 밤 10시', '같은 날 낮 12시', '다음 날 아침 8시', '전날 새벽 4시'], answer: 0, explanation: '뉴욕은 서울보다 14시간(여름에는 13시간) 느려요' },
  { id: 'newyork_c05', cityId: 'newyork', topic: 'culture', kind: 'choice', question: '프랑스가 미국에 선물한 뉴욕의 동상은?',
    choices: ['자유의 여신상', '예수상', '스핑크스', '모아이'], answer: 0, explanation: '1886년에 세워졌고 원래 구리색이었지만 녹이 슬어 초록색이 되었어요' },
  { id: 'newyork_c06', cityId: 'newyork', topic: 'culture', kind: 'choice', question: '미국의 수도는?',
    choices: ['워싱턴 D.C.', '뉴욕', '로스앤젤레스', '시카고'], answer: 0, explanation: '뉴욕은 미국에서 가장 큰 도시지만 수도는 워싱턴 D.C.예요' },

  { id: 'newyork_o01', cityId: 'newyork', topic: 'geo', kind: 'ox', question: '뉴욕은 대서양 가에 있는 항구 도시이다.',
    answer: true, explanation: '허드슨강이 대서양으로 흘러드는 곳에 있어 큰 항구가 발달했어요' },
  { id: 'newyork_o02', cityId: 'newyork', topic: 'geo', kind: 'ox', question: '뉴욕의 도로는 바둑판처럼 반듯한 격자 모양이다.',
    answer: true, explanation: '남북으로 뻗은 애비뉴와 동서로 뻗은 스트리트가 격자를 이뤄요' },
  { id: 'newyork_o03', cityId: 'newyork', topic: 'climate', kind: 'ox', question: '뉴욕에는 겨울에 눈이 오지 않는다.',
    answer: false, explanation: '뉴욕 겨울은 춥고 눈보라가 치기도 해요' },
  { id: 'newyork_o04', cityId: 'newyork', topic: 'culture', kind: 'ox', question: '뉴욕에는 여러 나라에서 온 이민자가 모여 산다.',
    answer: true, explanation: '차이나타운·리틀 이탈리아·코리아타운처럼 다양한 문화가 어울려요' },
  { id: 'newyork_o05', cityId: 'newyork', topic: 'culture', kind: 'ox', question: '미국에서는 유로를 화폐로 쓴다.',
    answer: false, explanation: '미국의 화폐는 달러예요' },
];
