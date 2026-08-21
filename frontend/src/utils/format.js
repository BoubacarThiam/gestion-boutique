/** Formate un montant en francs CFA, ex: 12500 -> "12 500 FCFA" */
export function formaterFCFA(montant) {
  const nombre = Number(montant) || 0
  return new Intl.NumberFormat('fr-FR').format(nombre) + ' FCFA'
}

/** Formate une date ISO/MySQL en "21 août 2026 à 14:32" */
export function formaterDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr.replace(' ', 'T'))
  if (Number.isNaN(d.getTime())) return dateStr
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

/** Formate une date courte, ex: "21/08/2026" */
export function formaterDateCourte(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr.replace(' ', 'T'))
  if (Number.isNaN(d.getTime())) return dateStr
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d)
}

/** Date du jour au format YYYY-MM-DD attendu par les filtres de rapports/stock */
export function dateISOAujourdhui() {
  return new Date().toISOString().slice(0, 10)
}
