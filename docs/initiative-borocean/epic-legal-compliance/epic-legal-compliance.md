---
type: epic
title: "Hukuki uyum (SPK ve KVKK)"
parent: initiative-borocean
covers: [FR-130, FR-131]
after: []
assignee: ""
status: done
risk: high
---

# Hukuki uyum (SPK ve KVKK)

## Description

Epic 12 — `docs/epics.md` içindeki tanımı ve story'leri bu klasöre taşındı; story'lerin ayrıntılı kabul kriterleri `docs/stories/` altındaki dosyalarda.

## Outcome

Uygulama hiçbir yerde al/sat/tut yönlendirmesi üretmez; kullanıcı aydınlatma metnini okur ve hesabını tüm verileriyle silebilir.

## Requirements

- FR-130: Sistem, hiçbir ekranda ve hiçbir AI çıktısında belirli bir sermaye piyasası aracı için al/sat/tut yönlendirmesi, hedef fiyat, getiri tahmini, kullanıcının kişisel durumuna göre tavsiye veya portföy dağılımı önerisi üretmemelidir. Skorlar, hangi objektif metriklerden türediğini gösteren kategorilere ayrılarak sunulmalı; hisse listeleri (ör. bülten) değerlendirme içermeyen ölçütlerle oluşturulmalı; AI çıktıları "finansal durum / analiz / riskler" çerçevesinde kalmalı ve "Bu içerik yatırım tavsiyesi değildir. Yalnızca kamuya açık verilerin analizi ve bilgilendirme amacı taşır." ibaresini taşımalıdır.
- FR-131: Sistem, KVKK kapsamında bir aydınlatma metni, kullanım koşulları ve gizlilik politikası sunmalı; kayıt ekranında bunlara bağlantı vermeli ve kullanıcının hesabını ve ona bağlı tüm kişisel verilerini uygulama içinden kalıcı olarak silebilmesini sağlamalıdır.

## Done when

1. Hiçbir ekranda ve AI çıktısında yönlendirici etiket veya hedef fiyat yoktur.
2. /kvkk, /terms, /privacy yayında; kayıtta onay alınır ve sürümüyle saklanır.
3. Ayarlar → Hesabı sil tüm kişisel verileri siler (DELETE /me).

## Boundaries

Uyum kuralları tüm epic'leri bağlar; açık hukuki maddeler docs/compliance.md'de.

## References

- parent — docs/PRD.md, Bölüm 5 (FR'ler)
- source — docs/epics.md, Epic 12
- architecture — docs/initiative-borocean/architecture-borocean/architecture-borocean.md
- constraint — docs/compliance.md (SPK/KVKK; tüm epic'leri bağlar)
