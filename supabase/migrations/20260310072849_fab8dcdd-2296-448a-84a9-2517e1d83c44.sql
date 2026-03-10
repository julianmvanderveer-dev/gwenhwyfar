ALTER TYPE beoordeling_type RENAME VALUE 'interne_alert' TO 'opmerking';

UPDATE findings SET type_afwijking = NULL WHERE beoordeling = 'opmerking';