// E-KOS Mock Data — Müşteri odaklı, istasyon bazlı

export const currentUser = {
  name: "Süleyman Emir KAYA",
  role: "İstasyon Operatörü",
  company: "Kocaeli EV Şarj A.Ş.",
  avatar: null,
};

export const stations = [
  {
    id: 1,
    name: "Otopark-1 Şarj İstasyonu",
    shortName: "Otopark-1",
    location: "Kocaeli / Gebze",
    address: "Atatürk Mahallesi, 123. Sokak No:5 Kocaeli / Gebze",
    lat: 40.7989, lng: 29.4318,
    status: "normal",          // normal | risk | fault
    statusLabel: "Sorunsuz",
    power: 150, type: "DC Hızlı", connector: "CCS2",
    energyToday: 487, energySessions: 12,
    faultRisk: 8,              // % arıza riski (model çıktısı)
    faultEta: null,            // ne zaman arıza bekleniyor
    uptime: 99.2,
  },
  {
    id: 2,
    name: "AVM Şarj İstasyonu",
    shortName: "AVM",
    location: "Kocaeli / İzmit",
    address: "Yenişehir Mahallesi, AVM Caddesi No:12 Kocaeli / İzmit",
    lat: 40.7655, lng: 29.9221,
    status: "risk",
    statusLabel: "Dikkat",
    power: 50, type: "AC Normal", connector: "Type 2",
    energyToday: 124, energySessions: 6,
    faultRisk: 67,
    faultEta: "2 gün içinde",
    uptime: 94.7,
  },
  {
    id: 3,
    name: "OSB Şarj İstasyonu",
    shortName: "OSB",
    location: "Kocaeli / Dilovası",
    address: "Organize Sanayi Bölgesi, 3. Cadde No:8 Kocaeli / Dilovası",
    lat: 40.7765, lng: 29.5543,
    status: "fault",
    statusLabel: "Arıza",
    power: 120, type: "DC Hızlı", connector: "CHAdeMO",
    energyToday: 0, energySessions: 0,
    faultRisk: 100,
    faultEta: "Aktif arıza",
    uptime: 82.4,
  },
  {
    id: 4,
    name: "Sahil Şarj İstasyonu",
    shortName: "Sahil",
    location: "Kocaeli / Gölcük",
    address: "Sahil Yolu, Cumhuriyet Cad. No:3 Kocaeli / Gölcük",
    lat: 40.7123, lng: 29.8012,
    status: "normal",
    statusLabel: "Sorunsuz",
    power: 22, type: "AC Normal", connector: "Type 2",
    energyToday: 89, energySessions: 9,
    faultRisk: 14,
    faultEta: null,
    uptime: 98.1,
  },
  {
    id: 5,
    name: "Hastane Şarj İstasyonu",
    shortName: "Hastane",
    location: "Kocaeli / Başiskele",
    address: "Hastane Caddesi No:45 Kocaeli / Başiskele",
    lat: 40.7432, lng: 29.9876,
    status: "risk",
    statusLabel: "Dikkat",
    power: 75, type: "DC Hızlı", connector: "CCS2",
    energyToday: 211, energySessions: 4,
    faultRisk: 52,
    faultEta: "4-5 gün içinde",
    uptime: 91.3,
  },
  {
    id: 6,
    name: "Üniversite Şarj İstasyonu",
    shortName: "Üniversite",
    location: "Kocaeli / Umuttepe",
    address: "Kocaeli Üniversitesi Kampüsü, Umuttepe Kocaeli",
    lat: 40.7654, lng: 29.9408,
    status: "normal",
    statusLabel: "Sorunsuz",
    power: 50, type: "AC Normal", connector: "Type 2",
    energyToday: 145, energySessions: 8,
    faultRisk: 5,
    faultEta: null,
    uptime: 99.7,
  },
];

// İstasyon bazlı son 7 günlük enerji tüketimi
export const stationEnergyHistory = {
  1: [320, 410, 487, 398, 521, 463, 487],
  2: [98, 112, 134, 89, 145, 124, 124],
  3: [310, 287, 320, 298, 280, 132, 0],
  4: [67, 82, 79, 91, 84, 93, 89],
  5: [180, 195, 210, 198, 205, 220, 211],
  6: [120, 138, 142, 128, 155, 148, 145],
};

const days = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

export function getEnergyChartData(stationId) {
  const hist = stationEnergyHistory[stationId] || [];
  return days.map((day, i) => ({
    gun: day,
    tuketim: hist[i] || 0,
    tahmin: Math.round((hist[i] || 0) * (0.95 + Math.random() * 0.15)),
  }));
}

// Hava durumu (bugün + 2 gün sonra)
export const weather = [
  { label: 'Dün', icon: 'snow', temp: 2, desc: 'Kar yağışlı' },
  { label: 'Bugün', icon: 'cloudy', temp: 3, desc: 'Parçalı bulutlu' },
  { label: 'Yarın', icon: 'snow', temp: 3, desc: 'Kar yağışlı' },
];

// Gelecek 24 saat enerji tahmini (saatlik)
export function getHourlyForecast(stationId) {
  const baseMap = { 1: 85, 2: 28, 3: 0, 4: 18, 5: 40, 6: 32 };
  const base = baseMap[stationId] || 50;
  const data = [];
  for (let h = 0; h < 24; h++) {
    const factor = 0.3 + 0.7 * Math.sin(((h - 6) * Math.PI) / 14);
    const val = Math.max(0, Math.round(base * factor + (Math.random() - 0.5) * base * 0.2));
    data.push({ saat: `${String(h).padStart(2,'0')}:00`, kw: val });
  }
  return data;
}

// NLG Analizi — istasyona göre
export function getNLGAnalysis(station) {
  if (station.status === 'fault') {
    return {
      title: `${station.shortName} İstasyonu — Aktif Arıza`,
      items: [
        { label: 'Arıza Durumu', text: `${station.shortName} istasyonunda aktif arıza tespit edildi. İstasyon şu anda hizmet dışı olup araç şarjı yapılamamaktadır.` },
        { label: 'Olası Neden', text: 'Sensör verilerinde voltaj dengesizliği ve yüksek sıcaklık anomalisi gözlemlendi. Konnektör mekanizmasında yıpranma işaretleri mevcut.' },
        { label: 'Öneri', text: 'Teknik ekibin sahaya gönderilmesi ve konnektör + soğutma sisteminin kontrol edilmesi önerilmektedir.' },
      ],
      alert: null,
    };
  }
  if (station.status === 'risk') {
    return {
      title: `${station.shortName} İstasyonu — Uyarı`,
      items: [
        { label: 'Veri İncelemesi', text: `Son 7 günlük verilere göre ${station.shortName} istasyonunda normalin dışında sıcaklık artışı ve voltaj dalgalanması gözlemlenmektedir.` },
        { label: 'Trend Tespiti', text: `Anomali skoru son 48 saatte sürekli artış eğiliminde. Hafta içi trafik yoğunluğu ve yüksek talep dönemlerinde sistem üzerinde artan stres tespit edilmektedir.` },
        { label: 'Tahmin', text: `Bu trend devam ederse ${station.faultEta} arıza oluşma riski %${station.faultRisk} olarak hesaplanmaktadır.` },
      ],
      alert: {
        label: `Olası Arıza Uyarısı`,
        text: `"${station.faultEta} içinde ${station.shortName} istasyonunda teknik arıza meydana gelebilir. Sistem stabilitesini korumak için aşağıdaki aksiyonlar önerilir:\n1. İstasyon yük limitinin geçici olarak azaltılması.\n2. Teknik ekip ile önleyici bakım planlanması.\n3. Yedek istasyonlara yönlendirme hazırlığı yapılması."`,
      },
    };
  }
  return {
    title: `${station.shortName} İstasyonu — Normal`,
    items: [
      { label: 'Veri İncelemesi', text: `${station.shortName} istasyonu normal çalışma parametreleri içinde. Son 7 günde toplam ${stationEnergyHistory[station.id]?.reduce((a,b)=>a+b,0) || 0} kWh enerji sağlandı.` },
      { label: 'Enerji Tahmini', text: `Hava koşulları ve trafik verilerine göre bugün ${station.energyToday > 0 ? Math.round(station.energyToday * 1.05) : 0} kWh tüketim beklenmektedir. Hafta sonu talebin %15 artması öngörülüyor.` },
      { label: 'Sistem Sağlığı', text: `Arıza riski düşük (%${station.faultRisk}). Bir sonraki periyodik bakım tarihini takip etmeniz yeterlidir.` },
    ],
    alert: null,
  };
}

// ── FaultDetectionPage için fallback alert verileri ───────────
// API bağlantısı yoksa veya anomalies tablosu boşsa gösterilir
export const alerts = [
  { id: 1, station: 'Otopark-1 · Konektör-1', category: 'OverHeating', type: 'critical',
    message: 'Konnektör sıcaklığı 68°C eşiğini aştı. Soğutma sistemi yetersiz.', time: '14:32',
    score: 0.94, resolved: false, recommendation: 'Havalandırma sistemi kontrol edilsin, yük azaltma değerlendirilebilir.' },
  { id: 2, station: 'AVM Giriş · Konektör-2', category: 'VoltageProblem', type: 'warning',
    message: 'Voltaj 257V eşiğini aştı. Ani yük değişimi tespit edildi.', time: '13:15',
    score: 0.81, resolved: false, recommendation: 'Güç kalitesi analizörü ile voltaj ölçümü yapılsın.' },
  { id: 3, station: 'Fabrika Kapı-2 · Konektör-1', category: 'CommLoss', type: 'info',
    message: 'OCPP iletişim kesintisi. 30 saniye bağlantı kurulamadı.', time: '12:00',
    score: 0.62, resolved: true, recommendation: 'Modem/gateway bağlantısı ve SIM kart kontrol edilsin.' },
];

// ── FaultDetectionPage geçmiş grafiği için fallback ────────────
export const faultHistory = [
  { month: 'Eki', total: 12, prevented: 4 },
  { month: 'Kas', total: 9,  prevented: 5 },
  { month: 'Ara', total: 14, prevented: 6 },
  { month: 'Oca', total: 8,  prevented: 5 },
  { month: 'Şub', total: 11, prevented: 7 },
  { month: 'Mar', total: 6,  prevented: 5 },
];

// ── ForecastPage için fallback saatlik tahmin verisi ───────────
// Gerçek predictions tablosu dolduğunda bu veriler devre dışı kalır
export const energyDemandData = Array.from({ length: 37 }, (_, i) => {
  const hour = Math.floor(i / 1.5);
  const base = 80 + 60 * Math.sin(((hour - 6) * Math.PI) / 14);
  const actual = i < 25 ? Math.max(0, Math.round(base + (Math.random() - 0.5) * 20)) : null;
  const forecast = i >= 24 ? Math.max(0, Math.round(base + (Math.random() - 0.5) * 15)) : null;
  return {
    time: `${String(Math.floor(i / 1.5)).padStart(2, '0')}:${i % 2 === 0 ? '00' : '30'}`,
    actual,
    forecast,
    upper: forecast ? forecast + 12 : null,
    lower: forecast ? Math.max(0, forecast - 12) : null,
    isForecast: i >= 24,
  };
});

// ── ForecastPage için fallback haftalık veri ───────────────────
export const weeklyData = [
  { day: 'Pzt', energy: 1120, forecast: 1150 },
  { day: 'Sal', energy: 980,  forecast: 1020 },
  { day: 'Çar', energy: 1340, forecast: 1280 },
  { day: 'Per', energy: 1180, forecast: 1200 },
  { day: 'Cum', energy: 1450, forecast: 1380 },
  { day: 'Cmt', energy: 870,  forecast: 920  },
  { day: 'Paz', energy: 760,  forecast: 810  },
];

// Dashboard özet
export const summary = {
  total: stations.length,
  normal: stations.filter(s => s.status === 'normal').length,
  risk: stations.filter(s => s.status === 'risk').length,
  fault: stations.filter(s => s.status === 'fault').length,
  totalEnergyToday: stations.reduce((a, s) => a + s.energyToday, 0),
  totalSessions: stations.reduce((a, s) => a + s.energySessions, 0),
};
