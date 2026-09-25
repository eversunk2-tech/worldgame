// 카이로 quiz pool (spec appendix A.3): 6 multiple-choice + 5 OX.
import type { QuizItem } from '../../types';

export const CAIRO_QUIZ: readonly QuizItem[] = [
  { id: 'cairo_c01', cityId: 'cairo', topic: 'geo', kind: 'choice', question: '카이로가 속한 대륙은?',
    choices: ['아프리카', '아시아', '유럽', '남아메리카'], answer: 0, explanation: '카이로는 아프리카 대륙 북동쪽 이집트에 있어요' },
  { id: 'cairo_c02', cityId: 'cairo', topic: 'geo', kind: 'choice', question: '카이로 옆을 흐르는, 세계에서 가장 긴 강은?',
    choices: ['나일강', '아마존강', '한강', '센강'], answer: 0, explanation: '나일강은 약 6,650km로 남쪽에서 북쪽으로 흘러 지중해로 가요' },
  { id: 'cairo_c03', cityId: 'cairo', topic: 'climate', kind: 'choice', question: '카이로처럼 비가 거의 오지 않고 낮에 매우 더운 기후는?',
    choices: ['사막 기후', '온대 기후', '열대 우림 기후', '한대 기후'], answer: 0, explanation: '카이로에는 1년에 비가 약 25mm밖에 오지 않아요' },
  { id: 'cairo_c04', cityId: 'cairo', topic: 'climate', kind: 'choice', question: '이집트 땅의 대부분을 차지하는 것은?',
    choices: ['사막', '숲', '초원', '빙하'], answer: 0, explanation: '이집트는 대부분 사하라 사막이라 사람들은 나일강 가에 모여 살아요' },
  { id: 'cairo_c05', cityId: 'cairo', topic: 'culture', kind: 'choice', question: '기자에 있는 고대 이집트 왕의 무덤은?',
    choices: ['피라미드', '에펠탑', '경복궁', '자유의 여신상'], answer: 0, explanation: '대피라미드는 약 4,500년 전에 지어졌고 지금 높이는 약 138m예요(처음에는 약 147m였어요)' },
  { id: 'cairo_c06', cityId: 'cairo', topic: 'culture', kind: 'choice', question: '이집트에서 주로 쓰는 말은?',
    choices: ['아랍어', '영어', '프랑스어', '한국어'], answer: 0, explanation: '이집트 사람들은 아랍어를 쓰고 화폐는 이집트 파운드예요' },

  { id: 'cairo_o01', cityId: 'cairo', topic: 'culture', kind: 'ox', question: '카이로는 이집트의 수도이다.',
    answer: true, explanation: '카이로는 이집트의 수도이자 아프리카에서 가장 큰 도시 중 하나예요' },
  { id: 'cairo_o02', cityId: 'cairo', topic: 'climate', kind: 'ox', question: '카이로에는 여름마다 장마가 있어 비가 많이 온다.',
    answer: false, explanation: '카이로는 사막 기후라 1년 내내 비가 거의 오지 않아요' },
  { id: 'cairo_o03', cityId: 'cairo', topic: 'geo', kind: 'ox', question: '나일강은 남쪽에서 북쪽으로 흐른다.',
    answer: true, explanation: '나일강은 적도 가까운 빅토리아호 쪽에서 시작해 북쪽 지중해로 흘러요' },
  { id: 'cairo_o04', cityId: 'cairo', topic: 'culture', kind: 'ox', question: '고대 이집트 사람들은 그림 같은 상형 문자를 썼다.',
    answer: true, explanation: '신전과 피라미드 벽에 상형 문자가 새겨져 있어요' },
  { id: 'cairo_o05', cityId: 'cairo', topic: 'climate', kind: 'ox', question: '사막은 밤에도 낮처럼 덥다.',
    answer: false, explanation: '사막은 낮과 밤의 기온 차가 커서 밤에는 서늘해요' },
];
