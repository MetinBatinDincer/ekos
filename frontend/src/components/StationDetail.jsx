import { useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, LineChart, Line
} from 'recharts';
import { MapPin, Zap, Activity, Cloud, CloudSnow, Sun, AlertTriangle, ChevronLeft, TrendingUp, Clock } from 'lucide-react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { weather, getEnergyChartData, getHourlyForecast, getNLGAnalysis, stations } from '../data/mockData';
import StatusBadge from './StatusBadge';

const WeatherBox = ({ w, isToday }) => {
  const Icon = w.icon === 'snow' ? CloudSnow : w.icon === 'sun' ? Sun : Cloud;
  const iconColor = w.icon === 'snow' ? '#60a5fa' : w.icon === 'sun' ? '#fbbf24' : '#94a3b8';
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
      padding: '12px 8px', borderRadius: 12,
      background: isToday ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.35)',
      border: isToday ? '1px solid #93c5fd' : '1px solid transparent',
    }}>
      <span style={{ fontSize: 11, fontWeight: isToday ? 700 : 400, color: '#1e40af' }}>{w.label}</span>
      <Icon size={22} color={iconColor} />
      <span style={{ fontSize: 18, fontWeight: 700, color: '#1e3a8a' }}>{w.temp}°C</span>
      <span style={{ fontSize: 10, color: '#60a5fa', textAlign: 'center' }}>{w.desc}</span>
    </div>
  );
};

const actionButtons = [
  { label: 'Aşırı Yükleme (Overload)', color: '#dc2626', bg: '#fef2f2', border: '#fca5a5' },
  { label: 'Talep Tahmini', color: '#2563eb', bg: '#eff6ff', border: '#93c5fd' },
  { label: 'Yük Dengeleme', color: '#059669', bg: '#f0fdf4', border: '#6ee7b7' },
];

export default function StationDetail({ station, onBack }) {
  const [chartMode, setChartMode] = useState('weekly');
  const energyData = getEnergyChartData(station.id);
  const hourlyData = getHourlyForecast(station.id);
  const nlg = getNLGAnalysis(station);
  const mapCenter = [station.lat, station.lng];

  return (
    <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16, width: '100%', boxSizing: 'border-box' }}>

      {/* Station header */}
      <div style={{
        background: 'linear-gradient(90deg, #1e3a8a, #1d4ed8)',
        borderRadius: 12, padding: '12px 20px',
        display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
      }}>
        <button onClick={onBack} style={{
          display: 'flex', alignItems: 'center', gap: 4,
          background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)',
          borderRadius: 8, padding: '5px 12px', cursor: 'pointer', color: 'white', fontSize: 12, fontWeight: 600,
        }}>
          <ChevronLeft size={14} /> Geri
        </button>
        <MapPin size={16} color="rgba(255,255,255,0.75)" />
        <span style={{ color: 'white', fontWeight: 700, fontSize: 15 }}>{station.name}</span>
        <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>{station.address}</span>
        <div style={{ marginLeft: 'auto' }}><StatusBadge status={station.status} /></div>
      </div>

      {/* 3-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>

        {/* ─── COLUMN 1: Charts ─── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Energy chart */}
          <div style={{ background: 'white', borderRadius: 14, padding: '16px 18px', border: '1px solid #e0e7ff', boxShadow: '0 1px 6px rgba(37,99,235,0.07)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#1e40af' }}>Enerji Tüketimi</div>
                <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 1 }}>kWh / {chartMode === 'weekly' ? 'günlük' : 'saatlik'}</div>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                {[{ id: 'weekly', label: '7 Gün' }, { id: 'hourly', label: '24 Saat Tahmini' }].map(m => (
                  <button key={m.id} onClick={() => setChartMode(m.id)} style={{
                    padding: '4px 9px', fontSize: 11, borderRadius: 7, cursor: 'pointer', fontWeight: 600,
                    background: chartMode === m.id ? '#2563eb' : '#f1f5f9',
                    color: chartMode === m.id ? 'white' : '#64748b',
                    border: `1px solid ${chartMode === m.id ? '#2563eb' : '#e2e8f0'}`,
                  }}>{m.label}</button>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              {chartMode === 'weekly' ? (
                <AreaChart data={energyData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gBlue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gGreen" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="gun" tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: 'white', border: '1px solid #dbeafe', borderRadius: 10, fontSize: 12 }} />
                  <Area type="monotone" dataKey="tuketim" name="Gerçek (kWh)" stroke="#3b82f6" strokeWidth={2.5} fill="url(#gBlue)" dot={{ fill: '#3b82f6', r: 3 }} />
                  <Area type="monotone" dataKey="tahmin" name="Tahmin (kWh)" stroke="#22c55e" strokeWidth={2} strokeDasharray="5 3" fill="url(#gGreen)" dot={false} />
                </AreaChart>
              ) : (
                <BarChart data={hourlyData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="saat" tick={{ fill: '#94a3b8', fontSize: 9 }} tickLine={false} interval={3} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: 'white', border: '1px solid #dbeafe', borderRadius: 10, fontSize: 12 }}
                    formatter={v => [`${v} kW`, 'Tahmini Yük']} />
                  <Bar dataKey="kw" fill="#3b82f6" radius={[4,4,0,0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>

          {/* Weather */}
          <div style={{
            background: 'linear-gradient(135deg, #dbeafe, #bfdbfe)',
            borderRadius: 14, padding: 16, border: '1px solid #93c5fd',
          }}>
            <div style={{ fontWeight: 700, fontSize: 12, color: '#1e40af', marginBottom: 12 }}>Hava Durumu & Enerji Etkisi</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {weather.map((w, i) => <WeatherBox key={i} w={w} isToday={i === 1} />)}
            </div>
            <div style={{ marginTop: 10, fontSize: 10, color: '#3b82f6', textAlign: 'center' }}>
              Düşük sıcaklık → batarya verimliliği azalır → daha yüksek şarj talebi
            </div>
          </div>
        </div>

        {/* ─── COLUMN 2: Map + Station info ─── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Map */}
          <div style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid #bfdbfe', height: 220 }}>
            <MapContainer center={mapCenter} zoom={11} style={{ height: '100%', width: '100%' }} zoomControl={false} scrollWheelZoom={false}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {stations.map(s => {
                const color = s.status === 'fault' ? '#ef4444' : s.status === 'risk' ? '#eab308' : '#22c55e';
                return (
                  <CircleMarker key={s.id} center={[s.lat, s.lng]}
                    radius={s.id === station.id ? 12 : 7}
                    pathOptions={{ fillColor: color, fillOpacity: 0.9, color: 'white', weight: 2 }}>
                    <Popup><strong>{s.name}</strong><br />{s.statusLabel}</Popup>
                  </CircleMarker>
                );
              })}
            </MapContainer>
          </div>

          {/* Station info grid */}
          <div style={{ background: 'white', borderRadius: 14, padding: 16, border: '1px solid #e0e7ff' }}>
            <div style={{ fontWeight: 700, fontSize: 12, color: '#1e40af', marginBottom: 12 }}>İstasyon Bilgileri</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { label: 'İstasyon No', value: `IST-${String(station.id).padStart(3,'0')}` },
                { label: 'Bölge', value: station.location },
                { label: 'Şarj Tipi', value: station.type },
                { label: 'Kapasite', value: `${station.power} kW` },
                { label: 'Konnektör', value: station.connector },
                { label: 'Son Bakım', value: '15 Eyl 2025' },
                { label: 'Uptime', value: `%${station.uptime}`, highlight: true },
                { label: 'Aktif Seans', value: `${station.energySessions}`, highlight: true },
              ].map(info => (
                <div key={info.label} style={{ background: '#f8faff', borderRadius: 9, padding: '9px 11px' }}>
                  <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 2 }}>{info.label}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: info.highlight ? '#2563eb' : '#1e293b' }}>{info.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {actionButtons.map(btn => (
              <button key={btn.label} style={{
                padding: '12px 20px', borderRadius: 10, cursor: 'pointer',
                background: btn.bg, color: btn.color, border: `1px solid ${btn.border}`,
                fontWeight: 700, fontSize: 13, textAlign: 'center', transition: 'opacity 0.15s',
              }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* ─── COLUMN 3: NLG Analysis ─── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{
            background: 'white', borderRadius: 14, padding: 20, flex: 1,
            border: '1px solid #e0e7ff', boxShadow: '0 1px 6px rgba(37,99,235,0.07)',
          }}>
            {/* i icon */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
              <div style={{
                width: 34, height: 34, borderRadius: '50%',
                background: '#eff6ff', border: '2px solid #bfdbfe',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <span style={{ fontWeight: 900, color: '#2563eb', fontSize: 18 }}>i</span>
              </div>
              <span style={{ fontWeight: 700, fontSize: 14, color: '#1e40af' }}>{nlg.title}</span>
            </div>

            {/* Bullet analysis */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {nlg.items.map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 10 }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#3b82f6', flexShrink: 0, marginTop: 5 }} />
                  <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.65 }}>
                    <span style={{ fontWeight: 700, color: '#1e293b' }}>• {item.label}: </span>
                    {item.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Alert box */}
            {nlg.alert && (
              <div style={{
                marginTop: 20, borderRadius: 12, padding: 16,
                background: station.status === 'fault' ? '#fef2f2' : '#fffbeb',
                border: `1px solid ${station.status === 'fault' ? '#fca5a5' : '#fde68a'}`,
              }}>
                <div style={{
                  fontWeight: 700, fontSize: 13, marginBottom: 8,
                  color: station.status === 'fault' ? '#b91c1c' : '#92400e',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <AlertTriangle size={15} />
                  {nlg.alert.label}:
                </div>
                <div style={{
                  fontSize: 12.5, lineHeight: 1.75, whiteSpace: 'pre-line',
                  color: station.status === 'fault' ? '#991b1b' : '#78350f',
                }}>
                  {nlg.alert.text}
                </div>
              </div>
            )}
          </div>

          {/* Quick stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { label: 'Arıza Riski', value: `%${station.faultRisk}`, color: station.faultRisk >= 70 ? '#ef4444' : station.faultRisk >= 40 ? '#d97706' : '#16a34a' },
              { label: 'Bugün Enerji', value: station.energyToday > 0 ? `${station.energyToday} kWh` : '—', color: '#2563eb' },
            ].map(s => (
              <div key={s.label} style={{ background: 'white', borderRadius: 12, padding: '14px 16px', border: '1px solid #e0e7ff', textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
