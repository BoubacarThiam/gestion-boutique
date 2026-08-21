import { useEffect, useState } from 'react'
import { produitsApi } from '../../api/produits'
import { categoriesApi } from '../../api/categories'
import { urlFichier, ErreurApi } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import Spinner from '../../components/ui/Spinner'
import EtatVide from '../../components/ui/EtatVide'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import Alerte from '../../components/ui/Alerte'
import { formaterFCFA } from '../../utils/format'

const VIDE = { categorie_id: '', nom: '', description: '', prix_achat: '', prix_vente: '', quantite_stock: '', seuil_alerte: 5, actif: true }

export default function Produits() {
  const { estAdmin } = useAuth()
  const [produits, setProduits] = useState([])
  const [categories, setCategories] = useState([])
  const [chargement, setChargement] = useState(true)
  const [recherche, setRecherche] = useState('')
  const [categorieFiltre, setCategorieFiltre] = useState('')
  const [stockBasSeulement, setStockBasSeulement] = useState(false)

  const [modalOuvert, setModalOuvert] = useState(false)
  const [edition, setEdition] = useState(null)
  const [formulaire, setFormulaire] = useState(VIDE)
  const [fichierImage, setFichierImage] = useState(null)
  const [erreur, setErreur] = useState('')
  const [envoiEnCours, setEnvoiEnCours] = useState(false)

  useEffect(() => {
    categoriesApi.liste().then((d) => setCategories(d.categories))
  }, [])

  function charger() {
    setChargement(true)
    const params = {}
    if (recherche.trim()) params.q = recherche.trim()
    if (categorieFiltre) params.categorie_id = categorieFiltre
    if (stockBasSeulement) params.stock_bas = 1
    produitsApi.liste(params).then((d) => setProduits(d.produits)).finally(() => setChargement(false))
  }

  useEffect(() => {
    const t = setTimeout(charger, 250)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recherche, categorieFiltre, stockBasSeulement])

  function ouvrirCreation() {
    setEdition(null)
    setFormulaire(VIDE)
    setFichierImage(null)
    setErreur('')
    setModalOuvert(true)
  }

  function ouvrirEdition(p) {
    setEdition(p)
    setFormulaire({
      categorie_id: p.categorie_id,
      nom: p.nom,
      description: p.description || '',
      prix_achat: p.prix_achat,
      prix_vente: p.prix_vente,
      quantite_stock: p.quantite_stock,
      seuil_alerte: p.seuil_alerte,
      actif: !!p.actif,
    })
    setFichierImage(null)
    setErreur('')
    setModalOuvert(true)
  }

  async function enregistrer(e) {
    e.preventDefault()
    setEnvoiEnCours(true)
    setErreur('')
    try {
      if (edition) {
        await produitsApi.modifier(edition.id, formulaire)
        if (fichierImage) {
          const fd = new FormData()
          fd.append('image', fichierImage)
          await produitsApi.changerImage(edition.id, fd)
        }
      } else if (fichierImage) {
        const fd = new FormData()
        Object.entries(formulaire).forEach(([cle, valeur]) => fd.append(cle, valeur))
        fd.append('image', fichierImage)
        await produitsApi.creerAvecImage(fd)
      } else {
        await produitsApi.creer(formulaire)
      }
      setModalOuvert(false)
      charger()
    } catch (err) {
      setErreur(err instanceof ErreurApi ? err.message : 'Erreur lors de l\'enregistrement.')
    } finally {
      setEnvoiEnCours(false)
    }
  }

  async function desactiver(p) {
    if (!window.confirm(`Désactiver « ${p.nom} » ? Il n'apparaîtra plus dans le catalogue.`)) return
    await produitsApi.supprimer(p.id)
    charger()
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Produits</h1>
        {estAdmin && <button onClick={ouvrirCreation} className="btn-primaire">+ Nouveau</button>}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <input value={recherche} onChange={(e) => setRecherche(e.target.value)} placeholder="Rechercher..." className="champ" />
        <select value={categorieFiltre} onChange={(e) => setCategorieFiltre(e.target.value)} className="champ sm:w-56">
          <option value="">Toutes les catégories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
        </select>
        <label className="flex shrink-0 items-center gap-2 rounded-xl border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700">
          <input type="checkbox" checked={stockBasSeulement} onChange={(e) => setStockBasSeulement(e.target.checked)} className="h-5 w-5 rounded border-gray-300" />
          Stock bas
        </label>
      </div>

      {chargement ? (
        <div className="flex justify-center py-12"><Spinner taille={32} /></div>
      ) : produits.length === 0 ? (
        <EtatVide titre="Aucun produit" />
      ) : (
        <div className="carte overflow-hidden">
          <ul className="divide-y divide-gray-100">
            {produits.map((p) => (
              <li key={p.id} className="flex items-center gap-3 p-4">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-gray-100">
                  {p.image_url ? (
                    <img src={urlFichier(p.image_url)} alt={p.nom} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xl text-gray-300">🖼️</div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-semibold text-gray-800">{p.nom}</p>
                    {!p.actif && <Badge classe="bg-gray-100 text-gray-500">Désactivé</Badge>}
                    {p.quantite_stock <= p.seuil_alerte && <Badge classe="bg-amber-100 text-amber-700">Stock bas</Badge>}
                  </div>
                  <p className="text-sm text-gray-500">{p.categorie_nom} · {formaterFCFA(p.prix_vente)}</p>
                  <p className="text-sm text-gray-500">{p.quantite_stock} en stock</p>
                </div>
                {estAdmin && (
                  <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                    <button onClick={() => ouvrirEdition(p)} className="btn-discret px-3 py-2 text-sm">Modifier</button>
                    {p.actif && <button onClick={() => desactiver(p)} className="btn-discret px-3 py-2 text-sm text-red-600">Désactiver</button>}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <Modal ouvert={modalOuvert} onFermer={() => setModalOuvert(false)} titre={edition ? 'Modifier le produit' : 'Nouveau produit'} largeur="max-w-xl">
        <Alerte>{erreur}</Alerte>
        <form onSubmit={enregistrer} className="mt-3 flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">Catégorie</label>
            <select required value={formulaire.categorie_id} onChange={(e) => setFormulaire({ ...formulaire, categorie_id: e.target.value })} className="champ">
              <option value="" disabled>Choisir une catégorie</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">Nom</label>
            <input required value={formulaire.nom} onChange={(e) => setFormulaire({ ...formulaire, nom: e.target.value })} className="champ" />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">Description</label>
            <textarea rows={2} value={formulaire.description} onChange={(e) => setFormulaire({ ...formulaire, description: e.target.value })} className="champ resize-none" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-700">Prix d'achat</label>
              <input type="number" min="0" value={formulaire.prix_achat} onChange={(e) => setFormulaire({ ...formulaire, prix_achat: e.target.value })} className="champ" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-700">Prix de vente</label>
              <input required type="number" min="0" value={formulaire.prix_vente} onChange={(e) => setFormulaire({ ...formulaire, prix_vente: e.target.value })} className="champ" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-700">
                Stock initial {edition && <span className="font-normal text-gray-500">(non modifiable ici)</span>}
              </label>
              <input
                type="number"
                min="0"
                disabled={!!edition}
                value={formulaire.quantite_stock}
                onChange={(e) => setFormulaire({ ...formulaire, quantite_stock: e.target.value })}
                className="champ disabled:bg-gray-100"
              />
              {edition && <p className="mt-1 text-xs text-gray-500">Utilisez la page Stock pour ajuster la quantité.</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-700">Seuil d'alerte</label>
              <input type="number" min="0" value={formulaire.seuil_alerte} onChange={(e) => setFormulaire({ ...formulaire, seuil_alerte: e.target.value })} className="champ" />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">Image</label>
            <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => setFichierImage(e.target.files?.[0] ?? null)} className="champ p-2" />
          </div>

          {edition && (
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <input type="checkbox" checked={formulaire.actif} onChange={(e) => setFormulaire({ ...formulaire, actif: e.target.checked })} className="h-5 w-5 rounded border-gray-300" />
              Produit actif (visible dans le catalogue)
            </label>
          )}

          <button type="submit" disabled={envoiEnCours} className="btn-primaire w-full">
            {envoiEnCours ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </form>
      </Modal>
    </div>
  )
}
