/**
 * Interfața „Stories” pentru clienți (telefon) este activă, în etapa 1,
 * doar pentru restaurantele din lista de mai jos. Toate celelalte restaurante
 * rămân pe interfața clasică. Pentru a o porni la alt restaurant se adaugă
 * slug-ul aici; pentru revenire se scoate slug-ul din listă.
 */
export const STORIES_UI_SLUGS: readonly string[] = ["burgerdemo"];

export function usesStoriesUi(slug?: string | null): boolean {
  if (!slug) return false;
  return STORIES_UI_SLUGS.includes(slug.trim().toLowerCase());
}
