// Seoul quiz pool (spec 6.4): 6 multiple-choice + 5 OX.
import type { QuizItem } from '../../types';

export const SEOUL_QUIZ: readonly QuizItem[] = [
  { id: 'seoul_c01', cityId: 'seoul', topic: 'geo', kind: 'choice', question: '서울이 속한 대륙은?',
    choices: ['아시아', '유럽', '아프리카', '북아메리카'], answer: 0, explanation: '서울은 아시아 대륙 동쪽 한반도에 있어요' },
  { id: 'seoul_c02', cityId: 'seoul', topic: 'geo', kind: 'choice', question: '서울 한가운데를 흐르는 강은?',
    choices: ['한강', '낙동강', '금강', '영산강'], answer: 0, explanation: '한강은 서울을 동서로 가로질러 흘러요' },
  { id: 'seoul_c03', cityId: 'seoul', topic: 'climate', kind: 'choice', question: '서울처럼 사계절이 뚜렷한 기후를 무엇이라 할까요?',
    choices: ['열대 기후', '건조 기후', '온대 기후', '한대 기후'], answer: 2, explanation: '중위도의 우리나라는 온대 기후예요' },
  { id: 'seoul_c04', cityId: 'seoul', topic: 'climate', kind: 'choice', question: '서울 겨울에 차갑고 건조한 바람이 불어오는 방향은?',
    choices: ['북서쪽', '남동쪽', '남서쪽', '북동쪽'], answer: 0, explanation: '겨울에는 북서 계절풍, 여름에는 남동 계절풍이 불어요' },
  { id: 'seoul_c05', cityId: 'seoul', topic: 'culture', kind: 'choice', question: '조선 시대 왕이 살던 서울의 궁궐은?',
    choices: ['경복궁', '불국사', '첨성대', '석굴암'], answer: 0, explanation: '경복궁은 조선의 첫 번째 궁궐이에요' },
  { id: 'seoul_c06', cityId: 'seoul', topic: 'culture', kind: 'choice', question: '세종대왕이 만든 우리나라 글자는?',
    choices: ['한글', '한자', '가나', '알파벳'], answer: 0, explanation: '한글은 1443년 세종대왕이 만들었어요' },

  { id: 'seoul_o01', cityId: 'seoul', topic: 'culture', kind: 'ox', question: '서울은 대한민국의 수도이다.',
    answer: true, explanation: '서울은 대한민국의 수도이자 가장 큰 도시예요' },
  { id: 'seoul_o02', cityId: 'seoul', topic: 'climate', kind: 'ox', question: '서울은 여름에 장마로 비가 많이 온다.',
    answer: true, explanation: '여름철(6~8월)에 1년 비의 절반 이상이 내려요' },
  { id: 'seoul_o03', cityId: 'seoul', topic: 'climate', kind: 'ox', question: '서울은 1년 내내 덥고 눈이 오지 않는다.',
    answer: false, explanation: '서울 겨울은 춥고 눈이 와요' },
  { id: 'seoul_o04', cityId: 'seoul', topic: 'geo', kind: 'ox', question: '우리나라 지형은 동쪽이 높고 서쪽이 낮다.',
    answer: true, explanation: '동고서저라고 해요. 큰 강은 서쪽·남쪽으로 흘러요' },
  { id: 'seoul_o05', cityId: 'seoul', topic: 'geo', kind: 'ox', question: '서울은 바다에 바로 붙어 있는 항구 도시이다.',
    answer: false, explanation: '서울은 내륙 도시이고, 가까운 항구 도시는 인천이에요' },
];
