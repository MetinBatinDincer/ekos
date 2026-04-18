import { LayoutDashboard, MapPin, Map, BarChart2, AlertTriangle, TrendingUp } from 'lucide-react';

const navItems = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Ana Panel' },
  { id: 'stations',  icon: MapPin,          label: 'İstasyonlar' },
  { id: 'map',       icon: Map,             label: 'Harita' },
  { id: 'faults',    icon: AlertTriangle,   label: 'Arıza Tespiti' },
  { id: 'forecast',  icon: TrendingUp,      label: 'Tahmin' },
  { id: 'reports',   icon: BarChart2,        label: 'Raporlar' },
];

export default function Sidebar({ activePage, onPageChange }) {
  return (
    <aside
      style={{
        width: 64,
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #1e3a8a 0%, #1e40af 50%, #2563eb 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: 24,
        paddingBottom: 24,
        gap: 8,
        position: 'sticky',
        top: 0,
        flexShrink: 0,
        zIndex: 50,
      }}
    >
      {/* Logo mark */}
      <div style={{
        width: 40, height: 40, borderRadius: 12,
        background: 'rgba(255,255,255,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 16,
      }}>
        <span style={{ color: 'white', fontSize: 16, fontWeight: 800 }}>E</span>
      </div>

      {navItems.map(item => {
        const Icon = item.icon;
        const isActive = activePage === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onPageChange(item.id)}
            title={item.label}
            style={{
              width: 44, height: 44, borderRadius: 12,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: isActive ? 'rgba(255,255,255,0.25)' : 'transparent',
              border: isActive ? '1px solid rgba(255,255,255,0.4)' : '1px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              color: isActive ? 'white' : 'rgba(255,255,255,0.6)',
            }}
            onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
            onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
          >
            <Icon size={20} />
          </button>
        );
      })}
    </aside>
  );
}
