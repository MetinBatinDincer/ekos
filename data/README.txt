
E-KOS PROJESİ - MODEL EĞİTİM REHBERİ
======================================

GENEL MİMARİ:
-------------
Model 1 (Prophet + LightGBM) → Enerji talebi tahmini
  - Hava durumu + trafik + kullanım alışkanlıklarına göre ileriye dönük tahmin yapar
  - Prophet: geçmiş verilere bakarak trend ve mevsimsellik öğrenir
  - LightGBM: Prophet'in açıklayamadığı kısmı hava/trafik verisiyle düzeltir

Model 2 (XGBoost) → Arıza sınıflandırma
  - Model 3'ten gelen anomali skoru + sensör verisi + hava verisi alır
  - "Bu hangi arıza tipi? Hava kaynaklı mı, donanım kaynaklı mı?" sorusunu cevaplar
  - 6 arıza tipi: Voltaj Problemi, Aşırı Isınma, Kilit Arızası, 
    Akım Dalgalanması, İletişim Kesintisi, Diğer

Model 3 (LSTM Autoencoder) → Anomali tespiti
  - Voltaj + akım + güç verilerini okur
  - "Bu normal mi, değil mi?" der
  - Anomali skoru üretir → Model 2'ye gönderir

Model 4 (Meta-Model) → Karar verici
  - Tüm modellerden gelen verileri birleştirir
  - Geçmiş bağlamı da kullanır (Model 1'den)
  - P1/P2/P3/P4 kararı verir:
    P1: Acil Kesinti
    P2: Hizmet Dışı
    P3: Güç Düşürme
    P4: NLG Uyarısı

MODEL SIRASI (ÖNEMLİ!):
------------------------
1. Önce Model 3'ü eğit (LSTM)
2. Sonra Model 1'i eğit (Prophet → sonra LightGBM)
3. Sonra Model 2'yi eğit (XGBoost)
4. En son Model 4'ü eğit (Meta-Model)

NOT: Her model bir öncekinin çıktısına ihtiyaç duyar!

MODEL 3 - LSTM EĞİTİMİ:
------------------------
Dosyalar:
  - EVSE-B-PowerCombined.csv (UNB dataseti)
  - lstm_egitim.py

Adımlar:
  1. İki dosyayı Colab'a yükle
  2. lstm_egitim.py dosyasını çalıştır
  3. Çıktı: lstm_model.h5

MODEL 1 - PROPHET EĞİTİMİ:
----------------------------
Dosyalar:
  - prophet_temiz.csv (Nature dataseti)
  - prophet_egitim.py

Adımlar:
  1. İki dosyayı Colab'a yükle
  2. prophet_egitim.py dosyasını çalıştır
  3. Çıktı: prophet_model.pkl, prophet_tahmin.csv

MODEL 2 VE 4:
-------------
Henüz hazırlanıyor. Yakında eklenecek.

VERİ KAYNAKLARI:
----------------
- UNB Dataseti: https://www.unb.ca/cic/datasets/evse-dataset-2024.html
- Nature Dataseti: https://www.nature.com/articles/s41597-024-02942-9
- Hava Verisi: OpenWeatherMap API (api key: d340ff2e9794e8f82be79aebe6c26361)
