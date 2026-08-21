/**
 * Combine des classes Tailwind conditionnelles en une seule chaîne.
 * Version minimale (pas de fusion de classes en conflit à la clsx/tailwind-merge) :
 * suffisante ici, les composants de ce projet n'empilent pas de classes contradictoires.
 */
export function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}
