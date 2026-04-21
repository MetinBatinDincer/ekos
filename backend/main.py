import os
from contextlib import asynccontextmanager
from typing import Any

import asyncpg
from dotenv import load_dotenv
from fastapi import FastAPI, Query
from fastapi.encoders import jsonable_encoder
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.pool = await asyncpg.create_pool(DATABASE_URL, min_size=2, max_size=10)
    yield
    await app.state.pool.close()


app = FastAPI(title="EKOS API", version="2.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def rows_to_list(rows: list[asyncpg.Record]) -> list[dict[str, Any]]:
    return [dict(r) for r in rows]


# ── Sağlık kontrolü ────────────────────────────────────────────────────────────
@app.get("/health")
async def health():
    return {"status": "ok"}


# ── İstasyon listesi ───────────────────────────────────────────────────────────
@app.get("/stations")
async def get_stations():
    async with app.state.pool.acquire() as conn:
        rows = await conn.fetch("SELECT * FROM stations ORDER BY station_id")
    return JSONResponse(content=jsonable_encoder(rows_to_list(rows)))


# ── Her istasyon için en güncel sensör okuması ─────────────────────────────────
@app.get("/sensor-data/latest")
async def get_latest_sensor_data():
    async with app.state.pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT DISTINCT ON (station_id)
                time, station_id, connector_id,
                voltage_v, current_a, power_kw,
                energy_kwh, temperature_c, cable_temp_c,
                soc_pct, connector_status, error_code
            FROM sensor_data
            ORDER BY station_id, time DESC
        """)
    return JSONResponse(content=jsonable_encoder(rows_to_list(rows)))


# ── Belirli istasyonun son N sensör kaydı ──────────────────────────────────────
@app.get("/sensor-data/history/{station_id}")
async def get_sensor_history(
    station_id: int,
    limit: int = Query(default=100, le=1000)
):
    async with app.state.pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT time, station_id, connector_id,
                   voltage_v, current_a, power_kw,
                   energy_kwh, temperature_c, cable_temp_c,
                   soc_pct, connector_status, error_code
            FROM sensor_data
            WHERE station_id = $1
            ORDER BY time DESC
            LIMIT $2
        """, station_id, limit)
    return JSONResponse(content=jsonable_encoder(rows_to_list(rows)))


# ── Son N anomali kaydı (Model 4 çıktısı) ──────────────────────────────────────
@app.get("/anomalies")
async def get_anomalies(limit: int = Query(default=20, le=200)):
    async with app.state.pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT id, detected_at, station_id, connector_id,
                   anomaly_score, fault_type, severity, severity_score,
                   contributing_models, is_false_alarm, operator_note,
                   resolved_at, meta_data
            FROM anomalies
            ORDER BY detected_at DESC
            LIMIT $1
        """, limit)
    return JSONResponse(content=jsonable_encoder(rows_to_list(rows)))


# ── Belirli istasyona ait anomaliler ───────────────────────────────────────────
@app.get("/anomalies/{station_id}")
async def get_station_anomalies(station_id: int, limit: int = Query(default=20, le=200)):
    async with app.state.pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT id, detected_at, station_id, connector_id,
                   anomaly_score, fault_type, severity, severity_score,
                   contributing_models, is_false_alarm, operator_note, resolved_at
            FROM anomalies
            WHERE station_id = $1
            ORDER BY detected_at DESC
            LIMIT $2
        """, station_id, limit)
    return JSONResponse(content=jsonable_encoder(rows_to_list(rows)))


# ── Son N şarj oturumu ─────────────────────────────────────────────────────────
@app.get("/charge-sessions")
async def get_charge_sessions(limit: int = Query(default=20, le=200)):
    async with app.state.pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT session_id, station_id, connector_id,
                   start_time, stop_time, energy_kwh,
                   avg_current_a, avg_power_kw, max_soc_pct, stop_reason
            FROM charge_sessions
            ORDER BY start_time DESC
            LIMIT $1
        """, limit)
    return JSONResponse(content=jsonable_encoder(rows_to_list(rows)))


# ── Dış faktörler (son 24 saat) ────────────────────────────────────────────────
@app.get("/external-factors/{station_id}")
async def get_external_factors(station_id: int):
    async with app.state.pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT time, station_id, temperature_c, humidity_pct,
                   precipitation_mm, wind_speed_ms, traffic_index, weather_condition
            FROM external_factors
            WHERE station_id = $1
              AND time >= NOW() - INTERVAL '24 hours'
            ORDER BY time DESC
        """, station_id)
    return JSONResponse(content=jsonable_encoder(rows_to_list(rows)))


# ── Donanım yaşam döngüsü ──────────────────────────────────────────────────────
@app.get("/hardware/{station_id}")
async def get_hardware_lifecycle(station_id: int):
    async with app.state.pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT DISTINCT ON (connector_id)
                recorded_at, station_id, connector_id,
                total_plug_cycles, hardware_health_pct,
                total_charge_hours, last_maintenance_at,
                connector_model, firmware_version
            FROM hardware_lifecycle
            WHERE station_id = $1
            ORDER BY connector_id, recorded_at DESC
        """, station_id)
    return JSONResponse(content=jsonable_encoder(rows_to_list(rows)))


# ── Model inference logları (son 1 saat) ───────────────────────────────────────
@app.get("/inference-logs/{station_id}")
async def get_inference_logs(station_id: int, model: str = Query(default=None)):
    async with app.state.pool.acquire() as conn:
        if model:
            rows = await conn.fetch("""
                SELECT inferred_at, station_id, connector_id, model_name,
                       fault_class, fault_probability, anomaly_score,
                       reconstruction_error, inference_latency_ms
                FROM model_inference_logs
                WHERE station_id = $1
                  AND model_name = $2
                  AND inferred_at >= NOW() - INTERVAL '1 hour'
                ORDER BY inferred_at DESC
                LIMIT 100
            """, station_id, model)
        else:
            rows = await conn.fetch("""
                SELECT inferred_at, station_id, connector_id, model_name,
                       fault_class, fault_probability, anomaly_score,
                       reconstruction_error, inference_latency_ms
                FROM model_inference_logs
                WHERE station_id = $1
                  AND inferred_at >= NOW() - INTERVAL '1 hour'
                ORDER BY inferred_at DESC
                LIMIT 300
            """, station_id)
    return JSONResponse(content=jsonable_encoder(rows_to_list(rows)))


# ── Saatlik enerji özeti (continuous aggregate) ────────────────────────────────
@app.get("/stats/hourly-energy/{station_id}")
async def get_hourly_energy(station_id: int):
    async with app.state.pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT bucket, station_id, avg_power_kw,
                   total_energy_kwh, sample_count, max_temp_c, avg_soc_pct
            FROM hourly_station_energy
            WHERE station_id = $1
              AND bucket >= NOW() - INTERVAL '7 days'
            ORDER BY bucket DESC
        """, station_id)
    return JSONResponse(content=jsonable_encoder(rows_to_list(rows)))


# ── Günlük anomali özeti (continuous aggregate) ────────────────────────────────
@app.get("/stats/daily-anomalies/{station_id}")
async def get_daily_anomalies(station_id: int):
    async with app.state.pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT bucket, station_id, total_anomalies,
                   p1_critical_count, p2_high_count,
                   p3_medium_count, p4_low_count,
                   avg_anomaly_score, false_alarm_count
            FROM daily_anomaly_summary
            WHERE station_id = $1
              AND bucket >= NOW() - INTERVAL '30 days'
            ORDER BY bucket DESC
        """, station_id)
    return JSONResponse(content=jsonable_encoder(rows_to_list(rows)))


# ── Model performans özeti ─────────────────────────────────────────────────────
@app.get("/stats/model-performance")
async def get_model_performance():
    async with app.state.pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT bucket, model_name, station_id,
                   total_inferences, avg_fault_probability,
                   avg_anomaly_score, avg_latency_ms, p95_latency_ms
            FROM daily_model_performance
            WHERE bucket >= NOW() - INTERVAL '7 days'
            ORDER BY bucket DESC, model_name
        """)
    return JSONResponse(content=jsonable_encoder(rows_to_list(rows)))