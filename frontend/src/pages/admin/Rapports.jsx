import { useEffect, useState } from 'react'
import { rapportsApi } from '../../api/rapports'
import Spinner from '../../components/ui/Spinner'
import CarteStat from '../../components/ui/CarteStat'
import EtatVide from '../../components/ui/EtatVide'
import { formaterFCFA, formaterDateCourte, dateISOAujourdhui } from '../../utils/format'

function ilYA(jours) {
  const d = new Date()
  d.setDate(d.getDate() - jours)
  return d.toISOString().slice(0, 10)
}

/** Rapports : ventes par période, produits les plus vendus, valeur du stock. Admin uniquement. */
export default function Rapports() {
  const [debut, setDebut] = useState(ilYA(30))
  const [fin, setFin] = useState(dateISOAujourdhui())
  const [ventes, setVentes] = useState(null)
  const [topProduits, setTopProduits] = useState(null)
  const [valeurStock, setValeurStock] = useState(null)
  const [chargement, setChargement] = useState(true)

  function charger() {
    setChargement(true)
    Promise.all([
      rapportsApi.ventes({ debut, fin }),
      rapportsApi.topProduits({ debut, fin, limite: 8 }),
      rapportsApi.valeurStock(),
    ])
      .then(([v, t, s]) => {
        setVentes(v)
        setTopProduits(t.produits)
        setValeurStock(s.valeur_stock)
      })
      .finally(() => setChargement(false))
  }

  useEffect(charger, []) // eslint-disable-line react-hooks/exhaustive-deps

  const maxJour = ventes?.par_jour.reduce((m, j) => Math.max(m, Number(j.chiffre_affaires)), 0) || 1

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-gray-900">Rapports</h1>

      <div className="carte flex flex-wrap items-end gap-3 p-4">
        <div>
          <label className="mb-1 block text-sm font-semibold text-gray-700">Du</label>
          <input type="date" value={debut} onChange={(e) => setDebut(e.target.value)} className="champ" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-gray-700">Au</label>
          <input type="date" value={fin} onChange={(e) => setFin(e.target.value)} className="champ" />
        </div>
        <button onClick={charger} className="btn-primaire">Actualiser</button>
      </div>

      {chargement ? (
        <div className="flex justify-center py-12"><Spinner taille={32} /></div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <CarteStat icone="✅" titre="Commandes livrées" valeur={ventes.total.nombre_commandes} sousTitre="sur la période" />
            <CarteStat icone="💰" titre="Chiffre d'affaires" valeur={formaterFCFA(ventes.total.chiffre_affaires)} sousTitre="sur la période" accent="text-marque-700" />
            <CarteStat icone="📦" titre="Valeur du stock (achat)" valeur={formaterFCFA(valeurStock.valeur_achat)} sousTitre={`${valeurStock.unites_en_stock} unités`} />
            <CarteStat icone="💹" titre="Valeur du stock (vente)" valeur={formaterFCFA(valeurStock.valeur_vente_potentielle)} sousTitre="potentiel si tout vendu" />
          </div>

          <section className="carte p-4">
            <h2 className="mb-4 font-bold text-gray-800">Ventes par jour</h2>
            {ventes.par_jour.length === 0 ? (
              <EtatVide titre="Aucune vente livrée sur cette période" />
            ) : (
              <div className="flex items-end gap-2 overflow-x-auto pb-2" style={{ minHeight: 140 }}>
                {ventes.par_jour.map((j) => (
                  <div key={j.jour} className="flex shrink-0 flex-col items-center gap-1" style={{ width: 44 }}>
                    <div className="flex h-24 w-full items-end">
                      <div
                        className="w-full rounded-t-md bg-marque-500"
                        style={{ height: `${Math.max(4, (Number(j.chiffre_affaires) / maxJour) * 100)}%` }}
                        title={formaterFCFA(j.chiffre_affaires)}
                      />
                    </div>
                    <span className="text-[10px] text-gray-500">{formaterDateCourte(j.jour)}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="carte p-4">
            <h2 className="mb-3 font-bold text-gray-800">Produits les plus vendus</h2>
            {topProduits.length === 0 ? (
              <EtatVide titre="Aucune vente sur cette période" />
            ) : (
              <ul className="flex flex-col divide-y divide-gray-100">
                {topProduits.map((p, i) => (
                  <li key={p.id} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-marque-50 text-sm font-bold text-marque-700">{i + 1}</span>
                      <p className="font-medium text-gray-800">{p.nom}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-800">{p.quantite_vendue} vendu(s)</p>
                      <p className="text-sm text-gray-500">{formaterFCFA(p.chiffre_affaires)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  )
}
