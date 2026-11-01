# Validação — ILHOTA

Conferência em 2026-11-01. Demo: [ILHOTA](https://ilhota-gustapaz.starrylinen.chatgpt.site).

- 23 testes de domínio, API e D1 aprovados; o lote completo soma 215 testes.
- Build de produção, TypeScript e formatação aprovados. CI reproduz os testes no GitHub.
- Smoke HTTP público aprovado: saúde do banco, domínio, rejeição de entrada extra, criação, leitura privada, isolamento, edição, revisão antiga/CAS, publicação, exportação, encerramento do link, remoção do registro de teste, HTML e OpenAPI.
- Navegador público: calcular, guardar, reler, criar link e baixar o arquivo da revisão salva.
- Desktop e larguras de 390 e 768 px verificadas. Com barra de rolagem, as áreas úteis observadas foram 375 e 753 px; nenhuma rolagem horizontal após as correções.
- Câmera por teclado, ponto submerso sem trilha, recuperação por exemplo; controles permanecem após recalcular, gravar e reler; pausa manual.
- Exportação verificada: `ilhota.obj`, 23697 bytes, SHA-256 `711e50b1c88795f78a16e202c4b933e9744a04e574a142c4df6b7e8ae24abe4c`.

## Evidências visuais

![Demo no desktop](screenshots/desktop.jpg)

![Demo no celular](screenshots/mobile.jpg)

## Publicação e limites

Commit da aplicação publicada: `268afe3db43650474ee583fabf2f83509ca1c239`. Commits posteriores que acrescentam estas evidências não alteram o bundle da aplicação.

Dados de demonstração sintéticos, retenção de sete dias, limite global de doze novos registros por hora UTC e até trinta revisões por registro. Edição autorizada por chave aleatória guardada nesta aba; um link público permite leitura. A demo não promete disponibilidade ilimitada nem armazenamento permanente. Nenhum cartão, trial ou faturamento foi ativado.

Não há nota Lighthouse declarada nem certificação de conformidade: as verificações acima descrevem os testes efetivamente executados.
