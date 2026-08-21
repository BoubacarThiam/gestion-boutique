// Client HTTP central : préfixe l'URL de l'API, ajoute le token JWT, et
// normalise la gestion des erreurs pour tous les appels de l'app.

// En prod, VITE_API_URL pointe vers le domaine de l'API si elle est
// hébergée séparément (ex: https://api.maboutique.sn). En dev, on laisse
// vide : Vite proxifie /api vers le backend PHP local (voir vite.config.js).
const BASE_API = import.meta.env.VITE_API_URL || ''

const CLE_TOKEN = 'gestion_boutique_token'

export function obtenirToken() {
  return localStorage.getItem(CLE_TOKEN)
}

export function definirToken(token) {
  if (token) {
    localStorage.setItem(CLE_TOKEN, token)
  } else {
    localStorage.removeItem(CLE_TOKEN)
  }
}

/**
 * Construit l'URL absolue d'un fichier renvoyé par l'API (image produit...).
 * Le backend renvoie des chemins relatifs comme "/uploads/produits/xxx.jpg".
 */
export function urlFichier(cheminRelatif) {
  if (!cheminRelatif) return null
  if (cheminRelatif.startsWith('http')) return cheminRelatif
  if (!BASE_API) return cheminRelatif // même domaine (dev proxy ou prod colocalisée)

  try {
    const origine = new URL(BASE_API).origin
    return origine + cheminRelatif
  } catch {
    return cheminRelatif
  }
}

class ErreurApi extends Error {
  constructor(message, statut, details) {
    super(message)
    this.statut = statut
    this.details = details
  }
}

/**
 * Appel générique à l'API.
 * @param {string} chemin  ex: '/api/produits'
 * @param {object} options { methode, corps, fichier (FormData), sansAuth }
 */
async function requete(chemin, options = {}) {
  const { methode = 'GET', corps, formData, sansAuth = false } = options

  const entetes = {}
  if (!formData) {
    entetes['Content-Type'] = 'application/json'
  }
  if (!sansAuth) {
    const token = obtenirToken()
    if (token) entetes['Authorization'] = `Bearer ${token}`
  }

  let reponse
  try {
    reponse = await fetch(BASE_API + chemin, {
      method: methode,
      headers: entetes,
      body: formData ?? (corps !== undefined ? JSON.stringify(corps) : undefined),
    })
  } catch {
    throw new ErreurApi('Connexion impossible. Vérifiez votre connexion internet.', 0)
  }

  let donnees = null
  const type = reponse.headers.get('content-type') || ''
  if (type.includes('application/json')) {
    donnees = await reponse.json().catch(() => null)
  }

  if (!reponse.ok) {
    const message = donnees?.erreur || `Erreur (${reponse.status})`
    throw new ErreurApi(message, reponse.status, donnees?.details)
  }

  return donnees
}

export const api = {
  get: (chemin, opts) => requete(chemin, { ...opts, methode: 'GET' }),
  post: (chemin, corps, opts) => requete(chemin, { ...opts, methode: 'POST', corps }),
  put: (chemin, corps, opts) => requete(chemin, { ...opts, methode: 'PUT', corps }),
  delete: (chemin, opts) => requete(chemin, { ...opts, methode: 'DELETE' }),
  postFormData: (chemin, formData, opts) => requete(chemin, { ...opts, methode: 'POST', formData }),
}

export { ErreurApi }
