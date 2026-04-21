"""
E-KOS  |  Gercek Zamanli Mock Veri Simulatoru v2.0
====================================================
4 Katmanli ML Mimarisi icin guncellenmistir.

Yeni ozellikler:
  - soc_pct (Batarya Doluluk Orani) sensor_data'ya eklendi
  - external_factors tablosuna saatlik hava/trafik verisi yaziliyor
  - hardware_lifecycle tablosuna gunluk donanim saglik verisi yaziliyor
  - model_inference_logs tablosuna 3 modelin simule edilmis ciktilari yaziliyor
  - anomalies tablosu artik Model 4 (meta-model) tarafindan dolduruluyor
  - severity P1-P4 formatina guncellendi

Mantiksal Tetikleyici Zinciri:
  - Yagis + Nem → GroundFault voltaj sapmasi
  - Dis sicaklik yuksek → HighTemperature
  - Trafik yuku yuksek → UnderVoltage
  - SoC > 80% → Akim dogal olarak dusuyor (Model 3 icin NORMAL)
  - Hardware health dusuk → Mekanik arizalar
"""

import time
import random
import json
import math
import psycopg2
from datetime import datetime, timedelta

DB_CONFIG = {
    "host": "127.0.0.1",
    "database": "ekos",
    "user": "postgres",
    "password": "123456",
    "port": "5432"
}

STATIONS = [
    {"id": 1, "name": "Otopark-1 Sarj", "city": "Kocaeli", "district": "Gebze",    "max_kw": 22.0,  "type": "AC"},
    {"id": 2, "name": "AVM Giris Sarj",  "city": "Kocaeli", "district": "Izmit",    "max_kw": 50.0,  "type": "DC"},
    {"id": 3, "name": "Fabrika Kapi-2",  "city": "Kocaeli", "district": "Dilovasi", "max_kw": 150.0, "type": "DC"},
    {"id": 4, "name": "Park Alani-3",    "city": "Kocaeli", "district": "Korfez",   "max_kw": 22.0,  "type": "AC"},
    {"id": 5, "name": "Hastane Sarj",    "city": "Kocaeli", "district": "Izmit",    "max_kw": 22.0,  "type": "AC"},
]

FAULT_MAP_M1 = {
    "GroundFault":    ("P1-Critical", 95),
    "OverVoltage":    ("P1-Critical", 90),
    "HighTemperature":("P2-High",     80),
    "UnderVoltage":   ("P2-High",     75),
}
FAULT_MAP_M2 = {
    "ConnectorLockFailure": ("P3-Medium", 60),
    "ReaderFailure":        ("P3-Medium", 55),
    "PowerMeterFailure":    ("P2-High",   78),
}

# Her konnektörün çalışma zamanı durumu
session_state = {
    sid: {cid: {"active": False, "session_id": None,
                "energy_kwh": 0.0, "soc": 20.0,
                "currents": [], "powers": []}
          for cid in [1, 2]}
    for sid in range(1, 6)
}

# Donanım yaşam döngüsü durumu (bellekte tutulur, günlük DB'ye yazılır)
hw_state = {
    sid: {cid: {"cycles": random.randint(0, 5000),
                "health": random.uniform(60, 100),
                "hours":  random.uniform(0, 2000)}
          for cid in [1, 2]}
    for sid in range(1, 6)
}

session_counter = 0
last_external_write = None   # Son hava verisi yazma zamanı
last_hw_write = None         # Son donanım yazma zamanı (gün bazlı)


# ─── DB Bağlantısı ────────────────────────────────────────────────────────────
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


# ─── Dış Faktörler ────────────────────────────────────────────────────────────
def generate_external_factors(now: datetime) -> dict:
    """Saatlik hava durumu ve trafik verisi üret."""
    hour = now.hour
    day_of_year = now.timetuple().tm_yday

    # Mevsimsel sıcaklık
    seasonal_temp = 15 - 10 * math.sin(2 * math.pi * (day_of_year - 80) / 365)
    temp_c = round(seasonal_temp + random.gauss(0, 2), 2)

    # Nem
    base_humidity = 55 + 20 * math.sin(2 * math.pi * day_of_year / 365)
    humidity = round(min(100, max(20, base_humidity + random.gauss(0, 8))), 2)

    # Yağış (nem > 70 ise daha olası)
    rain_prob = 0.10 if humidity < 70 else 0.30
    precipitation = round(random.expovariate(1/3) if random.random() < rain_prob else 0.0, 3)

    # Trafik (pik saatler: 07-09, 17-20)
    is_peak = (7 <= hour <= 9) or (17 <= hour <= 20)
    base_traffic = 40 + 40 * is_peak
    traffic_index = round(min(100, max(0, base_traffic + random.gauss(0, 10))), 2)

    # Hava koşulu
    if precipitation > 5:
        condition = "storm"
    elif precipitation > 0:
        condition = "rain"
    elif temp_c < 0:
        condition = "snow"
    else:
        condition = "clear"

    return {
        "temp_c": temp_c,
        "humidity": humidity,
        "precipitation": precipitation,
        "wind_speed": round(abs(random.gauss(3, 2)), 2),
        "traffic_index": traffic_index,
        "condition": condition,
    }


def write_external_factors(cursor, now: datetime, ext: dict):
    """Saatlik olarak external_factors tablosuna yaz."""
    for station in STATIONS:
        cursor.execute("""
            INSERT INTO external_factors
                (time, station_id, temperature_c, humidity_pct, precipitation_mm,
                 wind_speed_ms, traffic_index, weather_condition)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
        """, (now, station["id"], ext["temp_c"], ext["humidity"],
              ext["precipitation"], ext["wind_speed"],
              ext["traffic_index"], ext["condition"]))


# ─── Donanım Yaşam Döngüsü ────────────────────────────────────────────────────
def update_hw_state(sid: int, cid: int, charging: bool, session_minutes: float = 0):
    """Her oturum sonunda donanım durumunu güncelle."""
    hw = hw_state[sid][cid]
    if charging:
        hw["hours"] += session_minutes / 60
    hw["cycles"] += 1
    # Logaritmik bozulma
    degradation = 0.003 * (1 + hw["cycles"] / 10000) + random.gauss(0, 0.1)
    hw["health"] = max(0, hw["health"] - abs(degradation))


def write_hw_lifecycle(cursor, now: datetime):
    """Günlük hardware_lifecycle tablosuna yaz."""
    for sid in range(1, 6):
        for cid in [1, 2]:
            hw = hw_state[sid][cid]
            cursor.execute("""
                INSERT INTO hardware_lifecycle
                    (recorded_at, station_id, connector_id, total_plug_cycles,
                     hardware_health_pct, total_charge_hours)
                VALUES (%s,%s,%s,%s,%s,%s)
            """, (now, sid, cid,
                  int(hw["cycles"]),
                  round(hw["health"], 2),
                  round(hw["hours"], 2)))


# ─── Sensör Verisi Üretimi ────────────────────────────────────────────────────
def generate_sensor_reading(sid: int, cid: int, status: str,
                            ext: dict, soc: float) -> dict:
    """
    Mantıksal tetikleyici kurallarıyla sensör verisi üret.
    """
    hw = hw_state[sid][cid]
    fault_m1 = "NoFault"
    fault_m2 = "NoFault"
    error_code = "NoError"

    # Temel elektrik değerleri
    voltage_v   = round(random.gauss(230.0, 2.0), 2)
    int_temp_c  = round(ext["temp_c"] + 15 + random.gauss(0, 1.5), 2)
    cable_temp  = round(int_temp_c + random.uniform(1, 3), 2)

    if status == "Charging":
        # SoC > 80% → akım doğal düşüşü (Model 3 için NORMAL davranış)
        if soc > 80:
            max_current = 32.0 * (1 - (soc - 80) / 20) ** 1.5
            max_current = max(max_current, 2.0)
        else:
            max_current = 32.0

        current_a = round(max_current * random.uniform(0.85, 1.0) + random.gauss(0, 0.3), 2)
        current_a = max(0.0, current_a)
        power_kw  = round((current_a * voltage_v) / 1000, 3)

        # ── MODEL 1 HATA KURALLARI ──────────────────────────────
        # GroundFault: yağış + yüksek nem
        if ext["precipitation"] > 2.0 and ext["humidity"] > 78 and random.random() < 0.12:
            voltage_v  = round(voltage_v * random.uniform(0.82, 0.94), 2)
            fault_m1   = "GroundFault"
            error_code = "GroundFailure"

        # OverVoltage: ani şebeke gerilimi
        elif random.random() < 0.008:
            voltage_v  = round(420 + random.uniform(10, 30), 2)
            fault_m1   = "OverVoltage"
            error_code = "OverVoltage"

        # UnderVoltage: yüksek trafik yükü
        elif ext["traffic_index"] > 80 and random.random() < 0.015:
            voltage_v  = round(voltage_v * random.uniform(0.78, 0.88), 2)
            fault_m1   = "UnderVoltage"
            error_code = "UnderVoltage"

        # HighTemperature: sıcak hava + aktif şarj
        elif ext["temp_c"] > 28 and random.random() < 0.03:
            int_temp_c = round(int_temp_c + random.uniform(8, 18), 2)
            cable_temp = round(cable_temp + random.uniform(10, 20), 2)
            fault_m1   = "HighTemperature"
            error_code = "HighTemperature"

        # ── MODEL 2 HATA KURALLARI ──────────────────────────────
        if hw["health"] < 50 and random.random() < 0.02:
            fault_m2   = "ConnectorLockFailure"
            error_code = error_code if error_code != "NoError" else "ConnectorLockFailure"
        elif hw["health"] < 35 and random.random() < 0.025:
            fault_m2   = "ReaderFailure"
            error_code = error_code if error_code != "NoError" else "ReaderFailure"
        elif hw["health"] < 20 and random.random() < 0.04:
            power_kw   = round(power_kw * random.uniform(0.6, 0.8), 3)
            fault_m2   = "PowerMeterFailure"
            error_code = error_code if error_code != "NoError" else "PowerMeterFailure"

    elif status == "Faulted":
        voltage_v  = round(random.choice([
            random.uniform(180, 210), random.uniform(250, 270)
        ]), 2)
        current_a  = round(random.uniform(0.0, 5.0), 2)
        int_temp_c = round(random.gauss(55.0, 5.0), 2)
        cable_temp = round(int_temp_c - random.uniform(1, 3), 2)
        power_kw   = 0.0
        fault_m1   = "OverVoltage" if voltage_v > 240 else "UnderVoltage"
        error_code = "OverVoltage" if voltage_v > 240 else "UnderVoltage"
    else:
        current_a = 0.0
        power_kw  = 0.0

    return {
        "voltage_v":    voltage_v,
        "current_a":    max(0.0, current_a) if status == "Charging" else 0.0,
        "power_kw":     max(0.0, power_kw)  if status == "Charging" else 0.0,
        "temperature_c": int_temp_c,
        "cable_temp_c":  cable_temp,
        "error_code":    error_code,
        "fault_m1":      fault_m1,
        "fault_m2":      fault_m2,
    }


# ─── Oturum Yönetimi ──────────────────────────────────────────────────────────
def manage_session(cursor, sid: int, cid: int, status: str,
                   reading: dict, now: datetime):
    global session_counter
    state = session_state[sid][cid]

    if status == "Charging" and not state["active"]:
        session_counter += 1
        state["active"]     = True
        state["session_id"] = session_counter
        state["energy_kwh"] = 0.0
        state["soc"]        = random.uniform(10, 40)
        state["currents"]   = []
        state["powers"]     = []
        cursor.execute("""
            INSERT INTO charge_sessions
                (ocpp_transaction_id, station_id, connector_id, start_time, energy_kwh)
            VALUES (%s,%s,%s,%s,0)
        """, (session_counter * 100 + random.randint(0, 99), sid, cid, now))

    elif status != "Charging" and state["active"]:
        avg_i = round(sum(state["currents"]) / len(state["currents"]), 2) if state["currents"] else 0
        avg_p = round(sum(state["powers"])   / len(state["powers"]),   3) if state["powers"]   else 0
        cursor.execute("""
            UPDATE charge_sessions
            SET stop_time=%s, energy_kwh=%s, avg_current_a=%s,
                avg_power_kw=%s, max_soc_pct=%s, stop_reason='EVDisconnected'
            WHERE session_id=%s
        """, (now, round(state["energy_kwh"], 4), avg_i, avg_p,
              round(state["soc"], 2), state["session_id"]))
        update_hw_state(sid, cid, True)
        state["active"]     = False
        state["session_id"] = None

    # Aktif oturum: enerji ve SoC güncelle
    if state["active"]:
        state["energy_kwh"] += reading["power_kw"] * (5 / 3600)
        soc_inc = random.uniform(0.005, 0.02)
        state["soc"] = min(100.0, state["soc"] + soc_inc)
        state["currents"].append(reading["current_a"])
        state["powers"].append(reading["power_kw"])


# ─── Model Inference Simülasyonu ──────────────────────────────────────────────
def write_inference_logs(cursor, now: datetime, sid: int, cid: int,
                         reading: dict, soc: float):
    """3 modelin çıktısını model_inference_logs tablosuna yaz."""

    fault_m1 = reading["fault_m1"]
    fault_m2 = reading["fault_m2"]

    # ── Model 1: İklim & Şebeke ──────────────────────────────────
    m1_classes = ["GroundFault", "HighTemperature", "OverVoltage", "UnderVoltage", "NoFault"]
    if fault_m1 == "NoFault":
        probs_m1 = [0.02, 0.02, 0.02, 0.02, 0.92]
    else:
        idx  = m1_classes.index(fault_m1)
        base = [0.02] * 5
        base[idx] = 0.75 + random.uniform(0, 0.15)
        total = sum(base)
        base  = [p / total for p in base]
        probs_m1 = base

    pred_m1   = m1_classes[probs_m1.index(max(probs_m1))]
    prob_m1   = round(max(probs_m1), 4)

    cursor.execute("""
        INSERT INTO model_inference_logs
            (inferred_at, station_id, connector_id, model_name, model_version,
             fault_class, fault_probability, class_probabilities,
             anomaly_score, reconstruction_error, input_features, inference_latency_ms)
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
    """, (now, sid, cid, "model1_climate", "1.0.0",
          pred_m1, prob_m1,
          json.dumps({c: round(p, 4) for c, p in zip(m1_classes, probs_m1)}),
          None, None,
          json.dumps({"voltage_v": reading["voltage_v"],
                      "temperature_c": reading["temperature_c"]}),
          random.randint(8, 25)))

    # ── Model 2: Mekanik & Donanım ───────────────────────────────
    m2_classes = ["ConnectorLockFailure", "ReaderFailure", "PowerMeterFailure", "NoFault"]
    if fault_m2 == "NoFault":
        probs_m2 = [0.02, 0.02, 0.02, 0.94]
    else:
        idx  = m2_classes.index(fault_m2)
        base = [0.02] * 4
        base[idx] = 0.72 + random.uniform(0, 0.18)
        total = sum(base)
        base  = [p / total for p in base]
        probs_m2 = base

    pred_m2 = m2_classes[probs_m2.index(max(probs_m2))]
    prob_m2 = round(max(probs_m2), 4)
    hw      = hw_state[sid][cid]

    cursor.execute("""
        INSERT INTO model_inference_logs
            (inferred_at, station_id, connector_id, model_name, model_version,
             fault_class, fault_probability, class_probabilities,
             anomaly_score, reconstruction_error, input_features, inference_latency_ms)
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
    """, (now, sid, cid, "model2_hardware", "1.0.0",
          pred_m2, prob_m2,
          json.dumps({c: round(p, 4) for c, p in zip(m2_classes, probs_m2)}),
          None, None,
          json.dumps({"total_plug_cycles": int(hw["cycles"]),
                      "hardware_health_pct": round(hw["health"], 2)}),
          random.randint(5, 18)))

    # ── Model 3: LSTM Autoencoder (Oturum & Güç Eğrisi) ──────────
    # SoC > 80 → akım düşüşü normaldir, reconstruction error düşük kalır
    if soc > 80:
        recon_err     = random.expovariate(1 / 0.02)
    elif reading["fault_m1"] != "NoFault" or reading["fault_m2"] != "NoFault":
        recon_err     = random.uniform(0.35, 0.90)
    else:
        recon_err     = random.expovariate(1 / 0.03)

    recon_err     = min(recon_err, 0.99)
    anomaly_score = round(min(recon_err / 0.90, 1.0), 4)

    cursor.execute("""
        INSERT INTO model_inference_logs
            (inferred_at, station_id, connector_id, model_name, model_version,
             fault_class, fault_probability, class_probabilities,
             anomaly_score, reconstruction_error, input_features, inference_latency_ms)
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
    """, (now, sid, cid, "model3_session", "1.0.0",
          None, None, None,
          anomaly_score, round(recon_err, 6),
          json.dumps({"current_a": reading["current_a"],
                      "power_kw":  reading["power_kw"],
                      "soc_pct":   round(soc, 2)}),
          random.randint(15, 60)))

    return prob_m1, pred_m1, prob_m2, pred_m2, anomaly_score


# ─── Meta-Model (Model 4) → Anomalies ────────────────────────────────────────
def run_meta_model(cursor, now: datetime, sid: int, cid: int,
                   prob_m1: float, pred_m1: str,
                   prob_m2: float, pred_m2: str,
                   anomaly_score_m3: float):
    """Model 4: 3 modelin çıktısını birleştirerek nihai karar ver."""

    M1_THRESH = 0.65
    M2_THRESH = 0.60
    M3_THRESH = 0.45

    m1_hit = (pred_m1 != "NoFault") and (prob_m1 >= M1_THRESH)
    m2_hit = (pred_m2 != "NoFault") and (prob_m2 >= M2_THRESH)
    m3_hit = anomaly_score_m3 >= M3_THRESH

    if not (m1_hit or m2_hit or m3_hit):
        return  # Anomali yok

    n_hit = sum([m1_hit, m2_hit, m3_hit])

    # Yanlış alarm filtresi: tek model tetikleniyorsa ve skoru düşükse
    top_score = max(
        prob_m1 if m1_hit else 0,
        prob_m2 if m2_hit else 0,
        anomaly_score_m3 if m3_hit else 0
    )
    is_false = (n_hit == 1) and (top_score < 0.75)

    # Fault type ve severity belirle
    if m1_hit:
        fault_type = pred_m1
        sev, sev_score = FAULT_MAP_M1.get(fault_type, ("P3-Medium", 60))
    elif m2_hit:
        fault_type = pred_m2
        sev, sev_score = FAULT_MAP_M2.get(fault_type, ("P3-Medium", 60))
    else:
        fault_type = "UnknownAnomaly"
        if anomaly_score_m3 > 0.8:
            sev, sev_score = "P2-High", 82
        elif anomaly_score_m3 > 0.6:
            sev, sev_score = "P3-Medium", 62
        else:
            sev, sev_score = "P4-Low", 45

    contributing = (
        (["model1_climate"] if m1_hit else []) +
        (["model2_hardware"] if m2_hit else []) +
        (["model3_session"]  if m3_hit else [])
    )

    composite = round(prob_m1 * 0.35 + prob_m2 * 0.35 + anomaly_score_m3 * 0.30, 4)

    cursor.execute("""
        INSERT INTO anomalies
            (detected_at, station_id, connector_id, anomaly_score,
             fault_type, severity, severity_score, contributing_models,
             is_false_alarm, meta_data)
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
    """, (now, sid, cid, composite, fault_type, sev, sev_score,
          json.dumps(contributing), is_false,
          json.dumps({"m1_fault": pred_m1, "m1_prob": round(prob_m1, 4),
                      "m2_fault": pred_m2, "m2_prob": round(prob_m2, 4),
                      "m3_score": round(anomaly_score_m3, 4),
                      "n_models": n_hit})))


# ─── Ana Döngü ────────────────────────────────────────────────────────────────
def main():
    global session_counter, last_external_write, last_hw_write

    conn = connect_db()
    if not conn:
        return
    cursor = conn.cursor()
    seed_stations(cursor)

    cursor.execute("SELECT COALESCE(MAX(session_id), 0) FROM charge_sessions")
    session_counter = cursor.fetchone()[0]
    print(f"Session counter: {session_counter + 1}'den devam ediliyor.")
    print("E-KOS Mock Simulasyon v2.0 Basladi! (Ctrl+C ile durdur)")
    print("-" * 60)

    tick = 0

    try:
        while True:
            tick += 1
            now = datetime.now()

            # ── Saatlik: Dış faktörleri yaz ─────────────────────────
            current_hour = now.replace(minute=0, second=0, microsecond=0)
            if last_external_write != current_hour:
                ext = generate_external_factors(now)
                write_external_factors(cursor, current_hour, ext)
                last_external_write = current_hour
            else:
                ext = generate_external_factors(now)  # bellekte tut, DB'ye yazma

            # ── Günlük: Donanım yaşam döngüsünü yaz ─────────────────
            current_day = now.date()
            if last_hw_write != current_day:
                write_hw_lifecycle(cursor, now)
                last_hw_write = current_day

            # ── Her istasyon / konnektör ──────────────────────────────
            for station in STATIONS:
                sid = station["id"]
                for cid in [1, 2]:
                    state = session_state[sid][cid]

                    # Durum belirle
                    rand = random.random()
                    if rand < 0.60:
                        status = "Charging"
                    elif rand < 0.65:
                        status = "Faulted"
                    elif rand < 0.80:
                        status = "Unavailable"
                    else:
                        status = "Available"

                    soc = state["soc"] if state["active"] else 0.0

                    # Sensör okuma
                    reading = generate_sensor_reading(sid, cid, status, ext, soc)

                    # Oturum yönet
                    manage_session(cursor, sid, cid, status, reading, now)

                    # Anlık SoC (oturum güncellendikten sonra)
                    soc = state["soc"] if state["active"] else 0.0

                    # sensor_data yaz
                    cursor.execute("""
                        INSERT INTO sensor_data
                            (time, station_id, connector_id, voltage_v, current_a, power_kw,
                             energy_kwh, temperature_c, cable_temp_c, soc_pct,
                             connector_status, error_code)
                        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                    """, (now, sid, cid,
                          reading["voltage_v"], reading["current_a"], reading["power_kw"],
                          round(state["energy_kwh"], 4) if state["active"] else 0.0,
                          reading["temperature_c"], reading["cable_temp_c"],
                          round(soc, 2) if state["active"] else None,
                          status, reading["error_code"]))

                    # Her 12. tick'te inference logla (60 sn)
                    if tick % 12 == 0:
                        prob_m1, pred_m1, prob_m2, pred_m2, score_m3 = \
                            write_inference_logs(cursor, now, sid, cid, reading, soc)
                        run_meta_model(cursor, now, sid, cid,
                                       prob_m1, pred_m1,
                                       prob_m2, pred_m2,
                                       score_m3)

            if tick % 12 == 0:
                print(f"[{now.strftime('%H:%M:%S')}] {tick * 5} sn | "
                      f"Dis: {ext['temp_c']}°C  Nem: {ext['humidity']}%  "
                      f"Yagis: {ext['precipitation']}mm  Trafik: {ext['traffic_index']}")

            time.sleep(5)

    except KeyboardInterrupt:
        print("\nSimulasyon durduruldu.")
    finally:
        cursor.close()
        conn.close()


if __name__ == "__main__":
    main()