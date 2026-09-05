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

// Clé de garde : une seule tentative de récupération par onglet, pour ne
// jamais boucler sur un rechargement si le HTML reçu vient d'autre chose.
const CLE_VERIF_HEBERGEUR = 'gestion_boutique_verif_hebergeur'

/**
 * Détecte la page de vérification anti-robot des hébergements mutualisés
 * gratuits (InfinityFree & co) : un HTML servi en HTTP 200 à la place de la
 * réponse attendue, qui pose un cookie `__test` via un déchiffrement AES en
 * JavaScript avant de rejouer la requête.
 */
function estVerificationHebergeur(texte) {
  return texte.includes('slowAES') || texte.includes('aes.js') || texte.includes('__test=')
}

/**
 * Rejoue une vraie navigation réseau pour laisser le navigateur exécuter la
 * page de vérification et reposer son cookie (valable 6h).
 *
 * Le service worker sert `index.html` et les assets depuis son précache :
 * l'app peut donc rester ouverte des jours sans qu'aucune navigation
 * n'atteigne le réseau, pendant que le cookie de vérification, lui, expire.
 * Les appels API se prennent alors la page de vérification en boucle. On
 * désinscrit le service worker (`registerSW.js` le réinstalle au chargement
 * suivant) pour garantir que le rechargement parte bien jusqu'au serveur.
 */
async function relancerVerificationHebergeur() {
  try {
    if (sessionStorage.getItem(CLE_VERIF_HEBERGEUR)) return
    sessionStorage.setItem(CLE_VERIF_HEBERGEUR, '1')
  } catch {
    return // navigation privée verrouillée : on laisse remonter l'erreur
  }

  try {
    const inscriptions = (await navigator.serviceWorker?.getRegistrations?.()) ?? []
    await Promise.all(inscriptions.map((inscription) => inscription.unregister()))
  } catch {
    // Pas de service worker (ou API indisponible) : le rechargement suffit.
  }
  window.location.reload()
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

  // L'API répond toujours en JSON (voir backend/src/Core/Response.php) : une
  // réponse d'un autre type signale une page intercalée par l'hébergement, pas
  // une donnée exploitable. Sans ce garde-fou, la fonction renvoyait `null` et
  // l'appelant plantait plus loin sur `donnees.produits` — d'où un « Vérifiez
  // votre connexion » trompeur alors que le réseau va très bien.
  const type = reponse.headers.get('content-type') || ''
  if (!type.includes('application/json')) {
    const texte = await reponse.text().catch(() => '')
    if (estVerificationHebergeur(texte)) {
      relancerVerificationHebergeur()
      throw new ErreurApi('Vérification de sécurité de l\'hébergeur en cours…', reponse.status)
    }
    throw new ErreurApi(`Réponse inattendue du serveur (${reponse.status}).`, reponse.status)
  }

  const donnees = await reponse.json().catch(() => null)

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
