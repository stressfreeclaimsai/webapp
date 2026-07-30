import { ITEMS_DAMAGED, ITEM_LABELS, type ItemDamaged } from "@/lib/claim-facts";

/**
 * The fixed items-damaged set (AC-4), rendered as one tap per item — chosen,
 * never typed. Used by both the gap-filling and review steps.
 */
export function ItemsCheckboxes({ selected }: { selected: readonly ItemDamaged[] }) {
  return (
    <div className="grid gap-2.5">
      {ITEMS_DAMAGED.map((item) => (
        <label
          key={item}
          className="flex min-h-13 cursor-pointer items-center gap-3.5 rounded-control border border-border-strong bg-surface-raised px-4 py-3 shadow-sm transition-[border-color,background-color,box-shadow] duration-200 hover:border-accent has-checked:border-accent has-checked:bg-accent-soft has-checked:shadow-none"
        >
          <input
            type="checkbox"
            name="items"
            value={item}
            defaultChecked={selected.includes(item)}
            className="size-5 shrink-0 accent-accent"
          />
          <span className="font-medium">{ITEM_LABELS[item]}</span>
        </label>
      ))}
    </div>
  );
}
