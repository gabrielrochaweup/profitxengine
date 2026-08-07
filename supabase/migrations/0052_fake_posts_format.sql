-- Formato/tamanho fixo do canvas do post (padrão Instagram): quadrado
-- (1080x1080), feed (1080x1350) ou stories (1080x1920) — controla o
-- aspect-ratio do preview e o tamanho exato exportado em post-preview.tsx /
-- post-export-controls.tsx.
alter table fake_posts add column format text check (format in ('quadrado', 'feed', 'stories')) not null default 'quadrado';
