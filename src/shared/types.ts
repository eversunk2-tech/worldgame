// Shared types — pure data, JSON-serializable. No three/DOM/window imports here.

export interface Vec3 { x: number; y: number; z: number }
export interface AABB { min: Vec3; max: Vec3 }

export interface PlayerState {
  id: string;            // 'p1' (멀티 시 서버가 부여)
  pos: Vec3; vel: Vec3; yaw: number;   // yaw: 바라보는 방향(rad), +Z 기준
  onGround: boolean;
  hp: number; maxHp: number; atk: number;
  level: number; xp: number;
  alive: boolean; respawnTimer: number;       // 사망 시 3 → 0으로 감소
  attackCooldown: number; attackAnim: number; // 초 단위 남은 시간
  invulnTimer: number;                        // 피격 후 0.5초 무적
}

/** 'return': walking back to spawnPos after exceeding leash; ignores aggro until it arrives. */
export type MonsterAIState = 'idle' | 'chase' | 'attack' | 'return' | 'dead';
export interface MonsterState {
  id: string; typeId: string;
  pos: Vec3; yaw: number; spawnPos: Vec3;
  hp: number; maxHp: number;
  ai: MonsterAIState;
  attackCooldown: number; respawnTimer: number; hitFlash: number;
}

export type QuestStatus = 'locked' | 'available' | 'active' | 'completed' | 'turnedIn';
export interface QuestProgress { questId: string; status: QuestStatus; count: number }

export interface GameState {
  tick: number; time: number;                 // 고정 스텝 누적
  player: PlayerState;
  monsters: MonsterState[];
  quests: Record<string, QuestProgress>;
}

/** 클라이언트 입력을 시뮬레이션이 이해하는 형태로 변환한 것. 한 틱에 하나 */
export interface Command {
  move: { x: number; z: number };  // 월드 좌표계 이동 방향(카메라 기준 변환 완료, 길이 0~1)
  jump: boolean; attack: boolean; interact: boolean;  // 이번 틱에 눌림(edge)
}

export type SimEvent =
  | { type: 'player:damaged'; amount: number; by: string }
  | { type: 'player:died' } | { type: 'player:respawned' }
  | { type: 'player:xp'; amount: number } | { type: 'player:levelup'; level: number }
  | { type: 'monster:damaged'; id: string; amount: number }
  | { type: 'monster:killed'; id: string; typeId: string }
  | { type: 'quest:accepted' | 'quest:progress' | 'quest:completed' | 'quest:turnedIn'; questId: string }
  | { type: 'npc:talk'; npcId: string; text: string }  // 대화 패널에 표시할 문장
  | { type: 'ui:message'; text: string };               // 알림 로그

/** Box placed in the world. AABB = center ± size/2. */
export interface BoxDef { id: string; center: Vec3; size: Vec3; color: number }

export interface MapDef {
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  playerSpawn: Vec3;
  obstacles: BoxDef[];   // 올라갈 수 없는 벽
  platforms: BoxDef[];   // 윗면(top = center.y + size.y/2)에 착지 가능
  monsterSpawns: { typeId: string; center: Vec3; radius: number; count: number }[];
  reachPoints: { id: string; pos: Vec3; radius: number }[];
}

export interface MonsterDef {
  typeId: string; name: string; color: number; size: Vec3;
  maxHp: number; atk: number; speed: number;
  aggroRange: number; attackRange: number; attackInterval: number; leashRange: number;
  xpReward: number; respawnTime: number;
}

export interface NPCDef { id: string; name: string; pos: Vec3; color: number; questIds: string[] }

export type QuestObjective =
  | { type: 'kill'; monsterTypeId: string; count: number }
  | { type: 'reach'; reachPointId: string };

export interface QuestDef {
  id: string; title: string; description: string; giverNpcId: string;
  objective: QuestObjective; rewardXp: number; prerequisiteQuestId?: string;
  acceptText: string; progressText: string; completeText: string;
}

/** Signature shared by every sim system called from stepSimulation. */
export type SimSystem = (state: GameState, cmd: Command, dt: number, events: SimEvent[]) => void;
