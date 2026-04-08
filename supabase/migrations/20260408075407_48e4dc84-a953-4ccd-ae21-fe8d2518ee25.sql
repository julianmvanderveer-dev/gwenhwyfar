UPDATE projects 
SET toegewezen_aan = NULL, toegewezen_op = NULL, toewijzing = 'pool'
WHERE status = 'deel1_afgerond' AND toegewezen_aan IS NOT NULL;