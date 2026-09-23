// Map definition: bounds, obstacles (walls), platforms (landable AABBs), spawns, reach points.
import type { MapDef, Vec3, BoxDef, AABB } from '../types';
import { MAP_BOUND } from '../constants';

const v = (x: number, y: number, z: number): Vec3 => ({ x, y, z });

const BROWN = 0x8b5a2b;
const ROOF = 0xa0522d;
const FENCE = 0xb08968;
const STONE = 0x777777;
const WELL = 0x5b6770;
const PLATFORM = 0xbfc4c9;

const obstacles: BoxDef[] = [
  // 마을 집 3채 (4×3×4, 갈색)
  { id: 'house_1', center: v(-10, 1.5, -8), size: v(4, 3, 4), color: BROWN },
  { id: 'house_2', center: v(10, 1.5, -9), size: v(4, 3, 4), color: BROWN },
  { id: 'house_3', center: v(12, 1.5, 6), size: v(4, 3, 4), color: ROOF },
  // 우물 (원기둥은 뷰에서만 표현, 충돌은 AABB)
  { id: 'well', center: v(0, 0.6, -12), size: v(1.8, 1.2, 1.8), color: WELL },
  // 울타리 벽 몇 개
  { id: 'fence_n', center: v(-4, 0.6, -15), size: v(8, 1.2, 0.4), color: FENCE },
  { id: 'fence_s1', center: v(-7, 0.6, 12), size: v(10, 1.2, 0.4), color: FENCE },
  { id: 'fence_s2', center: v(5, 0.6, 12), size: v(6, 1.2, 0.4), color: FENCE },
  { id: 'fence_w', center: v(-15, 0.6, 2), size: v(0.4, 1.2, 8), color: FENCE },
  // 필드 사이 기둥 장애물
  { id: 'pillar_1', center: v(18, 1.5, 4), size: v(1.2, 3, 1.2), color: STONE },
  { id: 'pillar_2', center: v(24, 1.5, 12), size: v(1.2, 3, 1.2), color: STONE },
  { id: 'pillar_3', center: v(-20, 1.5, 16), size: v(1.2, 3, 1.2), color: STONE },
  { id: 'pillar_4', center: v(-26, 1.5, 8), size: v(1.2, 3, 1.2), color: STONE },
  { id: 'pillar_5', center: v(-12, 1.5, -28), size: v(1.2, 3, 1.2), color: STONE },
  { id: 'pillar_6', center: v(12, 1.5, -30), size: v(1.2, 3, 1.2), color: STONE },
];

// 발판: 모두 바닥에 붙어 있고 size.y가 곧 높이. 단차는 최대 점프 높이 1.62m 이하.
const platforms: BoxDef[] = [
  { id: 'plat_village', center: v(-8, 0.5, 4), size: v(4, 1.0, 4), color: PLATFORM },
  { id: 'plat_field', center: v(22, 0.7, -10), size: v(5, 1.4, 5), color: PLATFORM },
  { id: 'plat_hill_1', center: v(0, 0.6, -43), size: v(8, 1.2, 8), color: PLATFORM },
  // spec 표는 center.y=1.8로 적혀 있지만 "바닥에 붙어 있고 윗면 y=2.4"이려면 center.y = 2.4/2 = 1.2 이어야 한다.
  // (1.8이면 윗면이 3.0이 되어 도달 지점 y=2.4·단차 1.2m와 모순) → 1.2로 확정.
  { id: 'plat_hill_2', center: v(0, 1.2, -46), size: v(4, 2.4, 4), color: PLATFORM },
];

export const MAP: MapDef = {
  bounds: { minX: -MAP_BOUND, maxX: MAP_BOUND, minZ: -MAP_BOUND, maxZ: MAP_BOUND },
  playerSpawn: v(0, 0, 6),
  obstacles,
  platforms,
  monsterSpawns: [
    { typeId: 'slime', center: v(30, 0, 0), radius: 10, count: 6 },
    { typeId: 'golem', center: v(-35, 0, 28), radius: 10, count: 3 },
  ],
  reachPoints: [
    { id: 'hill_sign', pos: v(0, 2.4, -46), radius: 2.5 },
  ],
};

/** AABB of a box def (center ± size/2). */
export function boxAABB(b: BoxDef): AABB {
  return {
    min: { x: b.center.x - b.size.x / 2, y: b.center.y - b.size.y / 2, z: b.center.z - b.size.z / 2 },
    max: { x: b.center.x + b.size.x / 2, y: b.center.y + b.size.y / 2, z: b.center.z + b.size.z / 2 },
  };
}

/** Precomputed AABBs — computed once, read-only. */
export const OBSTACLE_AABBS: readonly AABB[] = obstacles.map(boxAABB);
export const PLATFORM_AABBS: readonly AABB[] = platforms.map(boxAABB);
export const ALL_WALL_AABBS: readonly AABB[] = [...OBSTACLE_AABBS, ...PLATFORM_AABBS];
