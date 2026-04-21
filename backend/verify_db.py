"""
E-KOS  |  Veritabani Dogrulama Araci v2.0
==========================================
TimescaleDB extension, hypertable durumu,
tablo satir sayilari ve model inference
saglik kontrollerini gerceklestirir.
"""

import psycopg2

DB_CONFIG = {
    "host": "127.0.0.1",
    "database": "ekos",
    "user": "postgres",
    "password": "123456",
    "port": "5432",
}

TABLES = [
    "stations",
    "sensor_data",
    "external_factors",
    "charge_sessions",
    "hardware_lifecycle",
    "model_inference_logs",
    "anomalies",
    "predictions",
]

HYPERTABLES = [
    "sensor_data",
    "external_factors",
    "anomalies",
    "model_inference_logs",
]

VIEWS = [
    "hourly_station_energy",
    "daily_anomaly_summary",
    "connector_status_log",
    "daily_model_performance",
]

EXPECTED_MODELS = [
    "model1_climate",
    "model2_hardware",
    "model3_session",
]


def check(conn):
    cur = conn.cursor()
    print("=" * 55)
    print("  E-KOS Veritabani Dogrulama v2.0")
    print("=" * 55)

    # ── TimescaleDB versiyon ─────────────────────────────────────
    cur.execute("SELECT extversion FROM pg_extension WHERE extname = 'timescaledb'")
    row = cur.fetchone()
    if row:
        print(f"\n[OK] TimescaleDB  v{row[0]}")
    else:
        print("\n[!!] TimescaleDB eklentisi BULUNAMADI")

    # ── Hypertable kontrolleri ───────────────────────────────────
    print("\nHypertable Durumu:")
    print("-" * 40)
    for tbl in HYPERTABLES:
        cur.execute("""
            SELECT hypertable_name
            FROM timescaledb_information.hypertables
            WHERE hypertable_name = %s
        """, (tbl,))
        if cur.fetchone():
            print(f"  [OK] {tbl:<30} → Hypertable")
        else:
            print(f"  [!!] {tbl:<30} → Normal tablo (hypertable DEGIL)")

    # ── Tablo satır sayıları ─────────────────────────────────────
    print("\nTablo Satir Sayilari:")
    print("-" * 40)
    for tbl in TABLES:
        try:
            cur.execute(f"SELECT COUNT(*) FROM {tbl}")
            count = cur.fetchone()[0]
            status = "OK" if count > 0 else "!!"
            print(f"  [{status}] {tbl:<30} {count:>10,} satir")
        except Exception as e:
            print(f"  [!!] {tbl:<30} HATA: {e}")

    # ── Continuous aggregate view'lar ────────────────────────────
    print("\nSurekli Toplama Gorunumleri:")
    print("-" * 40)
    cur.execute("""
        SELECT view_name
        FROM timescaledb_information.continuous_aggregates
        ORDER BY view_name
    """)
    existing = {r[0] for r in cur.fetchall()}
    for v in VIEWS:
        status = "OK" if v in existing else "!!"
        print(f"  [{status}] {v}")

    # ── Yeni tablo sütun kontrolleri ─────────────────────────────
    print("\nKritik Sutun Kontrolleri:")
    print("-" * 40)
    checks = [
        ("sensor_data",          "soc_pct",              "Model 3 - Batarya dolulugu"),
        ("external_factors",     "precipitation_mm",     "Model 1 - Yagis verisi"),
        ("external_factors",     "traffic_index",        "Model 1 - Trafik indeksi"),
        ("hardware_lifecycle",   "total_plug_cycles",    "Model 2 - Plug cycle sayaci"),
        ("hardware_lifecycle",   "hardware_health_pct",  "Model 2 - Donanim sagligi"),
        ("model_inference_logs", "anomaly_score",        "Model 3 - Anomali skoru"),
        ("model_inference_logs", "class_probabilities",  "Model 1/2 - Sinif olasiliklari"),
        ("anomalies",            "contributing_models",  "Model 4 - Katkida bulunan modeller"),
        ("anomalies",            "meta_data",            "Model 4 - Meta veri"),
        ("charge_sessions",      "max_soc_pct",          "Oturum max SoC"),
    ]
    for table, column, desc in checks:
        cur.execute("""
            SELECT COUNT(*) FROM information_schema.columns
            WHERE table_name = %s AND column_name = %s
        """, (table, column))
        exists = cur.fetchone()[0] > 0
        status = "OK" if exists else "!!"
        print(f"  [{status}] {table}.{column:<25} {desc}")

    # ── Model inference log kontrolü ─────────────────────────────
    print("\nModel Inference Sagligi:")
    print("-" * 40)
    for model in EXPECTED_MODELS:
        cur.execute("""
            SELECT COUNT(*), MAX(inferred_at)
            FROM model_inference_logs
            WHERE model_name = %s
        """, (model,))
        row = cur.fetchone()
        count, last = row
        if count > 0:
            print(f"  [OK] {model:<30} {count:>8,} kayit | Son: {last}")
        else:
            print(f"  [!!] {model:<30} Henuz kayit YOK")

    # ── Anomali severity dağılımı ────────────────────────────────
    print("\nAnomali Severity Dagilimi:")
    print("-" * 40)
    cur.execute("""
        SELECT severity, COUNT(*) as cnt
        FROM anomalies
        GROUP BY severity
        ORDER BY severity
    """)
    rows = cur.fetchall()
    if rows:
        for sev, cnt in rows:
            print(f"  {sev:<20} {cnt:>8,}")
        cur.execute("SELECT COUNT(*) FROM anomalies WHERE is_false_alarm = TRUE")
        fa = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM anomalies")
        total = cur.fetchone()[0]
        rate = (fa / total * 100) if total > 0 else 0
        print(f"\n  Yanlis alarm orani: {fa}/{total} (%{rate:.1f})")
    else:
        print("  Henuz anomali kaydı yok.")

    print("\n" + "=" * 55)
    cur.close()


if __name__ == "__main__":
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        check(conn)
        conn.close()
    except Exception as e:
        print(f"Baglanti hatasi: {e}")