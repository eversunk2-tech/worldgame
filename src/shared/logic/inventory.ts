// Purchase / equip / furniture placement validation (spec 6.6).
import type { ItemDef, Progress, RoomPlacement } from '../types';
import { ROOM_COLS, ROOM_ROWS } from '../constants';
import { getItem } from '../content/items';

export interface Check { ok: boolean; reason: string }
const ok: Check = { ok: true, reason: '' };
const fail = (reason: string): Check => ({ ok: false, reason });

export function canBuy(progress: Progress, item: ItemDef): Check {
  if (progress.owned.includes(item.id)) return fail('이미 가지고 있어요');
  if (item.unlockStamp) return fail('도장을 모으면 받을 수 있는 기념품이에요');
  if (progress.points < item.price) return fail(`포인트가 부족해요 (${item.price - progress.points} 더 필요)`);
  return ok;
}

export function canEquip(progress: Progress, item: ItemDef): Check {
  if (item.slot === 'furniture') return fail('가구는 장착할 수 없어요');
  if (!progress.owned.includes(item.id)) return fail('먼저 구매해야 해요');
  return ok;
}

export function footprint(item: ItemDef): { w: number; h: number } {
  return item.size ?? { w: 1, h: 1 };
}

function overlaps(a: RoomPlacement, aSize: { w: number; h: number }, gx: number, gy: number, size: { w: number; h: number }): boolean {
  return a.gx < gx + size.w && gx < a.gx + aSize.w && a.gy < gy + size.h && gy < a.gy + aSize.h;
}

/** Whether `item` fits at (gx,gy): in range, owned, no overlap, not already placed. `ignoreSelf` skips an existing placement of the same item. */
export function canPlace(progress: Progress, item: ItemDef, gx: number, gy: number, opts: { ignoreSelf?: boolean } = {}): Check {
  if (item.slot !== 'furniture') return fail('가구만 배치할 수 있어요');
  if (!progress.owned.includes(item.id)) return fail('먼저 구매해야 해요');
  if (!Number.isInteger(gx) || !Number.isInteger(gy)) return fail('잘못된 위치예요');
  const size = footprint(item);
  if (gx < 0 || gy < 0 || gx + size.w > ROOM_COLS || gy + size.h > ROOM_ROWS) return fail('방 밖에는 놓을 수 없어요');
  for (const p of progress.room) {
    if (p.itemId === item.id) {
      if (opts.ignoreSelf) continue;
      return fail('이미 배치된 가구예요');
    }
    const other = getItem(p.itemId);
    if (!other) continue;
    if (overlaps(p, footprint(other), gx, gy, size)) return fail('다른 가구와 겹쳐요');
  }
  return ok;
}
