-- ============================================
-- SEVK ANALİZLERİ XML RAPORU
-- PostgreSQL'e uyarlanmış ve XML formatında döndüren sorgu
-- ============================================

-- NOT: Bu sorgu örnek bir yapıdır. Gerçek tablo yapısına göre uyarlanmalıdır.
-- MySQL IF() fonksiyonu PostgreSQL'de CASE WHEN olarak değiştirildi.
-- Sonuçlar XML formatında döndürülür.

CREATE OR REPLACE FUNCTION get_sevk_analizleri_xml(
  p_tarih_baslangic DATE,
  p_tarih_bitis DATE,
  p_il_kodu INTEGER DEFAULT 16
)
RETURNS XML
LANGUAGE plpgsql
AS $$
DECLARE
  v_xml_result XML;
BEGIN
  SELECT xmlelement(
    name "SevkAnalizleri",
    xmlagg(
      xmlelement(
        name "Satir",
        xmlforest(
          sevk_kriterleri AS "sevk_kriterleri",
          acil_sevk AS "acil_sevk",
          yogunbakim_sevk AS "yogunbakim_sevk",
          "112_sevk" AS "112_sevk",
          "112_disi_sevk" AS "112_disi_sevk",
          yatakli_sevk AS "yatakli_sevk",
          yillik_toplam AS "yillik_toplam"
        )
      )
    )
  )
  INTO v_xml_result
  FROM (
    -- İlk satır: Sevk Sayısı
    SELECT 
      'Sevk Sayısı'::TEXT as sevk_kriterleri,
      SUM(CASE WHEN xdepart.PRIVATE = 'A' THEN 1 ELSE 0 END)::INTEGER as acil_sevk,
      SUM(CASE WHEN xdepart.PRIVATE = 'YOGUN' THEN 1 ELSE 0 END)::INTEGER as yogunbakim_sevk,
      SUM(CASE WHEN xdepart.TYPE = 'P' AND xdepart.PRIVATE <> 'A' AND pexam_ek.SEVKKURUMTIPI = 1 THEN 1 ELSE 0 END)::INTEGER as "112_sevk",
      SUM(CASE WHEN xdepart.TYPE = 'P' AND xdepart.PRIVATE <> 'A' AND pexam_ek.SEVKKURUMTIPI <> 1 THEN 1 ELSE 0 END)::INTEGER as "112_disi_sevk",
      SUM(CASE WHEN pexam.YNOTENO > 0 AND xdepart.PRIVATE <> 'YOGUN' THEN 1 ELSE 0 END)::INTEGER as yatakli_sevk,
      SUM(1)::INTEGER as yillik_toplam
    FROM pexam
    INNER JOIN pexam_ek ON pexam_ek.LINE = pexam.LINE
    INNER JOIN gsspolcikistipi ON (gsspolcikistipi.GSSCIKISKODU = pexam.GSSCIKISKODU)
    INNER JOIN xdepart ON (xdepart.DEPNO = pexam.DEPARTNO)
    INNER JOIN aalokasyon ON aalokasyon.LOKASYONNO = xdepart.SEMTGROUP
    JOIN tipplusview.xtarih ON xtarih.ID > 0
    WHERE gsspolcikistipi.SKRSKODU = 4
      AND pexam.EXAMDATE >= p_tarih_baslangic
      AND pexam.EXAMDATE <= p_tarih_bitis
      AND pexam.TEDAVITURU <> 'G'
    
    UNION ALL
    
    -- İkinci satır: Toplam İl İçi Sevk
    SELECT 
      'Toplam İl İçi Sevk'::TEXT as sevk_kriterleri,
      SUM(CASE WHEN xdepart.PRIVATE = 'A' THEN 1 ELSE 0 END)::INTEGER as acil_sevk,
      SUM(CASE WHEN xdepart.PRIVATE = 'YOGUN' THEN 1 ELSE 0 END)::INTEGER as yogunbakim_sevk,
      SUM(CASE WHEN xdepart.TYPE = 'P' AND xdepart.PRIVATE <> 'A' AND pexam_ek.SEVKKURUMTIPI = 1 THEN 1 ELSE 0 END)::INTEGER as "112_sevk",
      SUM(CASE WHEN xdepart.TYPE = 'P' AND xdepart.PRIVATE <> 'A' AND pexam_ek.SEVKKURUMTIPI <> 1 THEN 1 ELSE 0 END)::INTEGER as "112_disi_sevk",
      SUM(CASE WHEN pexam.YNOTENO > 0 AND xdepart.PRIVATE <> 'YOGUN' THEN 1 ELSE 0 END)::INTEGER as yatakli_sevk,
      SUM(1)::INTEGER as yillik_toplam
    FROM pexam
    INNER JOIN pexam_ek ON pexam_ek.LINE = pexam.LINE
    INNER JOIN gsspolcikistipi ON (gsspolcikistipi.GSSCIKISKODU = pexam.GSSCIKISKODU)
    INNER JOIN xdepart ON (xdepart.DEPNO = pexam.DEPARTNO)
    INNER JOIN aalokasyon ON aalokasyon.LOKASYONNO = xdepart.SEMTGROUP
    LEFT JOIN skrskurumlar ON (skrskurumlar.KODU = pexam.SEVKKURUM)
    JOIN tipplusview.xtarih ON xtarih.ID > 0
    WHERE gsspolcikistipi.SKRSKODU = 4
      AND skrskurumlar.ILKODU IN (p_il_kodu, 0)
      AND pexam.EXAMDATE >= p_tarih_baslangic
      AND pexam.EXAMDATE <= p_tarih_bitis
      AND pexam.TEDAVITURU <> 'G'
    
    UNION ALL
    
    -- Üçüncü satır: Toplam İl Dışı Sevk
    SELECT 
      'Toplam İl Dışı Sevk'::TEXT as sevk_kriterleri,
      SUM(CASE WHEN xdepart.PRIVATE = 'A' THEN 1 ELSE 0 END)::INTEGER as acil_sevk,
      SUM(CASE WHEN xdepart.PRIVATE = 'YOGUN' THEN 1 ELSE 0 END)::INTEGER as yogunbakim_sevk,
      SUM(CASE WHEN xdepart.TYPE = 'P' AND xdepart.PRIVATE <> 'A' AND pexam_ek.SEVKKURUMTIPI = 1 THEN 1 ELSE 0 END)::INTEGER as "112_sevk",
      SUM(CASE WHEN xdepart.TYPE = 'P' AND xdepart.PRIVATE <> 'A' AND pexam_ek.SEVKKURUMTIPI <> 1 THEN 1 ELSE 0 END)::INTEGER as "112_disi_sevk",
      SUM(CASE WHEN pexam.YNOTENO > 0 AND xdepart.PRIVATE <> 'YOGUN' THEN 1 ELSE 0 END)::INTEGER as yatakli_sevk,
      SUM(1)::INTEGER as yillik_toplam
    FROM pexam
    INNER JOIN pexam_ek ON pexam_ek.LINE = pexam.LINE
    INNER JOIN gsspolcikistipi ON (gsspolcikistipi.GSSCIKISKODU = pexam.GSSCIKISKODU)
    LEFT JOIN skrskurumlar ON (skrskurumlar.KODU = pexam.SEVKKURUM)
    INNER JOIN xdepart ON (xdepart.DEPNO = pexam.DEPARTNO)
    JOIN tipplusview.xtarih ON xtarih.ID > 0
    WHERE gsspolcikistipi.SKRSKODU = 4
      AND skrskurumlar.ILKODU NOT IN (p_il_kodu, 0)
      AND pexam.EXAMDATE >= p_tarih_baslangic
      AND pexam.EXAMDATE <= p_tarih_bitis
      AND pexam.TEDAVITURU <> 'G'
    
    UNION ALL
    
    -- Dördüncü satır: Muayene Başına Toplam Sevk
    SELECT 
      'Muayene Başına Toplam Sevk'::TEXT as sevk_kriterleri,
      ROUND(SUM(CASE WHEN gsspolcikistipi.SKRSKODU = 4 AND xdepart.PRIVATE = 'A' THEN 1 ELSE 0 END) * 1000.0 / NULLIF(COUNT(pexam.LINE), 0), 2)::NUMERIC as acil_sevk,
      ROUND(SUM(CASE WHEN gsspolcikistipi.SKRSKODU = 4 AND xdepart.PRIVATE = 'YOGUN' THEN 1 ELSE 0 END) * 1000.0 / NULLIF(COUNT(pexam.LINE), 0), 2)::NUMERIC as yogunbakim_sevk,
      ROUND(SUM(CASE WHEN gsspolcikistipi.SKRSKODU = 4 AND xdepart.TYPE = 'P' AND xdepart.PRIVATE <> 'A' AND pexam_ek.SEVKKURUMTIPI = 1 THEN 1 ELSE 0 END) * 1000.0 / NULLIF(COUNT(pexam.LINE), 0), 2)::NUMERIC as "112_sevk",
      ROUND(SUM(CASE WHEN gsspolcikistipi.SKRSKODU = 4 AND xdepart.TYPE = 'P' AND xdepart.PRIVATE <> 'A' AND pexam_ek.SEVKKURUMTIPI <> 1 THEN 1 ELSE 0 END) * 1000.0 / NULLIF(COUNT(pexam.LINE), 0), 2)::NUMERIC as "112_disi_sevk",
      ROUND(SUM(CASE WHEN gsspolcikistipi.SKRSKODU = 4 AND pexam.YNOTENO > 0 AND xdepart.PRIVATE <> 'YOGUN' THEN 1 ELSE 0 END) * 1000.0 / NULLIF(COUNT(pexam.LINE), 0), 2)::NUMERIC as yatakli_sevk,
      ROUND(SUM(CASE WHEN gsspolcikistipi.SKRSKODU = 4 THEN 1 ELSE 0 END) * 1000.0 / NULLIF(COUNT(pexam.LINE), 0), 2)::NUMERIC as yillik_toplam
    FROM pexam
    INNER JOIN pexam_ek ON pexam_ek.LINE = pexam.LINE
    INNER JOIN gsspolcikistipi ON (gsspolcikistipi.GSSCIKISKODU = pexam.GSSCIKISKODU)
    INNER JOIN xdepart ON (xdepart.DEPNO = pexam.DEPARTNO)
    JOIN tipplusview.xtarih ON xtarih.ID > 0
    WHERE pexam.EXAMDATE >= p_tarih_baslangic
      AND pexam.EXAMDATE <= p_tarih_bitis
      AND pexam.TEDAVITURU <> 'G'
    
    UNION ALL
    
    -- Beşinci satır: Muayene Başına İl İçi Sevk
    SELECT 
      'Muayene Başına İl İçi Sevk'::TEXT as sevk_kriterleri,
      ROUND(SUM(CASE WHEN gsspolcikistipi.SKRSKODU = 4 AND skrskurumlar.ILKODU IN (p_il_kodu, 0) AND xdepart.PRIVATE = 'A' THEN 1 ELSE 0 END) * 1000.0 / NULLIF(COUNT(pexam.LINE), 0), 2)::NUMERIC as acil_sevk,
      ROUND(SUM(CASE WHEN gsspolcikistipi.SKRSKODU = 4 AND skrskurumlar.ILKODU IN (p_il_kodu, 0) AND xdepart.PRIVATE = 'YOGUN' THEN 1 ELSE 0 END) * 1000.0 / NULLIF(COUNT(pexam.LINE), 0), 2)::NUMERIC as yogunbakim_sevk,
      ROUND(SUM(CASE WHEN gsspolcikistipi.SKRSKODU = 4 AND skrskurumlar.ILKODU IN (p_il_kodu, 0) AND xdepart.TYPE = 'P' AND xdepart.PRIVATE <> 'A' AND pexam_ek.SEVKKURUMTIPI = 1 THEN 1 ELSE 0 END) * 1000.0 / NULLIF(COUNT(pexam.LINE), 0), 2)::NUMERIC as "112_sevk",
      ROUND(SUM(CASE WHEN gsspolcikistipi.SKRSKODU = 4 AND skrskurumlar.ILKODU IN (p_il_kodu, 0) AND xdepart.TYPE = 'P' AND xdepart.PRIVATE <> 'A' AND pexam_ek.SEVKKURUMTIPI <> 1 THEN 1 ELSE 0 END) * 1000.0 / NULLIF(COUNT(pexam.LINE), 0), 2)::NUMERIC as "112_disi_sevk",
      ROUND(SUM(CASE WHEN gsspolcikistipi.SKRSKODU = 4 AND skrskurumlar.ILKODU IN (p_il_kodu, 0) AND pexam.YNOTENO > 0 AND xdepart.PRIVATE <> 'YOGUN' THEN 1 ELSE 0 END) * 1000.0 / NULLIF(COUNT(pexam.LINE), 0), 2)::NUMERIC as yatakli_sevk,
      ROUND(SUM(CASE WHEN gsspolcikistipi.SKRSKODU = 4 AND skrskurumlar.ILKODU IN (p_il_kodu, 0) THEN 1 ELSE 0 END) * 1000.0 / NULLIF(COUNT(pexam.LINE), 0), 2)::NUMERIC as yillik_toplam
    FROM pexam
    INNER JOIN pexam_ek ON pexam_ek.LINE = pexam.LINE
    INNER JOIN gsspolcikistipi ON (gsspolcikistipi.GSSCIKISKODU = pexam.GSSCIKISKODU)
    INNER JOIN xdepart ON (xdepart.DEPNO = pexam.DEPARTNO)
    LEFT JOIN skrskurumlar ON (skrskurumlar.KODU = pexam.SEVKKURUM)
    JOIN tipplusview.xtarih ON xtarih.ID > 0
    WHERE pexam.EXAMDATE >= p_tarih_baslangic
      AND pexam.EXAMDATE <= p_tarih_bitis
      AND pexam.TEDAVITURU <> 'G'
    
    UNION ALL
    
    -- Altıncı satır: Muayene Başına İl Dışı Sevk
    SELECT 
      'Muayene Başına İl Dışı Sevk'::TEXT as sevk_kriterleri,
      ROUND(SUM(CASE WHEN gsspolcikistipi.SKRSKODU = 4 AND skrskurumlar.ILKODU NOT IN (p_il_kodu, 0) AND xdepart.PRIVATE = 'A' THEN 1 ELSE 0 END) * 1000.0 / NULLIF(COUNT(pexam.LINE), 0), 2)::NUMERIC as acil_sevk,
      ROUND(SUM(CASE WHEN gsspolcikistipi.SKRSKODU = 4 AND skrskurumlar.ILKODU NOT IN (p_il_kodu, 0) AND xdepart.PRIVATE = 'YOGUN' THEN 1 ELSE 0 END) * 1000.0 / NULLIF(COUNT(pexam.LINE), 0), 2)::NUMERIC as yogunbakim_sevk,
      ROUND(SUM(CASE WHEN gsspolcikistipi.SKRSKODU = 4 AND skrskurumlar.ILKODU NOT IN (p_il_kodu, 0) AND xdepart.TYPE = 'P' AND xdepart.PRIVATE <> 'A' AND pexam_ek.SEVKKURUMTIPI = 1 THEN 1 ELSE 0 END) * 1000.0 / NULLIF(COUNT(pexam.LINE), 0), 2)::NUMERIC as "112_sevk",
      ROUND(SUM(CASE WHEN gsspolcikistipi.SKRSKODU = 4 AND skrskurumlar.ILKODU NOT IN (p_il_kodu, 0) AND xdepart.TYPE = 'P' AND xdepart.PRIVATE <> 'A' AND pexam_ek.SEVKKURUMTIPI <> 1 THEN 1 ELSE 0 END) * 1000.0 / NULLIF(COUNT(pexam.LINE), 0), 2)::NUMERIC as "112_disi_sevk",
      ROUND(SUM(CASE WHEN gsspolcikistipi.SKRSKODU = 4 AND skrskurumlar.ILKODU NOT IN (p_il_kodu, 0) AND pexam.YNOTENO > 0 AND xdepart.PRIVATE <> 'YOGUN' THEN 1 ELSE 0 END) * 1000.0 / NULLIF(COUNT(pexam.LINE), 0), 2)::NUMERIC as yatakli_sevk,
      ROUND(SUM(CASE WHEN gsspolcikistipi.SKRSKODU = 4 AND skrskurumlar.ILKODU NOT IN (p_il_kodu, 0) THEN 1 ELSE 0 END) * 1000.0 / NULLIF(COUNT(pexam.LINE), 0), 2)::NUMERIC as yillik_toplam
    FROM pexam
    INNER JOIN pexam_ek ON pexam_ek.LINE = pexam.LINE
    INNER JOIN gsspolcikistipi ON (gsspolcikistipi.GSSCIKISKODU = pexam.GSSCIKISKODU)
    INNER JOIN xdepart ON (xdepart.DEPNO = pexam.DEPARTNO)
    LEFT JOIN skrskurumlar ON (skrskurumlar.KODU = pexam.SEVKKURUM)
    JOIN tipplusview.xtarih ON xtarih.ID > 0
    WHERE pexam.EXAMDATE >= p_tarih_baslangic
      AND pexam.EXAMDATE <= p_tarih_bitis
      AND pexam.TEDAVITURU <> 'G'
    
    UNION ALL
    
    -- Yedinci satır: Toplam Sevk İçindeki İl Dışı Sevk Oranı(%)
    SELECT 
      'Toplam Sevk İçindeki İl Dışı Sevk Oranı(%)'::TEXT as sevk_kriterleri,
      ROUND(COALESCE(
        SUM(CASE WHEN skrskurumlar.ILKODU NOT IN (p_il_kodu, 0) AND xdepart.PRIVATE = 'A' THEN 1 ELSE 0 END)::NUMERIC / 
        NULLIF(SUM(CASE WHEN xdepart.PRIVATE = 'A' THEN 1 ELSE 0 END), 0), 0
      ) * 100, 2)::NUMERIC as acil_sevk,
      ROUND(COALESCE(
        SUM(CASE WHEN skrskurumlar.ILKODU NOT IN (p_il_kodu, 0) AND xdepart.PRIVATE = 'YOGUN' THEN 1 ELSE 0 END)::NUMERIC / 
        NULLIF(SUM(CASE WHEN xdepart.PRIVATE = 'YOGUN' THEN 1 ELSE 0 END), 0), 0
      ) * 100, 2)::NUMERIC as yogunbakim_sevk,
      ROUND(COALESCE(
        SUM(CASE WHEN skrskurumlar.ILKODU NOT IN (p_il_kodu, 0) AND xdepart.TYPE = 'P' AND xdepart.PRIVATE <> 'A' AND pexam_ek.SEVKKURUMTIPI = 1 THEN 1 ELSE 0 END)::NUMERIC / 
        NULLIF(SUM(CASE WHEN xdepart.TYPE = 'P' AND xdepart.PRIVATE <> 'A' AND pexam_ek.SEVKKURUMTIPI = 1 THEN 1 ELSE 0 END), 0), 0
      ) * 100, 2)::NUMERIC as "112_sevk",
      ROUND(COALESCE(
        SUM(CASE WHEN skrskurumlar.ILKODU NOT IN (p_il_kodu, 0) AND xdepart.TYPE = 'P' AND xdepart.PRIVATE <> 'A' AND pexam_ek.SEVKKURUMTIPI <> 1 THEN 1 ELSE 0 END)::NUMERIC / 
        NULLIF(SUM(CASE WHEN xdepart.TYPE = 'P' AND xdepart.PRIVATE <> 'A' AND pexam_ek.SEVKKURUMTIPI <> 1 THEN 1 ELSE 0 END), 0), 0
      ) * 100, 2)::NUMERIC as "112_disi_sevk",
      ROUND(COALESCE(
        SUM(CASE WHEN skrskurumlar.ILKODU NOT IN (p_il_kodu, 0) AND pexam.YNOTENO > 0 AND xdepart.PRIVATE <> 'YOGUN' THEN 1 ELSE 0 END)::NUMERIC / 
        NULLIF(SUM(CASE WHEN pexam.YNOTENO > 0 AND xdepart.PRIVATE <> 'YOGUN' THEN 1 ELSE 0 END), 0), 0
      ) * 100, 2)::NUMERIC as yatakli_sevk,
      ROUND(COALESCE(
        SUM(CASE WHEN skrskurumlar.ILKODU NOT IN (p_il_kodu, 0) THEN 1 ELSE 0 END)::NUMERIC / 
        NULLIF(SUM(1), 0), 0
      ) * 100, 2)::NUMERIC as yillik_toplam
    FROM pexam
    INNER JOIN pexam_ek ON pexam_ek.LINE = pexam.LINE
    INNER JOIN gsspolcikistipi ON (gsspolcikistipi.GSSCIKISKODU = pexam.GSSCIKISKODU)
    INNER JOIN xdepart ON (xdepart.DEPNO = pexam.DEPARTNO)
    INNER JOIN aalokasyon ON aalokasyon.LOKASYONNO = xdepart.SEMTGROUP
    LEFT JOIN skrskurumlar ON (skrskurumlar.KODU = pexam.SEVKKURUM)
    JOIN tipplusview.xtarih ON xtarih.ID > 0
    WHERE gsspolcikistipi.SKRSKODU = 4
      AND pexam.EXAMDATE >= p_tarih_baslangic
      AND pexam.EXAMDATE <= p_tarih_bitis
      AND pexam.TEDAVITURU <> 'G'
  ) AS sevk_data;
  
  RETURN v_xml_result;
END;
$$;

-- Kullanım örneği:
-- SELECT get_sevk_analizleri_xml('2024-01-01'::DATE, '2024-12-31'::DATE, 16);

-- ============================================
-- MIGRATION TAMAMLANDI
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ Migration 118 tamamlandı: Sevk Analizleri XML Fonksiyonu';
  RAISE NOTICE '============================================';
  RAISE NOTICE '📦 Oluşturulan:';
  RAISE NOTICE '  - get_sevk_analizleri_xml() fonksiyonu';
  RAISE NOTICE '  - XML formatında rapor döndürür';
  RAISE NOTICE '============================================';
END $$;

