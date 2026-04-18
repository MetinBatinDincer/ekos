// E-KOS canlı veri hook'u
// API'den 5 saniyede bir veri çeker ve mock istasyon yapısıyla birleştirir.
// Bağlantı kesilirse mock verilerle çalışmaya devam eder.

import { useState, useEffect, useRef } from 'react';
import { getStations, getLatestSensor, getAnomalies, getChargeSessions } from '../services/api';
import { stations as mockStations } from '../data/mockData';

// Sensör verisinden istasyon durumu türetir
function sensorToStatus(sensor) {
  if (!sensor) return null;
  // Hata kodu veya Faulted durumu → arıza
  if (sensor.error_code !== 'NoError' || sensor.connector_status === 'Faulted') return 'fault';
  // Yüksek sıcaklık → dikkat
  if (sensor.temperature_c > 50) return 'risk';
  return 'normal';
}

// API istasyon + sensör verilerini mock istasyon şemasıyla birleştirir.
// Görsel yapı değişmez; sadece durum, risk ve canlı ölçüm alanları güncellenir.
function mergeWithMock(apiStations, sensorList) {
  // Sensör verisini station_id'ye göre indeksle
  const sensorMap = {};
  sensorList.forEach(row => { sensorMap[row.station_id] = row; });

  return mockStations.map(mock => {
    const sensor = sensorMap[mock.id];
    const derivedStatus = sensorToStatus(sensor);
    const status = derivedStatus ?? mock.status; // API verisi yoksa mock durumu koru

    const isFault = status === 'fault';
    const isRisk  = status === 'risk';

    return {
      ...mock, // tüm mock alanları koru (geçmiş grafikler, konum, tip vb.)

      // Gerçek zamanlı durum alanları
      status,
      statusLabel: isFault ? 'Arıza' : isRisk ? 'Dikkat' : 'Sorunsuz',
      faultRisk:   isFault ? 100 : isRisk ? Math.max(mock.faultRisk, 55) : Math.min(mock.faultRisk, 35),
      faultEta:    isFault ? 'Aktif arıza' : isRisk ? 'Yakın vadeli risk' : mock.faultEta,

      // Canlı sensör ölçümleri
      currentPower:    sensor?.power_kw      ?? null,
      currentTemp:     sensor?.temperature_c ?? null,
      currentVoltage:  sensor?.voltage_v     ?? null,
      currentCurrent:  sensor?.current_a     ?? null,
      connectorStatus: sensor?.connector_status ?? null,
      lastErrorCode:   sensor?.error_code    ?? 'NoError',
      lastSeen:        sensor?.time          ?? null,

      // energyToday, energySessions, uptime, type, power (kapasite), lat/lng →
      // gerçek günlük toplam API'si olmadığı için mock'tan gelmeye devam eder
    };
  });
}

export default function useEkosData() {
  const [liveStations,    setLiveStations]    = useState(mockStations);
  const [anomalies,       setAnomalies]       = useState([]);
  const [chargeSessions,  setChargeSessions]  = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [lastUpdated,     setLastUpdated]     = useState(null);
  const [apiError,        setApiError]        = useState(false);
  const intervalRef = useRef(null);

  const fetchAll = async () => {
    try {
      // Dört endpoint'i paralel olarak çek
      const [apiStations, sensorData, anomalyData, sessionData] = await Promise.all([
        getStations(),
        getLatestSensor(),
        getAnomalies(),
        getChargeSessions(),
      ]);

      setLiveStations(mergeWithMock(apiStations, sensorData));
      setAnomalies(anomalyData);
      setChargeSessions(sessionData);
      setLastUpdated(new Date());
      setApiError(false);
    } catch (err) {
      console.warn('E-KOS API bağlantı hatası — mock verilerle devam ediliyor:', err.message);
      setApiError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll(); // sayfa açılışında hemen çek
    intervalRef.current = setInterval(fetchAll, 5000); // 5 saniyede bir yenile
    return () => clearInterval(intervalRef.current);   // component kapanınca temizle
  }, []);

  return { liveStations, anomalies, chargeSessions, loading, lastUpdated, apiError };
}
