"use client";

export const STORIES_CART_TARGET_ID = "stories-cart-target";
export const STORIES_CART_FALLBACK_ID = "stories-cart-fallback";
export const STORIES_CART_BUMP_EVENT = "stories-cart-bump";

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Animație vizuală „produsul zboară în coș”. Nu modifică coșul:
 * produsul se adaugă separat, prin funcția obișnuită din coș.
 */
export function flyToCart(source: Element | null | undefined) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(STORIES_CART_BUMP_EVENT));
  const target =
    document.getElementById(STORIES_CART_TARGET_ID) ??
    document.getElementById(STORIES_CART_FALLBACK_ID);
  if (!source || !target || prefersReducedMotion()) return;
  const from = source.getBoundingClientRect();
  const to = target.getBoundingClientRect();
  if (!from.width || !to.width) return;

  const ghost = source.cloneNode(true) as HTMLElement;
  const size = Math.min(from.width, from.height, 120);
  Object.assign(ghost.style, {
    position: "fixed",
    left: `${from.left + from.width / 2 - size / 2}px`,
    top: `${from.top + from.height / 2 - size / 2}px`,
    width: `${size}px`,
    height: `${size}px`,
    margin: "0",
    borderRadius: "999px",
    overflow: "hidden",
    zIndex: "80",
    pointerEvents: "none",
    boxShadow: "0 12px 30px rgba(14,31,25,.35)",
  });
  document.body.appendChild(ghost);
  const dx = to.left + to.width / 2 - (from.left + from.width / 2);
  const dy = to.top + to.height / 2 - (from.top + from.height / 2);
  const animation = ghost.animate(
    [
      { transform: "translate(0,0) scale(1)", opacity: 1 },
      { transform: `translate(${dx * 0.35}px, ${dy * 0.35 - 80}px) scale(.75)`, opacity: 1, offset: 0.45 },
      { transform: `translate(${dx}px, ${dy}px) scale(.18)`, opacity: 0.4 },
    ],
    { duration: 650, easing: "cubic-bezier(.5,0,.2,1)" },
  );
  animation.onfinish = () => ghost.remove();
  animation.oncancel = () => ghost.remove();
}
