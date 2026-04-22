-- ============================================================
--  E-KOS  |  EV Sarj Istasyonu Yonetim Sistemi
--  Veritabani Semasi v2.0  -  TimescaleDB / PostgreSQL
--  4 Katmanli Hiyerarsik ML Mimarisi icin Revize Edilmistir
-- ============================================================

CREATE EXTENSION IF NOT EXISTS timescaledb;

-- ============================================================
-- 1. STATIONS  -  Istasyon statik bilgileri (degismedi)
-- ============================================================
CREATE TABLE IF NOT EXISTS stations (
    station_id      SERIAL PRIMARY KEY,
    station_name    TEXT             NOT NULL,
    city            TEXT             NOT NULL,
    district        TEXT             NOT NULL,
    latitude        DOUBLE PRECISION,
    longitude       DOUBLE PRECISION,
    max_power_kw    NUMERIC(8,2)     NOT NULL,
    station_type    TEXT             NOT NULL CHECK (station_type IN ('AC','DC')),
    created_at      TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 2. SENSOR_DATA  -  Anlik olcum verileri (TimescaleDB hypertable)
--    DEGISIKLIK: soc_pct (Batarya Doluluk Orani) eklendi
--                Model 3 (LSTM Autoencoder) icin zorunlu
-- ============================================================
CREATE TABLE IF NOT EXISTS sensor_data (
    time                TIMESTAMPTZ  NOT NULL,
    station_id          INTEGER      NOT NULL,
    connector_id        SMALLINT     NOT NULL,
    voltage_v           NUMERIC(7,2),
    current_a           NUMERIC(7,2),
    power_kw            NUMERIC(8,3),
    energy_kwh          NUMERIC(10,4),
    temperature_c       NUMERIC(6,2),   -- Istasyon ic sicakligi
    cable_temp_c        NUMERIC(6,2),
    soc_pct             NUMERIC(5,2),   -- YENİ: Batarya doluluk orani (0-100)
    connector_status    TEXT,
    error_code          TEXT DEFAULT 'NoError'
);

SELECT create_hypertable(
    'sensor_data', 'time',
    if_not_exists      => TRUE,
    chunk_time_interval => INTERVAL '1 day'
);

CREATE INDEX IF NOT EXISTS idx_sensor_station_time
    ON sensor_data (station_id, time DESC);

CREATE INDEX IF NOT EXISTS idx_sensor_connector_time
    ON sensor_data (station_id, connector_id, time DESC);

-- ============================================================
-- 3. EXTERNAL_FACTORS  -  Dis cevre verileri (YENİ TABLO)
--    Model 1 (LightGBM - Iklim & Sebeke Uzmani) icin zorunlu
--    Hava durumu + trafik API verilerini saalik olarak kaydeder
-- ============================================================
CREATE TABLE IF NOT EXISTS external_factors (
    time                TIMESTAMPTZ  NOT NULL,
    station_id          INTEGER      NOT NULL,
    temperature_c       NUMERIC(6,2),   -- Dis ortam sicakligi
    humidity_pct        NUMERIC(5,2),   -- Nem orani (0-100)
    precipitation_mm    NUMERIC(6,2),   -- Yagis miktari (mm/saat)
    wind_speed_ms       NUMERIC(6,2),   -- Ruzgar hizi (m/s)
    traffic_index       NUMERIC(5,2),   -- Trafik yogunluk indeksi (0-100)
    weather_condition   TEXT            -- 'clear','rain','snow','storm' vb.
);

SELECT create_hypertable(
    'external_factors', 'time',
    if_not_exists      => TRUE,
    chunk_time_interval => INTERVAL '1 day'
);

CREATE INDEX IF NOT EXISTS idx_external_station_time
    ON external_factors (station_id, time DESC);

-- ============================================================
-- 4. CHARGE_SESSIONS  -  Sarj oturumlari
--    DEGISIKLIK: session_id SERIAL yapildi (OCPP transaction_id ayri tutuldu)
--                avg_current_a ve avg_power_kw oturum ozeti icin eklendi
-- ============================================================
CREATE TABLE IF NOT EXISTS charge_sessions (
    session_id          BIGSERIAL     PRIMARY KEY,
    ocpp_transaction_id INTEGER,                    -- OCPP'den gelen orijinal ID
    station_id          INTEGER       NOT NULL,
    connector_id        SMALLINT      NOT NULL,
    start_time          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    stop_time           TIMESTAMPTZ,
    energy_kwh          NUMERIC(10,4) DEFAULT 0,
    avg_current_a       NUMERIC(7,2),               -- YENİ: Oturum ortalama akimi
    avg_power_kw        NUMERIC(8,3),               -- YENİ: Oturum ortalama gucu
    max_soc_pct         NUMERIC(5,2),               -- YENİ: Oturum max batarya dolulugu
    stop_reason         TEXT
);

CREATE INDEX IF NOT EXISTS idx_sessions_station
    ON charge_sessions (station_id, start_time DESC);

-- ============================================================
-- 5. HARDWARE_LIFECYCLE  -  Donunum omru ve asinma (YENİ TABLO)
--    Model 2 (LightGBM - Mekanik & Donanim Uzmani) icin zorunlu
--    Her konnektor icin kumulatif yasam dongusu verisi
-- ============================================================
CREATE TABLE IF NOT EXISTS hardware_lifecycle (
    id                  BIGSERIAL     PRIMARY KEY,
    recorded_at         TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    station_id          INTEGER       NOT NULL,
    connector_id        SMALLINT      NOT NULL,
    total_plug_cycles   INTEGER       NOT NULL DEFAULT 0,  -- Toplam tak/cikar sayisi
    hardware_health_pct NUMERIC(5,2)  NOT NULL DEFAULT 100, -- Donunum saglik skoru (0-100)
    total_charge_hours  NUMERIC(10,2) DEFAULT 0,           -- Toplam sarj suresi (saat)
    last_maintenance_at TIMESTAMPTZ,                       -- Son bakim tarihi
    connector_model     TEXT,                              -- Konnektor model/marka
    firmware_version    TEXT                               -- Firmware surumu
);

CREATE INDEX IF NOT EXISTS idx_hardware_station_connector
    ON hardware_lifecycle (station_id, connector_id, recorded_at DESC);

-- ============================================================
-- 6. ANOMALIES  -  Nihai anomali kayitlari (Model 4 yazar)
--    DEGISIKLIK: severity P1-P4 formatina donusturuldu
--                meta_data JSON alani eklendi
-- ============================================================
CREATE TABLE IF NOT EXISTS anomalies (
    id                  BIGSERIAL,
    detected_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    station_id          INTEGER      NOT NULL,
    connector_id        SMALLINT     NOT NULL,
    anomaly_score       NUMERIC(5,4),
    fault_type          TEXT,        -- 'GroundFault','HighTemperature','ConnectorLockFailure' vb.
    severity            TEXT         CHECK (severity IN ('P1-Critical','P2-High','P3-Medium','P4-Low')),
    severity_score      SMALLINT,
    contributing_models TEXT[],      -- YENİ: Hangi modeller tetikledi ['model1','model3'] vb.
    is_false_alarm      BOOLEAN      DEFAULT FALSE,
    operator_note       TEXT,
    resolved_at         TIMESTAMPTZ,
    meta_data           JSONB,       -- YENİ: Ek baglam verisi (JSON)
    PRIMARY KEY (id, detected_at)
);

SELECT create_hypertable(
    'anomalies', 'detected_at',
    if_not_exists      => TRUE,
    chunk_time_interval => INTERVAL '1 day'
);

CREATE INDEX IF NOT EXISTS idx_anomalies_station_time
    ON anomalies (station_id, detected_at DESC);

CREATE INDEX IF NOT EXISTS idx_anomalies_fault_type
    ON anomalies (fault_type, detected_at DESC);

-- ============================================================
-- 7. PREDICTIONS  -  Guc tuketimi tahminleri (Model Prophet/LightGBM)
--    DEGISIKLIK: guven araligi ve model meta-verisi eklendi
-- ============================================================
CREATE TABLE IF NOT EXISTS predictions (
    id                  BIGSERIAL    PRIMARY KEY,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    station_id          INTEGER      NOT NULL,
    forecast_time       TIMESTAMPTZ  NOT NULL,
    predicted_kw        NUMERIC(8,3),
    lower_bound_kw      NUMERIC(8,3),  -- YENİ: %95 guven araligi alt sinir
    upper_bound_kw      NUMERIC(8,3),  -- YENİ: %95 guven araligi ust sinir
    model_name          TEXT,          -- YENİ: 'prophet','hybrid','lightgbm'
    model_version       TEXT,
    mape_score          NUMERIC(6,4)   -- YENİ: Onceki tahmin hatasi
);

CREATE INDEX IF NOT EXISTS idx_predictions_station_forecast
    ON predictions (station_id, forecast_time DESC);

-- ============================================================
-- 8. MODEL_INFERENCE_LOGS  -  Her modelin anlık cikti kayitlari (YENİ TABLO)
--    Model 4 (Meta-Model) bu tabloyu okuyarak nihai karar verir.
--    Model 1, 2, 3 bu tabloya YAZAR.
-- ============================================================
CREATE TABLE IF NOT EXISTS model_inference_logs (
    id                  BIGSERIAL,
    inferred_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    station_id          INTEGER      NOT NULL,
    connector_id        SMALLINT     NOT NULL,
    model_name          TEXT         NOT NULL, -- 'model1_climate','model2_hardware','model3_session'
    model_version       TEXT,

    -- Model 1 & 2 ciktilari (siniflandirma olasiliklari)
    fault_class         TEXT,        -- Tahmin edilen hata sinifi
    fault_probability   NUMERIC(5,4),-- Hata olasıligi (0.0000 - 1.0000)

    -- Sinif bazli olasilik dagilimi (Model 1 & 2)
    class_probabilities JSONB,       -- {"GroundFault":0.72,"OverVoltage":0.15,...}

    -- Model 3 ciktisi (anomali skoru)
    anomaly_score       NUMERIC(5,4),-- Reconstruction error tabanli skor (0-1)
    reconstruction_error NUMERIC(10,6), -- Ham reconstruction error degeri

    -- Ortak
    input_features      JSONB,       -- Modele verilen ozellikler (debug icin)
    inference_latency_ms INTEGER,    -- Cikarsama suresi (ms)

    PRIMARY KEY (id, inferred_at)
);

SELECT create_hypertable(
    'model_inference_logs', 'inferred_at',
    if_not_exists      => TRUE,
    chunk_time_interval => INTERVAL '6 hours'
);

CREATE INDEX IF NOT EXISTS idx_inference_station_time
    ON model_inference_logs (station_id, inferred_at DESC);

CREATE INDEX IF NOT EXISTS idx_inference_model_name
    ON model_inference_logs (model_name, inferred_at DESC);

CREATE INDEX IF NOT EXISTS idx_inference_connector
    ON model_inference_logs (station_id, connector_id, inferred_at DESC);


-- ============================================================
-- VIEWS  -  Surekli Toplama Gorunumleri (Continuous Aggregates)
-- ============================================================

-- Saatlik istasyon enerji ozeti
CREATE MATERIALIZED VIEW IF NOT EXISTS hourly_station_energy
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 hour', time)    AS bucket,
    station_id,
    AVG(power_kw)                  AS avg_power_kw,
    SUM(power_kw * (5.0/3600.0))   AS total_energy_kwh,
    COUNT(*)                        AS sample_count,
    MAX(temperature_c)              AS max_temp_c,
    AVG(soc_pct)                    AS avg_soc_pct   -- YENİ
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

-- Gunluk anomali ozeti
CREATE MATERIALIZED VIEW IF NOT EXISTS daily_anomaly_summary
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 day', detected_at)   AS bucket,
    station_id,
    COUNT(*)                             AS total_anomalies,
    COUNT(*) FILTER (WHERE severity = 'P1-Critical') AS p1_critical_count,
    COUNT(*) FILTER (WHERE severity = 'P2-High')     AS p2_high_count,
    COUNT(*) FILTER (WHERE severity = 'P3-Medium')   AS p3_medium_count,
    COUNT(*) FILTER (WHERE severity = 'P4-Low')      AS p4_low_count,
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

-- Konnektor 5 dakikalik durum ozeti
CREATE MATERIALIZED VIEW IF NOT EXISTS connector_status_log
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('5 minutes', time)      AS bucket,
    station_id,
    connector_id,
    connector_status,
    COUNT(*)                            AS occurrence_count,
    AVG(power_kw)                       AS avg_power_kw,
    AVG(soc_pct)                        AS avg_soc_pct,  -- YENİ
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

-- Model performans ozeti (gunluk)
CREATE MATERIALIZED VIEW IF NOT EXISTS daily_model_performance
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 day', inferred_at)   AS bucket,
    model_name,
    station_id,
    COUNT(*)                             AS total_inferences,
    AVG(fault_probability)               AS avg_fault_probability,
    AVG(anomaly_score)                   AS avg_anomaly_score,
    AVG(inference_latency_ms)            AS avg_latency_ms,
    PERCENTILE_CONT(0.95) WITHIN GROUP (
        ORDER BY inference_latency_ms
    )                                    AS p95_latency_ms
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
--must
