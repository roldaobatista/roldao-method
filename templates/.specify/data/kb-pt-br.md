---
tipo: knowledge-base
id: KB-PT-BR
versao: 1
status: stable
owner: framework
revisado-em: 2026-05-18
---

# KB — Glossário PT-BR e tradução de jargão

> Memória compartilhada de termos que o agente deve usar com **usuário não-técnico** (dono de produto que não programa). Complementa a skill `traduzir-jargao`.

## Tabela de tradução padrão

| Jargão técnico | Tradução acessível |
|---|---|
| commit / push | "salvei a correção no sistema" |
| pull / merge | "trouxe a mudança pro código principal" |
| branch | "linha paralela de trabalho" |
| rebase | "reorganizar histórico (sem perder código)" |
| CI / pipeline | "verificação automática que roda quando salvamos" |
| CI verde / testes passando | "está funcionando, validei" |
| CI vermelho / tests failing | "tem erro, vou investigar" |
| build red | "compilação quebrou" |
| rollback / revert | "voltar pra versão anterior" |
| deploy em produção | "subir pro servidor que o cliente usa" |
| staging / homologação | "ambiente de teste antes de virar oficial" |
| hotfix | "correção urgente direto em produção" |
| feature flag | "interruptor pra ligar/desligar a funcionalidade sem nova versão" |
| migration | "mudança na estrutura dos dados salvos" |
| schema | "estrutura/formato dos dados" |
| seed / fixture / mock | "dados falsos pros testes" |
| E2E test | "robô que simula o usuário ponta a ponta" |
| integration test | "teste de várias partes juntas" |
| unit test | "teste de uma função sozinha" |
| refactor | "reorganizar essa parte (sem mudar o que aparece pro usuário)" |
| endpoint | "ponto de entrada da API" |
| API | "interface pra outros sistemas conversarem com o nosso" |
| webhook | "aviso automático quando algo acontece em outro sistema" |
| race condition | "duas coisas tentando mexer no mesmo dado ao mesmo tempo" |
| deadlock | "dois processos se travaram esperando um pelo outro" |
| memory leak | "memória que o programa pega e nunca devolve" |
| stack trace | "rastro do erro pra entender onde quebrou" |
| breakpoint | "pausa que coloco no código pra ver o que está acontecendo" |
| log | "diário do que o sistema fez" |
| query | "pergunta feita ao banco de dados" |
| index | "atalho pro banco encontrar dado mais rápido" |
| cache | "memória curta pra não buscar de novo o mesmo dado" |
| TTL | "tempo de validade" |
| OAuth / SSO | "login único entre sistemas" |
| token / JWT | "crachá de autenticação" |
| 2FA / MFA | "código extra de segurança (SMS, app, biometria)" |
| dependency / lib | "biblioteca que o sistema usa pra não reinventar a roda" |
| breaking change | "mudança que quebra quem usava o jeito antigo" |
| backward compatible | "ainda funciona com o jeito antigo" |
| boilerplate | "código repetitivo que é só esqueleto" |
| linter / lint | "verificador de estilo do código" |
| type check | "verificação se os tipos batem" |
| race | "competição entre dois processos" |

## Termos do negócio BR (NÃO traduzir — usar como está)

Esses são termos do dia a dia BR que o usuário não-técnico **conhece e usa**. Manter o termo, explicar contexto se necessário:

| Termo | Significado |
|---|---|
| Pix | Sistema de pagamento instantâneo do Banco Central |
| NF-e | Nota Fiscal eletrônica modelo 55 |
| NFS-e | Nota Fiscal de Serviço eletrônica (municipal) |
| NFC-e | Nota Fiscal de Consumidor eletrônica modelo 65 |
| SEFAZ | Secretaria da Fazenda (de cada estado) |
| CNPJ alfanumérico | A partir de jul/2026, CNPJ aceita letras |
| CPF | Cadastro de Pessoa Física |
| Receita Federal | Órgão federal de tributos |
| LGPD | Lei Geral de Proteção de Dados |
| ANPD | Autoridade Nacional de Proteção de Dados |
| Bacen / BCB | Banco Central |
| eSocial | Sistema unificado de obrigações trabalhistas |
| SPED | Sistema Público de Escrituração Digital |
| ICMS / PIS / COFINS / ISS | Impostos brasileiros |
| Reforma Tributária | Transição 2026-2033: CBS/IBS substituem PIS/COFINS/ICMS/ISS |
| DPO | Encarregado de Dados (LGPD Art. 41) |
| RIPD | Relatório de Impacto à Proteção de Dados |
| CTe / MDFe | Conhecimento de Transporte / Manifesto de Documentos Fiscais |

## Princípios de comunicação

1. **Diga o efeito visível, não a causa técnica.** Ex: "a tela do financeiro não carrega" em vez de "endpoint /api/finance retorna 500".
2. **Diga o que mudou na prática.** Ex: "agora o cliente vê o nome dele no recibo" em vez de "adicionado campo `customer_name` ao response".
3. **Não use sigla sem explicar na primeira ocorrência.** Mesmo siglas comuns como API, CI.
4. **Frases curtas.** Se a frase passa de 25 palavras, quebrar.
5. **Evite anglicismo desnecessário.** "Endpoint" → "ponto de entrada". "Bug" → "erro" (mas "bug" é tolerado, pt-BR adotou).
6. **Não invente verbos.** "Deletar" sim, "remover" melhor; "deployar" → "subir"; "mockar" → "fingir/usar dados falsos".

## Quando NÃO traduzir

- Código, comentários no código, mensagens de commit — pode ser em PT-BR mas termos como `commit`, `branch` são padrão da ferramenta.
- Documentação técnica para devs (README de biblioteca, runbook ops) — público é técnico, jargão é OK.
- Mensagens de erro de sistema operacional ou ferramenta — copiar literal pra usuário poder buscar.
