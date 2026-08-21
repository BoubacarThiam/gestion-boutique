import { Route, Routes } from 'react-router-dom'
import LayoutPublic from './components/layout/LayoutPublic'
import LayoutAdmin from './components/layout/LayoutAdmin'
import ProtectedRoute from './components/layout/ProtectedRoute'

import Catalogue from './pages/public/Catalogue'
import ProduitDetail from './pages/public/ProduitDetail'
import Panier from './pages/public/Panier'
import ValiderCommande from './pages/public/ValiderCommande'
import Confirmation from './pages/public/Confirmation'

import Connexion from './pages/admin/Connexion'
import TableauDeBord from './pages/admin/TableauDeBord'
import Commandes from './pages/admin/Commandes'
import CommandeDetail from './pages/admin/CommandeDetail'
import Livraisons from './pages/admin/Livraisons'
import Produits from './pages/admin/Produits'
import Categories from './pages/admin/Categories'
import Stock from './pages/admin/Stock'
import Clients from './pages/admin/Clients'
import Utilisateurs from './pages/admin/Utilisateurs'
import Rapports from './pages/admin/Rapports'

export default function App() {
  return (
    <Routes>
      {/* --- Site public (catalogue, panier, commande) --- */}
      <Route element={<LayoutPublic />}>
        <Route index element={<Catalogue />} />
        <Route path="produit/:id" element={<ProduitDetail />} />
        <Route path="panier" element={<Panier />} />
        <Route path="commande" element={<ValiderCommande />} />
        <Route path="confirmation" element={<Confirmation />} />
      </Route>

      {/* --- Authentification gestion --- */}
      <Route path="gestion/connexion" element={<Connexion />} />

      {/* --- Espace gestion (admin + employé) --- */}
      <Route element={<ProtectedRoute />}>
        <Route path="gestion" element={<LayoutAdmin />}>
          <Route index element={<TableauDeBord />} />
          <Route path="commandes" element={<Commandes />} />
          <Route path="commandes/:id" element={<CommandeDetail />} />
          <Route path="livraisons" element={<Livraisons />} />
          <Route path="produits" element={<Produits />} />
          <Route path="categories" element={<Categories />} />
          <Route path="stock" element={<Stock />} />
          <Route path="clients" element={<Clients />} />

          {/* --- Réservé à l'admin --- */}
          <Route element={<ProtectedRoute rolesAutorises={['admin']} />}>
            <Route path="utilisateurs" element={<Utilisateurs />} />
            <Route path="rapports" element={<Rapports />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<IntrouvablePage />} />
    </Routes>
  )
}

function IntrouvablePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-2 p-6 text-center">
      <p className="text-4xl">🧭</p>
      <p className="text-xl font-bold">Page introuvable</p>
      <a href="/" className="btn-primaire mt-2">Retour à l'accueil</a>
    </div>
  )
}
