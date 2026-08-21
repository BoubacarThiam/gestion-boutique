import { useEffect, useState } from 'react'
import { clientsApi } from '../../api/clients'
import Spinner from '../../components/ui/Spinner'
import EtatVide from '../../components/ui/EtatVide'
import Modal from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'
import { formaterFCFA, formaterDateCourte } from '../../utils/format'
import { infosStatut } from '../../utils/statuts'

export default function Clients() {
  const [clients, setClients] = useState([])
  const [recherche, setRecherche] = useState('')
  const [chargement, setChargement] = useState(true)
  const [clientSelectionne, setClientSelectionne] = useState(null)
  const [detail, setDetail] = useState(null)

  useEffect(() => {
    setChargement(true)
    const t = setTimeout(() => {
      clientsApi.liste(recherche.trim() ? { q: recherche.trim() } : {}).then((d) => setClients(d.clients)).finally(() => setChargement(false))
    }, 250)
    return () => clearTimeout(t)
  }, [recherche])

  function ouvrirDetail(client) {
    setClientSelectionne(client)
    setDetail(null)
    clientsApi.detail(client.id).then(setDetail)
  }

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-bold text-gray-900">Clients</h1>

      <input value={recherche} onChange={(e) => setRecherche(e.target.value)} placeholder="Rechercher par nom ou téléphone..." className="champ" />

      {chargement ? (
        <div className="flex justify-center py-12"><Spinner taille={32} /></div>
      ) : clients.length === 0 ? (
        <EtatVide titre="Aucun client" description="Les clients apparaissent automatiquement dès leur première commande." />
      ) : (
        <div className="carte overflow-hidden">
          <ul className="divide-y divide-gray-100">
            {clients.map((c) => (
              <li key={c.id}>
                <button onClick={() => ouvrirDetail(c)} className="flex w-full items-center justify-between gap-3 p-4 text-left hover:bg-gray-50">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-800">{c.nom}</p>
                    <p className="text-sm text-gray-500">{c.telephone}</p>
                    {c.adresse && <p className="truncate text-sm text-gray-500">📍 {c.adresse}</p>}
                  </div>
                  <Badge classe="bg-marque-50 text-marque-700">{c.nombre_commandes} commande(s)</Badge>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Modal ouvert={!!clientSelectionne} onFermer={() => setClientSelectionne(null)} titre={clientSelectionne?.nom || ''}>
        {!detail ? (
          <div className="flex justify-center py-8"><Spinner taille={28} /></div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="text-sm text-gray-600">
              <p>📞 {detail.client.telephone}</p>
              {detail.client.adresse && <p>📍 {detail.client.adresse}</p>}
            </div>

            <h3 className="font-bold text-gray-800">Historique des commandes</h3>
            {detail.commandes.length === 0 ? (
              <p className="text-sm text-gray-500">Aucune commande.</p>
            ) : (
              <ul className="flex flex-col divide-y divide-gray-100">
                {detail.commandes.map((cmd) => (
                  <li key={cmd.id} className="flex items-center justify-between py-2">
                    <div>
                      <p className="font-medium text-gray-800">{cmd.numero_commande}</p>
                      <p className="text-xs text-gray-500">{formaterDateCourte(cmd.created_at)}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge classe={infosStatut(cmd.statut).classe}>{infosStatut(cmd.statut).libelle}</Badge>
                      <p className="text-sm font-semibold">{formaterFCFA(cmd.total)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
