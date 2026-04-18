"""
E-KOS  -  Veritabani Dogrulama Araci
TimescaleDB extension, hypertable durumu ve tablo satir sayilarini kontrol eder.
"""
import psycopg2

DB_CONFIG = {
    "host": "127.0.0.1",
    "database": "ekos",
    "user": "postgres",
    "password": "123456",
    "port": "5432",
}

TABLES = ["stations", "sensor_data", "charge_sessions", "anomalies", "predictions"]
VIEWS  = ["hourly_station_energy", "daily_anomaly_summary", "connector_status_log"]


def check(conn):
    cur = conn.cursor()

    # TimescaleDB versiyon kontrolu
    cur.execute("SELECT extversion FROM pg_extension WHERE extname = 'timescaledb'")
    row = cur.fetchone()
    if row:
        print(f"[OK] TimescaleDB  v{row[0]}")
    else:
        print("[!!] TimescaleDB eklentisi BULUNAMADI")

    # Hypertable kontrolleri
    for tbl in ["sensor_data", "anomalies"]:
        cur.execute("""
            SELECT hypertable_name
            FROM timescaledb_information.hypertables
            WHERE hypertable_name = %s
        """, (tbl,))
        if cur.fetchone():
            print(f"[OK] {tbl:<25} -> Hypertable")
        else:
            print(f"[!!] {tbl:<25} -> Normal tablo (hypertable DEGIL)")

    print()
    print("Tablo Satir Sayilari:")
    print("-" * 40)
    for tbl in TABLES:
        cur.execute(f"SELECT COUNT(*) FROM {tbl}")
        print(f"  {tbl:<25} {cur.fetchone()[0]:>8} satir")

    print()
    print("Surekli Toplama Gorunumleri:")
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

    cur.close()


if __name__ == "__main__":
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        check(conn)
        conn.close()
    except Exception as e:
        print(f"Baglanti hatasi: {e}")
