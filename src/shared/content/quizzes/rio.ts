// 리우데자네이루 quiz pool (spec appendix A.6): 6 multiple-choice + 5 OX.
import type { QuizItem } from '../../types';

export const RIO_QUIZ: readonly QuizItem[] = [
  { id: 'rio_c01', cityId: 'rio', topic: 'geo', kind: 'choice', question: '리우데자네이루가 속한 대륙은?',
    choices: ['남아메리카', '북아메리카', '아프리카', '유럽'], answer: 0, explanation: '리우는 남아메리카 대륙 동쪽, 브라질의 바닷가에 있어요' },
  { id: 'rio_c02', cityId: 'rio', topic: 'geo', kind: 'choice', question: '리우의 코르코바두산 꼭대기에 있는 커다란 동상은?',
    choices: ['예수상', '자유의 여신상', '스핑크스', '모아이'], answer: 0, explanation: '1931년에 세워진 예수상은 높이 약 30m(받침대 포함 38m)예요' },
  { id: 'rio_c03', cityId: 'rio', topic: 'climate', kind: 'choice', question: '리우의 기후는?',
    choices: ['1년 내내 덥고 습한 열대 기후', '사계절이 뚜렷한 온대 기후', '비가 거의 없는 사막 기후', '1년 내내 추운 한대 기후'], answer: 0, explanation: '리우는 남반구의 열대 지역(남회귀선 근처)에 있는 바닷가 도시라 1년 내내 따뜻해요' },
  { id: 'rio_c04', cityId: 'rio', topic: 'climate', kind: 'choice', question: '서울이 낮 12시일 때 리우는 몇 시일까요?',
    choices: ['밤 12시(자정)', '낮 12시', '아침 6시', '저녁 6시'], answer: 0, explanation: '리우는 서울보다 12시간 느려서 낮과 밤이 정반대예요' },
  { id: 'rio_c05', cityId: 'rio', topic: 'culture', kind: 'choice', question: '브라질 사람들이 주로 쓰는 말은?',
    choices: ['포르투갈어', '에스파냐어', '영어', '프랑스어'], answer: 0, explanation: '브라질은 오래전 포르투갈의 식민지였어요. 남아메리카의 다른 나라는 대부분 에스파냐어를 써요' },
  { id: 'rio_c06', cityId: 'rio', topic: 'culture', kind: 'choice', question: '매년 2~3월 리우에서 열리는, 삼바 춤을 추는 큰 축제는?',
    choices: ['카니발', '올림픽', '추석', '할로윈'], answer: 0, explanation: '리우 카니발은 세계에서 가장 큰 축제 중 하나예요' },

  { id: 'rio_o01', cityId: 'rio', topic: 'geo', kind: 'ox', question: '리우데자네이루는 브라질의 수도이다.',
    answer: false, explanation: '1960년까지는 수도였지만 지금 수도는 브라질리아예요' },
  { id: 'rio_o02', cityId: 'rio', topic: 'geo', kind: 'ox', question: '리우에는 산과 바다가 가까이 붙어 있다.',
    answer: true, explanation: '팡지아수카르(슈거로프산)와 코파카바나 해변이 이웃해 있어요' },
  { id: 'rio_o03', cityId: 'rio', topic: 'climate', kind: 'ox', question: '리우에서는 겨울에 눈이 자주 온다.',
    answer: false, explanation: '리우의 겨울은 낮 25°C 안팎으로 눈이 오지 않아요' },
  { id: 'rio_o04', cityId: 'rio', topic: 'culture', kind: 'ox', question: '브라질은 축구를 아주 좋아하는 나라이다.',
    answer: true, explanation: '브라질은 월드컵에서 5번 우승했어요' },
  { id: 'rio_o05', cityId: 'rio', topic: 'geo', kind: 'ox', question: '세계에서 가장 넓은 열대 우림인 아마존은 브라질에 있다.',
    answer: true, explanation: "아마존은 '지구의 허파'라고 불려요" },
];
