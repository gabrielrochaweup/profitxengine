-- O bucket 'conversation-avatars' foi criado manualmente (fora de migration,
-- ver 0003_storage_avatars.sql) com limite de 5MB e só 4 tipos de imagem
-- aceitos — o único bucket do projeto com essa restrição (todos os outros,
-- como reference-images/generated-images/task-attachments, não têm
-- limite). Upload de foto de celular (geralmente >5MB ou em HEIC/HEIF)
-- falhava sem aviso claro. Alinha com o padrão do resto do projeto.
update storage.buckets
set file_size_limit = 10485760, allowed_mime_types = null
where id = 'conversation-avatars';
