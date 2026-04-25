
import pandas as pd
from prophet import Prophet
import pickle

# Veriyi oku
df = pd.read_csv('prophet_temiz.csv')
df['ds'] = pd.to_datetime(df['ds'])

# Türkiye tatil günleri
turkiye_tatilleri = pd.DataFrame({
    'holiday': 'turkiye',
    'ds': pd.to_datetime([
        '2022-01-01',  # Yılbaşı
        '2022-04-23',  # Ulusal Egemenlik
        '2022-05-01',  # İşçi Bayramı
        '2022-05-19',  # Atatürk'ü Anma
        '2022-07-15',  # Demokrasi Bayramı
        '2022-08-30',  # Zafer Bayramı
        '2022-10-29',  # Cumhuriyet Bayramı
    ]),
    'lower_window': 0,
    'upper_window': 1,
})

# Prophet modelini kur
model = Prophet(
    yearly_seasonality=True,
    weekly_seasonality=True,
    daily_seasonality=True,
    holidays=turkiye_tatilleri
)

# Eğit
model.fit(df)

# Modeli kaydet
with open('prophet_model.pkl', 'wb') as f:
    pickle.dump(model, f)

print("Prophet modeli kaydedildi: prophet_model.pkl")

# 30 günlük tahmin yap
gelecek = model.make_future_dataframe(periods=30*24, freq='H')
tahmin = model.predict(gelecek)
tahmin[['ds', 'yhat', 'yhat_lower', 'yhat_upper']].tail(10).to_csv('prophet_tahmin.csv', index=False)
print("Tahmin kaydedildi: prophet_tahmin.csv")
