
E-KOS PROJESİ - MODEL EĞİTİM REHBERİ
======================================

GENEL MİMARİ:
-------------
Model 1 (Prophet + LightGBM) → Enerji talebi tahmini
  - Hava durumu + trafik + kullanım alışkanlıklarına göre ileriye dönük tahmin yapar
  - Prophet: geçmiş verilere bakarak trend ve mevsimsellik öğrenir
  - LightGBM: Prophet in açıklayamadığı kısmı hava/trafik verisiyle düzeltir
  - Kore verisiyle eğitilir, Türkiye verisi geldikçe kendini günceller

Model 2 (XGBoost) → Arıza sınıflandırma
  - Model 3 ten gelen anomali skoru + sensör verisi + hava verisi alır
  - Bu hangi arıza tipi? Hava kaynaklı mı, donanım kaynaklı mı? sorusunu cevaplar
  - 6 arıza tipi: Voltaj Problemi, Aşırı Isınma, Kilit Arızası,
    Akım Dalgalanması, İletişim Kesintisi, Diğer

Model 3 (LSTM Autoencoder) → Anomali tespiti
  - Voltaj + akım + güç verilerini okur
  - Bu normal mi, değil mi? der
  - Anomali skoru üretir → Model 2 ye gönderir

Model 4 (Meta-Model) → Karar verici
  - Tüm modellerden gelen verileri birleştirir
  - Geçmiş bağlamı da kullanır (Model 1 den)
  - P1/P2/P3/P4 kararı verir:
    P1: Acil Kesinti
    P2: Hizmet Dışı
    P3: Güç Düşürme
    P4: NLG Uyarısı

======================================
MODEL EĞİTİM SIRASI - BUNU MUTLAKA OKUYUN!
======================================

ADIM 1: Önce MODEL 3 eğitilecek (LSTM)
ADIM 2: Sonra MODEL 1A eğitilecek (Prophet)
ADIM 3: Sonra MODEL 1B eğitilecek (LightGBM)
ADIM 4: Sonra MODEL 2 eğitilecek (XGBoost)
ADIM 5: En son MODEL 4 eğitilecek (Meta-Model)

NEDEN BU SIRA? Çünkü:
- Model 2, Model 3 ün çıktısına ihtiyaç duyuyor
- LightGBM, Prophet in çıktısına ihtiyaç duyuyor
- Model 4, tüm modellerin çıktısına ihtiyaç duyuyor
- Sırayı karıştırırsanız kod hata verir!

======================================
MODEL 3 - LSTM EĞİTİMİ (1. ADIM - İLK BU!)
======================================
Gereken dosyalar:
  - EVSE-B-PowerCombined.csv (data/UNB klasöründe)
  - lstm_egitim.py (data/UNB klasöründe)

Adımlar:
  1. Colab i açın
  2. EVSE-B-PowerCombined.csv dosyasını Colab a yükleyin
  3. lstm_egitim.py dosyasını Colab a yükleyin
  4. lstm_egitim.py dosyasını çalıştırın
  5. Çıktı olarak lstm_model.h5 oluşacak
  6. Bu dosyayı indirip data/UNB klasörüne koyun

======================================
MODEL 1A - PROPHET EĞİTİMİ (2. ADIM)
======================================
Gereken dosyalar:
  - prophet_temiz.csv (data/Nature klasöründe)
  - prophet_egitim.py (data/Nature klasöründe)

Adımlar:
  1. Colab i açın
  2. prophet_temiz.csv dosyasını Colab a yükleyin
  3. prophet_egitim.py dosyasını Colab a yükleyin
  4. prophet_egitim.py dosyasını çalıştırın
  5. Çıktı olarak prophet_model.pkl ve prophet_tahmin.csv oluşacak

!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
!! KRİTİK UYARI - BUNU ATLAMA!!     !!
!! prophet_model.pkl dosyasını       !!
!! MUTLAKA indirip sakla!            !!
!! Bu dosya olmadan LightGBM         !!
!! kesinlikle çalışmaz!              !!
!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

======================================
MODEL 1B - LIGHTGBM EĞİTİMİ (3. ADIM - PROPHET OLMADAN ÇALIŞMAZ!)
======================================
Gereken dosyalar:
  - lightgbm_veri.csv (data/Nature klasöründe)
  - lightgbm_egitim.py (data/Nature klasöründe)
  - prophet_model.pkl ← 2. ADIMDAN ÇIKAN DOSYA! UNUTMA!
  - prophet_tahmin.csv ← 2. ADIMDAN ÇIKAN DOSYA! UNUTMA!

Adımlar:
  1. Colab i açın
  2. lightgbm_veri.csv dosyasını Colab a yükleyin
  3. lightgbm_egitim.py dosyasını Colab a yükleyin
  4. prophet_model.pkl dosyasını Colab a yükleyin ← KRİTİK!
  5. prophet_tahmin.csv dosyasını Colab a yükleyin ← KRİTİK!
  6. lightgbm_egitim.py dosyasını çalıştırın
  7. Çıktı olarak lightgbm_model.txt oluşacak
  8. Bu dosyayı indirip data/Nature klasörüne koyun

======================================
MODEL 2 - XGBOOST EĞİTİMİ (4. ADIM - LSTM OLMADAN ÇALIŞMAZ!)
======================================
Gereken dosyalar:
  - EVSE-B-PowerCombined.csv (data/UNB klasöründe)
  - xgboost_egitim.py (data/UNB klasöründe - henüz hazırlanıyor)
  - lstm_model.h5 ← 1. ADIMDAN ÇIKAN DOSYA! UNUTMA!

Adımlar:
  1. Colab i açın
  2. Yukarıdaki dosyaları Colab a yükleyin
  3. xgboost_egitim.py dosyasını çalıştırın
  4. Çıktı olarak xgboost_model.json oluşacak
  5. Bu dosyayı indirip data/UNB klasörüne koyun

======================================
MODEL 4 - META MODEL (5. ADIM - EN SON BU!)
======================================
Henüz hazırlanıyor. Tüm modeller eğitildikten sonra yapılacak.
Gerekli dosyalar: lstm_model.h5, prophet_model.pkl,
                  lightgbm_model.txt, xgboost_model.json

======================================
VERİ KAYNAKLARI
======================================
- UNB Dataseti: https://www.unb.ca/cic/datasets/evse-dataset-2024.html
- Nature Dataseti: https://www.nature.com/articles/s41597-024-02942-9
- Hava Verisi: Open-Meteo API (ucretsiz, gecmis veri destekliyor)
- Canli Hava Verisi: OpenWeatherMap API
  (api key: d340ff2e9794e8f82be79aebe6c26361)

======================================
KLASOR YAPISI
======================================
ekos/
  data/
    UNB/
      EVSE-B-PowerCombined.csv
      benign_temiz.csv
      lstm_egitim.py
      lstm_model.h5 (egitimden sonra gelecek)
      xgboost_egitim.py (henuz hazirlaniyor)
      xgboost_model.json (egitimden sonra gelecek)
    Nature/
      ChargingRecords.csv
      prophet_temiz.csv
      prophet_egitim.py
      prophet_model.pkl (egitimden sonra gelecek - KRİTİK!)
      prophet_tahmin.csv (egitimden sonra gelecek)
      kore_hava.csv
      lightgbm_veri.csv
      lightgbm_egitim.py
      lightgbm_model.txt (egitimden sonra gelecek)
    README.txt

======================================
ÖNEMLİ NOT - SENTETİK İÇ SICAKLIK
======================================
Model 2 (XGBoost) eğitiminden önce UNB verisine
sentetik iç sıcaklık eklenecek!

NEDEN?
- UNB verisinde iç sıcaklık (temperature_c) kolonu yok
- Aşırı Isınma arızasını tespit etmek için sıcaklık şart
- Bu yüzden fiziksel kurallara göre sentetik üretilecek

NASIL?
- Normal şarj sırasında iç sıcaklık: 20-35°C arası
- Aşırı ısınma durumunda: 55°C üzeri
- Dış sıcaklıkla orantılı olarak üretilecek

NEREYE EKLENECEK?
- EVSE-B-PowerCombined.csv dosyasına
- xgboost_egitim.py içinde otomatik eklenecek
- Ayrıca bir şey yapmanıza gerek yok!
======================================

======================================
MODEL 2 - XGBOOST EĞİTİMİ (4. ADIM - LSTM OLMADAN ÇALIŞMAZ!)
======================================
Gereken dosyalar:
  - xgboost_veri.csv (data/UNB klasöründe)
  - xgboost_egitim.py (data/UNB klasöründe)
  - lstm_model.h5 <- 1. ADIMDAN ÇIKAN DOSYA! UNUTMA!

Adımlar:
  1. Colab i açın
  2. xgboost_veri.csv dosyasını Colab a yükleyin
  3. xgboost_egitim.py dosyasını Colab a yükleyin
  4. lstm_model.h5 dosyasını Colab a yükleyin <- KRİTİK!
  5. xgboost_egitim.py dosyasını çalıştırın
  6. Çıktı olarak xgboost_model.json ve label_encoder.pkl oluşacak
  7. Bu dosyaları indirip data/UNB klasörüne koyun

!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
!! KRİTİK UYARI!!                   !!
!! lstm_model.h5 olmadan XGBoost    !!
!! kesinlikle çalışmaz!             !!
!! Önce Model 3 u eğitmeyi unutma! !!
!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

======================================
ÖNEMLİ NOT - SICAKLIK VE MODEL 3
======================================
MEVCUT DURUM:
- Model 3 (LSTM) şu an sıcaklık görmüyor
- Sıcaklık sadece Model 2 ve Model 4 te var
- Model 4 e geçici olarak sıcaklık eklendi

NEDEN SORUN?
- Sıcaklık 62 C olsa bile Model 3 Normal diyor
- Çünkü LSTM voltaj+akim+güç ile eğitildi
- Sıcaklığı göremediği için anomali skoru düşük kalıyor

YAPILMASI GEREKEN:
- Gerçek OCPP verisi gelince Model 3 yeniden eğitilmeli
- Bu sefer temperature_c de dahil edilmeli
- Yani 4 özellikle eğitilmeli:
  voltage_v, current_a, power_kw, temperature_c
- Bu yapılınca Model 4 ten sıcaklık çıkarılabilir

ÖNCELIK: Yüksek - Gerçek veri gelince ilk yapılacak iş bu!
======================================

======================================
MODEL TEST SONUÇLARI
======================================
10 farklı istasyon senaryosu test edildi:

Normal istasyonlar (P4 - İzle):
  - Diyarbakır: Voltaj=5.19V, Akım=520mA, Sıcaklık=28C → P4 ✅
  - Konya: Voltaj=5.18V, Akım=450mA, Sıcaklık=22C → P4 ✅
  - Trabzon: Voltaj=5.20V, Akım=500mA, Sıcaklık=20C → P4 ✅
  - İzmir: Voltaj=5.19V, Akım=850mA, Sıcaklık=25C → P4 ✅

Acil durumlar (P1/P2):
  - Ankara: Sıcaklık=62C → Aşırı Isınma → P1 ACİL KESİNTİ ✅
  - İstanbul: Akım=1100mA → Akım Dalgalanması → P2 HİZMET DIŞI ✅
  - Antalya: Akım=980mA + Sıcaklık=58C → Aşırı Isınma → P2 ✅
  - Adana: Akım=1050mA + Sıcaklık=45C → Akım Dalgalanması → P2 ✅

Orta durumlar (P3):
  - Bursa: İletişim Kesintisi → P3 GÜÇ DÜŞÜRME ✅
  - Gaziantep: İletişim Kesintisi → P3 GÜÇ DÜŞÜRME ✅

Model Performansları:
  - Model 3 (LSTM): val_loss=0.0014 (çok iyi)
  - Model 2 (XGBoost): %80 genel doğruluk
  - Model 4 (Meta-Model): %100 doğruluk
  - Model 1 (Prophet): MAE=10.35 kWh (kabul edilebilir)

======================================
TRAFİK VERİSİ - NEREYE EKLENECEK
======================================
Trafik verisi şu an sistemde YOK. İleride eklenecek.

NEREYE EKLENECEK?
  - Model 1 (LightGBM) girdilerine eklenecek
  - lightgbm_veri.csv dosyasına trafik_indeksi kolonu eklenecek
  - lightgbm_egitim.py içindeki features listesine eklenecek:
    features = [..., "trafik_indeksi", "ortalama_hiz"]

HANGİ API KULLANILACAK?
  - Google Maps Traffic API veya TomTom Traffic API
  - Her 15 dakikada bir güncelleme
  - İstasyon koordinatına göre trafik verisi çekilecek

NEDEN ÖNEMLİ?
  - Yoğun trafikte en yakın istasyon tercih edilir
  - Trafik yoğunluğu şarj talebini doğrudan etkiler
  - Eklenince LightGBM MAE değeri önemli ölçüde düşecek

======================================
İLERİDE YAPILACAKLAR
======================================

1. İSTASYON BAZLI EĞİTİM (ÖNCELİKLİ!)
   Şu an: Genel bir model eğitildi (Kore verisi)
   Olması gereken: Her istasyon için ayrı model
   Nasıl:
     - Her istasyonun OCPP verisi ayrı ayrı toplanacak
     - Her istasyon için ayrı Prophet modeli eğitilecek
     - Her istasyon kendi koordinatına göre hava verisi alacak
     - Tahminler çok daha doğru olacak

2. MODEL 3 E SICAKLIK EKLENMESİ (ÖNCELİKLİ!)
   Şu an: LSTM sıcaklığı görmüyor
   Olması gereken: voltage_v + current_a + power_kw + temperature_c
   Ne zaman: Gerçek OCPP verisi gelince yeniden eğitilecek
   Not: Şu an Model 4 e geçici olarak sıcaklık eklendi

3. TRAFİK VERİSİ ENTEGRASYONU
   Google Maps veya TomTom API ile trafik verisi eklenecek
   LightGBM MAE değeri düşecek

4. PERİYODİK YENİDEN EĞİTİM
   Şu an: Modeller bir kez eğitildi
   Olması gereken: Her ay yeni veriyle yeniden eğitim
   Nasıl: Yeni OCPP verisi biriktikçe modeller güncellenir
   Öneri: Ayda bir otomatik yeniden eğitim döngüsü

5. TÜRKIYE VERİSİYLE EĞİTİM
   Şu an: Kore verisiyle eğitildi (genel davranış)
   Olması gereken: Türkiye istasyon verisiyle eğitim
   Beklenti: MAE değeri önemli ölçüde düşecek
   Türkiye tatilleri zaten eklendi (Ramazan, Kurban, resmi tatiller)

6. MODEL 2 VOLTAJ PROBLEMİ İYİLEŞTİRMESİ
   Şu an: Voltaj Problemi F1 skoru çok düşük (0.05)
   Neden: UNB verisi siber saldırı verisi, gerçek voltaj anomalisi yok
   Çözüm: Gerçek voltaj anomalisi verisi bulunacak veya
           OCPP verisinden voltaj spike ları etiketlenecek

7. META MODEL GÜNCELLEMESİ
   Şu an: Kural tabanlı etiketlerle eğitildi
   Olması gereken: Gerçek operatör kararlarıyla eğitilmeli
   Nasıl: Operatörler sistemi kullandıkça kararları kaydedilir
           Bu kararlarla Meta-Model yeniden eğitilir
           Böylece model operatör davranışını öğrenir

8. NLG MODÜLÜ
   Şu an: Yok
   Olması gereken: Arıza açıklamalarını Türkçe üretecek
   Örnek: "İstasyon 5 te aşırı ısınma tespit edildi.
           Son 2 saattir sıcaklık artış eğiliminde."

======================================
KLASOR YAPISI (GÜNCEL)
======================================
ekos/
  data/
    UNB/
      EVSE-B-PowerCombined.csv
      benign_temiz.csv
      lstm_egitim.py
      lstm_model.h5 ✅ eğitildi
      xgboost_egitim.py
      xgboost_veri.csv
      xgboost_model.json ✅ eğitildi
      label_encoder.pkl ✅
    Nature/
      ChargingRecords.csv
      prophet_temiz.csv
      prophet_egitim.py
      prophet_model.pkl ✅ eğitildi
      prophet_tahmin.csv ✅
      kore_hava.csv
      lightgbm_veri.csv
      lightgbm_egitim.py
      lightgbm_model.txt ✅ eğitildi
    Meta/
      meta_model.json ✅ eğitildi
      label_encoder_p.pkl ✅
      label_encoder_ariza.pkl ✅
      tahmin_grafik.png ✅
    README.txt
