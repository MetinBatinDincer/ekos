import { useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { stations as mockStations } from '../data/mockData';
import StatusBadge from './StatusBadge';

// stations: App.jsx'ten gelen canlı liste; prop gelmezse mock kullanılır
export default function MapPage({ onSelectStation, stations = mockStations }) {
  const [selected, setSelected] = useState(null);
  const center = [40.752, 29.72];

  return (
    <div style={{ width: '100%', boxSizing: 'border-box', padding: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Header */}
      <div style={{
        background: 'linear-gradient(90deg,#1e3a8a,#2563eb)', borderRadius: 12,
        padding: '12px 22px', display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <span style={{ color: 'white', fontWeight: 700, fontSize: 16 }}>İstasyon Haritası</span>
        <span style={{ color: 'rgba(255,255,255,.65)', fontSize: 13 }}>Kocaeli İli</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 20 }}>
          {[['#22c55e','Sorunsuz'],['#eab308','Dikkat'],['#ef4444','Arıza']].map(([c,l]) => (
            <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />
              <span style={{ color: 'rgba(255,255,255,.85)', fontSize: 12 }}>{l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Map + sidebar — both stretch full width */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 290px', gap: 16, alignItems: 'start' }}>

        {/* Map fills all remaining space */}
        <div style={{
          borderRadius: 16, overflow: 'hidden',
          border: '1px solid #bfdbfe',
          boxShadow: '0 2px 12px rgba(37,99,235,.1)',
          height: 'calc(100vh - 210px)',
          minHeight: 500,
        }}>
          <MapContainer center={center} zoom={10} style={{ height: '100%', width: '100%' }}>
            <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {stations.map(s => {
              const color = s.status === 'fault' ? '#ef4444' : s.status === 'risk' ? '#eab308' : '#22c55e';
              return (
                <CircleMarker key={s.id} center={[s.lat, s.lng]}
                  radius={selected?.id === s.id ? 18 : 13}
                  pathOptions={{ fillColor: color, fillOpacity: .88, color: 'white', weight: selected?.id === s.id ? 3 : 2 }}
                  eventHandlers={{ click: () => setSelected(s) }}
                >
                  <Popup>
                    <div style={{ minWidth: 180, fontFamily: 'Inter,sans-serif' }}>
                      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4, color: '#1e293b' }}>{s.name}</div>
                      <div style={{ fontSize: 11, color: '#64748b', marginBottom: 8 }}>{s.address}</div>
                      <div style={{ fontSize: 11, marginBottom: 8 }}>
                        <span style={{ fontWeight: 700, color }}>● {s.statusLabel}</span>
                        {s.faultEta && <span style={{ color: '#ef4444' }}> · {s.faultEta}</span>}
                      </div>
                      <div style={{ fontSize: 11, color: '#64748b', marginBottom: 10 }}>
                        Arıza riski: <strong style={{ color }}>%{s.faultRisk}</strong>
                        {s.energyToday > 0 && ` · ${s.energyToday} kWh bugün`}
                      </div>
                      <button onClick={() => onSelectStation(s)} style={{
                        width: '100%', padding: 7, borderRadius: 8,
                        background: '#2563eb', color: 'white', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700,
                      }}>Detayları Gör</button>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>
        </div>

        {/* Right sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Selected info */}
          {selected ? (
            <div style={{
              background: 'white', borderRadius: 14, padding: 16,
              border: `2px solid ${selected.status === 'fault' ? '#fca5a5' : selected.status === 'risk' ? '#fde68a' : '#bbf7d0'}`,
              boxShadow: '0 2px 12px rgba(37,99,235,.1)',
            }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: '#1e293b', marginBottom: 3 }}>{selected.name}</div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 10 }}>{selected.address}</div>
              <StatusBadge status={selected.status} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12 }}>
                {[
                  { label: 'Arıza Riski', value: `%${selected.faultRisk}`, color: selected.faultRisk >= 70 ? '#ef4444' : selected.faultRisk >= 40 ? '#d97706' : '#16a34a' },
                  { label: 'Bugün', value: selected.energyToday > 0 ? `${selected.energyToday} kWh` : '—', color: '#2563eb' },
                  { label: 'Güç', value: `${selected.power} kW`, color: '#1e293b' },
                  { label: 'Uptime', value: `%${selected.uptime}`, color: '#16a34a' },
                ].map(item => (
                  <div key={item.label} style={{ background: '#f8faff', borderRadius: 8, padding: '8px 10px' }}>
                    <div style={{ fontSize: 10, color: '#94a3b8' }}>{item.label}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: item.color }}>{item.value}</div>
                  </div>
                ))}
              </div>
              {selected.faultEta && (
                <div style={{ marginTop: 10, padding: '8px 10px', borderRadius: 8, background: '#fef2f2', border: '1px solid #fca5a5' }}>
                  <div style={{ fontSize: 11, color: '#dc2626', fontWeight: 700 }}>⚠ {selected.faultEta}</div>
                </div>
              )}
              <button onClick={() => onSelectStation(selected)} style={{
                width: '100%', marginTop: 12, padding: 9, borderRadius: 10,
                background: '#2563eb', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13,
              }}>İstasyon Detayı →</button>
            </div>
          ) : (
            <div style={{ background: '#eff6ff', borderRadius: 14, padding: 20, border: '1px solid #bfdbfe', textAlign: 'center' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>🗺️</div>
              <div style={{ fontSize: 13, color: '#2563eb', fontWeight: 600, marginBottom: 4 }}>Haritada bir istasyona tıklayın</div>
              <div style={{ fontSize: 11, color: '#93c5fd' }}>Detay bilgileri burada görünecek</div>
            </div>
          )}

          {/* Station list */}
          <div style={{ background: 'white', borderRadius: 14, border: '1px solid #e0e7ff', overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', fontWeight: 700, fontSize: 12, color: '#1e40af' }}>
              Tüm İstasyonlar
            </div>
            {stations.map((s, i) => {
              const color = s.status === 'fault' ? '#ef4444' : s.status === 'risk' ? '#eab308' : '#22c55e';
              const isActive = selected?.id === s.id;
              return (
                <div key={s.id} onClick={() => setSelected(s)} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px',
                  borderBottom: i < stations.length - 1 ? '1px solid #f8faff' : 'none',
                  cursor: 'pointer',
                  background: isActive ? '#eff6ff' : 'transparent',
                  borderLeft: `3px solid ${isActive ? color : 'transparent'}`,
                  transition: 'all .12s',
                }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#f8faff'; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                >
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 12, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {s.name}
                    </div>
                    <div style={{ fontSize: 10, color: '#94a3b8' }}>{s.location}</div>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 800, color, flexShrink: 0 }}>%{s.faultRisk}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
