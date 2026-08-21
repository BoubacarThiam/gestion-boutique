import { useEffect, useState } from 'react'
import { utilisateursApi } from '../../api/utilisateurs'
import { ErreurApi } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import Spinner from '../../components/ui/Spinner'
import EtatVide from '../../components/ui/EtatVide'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import Alerte from '../../components/ui/Alerte'

const VIDE = { nom: '', telephone: '', email: '', mot_de_passe: '', role: 'employe', actif: true }

/** Gestion des comptes internes (admin / employé) — réservée à l'admin. */
export default function Utilisateurs() {
  const { utilisateur: moi } = useAuth()
  const [liste, setListe] = useState([])
  const [chargement, setChargement] = useState(true)
  const [modalOuvert, setModalOuvert] = useState(false)
  const [edition, setEdition] = useState(null)
  const [formulaire, setFormulaire] = useState(VIDE)
  const [erreur, setErreur] = useState('')
  const [envoiEnCours, setEnvoiEnCours] = useState(false)

  function charger() {
    setChargement(true)
    utilisateursApi.liste().then((d) => setListe(d.utilisateurs)).finally(() => setChargement(false))
  }

  useEffect(charger, [])

  function ouvrirCreation() {
    setEdition(null)
    setFormulaire(VIDE)
    setErreur('')
    setModalOuvert(true)
  }

  function ouvrirEdition(u) {
    setEdition(u)
    setFormulaire({ nom: u.nom, telephone: u.telephone, email: u.email || '', mot_de_passe: '', role: u.role, actif: !!u.actif })
    setErreur('')
    setModalOuvert(true)
  }

  async function enregistrer(e) {
    e.preventDefault()
    setEnvoiEnCours(true)
    setErreur('')
    try {
      const donnees = { ...formulaire }
      if (edition && !donnees.mot_de_passe) delete donnees.mot_de_passe // ne pas changer le mdp si laissé vide
      if (edition) {
        await utilisateursApi.modifier(edition.id, donnees)
      } else {
        await utilisateursApi.creer(donnees)
      }
      setModalOuvert(false)
      charger()
    } catch (err) {
      setErreur(err instanceof ErreurApi ? err.message : 'Erreur lors de l\'enregistrement.')
    } finally {
      setEnvoiEnCours(false)
    }
  }

  async function desactiver(u) {
    if (!window.confirm(`Désactiver le compte de ${u.nom} ?`)) return
    try {
      await utilisateursApi.supprimer(u.id)
      charger()
    } catch (err) {
      alert(err instanceof ErreurApi ? err.message : 'Erreur lors de la désactivation.')
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Utilisateurs</h1>
        <button onClick={ouvrirCreation} className="btn-primaire">+ Nouveau</button>
      </div>

      {chargement ? (
        <div className="flex justify-center py-12"><Spinner taille={32} /></div>
      ) : liste.length === 0 ? (
        <EtatVide titre="Aucun utilisateur" />
      ) : (
        <div className="carte overflow-hidden">
          <ul className="divide-y divide-gray-100">
            {liste.map((u) => (
              <li key={u.id} className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-800">{u.nom}</p>
                    <Badge classe={u.role === 'admin' ? 'bg-marque-100 text-marque-700' : 'bg-gray-100 text-gray-700'}>
                      {u.role === 'admin' ? 'Propriétaire' : 'Employé'}
                    </Badge>
                    {!u.actif && <Badge classe="bg-red-100 text-red-600">Désactivé</Badge>}
                  </div>
                  <p className="text-sm text-gray-500">{u.telephone}{u.email ? ` · ${u.email}` : ''}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button onClick={() => ouvrirEdition(u)} className="btn-discret px-3 py-2 text-sm">Modifier</button>
                  {u.id !== moi.id && u.actif ? (
                    <button onClick={() => desactiver(u)} className="btn-discret px-3 py-2 text-sm text-red-600">Désactiver</button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Modal ouvert={modalOuvert} onFermer={() => setModalOuvert(false)} titre={edition ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}>
        <Alerte>{erreur}</Alerte>
        <form onSubmit={enregistrer} className="mt-3 flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">Nom complet</label>
            <input required value={formulaire.nom} onChange={(e) => setFormulaire({ ...formulaire, nom: e.target.value })} className="champ" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">Téléphone</label>
            <input required value={formulaire.telephone} onChange={(e) => setFormulaire({ ...formulaire, telephone: e.target.value })} className="champ" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">Email (facultatif)</label>
            <input type="email" value={formulaire.email} onChange={(e) => setFormulaire({ ...formulaire, email: e.target.value })} className="champ" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">
              Mot de passe {edition && <span className="font-normal text-gray-400">(laisser vide pour ne pas changer)</span>}
            </label>
            <input type="password" value={formulaire.mot_de_passe} onChange={(e) => setFormulaire({ ...formulaire, mot_de_passe: e.target.value })} className="champ" placeholder="Minimum 6 caractères" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">Rôle</label>
            <div className="flex gap-2">
              <button type="button" onClick={() => setFormulaire({ ...formulaire, role: 'employe' })}
                className={`btn flex-1 ${formulaire.role === 'employe' ? 'bg-marque-600 text-white' : 'bg-gray-100 text-gray-700'}`} disabled={edition?.id === moi.id}>
                Employé
              </button>
              <button type="button" onClick={() => setFormulaire({ ...formulaire, role: 'admin' })}
                className={`btn flex-1 ${formulaire.role === 'admin' ? 'bg-marque-600 text-white' : 'bg-gray-100 text-gray-700'}`} disabled={edition?.id === moi.id}>
                Propriétaire (admin)
              </button>
            </div>
          </div>
          {edition && edition.id !== moi.id && (
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <input type="checkbox" checked={formulaire.actif} onChange={(e) => setFormulaire({ ...formulaire, actif: e.target.checked })} className="h-5 w-5 rounded border-gray-300" />
              Compte actif
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
