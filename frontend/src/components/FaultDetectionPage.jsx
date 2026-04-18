import { useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, RadarChart, Radar,
  PolarGrid, PolarAngleAxis
} from 'recharts';
import {
  AlertTriangle, CheckCircle, ChevronDown, ChevronUp, Brain, Shield
} from 'lucide-react';
import { alerts as mockAlerts, faultHistory } from '../data/mockData';

// API anomali kaydını AlertCard formatına dönüştürür
function anomalyToAlert(a) {
  const ftMap = {
    OverHeating:    { category: 'OverHeating',    msg: `Konnektör sıcaklığı kritik eşiği aştı. Anomali skoru: %${Math.round(a.anomaly_score * 100)}.`, rec: 'Soğutma sistemi kontrol edilsin, yük azaltma değerlendirilebilir.' },
    VoltageProblem: { category: 'VoltageProblem', msg: `Voltaj dengesizliği tespit edildi. Anomali skoru: %${Math.round(a.anomaly_score * 100)}.`,       rec: 'Güç kalitesi analizörü ile voltaj ölçümü yapılsın.' },
    CommLoss:       { category: 'CommLoss',       msg: `OCPP iletişim kesintisi tespit edildi. Anomali skoru: %${Math.round(a.anomaly_score * 100)}.`,     rec: 'Modem/gateway bağlantısı ve SIM kart kontrol edilsin.' },
    OverLoad:       { category: 'OverLoad',       msg: `Aşırı yük anomalisi tespit edildi. Anomali skoru: %${Math.round(a.anomaly_score * 100)}.`,         rec: 'Yük dengesi gözden geçirilsin, gerekirse şarj limiti düşürülsün.' },
  };
  const ft = ftMap[a.fault_type] || { category: a.fault_type || 'Bilinmeyen', msg: `Anomali tespit edildi (skor: %${Math.round(a.anomaly_score * 100)}).`, rec: 'Teknik ekip bilgilendirilsin.' };
  const sevMap = { critical: 'critical', high: 'critical', warning: 'warning', medium: 'warning', info: 'info', low: 'info' };
  const detectedAt = a.detected_at ? new Date(a.detected_at) : null;
  return {
    id: a.id,
    station: `İstasyon-${a.station_id} · Konektör-${a.connector_id ?? 1}`,
    category: ft.category,
    type: sevMap[a.severity] || 'info',
    message: ft.msg,
    time: detectedAt ? `${String(detectedAt.getHours()).padStart(2, '0')}:${String(detectedAt.getMinutes()).padStart(2, '0')}` : '—',
    score: a.anomaly_score ?? 0,
    resolved: !!a.resolved_at,
    recommendation: ft.rec,
  };
}

const faultTypes = [
  { type: 'Voltaj Anomalisi',   count: 8, color: '#ef4444' },
  { type: 'Aşırı Isınma',       count: 5, color: '#f59e0b' },
  { type: 'Bağlantı Hatası',    count: 4, color: '#8b5cf6' },
  { type: 'İletişim Kesintisi', count: 6, color: '#06b6d4' },
  { type: 'Aşırı Yük',          count: 3, color: '#10b981' },
];

// LSTM anomali skoru zaman serisi (simüle)
const anomalyTimeline = Array.from({ length: 48 }, (_, i) => ({
  time: `${String(Math.floor(i / 2)).padStart(2, '0')}:${i % 2 === 0 ? '00' : '30'}`,
  station3: Math.random() * 0.3 + (i > 30 && i < 38 ? 0.6 : 0.1),
  station8: Math.random() * 0.2 + (i > 10 && i < 20 ? 0.7 : 0.05),
  threshold: 0.5,
}));

// Radar grafik verisi
const radarData = [
  { metric: 'Hassasiyet',   hibrit: 93, isolation: 78, randomForest: 82 },
  { metric: 'Geri Çağırma', hibrit: 91, isolation: 72, randomForest: 79 },
  { metric: 'F1 Skoru',     hibrit: 92, isolation: 75, randomForest: 80 },
  { metric: 'Yanlış Alarm', hibrit: 94, isolation: 68, randomForest: 74 },
  { metric: 'Hız',          hibrit: 88, isolation: 92, randomForest: 85 },
];

// AlertCard — açık tema, Dashboard stiliyle tutarlı
const AlertCard = ({ alert }) => {
  const [expanded, setExpanded] = useState(false);
  const typeMap = {
    critical: { color: '#ef4444', bg: '#fef2f2', label: 'KRİTİK', border: '#fecaca' },
    warning:  { color: '#f59e0b', bg: '#fffbeb', label: 'UYARI',   border: '#fde68a' },
    info:     { color: '#06b6d4', bg: '#ecfeff', label: 'BİLGİ',   border: '#a5f3fc' },
  };
  const t = typeMap[alert.type] || typeMap.info;

  return (
    <div style={{ borderRadius: 12, overflow: 'hidden', border: `1px solid ${t.border}` }}>
      <div
        style={{ background: t.bg, display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', cursor: 'pointer' }}
        onClick={() => setExpanded(!expanded)}
      >
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: t.color, flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: t.color, color: 'white' }}>{t.label}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{alert.station}</span>
            <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: t.color + '20', color: t.color }}>{alert.category}</span>
          </div>
          <p style={{ fontSize: 12, color: '#64748b', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{alert.message}</p>
        </div>
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{alert.time}</div>
            <div style={{ fontSize: 11, marginTop: 2 }}>
              <span style={{ color: '#94a3b8' }}>Skor: </span>
              <span style={{ fontWeight: 700, color: t.color }}>%{Math.round(alert.score * 100)}</span>
            </div>
          </div>
          {alert.resolved
            ? <CheckCircle size={16} color="#10b981" />
            : expanded ? <ChevronUp size={16} color="#94a3b8" /> : <ChevronDown size={16} color="#94a3b8" />
          }
        </div>
      </div>

      {expanded && !alert.resolved && (
        <div style={{ padding: '14px 16px', background: '#f8faff', borderTop: `1px solid ${t.border}` }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <div style={{ borderRadius: 10, padding: 12, background: 'white', border: '1px solid #e0e7ff' }}>
              <p style={{ fontSize: 11, color: '#94a3b8', marginBottom: 6 }}>LSTM Anomali Skoru</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ flex: 1, height: 6, borderRadius: 999, background: '#f1f5f9' }}>
                  <div style={{ height: 6, borderRadius: 999, width: `${alert.score * 100}%`, background: t.color }} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: t.color }}>%{Math.round(alert.score * 100)}</span>
              </div>
            </div>
            <div style={{ borderRadius: 10, padding: 12, background: 'white', border: '1px solid #e0e7ff' }}>
              <p style={{ fontSize: 11, color: '#94a3b8', marginBottom: 6 }}>XGBoost Sınıfı</p>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{alert.category}</p>
            </div>
          </div>
          <div style={{ borderRadius: 10, padding: 12, background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#16a34a', marginBottom: 4 }}>AI Önerisi:</p>
            <p style={{ fontSize: 12, color: '#374151' }}>{alert.recommendation}</p>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button style={{ flex: 1, padding: '8px 0', borderRadius: 10, fontSize: 12, fontWeight: 600, background: t.color, color: 'white', border: 'none', cursor: 'pointer' }}>
              Müdahale Başlat
            </button>
            <button style={{ flex: 1, padding: '8px 0', borderRadius: 10, fontSize: 12, fontWeight: 600, background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0', cursor: 'pointer' }}>
              Ertele
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// anomalies: API'den gelen gerçek anomali listesi; boşsa mock fallback kullanılır
export default function FaultDetectionPage({ anomalies = [] }) {
  const [activeTab, setActiveTab] = useState('alerts');

  const alerts = anomalies.length > 0 ? anomalies.map(anomalyToAlert) : mockAlerts;

  const CARD = { background: 'white', borderRadius: 16, border: '1px solid #e0e7ff', boxShadow: '0 1px 6px rgba(37,99,235,.06)' };

  return (
    <div style={{ width: '100%', boxSizing: 'border-box', padding: 22, display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* ── Başlık ── */}
      <div style={{
        background: 'linear-gradient(90deg,#1e3a8a,#2563eb)', borderRadius: 12,
        padding: '12px 22px', display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <AlertTriangle size={18} color="white" />
        <span style={{ color: 'white', fontWeight: 700, fontSize: 16 }}>Arıza Tespiti</span>
        <span style={{ color: 'rgba(255,255,255,.65)', fontSize: 13, marginLeft: 4 }}>LSTM + XGBoost Hibrit Model</span>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ade80' }} />
          <span style={{ color: 'rgba(255,255,255,.7)', fontSize: 12 }}>Model Aktif</span>
        </div>
      </div>

      {/* ── KPI satırı ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
        {[
          { label: 'Aktif Uyarı',   value: alerts.filter(a => !a.resolved).length, unit: 'adet',  sub: 'Müdahale gerekli',  color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
          { label: 'Bu Ay Önlenen', value: 23,    unit: 'arıza', sub: 'Öngörülü bakım',   color: '#059669', bg: '#f0fdf4', border: '#bbf7d0' },
          { label: 'F1 Skoru',      value: '%92', unit: '',      sub: 'Hibrit model',      color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
          { label: 'Yanlış Alarm',  value: '%6',  unit: '',      sub: 'Düşük gürültü',     color: '#0891b2', bg: '#ecfeff', border: '#a5f3fc' },
        ].map(k => (
          <div key={k.label} style={{ background: k.bg, borderRadius: 16, padding: '18px 20px', border: `1px solid ${k.border}` }}>
            <div style={{ fontSize: 12, color: '#64748b', fontWeight: 500, marginBottom: 8 }}>{k.label}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
              <span style={{ fontSize: 30, fontWeight: 800, color: k.color, lineHeight: 1 }}>{k.value}</span>
              {k.unit && <span style={{ fontSize: 13, color: '#94a3b8' }}>{k.unit}</span>}
            </div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Tab başlıkları ── */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '2px solid #e0e7ff' }}>
        {[
          { id: 'alerts',  label: 'Aktif Uyarılar' },
          { id: 'anomaly', label: 'Anomali Zaman Serisi' },
          { id: 'history', label: 'Arıza Geçmişi' },
          { id: 'model',   label: 'Model Performansı' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '10px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              background: 'transparent', border: 'none', marginBottom: -2,
              color: activeTab === tab.id ? '#2563eb' : '#64748b',
              borderBottom: `2px solid ${activeTab === tab.id ? '#2563eb' : 'transparent'}`,
              transition: 'all .15s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Aktif Uyarılar ── */}
      {activeTab === 'alerts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {alerts.map(alert => <AlertCard key={alert.id} alert={alert} />)}
        </div>
      )}

      {/* ── Anomali Zaman Serisi ── */}
      {activeTab === 'anomaly' && (
        <div style={{ ...CARD, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Brain size={18} color="#8b5cf6" />
            <span style={{ fontWeight: 700, fontSize: 14, color: '#1e40af' }}>LSTM Autoencoder Anomali Skorları</span>
            <span style={{ fontSize: 11, padding: '2px 10px', borderRadius: 999, background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', marginLeft: 'auto' }}>Son 24 saat</span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={anomalyTimeline} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="time" tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} interval={5} />
              <YAxis domain={[0, 1]} tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => `%${Math.round(v * 100)}`} />
              <Tooltip contentStyle={{ background: 'white', border: '1px solid #dbeafe', borderRadius: 8 }} labelStyle={{ color: '#1e293b' }} formatter={(v, n) => [`%${Math.round(v * 100)}`, n]} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="threshold" name="Eşik (50%)" stroke="#ef4444" strokeWidth={1} strokeDasharray="4 4" dot={false} />
              <Line type="monotone" dataKey="station3"  name="GEBZE-03"    stroke="#f59e0b" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="station8"  name="BAŞİSKELE-08" stroke="#8b5cf6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
          <div style={{ marginTop: 12, borderRadius: 10, padding: 12, background: '#fffbeb', border: '1px solid #fde68a' }}>
            <p style={{ fontSize: 12, color: '#92400e' }}>
              GEBZE-03: Saat 15:00-19:00 arasında anomali skoru eşik değerini aştı (max: %94). XGBoost sınıflandırması: Voltaj Anomalisi.
            </p>
          </div>
        </div>
      )}

      {/* ── Arıza Geçmişi ── */}
      {activeTab === 'history' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ ...CARD, padding: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#1e40af', marginBottom: 16 }}>Aylık Arıza İstatistikleri</div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={faultHistory} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: 'white', border: '1px solid #dbeafe', borderRadius: 8 }} labelStyle={{ color: '#1e293b' }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="total"     name="Toplam Arıza" fill="#ef4444" radius={[4, 4, 0, 0]} opacity={0.8} />
                <Bar dataKey="prevented" name="Önlenen"      fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{ ...CARD, padding: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#1e40af', marginBottom: 16 }}>Arıza Tipi Dağılımı</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {faultTypes.map(ft => (
                <div key={ft.type} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 13, color: '#374151', flex: 1 }}>{ft.type}</span>
                  <div style={{ width: 140, height: 8, borderRadius: 999, background: '#f1f5f9' }}>
                    <div style={{ height: 8, borderRadius: 999, width: `${(ft.count / 10) * 100}%`, background: ft.color }} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, width: 18, textAlign: 'right', color: ft.color }}>{ft.count}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 16, borderRadius: 10, padding: 12, background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: '#16a34a', marginBottom: 4 }}>Toplam Tasarruf</p>
              <p style={{ fontSize: 12, color: '#374151' }}>Son 6 ayda öngörülü bakım sistemi 33 arıza müdahalesini önledi. Tahmini tasarruf: ₺47.500</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Model Performansı ── */}
      {activeTab === 'model' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ ...CARD, padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Shield size={18} color="#06b6d4" />
              <span style={{ fontWeight: 700, fontSize: 14, color: '#1e40af' }}>Model Karşılaştırması</span>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e0e7ff" />
                <PolarAngleAxis dataKey="metric" tick={{ fill: '#64748b', fontSize: 11 }} />
                <Radar name="LSTM+XGBoost (Hibrit)" dataKey="hibrit"       stroke="#10b981" fill="#10b981" fillOpacity={0.15} strokeWidth={2} />
                <Radar name="Isolation Forest"      dataKey="isolation"    stroke="#ef4444" fill="#ef4444" fillOpacity={0.08} strokeWidth={2} />
                <Radar name="Random Forest"         dataKey="randomForest" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.08} strokeWidth={2} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ background: 'white', border: '1px solid #dbeafe', borderRadius: 8 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div style={{ ...CARD, padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#1e40af' }}>İki Aşamalı Sistem</div>

            <div style={{ borderRadius: 12, padding: 16, background: '#f5f3ff', border: '1px solid #ddd6fe' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#7c3aed', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>1</div>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#5b21b6' }}>LSTM Autoencoder — Anomali Tespiti</span>
              </div>
              <p style={{ fontSize: 12, color: '#64748b' }}>Normal çalışma profilini öğrenerek daha önce hiç görülmemiş anomalileri tespit eder. Etiketlenmemiş veri üzerinde çalışır.</p>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: '#ede9fe', color: '#7c3aed' }}>Denetimsiz</span>
                <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: '#ede9fe', color: '#7c3aed' }}>Sıfır-gün tespiti</span>
              </div>
            </div>

            <div style={{ borderRadius: 12, padding: 16, background: '#ecfeff', border: '1px solid #a5f3fc' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#06b6d4', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>2</div>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#0e7490' }}>XGBoost — Arıza Sınıflandırma</span>
              </div>
              <p style={{ fontSize: 12, color: '#64748b' }}>Tespit edilen anomalinin türünü ve aciliyetini sınıflandırır. Operatöre önceliklendirilmiş müdahale önerisi sunar.</p>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: '#cffafe', color: '#0e7490' }}>Denetimli</span>
                <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: '#cffafe', color: '#0e7490' }}>5 arıza tipi</span>
              </div>
            </div>

            <div style={{ borderRadius: 12, padding: 12, background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: '#16a34a', marginBottom: 4 }}>H2 Hipotezi Doğrulandı</p>
              <p style={{ fontSize: 12, color: '#374151' }}>F1-Skor: %82 → %92 (+%12.2) · Yanlış alarm: %15 → %6 (-%60) ✓</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
