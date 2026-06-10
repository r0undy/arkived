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
import StorefrontErrorBoundary from './components/StorefrontErrorBoundary';
import HomePage from './pages/HomePage';
import CatalogPage from './pages/CatalogPage';
import EquipmentDetailPage from './pages/EquipmentDetailPage';
import TrackRequestPage from './pages/TrackRequestPage';
import QuotePage from './pages/QuotePage';
import NotFoundPage from './pages/NotFoundPage';
import TenantDebugger from './components/TenantDebugger';
import TenantLoadingScreen from './components/TenantLoadingScreen';

const shouldShowTenantDebugger = () => (
  import.meta.env.DEV && import.meta.env.VITE_ENABLE_TENANT_DEBUGGER === 'true'
);

function App() {
  const tenantState = useTenant();
  const [equipment, setEquipment] = useState([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [catalogError, setCatalogError] = useState('');
  const showTenantDebugger = shouldShowTenantDebugger();

  useEffect(() => {
    if (!tenantState.tenant) return;
    setLoadingCatalog(true);
    setCatalogError('');
    storefrontApi
      .catalog(tenantState.tenant.slug)
      .then((result) => setEquipment(result.data || []))
      .catch((error) => {
        setEquipment([]);
        setCatalogError(error.message || 'Failed to load catalog.');
      })
      .finally(() => setLoadingCatalog(false));
  }, [tenantState.tenant]);

  if (tenantState.loading) {
    return (
      <>
        <TenantLoadingScreen />
        {showTenantDebugger ? (
          <TenantDebugger activeSlug={tenantState.slug} onChange={tenantState.setSlug} />
        ) : null}
      </>
    );
  }

  if (tenantState.error || !tenantState.tenant) {
    return (
      <>
        <NotFoundPage title="Tenant not found" message="This storefront slug does not exist." />
        {showTenantDebugger ? (
          <TenantDebugger activeSlug={tenantState.slug} onChange={tenantState.setSlug} />
        ) : null}
      </>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<StorefrontLayout tenant={tenantState.tenant} />}>
          <Route path="/" element={<HomePage equipment={equipment} tenant={tenantState.tenant} catalogError={catalogError} />} />
          <Route path="/catalog" element={<CatalogPage equipment={equipment} tenant={tenantState.tenant} catalogError={catalogError} />} />
          <Route
            path="/catalog/:id"
            element={
              <CatalogDetailRoute
                equipmentList={equipment}
                equipment={equipment}
                slug={tenantState.tenant.slug}
                tenant={tenantState.tenant}
                loadingCatalog={loadingCatalog}
                catalogError={catalogError}
              />
            }
          />
          <Route path="/track" element={<TrackRequestPage tenant={tenantState.tenant} />} />
          <Route path="/quote" element={<QuotePage tenant={tenantState.tenant} />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      {showTenantDebugger ? (
        <TenantDebugger activeSlug={tenantState.slug} onChange={tenantState.setSlug} />
      ) : null}
    </BrowserRouter>
  );
}

function CatalogDetailRoute({ equipment, equipmentList, slug, tenant, loadingCatalog, catalogError }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(() => equipment.find((entry) => entry.id === id) || null);
  const [itemError, setItemError] = useState('');

  useEffect(() => {
    setItemError('');
    const fromCatalog = equipment.find((entry) => entry.id === id);
    if (fromCatalog) {
      setItem(fromCatalog);
      return;
    }

    storefrontApi
      .equipment(slug, id)
      .then((result) => setItem(result.data || null))
      .catch((error) => {
        setItemError(error.message || 'Failed to load equipment details.');
      });
  }, [equipment, id, navigate, slug]);

  if (loadingCatalog && !item) {
    return <div className="text-slate-600">Loading item...</div>;
  }

  if (catalogError && !item) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {catalogError}
      </div>
    );
  }

  if (itemError && !item) {
    return (
      <div className="space-y-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        <p>{itemError}</p>
        <button
          className="rounded-md border border-red-300 bg-white px-3 py-2 text-xs font-semibold text-red-700"
          onClick={() => navigate('/catalog', { replace: true })}
          type="button"
        >
          Back to catalog
        </button>
      </div>
    );
  }

  return <EquipmentDetailPage equipment={equipmentList} item={item} tenant={tenant} />;
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <StorefrontErrorBoundary>
      <App />
    </StorefrontErrorBoundary>
  </React.StrictMode>
);
