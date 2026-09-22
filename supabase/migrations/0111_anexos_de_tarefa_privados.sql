-- Anexo de tarefa deixa de ser arquivo público.
--
-- O bucket era público desde a 0057, com o argumento de seguir o padrão do
-- reference-images. Só que o conteúdo é outro: em reference-images entra
-- imagem que serve de referência pra uma geração; aqui entra o que a equipe
-- anexa num cartão — contrato, print de conversa, documento interno.
--
-- Público, no Supabase, significa que o link É a senha: quem tiver a URL lê
-- o arquivo pra sempre, sem login, e URL vaza de um jeito banal (colada num
-- grupo, encaminhada por e-mail, dentro de um ticket). Listar o bucket já
-- era negado e o caminho usa uuid aleatório, então não havia como adivinhar
-- — mas link vazado não precisa ser adivinhado.
--
-- Agora o arquivo só sai por URL assinada, gerada na hora por quem está
-- logado e válida por uma hora.

-- ── 1. O caminho, que é o que se assina ─────────────────────────────────
--
-- A tabela só guardava a URL pública inteira. Pra assinar, o que importa é
-- o caminho dentro do bucket — então ele passa a ser guardado, e as linhas
-- antigas ganham o valor extraído da própria URL.
alter table task_attachments add column if not exists file_path text;

update task_attachments
set file_path = split_part(file_url, '/task-attachments/', 2)
where file_path is null
  and file_url like '%/task-attachments/%';

-- ── 2. O bucket fecha ───────────────────────────────────────────────────

update storage.buckets set public = false where id = 'task-attachments';

-- Leitura deixa de ser de qualquer um e passa a exigir sessão. É esta
-- política que permite a quem está logado PEDIR uma URL assinada; sem ela,
-- nem a equipe conseguiria abrir o anexo.
drop policy if exists "task_attachments_bucket_select_public" on storage.objects;
drop policy if exists "task_attachments_bucket_select_authenticated" on storage.objects;
create policy "task_attachments_bucket_select_authenticated"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'task-attachments');

-- ORDEM IMPORTA: suba o código ANTES de rodar este arquivo.
--
-- O código novo usa file_path pra assinar e cai na URL pública quando o
-- caminho ainda não existe — então ele funciona com o bucket dos dois
-- jeitos. O código antigo, com o bucket já privado, mostraria anexo
-- quebrado até o deploy sair.
