-- Permite pastas dentro de pastas em image_folders — usado pra organizar
-- automaticamente as imagens geradas numa Dinâmica do Dia: pasta com o nome
-- da dinâmica, com uma subpasta por horário de slot dentro dela (lógica em
-- src/app/api/ai/generate-image/route.ts). Índices únicos parciais (em vez
-- de um unique(name, parent_id) direto) porque parent_id nulo não colide
-- consigo mesmo num unique normal do Postgres — isso garante nome único
-- tanto entre as pastas de topo quanto entre as subpastas de uma mesma mãe,
-- viabilizando "achar ou criar pasta pelo nome" sem duplicar.
alter table image_folders add column parent_id uuid references image_folders(id) on delete cascade;

create unique index image_folders_name_unique_root on image_folders (name) where parent_id is null;
create unique index image_folders_name_unique_child on image_folders (name, parent_id) where parent_id is not null;
