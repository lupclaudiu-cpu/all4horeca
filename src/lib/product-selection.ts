import type {
  Product,
  ProductOptionGroup,
  SelectedProductOption,
} from "./types";

/** groupId -> optionId -> cantitate */
export type SelectionState = Record<string, Record<string, number>>;

/** Opțiunile alese, în forma folosită de coș (identică cu pagina produsului). */
export function buildSelectedOptions(
  product: Pick<Product, "optionGroups"> | null | undefined,
  selected: SelectionState,
): SelectedProductOption[] {
  return (product?.optionGroups ?? []).flatMap((group) =>
    group.options.flatMap((option) => {
      const quantity = selected[group.id]?.[option.id] ?? 0;
      return quantity > 0
        ? [
            {
              groupId: group.id,
              groupName: group.name,
              optionId: option.id,
              optionName: option.name,
              priceDelta: option.priceDelta,
              quantity,
              multiplyByProductQuantity: option.multiplyByProductQuantity,
            },
          ]
        : [];
    }),
  );
}

/** Primul grup obligatoriu fără nicio opțiune aleasă (aceeași regulă ca pagina produsului). */
export function findMissingRequiredGroup(
  product: Pick<Product, "optionGroups"> | null | undefined,
  selected: SelectionState,
): ProductOptionGroup | undefined {
  return (product?.optionGroups ?? []).find(
    (group) =>
      group.required &&
      !Object.values(selected[group.id] ?? {}).some((value) => value > 0),
  );
}

export function selectSingleOption(
  selected: SelectionState,
  groupId: string,
  optionId: string,
): SelectionState {
  return { ...selected, [groupId]: { [optionId]: 1 } };
}

export function changeOptionQuantity(
  selected: SelectionState,
  groupId: string,
  optionId: string,
  delta: number,
): SelectionState {
  const group = selected[groupId] ?? {};
  const next = Math.max(0, (group[optionId] ?? 0) + delta);
  const nextGroup = { ...group };
  if (next === 0) delete nextGroup[optionId];
  else nextGroup[optionId] = next;
  return { ...selected, [groupId]: nextGroup };
}

/** Produsul cere alegeri obligatorii înainte de adăugare (regula din meniul clasic). */
export function needsRequiredChoice(product: Pick<Product, "optionGroups">): boolean {
  return (product.optionGroups ?? []).some((group) => group.required);
}
