# Word Battle Arena 🥊

Bem-vindo ao **Word Battle Arena**, um jogo web interativo e dinâmico inspirado em dinâmicas de "Pedra, Papel e Tesoura" baseadas em palavras! No jogo, o usuário deve pensar em uma palavra que vença a palavra apresentada pelo adversário. A cada vitória, o lutador avança para a próxima rodada, acumulando pontos e esquentando a batalha no ringue.

> A proposta de longo prazo é que uma **IA** avalie o que "vence" a palavra e **modifique o cenário** da página de acordo. Por isso o front já foi arquitetado em torno dessa ideia (veja [A camada da IA](#-a-camada-da-ia-e-os-elementos-imunes)).

---

## 🚀 Destaques do Projeto

*   **Tema de Boxe Envolvente:** ringue virtual onde cada palavra é um lutador. Caminhadas tensas, encaradas, ganchos cruzados, reações a dano e nocautes (K.O) animados.
*   **Cenário dinâmico controlado pela "IA":** o fundo não é uma imagem estática — é um **cenário desenhado 100% em CSS** (vulcão, picos nevados, fundo do mar, tempestade…) que muda conforme a palavra em jogo. Veja [a camada da IA](#-a-camada-da-ia-e-os-elementos-imunes).
*   **Regras de entrada:** bloqueio de palavrões/termos proibidos, proibição de repetir palavras e de copiar a palavra do oponente. Veja [Regras de palavras](#-regras-de-palavras-e-lista-de-proibidas).
*   **Persistência NoSQL no front:** cada cena gerada pela IA é salva como documento no **IndexedDB** (cache-aside), sobrevivendo a recarregamentos. Veja [Persistência](#-persistência-nosql).
*   **Animações Fluidas (GSAP):** balanço (bob) de lutador, braços articulados, comemorações.
*   **Áudio Procedural:** sons gerados via código (Web Audio API), sem arquivos `.mp3`.

---

## 🎮 Como Jogar

1.  O oponente revela sua palavra inicial no ringue.
2.  Digite uma palavra que **derrote** a do adversário no campo inferior.
3.  As palavras são avaliadas enquanto os lutadores caminham ao centro ao som de tambores.
4.  O embate ocorre — o vencedor aplica um gancho e nocauteia o perdedor.
5.  Sobreviva o máximo de rodadas sem ser nocauteado para registrar sua maior sequência (streak)!

---

## 🚫 Regras de palavras e lista de proibidas

A validação da palavra digitada acontece **antes** de começar a luta (em [`js/word-rules.js`](js/word-rules.js)). Três regras são aplicadas:

1.  **Lista de proibidas** — palavrões e termos vetados.
2.  **Sem copiar o oponente** — não vale digitar a palavra atual do adversário.
3.  **Sem repetições** — não vale reutilizar uma palavra já usada na sequência.

> ### 📍 Onde fica a lista de palavras não permitidas
> No arquivo **[`js/word-rules.js`](js/word-rules.js)**, na constante **`DISALLOWED_WORDS`** (logo no topo do módulo). Basta editar esse array para adicionar ou remover palavras — a comparação **ignora acentos e maiúsculas/minúsculas**, então uma única entrada (`porra`) cobre `Porra`, `PÔRRA`, etc.

A verificação é feita por `WordRules.check(palavra, { current, used })`, chamada em `game.js` no envio. Se a palavra for inválida, um aviso amarelo aparece e o turno **não** é consumido.

---

## 🤖 A camada da IA e os elementos imunes

Toda mudança visual que a IA faz acontece em **uma única camada**, a `#ai-stage`, que fica no **fundo** da pilha de `z-index`. Os elementos "imunes" (ringue, lutadores e o telão/HUD) ficam em camadas **acima** — então a IA **nunca** consegue sobrepô-los ou quebrá-los, mesmo que tente.

```
z-index ↑      150  Partículas de impacto
               100  HUD / Telão            ← IMUNE
                30  Overlays (VS, K.O.)
                12  Cordas/postes da frente ← IMUNE
                10  Lutadores               ← IMUNE
                 5  Ringue (lona, cordas)   ← IMUNE
                 2  Holofotes / atmosfera
z-index ↓        1  ► #ai-stage ◄  (ÚNICA camada editável pela IA)
```

A IA nunca toca no DOM diretamente: ela fala apenas com o módulo **`Stage`** ([`js/stage.js`](js/stage.js)), que pinta um objeto `Scene` dentro de `#ai-stage`. Um `Scene` pode conter:

| Campo        | Efeito                                                            |
|--------------|-------------------------------------------------------------------|
| `background` | gradiente/céu do fundo                                            |
| `scenery`    | formas CSS posicionadas (montanhas, lua, nuvens…) — sem imagens   |
| `particles`  | partículas à deriva (brasas, neve, bolhas…)                       |
| `tint`       | banho de cor para o clima da arena (`mix-blend-mode`)             |
| `fog`        | névoa/bruma                                                       |
| `flash`      | relâmpagos/pulsos de luz                                          |
| `accent`     | cor-tema lida **opcionalmente** por elementos imunes (brilho do chão, holofote) |

O "cérebro" que decide a cena hoje é um **mock** em [`js/mock-api.js`](js/mock-api.js) (`MockAPI.generateScene`, objeto `SCENES`). Para plugar uma IA real, basta trocar essa função — o resto do pipeline não muda.

---

## 💾 Persistência NoSQL

As cenas geradas são guardadas como **documentos** no **IndexedDB** (o banco NoSQL nativo do navegador), em [`js/scene-store.js`](js/scene-store.js). O fluxo é *cache-aside*: ao precisar da cena de uma palavra, primeiro lê do `SceneStore`; se não existir, gera (IA/mock) e grava. A API (`put`, `getLatest`, `history`, `all`, `clear`) foi desenhada com o mesmo formato de um SDK NoSQL remoto (Firestore/Mongo) — para migrar ao backend, troca-se apenas o *driver*.

---

## 🛠️ Tecnologias e Ferramentas

*   **HTML5** — estrutura modular do ringue e dos lutadores.
*   **CSS3 Vanilla** — Flexbox, Custom Properties (tokens de camada e `--ai-accent`), gradientes, `clip-path` (cenários e ringue em perspectiva), `mix-blend-mode`, transições.
*   **JavaScript (ES6+)** — módulos em IIFE, classes, Promises/Async-Await.
*   **[GSAP](https://gsap.com/)** — engine de animação (lutadores, partículas, fades de cena).
*   **Web Audio API** — efeitos sonoros sintetizados em [`js/sounds.js`](js/sounds.js).
*   **IndexedDB** — persistência NoSQL das cenas.

---

## ▶️ Como rodar

É um site **100% estático** — basta servir a pasta por qualquer servidor HTTP e abrir o `index.html`. Exemplos:

```bash
# Python
python -m http.server 8123

# Node
npx serve .
```

Depois acesse `http://localhost:8123`. (Abrir o arquivo via `file://` também funciona na maior parte, mas um servidor evita restrições de CORS do IndexedDB/imagens.)

---

## 📁 Estrutura de Diretórios

```text
word-battle-arena/
├── assets/images/          # background.jpg + ícones das palavras (pedra, fogo, água…)
├── css/
│   ├── main.css            # tokens (camadas z-index, --ai-accent), HUD/telão, input, game over
│   ├── ring.css            # ringue em perspectiva (lona, cordas, postes) + camadas do #ai-stage
│   ├── fighters.css        # construção dos lutadores (cabeça, torso, braços)
│   └── animations.css      # keyframes e efeitos de partícula
├── js/
│   ├── sounds.js           # síntese de áudio (Web Audio API)
│   ├── mock-api.js         # stand-in da IA: juiz, mídia das palavras e geração de cenas (SCENES)
│   ├── word-rules.js       # validação de entrada + DISALLOWED_WORDS (lista de proibidas)  ⟵
│   ├── stage.js            # renderizador do fundo controlado pela IA (única camada editável)
│   ├── scene-store.js      # persistência NoSQL (IndexedDB) das cenas
│   ├── fighters.js         # classe Fighter: animações GSAP e partículas
│   ├── game.js             # máquina de estados / fluxo das rodadas / regras
│   └── main.js             # boot e tela de introdução
└── index.html              # ponto de entrada que renderiza o palco da luta
```
