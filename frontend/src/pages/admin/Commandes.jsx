import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { commandesApi } from '../../api/commandes'
import Spinner from '../../components/ui/Spinner'
import EtatVide from '../../components/ui/EtatVide'
import Badge from '../../components/ui/Badge'
import { formaterFCFA, formaterDate } from '../../utils/format'
import { STATUTS_COMMANDE, infosStatut } from '../../utils/statuts'

/** Liste des commandes, filtrable par statut. */
export default function Commandes() {
  const [searchParams, setSearchParams] = useSearchParams()
  const statut = searchParams.get('statut') || ''
  const [commandes, setCommandes] = useState([])
  const [chargement, setChargement] = useState(true)

  useEffect(() => {
    setChargement(true)
    commandesApi
      .liste(statut ? { statut } : {})
      .then((d) => setCommandes(d.commandes))
      .finally(() => setChargement(false))
  }, [statut])

  function changerFiltre(nouveauStatut) {
    setSearchParams(nouveauStatut ? { statut: nouveauStatut } : {})
  }

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-bold text-gray-900">Commandes</h1>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => changerFiltre('')}
          className={`rounded-full px-4 py-2 text-sm font-semibold ${!statut ? 'bg-marque-600 text-white' : 'bg-gray-100 text-gray-700'}`}
        >
          Toutes
        </button>
        {Object.entries(STATUTS_COMMANDE).map(([cle, info]) => (
          <button
            key={cle}
            onClick={() => changerFiltre(cle)}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${statut === cle ? 'bg-marque-600 text-white' : 'bg-gray-100 text-gray-700'}`}
          >
            {info.libelle}
          </button>
        ))}
      </div>

      {chargement ? (
        <div className="flex justify-center py-12"><Spinner taille={32} /></div>
      ) : commandes.length === 0 ? (
        <EtatVide titre="Aucune commande" description="Aucune commande ne correspond à ce filtre." />
      ) : (
        <div className="carte overflow-hidden">
          <ul className="divide-y divide-gray-100">
            {commandes.map((c) => (
              <li key={c.id}>
                <Link to={`/gestion/commandes/${c.id}`} className="flex items-center justify-between gap-3 p-4 hover:bg-gray-50">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-800">{c.numero_commande}</p>
                    <p className="truncate text-sm text-gray-500">{c.client_nom} · {c.client_telephone}</p>
                    <p className="text-xs text-gray-400">{formaterDate(c.created_at)}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <Badge classe={infosStatut(c.statut).classe}>{infosStatut(c.statut).libelle}</Badge>
                    <p className="font-bold text-gray-800">{formaterFCFA(c.total)}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
