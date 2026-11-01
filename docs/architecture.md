# Arquitetura

Modo integrado, conforme solution-contract.md. uhtml + Three.js consome tRPC + Zod na mesma origem. SSR contém conteúdo, metadados e navegação; o bundle próprio monta depois da hidratação.

Value noise determinístico com queda radial, componentes de terra e A* em quatro vizinhos com custo de declive. Terreno 24×24 e OBJ com 576 vértices e 1058 faces triangulares.

POST /api/trpc/generate, mutation tRPC generate(input); frontend usa cliente nativo httpLink. Sem batches ou chamadas GET.

service.mjs: domínio e exportação. input-schema.mjs: restrições canônicas. validator.mjs: validação da stack. api.mjs: protocolo/router. store.mjs: D1, tokens, CAS, TTL e cotas. transport.mjs: bytes/UTF-8, origem, erros mascarados e cabeçalhos.


A interface uhtml usa um componente reativo com signal e um único render de montagem; slots opcionais mantêm o tipo de array. A cena Three.js só renderiza durante a revelação ou interação da câmera; geometrias e materiais anteriores são descartados.
