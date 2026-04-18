import { currentUser } from '../data/mockData';
import { Settings, User } from 'lucide-react';

// lastUpdated: son başarılı API çekiminin zamanı
// apiError: bağlantı hatası var mı
export default function Header({ lastUpdated, apiError }) {
  return (
    <header style={{
      background: 'white',
      borderBottom: '1px solid #dbeafe',
      padding: '12px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      boxShadow: '0 1px 4px rgba(37,99,235,0.07)',
    }}>
      {/* User info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 48, height: 48, borderRadius: '50%',
          background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '2px solid #bfdbfe',
          flexShrink: 0,
        }}>
          <User size={22} color="white" />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#1e293b' }}>{currentUser.name}</div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 1 }}>{currentUser.role} · {currentUser.company}</div>
        </div>
        <button style={{
          width: 28, height: 28, borderRadius: '50%',
          background: '#eff6ff', border: '1px solid #bfdbfe',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', marginLeft: 4,
        }}>
          <Settings size={14} color="#3b82f6" />
        </button>
      </div>

      {/* Logo */}
      <div style={{
        padding: '8px 28px',
        border: '2px solid #bfdbfe',
        borderRadius: 10,
        background: 'white',
        minWidth: 120,
        textAlign: 'center',
      }}>
        <span style={{ fontWeight: 800, fontSize: 18, color: '#1e40af', letterSpacing: 2 }}>E-KOS</span>
      </div>

      {/* Canlı veri bağlantı durumu */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 8, height: 8, borderRadius: '50%',
          background: apiError ? '#ef4444' : '#22c55e',
          boxShadow: apiError ? 'none' : '0 0 0 3px rgba(34,197,94,0.25)',
        }} className={apiError ? '' : 'pulse-dot'} />
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: apiError ? '#ef4444' : '#16a34a' }}>
            {apiError ? 'API Bağlantı Hatası' : 'Canlı Veri'}
          </div>
          {lastUpdated && (
            <div style={{ fontSize: 10, color: '#94a3b8' }}>
              Son güncelleme: {lastUpdated.toLocaleTimeString('tr-TR')}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
