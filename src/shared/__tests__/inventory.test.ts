import { describe, expect, it } from 'vitest';
import { getItem } from '../content/items';
import { canBuy, canEquip, canPlace } from '../logic/inventory';
import { createProgress } from '../logic/progress';

const item = (id: string) => getItem(id)!;

describe('canBuy', () => {
  it('rejects owned, unaffordable, and souvenir items', () => {
    const p = createProgress();
    expect(canBuy(p, item('top_tshirt_blue')).ok).toBe(false);
    expect(canBuy(p, item('hat_cap_red')).ok).toBe(false);
    expect(canBuy(p, item('hat_cap_red')).reason).toContain('부족');
    expect(canBuy(p, item('fur_souvenir_seoul')).ok).toBe(false);
    p.points = 30;
    expect(canBuy(p, item('hat_cap_red')).ok).toBe(true);
    expect(canBuy(p, item('hat_gat')).ok).toBe(false);
  });
});

describe('canEquip', () => {
  it('requires ownership and a wearable slot', () => {
    const p = createProgress();
    expect(canEquip(p, item('top_tshirt_blue')).ok).toBe(true);
    expect(canEquip(p, item('body_tan')).ok).toBe(true);
    expect(canEquip(p, item('hat_cap_red')).ok).toBe(false);
    p.owned.push('fur_chair');
    expect(canEquip(p, item('fur_chair')).ok).toBe(false);
  });
});

describe('canPlace', () => {
  it('checks range, ownership, overlap and duplicates', () => {
    const p = createProgress();
    expect(canPlace(p, item('fur_rug'), 0, 0).ok).toBe(false); // not owned
    p.owned.push('fur_rug', 'fur_chair', 'fur_bed', 'fur_bookshelf');
    expect(canPlace(p, item('fur_rug'), 0, 0).ok).toBe(true);
    expect(canPlace(p, item('fur_rug'), 7, 0).ok).toBe(false); // 2 wide, off the right edge
    expect(canPlace(p, item('fur_rug'), 6, 4).ok).toBe(true);
    expect(canPlace(p, item('fur_rug'), 6, 5).ok).toBe(false); // 2 tall, off the bottom
    expect(canPlace(p, item('fur_bookshelf'), 0, 5).ok).toBe(false);
    expect(canPlace(p, item('fur_chair'), -1, 0).ok).toBe(false);
    expect(canPlace(p, item('fur_chair'), 1.5, 0).ok).toBe(false);

    p.room.push({ itemId: 'fur_rug', gx: 0, gy: 0 });
    expect(canPlace(p, item('fur_chair'), 1, 1).ok).toBe(false); // overlaps rug
    expect(canPlace(p, item('fur_chair'), 1, 1).reason).toContain('겹');
    expect(canPlace(p, item('fur_chair'), 2, 0).ok).toBe(true);
    expect(canPlace(p, item('fur_bed'), 1, 1).ok).toBe(false); // 2x1 partially overlapping
    expect(canPlace(p, item('fur_bed'), 2, 1).ok).toBe(true);
    expect(canPlace(p, item('fur_rug'), 4, 4).ok).toBe(false); // same item twice
    expect(canPlace(p, item('fur_rug'), 4, 4, { ignoreSelf: true }).ok).toBe(true);
    expect(canPlace(p, item('top_hanbok'), 0, 0).ok).toBe(false);
  });
});
