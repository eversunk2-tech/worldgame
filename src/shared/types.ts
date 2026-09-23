// Shared types — pure, JSON-serializable data. No phaser/DOM/window imports here.

export type CityId = 'seoul' | 'paris' | 'beijing' | 'london' | 'cairo' | 'newyork' | 'rio' | 'sydney' | 'nairobi';
export type ContinentId = 'asia' | 'europe' | 'africa' | 'north_america' | 'south_america' | 'oceania';
export type Facing = 'down' | 'left' | 'right' | 'up';
export interface Vec2 { x: number; y: number }
export interface TilePos { tx: number; ty: number }

export interface CityMarker {
  cityId: CityId; name: string; continent: ContinentId; country: string;
  lonLat: [number, number]; status: 'playable' | 'comingSoon'; unlock: UnlockRule;
}
export type UnlockRule = { type: 'always' } | { type: 'missionsTurnedIn'; missionIds: string[] };

export interface LearnCard { id: string; cityId: CityId; topic: 'geo' | 'climate' | 'culture'; title: string; lines: string[] }
export interface SignDef { id: string; cardId: string; at: TilePos }
export interface NpcDef {
  id: string; name: string; role: 'guide' | 'teacher' | 'guard'; at: TilePos; facing: Facing;
  missionIds: string[]; idleText: string; cardId?: string; /* guide: 첫 대화에 학습 카드 표시 */
}
export interface MonsterZone { monsterId: string; center: TilePos; radiusTiles: number; count: number }
export interface CityDef {
  id: CityId; name: string; continent: ContinentId; rows: string[]; /* 30행 × 40자 */
  entrance: TilePos; /* 출입구 타일 */ spawn: TilePos; spawnFacing: Facing;
  cards: LearnCard[]; signs: SignDef[]; npcs: NpcDef[]; missions: MissionDef[]; monsterZones: MonsterZone[];
  stampMissionIds: string[]; /* 모두 turnedIn → 도장 */
}

export type MinigameKind = 'quiz' | 'ox'; // 'match' 등은 v0.2 후보
export interface MinigameSpec { kind: MinigameKind; cityId: CityId; topics?: QuizTopic[]; count: number; passCount: number }
export interface MinigameResult { kind: MinigameKind; success: boolean; correct: number; total: number; answeredIds: string[] }
export type MissionObjective = { type: 'minigame'; spec: MinigameSpec } | { type: 'defeat'; monsterId: string; count: number };
export interface MissionDef {
  id: string; cityId: CityId; giverNpcId: string; title: string; description: string;
  objective: MissionObjective; rewardPoints: number; prerequisiteMissionId?: string;
  acceptText: string; progressText: string; completeText: string; failText?: string;
}
export type MissionStatus = 'locked' | 'available' | 'active' | 'completed' | 'turnedIn';
export interface MissionProgress { missionId: string; status: MissionStatus; count: number; attempts: number }

export type QuizTopic = 'geo' | 'climate' | 'culture';
export type QuizItem =
  | { id: string; cityId: CityId; topic: QuizTopic; kind: 'choice'; question: string; choices: [string, string, string, string]; answer: 0 | 1 | 2 | 3; explanation: string }
  | { id: string; cityId: CityId; topic: QuizTopic; kind: 'ox'; question: string; answer: boolean; explanation: string };

export interface MonsterDef {
  id: string; cityId: CityId; name: string; color: number; hp: number; atk: number; speed: number;
  aggroRange: number; attackRange: number; attackInterval: number; leashRange: number; points: number; respawnTime: number;
}

export type ItemSlot = 'body' | 'hair' | 'top' | 'hat' | 'furniture';
export interface ItemDef {
  id: string; slot: ItemSlot; name: string; price: number; color: number; shape: string;
  size?: { w: number; h: number }; /* furniture: 격자 칸 */ default?: boolean; unlockStamp?: CityId; /* 기념품 */
}

export interface AvatarEquip { body: string; hair: string; top: string; hat: string | null }
export interface RoomPlacement { itemId: string; gx: number; gy: number }
export interface Progress {
  profile: { name: string; createdAt: number };
  points: number; totalEarned: number;
  missions: Record<string, MissionProgress>;
  stamps: CityId[]; readCards: string[];
  avatar: AvatarEquip; owned: string[]; room: RoomPlacement[];
  lastCity: CityId | null;
  stats: { defeated: number; quizAnswered: number; quizCorrect: number };
}
