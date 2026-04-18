# E-KOS — Elektrikli Arac Sarj Istasyonu Yonetim Sistemi

Gercek zamanli sensor verisi toplama, anomali tespiti ve guc tuketimi tahminleri icin tasarlanmis bir EV sarj altyapi yonetim platformu. Zaman serisi verileri TimescaleDB uzerinde tutulur.

---

## Klasor Yapisi

```
E:\projects\ekos\
├── backend\
│   ├── main.py               FastAPI backend (localhost:8000)
│   ├── requirements.txt      Python bagimliliklari
│   ├── .env                  Veritabani baglanti dizesi
│   ├── ekos_mock_data.py     Gercek zamanli veri simulatoru
│   ├── schema.sql            Tablo tanimlari (TimescaleDB)
│   ├── views.sql             Surekli toplama gorunumleri
│   └── verify_db.py          Veritabani dogrulama araci
└── frontend\
    ├── src\
    │   ├── services\api.js   FastAPI istemcisi
    │   ├── hooks\useEkosData.js  5 sn'lik canli veri hook'u
    │   └── components\       Dashboard, Harita, Istasyonlar vb.
    └── package.json
```

---

## Veritabani (TimescaleDB / PostgreSQL)

Docker konteyneri: `timescaledb-pg16`  
Baglanti: `host=127.0.0.1, port=5432, db=ekos, user=postgres`

### Tablolar

| Tablo | Aciklama |
|---|---|
| `stations` | 5 sarj istasyonu statik bilgisi (Gebze, Izmit x2, Dilovasi, Korfez) |
| `sensor_data` | Anlik sensor olcumleri — **TimescaleDB hypertable**, 5 sn'de bir |
| `charge_sessions` | Sarj oturumu baslangic/bitis kayitlari |
| `anomalies` | Tespit edilen arizalar — **TimescaleDB hypertable** |
| `predictions` | ML modeli guc tahminleri (henuz doldurulmadi) |

### Surekli Toplama Gorunumleri

| Gorunum | Pencere | Guncelleme |
|---|---|---|
| `hourly_station_energy` | 1 saatlik | 30 dakikada bir |
| `daily_anomaly_summary` | Gunluk | 1 saatte bir |
| `connector_status_log` | 5 dakikalik | 5 dakikada bir |

---

## Kurulum ve Calistirma

### 1. Semaya uygula (ilk kurulumda)

```bash
cd backend
python -c "
import psycopg2, pathlib
conn = psycopg2.connect(host='127.0.0.1', database='ekos', user='postgres', password='123456')
conn.autocommit = True
cur = conn.cursor()
# schema.sql ve views.sql icin docker cp + psql kullan
"
# Veya Docker uzerinden:
docker cp schema.sql timescaledb-pg16:/schema.sql
docker exec timescaledb-pg16 psql -U postgres -d ekos -f //schema.sql
docker cp views.sql timescaledb-pg16:/views.sql
docker exec timescaledb-pg16 psql -U postgres -d ekos -f //views.sql
```

### 2. Veritabanini dogrula

```bash
cd backend
python verify_db.py
```

### 3. Mock simulatoru calistir

```bash
cd backend
python ekos_mock_data.py
```

5 istasyon x 2 konnektor = 10 veri noktasi / 5 saniye

### 4. Backend API'yi baslat

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

API: `http://localhost:8000` | Dokumantasyon: `http://localhost:8000/docs`

### 5. Frontend'i baslat

```bash
cd frontend
npm install
npm run dev
```

Arayuz: `http://localhost:5173`

---

## Backend API Endpoint'leri

| Endpoint | Aciklama |
|---|---|
| `GET /health` | Sunucu saglik kontrolu |
| `GET /stations` | Tum istasyon listesi |
| `GET /sensor-data/latest` | Her istasyon icin en son sensor okumasi |
| `GET /anomalies` | Son 20 anomali kaydi |

---

*E-KOS — Akilli EV Altyapi Yonetimi*
