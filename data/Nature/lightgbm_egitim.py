
# ÖNCE prophet_egitim.py ÇALIŞTIRIN!
# prophet_model.pkl olmadan bu kod çalışmaz!

import pandas as pd
import numpy as np
import pickle
import lightgbm as lgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error

# Veriyi oku (hava verisi dahil)
df = pd.read_csv("lightgbm_veri.csv")
df["ds"] = pd.to_datetime(df["ds"])
df["saat"] = pd.to_datetime(df["saat"])

# Prophet modelini yükle
with open("prophet_model.pkl", "rb") as f:
    prophet_model = pickle.load(f)

# Prophet tahmini al
from prophet import Prophet
tahmin = prophet_model.predict(df[["ds"]].rename(columns={"ds": "ds"}))

# Residual hesapla
df["prophet_tahmin"] = tahmin["yhat"].values
df["residual"] = df["y"] - df["prophet_tahmin"]

# Zaman özellikleri
df["saat_num"] = df["ds"].dt.hour
df["gun"] = df["ds"].dt.dayofweek
df["ay"] = df["ds"].dt.month
df["hafta_sonu"] = (df["ds"].dt.dayofweek >= 5).astype(int)
df["mevsim"] = df["ds"].dt.month % 12 // 3

# Cyclical encoding
df["saat_sin"] = np.sin(2 * np.pi * df["saat_num"] / 24)
df["saat_cos"] = np.cos(2 * np.pi * df["saat_num"] / 24)
df["gun_sin"] = np.sin(2 * np.pi * df["gun"] / 7)
df["gun_cos"] = np.cos(2 * np.pi * df["gun"] / 7)

# Gecikmeli özellikler
df["onceki_1saat"] = df["y"].shift(1)
df["onceki_1gun"] = df["y"].shift(24)
df["onceki_1hafta"] = df["y"].shift(168)

# Hareketli ortalama
df["hareketli_ort_24"] = df["y"].rolling(24).mean()
df["hareketli_std_24"] = df["y"].rolling(24).std()

# Eksik değerleri temizle
df = df.dropna()

# Özellikler ve hedef
features = [
    "saat_sin", "saat_cos", "gun_sin", "gun_cos",
    "ay", "hafta_sonu", "mevsim",
    "onceki_1saat", "onceki_1gun", "onceki_1hafta",
    "hareketli_ort_24", "hareketli_std_24",
    "prophet_tahmin",
    "temperature_c", "humidity_pct", "precipitation_mm"
]

X = df[features]
y = df["residual"]

# Eğitim/test böl
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.15, shuffle=False
)

# LightGBM eğit
model = lgb.LGBMRegressor(
    n_estimators=500,
    learning_rate=0.05,
    num_leaves=31,
    random_state=42
)
model.fit(
    X_train, y_train,
    eval_set=[(X_test, y_test)],
    callbacks=[lgb.early_stopping(50), lgb.log_evaluation(50)]
)

# Performans
y_pred = model.predict(X_test)
mae = mean_absolute_error(y_test, y_pred)
rmse = np.sqrt(mean_squared_error(y_test, y_pred))
print(f"MAE: {mae:.4f}")
print(f"RMSE: {rmse:.4f}")

# Modeli kaydet
model.booster_.save_model("lightgbm_model.txt")
print("LightGBM modeli kaydedildi!")
