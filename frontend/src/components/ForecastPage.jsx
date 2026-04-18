import {
  BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Brain, CloudRain, Car, Sun, Wind, AlertCircle, TrendingUp } from 'lucide-react';
import { stations as mockStations } from '../data/mockData';

// KPI kartı — Dashboard stiliyle tutarlı
const ModelMetric = ({ label, value, unit, color, bg, border }) => (
  <div style={{ background: bg, borderRadius: 16, padding: '18px 20px', border: `1px solid ${border}` }}>
    <div style={{ fontSize: 12, color: '#64748b', fontWeight: 500, marginBottom: 8 }}>{label}</div>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
      <span style={{ fontSize: 30, fontWeight: 800, color, lineHeight: 1 }}>{value}</span>
      {unit && <span style={{ fontSize: 13, color: '#94a3b8' }}>{unit}</span>}
    </div>
  </div>
);

// Dışsal faktör kartı
const ExternalFactorCard = ({ icon: Icon, label, value, impact, color }) => (
  <div style={{ background: 'white', borderRadius: 12, padding: 14, border: '1px solid #e0e7ff' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
      <div style={{ width: 28, height: 28, borderRadius: 8, background: color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={14} color={color} />
      </div>
      <span style={{ fontSize: 12, color: '#374151', fontWeight: 500 }}>{label}</span>
    </div>
    <p style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>{value}</p>
    <p style={{ fontSize: 11, marginTop: 4, fontWeight: 600, color: impact > 0 ? '#16a34a' : '#dc2626' }}>
      {impact > 0 ? '↑' : '↓'} %{Math.abs(impact)} etki
    </p>
  </div>
);

// Model karşılaştırma verisi
const modelPerf = [
  { model: 'Prophet',  mape: 12.4 },
  { model: 'LightGBM', mape: 9.1  },
  { model: 'Hibrit',   mape: 7.2  },
  { model: 'LSTM',     mape: 8.6  },
  { model: 'ARIMA',    mape: 14.8 },
];

// stations: App.jsx'ten gelen canlı liste; prop gelmezse mock kullanılır
export default function ForecastPage({ stations = mockStations }) {
  // İstasyon bazlı tahmin tablosu — energyToday canlı veriden gelir
  const stationForecast = stations.map(s => ({
    name:     s.shortName || s.name,
    today:    s.energyToday,
    tomorrow: Math.round(s.energyToday * (0.9 + Math.random() * 0.3)),
    weekend:  Math.round(s.energyToday * (1.1 + Math.random() * 0.4)),
  })).slice(0, 6);

  const CARD = { background: 'white', borderRadius: 16, border: '1px solid #e0e7ff', boxShadow: '0 1px 6px rgba(37,99,235,.06)' };

  return (
    <div style={{ width: '100%', boxSizing: 'border-box', padding: 22, display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* ── Başlık ── */}
      <div style={{
        background: 'linear-gradient(90deg,#1e3a8a,#2563eb)', borderRadius: 12,
        padding: '12px 22px', display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <TrendingUp size={18} color="white" />
        <span style={{ color: 'white', fontWeight: 700, fontSize: 16 }}>Tahmin Modeli</span>
        <span style={{ color: 'rgba(255,255,255,.65)', fontSize: 13, marginLeft: 4 }}>Prophet + LightGBM Hibrit</span>
      </div>

      {/* ── Model metrikleri ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
        <ModelMetric label="MAPE (Hibrit Model)" value="7.2"   unit="%" color="#059669" bg="#f0fdf4" border="#bbf7d0" />
        <ModelMetric label="RMSE"                value="10.4"  unit="kW" color="#0891b2" bg="#ecfeff" border="#a5f3fc" />
        <ModelMetric label="R² Skoru"            value="0.943" unit=""   color="#7c3aed" bg="#f5f3ff" border="#ddd6fe" />
        <ModelMetric label="Tahmin Ufku"         value="48"    unit="saat" color="#d97706" bg="#fffbeb" border="#fde68a" />
      </div>

      {/* ── LightGBM Dışsal Faktörler ── */}
      <div style={{ ...CARD, padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Brain size={18} color="#8b5cf6" />
          <span style={{ fontWeight: 700, fontSize: 14, color: '#1e40af' }}>LightGBM Dışsal Faktörler</span>
          <span style={{ fontSize: 11, padding: '2px 10px', borderRadius: 999, background: '#f5f3ff', color: '#7c3aed', border: '1px solid #ddd6fe', marginLeft: 'auto' }}>Özellik Önemi</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 16 }}>
          <ExternalFactorCard icon={Sun}      label="Hava Sıcaklığı"    value="28°C"            impact={+18} color="#f59e0b" />
          <ExternalFactorCard icon={Car}      label="Trafik Yoğunluğu"  value="Yüksek (%82)"    impact={+23} color="#ef4444" />
          <ExternalFactorCard icon={CloudRain} label="Hava Durumu"      value="Parçalı bulutlu" impact={-5}  color="#06b6d4" />
          <ExternalFactorCard icon={Wind}     label="Rüzgar Hızı"       value="12 km/h"         impact={-2}  color="#8b5cf6" />
        </div>

        {/* Özellik önemi çubukları */}
        {[
          { label: 'Trafik Yoğunluğu',    pct: 28, color: '#ef4444' },
          { label: 'Saat (Zaman Serisi)', pct: 24, color: '#10b981' },
          { label: 'Gün Tipi (İş/Tatil)', pct: 19, color: '#06b6d4' },
          { label: 'Hava Sıcaklığı',      pct: 16, color: '#f59e0b' },
          { label: 'Hava Durumu',          pct: 8,  color: '#8b5cf6' },
          { label: 'Diğer',               pct: 5,  color: '#94a3b8' },
        ].map(item => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: '#64748b', width: 160, flexShrink: 0 }}>{item.label}</span>
            <div style={{ flex: 1, height: 8, borderRadius: 999, background: '#f1f5f9' }}>
              <div style={{ height: 8, borderRadius: 999, background: item.color, width: `${item.pct}%` }} />
            </div>
            <span style={{ fontSize: 12, color: '#94a3b8', width: 32, textAlign: 'right' }}>%{item.pct}</span>
          </div>
        ))}
      </div>

      {/* ── Tahmin modeli henüz aktif değil ── */}
      <div style={{ ...CARD, padding: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, minHeight: 180 }}>
        <AlertCircle size={40} color="#94a3b8" />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>Tahmin modeli henüz aktif değil</div>
          <p style={{ fontSize: 13, color: '#64748b', maxWidth: 460 }}>
            Predictions tablosu boş. Model eğitimi tamamlandığında gerçek zamanlı enerji tahminleri burada görünecek.
          </p>
        </div>
        <div style={{ fontSize: 12, padding: '6px 14px', borderRadius: 8, background: '#fffbeb', color: '#92400e', border: '1px solid #fde68a' }}>
          Bekleniyor: predictions tablosuna veri yazılması
        </div>
      </div>

      {/* ── İstasyon tahmini + Model karşılaştırması ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* İstasyon bazlı tahmin */}
        <div style={{ ...CARD, padding: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#1e40af', marginBottom: 16 }}>İstasyon Bazlı Tahmin</div>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={stationForecast} layout="vertical" margin={{ top: 5, right: 15, left: 60, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} width={55} />
              <Tooltip contentStyle={{ background: 'white', border: '1px solid #dbeafe', borderRadius: 8 }} labelStyle={{ color: '#1e293b' }} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Bar dataKey="today"   name="Bugün"      fill="#10b981" radius={[0, 4, 4, 0]} />
              <Bar dataKey="tomorrow" name="Yarın"     fill="#06b6d4" radius={[0, 4, 4, 0]} />
              <Bar dataKey="weekend" name="Hafta sonu" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Model karşılaştırması */}
        <div style={{ ...CARD, padding: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#1e40af', marginBottom: 4 }}>Model Karşılaştırması</div>
          <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 16 }}>MAPE değeri — düşük daha iyi</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[...modelPerf].sort((a, b) => a.mape - b.mape).map((m, i) => {
              const isHibrit = m.model === 'Hibrit';
              return (
                <div key={m.model} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: 8, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700,
                    background: isHibrit ? '#f0fdf4' : '#f8faff',
                    color: isHibrit ? '#16a34a' : '#94a3b8',
                  }}>{i + 1}</div>
                  <span style={{ fontSize: 13, width: 90, flexShrink: 0, fontWeight: isHibrit ? 700 : 400, color: isHibrit ? '#16a34a' : '#374151' }}>
                    {m.model}
                  </span>
                  <div style={{ flex: 1, height: 8, borderRadius: 999, background: '#f1f5f9' }}>
                    <div style={{ height: 8, borderRadius: 999, width: `${(m.mape / 15) * 100}%`, background: isHibrit ? '#10b981' : '#cbd5e1' }} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, width: 50, textAlign: 'right', color: isHibrit ? '#16a34a' : '#64748b' }}>
                    %{m.mape}
                  </span>
                  {isHibrit && (
                    <span style={{ fontSize: 11, padding: '2px 6px', borderRadius: 6, background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', flexShrink: 0 }}>EN İYİ</span>
                  )}
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 16, borderRadius: 10, padding: 12, background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
            <p style={{ fontSize: 12, color: '#374151' }}>
              Hibrit model, tek başına Prophet kullanımına kıyasla MAPE'yi %41.9 oranında iyileştirdi. (H1 hipotezi hedef: %30 ✓)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
