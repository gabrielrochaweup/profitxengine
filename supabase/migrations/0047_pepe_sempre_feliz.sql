-- 0047_pepe_sempre_feliz.sql
-- Ajusta todos os prompts de imagem do PEPE para garantir expressao sempre feliz/sorridente,
-- nunca triste/seria. Cobre os 2 personagens que citam PEPE e os 61 templates que o
-- descrevem como personagem com rosto (templates que so mencionam "Pepe" como icone de
-- trofeu, sem rosto, ficam de fora).

UPDATE public.image_prompt_characters SET body = 'Main character — PEPE:
PEPE the famous green frog meme — bold detailed cartoon style — dark black zip-up hoodie —
big genuine happy smile — bright joyful eyes, beaming with excitement — NOT sad NOT serious NOT drooping —
neon green glowing eyes — winner energy. PEPE large and dominant on the left side.
PEPE''s expression is always a big genuine happy smile — joyful and cheerful — never sad, never serious, never neutral.' WHERE id = '88b81c99-dd77-4436-a7aa-68bee7378509';

UPDATE public.image_prompt_characters SET body = 'Main characters — PEPE + robot side by side:
PEPE the famous green frog meme on the left — bold cartoon style — dark hoodie —
big genuine happy smile, cheerful expression — neon green glowing eyes — same style as all previous banners.
Copy Trader robot on the right — premium style — dark suit jacket — gold circuit lines —
robot eyes glowing gold — fully operational.
Both characters equal visual weight — unified team.
PEPE''s expression is always a big genuine happy smile — joyful and cheerful — never sad, never serious, never neutral.' WHERE id = 'b502efa8-02be-4a35-a5f0-cec69138aa6b';

UPDATE public.image_prompt_templates SET body = '=== VARIÁVEIS ===
ITEM 1: [ITEM 1]
ITEM 2: [ITEM 2]
ITEM 3: [ITEM 3]
ITEM 4: [ITEM 4]
=================

This is a graphic design banner generation task. Do NOT render any prompt text inside the image.
The image must contain ONLY the TEXT ELEMENTS listed below. Nothing else.

Scene concept:
PEPE the green frog operating live at his trading desk, fully focused, big genuine happy smile, cheerful expression, a glowing live trading chart on the screen in front of him climbing upward, warm morning light, alone in frame — no other characters, no background theme elements competing for attention.

PEPE''s face must always show a big genuine happy smile — joyful, cheerful, full of positive energy. NEVER sad, NEVER serious, NEVER neutral, NEVER worried.

Composition rules:
Horizontal landscape layout — wide format 16:9.
Scene large and dominant, cinematic framing, dramatic lighting, high contrast.
Left side reserved for text overlay — clean with only background graphic elements.
Ultra-realistic cinematic quality throughout.

TEXT ELEMENTS — render ONLY these items, nothing else:
Item 1: [ITEM 1] — very large bold orange and white 3D font with fire glow
Item 2: [ITEM 2] — large bold neon green 3D font with gold outline
Item 3: [ITEM 3] — bold white font with red urgent border box
Item 4: [ITEM 4] — bold gold brush style lettering

DO NOT add any other text. DO NOT add subtitles, slogans, scores or signatures.
DO NOT add any URLs or links inside the image.
Do NOT blend faces. Do NOT copy any person identity from any style reference.
Do NOT add glasses or any eyewear.
Final output: Premium Brazilian digital marketing banner — [ITEM 1] as dominant element — [ITEM 4] closing.' WHERE id = '7611b541-269f-4aa4-965f-9866396b0d2a';

UPDATE public.image_prompt_templates SET body = '=== VARIÁVEIS ===
ITEM 1: [ITEM 1]
ITEM 2: [ITEM 2]
ITEM 3: [ITEM 3]
ITEM 4: [ITEM 4]
=================

This is a graphic design banner generation task. Do NOT render any prompt text inside the image.
The image must contain ONLY the TEXT ELEMENTS listed below. Nothing else.

Scene concept:
PEPE the green frog operating live at his trading desk, fully focused, big genuine happy smile, cheerful expression, a glowing live trading chart on the screen in front of him climbing upward, warm morning light, alone in frame — no other characters, no background theme elements competing for attention.

PEPE''s face must always show a big genuine happy smile — joyful, cheerful, full of positive energy. NEVER sad, NEVER serious, NEVER neutral, NEVER worried.

Composition rules:
Horizontal landscape layout — wide format 16:9.
Scene large and dominant, cinematic framing, dramatic lighting, high contrast.
Left side reserved for text overlay — clean with only background graphic elements.
Ultra-realistic cinematic quality throughout.

TEXT ELEMENTS — render ONLY these items, nothing else:
Item 1: [ITEM 1] — very large bold orange and white 3D font with fire glow
Item 2: [ITEM 2] — large bold neon green 3D font with gold outline
Item 3: [ITEM 3] — bold white font with red urgent border box
Item 4: [ITEM 4] — bold gold brush style lettering

DO NOT add any other text. DO NOT add subtitles, slogans, scores or signatures.
DO NOT add any URLs or links inside the image.
Do NOT blend faces. Do NOT copy any person identity from any style reference.
Do NOT add glasses or any eyewear.
Final output: Premium Brazilian digital marketing banner — [ITEM 1] as dominant element — [ITEM 4] closing.' WHERE id = 'cc710c0f-b86b-47f2-ae83-9363840c0f75';

UPDATE public.image_prompt_templates SET body = '=== VARIÁVEIS ===
ITEM 1: [ITEM 1]
ITEM 2: [ITEM 2]
ITEM 3: [ITEM 3]
ITEM 4: [ITEM 4]
=================

This is a graphic design banner generation task. Do NOT render any prompt text inside the image.
The image must contain ONLY the TEXT ELEMENTS listed below. Nothing else.

Scene concept:
PEPE the green frog operating live at his trading desk, fully focused, big genuine happy smile, cheerful expression, a glowing live trading chart on the screen in front of him climbing upward, warm afternoon light, alone in frame — no other characters, no background theme elements competing for attention.

PEPE''s face must always show a big genuine happy smile — joyful, cheerful, full of positive energy. NEVER sad, NEVER serious, NEVER neutral, NEVER worried.

Composition rules:
Horizontal landscape layout — wide format 16:9.
Scene large and dominant, cinematic framing, dramatic lighting, high contrast.
Left side reserved for text overlay — clean with only background graphic elements.
Ultra-realistic cinematic quality throughout.

TEXT ELEMENTS — render ONLY these items, nothing else:
Item 1: [ITEM 1] — very large bold orange and white 3D font with fire glow
Item 2: [ITEM 2] — large bold neon green 3D font with gold outline
Item 3: [ITEM 3] — bold white font with red urgent border box
Item 4: [ITEM 4] — bold gold brush style lettering

DO NOT add any other text. DO NOT add subtitles, slogans, scores or signatures.
DO NOT add any URLs or links inside the image.
Do NOT blend faces. Do NOT copy any person identity from any style reference.
Do NOT add glasses or any eyewear.
Final output: Premium Brazilian digital marketing banner — [ITEM 1] as dominant element — [ITEM 4] closing.' WHERE id = '171bb4ad-d8e9-4ee1-a56b-e683681840c2';

UPDATE public.image_prompt_templates SET body = '=== VARIÁVEIS ===
ITEM 1: [ITEM 1]
ITEM 2: [ITEM 2]
ITEM 3: [ITEM 3]
ITEM 4: [ITEM 4]
=================

This is a graphic design banner generation task. Do NOT render any prompt text inside the image.
The image must contain ONLY the TEXT ELEMENTS listed below. Nothing else.

Scene concept:
PEPE the green frog operating live at his trading desk, fully focused, big genuine happy smile, cheerful expression, a glowing live trading chart on the screen in front of him climbing upward, dramatic night studio lighting, alone in frame — no other characters, no background theme elements competing for attention.

PEPE''s face must always show a big genuine happy smile — joyful, cheerful, full of positive energy. NEVER sad, NEVER serious, NEVER neutral, NEVER worried.

Composition rules:
Horizontal landscape layout — wide format 16:9.
Scene large and dominant, cinematic framing, dramatic lighting, high contrast.
Left side reserved for text overlay — clean with only background graphic elements.
Ultra-realistic cinematic quality throughout.

TEXT ELEMENTS — render ONLY these items, nothing else:
Item 1: [ITEM 1] — very large bold orange and white 3D font with fire glow
Item 2: [ITEM 2] — large bold neon green 3D font with gold outline
Item 3: [ITEM 3] — bold white font with red urgent border box
Item 4: [ITEM 4] — bold gold brush style lettering

DO NOT add any other text. DO NOT add subtitles, slogans, scores or signatures.
DO NOT add any URLs or links inside the image.
Do NOT blend faces. Do NOT copy any person identity from any style reference.
Do NOT add glasses or any eyewear.
Final output: Premium Brazilian digital marketing banner — [ITEM 1] as dominant element — [ITEM 4] closing.' WHERE id = '18d06b72-533c-40f2-a7ad-b8994cb283a9';

UPDATE public.image_prompt_templates SET body = '=== VARIÁVEIS ===
ITEM 1: [ITEM 1]
ITEM 2: [ITEM 2]
ITEM 3: [ITEM 3]
ITEM 4: [ITEM 4]
=================

This is a graphic design banner generation task. Do NOT render any prompt text inside the image.
The image must contain ONLY the TEXT ELEMENTS listed below. Nothing else.

Scene concept:
PEPE the green frog operating live at his trading desk, fully focused, big genuine happy smile, cheerful expression, a glowing live trading chart on the screen in front of him climbing upward, warm morning light, alone in frame — no other characters, no background theme elements competing for attention.

PEPE''s face must always show a big genuine happy smile — joyful, cheerful, full of positive energy. NEVER sad, NEVER serious, NEVER neutral, NEVER worried.

Composition rules:
Horizontal landscape layout — wide format 16:9.
Scene large and dominant, cinematic framing, dramatic lighting, high contrast.
Left side reserved for text overlay — clean with only background graphic elements.
Ultra-realistic cinematic quality throughout.

TEXT ELEMENTS — render ONLY these items, nothing else:
Item 1: [ITEM 1] — very large bold orange and white 3D font with fire glow
Item 2: [ITEM 2] — large bold neon green 3D font with gold outline
Item 3: [ITEM 3] — bold white font with red urgent border box
Item 4: [ITEM 4] — bold gold brush style lettering

DO NOT add any other text. DO NOT add subtitles, slogans, scores or signatures.
DO NOT add any URLs or links inside the image.
Do NOT blend faces. Do NOT copy any person identity from any style reference.
Do NOT add glasses or any eyewear.
Final output: Premium Brazilian digital marketing banner — [ITEM 1] as dominant element — [ITEM 4] closing.' WHERE id = '1f500865-537f-423d-a0f5-298eff60d6d8';

UPDATE public.image_prompt_templates SET body = '=== VARIÁVEIS ===
ITEM 1: [ITEM 1]
ITEM 2: [ITEM 2]
ITEM 3: [ITEM 3]
ITEM 4: [ITEM 4]
=================

This is a graphic design banner generation task. Do NOT render any prompt text inside the image.
The image must contain ONLY the TEXT ELEMENTS listed below. Nothing else.

Scene concept:
PEPE the green frog operating live at his trading desk, fully focused, big genuine happy smile, cheerful expression, a glowing live trading chart on the screen in front of him climbing upward, warm afternoon light, alone in frame — no other characters, no background theme elements competing for attention.

PEPE''s face must always show a big genuine happy smile — joyful, cheerful, full of positive energy. NEVER sad, NEVER serious, NEVER neutral, NEVER worried.

Composition rules:
Horizontal landscape layout — wide format 16:9.
Scene large and dominant, cinematic framing, dramatic lighting, high contrast.
Left side reserved for text overlay — clean with only background graphic elements.
Ultra-realistic cinematic quality throughout.

TEXT ELEMENTS — render ONLY these items, nothing else:
Item 1: [ITEM 1] — very large bold orange and white 3D font with fire glow
Item 2: [ITEM 2] — large bold neon green 3D font with gold outline
Item 3: [ITEM 3] — bold white font with red urgent border box
Item 4: [ITEM 4] — bold gold brush style lettering

DO NOT add any other text. DO NOT add subtitles, slogans, scores or signatures.
DO NOT add any URLs or links inside the image.
Do NOT blend faces. Do NOT copy any person identity from any style reference.
Do NOT add glasses or any eyewear.
Final output: Premium Brazilian digital marketing banner — [ITEM 1] as dominant element — [ITEM 4] closing.' WHERE id = 'f6d11f44-1f1f-468a-9d4d-64719021f2ca';

UPDATE public.image_prompt_templates SET body = '=== VARIÁVEIS ===
ITEM 1: [ITEM 1]
ITEM 2: [ITEM 2]
ITEM 3: [ITEM 3]
ITEM 4: [ITEM 4]
=================

This is a graphic design banner generation task. Do NOT render any prompt text inside the image.
The image must contain ONLY the TEXT ELEMENTS listed below. Nothing else.

Scene concept:
PEPE the green frog operating live at his trading desk, fully focused, big genuine happy smile, cheerful expression, a glowing live trading chart on the screen in front of him climbing upward, dramatic night studio lighting, alone in frame — no other characters, no background theme elements competing for attention.

PEPE''s face must always show a big genuine happy smile — joyful, cheerful, full of positive energy. NEVER sad, NEVER serious, NEVER neutral, NEVER worried.

Composition rules:
Horizontal landscape layout — wide format 16:9.
Scene large and dominant, cinematic framing, dramatic lighting, high contrast.
Left side reserved for text overlay — clean with only background graphic elements.
Ultra-realistic cinematic quality throughout.

TEXT ELEMENTS — render ONLY these items, nothing else:
Item 1: [ITEM 1] — very large bold orange and white 3D font with fire glow
Item 2: [ITEM 2] — large bold neon green 3D font with gold outline
Item 3: [ITEM 3] — bold white font with red urgent border box
Item 4: [ITEM 4] — bold gold brush style lettering

DO NOT add any other text. DO NOT add subtitles, slogans, scores or signatures.
DO NOT add any URLs or links inside the image.
Do NOT blend faces. Do NOT copy any person identity from any style reference.
Do NOT add glasses or any eyewear.
Final output: Premium Brazilian digital marketing banner — [ITEM 1] as dominant element — [ITEM 4] closing.' WHERE id = 'ad5162e3-6bf9-4b0b-9bb4-520fb60d33bf';

UPDATE public.image_prompt_templates SET body = '=== VARIÁVEIS ===
ITEM 1: [ITEM 1]
ITEM 2: [ITEM 2]
ITEM 3: [ITEM 3]
ITEM 4: [ITEM 4]
=================

This is a graphic design banner generation task. Do NOT render any prompt text inside the image.
The image must contain ONLY the TEXT ELEMENTS listed below. Nothing else.

Scene concept:
PEPE the green frog operating live at his trading desk, fully focused, big genuine happy smile, cheerful expression, a glowing live trading chart on the screen in front of him climbing upward, warm morning light, alone in frame — no other characters, no background theme elements competing for attention.

PEPE''s face must always show a big genuine happy smile — joyful, cheerful, full of positive energy. NEVER sad, NEVER serious, NEVER neutral, NEVER worried.

Composition rules:
Horizontal landscape layout — wide format 16:9.
Scene large and dominant, cinematic framing, dramatic lighting, high contrast.
Left side reserved for text overlay — clean with only background graphic elements.
Ultra-realistic cinematic quality throughout.

TEXT ELEMENTS — render ONLY these items, nothing else:
Item 1: [ITEM 1] — very large bold orange and white 3D font with fire glow
Item 2: [ITEM 2] — large bold neon green 3D font with gold outline
Item 3: [ITEM 3] — bold white font with red urgent border box
Item 4: [ITEM 4] — bold gold brush style lettering

DO NOT add any other text. DO NOT add subtitles, slogans, scores or signatures.
DO NOT add any URLs or links inside the image.
Do NOT blend faces. Do NOT copy any person identity from any style reference.
Do NOT add glasses or any eyewear.
Final output: Premium Brazilian digital marketing banner — [ITEM 1] as dominant element — [ITEM 4] closing.' WHERE id = 'fb2138ee-37b7-4e22-b4b4-1ea17b6faf99';

UPDATE public.image_prompt_templates SET body = '=== VARIÁVEIS ===
ITEM 1: [ITEM 1]
ITEM 2: [ITEM 2]
ITEM 3: [ITEM 3]
ITEM 4: [ITEM 4]
=================

This is a graphic design banner generation task. Do NOT render any prompt text inside the image.
The image must contain ONLY the TEXT ELEMENTS listed below. Nothing else.

Scene concept:
PEPE the green frog operating live at his trading desk, fully focused, big genuine happy smile, cheerful expression, a glowing live trading chart on the screen in front of him climbing upward, warm afternoon light, alone in frame — no other characters, no background theme elements competing for attention.

PEPE''s face must always show a big genuine happy smile — joyful, cheerful, full of positive energy. NEVER sad, NEVER serious, NEVER neutral, NEVER worried.

Composition rules:
Horizontal landscape layout — wide format 16:9.
Scene large and dominant, cinematic framing, dramatic lighting, high contrast.
Left side reserved for text overlay — clean with only background graphic elements.
Ultra-realistic cinematic quality throughout.

TEXT ELEMENTS — render ONLY these items, nothing else:
Item 1: [ITEM 1] — very large bold orange and white 3D font with fire glow
Item 2: [ITEM 2] — large bold neon green 3D font with gold outline
Item 3: [ITEM 3] — bold white font with red urgent border box
Item 4: [ITEM 4] — bold gold brush style lettering

DO NOT add any other text. DO NOT add subtitles, slogans, scores or signatures.
DO NOT add any URLs or links inside the image.
Do NOT blend faces. Do NOT copy any person identity from any style reference.
Do NOT add glasses or any eyewear.
Final output: Premium Brazilian digital marketing banner — [ITEM 1] as dominant element — [ITEM 4] closing.' WHERE id = '1597b7ef-f819-43bc-8154-d346929ec2a4';

UPDATE public.image_prompt_templates SET body = '=== VARIÁVEIS ===
ITEM 1: [ITEM 1]
ITEM 2: [ITEM 2]
ITEM 3: [ITEM 3]
ITEM 4: [ITEM 4]
=================

This is a graphic design banner generation task. Do NOT render any prompt text inside the image.
The image must contain ONLY the TEXT ELEMENTS listed below. Nothing else.

Scene concept:
PEPE the green frog operating live at his trading desk, fully focused, big genuine happy smile, cheerful expression, a glowing live trading chart on the screen in front of him climbing upward, dramatic night studio lighting, alone in frame — no other characters, no background theme elements competing for attention.

PEPE''s face must always show a big genuine happy smile — joyful, cheerful, full of positive energy. NEVER sad, NEVER serious, NEVER neutral, NEVER worried.

Composition rules:
Horizontal landscape layout — wide format 16:9.
Scene large and dominant, cinematic framing, dramatic lighting, high contrast.
Left side reserved for text overlay — clean with only background graphic elements.
Ultra-realistic cinematic quality throughout.

TEXT ELEMENTS — render ONLY these items, nothing else:
Item 1: [ITEM 1] — very large bold orange and white 3D font with fire glow
Item 2: [ITEM 2] — large bold neon green 3D font with gold outline
Item 3: [ITEM 3] — bold white font with red urgent border box
Item 4: [ITEM 4] — bold gold brush style lettering

DO NOT add any other text. DO NOT add subtitles, slogans, scores or signatures.
DO NOT add any URLs or links inside the image.
Do NOT blend faces. Do NOT copy any person identity from any style reference.
Do NOT add glasses or any eyewear.
Final output: Premium Brazilian digital marketing banner — [ITEM 1] as dominant element — [ITEM 4] closing.' WHERE id = '0e7e0edd-9e47-477a-adae-a66e0b32d48b';

UPDATE public.image_prompt_templates SET body = '=== VARIÁVEIS ===
ITEM 1: [ITEM 1]
ITEM 2: [ITEM 2]
ITEM 3: [ITEM 3]
ITEM 4: [ITEM 4]
=================

This is a graphic design banner generation task. Do NOT render any prompt text inside the image.
The image must contain ONLY the TEXT ELEMENTS listed below. Nothing else.

Scene concept:
PEPE the green frog operating live at his trading desk, fully focused, big genuine happy smile, cheerful expression, a glowing live trading chart on the screen in front of him climbing upward, warm morning light, alone in frame — no other characters, no background theme elements competing for attention.

PEPE''s face must always show a big genuine happy smile — joyful, cheerful, full of positive energy. NEVER sad, NEVER serious, NEVER neutral, NEVER worried.

Composition rules:
Horizontal landscape layout — wide format 16:9.
Scene large and dominant, cinematic framing, dramatic lighting, high contrast.
Left side reserved for text overlay — clean with only background graphic elements.
Ultra-realistic cinematic quality throughout.

TEXT ELEMENTS — render ONLY these items, nothing else:
Item 1: [ITEM 1] — very large bold orange and white 3D font with fire glow
Item 2: [ITEM 2] — large bold neon green 3D font with gold outline
Item 3: [ITEM 3] — bold white font with red urgent border box
Item 4: [ITEM 4] — bold gold brush style lettering

DO NOT add any other text. DO NOT add subtitles, slogans, scores or signatures.
DO NOT add any URLs or links inside the image.
Do NOT blend faces. Do NOT copy any person identity from any style reference.
Do NOT add glasses or any eyewear.
Final output: Premium Brazilian digital marketing banner — [ITEM 1] as dominant element — [ITEM 4] closing.' WHERE id = '5390871d-6e3a-4a6a-8627-d05d53d1758f';

UPDATE public.image_prompt_templates SET body = '=== VARIÁVEIS ===
ITEM 1: [ITEM 1]
ITEM 2: [ITEM 2]
ITEM 3: [ITEM 3]
ITEM 4: [ITEM 4]
=================

This is a graphic design banner generation task. Do NOT render any prompt text inside the image.
The image must contain ONLY the TEXT ELEMENTS listed below. Nothing else.

Scene concept:
PEPE the green frog operating live at his trading desk, fully focused, big genuine happy smile, cheerful expression, a glowing live trading chart on the screen in front of him climbing upward, warm afternoon light, alone in frame — no other characters, no background theme elements competing for attention.

PEPE''s face must always show a big genuine happy smile — joyful, cheerful, full of positive energy. NEVER sad, NEVER serious, NEVER neutral, NEVER worried.

Composition rules:
Horizontal landscape layout — wide format 16:9.
Scene large and dominant, cinematic framing, dramatic lighting, high contrast.
Left side reserved for text overlay — clean with only background graphic elements.
Ultra-realistic cinematic quality throughout.

TEXT ELEMENTS — render ONLY these items, nothing else:
Item 1: [ITEM 1] — very large bold orange and white 3D font with fire glow
Item 2: [ITEM 2] — large bold neon green 3D font with gold outline
Item 3: [ITEM 3] — bold white font with red urgent border box
Item 4: [ITEM 4] — bold gold brush style lettering

DO NOT add any other text. DO NOT add subtitles, slogans, scores or signatures.
DO NOT add any URLs or links inside the image.
Do NOT blend faces. Do NOT copy any person identity from any style reference.
Do NOT add glasses or any eyewear.
Final output: Premium Brazilian digital marketing banner — [ITEM 1] as dominant element — [ITEM 4] closing.' WHERE id = 'bff02bc1-c8f5-4d40-889b-863f17670b79';

UPDATE public.image_prompt_templates SET body = '=== VARIÁVEIS ===
ITEM 1: [ITEM 1]
ITEM 2: [ITEM 2]
ITEM 3: [ITEM 3]
ITEM 4: [ITEM 4]
=================

This is a graphic design banner generation task. Do NOT render any prompt text inside the image.
The image must contain ONLY the TEXT ELEMENTS listed below. Nothing else.

Scene concept:
PEPE the green frog operating live at his trading desk, fully focused, big genuine happy smile, cheerful expression, a glowing live trading chart on the screen in front of him climbing upward, dramatic night studio lighting, alone in frame — no other characters, no background theme elements competing for attention.

PEPE''s face must always show a big genuine happy smile — joyful, cheerful, full of positive energy. NEVER sad, NEVER serious, NEVER neutral, NEVER worried.

Composition rules:
Horizontal landscape layout — wide format 16:9.
Scene large and dominant, cinematic framing, dramatic lighting, high contrast.
Left side reserved for text overlay — clean with only background graphic elements.
Ultra-realistic cinematic quality throughout.

TEXT ELEMENTS — render ONLY these items, nothing else:
Item 1: [ITEM 1] — very large bold orange and white 3D font with fire glow
Item 2: [ITEM 2] — large bold neon green 3D font with gold outline
Item 3: [ITEM 3] — bold white font with red urgent border box
Item 4: [ITEM 4] — bold gold brush style lettering

DO NOT add any other text. DO NOT add subtitles, slogans, scores or signatures.
DO NOT add any URLs or links inside the image.
Do NOT blend faces. Do NOT copy any person identity from any style reference.
Do NOT add glasses or any eyewear.
Final output: Premium Brazilian digital marketing banner — [ITEM 1] as dominant element — [ITEM 4] closing.' WHERE id = '700cd919-d373-4fcb-8e0c-c2eeaa0d2e07';

UPDATE public.image_prompt_templates SET body = '=== VARIÁVEIS ===
ITEM 1: [ITEM 1]
ITEM 2: [ITEM 2]
ITEM 3: [ITEM 3]
ITEM 4: [ITEM 4]
=================

This is a graphic design banner generation task. Do NOT render any prompt text inside the image.
The image must contain ONLY the TEXT ELEMENTS listed below. Nothing else.

Scene concept:
PEPE the green frog operating live at his trading desk, fully focused, big genuine happy smile, cheerful expression, a glowing live trading chart on the screen in front of him climbing upward, warm afternoon light, alone in frame — no other characters, no background theme elements competing for attention.

PEPE''s face must always show a big genuine happy smile — joyful, cheerful, full of positive energy. NEVER sad, NEVER serious, NEVER neutral, NEVER worried.

Composition rules:
Horizontal landscape layout — wide format 16:9.
Scene large and dominant, cinematic framing, dramatic lighting, high contrast.
Left side reserved for text overlay — clean with only background graphic elements.
Ultra-realistic cinematic quality throughout.

TEXT ELEMENTS — render ONLY these items, nothing else:
Item 1: [ITEM 1] — very large bold orange and white 3D font with fire glow
Item 2: [ITEM 2] — large bold neon green 3D font with gold outline
Item 3: [ITEM 3] — bold white font with red urgent border box
Item 4: [ITEM 4] — bold gold brush style lettering

DO NOT add any other text. DO NOT add subtitles, slogans, scores or signatures.
DO NOT add any URLs or links inside the image.
Do NOT blend faces. Do NOT copy any person identity from any style reference.
Do NOT add glasses or any eyewear.
Final output: Premium Brazilian digital marketing banner — [ITEM 1] as dominant element — [ITEM 4] closing.' WHERE id = '5ab5c9fd-6d9b-4e83-83d8-cb74a3ad701a';

UPDATE public.image_prompt_templates SET body = '=== VARIÁVEIS ===
ITEM 1: [ITEM 1]
ITEM 2: [ITEM 2]
ITEM 3: [ITEM 3]
ITEM 4: [ITEM 4]
=================

This is a graphic design banner generation task. Do NOT render any prompt text inside the image.
The image must contain ONLY the TEXT ELEMENTS listed below. Nothing else.

Scene concept:
PEPE the green frog operating live at his trading desk, fully focused, big genuine happy smile, cheerful expression, a glowing live trading chart on the screen in front of him climbing upward, dramatic night studio lighting, alone in frame — no other characters, no background theme elements competing for attention.

PEPE''s face must always show a big genuine happy smile — joyful, cheerful, full of positive energy. NEVER sad, NEVER serious, NEVER neutral, NEVER worried.

Composition rules:
Horizontal landscape layout — wide format 16:9.
Scene large and dominant, cinematic framing, dramatic lighting, high contrast.
Left side reserved for text overlay — clean with only background graphic elements.
Ultra-realistic cinematic quality throughout.

TEXT ELEMENTS — render ONLY these items, nothing else:
Item 1: [ITEM 1] — very large bold orange and white 3D font with fire glow
Item 2: [ITEM 2] — large bold neon green 3D font with gold outline
Item 3: [ITEM 3] — bold white font with red urgent border box
Item 4: [ITEM 4] — bold gold brush style lettering

DO NOT add any other text. DO NOT add subtitles, slogans, scores or signatures.
DO NOT add any URLs or links inside the image.
Do NOT blend faces. Do NOT copy any person identity from any style reference.
Do NOT add glasses or any eyewear.
Final output: Premium Brazilian digital marketing banner — [ITEM 1] as dominant element — [ITEM 4] closing.' WHERE id = '51137ad1-57b7-42e9-918a-e79e74f1e075';

UPDATE public.image_prompt_templates SET body = '=== VARIÁVEIS ===
ITEM 1: [ITEM 1]
ITEM 2: [ITEM 2]
ITEM 3: [ITEM 3]
ITEM 4: [ITEM 4]
=================

This is a graphic design banner generation task. Do NOT render any prompt text inside the image.
The image must contain ONLY the TEXT ELEMENTS listed below. Nothing else.

Scene concept:
PEPE the green frog operating live at his trading desk, fully focused, big genuine happy smile, cheerful expression, a glowing live trading chart on the screen in front of him climbing upward, warm morning light, alone in frame — no other characters, no background theme elements competing for attention.

PEPE''s face must always show a big genuine happy smile — joyful, cheerful, full of positive energy. NEVER sad, NEVER serious, NEVER neutral, NEVER worried.

Composition rules:
Horizontal landscape layout — wide format 16:9.
Scene large and dominant, cinematic framing, dramatic lighting, high contrast.
Left side reserved for text overlay — clean with only background graphic elements.
Ultra-realistic cinematic quality throughout.

TEXT ELEMENTS — render ONLY these items, nothing else:
Item 1: [ITEM 1] — very large bold orange and white 3D font with fire glow
Item 2: [ITEM 2] — large bold neon green 3D font with gold outline
Item 3: [ITEM 3] — bold white font with red urgent border box
Item 4: [ITEM 4] — bold gold brush style lettering

DO NOT add any other text. DO NOT add subtitles, slogans, scores or signatures.
DO NOT add any URLs or links inside the image.
Do NOT blend faces. Do NOT copy any person identity from any style reference.
Do NOT add glasses or any eyewear.
Final output: Premium Brazilian digital marketing banner — [ITEM 1] as dominant element — [ITEM 4] closing.' WHERE id = '838d1e08-6ee6-411f-b159-be0931f3b722';

UPDATE public.image_prompt_templates SET body = '=== VARIÁVEIS ===
ITEM 1: [ITEM 1]
ITEM 2: [ITEM 2]
ITEM 3: [ITEM 3]
ITEM 4: [ITEM 4]
=================

This is a graphic design banner generation task. Do NOT render any prompt text inside the image.
The image must contain ONLY the TEXT ELEMENTS listed below. Nothing else.

Scene concept:
PEPE the green frog operating live at his trading desk, fully focused, big genuine happy smile, cheerful expression, a glowing live trading chart on the screen in front of him climbing upward, warm afternoon light, alone in frame — no other characters, no background theme elements competing for attention.

PEPE''s face must always show a big genuine happy smile — joyful, cheerful, full of positive energy. NEVER sad, NEVER serious, NEVER neutral, NEVER worried.

Composition rules:
Horizontal landscape layout — wide format 16:9.
Scene large and dominant, cinematic framing, dramatic lighting, high contrast.
Left side reserved for text overlay — clean with only background graphic elements.
Ultra-realistic cinematic quality throughout.

TEXT ELEMENTS — render ONLY these items, nothing else:
Item 1: [ITEM 1] — very large bold orange and white 3D font with fire glow
Item 2: [ITEM 2] — large bold neon green 3D font with gold outline
Item 3: [ITEM 3] — bold white font with red urgent border box
Item 4: [ITEM 4] — bold gold brush style lettering

DO NOT add any other text. DO NOT add subtitles, slogans, scores or signatures.
DO NOT add any URLs or links inside the image.
Do NOT blend faces. Do NOT copy any person identity from any style reference.
Do NOT add glasses or any eyewear.
Final output: Premium Brazilian digital marketing banner — [ITEM 1] as dominant element — [ITEM 4] closing.' WHERE id = 'bc53223f-4427-4d37-ae1c-f27d6840ab31';

UPDATE public.image_prompt_templates SET body = '=== VARIÁVEIS ===
ITEM 1: [ITEM 1]
ITEM 2: [ITEM 2]
ITEM 3: [ITEM 3]
ITEM 4: [ITEM 4]
=================

This is a graphic design banner generation task. Do NOT render any prompt text inside the image.
The image must contain ONLY the TEXT ELEMENTS listed below. Nothing else.

Scene concept:
PEPE the green frog operating live at his trading desk, fully focused, big genuine happy smile, cheerful expression, a glowing live trading chart on the screen in front of him climbing upward, dramatic night studio lighting, alone in frame — no other characters, no background theme elements competing for attention.

PEPE''s face must always show a big genuine happy smile — joyful, cheerful, full of positive energy. NEVER sad, NEVER serious, NEVER neutral, NEVER worried.

Composition rules:
Horizontal landscape layout — wide format 16:9.
Scene large and dominant, cinematic framing, dramatic lighting, high contrast.
Left side reserved for text overlay — clean with only background graphic elements.
Ultra-realistic cinematic quality throughout.

TEXT ELEMENTS — render ONLY these items, nothing else:
Item 1: [ITEM 1] — very large bold orange and white 3D font with fire glow
Item 2: [ITEM 2] — large bold neon green 3D font with gold outline
Item 3: [ITEM 3] — bold white font with red urgent border box
Item 4: [ITEM 4] — bold gold brush style lettering

DO NOT add any other text. DO NOT add subtitles, slogans, scores or signatures.
DO NOT add any URLs or links inside the image.
Do NOT blend faces. Do NOT copy any person identity from any style reference.
Do NOT add glasses or any eyewear.
Final output: Premium Brazilian digital marketing banner — [ITEM 1] as dominant element — [ITEM 4] closing.' WHERE id = '8c0f77c6-af99-4214-857e-c7a487905e33';

UPDATE public.image_prompt_templates SET body = '=== VARIÁVEIS ===
ITEM 1: [ITEM 1]
ITEM 2: [ITEM 2]
ITEM 3: [ITEM 3]
ITEM 4: [ITEM 4]
=================

This is a graphic design banner generation task. Do NOT render any prompt text inside the image.
The image must contain ONLY the TEXT ELEMENTS listed below. Nothing else.

Scene concept:
PEPE the green frog operating live at his trading desk, fully focused, big genuine happy smile, cheerful expression, a glowing live trading chart on the screen in front of him climbing upward, warm morning light, alone in frame — no other characters, no background theme elements competing for attention.

PEPE''s face must always show a big genuine happy smile — joyful, cheerful, full of positive energy. NEVER sad, NEVER serious, NEVER neutral, NEVER worried.

Composition rules:
Horizontal landscape layout — wide format 16:9.
Scene large and dominant, cinematic framing, dramatic lighting, high contrast.
Left side reserved for text overlay — clean with only background graphic elements.
Ultra-realistic cinematic quality throughout.

TEXT ELEMENTS — render ONLY these items, nothing else:
Item 1: [ITEM 1] — very large bold orange and white 3D font with fire glow
Item 2: [ITEM 2] — large bold neon green 3D font with gold outline
Item 3: [ITEM 3] — bold white font with red urgent border box
Item 4: [ITEM 4] — bold gold brush style lettering

DO NOT add any other text. DO NOT add subtitles, slogans, scores or signatures.
DO NOT add any URLs or links inside the image.
Do NOT blend faces. Do NOT copy any person identity from any style reference.
Do NOT add glasses or any eyewear.
Final output: Premium Brazilian digital marketing banner — [ITEM 1] as dominant element — [ITEM 4] closing.' WHERE id = 'ec335175-0ea5-4cee-a7d0-d554fe817315';

UPDATE public.image_prompt_templates SET body = '=== VARIÁVEIS ===
ITEM 1: [ITEM 1]
ITEM 2: [ITEM 2]
ITEM 3: [ITEM 3]
ITEM 4: [ITEM 4]
=================

This is a graphic design banner generation task. Do NOT render any prompt text inside the image.
The image must contain ONLY the TEXT ELEMENTS listed below. Nothing else.

Scene concept:
PEPE the green frog operating live at his trading desk, fully focused, big genuine happy smile, cheerful expression, a glowing live trading chart on the screen in front of him climbing upward, warm afternoon light, alone in frame — no other characters, no background theme elements competing for attention.

PEPE''s face must always show a big genuine happy smile — joyful, cheerful, full of positive energy. NEVER sad, NEVER serious, NEVER neutral, NEVER worried.

Composition rules:
Horizontal landscape layout — wide format 16:9.
Scene large and dominant, cinematic framing, dramatic lighting, high contrast.
Left side reserved for text overlay — clean with only background graphic elements.
Ultra-realistic cinematic quality throughout.

TEXT ELEMENTS — render ONLY these items, nothing else:
Item 1: [ITEM 1] — very large bold orange and white 3D font with fire glow
Item 2: [ITEM 2] — large bold neon green 3D font with gold outline
Item 3: [ITEM 3] — bold white font with red urgent border box
Item 4: [ITEM 4] — bold gold brush style lettering

DO NOT add any other text. DO NOT add subtitles, slogans, scores or signatures.
DO NOT add any URLs or links inside the image.
Do NOT blend faces. Do NOT copy any person identity from any style reference.
Do NOT add glasses or any eyewear.
Final output: Premium Brazilian digital marketing banner — [ITEM 1] as dominant element — [ITEM 4] closing.' WHERE id = '63eb73f6-d558-4d3c-b217-445e423aa3d5';

UPDATE public.image_prompt_templates SET body = '=== VARIÁVEIS ===
ITEM 1: [ITEM 1]
ITEM 2: [ITEM 2]
ITEM 3: [ITEM 3]
ITEM 4: [ITEM 4]
=================

This is a graphic design banner generation task. Do NOT render any prompt text inside the image.
The image must contain ONLY the TEXT ELEMENTS listed below. Nothing else.

Scene concept:
PEPE the green frog operating live at his trading desk, fully focused, big genuine happy smile, cheerful expression, a glowing live trading chart on the screen in front of him climbing upward, dramatic night studio lighting, alone in frame — no other characters, no background theme elements competing for attention.

PEPE''s face must always show a big genuine happy smile — joyful, cheerful, full of positive energy. NEVER sad, NEVER serious, NEVER neutral, NEVER worried.

Composition rules:
Horizontal landscape layout — wide format 16:9.
Scene large and dominant, cinematic framing, dramatic lighting, high contrast.
Left side reserved for text overlay — clean with only background graphic elements.
Ultra-realistic cinematic quality throughout.

TEXT ELEMENTS — render ONLY these items, nothing else:
Item 1: [ITEM 1] — very large bold orange and white 3D font with fire glow
Item 2: [ITEM 2] — large bold neon green 3D font with gold outline
Item 3: [ITEM 3] — bold white font with red urgent border box
Item 4: [ITEM 4] — bold gold brush style lettering

DO NOT add any other text. DO NOT add subtitles, slogans, scores or signatures.
DO NOT add any URLs or links inside the image.
Do NOT blend faces. Do NOT copy any person identity from any style reference.
Do NOT add glasses or any eyewear.
Final output: Premium Brazilian digital marketing banner — [ITEM 1] as dominant element — [ITEM 4] closing.' WHERE id = '81e799be-63db-46a7-8e38-80acdb1f3f4b';

UPDATE public.image_prompt_templates SET body = '=== VARIÁVEIS ===
ITEM 1: [ITEM 1]
ITEM 2: [ITEM 2]
ITEM 3: [ITEM 3]
ITEM 4: [ITEM 4]
=================

This is a graphic design banner generation task. Do NOT render any prompt text inside the image.
The image must contain ONLY the TEXT ELEMENTS listed below. Nothing else.

Scene concept:
PEPE the green frog operating live at his trading desk, fully focused, big genuine happy smile, cheerful expression, a glowing live trading chart on the screen in front of him climbing upward, warm afternoon light, alone in frame — no other characters, no background theme elements competing for attention.

PEPE''s face must always show a big genuine happy smile — joyful, cheerful, full of positive energy. NEVER sad, NEVER serious, NEVER neutral, NEVER worried.

Composition rules:
Horizontal landscape layout — wide format 16:9.
Scene large and dominant, cinematic framing, dramatic lighting, high contrast.
Left side reserved for text overlay — clean with only background graphic elements.
Ultra-realistic cinematic quality throughout.

TEXT ELEMENTS — render ONLY these items, nothing else:
Item 1: [ITEM 1] — very large bold orange and white 3D font with fire glow
Item 2: [ITEM 2] — large bold neon green 3D font with gold outline
Item 3: [ITEM 3] — bold white font with red urgent border box
Item 4: [ITEM 4] — bold gold brush style lettering

DO NOT add any other text. DO NOT add subtitles, slogans, scores or signatures.
DO NOT add any URLs or links inside the image.
Do NOT blend faces. Do NOT copy any person identity from any style reference.
Do NOT add glasses or any eyewear.
Final output: Premium Brazilian digital marketing banner — [ITEM 1] as dominant element — [ITEM 4] closing.' WHERE id = 'bc326eb2-300a-4416-86ce-269682211c36';

UPDATE public.image_prompt_templates SET body = '=== VARIÁVEIS ===
ITEM 1: [ITEM 1]
ITEM 2: [ITEM 2]
ITEM 3: [ITEM 3]
ITEM 4: [ITEM 4]
=================

This is a graphic design banner generation task. Do NOT render any prompt text inside the image.
The image must contain ONLY the TEXT ELEMENTS listed below. Nothing else.

Scene concept:
PEPE the green frog operating live at his trading desk, fully focused, big genuine happy smile, cheerful expression, a glowing live trading chart on the screen in front of him climbing upward, dramatic night studio lighting, alone in frame — no other characters, no background theme elements competing for attention.

PEPE''s face must always show a big genuine happy smile — joyful, cheerful, full of positive energy. NEVER sad, NEVER serious, NEVER neutral, NEVER worried.

Composition rules:
Horizontal landscape layout — wide format 16:9.
Scene large and dominant, cinematic framing, dramatic lighting, high contrast.
Left side reserved for text overlay — clean with only background graphic elements.
Ultra-realistic cinematic quality throughout.

TEXT ELEMENTS — render ONLY these items, nothing else:
Item 1: [ITEM 1] — very large bold orange and white 3D font with fire glow
Item 2: [ITEM 2] — large bold neon green 3D font with gold outline
Item 3: [ITEM 3] — bold white font with red urgent border box
Item 4: [ITEM 4] — bold gold brush style lettering

DO NOT add any other text. DO NOT add subtitles, slogans, scores or signatures.
DO NOT add any URLs or links inside the image.
Do NOT blend faces. Do NOT copy any person identity from any style reference.
Do NOT add glasses or any eyewear.
Final output: Premium Brazilian digital marketing banner — [ITEM 1] as dominant element — [ITEM 4] closing.' WHERE id = '09902934-2b15-4538-a72d-1fd1a1c7553c';

UPDATE public.image_prompt_templates SET body = '=== VARIÁVEIS ===
ITEM 1: [ITEM 1]
ITEM 2: [ITEM 2]
ITEM 3: [ITEM 3]
ITEM 4: [ITEM 4]
=================

This is a graphic design banner generation task. Do NOT render any prompt text inside the image.
The image must contain ONLY the TEXT ELEMENTS listed below. Nothing else.

Scene concept:
PEPE the green frog operating live at his trading desk, fully focused, big genuine happy smile, cheerful expression, a glowing live trading chart on the screen in front of him climbing upward, warm morning light, alone in frame — no other characters, no background theme elements competing for attention.

PEPE''s face must always show a big genuine happy smile — joyful, cheerful, full of positive energy. NEVER sad, NEVER serious, NEVER neutral, NEVER worried.

Composition rules:
Horizontal landscape layout — wide format 16:9.
Scene large and dominant, cinematic framing, dramatic lighting, high contrast.
Left side reserved for text overlay — clean with only background graphic elements.
Ultra-realistic cinematic quality throughout.

TEXT ELEMENTS — render ONLY these items, nothing else:
Item 1: [ITEM 1] — very large bold orange and white 3D font with fire glow
Item 2: [ITEM 2] — large bold neon green 3D font with gold outline
Item 3: [ITEM 3] — bold white font with red urgent border box
Item 4: [ITEM 4] — bold gold brush style lettering

DO NOT add any other text. DO NOT add subtitles, slogans, scores or signatures.
DO NOT add any URLs or links inside the image.
Do NOT blend faces. Do NOT copy any person identity from any style reference.
Do NOT add glasses or any eyewear.
Final output: Premium Brazilian digital marketing banner — [ITEM 1] as dominant element — [ITEM 4] closing.' WHERE id = '478f5720-30c1-4c5d-b288-79fd797bdcc5';

UPDATE public.image_prompt_templates SET body = '=== VARIÁVEIS ===
ITEM 1: [ITEM 1]
ITEM 2: [ITEM 2]
ITEM 3: [ITEM 3]
ITEM 4: [ITEM 4]
=================

This is a graphic design banner generation task. Do NOT render any prompt text inside the image.
The image must contain ONLY the TEXT ELEMENTS listed below. Nothing else.

Scene concept:
PEPE the green frog standing beside a glowing radar screen with a diving fighter-jet icon, big genuine happy smile, cheerful and joyful expression, morning cockpit light.

PEPE''s face must always show a big genuine happy smile — joyful, cheerful, full of positive energy. NEVER sad, NEVER serious, NEVER neutral, NEVER worried.

Composition rules:
Horizontal landscape layout — wide format 16:9.
Scene large and dominant, cinematic framing, dramatic lighting, high contrast.
Left side reserved for text overlay — clean with only background graphic elements.
Ultra-realistic cinematic quality throughout.

TEXT ELEMENTS — render ONLY these items, nothing else:
Item 1: [ITEM 1] — very large bold orange and white 3D font with fire glow
Item 2: [ITEM 2] — large bold neon green 3D font with gold outline
Item 3: [ITEM 3] — bold white font with red urgent border box
Item 4: [ITEM 4] — bold gold brush style lettering

DO NOT add any other text. DO NOT add subtitles, slogans, scores or signatures.
DO NOT add any URLs or links inside the image.
Do NOT blend faces. Do NOT copy any person identity from any style reference.
Do NOT add glasses or any eyewear.
Final output: Premium Brazilian digital marketing banner — [ITEM 1] as dominant element — [ITEM 4] closing.' WHERE id = '62185741-e578-4032-9949-c24b811e30ff';

UPDATE public.image_prompt_templates SET body = '=== VARIÁVEIS ===
ITEM 1: [ITEM 1]
ITEM 2: [ITEM 2]
ITEM 3: [ITEM 3]
ITEM 4: [ITEM 4]
=================

This is a graphic design banner generation task. Do NOT render any prompt text inside the image.
The image must contain ONLY the TEXT ELEMENTS listed below. Nothing else.

Scene concept:
PEPE the green frog glancing at a glowing countdown clock beside a pulsing radar target icon, urgent afternoon energy.

PEPE''s face must always show a big genuine happy smile — joyful, cheerful, full of positive energy. NEVER sad, NEVER serious, NEVER neutral, NEVER worried.

Composition rules:
Horizontal landscape layout — wide format 16:9.
Scene large and dominant, cinematic framing, dramatic lighting, high contrast.
Left side reserved for text overlay — clean with only background graphic elements.
Ultra-realistic cinematic quality throughout.

TEXT ELEMENTS — render ONLY these items, nothing else:
Item 1: [ITEM 1] — very large bold orange and white 3D font with fire glow
Item 2: [ITEM 2] — large bold neon green 3D font with gold outline
Item 3: [ITEM 3] — bold white font with red urgent border box
Item 4: [ITEM 4] — bold gold brush style lettering

DO NOT add any other text. DO NOT add subtitles, slogans, scores or signatures.
DO NOT add any URLs or links inside the image.
Do NOT blend faces. Do NOT copy any person identity from any style reference.
Do NOT add glasses or any eyewear.
Final output: Premium Brazilian digital marketing banner — [ITEM 1] as dominant element — [ITEM 4] closing.' WHERE id = '59559d10-e5c1-49f6-a756-509363cfc50c';

UPDATE public.image_prompt_templates SET body = '=== VARIÁVEIS ===
ITEM 1: [ITEM 1]
ITEM 2: [ITEM 2]
ITEM 3: [ITEM 3]
ITEM 4: [ITEM 4]
=================

This is a graphic design banner generation task. Do NOT render any prompt text inside the image.
The image must contain ONLY the TEXT ELEMENTS listed below. Nothing else.

Scene concept:
PEPE the green frog holding a glowing lantern shaped like a radar screen under a night sky, big genuine happy smile, alert but cheerful expression, final-mission energy.

PEPE''s face must always show a big genuine happy smile — joyful, cheerful, full of positive energy. NEVER sad, NEVER serious, NEVER neutral, NEVER worried.

Composition rules:
Horizontal landscape layout — wide format 16:9.
Scene large and dominant, cinematic framing, dramatic lighting, high contrast.
Left side reserved for text overlay — clean with only background graphic elements.
Ultra-realistic cinematic quality throughout.

TEXT ELEMENTS — render ONLY these items, nothing else:
Item 1: [ITEM 1] — very large bold orange and white 3D font with fire glow
Item 2: [ITEM 2] — large bold neon green 3D font with gold outline
Item 3: [ITEM 3] — bold white font with red urgent border box
Item 4: [ITEM 4] — bold gold brush style lettering

DO NOT add any other text. DO NOT add subtitles, slogans, scores or signatures.
DO NOT add any URLs or links inside the image.
Do NOT blend faces. Do NOT copy any person identity from any style reference.
Do NOT add glasses or any eyewear.
Final output: Premium Brazilian digital marketing banner — [ITEM 1] as dominant element — [ITEM 4] closing.' WHERE id = '3a9f80e8-3e4b-412a-ba2d-d94686905812';

UPDATE public.image_prompt_templates SET body = '=== VARIÁVEIS ===
ITEM 1: [ITEM 1]
ITEM 2: [ITEM 2]
ITEM 3: [ITEM 3]
ITEM 4: [ITEM 4]
=================

This is a graphic design banner generation task. Do NOT render any prompt text inside the image.
The image must contain ONLY the TEXT ELEMENTS listed below. Nothing else.

Scene concept:
PEPE the green frog glancing anxiously at a glowing countdown clock next to a radar target lock icon, big genuine happy smile, excited and joyful expression.

PEPE''s face must always show a big genuine happy smile — joyful, cheerful, full of positive energy. NEVER sad, NEVER serious, NEVER neutral, NEVER worried.

Composition rules:
Horizontal landscape layout — wide format 16:9.
Scene large and dominant, cinematic framing, dramatic lighting, high contrast.
Left side reserved for text overlay — clean with only background graphic elements.
Ultra-realistic cinematic quality throughout.

TEXT ELEMENTS — render ONLY these items, nothing else:
Item 1: [ITEM 1] — very large bold orange and white 3D font with fire glow
Item 2: [ITEM 2] — large bold neon green 3D font with gold outline
Item 3: [ITEM 3] — bold white font with red urgent border box
Item 4: [ITEM 4] — bold gold brush style lettering

DO NOT add any other text. DO NOT add subtitles, slogans, scores or signatures.
DO NOT add any URLs or links inside the image.
Do NOT blend faces. Do NOT copy any person identity from any style reference.
Do NOT add glasses or any eyewear.
Final output: Premium Brazilian digital marketing banner — [ITEM 1] as dominant element — [ITEM 4] closing.' WHERE id = '3d48db92-5417-4648-b625-ad33897ba1c8';

UPDATE public.image_prompt_templates SET body = '=== VARIÁVEIS ===
ITEM 1: [ITEM 1]
ITEM 2: [ITEM 2]
ITEM 3: [ITEM 3]
ITEM 4: [ITEM 4]
=================

This is a graphic design banner generation task. Do NOT render any prompt text inside the image.
The image must contain ONLY the TEXT ELEMENTS listed below. Nothing else.

Scene concept:
PEPE the green frog holding a glowing radar tablet showing an active target lock, cheerful afternoon energy, big genuine happy smile.

PEPE''s face must always show a big genuine happy smile — joyful, cheerful, full of positive energy. NEVER sad, NEVER serious, NEVER neutral, NEVER worried.

Composition rules:
Horizontal landscape layout — wide format 16:9.
Scene large and dominant, cinematic framing, dramatic lighting, high contrast.
Left side reserved for text overlay — clean with only background graphic elements.
Ultra-realistic cinematic quality throughout.

TEXT ELEMENTS — render ONLY these items, nothing else:
Item 1: [ITEM 1] — very large bold orange and white 3D font with fire glow
Item 2: [ITEM 2] — large bold neon green 3D font with gold outline
Item 3: [ITEM 3] — bold white font with red urgent border box
Item 4: [ITEM 4] — bold gold brush style lettering

DO NOT add any other text. DO NOT add subtitles, slogans, scores or signatures.
DO NOT add any URLs or links inside the image.
Do NOT blend faces. Do NOT copy any person identity from any style reference.
Do NOT add glasses or any eyewear.
Final output: Premium Brazilian digital marketing banner — [ITEM 1] as dominant element — [ITEM 4] closing.' WHERE id = '57c0fb50-3349-42b4-8ac1-8d8e6bb98d0b';

UPDATE public.image_prompt_templates SET body = '=== VARIÁVEIS ===
ITEM 1: [ITEM 1]
ITEM 2: [ITEM 2]
ITEM 3: [ITEM 3]
ITEM 4: [ITEM 4]
=================

This is a graphic design banner generation task. Do NOT render any prompt text inside the image.
The image must contain ONLY the TEXT ELEMENTS listed below. Nothing else.

Scene concept:
PEPE the green frog checking a glowing smartphone with a results screen, big genuine happy smile, cheerful and joyful expression, morning light, small trophy icon floating beside the phone screen.

PEPE''s face must always show a big genuine happy smile — joyful, cheerful, full of positive energy. NEVER sad, NEVER serious, NEVER neutral, NEVER worried.

Composition rules:
Horizontal landscape layout — wide format 16:9.
Scene large and dominant, cinematic framing, dramatic lighting, high contrast.
Left side reserved for text overlay — clean with only background graphic elements.
Ultra-realistic cinematic quality throughout.

TEXT ELEMENTS — render ONLY these items, nothing else:
Item 1: [ITEM 1] — very large bold orange and white 3D font with fire glow
Item 2: [ITEM 2] — large bold neon green 3D font with gold outline
Item 3: [ITEM 3] — bold white font with red urgent border box
Item 4: [ITEM 4] — bold gold brush style lettering

DO NOT add any other text. DO NOT add subtitles, slogans, scores or signatures.
DO NOT add any URLs or links inside the image.
Do NOT blend faces. Do NOT copy any person identity from any style reference.
Do NOT add glasses or any eyewear.
Final output: Premium Brazilian digital marketing banner — [ITEM 1] as dominant element — [ITEM 4] closing.' WHERE id = '1dcddb06-523e-424c-9279-52d82ff11440';

UPDATE public.image_prompt_templates SET body = '=== VARIÁVEIS ===
ITEM 1: [ITEM 1]
ITEM 2: [ITEM 2]
ITEM 3: [ITEM 3]
ITEM 4: [ITEM 4]
=================

This is a graphic design banner generation task. Do NOT render any prompt text inside the image.
The image must contain ONLY the TEXT ELEMENTS listed below. Nothing else.

Scene concept:
PEPE the green frog glancing anxiously at a glowing countdown clock hovering in the air showing final minutes, big genuine happy smile, excited and joyful expression, warm morning tones.

PEPE''s face must always show a big genuine happy smile — joyful, cheerful, full of positive energy. NEVER sad, NEVER serious, NEVER neutral, NEVER worried.

Composition rules:
Horizontal landscape layout — wide format 16:9.
Scene large and dominant, cinematic framing, dramatic lighting, high contrast.
Left side reserved for text overlay — clean with only background graphic elements.
Ultra-realistic cinematic quality throughout.

TEXT ELEMENTS — render ONLY these items, nothing else:
Item 1: [ITEM 1] — very large bold orange and white 3D font with fire glow
Item 2: [ITEM 2] — large bold neon green 3D font with gold outline
Item 3: [ITEM 3] — bold white font with red urgent border box
Item 4: [ITEM 4] — bold gold brush style lettering

DO NOT add any other text. DO NOT add subtitles, slogans, scores or signatures.
DO NOT add any URLs or links inside the image.
Do NOT blend faces. Do NOT copy any person identity from any style reference.
Do NOT add glasses or any eyewear.
Final output: Premium Brazilian digital marketing banner — [ITEM 1] as dominant element — [ITEM 4] closing.' WHERE id = '9cf72a03-816b-4001-bd46-aad1222227aa';

UPDATE public.image_prompt_templates SET body = '=== VARIÁVEIS ===
ITEM 1: [ITEM 1]
ITEM 2: [ITEM 2]
ITEM 3: [ITEM 3]
ITEM 4: [ITEM 4]
=================

This is a graphic design banner generation task. Do NOT render any prompt text inside the image.
The image must contain ONLY the TEXT ELEMENTS listed below. Nothing else.

Scene concept:
PEPE the green frog holding up a glowing results scoreboard with a raised fist, beaming proud smile, big genuine happy expression, afternoon warm light, small green upward chart in the background.

PEPE''s face must always show a big genuine happy smile — joyful, cheerful, full of positive energy. NEVER sad, NEVER serious, NEVER neutral, NEVER worried.

Composition rules:
Horizontal landscape layout — wide format 16:9.
Scene large and dominant, cinematic framing, dramatic lighting, high contrast.
Left side reserved for text overlay — clean with only background graphic elements.
Ultra-realistic cinematic quality throughout.

TEXT ELEMENTS — render ONLY these items, nothing else:
Item 1: [ITEM 1] — very large bold orange and white 3D font with fire glow
Item 2: [ITEM 2] — large bold neon green 3D font with gold outline
Item 3: [ITEM 3] — bold white font with red urgent border box
Item 4: [ITEM 4] — bold gold brush style lettering

DO NOT add any other text. DO NOT add subtitles, slogans, scores or signatures.
DO NOT add any URLs or links inside the image.
Do NOT blend faces. Do NOT copy any person identity from any style reference.
Do NOT add glasses or any eyewear.
Final output: Premium Brazilian digital marketing banner — [ITEM 1] as dominant element — [ITEM 4] closing.' WHERE id = 'a3b329aa-b298-4378-82ac-5ec1aa3ca3c7';

UPDATE public.image_prompt_templates SET body = '=== VARIÁVEIS ===
ITEM 1: [ITEM 1]
ITEM 2: [ITEM 2]
ITEM 3: [ITEM 3]
ITEM 4: [ITEM 4]
=================

This is a graphic design banner generation task. Do NOT render any prompt text inside the image.
The image must contain ONLY the TEXT ELEMENTS listed below. Nothing else.

Scene concept:
PEPE the green frog and the Copy Trader robot standing side by side, both alert and focused, PEPE with a big genuine happy smile on a glowing countdown, afternoon light, sense of anticipation.

PEPE''s face must always show a big genuine happy smile — joyful, cheerful, full of positive energy. NEVER sad, NEVER serious, NEVER neutral, NEVER worried.

Composition rules:
Horizontal landscape layout — wide format 16:9.
Scene large and dominant, cinematic framing, dramatic lighting, high contrast.
Left side reserved for text overlay — clean with only background graphic elements.
Ultra-realistic cinematic quality throughout.

TEXT ELEMENTS — render ONLY these items, nothing else:
Item 1: [ITEM 1] — very large bold orange and white 3D font with fire glow
Item 2: [ITEM 2] — large bold neon green 3D font with gold outline
Item 3: [ITEM 3] — bold white font with red urgent border box
Item 4: [ITEM 4] — bold gold brush style lettering

DO NOT add any other text. DO NOT add subtitles, slogans, scores or signatures.
DO NOT add any URLs or links inside the image.
Do NOT blend faces. Do NOT copy any person identity from any style reference.
Do NOT add glasses or any eyewear.
Final output: Premium Brazilian digital marketing banner — [ITEM 1] as dominant element — [ITEM 4] closing.' WHERE id = '86ceda60-a6d6-4e3b-bd1d-c350e57e581c';

UPDATE public.image_prompt_templates SET body = '=== VARIÁVEIS ===
ITEM 1: [ITEM 1]
ITEM 2: [ITEM 2]
ITEM 3: [ITEM 3]
ITEM 4: [ITEM 4]
=================

This is a graphic design banner generation task. Do NOT render any prompt text inside the image.
The image must contain ONLY the TEXT ELEMENTS listed below. Nothing else.

Scene concept:
PEPE the green frog holding a glowing lantern under a night sky, big genuine happy smile, alert but cheerful expression, final-call energy, dark arena silhouette in the background.

PEPE''s face must always show a big genuine happy smile — joyful, cheerful, full of positive energy. NEVER sad, NEVER serious, NEVER neutral, NEVER worried.

Composition rules:
Horizontal landscape layout — wide format 16:9.
Scene large and dominant, cinematic framing, dramatic lighting, high contrast.
Left side reserved for text overlay — clean with only background graphic elements.
Ultra-realistic cinematic quality throughout.

TEXT ELEMENTS — render ONLY these items, nothing else:
Item 1: [ITEM 1] — very large bold orange and white 3D font with fire glow
Item 2: [ITEM 2] — large bold neon green 3D font with gold outline
Item 3: [ITEM 3] — bold white font with red urgent border box
Item 4: [ITEM 4] — bold gold brush style lettering

DO NOT add any other text. DO NOT add subtitles, slogans, scores or signatures.
DO NOT add any URLs or links inside the image.
Do NOT blend faces. Do NOT copy any person identity from any style reference.
Do NOT add glasses or any eyewear.
Final output: Premium Brazilian digital marketing banner — [ITEM 1] as dominant element — [ITEM 4] closing.' WHERE id = 'ed06db1c-1264-4319-a491-84d91d42304d';

UPDATE public.image_prompt_templates SET body = '=== VARIÁVEIS ===
ITEM 1: [ITEM 1]
ITEM 2: [ITEM 2]
ITEM 3: [ITEM 3]
ITEM 4: [ITEM 4]
=================

This is a graphic design banner generation task. Do NOT render any prompt text inside the image.
The image must contain ONLY the TEXT ELEMENTS listed below. Nothing else.

Scene concept:
PEPE the green frog checking a glowing smartphone with a results screen, a small golden gift box glowing beside him, big genuine happy smile, cheerful and joyful expression, morning light.

PEPE''s face must always show a big genuine happy smile — joyful, cheerful, full of positive energy. NEVER sad, NEVER serious, NEVER neutral, NEVER worried.

Composition rules:
Horizontal landscape layout — wide format 16:9.
Scene large and dominant, cinematic framing, dramatic lighting, high contrast.
Left side reserved for text overlay — clean with only background graphic elements.
Ultra-realistic cinematic quality throughout.

TEXT ELEMENTS — render ONLY these items, nothing else:
Item 1: [ITEM 1] — very large bold orange and white 3D font with fire glow
Item 2: [ITEM 2] — large bold neon green 3D font with gold outline
Item 3: [ITEM 3] — bold white font with red urgent border box
Item 4: [ITEM 4] — bold gold brush style lettering

DO NOT add any other text. DO NOT add subtitles, slogans, scores or signatures.
DO NOT add any URLs or links inside the image.
Do NOT blend faces. Do NOT copy any person identity from any style reference.
Do NOT add glasses or any eyewear.
Final output: Premium Brazilian digital marketing banner — [ITEM 1] as dominant element — [ITEM 4] closing.' WHERE id = 'e161ec2e-66aa-4860-b358-51e36043b679';

UPDATE public.image_prompt_templates SET body = '=== VARIÁVEIS ===
ITEM 1: [ITEM 1]
ITEM 2: [ITEM 2]
ITEM 3: [ITEM 3]
ITEM 4: [ITEM 4]
=================

This is a graphic design banner generation task. Do NOT render any prompt text inside the image.
The image must contain ONLY the TEXT ELEMENTS listed below. Nothing else.

Scene concept:
PEPE the green frog glancing anxiously at a glowing countdown clock, a wrapped golden gift box ticking beside it, big genuine happy smile, excited and joyful expression, warm morning tones.

PEPE''s face must always show a big genuine happy smile — joyful, cheerful, full of positive energy. NEVER sad, NEVER serious, NEVER neutral, NEVER worried.

Composition rules:
Horizontal landscape layout — wide format 16:9.
Scene large and dominant, cinematic framing, dramatic lighting, high contrast.
Left side reserved for text overlay — clean with only background graphic elements.
Ultra-realistic cinematic quality throughout.

TEXT ELEMENTS — render ONLY these items, nothing else:
Item 1: [ITEM 1] — very large bold orange and white 3D font with fire glow
Item 2: [ITEM 2] — large bold neon green 3D font with gold outline
Item 3: [ITEM 3] — bold white font with red urgent border box
Item 4: [ITEM 4] — bold gold brush style lettering

DO NOT add any other text. DO NOT add subtitles, slogans, scores or signatures.
DO NOT add any URLs or links inside the image.
Do NOT blend faces. Do NOT copy any person identity from any style reference.
Do NOT add glasses or any eyewear.
Final output: Premium Brazilian digital marketing banner — [ITEM 1] as dominant element — [ITEM 4] closing.' WHERE id = '54aadbc1-6e3c-4168-ba94-9f28d195d036';

UPDATE public.image_prompt_templates SET body = '=== VARIÁVEIS ===
ITEM 1: [ITEM 1]
ITEM 2: [ITEM 2]
ITEM 3: [ITEM 3]
ITEM 4: [ITEM 4]
=================

This is a graphic design banner generation task. Do NOT render any prompt text inside the image.
The image must contain ONLY the TEXT ELEMENTS listed below. Nothing else.

Scene concept:
PEPE the green frog holding up a glowing golden trophy-shaped gift box with a raised fist, beaming proud smile, big genuine happy expression, afternoon warm light.

PEPE''s face must always show a big genuine happy smile — joyful, cheerful, full of positive energy. NEVER sad, NEVER serious, NEVER neutral, NEVER worried.

Composition rules:
Horizontal landscape layout — wide format 16:9.
Scene large and dominant, cinematic framing, dramatic lighting, high contrast.
Left side reserved for text overlay — clean with only background graphic elements.
Ultra-realistic cinematic quality throughout.

TEXT ELEMENTS — render ONLY these items, nothing else:
Item 1: [ITEM 1] — very large bold orange and white 3D font with fire glow
Item 2: [ITEM 2] — large bold neon green 3D font with gold outline
Item 3: [ITEM 3] — bold white font with red urgent border box
Item 4: [ITEM 4] — bold gold brush style lettering

DO NOT add any other text. DO NOT add subtitles, slogans, scores or signatures.
DO NOT add any URLs or links inside the image.
Do NOT blend faces. Do NOT copy any person identity from any style reference.
Do NOT add glasses or any eyewear.
Final output: Premium Brazilian digital marketing banner — [ITEM 1] as dominant element — [ITEM 4] closing.' WHERE id = '50ab0dce-e9a2-42a0-a324-c8aa386cda3a';

UPDATE public.image_prompt_templates SET body = '=== VARIÁVEIS ===
ITEM 1: [ITEM 1]
ITEM 2: [ITEM 2]
ITEM 3: [ITEM 3]
ITEM 4: [ITEM 4]
=================

This is a graphic design banner generation task. Do NOT render any prompt text inside the image.
The image must contain ONLY the TEXT ELEMENTS listed below. Nothing else.

Scene concept:
PEPE the green frog and the Copy Trader robot standing side by side, both alert and focused, PEPE with a big genuine happy smile on a glowing golden bonus countdown, afternoon light.

PEPE''s face must always show a big genuine happy smile — joyful, cheerful, full of positive energy. NEVER sad, NEVER serious, NEVER neutral, NEVER worried.

Composition rules:
Horizontal landscape layout — wide format 16:9.
Scene large and dominant, cinematic framing, dramatic lighting, high contrast.
Left side reserved for text overlay — clean with only background graphic elements.
Ultra-realistic cinematic quality throughout.

TEXT ELEMENTS — render ONLY these items, nothing else:
Item 1: [ITEM 1] — very large bold orange and white 3D font with fire glow
Item 2: [ITEM 2] — large bold neon green 3D font with gold outline
Item 3: [ITEM 3] — bold white font with red urgent border box
Item 4: [ITEM 4] — bold gold brush style lettering

DO NOT add any other text. DO NOT add subtitles, slogans, scores or signatures.
DO NOT add any URLs or links inside the image.
Do NOT blend faces. Do NOT copy any person identity from any style reference.
Do NOT add glasses or any eyewear.
Final output: Premium Brazilian digital marketing banner — [ITEM 1] as dominant element — [ITEM 4] closing.' WHERE id = '5a7ec031-fae2-41aa-840d-e7e588898ad7';

UPDATE public.image_prompt_templates SET body = '=== VARIÁVEIS ===
ITEM 1: [ITEM 1]
ITEM 2: [ITEM 2]
ITEM 3: [ITEM 3]
ITEM 4: [ITEM 4]
=================

This is a graphic design banner generation task. Do NOT render any prompt text inside the image.
The image must contain ONLY the TEXT ELEMENTS listed below. Nothing else.

Scene concept:
PEPE the green frog holding a glowing lantern shaped like a golden gift box under a night sky, big genuine happy smile, alert but cheerful expression, final-call energy.

PEPE''s face must always show a big genuine happy smile — joyful, cheerful, full of positive energy. NEVER sad, NEVER serious, NEVER neutral, NEVER worried.

Composition rules:
Horizontal landscape layout — wide format 16:9.
Scene large and dominant, cinematic framing, dramatic lighting, high contrast.
Left side reserved for text overlay — clean with only background graphic elements.
Ultra-realistic cinematic quality throughout.

TEXT ELEMENTS — render ONLY these items, nothing else:
Item 1: [ITEM 1] — very large bold orange and white 3D font with fire glow
Item 2: [ITEM 2] — large bold neon green 3D font with gold outline
Item 3: [ITEM 3] — bold white font with red urgent border box
Item 4: [ITEM 4] — bold gold brush style lettering

DO NOT add any other text. DO NOT add subtitles, slogans, scores or signatures.
DO NOT add any URLs or links inside the image.
Do NOT blend faces. Do NOT copy any person identity from any style reference.
Do NOT add glasses or any eyewear.
Final output: Premium Brazilian digital marketing banner — [ITEM 1] as dominant element — [ITEM 4] closing.' WHERE id = '2f488b06-de00-472a-9f9e-942a1d1d8978';

UPDATE public.image_prompt_templates SET body = '=== VARIÁVEIS ===
ITEM 1: [ITEM 1]
ITEM 2: [ITEM 2]
ITEM 3: [ITEM 3]
ITEM 4: [ITEM 4]
=================

This is a graphic design banner generation task. Do NOT render any prompt text inside the image.
The image must contain ONLY the TEXT ELEMENTS listed below. Nothing else.

Scene concept:
PEPE the green frog checking a glowing smartphone with a results screen, a small glowing diploma scroll beside him, big genuine happy smile, cheerful and joyful expression, morning academy light.

PEPE''s face must always show a big genuine happy smile — joyful, cheerful, full of positive energy. NEVER sad, NEVER serious, NEVER neutral, NEVER worried.

Composition rules:
Horizontal landscape layout — wide format 16:9.
Scene large and dominant, cinematic framing, dramatic lighting, high contrast.
Left side reserved for text overlay — clean with only background graphic elements.
Ultra-realistic cinematic quality throughout.

TEXT ELEMENTS — render ONLY these items, nothing else:
Item 1: [ITEM 1] — very large bold orange and white 3D font with fire glow
Item 2: [ITEM 2] — large bold neon green 3D font with gold outline
Item 3: [ITEM 3] — bold white font with red urgent border box
Item 4: [ITEM 4] — bold gold brush style lettering

DO NOT add any other text. DO NOT add subtitles, slogans, scores or signatures.
DO NOT add any URLs or links inside the image.
Do NOT blend faces. Do NOT copy any person identity from any style reference.
Do NOT add glasses or any eyewear.
Final output: Premium Brazilian digital marketing banner — [ITEM 1] as dominant element — [ITEM 4] closing.' WHERE id = '9ee1d90e-df88-4352-962c-f73ec864c7bc';

UPDATE public.image_prompt_templates SET body = '=== VARIÁVEIS ===
ITEM 1: [ITEM 1]
ITEM 2: [ITEM 2]
ITEM 3: [ITEM 3]
ITEM 4: [ITEM 4]
=================

This is a graphic design banner generation task. Do NOT render any prompt text inside the image.
The image must contain ONLY the TEXT ELEMENTS listed below. Nothing else.

Scene concept:
PEPE the green frog glancing anxiously at a glowing countdown clock, an open glowing book of trading knowledge beside it, big genuine happy smile, excited and joyful expression.

PEPE''s face must always show a big genuine happy smile — joyful, cheerful, full of positive energy. NEVER sad, NEVER serious, NEVER neutral, NEVER worried.

Composition rules:
Horizontal landscape layout — wide format 16:9.
Scene large and dominant, cinematic framing, dramatic lighting, high contrast.
Left side reserved for text overlay — clean with only background graphic elements.
Ultra-realistic cinematic quality throughout.

TEXT ELEMENTS — render ONLY these items, nothing else:
Item 1: [ITEM 1] — very large bold orange and white 3D font with fire glow
Item 2: [ITEM 2] — large bold neon green 3D font with gold outline
Item 3: [ITEM 3] — bold white font with red urgent border box
Item 4: [ITEM 4] — bold gold brush style lettering

DO NOT add any other text. DO NOT add subtitles, slogans, scores or signatures.
DO NOT add any URLs or links inside the image.
Do NOT blend faces. Do NOT copy any person identity from any style reference.
Do NOT add glasses or any eyewear.
Final output: Premium Brazilian digital marketing banner — [ITEM 1] as dominant element — [ITEM 4] closing.' WHERE id = '63ba38ce-4371-4895-84e5-d227ec2fac92';

UPDATE public.image_prompt_templates SET body = '=== VARIÁVEIS ===
ITEM 1: [ITEM 1]
ITEM 2: [ITEM 2]
ITEM 3: [ITEM 3]
ITEM 4: [ITEM 4]
=================

This is a graphic design banner generation task. Do NOT render any prompt text inside the image.
The image must contain ONLY the TEXT ELEMENTS listed below. Nothing else.

Scene concept:
PEPE the green frog holding up a glowing golden diploma scroll with a raised fist, beaming proud smile, big genuine happy expression, warm afternoon academy light.

PEPE''s face must always show a big genuine happy smile — joyful, cheerful, full of positive energy. NEVER sad, NEVER serious, NEVER neutral, NEVER worried.

Composition rules:
Horizontal landscape layout — wide format 16:9.
Scene large and dominant, cinematic framing, dramatic lighting, high contrast.
Left side reserved for text overlay — clean with only background graphic elements.
Ultra-realistic cinematic quality throughout.

TEXT ELEMENTS — render ONLY these items, nothing else:
Item 1: [ITEM 1] — very large bold orange and white 3D font with fire glow
Item 2: [ITEM 2] — large bold neon green 3D font with gold outline
Item 3: [ITEM 3] — bold white font with red urgent border box
Item 4: [ITEM 4] — bold gold brush style lettering

DO NOT add any other text. DO NOT add subtitles, slogans, scores or signatures.
DO NOT add any URLs or links inside the image.
Do NOT blend faces. Do NOT copy any person identity from any style reference.
Do NOT add glasses or any eyewear.
Final output: Premium Brazilian digital marketing banner — [ITEM 1] as dominant element — [ITEM 4] closing.' WHERE id = '9f0760f3-c0bd-418b-a5c3-38313c7ce35d';

UPDATE public.image_prompt_templates SET body = '=== VARIÁVEIS ===
ITEM 1: [ITEM 1]
ITEM 2: [ITEM 2]
ITEM 3: [ITEM 3]
ITEM 4: [ITEM 4]
=================

This is a graphic design banner generation task. Do NOT render any prompt text inside the image.
The image must contain ONLY the TEXT ELEMENTS listed below. Nothing else.

Scene concept:
PEPE the green frog and the Copy Trader robot standing side by side beside a glowing holographic trading chart lesson, both focused and alert, PEPE with a big genuine happy smile, afternoon light.

PEPE''s face must always show a big genuine happy smile — joyful, cheerful, full of positive energy. NEVER sad, NEVER serious, NEVER neutral, NEVER worried.

Composition rules:
Horizontal landscape layout — wide format 16:9.
Scene large and dominant, cinematic framing, dramatic lighting, high contrast.
Left side reserved for text overlay — clean with only background graphic elements.
Ultra-realistic cinematic quality throughout.

TEXT ELEMENTS — render ONLY these items, nothing else:
Item 1: [ITEM 1] — very large bold orange and white 3D font with fire glow
Item 2: [ITEM 2] — large bold neon green 3D font with gold outline
Item 3: [ITEM 3] — bold white font with red urgent border box
Item 4: [ITEM 4] — bold gold brush style lettering

DO NOT add any other text. DO NOT add subtitles, slogans, scores or signatures.
DO NOT add any URLs or links inside the image.
Do NOT blend faces. Do NOT copy any person identity from any style reference.
Do NOT add glasses or any eyewear.
Final output: Premium Brazilian digital marketing banner — [ITEM 1] as dominant element — [ITEM 4] closing.' WHERE id = '13e43c12-9bd3-4ba9-bcc6-a17df549c491';

UPDATE public.image_prompt_templates SET body = '=== VARIÁVEIS ===
ITEM 1: [ITEM 1]
ITEM 2: [ITEM 2]
ITEM 3: [ITEM 3]
ITEM 4: [ITEM 4]
=================

This is a graphic design banner generation task. Do NOT render any prompt text inside the image.
The image must contain ONLY the TEXT ELEMENTS listed below. Nothing else.

Scene concept:
PEPE the green frog holding a glowing lantern shaped like an open book under a night sky, big genuine happy smile, alert but cheerful expression, final-call energy.

PEPE''s face must always show a big genuine happy smile — joyful, cheerful, full of positive energy. NEVER sad, NEVER serious, NEVER neutral, NEVER worried.

Composition rules:
Horizontal landscape layout — wide format 16:9.
Scene large and dominant, cinematic framing, dramatic lighting, high contrast.
Left side reserved for text overlay — clean with only background graphic elements.
Ultra-realistic cinematic quality throughout.

TEXT ELEMENTS — render ONLY these items, nothing else:
Item 1: [ITEM 1] — very large bold orange and white 3D font with fire glow
Item 2: [ITEM 2] — large bold neon green 3D font with gold outline
Item 3: [ITEM 3] — bold white font with red urgent border box
Item 4: [ITEM 4] — bold gold brush style lettering

DO NOT add any other text. DO NOT add subtitles, slogans, scores or signatures.
DO NOT add any URLs or links inside the image.
Do NOT blend faces. Do NOT copy any person identity from any style reference.
Do NOT add glasses or any eyewear.
Final output: Premium Brazilian digital marketing banner — [ITEM 1] as dominant element — [ITEM 4] closing.' WHERE id = '4536eb92-0d29-4a6b-be7e-e63a785b8f3a';

UPDATE public.image_prompt_templates SET body = '=== VARIÁVEIS ===
ITEM 1: [ITEM 1]
ITEM 2: [ITEM 2]
ITEM 3: [ITEM 3]
ITEM 4: [ITEM 4]
=================

This is a graphic design banner generation task. Do NOT render any prompt text inside the image.
The image must contain ONLY the TEXT ELEMENTS listed below. Nothing else.

Scene concept:
PEPE the green frog checking a glowing smartphone with a results screen, a small glowing diamond sniper-scope icon beside him, big genuine happy smile, cheerful and joyful expression, morning light.

PEPE''s face must always show a big genuine happy smile — joyful, cheerful, full of positive energy. NEVER sad, NEVER serious, NEVER neutral, NEVER worried.

Composition rules:
Horizontal landscape layout — wide format 16:9.
Scene large and dominant, cinematic framing, dramatic lighting, high contrast.
Left side reserved for text overlay — clean with only background graphic elements.
Ultra-realistic cinematic quality throughout.

TEXT ELEMENTS — render ONLY these items, nothing else:
Item 1: [ITEM 1] — very large bold orange and white 3D font with fire glow
Item 2: [ITEM 2] — large bold neon green 3D font with gold outline
Item 3: [ITEM 3] — bold white font with red urgent border box
Item 4: [ITEM 4] — bold gold brush style lettering

DO NOT add any other text. DO NOT add subtitles, slogans, scores or signatures.
DO NOT add any URLs or links inside the image.
Do NOT blend faces. Do NOT copy any person identity from any style reference.
Do NOT add glasses or any eyewear.
Final output: Premium Brazilian digital marketing banner — [ITEM 1] as dominant element — [ITEM 4] closing.' WHERE id = '53ed0d05-894e-4ba2-9aa2-7e3b40da7243';

UPDATE public.image_prompt_templates SET body = '=== VARIÁVEIS ===
ITEM 1: [ITEM 1]
ITEM 2: [ITEM 2]
ITEM 3: [ITEM 3]
ITEM 4: [ITEM 4]
=================

This is a graphic design banner generation task. Do NOT render any prompt text inside the image.
The image must contain ONLY the TEXT ELEMENTS listed below. Nothing else.

Scene concept:
PEPE the green frog glancing anxiously at a glowing countdown clock, a precision sniper-scope crosshair glowing beside it, big genuine happy smile, excited and joyful expression.

PEPE''s face must always show a big genuine happy smile — joyful, cheerful, full of positive energy. NEVER sad, NEVER serious, NEVER neutral, NEVER worried.

Composition rules:
Horizontal landscape layout — wide format 16:9.
Scene large and dominant, cinematic framing, dramatic lighting, high contrast.
Left side reserved for text overlay — clean with only background graphic elements.
Ultra-realistic cinematic quality throughout.

TEXT ELEMENTS — render ONLY these items, nothing else:
Item 1: [ITEM 1] — very large bold orange and white 3D font with fire glow
Item 2: [ITEM 2] — large bold neon green 3D font with gold outline
Item 3: [ITEM 3] — bold white font with red urgent border box
Item 4: [ITEM 4] — bold gold brush style lettering

DO NOT add any other text. DO NOT add subtitles, slogans, scores or signatures.
DO NOT add any URLs or links inside the image.
Do NOT blend faces. Do NOT copy any person identity from any style reference.
Do NOT add glasses or any eyewear.
Final output: Premium Brazilian digital marketing banner — [ITEM 1] as dominant element — [ITEM 4] closing.' WHERE id = 'c295e173-9186-4528-a375-0091e4f18969';

UPDATE public.image_prompt_templates SET body = '=== VARIÁVEIS ===
ITEM 1: [ITEM 1]
ITEM 2: [ITEM 2]
ITEM 3: [ITEM 3]
ITEM 4: [ITEM 4]
=================

This is a graphic design banner generation task. Do NOT render any prompt text inside the image.
The image must contain ONLY the TEXT ELEMENTS listed below. Nothing else.

Scene concept:
PEPE the green frog holding up a glowing diamond trophy with a raised fist, beaming proud smile, big genuine happy expression, warm afternoon light with blue precision accents.

PEPE''s face must always show a big genuine happy smile — joyful, cheerful, full of positive energy. NEVER sad, NEVER serious, NEVER neutral, NEVER worried.

Composition rules:
Horizontal landscape layout — wide format 16:9.
Scene large and dominant, cinematic framing, dramatic lighting, high contrast.
Left side reserved for text overlay — clean with only background graphic elements.
Ultra-realistic cinematic quality throughout.

TEXT ELEMENTS — render ONLY these items, nothing else:
Item 1: [ITEM 1] — very large bold orange and white 3D font with fire glow
Item 2: [ITEM 2] — large bold neon green 3D font with gold outline
Item 3: [ITEM 3] — bold white font with red urgent border box
Item 4: [ITEM 4] — bold gold brush style lettering

DO NOT add any other text. DO NOT add subtitles, slogans, scores or signatures.
DO NOT add any URLs or links inside the image.
Do NOT blend faces. Do NOT copy any person identity from any style reference.
Do NOT add glasses or any eyewear.
Final output: Premium Brazilian digital marketing banner — [ITEM 1] as dominant element — [ITEM 4] closing.' WHERE id = 'b818f053-8f60-4295-a1b8-16a5665636e1';

UPDATE public.image_prompt_templates SET body = '=== VARIÁVEIS ===
ITEM 1: [ITEM 1]
ITEM 2: [ITEM 2]
ITEM 3: [ITEM 3]
ITEM 4: [ITEM 4]
=================

This is a graphic design banner generation task. Do NOT render any prompt text inside the image.
The image must contain ONLY the TEXT ELEMENTS listed below. Nothing else.

Scene concept:
PEPE the green frog holding a glowing lantern shaped like a sniper scope under a night sky, big genuine happy smile, alert but cheerful expression, final-call precision energy.

PEPE''s face must always show a big genuine happy smile — joyful, cheerful, full of positive energy. NEVER sad, NEVER serious, NEVER neutral, NEVER worried.

Composition rules:
Horizontal landscape layout — wide format 16:9.
Scene large and dominant, cinematic framing, dramatic lighting, high contrast.
Left side reserved for text overlay — clean with only background graphic elements.
Ultra-realistic cinematic quality throughout.

TEXT ELEMENTS — render ONLY these items, nothing else:
Item 1: [ITEM 1] — very large bold orange and white 3D font with fire glow
Item 2: [ITEM 2] — large bold neon green 3D font with gold outline
Item 3: [ITEM 3] — bold white font with red urgent border box
Item 4: [ITEM 4] — bold gold brush style lettering

DO NOT add any other text. DO NOT add subtitles, slogans, scores or signatures.
DO NOT add any URLs or links inside the image.
Do NOT blend faces. Do NOT copy any person identity from any style reference.
Do NOT add glasses or any eyewear.
Final output: Premium Brazilian digital marketing banner — [ITEM 1] as dominant element — [ITEM 4] closing.' WHERE id = '4887eec6-1c9e-4311-8ae1-c386f539db44';

UPDATE public.image_prompt_templates SET body = '=== VARIÁVEIS ===
ITEM 1: [ITEM 1]
ITEM 2: [ITEM 2]
ITEM 3: [ITEM 3]
ITEM 4: [ITEM 4]
=================

This is a graphic design banner generation task. Do NOT render any prompt text inside the image.
The image must contain ONLY the TEXT ELEMENTS listed below. Nothing else.

Scene concept:
PEPE the green frog checking a glowing smartphone with a priority-lane fast-track icon beside him, big genuine happy smile, cheerful and joyful expression, morning light.

PEPE''s face must always show a big genuine happy smile — joyful, cheerful, full of positive energy. NEVER sad, NEVER serious, NEVER neutral, NEVER worried.

Composition rules:
Horizontal landscape layout — wide format 16:9.
Scene large and dominant, cinematic framing, dramatic lighting, high contrast.
Left side reserved for text overlay — clean with only background graphic elements.
Ultra-realistic cinematic quality throughout.

TEXT ELEMENTS — render ONLY these items, nothing else:
Item 1: [ITEM 1] — very large bold orange and white 3D font with fire glow
Item 2: [ITEM 2] — large bold neon green 3D font with gold outline
Item 3: [ITEM 3] — bold white font with red urgent border box
Item 4: [ITEM 4] — bold gold brush style lettering

DO NOT add any other text. DO NOT add subtitles, slogans, scores or signatures.
DO NOT add any URLs or links inside the image.
Do NOT blend faces. Do NOT copy any person identity from any style reference.
Do NOT add glasses or any eyewear.
Final output: Premium Brazilian digital marketing banner — [ITEM 1] as dominant element — [ITEM 4] closing.' WHERE id = 'fa9ff9f1-114b-4bb3-a558-e79d187e7f88';

UPDATE public.image_prompt_templates SET body = '=== VARIÁVEIS ===
ITEM 1: [ITEM 1]
ITEM 2: [ITEM 2]
ITEM 3: [ITEM 3]
ITEM 4: [ITEM 4]
=================

This is a graphic design banner generation task. Do NOT render any prompt text inside the image.
The image must contain ONLY the TEXT ELEMENTS listed below. Nothing else.

Scene concept:
PEPE the green frog holding a glowing "prioridade" fast-pass ticket, cheerful afternoon energy, big genuine happy smile, warm light.

PEPE''s face must always show a big genuine happy smile — joyful, cheerful, full of positive energy. NEVER sad, NEVER serious, NEVER neutral, NEVER worried.

Composition rules:
Horizontal landscape layout — wide format 16:9.
Scene large and dominant, cinematic framing, dramatic lighting, high contrast.
Left side reserved for text overlay — clean with only background graphic elements.
Ultra-realistic cinematic quality throughout.

TEXT ELEMENTS — render ONLY these items, nothing else:
Item 1: [ITEM 1] — very large bold orange and white 3D font with fire glow
Item 2: [ITEM 2] — large bold neon green 3D font with gold outline
Item 3: [ITEM 3] — bold white font with red urgent border box
Item 4: [ITEM 4] — bold gold brush style lettering

DO NOT add any other text. DO NOT add subtitles, slogans, scores or signatures.
DO NOT add any URLs or links inside the image.
Do NOT blend faces. Do NOT copy any person identity from any style reference.
Do NOT add glasses or any eyewear.
Final output: Premium Brazilian digital marketing banner — [ITEM 1] as dominant element — [ITEM 4] closing.' WHERE id = '9b6f4231-adb8-4fd9-85ed-d831e690b337';

UPDATE public.image_prompt_templates SET body = '=== VARIÁVEIS ===
ITEM 1: [ITEM 1]
ITEM 2: [ITEM 2]
ITEM 3: [ITEM 3]
ITEM 4: [ITEM 4]
=================

This is a graphic design banner generation task. Do NOT render any prompt text inside the image.
The image must contain ONLY the TEXT ELEMENTS listed below. Nothing else.

Scene concept:
PEPE the green frog holding a glowing lantern under a night sky, big genuine happy smile, alert but cheerful expression, final-session energy.

PEPE''s face must always show a big genuine happy smile — joyful, cheerful, full of positive energy. NEVER sad, NEVER serious, NEVER neutral, NEVER worried.

Composition rules:
Horizontal landscape layout — wide format 16:9.
Scene large and dominant, cinematic framing, dramatic lighting, high contrast.
Left side reserved for text overlay — clean with only background graphic elements.
Ultra-realistic cinematic quality throughout.

TEXT ELEMENTS — render ONLY these items, nothing else:
Item 1: [ITEM 1] — very large bold orange and white 3D font with fire glow
Item 2: [ITEM 2] — large bold neon green 3D font with gold outline
Item 3: [ITEM 3] — bold white font with red urgent border box
Item 4: [ITEM 4] — bold gold brush style lettering

DO NOT add any other text. DO NOT add subtitles, slogans, scores or signatures.
DO NOT add any URLs or links inside the image.
Do NOT blend faces. Do NOT copy any person identity from any style reference.
Do NOT add glasses or any eyewear.
Final output: Premium Brazilian digital marketing banner — [ITEM 1] as dominant element — [ITEM 4] closing.' WHERE id = '34d36ae1-c0a2-4ed5-a92b-478500379228';

UPDATE public.image_prompt_templates SET body = '=== VARIÁVEIS ===
ITEM 1: [ITEM 1]
ITEM 2: [ITEM 2]
ITEM 3: [ITEM 3]
ITEM 4: [ITEM 4]
=================

This is a graphic design banner generation task. Do NOT render any prompt text inside the image.
The image must contain ONLY the TEXT ELEMENTS listed below. Nothing else.

Scene concept:
PEPE the green frog checking a glowing stopwatch before the race, big genuine happy smile, cheerful and joyful expression, morning starting-line light.

PEPE''s face must always show a big genuine happy smile — joyful, cheerful, full of positive energy. NEVER sad, NEVER serious, NEVER neutral, NEVER worried.

Composition rules:
Horizontal landscape layout — wide format 16:9.
Scene large and dominant, cinematic framing, dramatic lighting, high contrast.
Left side reserved for text overlay — clean with only background graphic elements.
Ultra-realistic cinematic quality throughout.

TEXT ELEMENTS — render ONLY these items, nothing else:
Item 1: [ITEM 1] — very large bold orange and white 3D font with fire glow
Item 2: [ITEM 2] — large bold neon green 3D font with gold outline
Item 3: [ITEM 3] — bold white font with red urgent border box
Item 4: [ITEM 4] — bold gold brush style lettering

DO NOT add any other text. DO NOT add subtitles, slogans, scores or signatures.
DO NOT add any URLs or links inside the image.
Do NOT blend faces. Do NOT copy any person identity from any style reference.
Do NOT add glasses or any eyewear.
Final output: Premium Brazilian digital marketing banner — [ITEM 1] as dominant element — [ITEM 4] closing.' WHERE id = '95876599-3fad-4642-b566-b0f00d4cda84';

UPDATE public.image_prompt_templates SET body = '=== VARIÁVEIS ===
ITEM 1: [ITEM 1]
ITEM 2: [ITEM 2]
ITEM 3: [ITEM 3]
ITEM 4: [ITEM 4]
=================

This is a graphic design banner generation task. Do NOT render any prompt text inside the image.
The image must contain ONLY the TEXT ELEMENTS listed below. Nothing else.

Scene concept:
PEPE the green frog crouched at the starting blocks, glancing at a glowing countdown clock, joyful anticipation, big genuine happy smile, morning light.

PEPE''s face must always show a big genuine happy smile — joyful, cheerful, full of positive energy. NEVER sad, NEVER serious, NEVER neutral, NEVER worried.

Composition rules:
Horizontal landscape layout — wide format 16:9.
Scene large and dominant, cinematic framing, dramatic lighting, high contrast.
Left side reserved for text overlay — clean with only background graphic elements.
Ultra-realistic cinematic quality throughout.

TEXT ELEMENTS — render ONLY these items, nothing else:
Item 1: [ITEM 1] — very large bold orange and white 3D font with fire glow
Item 2: [ITEM 2] — large bold neon green 3D font with gold outline
Item 3: [ITEM 3] — bold white font with red urgent border box
Item 4: [ITEM 4] — bold gold brush style lettering

DO NOT add any other text. DO NOT add subtitles, slogans, scores or signatures.
DO NOT add any URLs or links inside the image.
Do NOT blend faces. Do NOT copy any person identity from any style reference.
Do NOT add glasses or any eyewear.
Final output: Premium Brazilian digital marketing banner — [ITEM 1] as dominant element — [ITEM 4] closing.' WHERE id = '7848475b-6947-405d-953d-e9c6f8282c76';

UPDATE public.image_prompt_templates SET body = '=== VARIÁVEIS ===
ITEM 1: [ITEM 1]
ITEM 2: [ITEM 2]
ITEM 3: [ITEM 3]
ITEM 4: [ITEM 4]
=================

This is a graphic design banner generation task. Do NOT render any prompt text inside the image.
The image must contain ONLY the TEXT ELEMENTS listed below. Nothing else.

Scene concept:
PEPE the green frog holding up a glowing stopwatch showing a strong split time, beaming proud smile, big genuine happy expression, warm afternoon light.

PEPE''s face must always show a big genuine happy smile — joyful, cheerful, full of positive energy. NEVER sad, NEVER serious, NEVER neutral, NEVER worried.

Composition rules:
Horizontal landscape layout — wide format 16:9.
Scene large and dominant, cinematic framing, dramatic lighting, high contrast.
Left side reserved for text overlay — clean with only background graphic elements.
Ultra-realistic cinematic quality throughout.

TEXT ELEMENTS — render ONLY these items, nothing else:
Item 1: [ITEM 1] — very large bold orange and white 3D font with fire glow
Item 2: [ITEM 2] — large bold neon green 3D font with gold outline
Item 3: [ITEM 3] — bold white font with red urgent border box
Item 4: [ITEM 4] — bold gold brush style lettering

DO NOT add any other text. DO NOT add subtitles, slogans, scores or signatures.
DO NOT add any URLs or links inside the image.
Do NOT blend faces. Do NOT copy any person identity from any style reference.
Do NOT add glasses or any eyewear.
Final output: Premium Brazilian digital marketing banner — [ITEM 1] as dominant element — [ITEM 4] closing.' WHERE id = 'd88e4da6-6dfc-4645-a03e-953bab16654b';

UPDATE public.image_prompt_templates SET body = '=== VARIÁVEIS ===
ITEM 1: [ITEM 1]
ITEM 2: [ITEM 2]
ITEM 3: [ITEM 3]
ITEM 4: [ITEM 4]
=================

This is a graphic design banner generation task. Do NOT render any prompt text inside the image.
The image must contain ONLY the TEXT ELEMENTS listed below. Nothing else.

Scene concept:
PEPE the green frog stretching before continuing the race, a glowing countdown clock beside him, afternoon anticipation, big genuine happy smile.

PEPE''s face must always show a big genuine happy smile — joyful, cheerful, full of positive energy. NEVER sad, NEVER serious, NEVER neutral, NEVER worried.

Composition rules:
Horizontal landscape layout — wide format 16:9.
Scene large and dominant, cinematic framing, dramatic lighting, high contrast.
Left side reserved for text overlay — clean with only background graphic elements.
Ultra-realistic cinematic quality throughout.

TEXT ELEMENTS — render ONLY these items, nothing else:
Item 1: [ITEM 1] — very large bold orange and white 3D font with fire glow
Item 2: [ITEM 2] — large bold neon green 3D font with gold outline
Item 3: [ITEM 3] — bold white font with red urgent border box
Item 4: [ITEM 4] — bold gold brush style lettering

DO NOT add any other text. DO NOT add subtitles, slogans, scores or signatures.
DO NOT add any URLs or links inside the image.
Do NOT blend faces. Do NOT copy any person identity from any style reference.
Do NOT add glasses or any eyewear.
Final output: Premium Brazilian digital marketing banner — [ITEM 1] as dominant element — [ITEM 4] closing.' WHERE id = '4b313796-d58e-4212-88ec-5df7242fcddc';

UPDATE public.image_prompt_templates SET body = '=== VARIÁVEIS ===
ITEM 1: [ITEM 1]
ITEM 2: [ITEM 2]
ITEM 3: [ITEM 3]
ITEM 4: [ITEM 4]
=================

This is a graphic design banner generation task. Do NOT render any prompt text inside the image.
The image must contain ONLY the TEXT ELEMENTS listed below. Nothing else.

Scene concept:
PEPE the green frog holding a glowing marathon torch under a dusky sky, big genuine happy smile, alert but cheerful expression, final-stretch-of-the-day energy.

PEPE''s face must always show a big genuine happy smile — joyful, cheerful, full of positive energy. NEVER sad, NEVER serious, NEVER neutral, NEVER worried.

Composition rules:
Horizontal landscape layout — wide format 16:9.
Scene large and dominant, cinematic framing, dramatic lighting, high contrast.
Left side reserved for text overlay — clean with only background graphic elements.
Ultra-realistic cinematic quality throughout.

TEXT ELEMENTS — render ONLY these items, nothing else:
Item 1: [ITEM 1] — very large bold orange and white 3D font with fire glow
Item 2: [ITEM 2] — large bold neon green 3D font with gold outline
Item 3: [ITEM 3] — bold white font with red urgent border box
Item 4: [ITEM 4] — bold gold brush style lettering

DO NOT add any other text. DO NOT add subtitles, slogans, scores or signatures.
DO NOT add any URLs or links inside the image.
Do NOT blend faces. Do NOT copy any person identity from any style reference.
Do NOT add glasses or any eyewear.
Final output: Premium Brazilian digital marketing banner — [ITEM 1] as dominant element — [ITEM 4] closing.' WHERE id = '41e52912-c95d-4e23-9224-26a1d1a1167f';

UPDATE public.image_prompt_templates SET body = '=== VARIÁVEIS ===
ITEM 1: [ITEM 1]
ITEM 2: [ITEM 2]
ITEM 3: [ITEM 3]
ITEM 4: [ITEM 4]
=================

This is a graphic design banner generation task. Do NOT render any prompt text inside the image.
The image must contain ONLY the TEXT ELEMENTS listed below. Nothing else.

Scene concept:
PEPE the green frog checking a glowing stopwatch on the final race day, big genuine happy smile, cheerful and joyful expression, Sunday morning light.

PEPE''s face must always show a big genuine happy smile — joyful, cheerful, full of positive energy. NEVER sad, NEVER serious, NEVER neutral, NEVER worried.

Composition rules:
Horizontal landscape layout — wide format 16:9.
Scene large and dominant, cinematic framing, dramatic lighting, high contrast.
Left side reserved for text overlay — clean with only background graphic elements.
Ultra-realistic cinematic quality throughout.

TEXT ELEMENTS — render ONLY these items, nothing else:
Item 1: [ITEM 1] — very large bold orange and white 3D font with fire glow
Item 2: [ITEM 2] — large bold neon green 3D font with gold outline
Item 3: [ITEM 3] — bold white font with red urgent border box
Item 4: [ITEM 4] — bold gold brush style lettering

DO NOT add any other text. DO NOT add subtitles, slogans, scores or signatures.
DO NOT add any URLs or links inside the image.
Do NOT blend faces. Do NOT copy any person identity from any style reference.
Do NOT add glasses or any eyewear.
Final output: Premium Brazilian digital marketing banner — [ITEM 1] as dominant element — [ITEM 4] closing.' WHERE id = '9ed35631-ae04-4afc-8812-616a6a04d6c9';

UPDATE public.image_prompt_templates SET body = '=== VARIÁVEIS ===
ITEM 1: [ITEM 1]
ITEM 2: [ITEM 2]
ITEM 3: [ITEM 3]
ITEM 4: [ITEM 4]
=================

This is a graphic design banner generation task. Do NOT render any prompt text inside the image.
The image must contain ONLY the TEXT ELEMENTS listed below. Nothing else.

Scene concept:
PEPE the green frog crouched at the starting blocks on the final day, glancing at a glowing countdown clock, joyful anticipation, big genuine happy smile.

PEPE''s face must always show a big genuine happy smile — joyful, cheerful, full of positive energy. NEVER sad, NEVER serious, NEVER neutral, NEVER worried.

Composition rules:
Horizontal landscape layout — wide format 16:9.
Scene large and dominant, cinematic framing, dramatic lighting, high contrast.
Left side reserved for text overlay — clean with only background graphic elements.
Ultra-realistic cinematic quality throughout.

TEXT ELEMENTS — render ONLY these items, nothing else:
Item 1: [ITEM 1] — very large bold orange and white 3D font with fire glow
Item 2: [ITEM 2] — large bold neon green 3D font with gold outline
Item 3: [ITEM 3] — bold white font with red urgent border box
Item 4: [ITEM 4] — bold gold brush style lettering

DO NOT add any other text. DO NOT add subtitles, slogans, scores or signatures.
DO NOT add any URLs or links inside the image.
Do NOT blend faces. Do NOT copy any person identity from any style reference.
Do NOT add glasses or any eyewear.
Final output: Premium Brazilian digital marketing banner — [ITEM 1] as dominant element — [ITEM 4] closing.' WHERE id = '79822611-84eb-4f5e-a8cc-b3f53cfa80f5';

UPDATE public.image_prompt_templates SET body = '=== VARIÁVEIS ===
ITEM 1: [ITEM 1]
ITEM 2: [ITEM 2]
ITEM 3: [ITEM 3]
ITEM 4: [ITEM 4]
=================

This is a graphic design banner generation task. Do NOT render any prompt text inside the image.
The image must contain ONLY the TEXT ELEMENTS listed below. Nothing else.

Scene concept:
PEPE the green frog holding up a glowing stopwatch showing a strong final-day split time, beaming proud smile, big genuine happy expression, warm afternoon light.

PEPE''s face must always show a big genuine happy smile — joyful, cheerful, full of positive energy. NEVER sad, NEVER serious, NEVER neutral, NEVER worried.

Composition rules:
Horizontal landscape layout — wide format 16:9.
Scene large and dominant, cinematic framing, dramatic lighting, high contrast.
Left side reserved for text overlay — clean with only background graphic elements.
Ultra-realistic cinematic quality throughout.

TEXT ELEMENTS — render ONLY these items, nothing else:
Item 1: [ITEM 1] — very large bold orange and white 3D font with fire glow
Item 2: [ITEM 2] — large bold neon green 3D font with gold outline
Item 3: [ITEM 3] — bold white font with red urgent border box
Item 4: [ITEM 4] — bold gold brush style lettering

DO NOT add any other text. DO NOT add subtitles, slogans, scores or signatures.
DO NOT add any URLs or links inside the image.
Do NOT blend faces. Do NOT copy any person identity from any style reference.
Do NOT add glasses or any eyewear.
Final output: Premium Brazilian digital marketing banner — [ITEM 1] as dominant element — [ITEM 4] closing.' WHERE id = '7077524a-38f7-44b7-98d1-f147d6a68ab4';

UPDATE public.image_prompt_templates SET body = '=== VARIÁVEIS ===
ITEM 1: [ITEM 1]
ITEM 2: [ITEM 2]
ITEM 3: [ITEM 3]
ITEM 4: [ITEM 4]
=================

This is a graphic design banner generation task. Do NOT render any prompt text inside the image.
The image must contain ONLY the TEXT ELEMENTS listed below. Nothing else.

Scene concept:
PEPE the green frog stretching before the final afternoon stretch, a glowing countdown clock beside him, determined but cheerful anticipation, big genuine happy smile.

PEPE''s face must always show a big genuine happy smile — joyful, cheerful, full of positive energy. NEVER sad, NEVER serious, NEVER neutral, NEVER worried.

Composition rules:
Horizontal landscape layout — wide format 16:9.
Scene large and dominant, cinematic framing, dramatic lighting, high contrast.
Left side reserved for text overlay — clean with only background graphic elements.
Ultra-realistic cinematic quality throughout.

TEXT ELEMENTS — render ONLY these items, nothing else:
Item 1: [ITEM 1] — very large bold orange and white 3D font with fire glow
Item 2: [ITEM 2] — large bold neon green 3D font with gold outline
Item 3: [ITEM 3] — bold white font with red urgent border box
Item 4: [ITEM 4] — bold gold brush style lettering

DO NOT add any other text. DO NOT add subtitles, slogans, scores or signatures.
DO NOT add any URLs or links inside the image.
Do NOT blend faces. Do NOT copy any person identity from any style reference.
Do NOT add glasses or any eyewear.
Final output: Premium Brazilian digital marketing banner — [ITEM 1] as dominant element — [ITEM 4] closing.' WHERE id = 'a4f5be06-e0b5-43b3-954b-50718d9f1f9d';

UPDATE public.image_prompt_templates SET body = '=== VARIÁVEIS ===
ITEM 1: [ITEM 1]
ITEM 2: [ITEM 2]
ITEM 3: [ITEM 3]
ITEM 4: [ITEM 4]
=================

This is a graphic design banner generation task. Do NOT render any prompt text inside the image.
The image must contain ONLY the TEXT ELEMENTS listed below. Nothing else.

Scene concept:
PEPE the green frog holding a glowing marathon torch under the final dusky sky of the weekend, big genuine happy smile, alert but cheerful expression, last-stretch energy.

PEPE''s face must always show a big genuine happy smile — joyful, cheerful, full of positive energy. NEVER sad, NEVER serious, NEVER neutral, NEVER worried.

Composition rules:
Horizontal landscape layout — wide format 16:9.
Scene large and dominant, cinematic framing, dramatic lighting, high contrast.
Left side reserved for text overlay — clean with only background graphic elements.
Ultra-realistic cinematic quality throughout.

TEXT ELEMENTS — render ONLY these items, nothing else:
Item 1: [ITEM 1] — very large bold orange and white 3D font with fire glow
Item 2: [ITEM 2] — large bold neon green 3D font with gold outline
Item 3: [ITEM 3] — bold white font with red urgent border box
Item 4: [ITEM 4] — bold gold brush style lettering

DO NOT add any other text. DO NOT add subtitles, slogans, scores or signatures.
DO NOT add any URLs or links inside the image.
Do NOT blend faces. Do NOT copy any person identity from any style reference.
Do NOT add glasses or any eyewear.
Final output: Premium Brazilian digital marketing banner — [ITEM 1] as dominant element — [ITEM 4] closing.' WHERE id = 'f6977795-5ff4-40ff-a1b5-285490810dcf';

