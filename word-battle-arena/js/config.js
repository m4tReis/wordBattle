'use strict';
/* ════════════════════════════════════════════════════════════════════════════
   CONFIG.JS — Configuração de AMBIENTE do front (edite SEM mexer no código).

   Carregado ANTES de ai-client.js (veja index.html). Os valores aqui
   sobrescrevem os padrões embutidos do AIClient. É ESTE o arquivo para ajustar
   por ambiente (dev / homolog / produção).

   Ordem de prioridade (vence o primeiro encontrado):
     1. Query string da URL   →  ?api=http://host/api   |  ?mock=1  |  ?mock=0
     2. localStorage          →  AIClient.setBackend('http://host/api') / setMock(true)
     3. Este arquivo          →  window.WBA_CONFIG (abaixo)
     4. Padrão do ai-client.js
   ════════════════════════════════════════════════════════════════════════════ */

window.WBA_CONFIG = {
  // false = chama o back real (baseUrl); true = roda 100% no mock (offline/demo).
  useMock: false,

  // URL base do back-end (sem barra no fim). Os endpoints viram baseUrl + '/judge' e '/scene'.
  //   • Dev local (Spring):           'http://localhost:8081/api'
  //   • Mesmo host/proxy reverso:     window.location.origin + '/api'
  //   • Produção:                     'https://api.seu-dominio.com'
  baseUrl: 'http://localhost:8081/api',

  // timeoutMs: 8000,   // (opcional) tempo máximo de cada requisição
};
