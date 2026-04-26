
# ÖNCE lstm_egitim.py ÇALIŞTIRIN!
# lstm_model.h5 olmadan bu kod çalışmaz!

import pandas as pd
import numpy as np
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix
from sklearn.preprocessing import LabelEncoder
import tensorflow as tf

# Veriyi oku
df = pd.read_csv("xgboost_veri.csv")

# LSTM modelini yükle
lstm_model = tf.keras.models.load_model("lstm_model.h5")

# Sadece sayısal kolonları al
features = ["bus_voltage_V", "current_mA", "power_mW", "temperature_c"]
df_temiz = df[features + ["ariza_tipi"]].dropna()

# LSTM için veriyi hazırla
adim = 10
scaler_data = df_temiz[features].values

from sklearn.preprocessing import MinMaxScaler
scaler = MinMaxScaler()
veri_scaled = scaler.fit_transform(scaler_data)

# LSTM anomali skoru hesapla
X_lstm = []
indices = []
for i in range(len(veri_scaled) - adim):
    X_lstm.append(veri_scaled[i:i+adim])
    indices.append(i + adim)

X_lstm = np.array(X_lstm)
X_pred = lstm_model.predict(X_lstm)
reconstruction_error = np.mean(np.abs(X_lstm - X_pred), axis=(1,2))

# Anomali skorunu dataframe e ekle
df_model = df_temiz.iloc[indices].copy()
df_model["anomaly_score"] = reconstruction_error

# XGBoost için özellikler
X = df_model[features + ["anomaly_score"]]
y = df_model["ariza_tipi"]

# Etiketleri sayıya çevir
le = LabelEncoder()
y_encoded = le.fit_transform(y)

# Eğitim/test böl
X_train, X_test, y_train, y_test = train_test_split(
    X, y_encoded, test_size=0.15, random_state=42
)

# XGBoost eğit
model = xgb.XGBClassifier(
    n_estimators=300,
    learning_rate=0.05,
    max_depth=6,
    random_state=42,
    eval_metric="mlogloss"
)
model.fit(
    X_train, y_train,
    eval_set=[(X_test, y_test)],
    verbose=50
)

# Performans
y_pred = model.predict(X_test)
print(classification_report(y_test, y_pred, target_names=le.classes_))

# Modeli kaydet
model.save_model("xgboost_model.json")
import pickle
with open("label_encoder.pkl", "wb") as f:
    pickle.dump(le, f)
print("XGBoost modeli kaydedildi: xgboost_model.json")
print("Label encoder kaydedildi: label_encoder.pkl")
