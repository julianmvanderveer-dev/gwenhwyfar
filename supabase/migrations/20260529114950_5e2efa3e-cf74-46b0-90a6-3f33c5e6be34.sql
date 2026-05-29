UPDATE storage.buckets
SET allowed_mime_types = ARRAY['application/pdf','image/jpeg','image/png','image/webp'],
    file_size_limit = 20971520
WHERE id = 'project-documents';

UPDATE storage.buckets
SET allowed_mime_types = ARRAY['application/pdf','image/jpeg','image/png','image/webp'],
    file_size_limit = 20971520
WHERE id = 'finding-documents';