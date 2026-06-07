

Utilizados para o Front:

-> HTML5: Semântica e estrutura robusta, garantindo suporte aos diversos elementos do ringue e lutadores construídos de forma modular.
-> CSS3 Vanilla: Flexbox, Grid, Variáveis (Custom Properties), Gradientes avançados, Máscaras e Transições. Não há dependências de frameworks CSS pesados.
-> JavaScript (ES6+): Lógica orientada a objetos (classes de lutadores), Promises (para encadear eventos perfeitamente sincronizados), Async/Await e manipulação da API de áudio.

Bibliotecas e APIs Utilizadas:

-> [GSAP (GreenSock Animation Platform)](https://gsap.com/): A principal engine do projeto para orquestrar as animações assíncronas do jogo. O GSAP controla a rotação de braços, movimento de impacto e timelines complexas.
-> Web Audio API: Uma API nativa do JavaScript utilizada no script `sounds.js` para sintetizar todos os efeitos sonoros proceduralmente, manipulando osciladores (sine, sawtooth, square) e filtros para criar batidas de tambor e reações da plateia.
-> {temporário!!!!!!!!!!}  API / IA (Mock): A lógica do "Juiz" que dita se a palavra do jogador vence ou perde a rodada, além de trazer ícones/emojis para representar as palavras digitadas no "rosto" em formato de bloco dos lutadores.

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
