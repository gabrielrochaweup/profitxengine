-- Mensagem de abertura passa de 08h pra 08h30 nas dinâmicas que têm essa
-- mensagem exatamente às 08h (Sessão Kamikaze já abre às 07h30, não é
-- afetada). Alvo é o msg_key da própria mensagem de abertura, não o texto
-- do horário — evita pegar outras mensagens que coincidem de estar às 08h,
-- como o "Alerta 1" da Kamikaze.
update message_dynamic_slots set time_label = '08h30' where id = 'b8880c07-aae3-4007-8a19-087b8c653d76'; -- Alavancagem de Batalha · era "08h" · Primordial abertura (padrão A)
update message_dynamic_slots set time_label = '08h30' where id = '2ee2c4dd-6c2e-48e6-9384-b91c177d159c'; -- Alavancagem com Bônus de Plano · era "08h" · Primordial abertura (padrão A)
update message_dynamic_slots set time_label = '08h30' where id = 'abfa4054-f45a-4f0b-8729-2652269be5fc'; -- Alavancagem com Mentoria · era "08h" · Primordial abertura (padrão A)
update message_dynamic_slots set time_label = '08h30' where id = '9f91164e-a977-426c-a896-2135f1a9e9c8'; -- Alavancagem Premium · era "08h" · Primordial abertura (Padrão A) - exemplos consolidados
update message_dynamic_slots set time_label = '08h30' where id = '89103807-7b59-46c3-bedc-41068f1daeb8'; -- Upgrade Direto · era "08h" · Primordial abertura
update message_dynamic_slots set time_label = 'sáb 08h30' where id = 'e05b98be-653f-44b5-a53b-c3071f8c83b8'; -- Alavancagem com Maratona · era "sáb 08h" · Primordial abertura sáb (Padrão A)
update message_dynamic_slots set time_label = 'dom 08h30' where id = '0c6bbfae-d38f-48c6-9926-79c051bc8499'; -- Alavancagem com Maratona · era "dom 08h" · Primordial abertura dom (reta final)
