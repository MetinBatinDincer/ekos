// E-KOS Ana Uygulama
// Canlı veri hook'u burada başlatılır; tüm sayfalara prop olarak iletilir.

import { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import StationsPage from './components/StationsPage';
import MapPage from './components/MapPage';
import ReportsPage from './components/ReportsPage';
import FaultDetectionPage from './components/FaultDetectionPage';
import ForecastPage from './components/ForecastPage';
import StationDetail from './components/StationDetail';
import useEkosData from './hooks/useEkosData';
import 'leaflet/dist/leaflet.css';
import './index.css';

export default function App() {
  const [activePage, setActivePage] = useState('dashboard');
  const [selectedStation, setSelectedStation] = useState(null);

  // 5 saniyede bir API'den taze veri çeker
  const { liveStations, anomalies, chargeSessions, lastUpdated, apiError } = useEkosData();

  const handlePageChange = (page) => {
    setActivePage(page);
    setSelectedStation(null);
  };

  const renderContent = () => {
    if (selectedStation) {
      // Detay sayfasında seçili istasyonu her yenilemede güncelle
      const fresh = liveStations.find(s => s.id === selectedStation.id) ?? selectedStation;
      return <StationDetail station={fresh} onBack={() => setSelectedStation(null)} />;
    }
    switch (activePage) {
      case 'dashboard': return <Dashboard onSelectStation={setSelectedStation} stations={liveStations} anomalies={anomalies} />;
      case 'stations':  return <StationsPage onSelectStation={setSelectedStation} stations={liveStations} />;
      case 'map':       return <MapPage onSelectStation={setSelectedStation} stations={liveStations} />;
      case 'faults':    return <FaultDetectionPage anomalies={anomalies} />;
      case 'forecast':  return <ForecastPage stations={liveStations} />;
      case 'reports':   return <ReportsPage />;
      default:          return <Dashboard onSelectStation={setSelectedStation} stations={liveStations} anomalies={anomalies} />;
    }
  };

  return (
    <div style={{ display: 'flex', width: '100vw', minHeight: '100vh', background: '#f0f4ff', overflow: 'hidden' }}>

      <Sidebar activePage={activePage} onPageChange={handlePageChange} />

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <Header lastUpdated={lastUpdated} apiError={apiError} />
        <main style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', width: '100%' }}>
          {renderContent()}
        </main>
      </div>

      {/* DURUM BİLDİR */}
      <button style={{
        position: 'fixed', bottom: 20, right: 24, zIndex: 200,
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 18px', borderRadius: 12, cursor: 'pointer',
        background: 'linear-gradient(135deg, #1e3a8a, #2563eb)',
        color: 'white', border: 'none',
        fontWeight: 700, fontSize: 13, letterSpacing: 0.4,
        boxShadow: '0 4px 18px rgba(37,99,235,0.45)',
      }}>
        DURUM BİLDİR
        <span style={{
          width: 22, height: 22, borderRadius: '50%',
          background: '#ef4444', color: 'white',
          fontSize: 12, fontWeight: 900,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>!</span>
      </button>
    </div>
  );
}
