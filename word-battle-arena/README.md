# Word Battle Arena 🥊

Bem-vindo ao **Word Battle Arena**, um jogo web interativo e dinâmico inspirado em dinâmicas de "Pedra, Papel e Tesoura" baseadas em palavras! No jogo, o usuário deve pensar em uma palavra que vença a palavra apresentada pelo adversário. A cada vitória, o lutador avança para a próxima rodada, acumulando pontos e esquentando a batalha no ringue.

---

## 🚀 Destaques do Projeto

*   **Tema de Boxe Envolvente:** O jogo se passa em um ringue virtual, onde cada palavra é representada por um lutador. A mecânica de embate inclui caminhadas tensas, encaradas, ganchos cruzados, reações a danos e nocautes (K.O) animados e responsivos!
*   **Animações Fluidas:** Graças ao poder do GSAP e da manipulação de CSS no DOM, os personagens possuem animações complexas: como o "balanço" (bob) clássico de um lutador, movimentação articulada dos braços para desferir golpes e comemorações com os braços em "V".
*   **Design Premium:** Estética moderna, vibrante e focada em neon, com feedback visual contínuo (sombras dinâmicas, explosão de partículas no impacto, flashes de luz e tipografia imersiva).
*   **Áudio Procedural:** Sons imersivos gerados puramente via código pelo navegador (sem arquivos pesados `.mp3`!), incluindo cliques de botões, tambores de tensão antes do impacto, barulho de soco, vibração da multidão e fanfarras de vitória.

---

## 🛠️ Tecnologias e Ferramentas

Este projeto tem o front-end como seu maior foco, desenhado do zero e moldado inteiramente com tecnologias web modernas.

*   **HTML5:** Semântica e estrutura robusta, garantindo suporte aos diversos elementos do ringue e lutadores construídos de forma modular.
*   **CSS3 Vanilla:** Flexbox, Grid, Variáveis (Custom Properties), Gradientes avançados, Máscaras e Transições. Não há dependências de frameworks CSS pesados.
*   **JavaScript (ES6+):** Lógica orientada a objetos (classes de lutadores), Promises (para encadear eventos perfeitamente sincronizados), Async/Await e manipulação da API de áudio.

### Bibliotecas e APIs Utilizadas

*   **[GSAP (GreenSock Animation Platform)](https://gsap.com/):** A principal engine do projeto para orquestrar as animações assíncronas do jogo. O GSAP controla a rotação de braços, movimento de impacto e timelines complexas.
*   **Web Audio API:** Uma API nativa do JavaScript utilizada no script `sounds.js` para sintetizar todos os efeitos sonoros proceduralmente, manipulando osciladores (sine, sawtooth, square) e filtros para criar batidas de tambor e reações da plateia.
*   **API / IA (Mock):** A lógica do "Juiz" que dita se a palavra do jogador vence ou perde a rodada, além de trazer ícones/emojis para representar as palavras digitadas no "rosto" em formato de bloco dos lutadores.

---

## 🎮 Como Jogar

1.  Oponente revela sua palavra inicial no ringue.
2.  Você deve usar a sua criatividade e digitar uma palavra que **derrote** a palavra do seu adversário no campo inferior.
3.  As palavras são processadas enquanto os lutadores caminham em direção ao centro do ringue ao som de tambores de guerra.
4.  O embate ocorre! O vencedor defere um forte gancho e envia o perdedor para longe.
5.  Sobreviva o máximo de rodadas possíveis sem ser nocauteado para registrar a sua maior sequência (Streak)!

---

## 📁 Estrutura de Diretórios

```text
/
├── assets/                 # Imagens como background e ícones das palavras geradas
├── css/                    # Arquivos modulares de estilo
│   ├── base.css            # Variáveis neon, resets e fontes
│   ├── fighters.css        # Construção dos bonecos (cabeça, torso, braços)
│   ├── ring.css            # Background, cordas, ringue e iluminação
│   └── ui.css              # HUD, inputs, tela de Game Over e histórico
├── js/                     # Lógica principal da aplicação
│   ├── api.js              # Mock da API da IA que avalia as palavras
│   ├── fighters.js         # Classe controladora das animações e física dos lutadores
│   ├── game.js             # State Machine principal que orquestra os eventos
│   └── sounds.js           # Sintetizador de áudio Web Audio API
└── index.html              # O ponto de entrada que renderiza o palco da luta
```
