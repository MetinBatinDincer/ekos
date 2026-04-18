import { useState } from 'react';
import {
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell
} from 'recharts';
import { Download, FileText, TrendingUp, AlertTriangle, Zap, Leaf } from 'lucide-react';
import { stations, stationEnergyHistory } from '../data/mockData';

const days7 = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];

const combinedData = days7.map((d, i) => {
  const obj = { gun: d, toplam: 0 };
  stations.forEach((s, si) => {
    const v = stationEnergyHistory[s.id]?.[i] || 0;
    obj[s.shortName] = v;
    obj.toplam += v;
  });
  return obj;
});

// Fault history mock
const faultHistory = [
  { ay: 'Eki', toplam: 12, onlenen: 4 },
  { ay: 'Kas', toplam: 9, onlenen: 5 },
  { ay: 'Ara', toplam: 14, onlenen: 6 },
  { ay: 'Oca', toplam: 8, onlenen: 5 },
  { ay: 'Şub', toplam: 11, onlenen: 7 },
  { ay: 'Mar', toplam: 6, onlenen: 5 },
];

const pieData = stations.map((s, i) => ({ name: s.shortName, value: s.energyToday, color: COLORS[i] }));

export default function ReportsPage() {
  const [generating, setGenerating] = useState(false);

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18, width: '100%', boxSizing: 'border-box' }}>

      {/* Header */}
      <div style={{
        background: 'linear-gradient(90deg, #1e3a8a, #2563eb)',
        borderRadius: 12, padding: '12px 22px',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <FileText size={18} color="white" />
        <span style={{ color: 'white', fontWeight: 700, fontSize: 16 }}>Raporlar & Tahminler</span>
        <div style={{ marginLeft: 'auto' }}>
          <button
            onClick={() => { setGenerating(true); setTimeout(() => setGenerating(false), 2000); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', borderRadius: 8, cursor: 'pointer',
              background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.35)',
              color: 'white', fontWeight: 700, fontSize: 13,
            }}
          >
            <Download size={14} />
            {generating ? 'Hazırlanıyor...' : 'PDF Raporu İndir'}
          </button>
        </div>
      </div>

      {/* Row 1: KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
        {[
          { icon: Zap, label: 'Bu Ay Toplam Enerji', value: '8.231 kWh', color: '#2563eb', bg: '#eff6ff' },
          { icon: AlertTriangle, label: 'Önlenen Arıza', value: '7 Adet', color: '#d97706', bg: '#fffbeb' },
          { icon: TrendingUp, label: 'Ortalama Uptime', value: '%96.4', color: '#16a34a', bg: '#f0fdf4' },
          { icon: Leaf, label: 'CO₂ Tasarrufu', value: '4.115 kg', color: '#059669', bg: '#f0fdf4' },
        ].map(k => {
          const Icon = k.icon;
          return (
            <div key={k.label} style={{ background: k.bg, borderRadius: 16, padding: '18px 20px', border: `1px solid ${k.color}22` }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{ width: 38, height: 38, borderRadius: 11, background: k.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={18} color={k.color} />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>{k.label}</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: k.color }}>{k.value}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Row 2: Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 300px', gap: 16 }}>

        {/* Stacked weekly energy */}
        <div style={{ background: 'white', borderRadius: 16, padding: '18px 18px 14px', border: '1px solid #e0e7ff', boxShadow: '0 1px 6px rgba(37,99,235,0.06)' }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#1e40af', marginBottom: 4 }}>Haftalık Enerji Tüketimi</div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 14 }}>İstasyon bazında kWh</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={combinedData} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="gun" tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: 'white', border: '1px solid #dbeafe', borderRadius: 10, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
              {stations.map((s, i) => (
                <Bar key={s.id} dataKey={s.shortName} stackId="a" fill={COLORS[i % COLORS.length]}
                  radius={i === stations.length - 1 ? [3,3,0,0] : [0,0,0,0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Fault history */}
        <div style={{ background: 'white', borderRadius: 16, padding: '18px 18px 14px', border: '1px solid #e0e7ff', boxShadow: '0 1px 6px rgba(37,99,235,0.06)' }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#1e40af', marginBottom: 4 }}>Arıza & Önleme Geçmişi</div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 14 }}>Son 6 ay</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={faultHistory} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="ay" tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: 'white', border: '1px solid #dbeafe', borderRadius: 10, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
              <Bar dataKey="toplam" name="Toplam Arıza" fill="#fca5a5" radius={[4,4,0,0]} />
              <Bar dataKey="onlenen" name="Önlenen" fill="#22c55e" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie + risk summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ background: 'white', borderRadius: 16, padding: 18, border: '1px solid #e0e7ff' }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#1e40af', marginBottom: 12 }}>Bugün Enerji Dağılımı</div>
            <ResponsiveContainer width="100%" height={130}>
              <PieChart>
                <Pie data={pieData.filter(d => d.value > 0)} cx="50%" cy="50%" outerRadius={55} dataKey="value" nameKey="name">
                  {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'white', border: '1px solid #dbeafe', borderRadius: 10, fontSize: 12 }}
                  formatter={(v, n) => [`${v} kWh`, n]} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 10px', marginTop: 4 }}>
              {pieData.filter(d => d.value > 0).map((p, i) => (
                <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color }} />
                  <span style={{ fontSize: 10, color: '#64748b' }}>{p.name}: {p.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* NLG summary */}
          <div style={{ background: '#eff6ff', borderRadius: 16, padding: 16, border: '1px solid #bfdbfe', flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 12, color: '#1e40af', marginBottom: 8 }}>Özet Değerlendirme</div>
            <div style={{ fontSize: 12, color: '#1d4ed8', lineHeight: 1.7 }}>
              Mart 2026'da 6 istasyondan toplam <strong>8.231 kWh</strong> enerji sağlandı.
              OSB istasyonundaki arıza 3 günlük kesintiye yol açtı.
              <br /><br />
              <strong>Hastane</strong> ve <strong>AVM</strong> istasyonları yaklaşan bakım için öncelikli.
              Önümüzdeki ay <strong>%6 talep artışı</strong> beklenmektedir.
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Per-station risk detail */}
      <div style={{ background: 'white', borderRadius: 16, padding: '18px 20px', border: '1px solid #e0e7ff', boxShadow: '0 1px 6px rgba(37,99,235,0.06)' }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: '#1e40af', marginBottom: 16 }}>İstasyon Bazlı Arıza Risk Detayı</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
          {stations.map(s => {
            const rc = s.faultRisk >= 70 ? '#ef4444' : s.faultRisk >= 40 ? '#eab308' : '#22c55e';
            const bg = s.faultRisk >= 70 ? '#fef2f2' : s.faultRisk >= 40 ? '#fffbeb' : '#f0fdf4';
            const border = s.faultRisk >= 70 ? '#fca5a5' : s.faultRisk >= 40 ? '#fde68a' : '#bbf7d0';
            return (
              <div key={s.id} style={{ borderRadius: 12, padding: '14px 16px', background: bg, border: `1px solid ${border}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 13, color: '#1e293b' }}>{s.name}</span>
                  <span style={{ fontSize: 15, fontWeight: 800, color: rc }}>%{s.faultRisk}</span>
                </div>
                <div style={{ height: 7, borderRadius: 999, background: '#e2e8f0', marginBottom: 8 }}>
                  <div style={{ height: 7, borderRadius: 999, width: `${s.faultRisk}%`, background: rc }} />
                </div>
                <div style={{ fontSize: 11, color: '#64748b' }}>
                  {s.faultEta ? <span style={{ color: rc, fontWeight: 600 }}>⚠ {s.faultEta}</span> : 'Sorunsuz çalışıyor'}
                  {' · '}{s.energyToday > 0 ? `${s.energyToday} kWh bugün` : 'Aktif değil'}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
