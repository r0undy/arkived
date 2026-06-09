import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  BrowserRouter,
  Route,
  Routes,
  useNavigate,
  useParams
} from 'react-router-dom';

import './index.css';
import { useTenant } from './hooks/useTenant';
import { storefrontApi } from './lib/api';
import StorefrontLayout from './layouts/StorefrontLayout';
import HomePage from './pages/HomePage';
import CatalogPage from './pages/CatalogPage';
import EquipmentDetailPage from './pages/EquipmentDetailPage';
import NotFoundPage from './pages/NotFoundPage';
import TenantDebugger from './components/TenantDebugger';
import TenantLoadingScreen from './components/TenantLoadingScreen';

function App() {
  const tenantState = useTenant();
  const [equipment, setEquipment] = useState([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);

  useEffect(() => {
    if (!tenantState.tenant) return;
    setLoadingCatalog(true);
    storefrontApi
      .catalog(tenantState.tenant.slug)
      .then((result) => setEquipment(result.data || []))
      .catch(() => setEquipment([]))
      .finally(() => setLoadingCatalog(false));
  }, [tenantState.tenant]);

  if (tenantState.loading) {
    return <TenantLoadingScreen />;
  }

  if (tenantState.error || !tenantState.tenant) {
    return <NotFoundPage title="Tenant not found" message="This storefront slug does not exist." />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<StorefrontLayout tenant={tenantState.tenant} />}>
          <Route path="/" element={<HomePage tenant={tenantState.tenant} />} />
          <Route path="/catalog" element={<CatalogPage equipment={equipment} />} />
          <Route
            path="/catalog/:id"
            element={
              <CatalogDetailRoute
                equipment={equipment}
                slug={tenantState.tenant.slug}
                loadingCatalog={loadingCatalog}
              />
            }
          />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      {import.meta.env.DEV ? (
        <TenantDebugger activeSlug={tenantState.slug} onChange={tenantState.setSlug} />
      ) : null}
    </BrowserRouter>
  );
}

function CatalogDetailRoute({ equipment, slug, loadingCatalog }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(() => equipment.find((entry) => entry.id === id) || null);

  useEffect(() => {
    const fromCatalog = equipment.find((entry) => entry.id === id);
    if (fromCatalog) {
      setItem(fromCatalog);
      return;
    }

    storefrontApi
      .equipment(slug, id)
      .then((result) => setItem(result.data || null))
      .catch(() => navigate('/catalog', { replace: true }));
  }, [equipment, id, navigate, slug]);

  if (loadingCatalog && !item) {
    return <div className="text-slate-600">Loading item...</div>;
  }

  return <EquipmentDetailPage item={item} />;
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
