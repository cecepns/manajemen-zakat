-- Migration: tambah setting doa struk
-- Jalankan: mysql -u root -p zakat_db < backend/sql/migrations/001_add_org_doa_setting.sql

INSERT INTO settings (setting_key, setting_value) VALUES
  ('org_doa', 'Semoga Allah Subhanahu wa ta''ala memberikan pahala kepadamu atas apa yang engkau berikan, dan semoga Allah Subhanahu wa ta''ala memberikan berkah atas hartamu yang masih tersisa, dan menjadikannya sebagai pembersih bagi mu')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);
