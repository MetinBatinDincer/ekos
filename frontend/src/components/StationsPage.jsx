import { useState } from 'react';
import { Search, ChevronRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { stations as mockStations, stationEnergyHistory } from '../data/mockData';
import StatusBadge from './StatusBadge';

const days7 = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

// stations: App.jsx'ten gelen canlı liste; prop gelmezse mock kullanılır
export default function StationsPage({ onSelectStation, stations = mockStations }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const filtered = stations.filter(s =>
    (s.name.toLowerCase().includes(search.toLowerCase()) || s.location.toLowerCase().includes(search.toLowerCase())) &&
    (filter === 'all' || s.status === filter)
  );

  return (
    <div style={{ width: '100%', boxSizing: 'border-box', padding: 22, display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* Header */}
      <div style={{
        background: 'linear-gradient(90deg,#1e3a8a,#2563eb)', borderRadius: 12,
        padding: '12px 22px', display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <span style={{ color: 'white', fontWeight: 700, fontSize: 16 }}>İstasyonlarım</span>
        <span style={{ color: 'rgba(255,255,255,.65)', fontSize: 13 }}>· {stations.length} istasyon</span>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <div style={{ position: 'relative', width: 260 }}>
          <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="İstasyon veya konum ara..."
            style={{ width: '100%', padding: '9px 12px 9px 32px', borderRadius: 10, border: '1px solid #dbeafe', background: 'white', fontSize: 13, color: '#1e293b', outline: 'none' }} />
        </div>
        {[
          { id: 'all', label: 'Tümü', count: stations.length },
          { id: 'normal', label: '● Sorunsuz', count: stations.filter(s => s.status === 'normal').length, color: '#16a34a' },
          { id: 'risk',   label: '● Dikkat',   count: stations.filter(s => s.status === 'risk').length,   color: '#d97706' },
          { id: 'fault',  label: '● Arıza',    count: stations.filter(s => s.status === 'fault').length,  color: '#dc2626' },
        ].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)} style={{
            padding: '8px 16px', borderRadius: 10, fontSize: 12, cursor: 'pointer', fontWeight: 600,
            background: filter === f.id ? '#2563eb' : 'white',
            color: filter === f.id ? 'white' : (f.color || '#64748b'),
            border: `1px solid ${filter === f.id ? '#2563eb' : '#dbeafe'}`,
          }}>
            {f.label} ({f.count})
          </button>
        ))}
      </div>

      {/* Table + right panel */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, alignItems: 'start' }}>

        {/* Table */}
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e0e7ff', boxShadow: '0 1px 8px rgba(37,99,235,.06)', overflow: 'hidden' }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '2.2fr 1fr 1.5fr 110px 80px 80px 110px 36px',
            padding: '11px 20px', background: '#f8faff', borderBottom: '1px solid #e0e7ff',
            fontSize: 11, color: '#94a3b8', fontWeight: 700,
          }}>
            <span>İSTASYON</span><span>KONUM</span>
            <span>ARIZA RİSKİ</span><span style={{ textAlign: 'center' }}>DURUM</span>
            <span style={{ textAlign: 'right' }}>ANL. GÜÇ</span>
            <span style={{ textAlign: 'right' }}>SICAKLIK</span>
            <span style={{ textAlign: 'right' }}>BUGÜN</span><span />
          </div>
          {filtered.map((s, i) => {
            const rc = s.faultRisk >= 70 ? '#ef4444' : s.faultRisk >= 40 ? '#eab308' : '#22c55e';
            const csColor = s.connectorStatus === 'Charging' ? '#16a34a' : s.connectorStatus === 'Faulted' ? '#dc2626' : '#64748b';
            return (
              <div key={s.id} onClick={() => onSelectStation(s)} style={{
                display: 'grid', gridTemplateColumns: '2.2fr 1fr 1.5fr 110px 80px 80px 110px 36px',
                padding: '15px 20px', alignItems: 'center', cursor: 'pointer',
                borderBottom: i < filtered.length - 1 ? '1px solid #f8faff' : 'none',
                transition: 'background .12s',
              }}
                onMouseEnter={e => e.currentTarget.style.background = '#f8faff'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: '#1e293b' }}>{s.name}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{s.type} · {s.connector}</div>
                  {s.faultEta && <div style={{ fontSize: 11, color: '#ef4444', marginTop: 2 }}>⚠ {s.faultEta}</div>}
                </div>
                <div style={{ fontSize: 12, color: '#64748b' }}>{s.location}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <div style={{ flex: 1, height: 6, borderRadius: 999, background: '#f1f5f9' }}>
                    <div style={{ height: 6, borderRadius: 999, width: `${s.faultRisk}%`, background: rc }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 800, color: rc, minWidth: 34 }}>%{s.faultRisk}</span>
                </div>
                <div style={{ textAlign: 'center' }}><StatusBadge status={s.status} size="sm" /></div>
                <div style={{ textAlign: 'right', fontSize: 13, fontWeight: 700, color: s.currentPower != null ? '#2563eb' : '#cbd5e1' }}>
                  {s.currentPower != null ? `${s.currentPower.toFixed(1)} kW` : '—'}
                </div>
                <div style={{ textAlign: 'right', fontSize: 12, fontWeight: 600, color: s.currentTemp != null ? (s.currentTemp > 50 ? '#ef4444' : '#374151') : '#cbd5e1' }}>
                  {s.currentTemp != null ? `${s.currentTemp.toFixed(0)}°C` : '—'}
                </div>
                <div style={{ textAlign: 'right', fontSize: 13, fontWeight: 700, color: s.energyToday > 0 ? '#2563eb' : '#94a3b8' }}>
                  {s.energyToday > 0 ? `${s.energyToday} kWh` : '—'}
                </div>
                <ChevronRight size={15} color="#cbd5e1" />
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>Sonuç bulunamadı</div>
          )}
        </div>

        {/* Right panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Mini energy charts */}
          <div style={{ background: 'white', borderRadius: 14, padding: '16px 18px', border: '1px solid #e0e7ff', boxShadow: '0 1px 6px rgba(37,99,235,.06)' }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#1e40af', marginBottom: 16 }}>7 Günlük Enerji (kWh)</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {stations.slice(0, 4).map(s => {
                const mini = days7.map((d, i) => ({ d, v: stationEnergyHistory[s.id]?.[i] || 0 }));
                const rc = s.faultRisk >= 70 ? '#ef4444' : s.faultRisk >= 40 ? '#eab308' : '#3b82f6';
                return (
                  <div key={s.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{s.shortName}</span>
                      <span style={{ fontSize: 11, color: '#94a3b8' }}>{s.energyToday} kWh</span>
                    </div>
                    <ResponsiveContainer width="100%" height={36}>
                      <BarChart data={mini} margin={{ top: 0, right: 0, left: 0, bottom: 0 }} barSize={14}>
                        <Bar dataKey="v" radius={[3,3,0,0]}>
                          {mini.map((_, i) => <Cell key={i} fill={i === 6 ? rc : '#dbeafe'} />)}
                        </Bar>
                        <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} formatter={v => [`${v} kWh`, '']} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Upcoming maintenance */}
          <div style={{ background: 'white', borderRadius: 14, padding: '16px 18px', border: '1px solid #e0e7ff' }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#1e40af', marginBottom: 12 }}>Yaklaşan Bakım</div>
            {stations.filter(s => s.faultEta).map((s, i, arr) => (
              <div key={s.id} onClick={() => onSelectStation(s)} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0',
                borderBottom: i < arr.length - 1 ? '1px solid #f1f5f9' : 'none', cursor: 'pointer',
              }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: s.status === 'fault' ? '#ef4444' : '#eab308' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#1e293b' }}>{s.shortName}</div>
                  <div style={{ fontSize: 11, color: '#ef4444' }}>{s.faultEta}</div>
                </div>
                <StatusBadge status={s.status} size="sm" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
