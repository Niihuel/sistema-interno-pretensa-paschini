-- Update notification codes from English to Spanish

-- Update MORNING_REMINDER to RECORDATORIO_MATUTINO
UPDATE "BackupNotificationSetting"
SET "code" = 'RECORDATORIO_MATUTINO'
WHERE "code" = 'MORNING_REMINDER';

-- Update AFTERNOON_ALERT to ALERTA_TARDE
UPDATE "BackupNotificationSetting"
SET "code" = 'ALERTA_TARDE'
WHERE "code" = 'AFTERNOON_ALERT';

-- Update COMPLETION_NOTICE to AVISO_COMPLETADO
UPDATE "BackupNotificationSetting"
SET "code" = 'AVISO_COMPLETADO'
WHERE "code" = 'COMPLETION_NOTICE';
