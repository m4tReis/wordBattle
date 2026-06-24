# 🔌 Contrato de Integração Back-end ↔ Front-end

Este documento mapeia **exatamente** onde e como o front chama a IA do back-end. Hoje as chamadas estão **mockadas**, mas já no formato final — basta o back responder no mesmo contrato e a integração funciona sem mudar mais nada no front.

> **TL;DR:** o front faz **2 chamadas** (`POST /judge` e `POST /scene`), centralizadas num único arquivo: [`js/ai-client.js`](js/ai-client.js). Aponte o front para o back e teste.

---

## 1. Onde está a chamada (o único ponto de integração)

Todo contato com o back acontece no módulo **`AIClient`** ([`js/ai-client.js`](js/ai-client.js)). O resto do jogo **nunca** chama o back direto — só usa:

```js
AIClient.judge({ currentWord, playerWord, round, score, history })  // quem vence a rodada
AIClient.scene({ word, round, history })                            // cenário do fundo p/ a palavra
```

Enquanto `config.useMock = true`, essas funções respondem localmente (via `MockAPI`). Quando o back estiver pronto, é só desligar o mock.

### Como apontar o front para o back

Duas formas (sem precisar mexer no resto do código):

1. **No código** — em [`js/ai-client.js`](js/ai-client.js), `config`:
   ```js
   const config = {
     useMock: false,                       // desliga o mock
     baseUrl: 'http://localhost:3000/api', // sua URL base (sem barra no fim)
     timeoutMs: 8000,
   };
   ```
2. **Pela URL** (prático para testar sem editar código):
   ```
   http://localhost:8123/?api=http://localhost:3000/api   → usa o back nessa URL
   http://localhost:8123/?mock=1                          → força o mock de volta
   ```

> ⚠️ **CORS:** o back precisa liberar a origem do front (`Access-Control-Allow-Origin`) e o método `POST` com `Content-Type: application/json`.

---

## 2. Endpoint `POST {baseUrl}/judge` — quem vence a rodada

Chamado quando o jogador envia a resposta (enquanto os lutadores caminham ao centro).

### Request (o que o front envia)

```json
{
  "currentWord": "fogo",
  "playerWord":  "água",
  "round":       5,
  "score":       4,
  "history":     ["terra", "ar", "terra", "gelo"]
}
```

| Campo         | Tipo       | Descrição                                                        |
|---------------|------------|------------------------------------------------------------------|
| `currentWord` | `string`   | Palavra do oponente (a que o jogador precisa vencer)             |
| `playerWord`  | `string`   | Palavra digitada pelo jogador                                    |
| `round`       | `number`   | Número da rodada atual (começa em 1)                             |
| `score`       | `number`   | Pontos atuais (pode ser usado p/ dificuldade progressiva)        |
| `history`     | `string[]` | Palavras já usadas pelo jogador nesta partida (mais antiga → recente) |

### Response (o que o back deve devolver)

```json
{
  "winner": "player",
  "reason": "\"água\" apaga o \"fogo\" facilmente!",
  "scene":  null
}
```

| Campo    | Tipo                       | Obrigatório | Descrição                                                              |
|----------|----------------------------|:-----------:|------------------------------------------------------------------------|
| `winner` | `"player"` \| `"opponent"` |     sim     | `"player"` = jogador venceu (avança). Qualquer outro valor = derrota (game over). |
| `reason` | `string`                   |     sim     | Frase de "narração" exibida na tela (ex.: por que venceu/perdeu).      |
| `scene`  | `Scene` \| `null`          |    não      | **Opcional.** Se vier, é o cenário da palavra vencedora — economiza um round-trip. Hoje o front **ignora** e busca o cenário pelo `/scene` (veja §4). |

> O front só diferencia **`"player"` (vitória)** de **qualquer-outra-coisa (derrota)**. Mande `"opponent"` para derrota.

---

## 3. Endpoint `POST {baseUrl}/scene` — o cenário do fundo

Chamado para pintar o fundo da arena de acordo com a palavra que está "reinando" (no início da partida e a cada palavra vencedora). O retorno é um objeto **`Scene`** (detalhado na §5).

### Request

```json
{ "word": "fogo", "round": 5, "history": ["terra", "ar", "terra", "gelo"] }
```

| Campo     | Tipo       | Descrição                                  |
|-----------|------------|--------------------------------------------|
| `word`    | `string`   | Palavra para a qual gerar o cenário        |
| `round`   | `number`   | Rodada atual                               |
| `history` | `string[]` | Palavras já usadas (contexto opcional)     |

### Response

Um objeto **`Scene`** (veja §5). Exemplo resumido:

```json
{
  "background": "linear-gradient(180deg, #1c0600 0%, #4a1403 72%, #1a0700 100%)",
  "accent": "#ff5a1e",
  "scenery": [
    { "css": "left:16%; bottom:20%; width:48%; height:30%; background:linear-gradient(180deg,#2a0f08,#120503); clip-path:polygon(50% 0,100% 100%,0 100%);" }
  ],
  "particles": { "emoji": "🔥", "count": 12, "drift": "up", "speed": 1.3, "size": [10, 20] },
  "tint": { "color": "radial-gradient(ellipse at 50% 100%, #ff5a00, #1a0500)", "blend": "soft-light", "opacity": 0.8 },
  "fog":  { "color": "rgba(90,30,8,0.5)", "opacity": 0.4, "speed": 1.4 },
  "flash": null
}
```

---

## 4. Quando cada chamada acontece (sequência no front)

```
Início da partida / botão REVANCHE
   └─> scene({ word: palavraInicial })           → pinta o fundo inicial

Jogador envia resposta
   ├─ (validação local de regras: bloqueio/repetição — NÃO vai ao back)
   ├─> judge({ currentWord, playerWord, ... })    → decide vitória/derrota
   ├─ vitória:
   │     └─> scene({ word: palavraVencedora })    → repinta o fundo p/ a nova palavra
   └─ derrota: game over
```

> **Cache:** o front guarda cada cena no **IndexedDB** ([`js/scene-store.js`](js/scene-store.js)) por palavra (*cache-aside*). Ou seja, `/scene` só é chamado na **primeira** vez que uma palavra aparece; depois é reusado do cache local. Se o back preferir cachear do lado dele depois, dá pra remover esse cache — combinamos.

---

## 5. Schema do `Scene` (o "desenho" do fundo)

O `Scene` descreve **só o fundo** da arena. **Todos os campos são opcionais** e independentes — um campo omitido é **limpo/zerado** pelo front (cada cena descreve o estado completo do fundo). O back tem liberdade total de combinar os campos.

| Campo        | Tipo            | Efeito visual                                                       |
|--------------|-----------------|---------------------------------------------------------------------|
| `background` | `string`        | `background` CSS do céu/fundo (gradiente, cor…)                     |
| `scenery`    | `SceneryItem[]` | Formas CSS posicionadas (montanhas, lua, nuvens…) — **sem imagens** |
| `particles`  | `Particles`     | Partículas à deriva (brasas, neve, bolhas, chuva…)                 |
| `tint`       | `Tint`          | Banho de cor para o "clima" da arena (`mix-blend-mode`)            |
| `fog`        | `Fog`           | Névoa/bruma à deriva                                                |
| `flash`      | `Flash`         | Relâmpagos/pulsos de luz                                            |
| `accent`     | `string`        | Cor-tema (CSS color) lida por elementos do ringue (brilho do chão, holofote) |
| `filter`     | `string`        | `filter` CSS aplicado ao fundo (`hue-rotate`, `blur`…)             |

### Sub-tipos

**`SceneryItem`** — uma forma do cenário:
```ts
{
  css:    string,                  // cssText completo do <div> (position/size/background/clip-path…)
  drift?: { x?: number, y?: number, dur?: number },  // deriva suave em loop (nuvens, bruma)
  pulse?: { to?: number, dur?: number }              // pulso de opacidade (sol, brilho)
}
```
> As formas são `<div>`s absolutos. Use `clip-path`, `linear/radial-gradient`, `border-radius`, `box-shadow` — **nada de `<img>`** (decisão de projeto: manter leve). Coordenadas em `%` funcionam melhor (responsivas). Área visível útil: parte de cima/fundo da arena (o terço inferior fica atrás do ringue).

**`Particles`**:
```ts
{
  count?: number,                       // qtd (ex.: 12)
  emoji?: string,                       // se definido, usa esse emoji (ex.: "🔥"); senão, um ponto colorido
  color?: string,                       // cor do ponto quando não há emoji
  size?:  [min: number, max: number],   // px
  drift?: "up" | "down" | "float",      // direção do movimento
  speed?: number                        // multiplicador de velocidade (1 = padrão)
}
```

**`Tint`**:
```ts
{
  color:    string,    // background CSS (cor ou gradiente)
  blend?:   string,    // CSS mix-blend-mode (padrão "soft-light"): "screen", "overlay"…
  opacity?: number     // 0–1 (padrão 0.6)
}
```

**`Fog`**:
```ts
{
  color:    string,    // ex.: "rgba(190,225,255,0.5)"
  opacity?: number,    // 0–1 (padrão 0.5)
  speed?:   number     // velocidade da deriva (1 = padrão)
}
```

**`Flash`**:
```ts
{
  color?: string,      // cor do flash (padrão "#ffffff")
  every?: number       // intervalo entre flashes em ms (padrão 3500)
}
```

### Exemplo completo — `gelo`

```json
{
  "background": "linear-gradient(180deg, #05131f 0%, #0a2236 50%, #0d2a40 100%)",
  "accent": "#8fe6ff",
  "scenery": [
    { "css": "right:16%; top:9%; width:80px; height:80px; border-radius:50%; background:radial-gradient(circle at 38% 36%, #f2faff, #bcd9ee 70%, #9cc0db); box-shadow:0 0 50px rgba(190,225,255,0.45);" },
    { "css": "left:-4%; bottom:22%; width:66%; height:26%; background:#13344c; clip-path:polygon(0 100%,18% 35%,38% 70%,60% 18%,82% 60%,100% 30%,100% 100%);" }
  ],
  "tint":  { "color": "linear-gradient(180deg, #bfeeff, #0a2233)", "blend": "soft-light", "opacity": 0.55 },
  "fog":   { "color": "rgba(190,225,255,0.5)", "opacity": 0.5, "speed": 0.5 },
  "particles": { "emoji": "❄️", "count": 16, "drift": "down", "speed": 0.7, "size": [8, 16] }
}
```

> 📋 Mais exemplos prontos (fogo, água, pedra, raio, terra, ar) estão no objeto `SCENES` em [`js/mock-api.js`](js/mock-api.js) — pode usá-los como referência/base.

---

## 6. O que o back **não** precisa (nem deve) controlar

O front garante, por arquitetura de camadas (`z-index`), que a IA **só** pinta o fundo (`#ai-stage`). Os elementos "imunes" — **ringue, lutadores e o telão/HUD** — ficam acima e **não** são controlados pelo back. Ou seja, o `Scene` descreve **apenas o cenário/fundo**; não há (nem deve haver) campos para mexer em lutadores, placar ou cordas. (Detalhes em [`README.md`](README.md) → "A camada da IA e os elementos imunes".)

A única exceção é o `accent`: uma **cor** que alguns elementos do ringue leem por conta própria (brilho do chão, holofote central) — o back manda só a cor, nunca a estrutura.

---

## 7. Erros, timeout e fallback

- **Timeout:** o front aborta a requisição após `config.timeoutMs` (8s).
- **Falha no `/scene`:** o front cai para um cenário local (mock) — a partida **nunca trava** por causa do back.
- **Falha no `/judge`:** propaga o erro (a rodada não conclui); recomendado o back sempre responder `200` com um veredito válido. Em caso de erro, devolva status HTTP adequado (4xx/5xx) com corpo `{ "error": "..." }`.
- **Normalização:** o front normaliza a resposta do `/judge` — se `winner` não for exatamente `"player"`, é tratado como derrota; `reason` vazio recebe um texto padrão.

---

## 8. Stub de back-end mínimo (referência)

Exemplo em Node/Express só para ilustrar o contrato (pode usar qualquer stack):

```js
app.post('/api/judge', (req, res) => {
  const { currentWord, playerWord, round, score, history } = req.body;
  // ...sua IA decide...
  res.json({
    winner: 'player',                                  // ou 'opponent'
    reason: `"${playerWord}" vence "${currentWord}"!`,
    // scene: { ... }   // opcional
  });
});

app.post('/api/scene', (req, res) => {
  const { word, round, history } = req.body;
  // ...sua IA monta o cenário (só CSS, sem imagens)...
  res.json({
    background: 'linear-gradient(180deg, #1c0600, #1a0700)',
    accent: '#ff5a1e',
    scenery: [ /* { css, drift?, pulse? } */ ],
    particles: { emoji: '🔥', count: 12, drift: 'up' },
    tint: { color: '...', blend: 'soft-light', opacity: 0.8 },
  });
});
```

---

### Resumo para colar no chat

> A chamada do front pra IA está num único arquivo: **`js/ai-client.js`** (`AIClient.judge` e `AIClient.scene`), hoje mockada mas já no formato final. São **2 endpoints** — `POST /judge` (retorna `{ winner, reason }`) e `POST /scene` (retorna um objeto `Scene` que descreve o **fundo** em CSS). Pra integrar: setar `useMock:false` + `baseUrl` no `ai-client.js`, ou abrir o front com `?api=SUA_URL`. Contrato completo (request/response + schema do `Scene`) está no **`BACKEND.md`**.
