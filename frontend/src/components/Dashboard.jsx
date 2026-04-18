import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Zap, AlertTriangle, CheckCircle, ChevronRight, TrendingUp, Activity, Brain } from 'lucide-react';
import { stations as mockStations, stationEnergyHistory } from '../data/mockData';
import StatusBadge from './StatusBadge';

const days7 = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

// 7 günlük toplam enerji trendi — mock geçmiş veriden (günlük toplam API'si henüz yok)
const totalEnergyTrend = days7.map((d, i) => ({
  gun: d,
  toplam: Object.values(stationEnergyHistory).reduce((a, arr) => a + (arr[i] || 0), 0),
}));

// stations: App.jsx'ten gelen canlı liste; yoksa mock kullanılır
// anomalies: API'den gelen son anomali kayıtları
export default function Dashboard({ onSelectStation, stations = mockStations, anomalies = [] }) {
  // Özet KPI sayıları canlı istasyon listesinden anlık hesaplanır
  const summary = {
    total:            stations.length,
    normal:           stations.filter(s => s.status === 'normal').length,
    risk:             stations.filter(s => s.status === 'risk').length,
    fault:            stations.filter(s => s.status === 'fault').length,
    totalEnergyToday: stations.reduce((a, s) => a + (s.energyToday || 0), 0),
    totalSessions:    stations.reduce((a, s) => a + (s.energySessions || 0), 0),
  };
  const pieData = [
    { name: 'Sorunsuz İstasyon',     value: summary.normal, color: '#22c55e' },
    { name: 'Arıza Oluşturabilecek', value: summary.risk,   color: '#eab308' },
    { name: 'Arıza Yapan',           value: summary.fault,  color: '#ef4444' },
  ];
  return (
    <div style={{ width: '100%', boxSizing: 'border-box', padding: 22, display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* ── Header bar ── */}
      <div style={{
        background: 'linear-gradient(90deg,#1e3a8a,#2563eb)', borderRadius: 12,
        padding: '12px 22px', display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <TrendingUp size={18} color="white" />
        <span style={{ color: 'white', fontWeight: 700, fontSize: 16 }}>Dashboard</span>
        <span style={{ color: 'rgba(255,255,255,.65)', fontSize: 13, marginLeft: 4 }}>
          {new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' })}
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ade80' }} />
          <span style={{ color: 'rgba(255,255,255,.7)', fontSize: 12 }}>Canlı · OCPP 2.0.1</span>
        </div>
      </div>

      {/* ── KPI row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
        {[
          { icon: Zap,           label: 'Bugünkü Enerji',   value: summary.totalEnergyToday, unit: 'kWh',      sub: 'Tüm istasyonlar toplamı',           color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
          { icon: Activity,      label: 'Aktif Şarj Seansı', value: summary.totalSessions,    unit: 'seans',    sub: 'Anlık aktif bağlantı',              color: '#059669', bg: '#f0fdf4', border: '#bbf7d0' },
          { icon: AlertTriangle, label: 'Arıza / Dikkat',    value: summary.fault+summary.risk, unit: 'istasyon', sub: `${summary.fault} arıza · ${summary.risk} dikkat`, color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
          { icon: CheckCircle,   label: 'Sorunsuz İstasyon', value: summary.normal,            unit: `/ ${summary.total}`, sub: `%${Math.round((summary.normal/summary.total)*100)} sistem sağlığı`, color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
        ].map(k => {
          const Icon = k.icon;
          return (
            <div key={k.label} style={{ background: k.bg, borderRadius: 16, padding: '18px 20px', border: `1px solid ${k.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 12, color: '#64748b', fontWeight: 500, marginBottom: 8 }}>{k.label}</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
                    <span style={{ fontSize: 32, fontWeight: 800, color: k.color, lineHeight: 1 }}>{k.value}</span>
                    <span style={{ fontSize: 13, color: '#94a3b8' }}>{k.unit}</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>{k.sub}</div>
                </div>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: k.color+'18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={20} color={k.color} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Middle row: Donut | Energy chart | Risk bars ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr 260px', gap: 14 }}>

        {/* Donut */}
        <div style={{ background: 'white', borderRadius: 16, padding: '18px 16px', border: '1px solid #e0e7ff', boxShadow: '0 1px 6px rgba(37,99,235,.06)' }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#1e40af', marginBottom: 10 }}>İstasyon Durumu</div>
          <ResponsiveContainer width="100%" height={150}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={44} outerRadius={65} dataKey="value" stroke="none">
                {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: 'white', border: '1px solid #e0e7ff', borderRadius: 10, fontSize: 12 }} formatter={(v, n) => [`${v} istasyon`, n]} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginTop: 6 }}>
            {pieData.map(p => (
              <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 9, height: 9, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: '#475569', flex: 1 }}>{p.name}</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: p.color }}>{p.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Energy trend */}
        <div style={{ background: 'white', borderRadius: 16, padding: '18px 18px 14px', border: '1px solid #e0e7ff', boxShadow: '0 1px 6px rgba(37,99,235,.06)' }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#1e40af', marginBottom: 2 }}>7 Günlük Enerji Tüketimi (kWh) — Tüm İstasyonlar</div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 12 }}>Günlük toplam tüketim</div>
          <ResponsiveContainer width="100%" height={185}>
            <AreaChart data={totalEnergyTrend} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="gD" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="gun" tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: 'white', border: '1px solid #dbeafe', borderRadius: 10, fontSize: 12 }} formatter={v => [`${v} kWh`, 'Toplam']} />
              <Area type="monotone" dataKey="toplam" stroke="#3b82f6" strokeWidth={2.5} fill="url(#gD)" dot={{ fill: '#3b82f6', r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Fault risk */}
        <div style={{ background: 'white', borderRadius: 16, padding: '18px 16px', border: '1px solid #e0e7ff', boxShadow: '0 1px 6px rgba(37,99,235,.06)' }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#1e40af', marginBottom: 14 }}>Arıza Risk Durumu</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {stations.map(s => {
              const rc = s.faultRisk >= 70 ? '#ef4444' : s.faultRisk >= 40 ? '#eab308' : '#22c55e';
              return (
                <div key={s.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{s.shortName}</span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: rc }}>%{s.faultRisk}</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 999, background: '#f1f5f9' }}>
                    <div style={{ height: 6, borderRadius: 999, width: `${s.faultRisk}%`, background: rc }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Son Anomaliler ── */}
      {anomalies.length > 0 && (
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e0e7ff', boxShadow: '0 1px 8px rgba(37,99,235,.06)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Brain size={16} color="#8b5cf6" />
            <span style={{ fontWeight: 700, fontSize: 13, color: '#1e40af' }}>Son Anomaliler</span>
            <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 4 }}>— Son {Math.min(anomalies.length, 5)} kayıt</span>
          </div>
          <div style={{ padding: '12px 20px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {anomalies.slice(0, 5).map(a => {
              const sevColor = a.severity === 'critical' ? '#ef4444' : a.severity === 'warning' ? '#f59e0b' : '#06b6d4';
              const sevLabel = a.severity === 'critical' ? 'KRİTİK' : a.severity === 'warning' ? 'UYARI' : 'BİLGİ';
              const detectedAt = a.detected_at ? new Date(a.detected_at) : null;
              const timeStr = detectedAt
                ? `${String(detectedAt.getHours()).padStart(2,'0')}:${String(detectedAt.getMinutes()).padStart(2,'0')}`
                : '—';
              return (
                <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 10, background: sevColor + '08', border: `1px solid ${sevColor}25` }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: sevColor, flexShrink: 0 }} />
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: sevColor, color: 'white', flexShrink: 0 }}>{sevLabel}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#1e293b', flexShrink: 0 }}>İstasyon-{a.station_id}</span>
                  <span style={{ fontSize: 12, color: '#64748b', flex: 1 }}>{a.fault_type || 'Anomali'} — Skor: %{Math.round((a.anomaly_score || 0) * 100)}</span>
                  <span style={{ fontSize: 11, color: '#94a3b8', flexShrink: 0 }}>{timeStr}</span>
                  {a.resolved_at && <CheckCircle size={14} color="#10b981" />}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Station table ── */}
      <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e0e7ff', boxShadow: '0 1px 8px rgba(37,99,235,.06)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 700, fontSize: 13, color: '#1e40af' }}>İstasyonlarım</span>
          <span style={{ fontSize: 12, color: '#94a3b8' }}>{stations.length} istasyon · Tıklayarak detay görün</span>
        </div>
        {/* Table head */}
        <div style={{
          display: 'grid', gridTemplateColumns: '2.5fr 1fr 1fr 1.8fr 120px 120px 110px 36px',
          padding: '10px 20px', margin: '12px 0 0',
          background: '#f8faff', borderTop: '1px solid #e0e7ff', borderBottom: '1px solid #e0e7ff',
          fontSize: 11, color: '#94a3b8', fontWeight: 700, letterSpacing: 0.3,
        }}>
          <span>İSTASYON ADI</span><span>KONUM</span><span>TİP / GÜÇ</span>
          <span>ARIZA RİSKİ</span><span style={{ textAlign: 'center' }}>DURUM</span>
          <span style={{ textAlign: 'right' }}>BUGÜN ENERJİ</span>
          <span style={{ textAlign: 'right' }}>UPTIME</span><span />
        </div>
        {stations.map((s, i) => {
          const rc = s.faultRisk >= 70 ? '#ef4444' : s.faultRisk >= 40 ? '#eab308' : '#22c55e';
          return (
            <div key={s.id} onClick={() => onSelectStation(s)} style={{
              display: 'grid', gridTemplateColumns: '2.5fr 1fr 1fr 1.8fr 120px 120px 110px 36px',
              padding: '14px 20px', alignItems: 'center', cursor: 'pointer',
              borderBottom: i < stations.length - 1 ? '1px solid #f8faff' : 'none',
              transition: 'background .12s',
            }}
              onMouseEnter={e => e.currentTarget.style.background = '#f8faff'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: 13, color: '#1e293b' }}>{s.name}</div>
                {s.faultEta && <div style={{ fontSize: 11, color: '#ef4444', marginTop: 2 }}>⚠ {s.faultEta}</div>}
              </div>
              <div style={{ fontSize: 12, color: '#64748b' }}>{s.location}</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>{s.type} · {s.power} kW</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ flex: 1, height: 6, borderRadius: 999, background: '#f1f5f9' }}>
                  <div style={{ height: 6, borderRadius: 999, width: `${s.faultRisk}%`, background: rc }} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 800, color: rc, minWidth: 34, textAlign: 'right' }}>%{s.faultRisk}</span>
              </div>
              <div style={{ textAlign: 'center' }}><StatusBadge status={s.status} size="sm" /></div>
              <div style={{ textAlign: 'right', fontSize: 13, fontWeight: 700, color: s.energyToday > 0 ? '#2563eb' : '#94a3b8' }}>
                {s.energyToday > 0 ? `${s.energyToday} kWh` : '—'}
              </div>
              <div style={{ textAlign: 'right', fontSize: 12, fontWeight: 600, color: s.uptime >= 95 ? '#16a34a' : '#d97706' }}>
                %{s.uptime}
              </div>
              <ChevronRight size={15} color="#cbd5e1" />
            </div>
          );
        })}
      </div>
    </div>
  );
}
