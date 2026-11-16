# Funcionalidade: Reels automático do "Achado do Dia"

## Contexto
Tenho uma loja física de outlet de produtos de logística reversa em Sorocaba-SP. Quero que, ao marcar um produto no sistema, seja gerado automaticamente um Reels vertical (9:16, 10–15 s) com narração, que eu reviso, aprovo e publico no Instagram.

Stack do projeto: Next.js (Vercel) + Supabase (banco, storage, edge functions).

**Antes de escrever código:** analise a estrutura do projeto (tabela de produtos, padrão de rotas, componentes, autenticação) e me apresente um plano curto, com os arquivos que vai criar ou alterar. Espere minha aprovação. Implemente **uma fase por vez** e pare no fim de cada fase para eu testar.

---

## Regras gerais (valem para tudo)
- **Tudo em português do Brasil, sem termos em inglês**: textos do vídeo, narração, legenda, hashtags, rótulos da interface. Nada de "sale", "off", "new", "outlet", "return". Use "promoção", "desconto", "devolução".
- Nunca publicar sem aprovação humana. Fluxo: gerar → prévia → aprovar → publicar.
- Chaves de API só no servidor (variáveis de ambiente), nunca no cliente.
- Ser idempotente: clicar duas vezes em "Gerar" não pode criar dois trabalhos em andamento para o mesmo produto.

---

## Fase 1: Banco e cadastro

### Campos novos na tabela de produtos
| campo | tipo | padrão | uso |
|---|---|---|---|
| foto_url | text | — | foto do produto (provavelmente já existe; reutilize) |
| vantagens | text[] | '{}' | 2 ou 3 benefícios curtos, ex.: "pipoca em 3 min", "sem óleo" |
| preco_internet | numeric | null | preço de referência na internet |
| preco_loja | numeric | — | nosso preço |
| remover_fundo | boolean | false | recortar o produto da foto |
| unidade_unica | boolean | false | só existe 1 unidade |
| cta | text[] | '{venha_loja}' | valores: comenta_eu_quero, whatsapp, catalogo_bio, venha_loja |

### Tabela nova `reels_trabalhos`
- id, produto_id (fk), status (`pendente`, `gerando`, `pronto`, `aprovado`, `publicado`, `erro`)
- abertura (text), estilo_foto (`recorte` | `cartao`)
- roteiro_narracao (text), legenda (text), hashtags (text[])
- audio_url, video_url, capa_url
- instagram_media_id, instagram_link
- erro (text), criado_em, atualizado_em

### Tabela `config_loja` (registro único)
whatsapp, endereco, horario, link_bio, instagram_usuario, voz_id (padrão `1oZawzZ4adgYtgm1oMqN`, voz "Will – Varejo" do ElevenLabs)

### Interface
- No cadastro/edição do produto: os checkboxes "Remover fundo", "Unidade única" e o grupo "Chamada para ação" (Comenta EU QUERO / Chama no WhatsApp / Catálogo na bio / Venha à loja). Se marcar mais de 2 chamadas, avisar que só as 2 primeiras vão para o vídeo e as outras ficam só na legenda.
- Botão **"Gerar Reels"** na lista/ficha do produto, que cria um registro `pendente`.
- Tela **"Reels"**: lista de trabalhos com status, prévia do vídeo, legenda editável e os botões "Gerar outra abertura", "Aprovar" e "Publicar".
- Tela de configurações da loja.

---

## Fase 2: Geração (roteiro + narração + vídeo)

### 2.1 Roteiro (Claude API, servidor)
Entrada: dados do produto + parâmetros + abertura sorteada. Saída em JSON:
```json
{ "abertura_fala": "...", "corpo_fala": "...", "fechamento_fala": "...",
  "textos_tela": { "abertura": "...", "vantagens": ["...","..."], "chamada": ["...","..."] },
  "legenda": "...", "hashtags": ["#achadosorocaba", "..."] }
```
Instruções para o modelo: português do Brasil, linguagem de vendedor de loja, animado sem exagero, **sem palavras em inglês**, narração total de **25 a 35 palavras** (no máximo 12 s), preços falados por extenso ("vinte e oito reais"), e a frase de abertura nunca igual às dos últimos 10 trabalhos (passe as anteriores como contexto). Se `preco_internet` existir, usar "Na internet, X. Aqui na loja: Y". Não citar marcas de concorrentes (diga "na internet", nunca "no Mercado Livre").

### 2.2 Aberturas (sorteio)
Não repetir nenhuma das últimas 3 usadas. "urgencia" só entra se `unidade_unica = true`. "preco_primeiro" tem peso maior quando o desconto é ≥ 25%.
| chave | animação nos primeiros 2–3 s |
|---|---|
| caixa_misteriosa | caixa de papelão com etiqueta "DEVOLUÇÃO" treme e abre |
| pergunta | pergunta em texto grande com "?" pulsando |
| preco_primeiro | número gigante cai na tela |
| contagem | 3… 2… 1… e o produto explode na tela |
| problema_solucao | tela acinzentada com o problema, que depois ganha cor |
| raspadinha | produto escondido, revelado por "raspagem" |
| urgencia | faixa piscando "SÓ 1 UNIDADE" |
| detalhe | começa num detalhe da foto e abre o enquadramento |

### 2.3 Narração (ElevenLabs API)
- Endpoint de texto para fala **com marcação de tempo** (timestamps por caractere/palavra), modelo `eleven_multilingual_v2` ou superior, voz de `config_loja.voz_id`.
- Salvar o mp3 no Supabase Storage e guardar os tempos de cada frase: eles comandam a entrada de cada cena no vídeo.

### 2.4 Foto
- `remover_fundo = true`: recortar o produto (biblioteca ou serviço de remoção de fundo; me sugira opções com custo) e usar o estilo **recorte**.
- `remover_fundo = false`: estilo **cartão** (foto inteira num card branco com cantos arredondados e sombra), **sem recortar**.

### 2.5 Vídeo (Remotion)
- Composição 1080×1920, 30 fps, duração = narração + 1,5 s.
- Identidade fixa: fundo amarelo `#FFC928` com raios girando devagar, faixa preta no topo com "ACHADO DO DIA" em amarelo, fonte Poppins Bold, vermelho `#DC1E1E`, preto `#141414`.
- Sequência sincronizada com os tempos da narração:
  1. Abertura escolhida
  2. Produto entra com efeito de mola + nome do produto no topo
  3. Vantagens em selos (pílulas preta e vermelha) entrando pelos lados
  4. "Na internet: R$ X" com risco vermelho animado (se houver preço da internet)
  5. Carimbo vermelho "AQUI R$ Y" caindo e tremendo
  6. Cartão final com as até 2 chamadas para ação (balão de comentário / ícone de WhatsApp + número / seta "link da bio" / endereço + horário) e o selo "SÓ 1 UNIDADE" se aplicável
- Render fora da Vercel (limite de tempo): Remotion Lambda **ou** um worker simples (Node + Remotion, ex.: Railway/Render) que lê `reels_trabalhos` com status `pendente`. Me apresente as duas opções com custo estimado antes de escolher.
- Saída: H.264 + AAC, mp4, até 15 s. Também gerar a imagem de capa (quadro do carimbo de preço). Subir os dois no Storage em URL pública e marcar `pronto`.

### 2.6 "Gerar outra abertura"
Gera de novo só a abertura (nova fala + novo áudio da abertura) e renderiza de novo, mantendo o restante.

---

## Fase 3: Publicação no Instagram
- API oficial do Instagram (Graph API) com conta profissional. Fluxo: criar o container com `media_type=REELS`, `video_url` público, `caption` e `cover_url` → consultar `status_code` até `FINISHED` → `media_publish`.
- Guardar `instagram_media_id` e o link do post, e marcar `publicado`.
- Respeitar o limite de publicações da conta (consultar `content_publishing_limit`).
- Me passe o passo a passo para criar o app na Meta, as permissões e o token de longa duração.

## Fase 4 (depois): resposta automática ao "EU QUERO"
Webhook de comentários: quando alguém comentar "eu quero" num Reels gerado pelo sistema, responder no privado com preço, endereço e WhatsApp. Só planejar; não implementar agora.

---

## Variáveis de ambiente esperadas
`ANTHROPIC_API_KEY`, `ELEVENLABS_API_KEY`, `META_APP_ID`, `META_APP_SECRET`, `INSTAGRAM_ACCESS_TOKEN`, `INSTAGRAM_USER_ID`, mais as do Supabase já existentes e as do render escolhido.

## Critérios de pronto (Fase 2)
- Marcar um produto de teste e receber o vídeo `pronto` em menos de 3 minutos.
- 3 gerações seguidas do mesmo produto com aberturas e frases diferentes.
- Nenhuma palavra em inglês no vídeo, na narração ou na legenda.
- Produto com `remover_fundo = false` aparece inteiro no cartão, sem recorte.
