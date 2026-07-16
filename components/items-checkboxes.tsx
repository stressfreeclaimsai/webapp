import { ITEMS_DAMAGED, ITEM_LABELS, type ItemDamaged } from "@/lib/claim-facts";

/**
 * The fixed items-damaged set (AC-4), rendered as one tap per item — chosen,
 * never typed. Used by both the gap-filling and review steps.
 */
export function ItemsCheckboxes({ selected }: { selected: readonly ItemDamaged[] }) {
  return (
    <div className="grid gap-2">
      {ITEMS_DAMAGED.map((item) => (
        <label
          key={item}
          className="flex cursor-pointer items-center gap-3 rounded-card border border-border bg-surface-raised px-4 py-3 has-checked:border-accent has-checked:bg-accent-soft"
        >
          <input
            type="checkbox"
            name="items"
            value={item}
            defaultChecked={selected.includes(item)}
            className="size-4 accent-accent"
          />
          <span>{ITEM_LABELS[item]}</span>
        </label>
      ))}
    </div>
  );
}
