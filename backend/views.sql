-- ============================================================
--  E-KOS  |  TimescaleDB Surekli Toplama Gorunumleri
--  Mevcut politikalar silinip guncel offset'lerle yeniden eklenir
-- ============================================================

-- ============================================================
-- 1. HOURLY_STATION_ENERGY
--    Her istasyon icin saatlik ort. guc ve toplam enerji
--    Politika: start=6 saat, end=2 saat, her 30 dakikada guncellenir
-- ============================================================
CREATE MATERIALIZED VIEW IF NOT EXISTS hourly_station_energy
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 hour', time)    AS bucket,
    station_id,
    AVG(power_kw)                  AS avg_power_kw,
    SUM(power_kw * (5.0/3600.0))   AS total_energy_kwh,
    COUNT(*)                        AS sample_count,
    MAX(temperature_c)              AS max_temp_c
FROM sensor_data
GROUP BY bucket, station_id
WITH NO DATA;

SELECT add_continuous_aggregate_policy(
    'hourly_station_energy',
    start_offset      => INTERVAL '6 hours',
    end_offset        => INTERVAL '2 hours',
    schedule_interval => INTERVAL '30 minutes',
    if_not_exists     => TRUE
);

-- ============================================================
-- 2. DAILY_ANOMALY_SUMMARY
--    Her istasyon icin gunluk anomali ozeti
--    Politika: start=4 gun, end=2 gun, her 1 saatte guncellenir
-- ============================================================
CREATE MATERIALIZED VIEW IF NOT EXISTS daily_anomaly_summary
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 day', detected_at)   AS bucket,
    station_id,
    COUNT(*)                             AS total_anomalies,
    COUNT(*) FILTER (WHERE severity = 'critical') AS critical_count,
    COUNT(*) FILTER (WHERE severity = 'high')     AS high_count,
    COUNT(*) FILTER (WHERE severity = 'medium')   AS medium_count,
    COUNT(*) FILTER (WHERE severity = 'low')      AS low_count,
    AVG(anomaly_score)                   AS avg_anomaly_score,
    COUNT(*) FILTER (WHERE is_false_alarm = TRUE) AS false_alarm_count
FROM anomalies
GROUP BY bucket, station_id
WITH NO DATA;

SELECT add_continuous_aggregate_policy(
    'daily_anomaly_summary',
    start_offset      => INTERVAL '4 days',
    end_offset        => INTERVAL '2 days',
    schedule_interval => INTERVAL '1 hour',
    if_not_exists     => TRUE
);

-- ============================================================
-- 3. CONNECTOR_STATUS_LOG
--    Konnektor basina 5 dakikalik durum ozeti
--    Politika: start=1 saat, end=5 dakika, her 5 dakikada guncellenir
-- ============================================================
CREATE MATERIALIZED VIEW IF NOT EXISTS connector_status_log
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('5 minutes', time)      AS bucket,
    station_id,
    connector_id,
    connector_status,
    COUNT(*)                            AS occurrence_count,
    AVG(power_kw)                       AS avg_power_kw,
    MAX(error_code) FILTER (
        WHERE error_code <> 'NoError'
    )                                   AS last_error_code
FROM sensor_data
GROUP BY bucket, station_id, connector_id, connector_status
WITH NO DATA;

SELECT add_continuous_aggregate_policy(
    'connector_status_log',
    start_offset      => INTERVAL '1 hour',
    end_offset        => INTERVAL '5 minutes',
    schedule_interval => INTERVAL '5 minutes',
    if_not_exists     => TRUE
);
