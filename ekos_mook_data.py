import time
import random
import psycopg2
from datetime import datetime


DB_CONFIG = {
    "host": "127.0.0.1",       
    "database": "postgres",    
    "user": "postgres",        
    "password": "123456",    
    "port": "5432"
}

def connect_db():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        conn.autocommit = True
        return conn
    except Exception as e:
        print(f"Bağlantı Hatası: {e}")
        return None

def main():
    conn = connect_db()
    if not conn:
        return

    cursor = conn.cursor()
    print(" Simülasyon Başladı! (Durdurmak için Ctrl+C)")
    print("-" * 50)

    try:
        while True:
         
            now = datetime.now()
            station_id = random.randint(1, 10)  # 10 farklı istasyon varmış gibi yapıldı.
            voltage = round(random.uniform(220.0, 240.0), 1) # 220-240V arası
            current = round(random.uniform(5.0, 32.0), 1)    # 5-32 Amper arası
            power = round((voltage * current) / 1000, 3)     # kW cinsinden güç
            
            # Veritabanına Yazma
            sql = "INSERT INTO sensor_data (time, station_id, voltage, current, power) VALUES (%s, %s, %s, %s, %s)"
            cursor.execute(sql, (now, station_id, voltage, current, power))
            
            print(f"📡 [Veri Gönderildi] İstasyon-{station_id} | Güç: {power} kW | Saat: {now.strftime('%H:%M:%S')}")
            
            # Veri akış hızı 
            time.sleep(0.5)

    except KeyboardInterrupt:
        print("\n🛑 Simülasyon durduruldu.")
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    main()