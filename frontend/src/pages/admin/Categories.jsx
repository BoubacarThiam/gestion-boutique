import { useEffect, useState } from 'react'
import { categoriesApi } from '../../api/categories'
import { ErreurApi } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import Spinner from '../../components/ui/Spinner'
import EtatVide from '../../components/ui/EtatVide'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import Alerte from '../../components/ui/Alerte'

const VIDE = { nom: '', description: '', actif: true }

export default function Categories() {
  const { estAdmin } = useAuth()
  const [categories, setCategories] = useState([])
  const [chargement, setChargement] = useState(true)
  const [modalOuvert, setModalOuvert] = useState(false)
  const [edition, setEdition] = useState(null) // catégorie en cours d'édition, ou null = création
  const [formulaire, setFormulaire] = useState(VIDE)
  const [erreur, setErreur] = useState('')
  const [envoiEnCours, setEnvoiEnCours] = useState(false)

  function charger() {
    setChargement(true)
    categoriesApi.liste().then((d) => setCategories(d.categories)).finally(() => setChargement(false))
  }

  useEffect(charger, [])

  function ouvrirCreation() {
    setEdition(null)
    setFormulaire(VIDE)
    setErreur('')
    setModalOuvert(true)
  }

  function ouvrirEdition(cat) {
    setEdition(cat)
    setFormulaire({ nom: cat.nom, description: cat.description || '', actif: !!cat.actif })
    setErreur('')
    setModalOuvert(true)
  }

  async function enregistrer(e) {
    e.preventDefault()
    setEnvoiEnCours(true)
    setErreur('')
    try {
      if (edition) {
        await categoriesApi.modifier(edition.id, formulaire)
      } else {
        await categoriesApi.creer(formulaire)
      }
      setModalOuvert(false)
      charger()
    } catch (err) {
      setErreur(err instanceof ErreurApi ? err.message : 'Erreur lors de l\'enregistrement.')
    } finally {
      setEnvoiEnCours(false)
    }
  }

  async function desactiver(cat) {
    if (!window.confirm(`Désactiver la catégorie « ${cat.nom} » ? Elle n'apparaîtra plus dans le catalogue.`)) return
    await categoriesApi.supprimer(cat.id)
    charger()
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Catégories</h1>
        {estAdmin && <button onClick={ouvrirCreation} className="btn-primaire">+ Nouvelle</button>}
      </div>

      {chargement ? (
        <div className="flex justify-center py-12"><Spinner taille={32} /></div>
      ) : categories.length === 0 ? (
        <EtatVide titre="Aucune catégorie" />
      ) : (
        <div className="carte overflow-hidden">
          <ul className="divide-y divide-gray-100">
            {categories.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-800">{c.nom}</p>
                    {!c.actif && <Badge classe="bg-gray-100 text-gray-500">Désactivée</Badge>}
                  </div>
                  {c.description && <p className="truncate text-sm text-gray-500">{c.description}</p>}
                </div>
                {estAdmin && (
                  <div className="flex shrink-0 gap-2">
                    <button onClick={() => ouvrirEdition(c)} className="btn-discret px-3 py-2 text-sm">Modifier</button>
                    {c.actif ? (
                      <button onClick={() => desactiver(c)} className="btn-discret px-3 py-2 text-sm text-red-600">Désactiver</button>
                    ) : null}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <Modal ouvert={modalOuvert} onFermer={() => setModalOuvert(false)} titre={edition ? 'Modifier la catégorie' : 'Nouvelle catégorie'}>
        <Alerte>{erreur}</Alerte>
        <form onSubmit={enregistrer} className="mt-3 flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">Nom</label>
            <input required value={formulaire.nom} onChange={(e) => setFormulaire({ ...formulaire, nom: e.target.value })} className="champ" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">Description</label>
            <textarea rows={2} value={formulaire.description} onChange={(e) => setFormulaire({ ...formulaire, description: e.target.value })} className="champ resize-none" />
          </div>
          {edition && (
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <input type="checkbox" checked={formulaire.actif} onChange={(e) => setFormulaire({ ...formulaire, actif: e.target.checked })} className="h-5 w-5 rounded border-gray-300" />
              Catégorie active (visible dans le catalogue)
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
