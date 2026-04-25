
import pandas as pd
import numpy as np
from sklearn.preprocessing import MinMaxScaler
from tensorflow.keras.models import Model
from tensorflow.keras.layers import Input, LSTM, RepeatVector, TimeDistributed, Dense

# Veriyi oku
df = pd.read_csv('EVSE-B-PowerCombined.csv')

# Sadece normal verileri al
benign = df[df['Label'] == 'benign']
benign_temiz = benign[['bus_voltage_V', 'current_mA', 'power_mW']].copy()

# Normalize et
scaler = MinMaxScaler()
veri_scaled = scaler.fit_transform(benign_temiz.values)

# LSTM formatına getir
adim = 10
X = []
for i in range(len(veri_scaled) - adim):
    X.append(veri_scaled[i:i+adim])
X = np.array(X)

# Modeli kur
inputs = Input(shape=(adim, 3))
encoded = LSTM(32, activation='relu')(inputs)
decoded = RepeatVector(adim)(encoded)
decoded = LSTM(32, activation='relu', return_sequences=True)(decoded)
outputs = TimeDistributed(Dense(3))(decoded)

model = Model(inputs, outputs)
model.compile(optimizer='adam', loss='mse')

# Eğit
history = model.fit(X, X, epochs=50, batch_size=32, validation_split=0.1, shuffle=True)

# Modeli kaydet
model.save('lstm_model.h5')
print("Model kaydedildi: lstm_model.h5")
