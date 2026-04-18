-- ============================================================
--  E-KOS  |  EV Sarj Istasyonu Yonetim Sistemi
--  Veritabani Semasi  -  TimescaleDB / PostgreSQL
-- ============================================================

-- TimescaleDB eklentisini etkinlestir
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- ============================================================
-- 1. STATIONS  -  Istasyon statik bilgileri
-- ============================================================
CREATE TABLE IF NOT EXISTS stations (
    station_id      SERIAL PRIMARY KEY,
    station_name    TEXT         NOT NULL,
    city            TEXT         NOT NULL,
    district        TEXT         NOT NULL,
    latitude        DOUBLE PRECISION,
    longitude       DOUBLE PRECISION,
    max_power_kw    NUMERIC(8,2) NOT NULL,
    station_type    TEXT         NOT NULL CHECK (station_type IN ('AC','DC')),
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 2. SENSOR_DATA  -  Anlik olcum verileri (TimescaleDB hypertable)
-- ============================================================
CREATE TABLE IF NOT EXISTS sensor_data (
    time                TIMESTAMPTZ  NOT NULL,
    station_id          INTEGER      NOT NULL,
    connector_id        SMALLINT     NOT NULL,
    voltage_v           NUMERIC(7,2),
    current_a           NUMERIC(7,2),
    power_kw            NUMERIC(8,3),
    energy_kwh          NUMERIC(10,4),
    temperature_c       NUMERIC(6,2),
    cable_temp_c        NUMERIC(6,2),
    connector_status    TEXT,
    error_code          TEXT DEFAULT 'NoError'
);

-- Hypertable'a donustur (zaman sutununa gore bolümleme)
SELECT create_hypertable(
    'sensor_data', 'time',
    if_not_exists => TRUE,
    chunk_time_interval => INTERVAL '1 day'
);

CREATE INDEX IF NOT EXISTS idx_sensor_station_time
    ON sensor_data (station_id, time DESC);

CREATE INDEX IF NOT EXISTS idx_sensor_connector_time
    ON sensor_data (station_id, connector_id, time DESC);

-- ============================================================
-- 3. CHARGE_SESSIONS  -  Sarj oturumlari
-- ============================================================
CREATE TABLE IF NOT EXISTS charge_sessions (
    session_id      INTEGER       PRIMARY KEY,
    station_id      INTEGER       NOT NULL,
    connector_id    SMALLINT      NOT NULL,
    start_time      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    stop_time       TIMESTAMPTZ,
    energy_kwh      NUMERIC(10,4) DEFAULT 0,
    stop_reason     TEXT
);

CREATE INDEX IF NOT EXISTS idx_sessions_station
    ON charge_sessions (station_id, start_time DESC);

-- ============================================================
-- 4. ANOMALIES  -  Tespit edilen arizalar ve anomaliler
--    NOT: TimescaleDB hypertable icin birlesik PK gereklidir
-- ============================================================
CREATE TABLE IF NOT EXISTS anomalies (
    id              BIGSERIAL,
    detected_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    station_id      INTEGER      NOT NULL,
    connector_id    SMALLINT     NOT NULL,
    anomaly_score   NUMERIC(5,4),
    fault_type      TEXT,
    severity        TEXT         CHECK (severity IN ('low','medium','high','critical')),
    severity_score  SMALLINT,
    is_false_alarm  BOOLEAN      DEFAULT FALSE,
    operator_note   TEXT,
    resolved_at     TIMESTAMPTZ,
    PRIMARY KEY (id, detected_at)
);

-- anomalies hypertable (detected_at uzerinden bolümleme)
SELECT create_hypertable(
    'anomalies', 'detected_at',
    if_not_exists => TRUE,
    chunk_time_interval => INTERVAL '1 day'
);

CREATE INDEX IF NOT EXISTS idx_anomalies_station_time
    ON anomalies (station_id, detected_at DESC);

-- ============================================================
-- 5. PREDICTIONS  -  Guc tuketimi tahminleri (ML modeli)
-- ============================================================
CREATE TABLE IF NOT EXISTS predictions (
    id              BIGSERIAL    PRIMARY KEY,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    station_id      INTEGER      NOT NULL,
    forecast_time   TIMESTAMPTZ  NOT NULL,
    predicted_kw    NUMERIC(8,3),
    model_version   TEXT
);

CREATE INDEX IF NOT EXISTS idx_predictions_station_forecast
    ON predictions (station_id, forecast_time DESC);
