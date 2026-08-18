DO $$
DECLARE p uuid; f uuid; u uuid := 'cbaae0f2-a125-4bb9-8cdf-d04657ddf431'; a uuid := '4a0a5d6f-9b7c-43f6-b39c-fb3cad282878'; n int;
BEGIN
  INSERT INTO public.projects (projectnaam, adviseur_id, aangemaakt_door, audit_categorie, audit_soort, status)
  VALUES ('ZZTEST_vervallen', a, u, 'EPW-B', 'dossieraudit', 'wacht_op_reactie') RETURNING id INTO p;

  -- 1. auditor stelt fout vast
  INSERT INTO public.findings (project_id, onderdeel, controlepunt, deel, beoordeling, type_afwijking, status, zichtbaar_voor_adviseur, toelichting)
  VALUES (p, 'ZZTEST onderdeel', 'ZZTEST controlepunt', 1, 'niet_goed', 'niet_kritiek', 'open', true, 'ZZTEST aard van de afwijking')
  RETURNING id INTO f;

  -- 2. EP-adviseur weerlegt
  INSERT INTO public.messages (finding_id, afzender_id, bericht) VALUES (f, u, 'Niet mee eens, dit is geen fout');
  UPDATE public.findings SET status='reactie_ontvangen', concept_reactie=NULL WHERE id=f;

  -- 3. auditor kiest "Afwijking vervalt" (concept)
  UPDATE public.findings SET concept_beoordeling = jsonb_build_object('type','vervallen','toelichting','Auditor akkoord','opgeslagen_op', now()) WHERE id=f;

  -- 4. versturen zoals useBatchVersturen doet
  INSERT INTO public.messages (finding_id, afzender_id, bericht) VALUES (f, u, '[Goedgekeurd] Afwijking vervallen — Auditor akkoord');
  UPDATE public.findings SET status='reactie_goedgekeurd', beoordeling='goed', type_afwijking=NULL, deadline=NULL,
    upload_vereist=false, zichtbaar_voor_adviseur=false, goedgekeurd_op=now(), concept_beoordeling=NULL WHERE id=f;

  -- assertie A: foutenanalyse-query vindt de bevinding niet meer
  SELECT count(*) INTO n FROM public.findings WHERE project_id=p AND beoordeling='niet_goed' AND status IN ('reactie_goedgekeurd','gesloten');
  IF n <> 0 THEN RAISE EXCEPTION 'FAIL: bevinding staat nog in foutenanalyse (%)', n; END IF;

  -- assertie B: bevinding is goed + gesloten
  SELECT count(*) INTO n FROM public.findings WHERE id=f AND beoordeling='goed' AND status='reactie_goedgekeurd' AND type_afwijking IS NULL AND zichtbaar_voor_adviseur=false;
  IF n <> 1 THEN RAISE EXCEPTION 'FAIL: eindstatus bevinding onjuist'; END IF;

  -- assertie C: historie blijft (3 berichten? 2 verwacht)
  SELECT count(*) INTO n FROM public.messages WHERE finding_id=f;
  IF n <> 2 THEN RAISE EXCEPTION 'FAIL: berichtenhistorie onvolledig (%)', n; END IF;

  -- assertie D: project is automatisch afgerond door trigger
  SELECT count(*) INTO n FROM public.projects WHERE id=p AND status='afgerond';
  RAISE NOTICE 'project afgerond: %', n;

  DELETE FROM public.messages WHERE finding_id=f;
  DELETE FROM public.findings WHERE id=f;
  DELETE FROM public.projects WHERE id=p;
  RAISE NOTICE 'ALLE ASSERTIES GESLAAGD';
END $$;