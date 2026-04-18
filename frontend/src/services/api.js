// E-KOS API İstemcisi — Vite proxy üzerinden FastAPI backend'e bağlanır
// Vite, /api/* isteklerini localhost:8000'e yönlendirir; CORS sorunu olmaz.

const BASE_URL = '/api';

// Temel fetch yardımcısı — hata yönetimi dahil
async function apiFetch(endpoint) {
  const res = await fetch(`${BASE_URL}${endpoint}`);
  if (!res.ok) throw new Error(`API Hatası [${res.status}]: ${endpoint}`);
  return res.json();
}

// GET /health → sunucu sağlık kontrolü
export const getHealth = () => apiFetch('/health');

// GET /stations → tüm istasyonların statik bilgileri
export const getStations = () => apiFetch('/stations');

// GET /sensor-data/latest → istasyon başına en son sensör okuması
export const getLatestSensor = () => apiFetch('/sensor-data/latest');

// GET /sensor-data/history/{station_id} → belirli istasyonun son 100 kaydı
export const getSensorHistory = (stationId) => apiFetch(`/sensor-data/history/${stationId}`);

// GET /anomalies → son 20 anomali kaydı (detected_at DESC)
export const getAnomalies = () => apiFetch('/anomalies');

// GET /charge-sessions → son 20 şarj oturumu (start_time DESC)
export const getChargeSessions = () => apiFetch('/charge-sessions');
