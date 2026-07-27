-- "Energia / Tom" vira "Cor Predominante" na UI (a tabela em si continua
-- image_prompt_tones, só o rótulo muda) — adiciona 4 cores base pra
-- diferenciar visualmente as imagens, mesma estrutura do tom "Urgente"
-- que já existia (que continua disponível como quinta opção).
insert into image_prompt_tones (name, body, position) values
(
  'Vermelho',
  'Ultra-realistic cinematic quality throughout.
Dark background — deep black transitioning into intense red gradient on the left.
Dramatic key light from slightly above and front — high contrast and sharp.
Intense red rim lighting from behind — bold and powerful.
Dense red light particles filling the background.
Green candlestick chart spiking sharply upward in the far background.',
  1
),
(
  'Verde',
  'Ultra-realistic cinematic quality throughout.
Dark background — deep black transitioning into intense green gradient on the left.
Dramatic key light from slightly above and front — high contrast and sharp.
Intense green rim lighting from behind — profit and growth energy.
Dense green light particles filling the background.
Green candlestick chart spiking sharply upward in the far background.',
  2
),
(
  'Azul',
  'Ultra-realistic cinematic quality throughout.
Dark background — deep black transitioning into intense blue gradient on the left.
Dramatic key light from slightly above and front — high contrast and sharp.
Intense blue rim lighting from behind — trust and precision energy.
Dense blue light particles filling the background.
Green candlestick chart spiking sharply upward in the far background.',
  3
),
(
  'Amarelo',
  'Ultra-realistic cinematic quality throughout.
Dark background — deep black transitioning into intense yellow and gold gradient on the left.
Dramatic key light from slightly above and front — high contrast and sharp.
Intense yellow rim lighting from behind — attention-grabbing energy.
Dense golden light particles filling the background.
Green candlestick chart spiking sharply upward in the far background.',
  4
);
