import time
import random
import psycopg2
from datetime import datetime

DB_CONFIG = {
    "host": "127.0.0.1",
    "database": "ekos",
    "user": "postgres",
    "password": "123456",
    "port": "5432"
}

# Istasyon tanimlari (stations tablosuna bir kez yazilir)
STATIONS = [
    {"id": 1, "name": "Otopark-1 Sarj", "city": "Kocaeli", "district": "Gebze",    "max_kw": 22.0,  "type": "AC"},
    {"id": 2, "name": "AVM Giris Sarj",  "city": "Kocaeli", "district": "Izmit",    "max_kw": 50.0,  "type": "DC"},
    {"id": 3, "name": "Fabrika Kapi-2",  "city": "Kocaeli", "district": "Dilovasi", "max_kw": 150.0, "type": "DC"},
    {"id": 4, "name": "Park Alani-3",    "city": "Kocaeli", "district": "Korfez",   "max_kw": 22.0,  "type": "AC"},
    {"id": 5, "name": "Hastane Sarj",    "city": "Kocaeli", "district": "Izmit",    "max_kw": 22.0,  "type": "AC"},
]

CONNECTOR_STATUSES = ["Available", "Charging", "Charging", "Charging", "Faulted", "Unavailable"]
ERROR_CODES = ["NoError"] * 18 + [
    "OverVoltage", "HighTemperature", "OverCurrentFailure",
    "ConnectorLockFailure", "EVCommunicationError"
]

# Her istasyonun mevcut oturum durumu
session_state = {sid: {cid: {"active": False, "session_id": None, "energy_start": 0.0}
                       for cid in [1, 2]} for sid in range(1, 6)}
session_counter = 0  # Baslangicta MAX(session_id) sorgulanir


def connect_db():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        conn.autocommit = True
        return conn
    except Exception as e:
        print(f"Baglanti Hatasi: {e}")
        return None


def seed_stations(cursor):
    cursor.execute("SELECT COUNT(*) FROM stations")
    if cursor.fetchone()[0] > 0:
        return
    for s in STATIONS:
        cursor.execute("""
            INSERT INTO stations (station_id, station_name, city, district, max_power_kw, station_type)
            VALUES (%s, %s, %s, %s, %s, %s) ON CONFLICT DO NOTHING
        """, (s["id"], s["name"], s["city"], s["district"], s["max_kw"], s["type"]))
    print("Istasyon bilgileri yuklendi.")


def generate_sensor_reading(station_id, connector_id, status):
    if status == "Charging":
        voltage   = round(random.gauss(230.0, 3.0), 2)
        current   = round(random.uniform(10.0, 32.0), 2)
        temp      = round(random.gauss(38.0, 4.0), 2)
        cable_tmp = round(temp - random.uniform(2.0, 6.0), 2)
    elif status == "Faulted":
        voltage   = round(random.choice([
            random.uniform(180, 210), random.uniform(250, 270)
        ]), 2)
        current   = round(random.uniform(0.0, 5.0), 2)
        temp      = round(random.gauss(55.0, 5.0), 2)
        cable_tmp = round(temp - random.uniform(1.0, 3.0), 2)
    else:  # Available / Unavailable
        voltage   = round(random.gauss(230.0, 2.0), 2)
        current   = 0.0
        temp      = round(random.gauss(28.0, 2.0), 2)
        cable_tmp = round(temp - random.uniform(1.0, 3.0), 2)

    power_kw = round((voltage * current) / 1000, 3) if status == "Charging" else 0.0

    error = "NoError"
    if temp > 60:
        error = "HighTemperature"
    elif voltage > 255 or voltage < 200:
        error = "OverVoltage"

    return voltage, current, power_kw, temp, cable_tmp, error


def manage_session(cursor, station_id, connector_id, status, power_kw, energy_session):
    global session_counter
    state = session_state[station_id][connector_id]
    now = datetime.now()

    if status == "Charging" and not state["active"]:
        session_counter += 1
        cursor.execute("""
            INSERT INTO charge_sessions (session_id, station_id, connector_id, start_time, energy_kwh)
            VALUES (%s, %s, %s, %s, 0)
        """, (session_counter, station_id, connector_id, now))
        state["active"] = True
        state["session_id"] = session_counter
        state["energy_start"] = 0.0

    elif status != "Charging" and state["active"]:
        cursor.execute("""
            UPDATE charge_sessions SET stop_time=%s, energy_kwh=%s, stop_reason='EVDisconnected'
            WHERE session_id=%s
        """, (now, round(energy_session, 3), state["session_id"]))
        state["active"] = False
        state["session_id"] = None


def main():
    global session_counter
    conn = connect_db()
    if not conn:
        return
    cursor = conn.cursor()
    seed_stations(cursor)

    # Mevcut en buyuk session_id'den devam et (duplicate key hatasindan kacin)
    cursor.execute("SELECT COALESCE(MAX(session_id), 0) FROM charge_sessions")
    session_counter = cursor.fetchone()[0]
    print(f"Session counter baslatildi: {session_counter + 1}'den devam edilecek.")

    print("Mock Veri Simulasyonu Basladi! (Ctrl+C ile durdur)")
    print("-" * 60)

    energy_accum = {sid: {cid: 0.0 for cid in [1, 2]} for sid in range(1, 6)}
    tick = 0

    try:
        while True:
            tick += 1
            now = datetime.now()

            for station in STATIONS:
                sid = station["id"]
                for cid in [1, 2]:
                    # Durum belirle (%60 sarj, %5 arizali, geri kalan uygun/musait)
                    rand = random.random()
                    if rand < 0.60:
                        status = "Charging"
                    elif rand < 0.65:
                        status = "Faulted"
                    elif rand < 0.80:
                        status = "Unavailable"
                    else:
                        status = "Available"

                    voltage, current, power_kw, temp, cable_tmp, error = \
                        generate_sensor_reading(sid, cid, status)

                    # Kumulatif enerji (5 sn'lik ornekleme)
                    if status == "Charging":
                        energy_accum[sid][cid] += power_kw * (5 / 3600)
                    else:
                        energy_accum[sid][cid] = 0.0

                    # sensor_data tablosuna yaz
                    cursor.execute("""
                        INSERT INTO sensor_data
                            (time, station_id, connector_id, voltage_v, current_a, power_kw,
                             energy_kwh, temperature_c, cable_temp_c, connector_status, error_code)
                        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                    """, (now, sid, cid, voltage, current, power_kw,
                          round(energy_accum[sid][cid], 3),
                          temp, cable_tmp, status, error))

                    # Sarj oturumu yonet
                    manage_session(cursor, sid, cid, status,
                                   power_kw, energy_accum[sid][cid])

                    # Anomali varsa anomalies tablosuna yaz
                    if error != "NoError" or temp > 58:
                        severity = "critical" if temp > 65 or error == "OverCurrentFailure" else "high"
                        fault_map = {
                            "HighTemperature":      "OverHeating",
                            "OverVoltage":          "VoltageProblem",
                            "OverCurrentFailure":   "CurrentSpike",
                            "ConnectorLockFailure": "LockFault",
                            "EVCommunicationError": "CommLoss",
                        }
                        fault_type = fault_map.get(error, "Unknown")
                        score = round(random.uniform(0.75, 0.99), 4)
                        cursor.execute("""
                            INSERT INTO anomalies
                                (detected_at, station_id, connector_id, anomaly_score,
                                 fault_type, severity, severity_score)
                            VALUES (%s,%s,%s,%s,%s,%s,%s)
                        """, (now, sid, cid, score, fault_type, severity,
                              9 if severity == "critical" else 7))

            if tick % 12 == 0:  # Her 1 dakikada bir ozet bas
                print(f"[{now.strftime('%H:%M:%S')}] {tick * 5} sn gecti - veri akisi saglikli")

            time.sleep(5)  # 5 saniyede bir (OCPP standardina uygun)

    except KeyboardInterrupt:
        print("\nSimulasyon durduruldu.")
    finally:
        cursor.close()
        conn.close()


if __name__ == "__main__":
    main()
