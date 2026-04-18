import os
from contextlib import asynccontextmanager
from typing import Any

import asyncpg
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.encoders import jsonable_encoder
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Uygulama başlarken bağlantı havuzunu oluştur
    app.state.pool = await asyncpg.create_pool(DATABASE_URL, min_size=2, max_size=10)
    yield
    # Uygulama kapanırken havuzu kapat
    await app.state.pool.close()


app = FastAPI(title="EKOS API", version="1.0.0", lifespan=lifespan)

# Frontend'in erişmesine izin ver (React Vite dev sunucusu)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def rows_to_list(rows: list[asyncpg.Record]) -> list[dict[str, Any]]:
    """asyncpg Record listesini JSON serileştirilebilir dict listesine dönüştürür."""
    return [dict(r) for r in rows]


# ── Sağlık kontrolü ────────────────────────────────────────────
@app.get("/health")
async def health():
    return {"status": "ok"}


# ── İstasyon listesi ───────────────────────────────────────────
@app.get("/stations")
async def get_stations():
    async with app.state.pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT * FROM stations ORDER BY station_id"
        )
    return JSONResponse(content=jsonable_encoder(rows_to_list(rows)))


# ── Her istasyon için en güncel sensör okuması ─────────────────
@app.get("/sensor-data/latest")
async def get_latest_sensor_data():
    async with app.state.pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT DISTINCT ON (station_id)
                time, station_id, connector_id,
                voltage_v, current_a, power_kw,
                energy_kwh, temperature_c, cable_temp_c,
                connector_status, error_code
            FROM sensor_data
            ORDER BY station_id, time DESC
            """
        )
    return JSONResponse(content=jsonable_encoder(rows_to_list(rows)))


# ── Belirli istasyonun son 100 sensör kaydı ────────────────────
@app.get("/sensor-data/history/{station_id}")
async def get_sensor_history(station_id: int):
    async with app.state.pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT time, station_id, connector_id,
                   voltage_v, current_a, power_kw,
                   energy_kwh, temperature_c, cable_temp_c,
                   connector_status, error_code
            FROM sensor_data
            WHERE station_id = $1
            ORDER BY time DESC
            LIMIT 100
            """,
            station_id,
        )
    return JSONResponse(content=jsonable_encoder(rows_to_list(rows)))


# ── Son 20 anomali kaydı ───────────────────────────────────────
@app.get("/anomalies")
async def get_anomalies():
    async with app.state.pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT id, detected_at, station_id, connector_id,
                   anomaly_score, fault_type, severity, severity_score,
                   is_false_alarm, operator_note, resolved_at
            FROM anomalies
            ORDER BY detected_at DESC
            LIMIT 20
            """
        )
    return JSONResponse(content=jsonable_encoder(rows_to_list(rows)))


# ── Son 20 şarj oturumu ────────────────────────────────────────
@app.get("/charge-sessions")
async def get_charge_sessions():
    async with app.state.pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT session_id, station_id, connector_id,
                   start_time, stop_time, energy_kwh, stop_reason
            FROM charge_sessions
            ORDER BY start_time DESC
            LIMIT 20
            """
        )
    return JSONResponse(content=jsonable_encoder(rows_to_list(rows)))
