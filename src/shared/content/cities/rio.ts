// 리우데자네이루(브라질, 남아메리카) city content (spec appendix A.6). Map rows are 30 × 40 chars, legend in content/tiles.ts (27 kinds).
// 북쪽 바위 언덕에 예수상, 북서쪽 마라카낭 경기장, 북동쪽 언덕 위 알록달록 집(흙길), 서쪽 열대 숲, 가운데 라군, 남쪽 코파카바나 해변과 대서양, 동쪽 팡지아수카르.
import type { CityDef } from '../../types';
import { BLANK_COUNT, BLANK_PASS, ORDER_COUNT, ORDER_PASS, ORDER_TRIES, QUIZ_COUNT, QUIZ_PASS } from '../../constants';

export const RIO: CityDef = {
  id: 'rio',
  name: '리우데자네이루',
  continent: 'south_america',
  theme: { ground: 'grass', road: 'asphalt', building: 'colorful', tree: 'tropical', streetTree: 'palm', water: 'sea', wall: 'hedge', bgm: 'rio' },
  landmarks: [
    { id: 'lm_rio_maracana', kind: 'maracana', at: { tx: 3, ty: 2 }, w: 4, h: 3 },
    // 바위 언덕(코르코바두) 꼭대기, 도달 불가 (A.6)
    { id: 'lm_rio_christ', kind: 'christ', at: { tx: 19, ty: 3 }, w: 2, h: 2, overhang: 3 },
    // 바다로 튀어나온 바위산, 도달 불가 (A.6)
    { id: 'lm_rio_sugarloaf', kind: 'sugarloaf', at: { tx: 33, ty: 17 }, w: 3, h: 3, overhang: 2 },
  ],
  rows: [
    'RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR',
    'RT.........TRRRRRRRRRRRRRTdddddddddddddR',
    'RT.PPPP....TRRRRRRRRRRRRRTd##d##d##d##dR',
    'RT.PPPP....TRRRRRRRPPRRRRTd##d##d##d##dR',
    'RT.PPPP....TRRRRRRRPPRRRRTdddddddddddddR',
    'RT.........TRRRRRRRRRRRRRTd##d##d##d##dR',
    'RT.........TRRRRRRRRRRRRRTd##d##d##d##dR',
    'RT.........TTRRRRRRRRRRRTTdddddddddddddR',
    'R......................................R',
    'E=====================================.R',
    'RT.T.T....T.==........~~~~~~.........~~~',
    'RT........T.==.......~~~~~~~~........~~~',
    'RT.......T..==.......~~~~~~~~..b.....~~~',
    'RT........T.==........~~~~~~.........~~~',
    'RTT.T.T.T.T.==.......................~~~',
    'RT.,,,......==.......................~~~', // rows 15-17: dark grass marking the monkey zone (4,16) (review Stage C L12)
    'RT,,,,,.....==.................RRRRRR~~~',
    'RT.,,,......==.................RRPPPR~~~',
    'R==============================RRPPPR~~~',
    'RT..........==.................RRPPPR~~~',
    'RT..........==.................RRRRRR~~~',
    'RT..b.......==.....b...............RR~~~',
    'RTSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS~~~',
    'RTSSSSSSSsSSSSSSSSSSSSSSSSSSSsSSSSSSS~~~',
    'RTSSSSSSsssSSSSSSSSSSSSSSSSSsssSSSSSS~~~',
    'RTSSSSSSSsSSSSSSSSSSSSSSSSSSSsSSSSSSS~~~',
    'RTSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS~~~',
    'R~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
    '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
    '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
  ],
  entrance: { tx: 0, ty: 9 },
  spawn: { tx: 2, ty: 9 },
  spawnFacing: 'right',
  cards: [
    {
      id: 'card_rio_geo', cityId: 'rio', topic: 'geo', title: '리우의 지형',
      lines: [
        '남아메리카 대륙 동쪽, 브라질의 대서양 바닷가에 있는 도시이다(인구 약 620만 명).',
        '팡지아수카르(슈거로프산)·코르코바두산 같은 바위산이 바다 바로 옆에 솟아 있다.',
        '코파카바나·이파네마 같은 길고 아름다운 모래 해변이 있다.',
        '브라질은 남아메리카에서 가장 큰 나라이고, 북쪽에는 세계에서 가장 넓은 열대 우림인 아마존이 있다.',
        '서울에서 약 18,000km로 지구 거의 반대편이라 비행기로 하루가 넘게 걸린다.',
      ],
    },
    {
      id: 'card_rio_climate', cityId: 'rio', topic: 'climate', title: '리우의 기후',
      lines: [
        '1년 내내 덥고 습한 열대 기후이다.',
        '남반구라 12~2월이 여름(낮 30°C 안팎)이고 6~8월이 겨울(낮 25°C 안팎)로 우리나라와 반대이다.',
        '여름에 비가 더 많이 오고 눈은 오지 않는다(1년 약 1,100mm).',
        '산에는 열대 우림(치주카 숲)이 우거져 있다.',
        '서울이 낮 12시일 때 리우는 밤 12시(자정)로 낮과 밤이 정반대이다.',
      ],
    },
    {
      id: 'card_rio_culture', cityId: 'rio', topic: 'culture', title: '리우의 문화',
      lines: [
        '포르투갈어를 쓰고 화폐는 헤알이다.',
        '1960년까지 브라질의 수도였고 지금 수도는 브라질리아이다.',
        '매년 2~3월 삼바 춤과 화려한 퍼레이드로 유명한 카니발이 열린다.',
        '코르코바두산 꼭대기의 예수상(1931년, 받침대 포함 약 38m)이 도시를 내려다본다.',
        '축구를 아주 좋아하고(월드컵 5번 우승), 페이조아다·슈하스쿠를 먹으며, 2016년에 리우 올림픽이 열렸다.',
      ],
    },
  ],
  signs: [
    { id: 'sign_rio_geo', cardId: 'card_rio_geo', at: { tx: 25, ty: 15 } },
    { id: 'sign_rio_climate', cardId: 'card_rio_climate', at: { tx: 6, ty: 22 } },
    { id: 'sign_rio_culture', cardId: 'card_rio_culture', at: { tx: 5, ty: 5 } },
  ],
  npcs: [
    {
      id: 'npc_lucas', name: '루카스', role: 'guide', at: { tx: 8, ty: 8 }, facing: 'down',
      missionIds: ['m_rio_quiz', 'm_rio_order'], cardId: 'card_rio_geo', bubble: '올라! 리우야',
      idleText: '언덕 위 예수상이 보여? 남쪽으로 내려가면 해변이야.',
    },
    {
      id: 'npc_isabela', name: '이자벨라', role: 'teacher', at: { tx: 20, ty: 8 }, facing: 'down',
      missionIds: ['m_rio_blank', 'm_rio_ox'], bubble: '코르코바두산이야',
      idleText: '저 위가 코르코바두산이야. 예수상이 도시를 내려다보고 있지.',
    },
    {
      id: 'npc_pedro', name: '페드루', role: 'guard', at: { tx: 16, ty: 21 }, facing: 'down',
      missionIds: ['m_rio_defeat'], bubble: '원숭이 조심!',
      idleText: '서쪽 숲의 원숭이들이 바나나를 훔쳐 가. 조심해!',
    },
  ],
  missions: [
    {
      id: 'm_rio_quiz', cityId: 'rio', giverNpcId: 'npc_lucas', title: '리우 지리 퀴즈',
      description: '루카스가 내는 리우 퀴즈 5문제 중 4개 이상 맞히기',
      objective: { type: 'minigame', spec: { kind: 'quiz', cityId: 'rio', count: QUIZ_COUNT, passCount: QUIZ_PASS } },
      rewardPoints: 40,
      acceptText: '리우에 대해 퀴즈를 내 볼게! 표지판을 먼저 읽고 오면 쉬울 거야. 준비되면 다시 말 걸어 줘.',
      progressText: '퀴즈에 도전할 준비가 됐어?',
      completeText: '무이투 벵(아주 좋아)! 리우 박사구나.',
      failText: '아깝다! 표지판을 읽고 다시 도전해 봐.',
    },
    {
      id: 'm_rio_order', cityId: 'rio', giverNpcId: 'npc_lucas', title: '순서대로 맞추기',
      description: '루카스의 순서 문제 2개를 모두 맞히기(문제당 2번까지)',
      objective: { type: 'minigame', spec: { kind: 'order', cityId: 'rio', count: ORDER_COUNT, passCount: ORDER_PASS, triesPerQuestion: ORDER_TRIES } },
      rewardPoints: 30, prerequisiteMissionId: 'm_rio_quiz',
      acceptText: '올림픽과 산 이야기로 순서 문제를 낼게. 먼저 열린 것부터, 낮은 것부터 늘어놓아 봐.',
      progressText: '순서 맞추기에 도전할래?',
      completeText: '정확해! 리우의 산과 역사를 한 줄로 꿰었어.',
      failText: '카드 아래 숫자를 떠올리며 다시 해 보자.',
    },
    {
      id: 'm_rio_blank', cityId: 'rio', giverNpcId: 'npc_isabela', title: '리우 빈칸 채우기',
      description: '이자벨라의 문장 4개 중 3개 이상 빈칸 채우기',
      objective: { type: 'minigame', spec: { kind: 'blank', cityId: 'rio', count: BLANK_COUNT, passCount: BLANK_PASS } },
      rewardPoints: 30,
      acceptText: '문장의 빈칸을 채워 볼까? 보기 중에서 알맞은 말을 골라 봐. 준비되면 말 걸어 줘.',
      progressText: '빈칸 채우기에 도전할래?',
      completeText: '완벽해! 브라질을 문장으로도 설명할 수 있구나.',
      failText: '표지판 문장을 다시 읽고 도전해 봐.',
    },
    {
      id: 'm_rio_ox', cityId: 'rio', giverNpcId: 'npc_isabela', title: '리우 OX 퀴즈',
      description: '이자벨라가 내는 OX 퀴즈 5문제 중 4개 이상 맞히기',
      objective: { type: 'minigame', spec: { kind: 'ox', cityId: 'rio', count: QUIZ_COUNT, passCount: QUIZ_PASS } },
      rewardPoints: 30, prerequisiteMissionId: 'm_rio_blank',
      acceptText: '리우의 기후와 문화에 대해 OX 퀴즈를 내 볼게. 준비되면 다시 말 걸어 줘!',
      progressText: 'OX 퀴즈에 도전해 볼래?',
      completeText: '브라보! 열대 기후와 남반구를 정확히 알고 있구나.',
      failText: '아깝다! 표지판을 읽고 다시 도전해 봐.',
    },
    {
      id: 'm_rio_defeat', cityId: 'rio', giverNpcId: 'npc_pedro', title: '장난꾸러기 원숭이 소탕',
      description: '서쪽 숲의 장난꾸러기 원숭이 3마리 처치',
      objective: { type: 'defeat', monsterId: 'monkey', count: 3 },
      rewardPoints: 30,
      acceptText: '서쪽 숲의 원숭이들이 관광객 바나나를 다 훔쳐 가. 3마리만 뿅 하고 쫓아 줄래? F 키로 공격할 수 있어.',
      progressText: '원숭이는 아직 남아 있어?',
      completeText: '오브리가두(고마워)! 덕분에 숲이 조용해졌어.',
    },
  ],
  monsterZones: [
    // A.6 first had (4,12): its spawn points were 72–136px from the city spawn (2,9), inside the monkey's 150px aggro
    // range, so the player was mobbed at the entrance and again after every faint. The zone sits 4 tiles south, in the
    // open grass below the western tree row, on the dark-grass patch (rows 15-17) that marks it; every monkey starts
    // ≥ 194px from the spawn (outside the 150px aggro range) and ≥ 270px from every NPC.
    { monsterId: 'monkey', center: { tx: 4, ty: 16 }, radiusTiles: 2, count: 3 },
    { monsterId: 'toucan', center: { tx: 9, ty: 24 }, radiusTiles: 2, count: 3 },
    { monsterId: 'toucan', center: { tx: 29, ty: 24 }, radiusTiles: 2, count: 2 },
  ],
  // every mission counts toward the stamp (spec 8.2, 14.5)
  stampMissionIds: ['m_rio_quiz', 'm_rio_order', 'm_rio_blank', 'm_rio_ox', 'm_rio_defeat'],
};
