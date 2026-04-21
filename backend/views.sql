-- ============================================================
--  E-KOS  |  TimescaleDB Surekli Toplama Gorunumleri v2.0
--  4 Katmanli ML Mimarisi icin Revize Edilmistir
-- ============================================================

-- ============================================================
-- 1. HOURLY_STATION_ENERGY
--    Her istasyon icin saatlik ort. guc ve toplam enerji
--    YENİ: avg_soc_pct eklendi (Model 3 icin)
-- ============================================================
CREATE MATERIALIZED VIEW IF NOT EXISTS hourly_station_energy
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 hour', time)         AS bucket,
    station_id,
    AVG(power_kw)                       AS avg_power_kw,
    SUM(power_kw * (5.0/3600.0))        AS total_energy_kwh,
    COUNT(*)                            AS sample_count,
    MAX(temperature_c)                  AS max_temp_c,
    AVG(soc_pct)                        AS avg_soc_pct
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
--    YENİ: severity P1-P4 formatina guncellendi
-- ============================================================
CREATE MATERIALIZED VIEW IF NOT EXISTS daily_anomaly_summary
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 day', detected_at)   AS bucket,
    station_id,
    COUNT(*)                            AS total_anomalies,
    COUNT(*) FILTER (WHERE severity = 'P1-Critical') AS p1_critical_count,
    COUNT(*) FILTER (WHERE severity = 'P2-High')     AS p2_high_count,
    COUNT(*) FILTER (WHERE severity = 'P3-Medium')   AS p3_medium_count,
    COUNT(*) FILTER (WHERE severity = 'P4-Low')      AS p4_low_count,
    AVG(anomaly_score)                  AS avg_anomaly_score,
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
--    YENİ: avg_soc_pct eklendi
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
    AVG(soc_pct)                        AS avg_soc_pct,
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

-- ============================================================
-- 4. DAILY_MODEL_PERFORMANCE  (YENİ)
--    Her modelin gunluk inference performans ozeti
--    Model 4 meta-model izleme ve drift tespiti icin
-- ============================================================
CREATE MATERIALIZED VIEW IF NOT EXISTS daily_model_performance
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 day', inferred_at)   AS bucket,
    model_name,
    station_id,
    COUNT(*)                            AS total_inferences,
    AVG(fault_probability)              AS avg_fault_probability,
    AVG(anomaly_score)                  AS avg_anomaly_score,
    AVG(inference_latency_ms)           AS avg_latency_ms,
    PERCENTILE_CONT(0.95) WITHIN GROUP (
        ORDER BY inference_latency_ms
    )                                   AS p95_latency_ms
FROM model_inference_logs
GROUP BY bucket, model_name, station_id
WITH NO DATA;

SELECT add_continuous_aggregate_policy(
    'daily_model_performance',
    start_offset      => INTERVAL '2 days',
    end_offset        => INTERVAL '1 day',
    schedule_interval => INTERVAL '1 hour',
    if_not_exists     => TRUE
);