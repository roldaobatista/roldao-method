---
owner: roldao
revisado-em: 2026-05-27
status: stable
idioma: pt-BR
limite-linhas: 400
proposito: traduzir jargão técnico do método para linguagem de negócio acessível a donos não-técnicos
---

# Glossário Roldão — jargão técnico em linguagem de dono

Este glossário é **diferente** de outros dois que você vai encontrar nos projetos derivados deste método:

- **`docs/glossario.md`** (no projeto destino) — termos do **produto/negócio** daquele projeto (ex.: "fechamento mensal", "cliente final", "agendamento").
- **Glossário do MÉTODO** (§1.5 do `ESTRUTURA-PROJETO-NOVO-DO-ZERO.md`) — definições formais que o agente IA usa para aplicar o ritual (Foundation, Fase, Marco, PASS ZERO, WORM, STRIDE, C4).

Aqui o objetivo é diferente: **traduzir** os termos técnicos que aparecem nas conversas com o agente para algo que faça sentido pra quem não programa. Quando você ouvir um termo desta lista e não souber o que é, volte aqui antes de aprovar qualquer coisa.

## Tabela canônica — método e fluxo de trabalho

| Termo técnico | O que significa pro negócio | Quando você vai ouvir |
|---|---|---|
| **Stack** | A "caixa de ferramentas" que o sistema usa por dentro (linguagem, banco, framework). Você não escolhe, o agente escolhe — mas a decisão é registrada em ADR. | "Vou usar a stack X" / "ADR da stack" no começo do projeto. |
| **Commit** | Pacote de mudança salvo no histórico do sistema. Como salvar um ponto no jogo: dá pra voltar depois. | "Fiz o commit da correção" / "esse commit quebrou o build". |
| **Branch** | Linha paralela de trabalho. O agente experimenta numa branch sem mexer no que está rodando pro cliente. | "Estou numa branch de teste" / "vou voltar pra branch principal". |
| **PR / Pull Request** | Pedido formal pra juntar o trabalho de uma branch na linha principal. É onde se faz a revisão antes de oficializar. | "Abri o PR" / "esse PR precisa de aprovação". |
| **Push** | Mandar o que está salvo no seu computador pro servidor central (GitHub). | "Vou dar push" / "o push falhou". |
| **Fast-forward** | Push "limpo" — só adiciona commits na ponta, sem reescrever histórico. Seguro. | "Push fast-forward é OK sem perguntar". |
| **Revert (git revert)** | Forma SEGURA de desfazer um commit já publicado: cria um commit novo que faz o oposto, preservando o histórico. **Sempre preferir a `git reset --hard` em código que já saiu pro servidor.** | "Vou reverter esse commit com `git revert`" / "preferir revert a reset em remoto". |
| **Reset --hard** | Forma PERIGOSA de desfazer commits localmente: apaga histórico. **Proibido em `main` ou em ref remota** (`origin/*`). Em branch própria local, exige `.claude/.override-reason`. | "Cuidado: `git reset --hard` em remoto é destrutivo". |
| **Force-with-lease** | Versão mais segura de force-push: só sobrescreve remoto se ninguém mais subiu mudanças no meio. **Permitido em branch própria; proibido em `main`/`master`/`release/*` sem `.override-reason`.** | "Posso usar `--force-with-lease` na minha feature, mas nunca em main sem ledger". |
| **Deploy** | Subir o sistema novo pro servidor que o cliente usa. É o que faz a mudança chegar "pra valer". | "Fizemos deploy ontem" / "deploy em produção falhou". |
| **Build** | Etapa que transforma o código que o programador escreve em algo que o computador roda. Se falha, nada anda. | "O build quebrou" / "build verde, posso seguir". |
| **Lint** | Robô que lê o código e aponta vícios de estilo e erros simples antes mesmo de rodar. | "O lint reclamou" / "vou corrigir o lint". |
| **Type-check** | Verificação de tipos de dado (impede passar texto onde se espera número, etc.). Pega bug bobo cedo. | "Type-check falhou" / "esse erro é de type-check". |
| **Migration** | Mudança na estrutura dos dados salvos (criar tabela nova, adicionar coluna). Cuidado: algumas são irreversíveis. | "Vou rodar a migration" / "essa migration é destrutiva". |
| **Schema** | A "planta" dos dados — quais campos existem, de que tipo, quais são obrigatórios. | "Schema do cliente mudou" / "validar contra o schema". |
| **Endpoint** | Endereço específico do sistema que aceita uma operação (ex.: `/clientes` lista clientes). | "Esse endpoint está lento" / "vou criar endpoint novo". |
| **Payload** | Conteúdo dos dados que viajam entre partes do sistema (ex.: o que vai e volta numa requisição). | "O payload está errado" / "olhei o payload no log". |
| **IPC** | Comunicação interna entre processos do sistema (ex.: o que aparece na tela conversando com o que salva no banco). Comum em apps desktop tipo Electron. | "Erro no IPC" / "handler IPC do financeiro". |
| **Regex** | Receita de busca em texto (ex.: "qualquer palavra que comece com letra maiúscula e tenha 3 dígitos no fim"). Poderoso e confuso. | "Regex pra validar CPF" / "regex quebrou". |
| **Refactor** | Reorganizar o código por dentro **sem mudar o que o usuário vê**. Pra melhorar manutenção. | "Vou refatorar essa parte" / "refactor não muda comportamento". |
| **Harness** | O ambiente onde o agente IA roda (Claude Code, Cursor, Windsurf, etc.). Cada um tem suas regras de hook e memória. | "Esse hook só funciona no harness X". |
| **ADR** | Decisão técnica importante registrada por escrito, com motivo e alternativas. Pra ninguém esquecer por que escolhemos X e não Y. | "Tem ADR pra isso?" / "preciso promover a ADR-007". |
| **Spec** | Documento que descreve **o que** o sistema faz (não como). É a base do acordo entre você e o agente sobre o que vai ser construído. | "Spec aprovada" / "isso está fora da spec". |
| **BMC (Business Model Canvas)** | "Canvas de Modelo de Negócio" — um quadro de 1 página que resume como o produto ganha dinheiro: quem paga, por quê, quanto custa entregar, por quais canais. Preenchido com você na descoberta (C1). | "Vamos fechar o BMC" / "o BMC ainda não tem canal de venda definido". |
| **VPC (Value Proposition Canvas)** | "Canvas de Proposta de Valor" — quadro que casa a dor do cliente com o que o produto alivia. Detalha o "porquê alguém usaria isto". Também preenchido na descoberta (C1), logo após o BMC. | "O VPC mostra que a dor principal é X" / "revisar o VPC com o cliente". |
| **AC (Acceptance Criterion)** | Critério de aceitação. Uma frase verificável que diz "está pronto quando isto acontece". Cada user story tem vários AC. | "AC-3 ainda não passa" / "esse AC está vago demais". |
| **Invariante** | Regra que **nunca** pode ser violada no sistema (ex.: "saldo nunca fica negativo", "cliente A nunca vê dados do cliente B"). Tem ID estável (INV-NNN). | "Isso viola a INV-014" / "preciso de teste pra essa invariante". |
| **Hook** | Gatilho automático que dispara antes/depois de uma ação do agente (ex.: bloquear comando perigoso, validar arquivo salvo). | "O hook bloqueou" / "vou adicionar um hook pra X". |
| **Auditor** | Especialista automatizado que revisa um aspecto específico (segurança, multi-tenant, performance) e devolve achados com severidade. Não é humano. | "O auditor-seguranca achou 3 CRÍTICOs" / "preciso de auditor pra Y". |
| **Drift** | Quando a documentação e o código param de bater. Spec diz X, código faz Y. Sintoma de débito. | "Tem drift entre spec e implementação" / "auditor-drift acusou divergência". |
| **Override** | Decisão consciente de **ignorar uma regra** num caso específico. Sempre registrada em ledger com justificativa e validade. | "Vou pedir override pra essa regra" / "override-ledger anotou". |
| **Matcher** | Filtro que diz **em qual situação um hook dispara** (ex.: "só quando o agente for editar arquivo .md", "só quando rodar comando bash"). Sem matcher, hook não roda. | "Matcher do hook é Write\|Edit" / "esse hook não tem matcher". |
| **Frontmatter** | Cabeçalho de metadados no topo de cada doc (entre `---`), com dono, data da última revisão, status. Sem ele, o robô bloqueia o salvamento. | "Faltou frontmatter" / "frontmatter inválido". |
| **Multi-tenant** | Sistema em que **vários clientes** rodam no mesmo software, isolados entre si. Cliente A nunca vê dado de B. Mesmo que "tenant", visto de cima. | "Esse sistema é multi-tenant" / "regra de multi-tenant exige RLS". |
| **RBAC** | "Role-Based Access Control" — controle de acesso por **papel** (admin, gerente, vendedor). Cada papel tem permissões pré-definidas, não se atribui acesso pessoa por pessoa. | "RBAC define quem vê o quê" / "papel novo no RBAC". |
| **Fase de produto** (F-1, F-2…) | Um grupo de funcionalidades de produto entregues juntas, com ritual completo (spec → auditoria → marco). Era chamada "Wave" antigamente — termo descontinuado. | "Fase 1 fecha em junho" / "isso é escopo da Fase 2". |
| **Foundation** | Capacidade transversal sem a qual nenhum módulo funciona (login, multi-tenant, observabilidade). Vem antes das Fases de produto. | "Foundation F-A é auth" / "não dá pra começar Fase 1 sem fechar F-B". |
| **Ritual** | Sequência obrigatória de passos antes/depois de cada marco (kickoff → spec → plan → tasks → auditoria → finalização). Não pula etapa. | "Cumprir o ritual da Fase 2" / "ritual de saída de marco". |
| **Marco** | Ponto de fechamento de uma fase. Para passar, exige PASS ZERO e ritual cumprido. | "Bater o marco da F-1" / "marco aceito pelo dono". |
| **PASS ZERO** | Critério inegociável pra fechar marco: **zero achados** CRÍTICO, ALTO ou MÉDIO em aberto. Só BAIXO pode passar (vira carryover). | "Estamos em PASS ZERO?" / "ainda falta zerar um ALTO pra PASS ZERO". |
| **Carryover** | Achado de severidade BAIXA que não impede fechar o marco, mas fica rastreado pra próxima Fase. | "Isso vira carryover" / "carryover acumulado da Fase 1". |
| **Eval** | Teste do próprio auditor (golden cases). Confirma que o auditor continua acertando depois de mudança de regra ou prompt. | "Rodei os evals da v1.2" / "eval falhou, auditor regrediu". |
| **MVP** | "Minimum Viable Product" — versão mínima do produto que já entrega valor pro cliente. Permite aprender com uso real antes de investir no completo. | "Esse é o escopo do MVP" / "MVP fica fora a parte X". |
| **SaaS** | "Software as a Service" — produto vendido como assinatura mensal/anual em vez de licença única. O cliente acessa via navegador, não instala nada. | "É um SaaS B2B" / "modelo SaaS muda contabilidade". |
| **B2B / B2C** | B2B = empresa vendendo para empresa. B2C = empresa vendendo para consumidor final. Cada um exige funcionalidades, contratos e suporte diferentes. | "Nosso modelo é B2B" / "essa feature é mais B2C". |
| **CRUD** | "Create, Read, Update, Delete" — as 4 operações básicas em qualquer cadastro (criar, consultar, atualizar, apagar). Todo módulo tem ao menos esse esqueleto. | "CRUD básico de cliente" / "essa tela é só CRUD". |
| **Idempotência** | Garantia de que **repetir a mesma operação não gera efeito duplicado** (ex.: clicar "pagar" 3 vezes não cobra 3 vezes). Crítico em pagamento, integração e envio de e-mail. | "Falta idempotência nesse endpoint" / "auditor-idempotencia pegou". |
| **Mock / Fixture** | Dados falsos pros testes — pessoas, contas, pedidos inventados que não existem no banco real. Permite testar sem mexer em dado de cliente. | "Tem mock do cliente X" / "atualizar fixture do teste Y". |
| **Trunk-based** | Modelo de trabalho em que todo mundo entrega na branch principal direto (com PR curto), em vez de manter branches longas separadas. Reduz conflito de merge. | "Adotamos trunk-based" / "trunk-based exige PR pequeno". |
| **kebab-case** | Convenção de nome em arquivo/URL: tudo em **minúscula com hífen** (ex.: `cadastro-cliente.md`). Usada pra padronizar nomes em todo o projeto. | "Usar kebab-case no nome" / "esse arquivo violou kebab-case". |
| **Conventional Commits** | Padrão de mensagem de commit com prefixo (`feat:`, `fix:`, `chore:`, `docs:`). Permite gerar CHANGELOG e versão automaticamente. | "Commit fora do padrão Conventional Commits" / "preciso reescrever a mensagem". |
| **SemVer** | "Semantic Versioning" — versão em 3 partes (`1.2.3`): MAIOR (quebra cliente), MENOR (adiciona sem quebrar), PATCH (corrige). Tradução exata pra quem importa a biblioteca. | "Bump de SemVer" / "essa mudança exige MAJOR (1 → 2)". |
| **Rollback** | Voltar pra versão anterior do sistema depois que algo deu errado no deploy. Sempre que possível, automatizado e rápido. | "Rollback do deploy" / "esse fluxo não tem rollback". |
| **Observabilidade** | Capacidade de **olhar de fora e entender o que está acontecendo dentro do sistema** (logs, métricas, rastros). Sem ela, bug em produção vira chute. | "Esse fluxo não tem observabilidade" / "investimos em observabilidade no trimestre". |
| **pre-commit** | Robô que roda **antes** de salvar a mudança no histórico (lint, secret-scan, format). Se reprova, o commit é bloqueado. | "Pre-commit pegou um secret" / "configurar pre-commit". |
| **skip** | Pular um teste ou etapa. Pode ser legítimo durante investigação, mas não pode virar entrega final escondendo erro. | "Esse teste ficou com skip" / "remover skip antes de fechar". |
| **assertTrue(true)** | Teste falso que sempre passa. É como marcar conferido sem conferir nada. Proibido pelo método. | "Achei assertTrue(true), isso mascara bug". |
| **@ts-ignore** | Comentário que manda o TypeScript ignorar erro de tipo na linha seguinte. Às vezes ajuda no debug, mas em entrega final costuma esconder problema real. | "Tem @ts-ignore no diff". |
| **eslint-disable** | Comentário que desliga uma regra do robô de lint. Pode ser exceção rara e justificada; não pode ser usado para silenciar problema. | "eslint-disable precisa de justificativa". |
| **|| true** | Truque de terminal que transforma falha em sucesso. Em teste ou build, mascara erro e é bloqueado. | "`npm test || true` fez o erro sumir". |
| **baseline** | Foto inicial de erros conhecidos para acompanhar melhoria. Vira problema quando é usada para esconder erro novo como se fosse antigo. | "Atualizar baseline só com justificativa". |

## Tabela canônica — operação, segurança e conformidade

| Termo técnico | O que significa pro negócio | Quando você vai ouvir |
|---|---|---|
| **SLA** | Promessa formal de nível de serviço pro cliente (ex.: "sistema fica no ar 99,9% do mês"). Se quebrar, pode ter multa. | "Está no SLA?" / "violamos o SLA no incidente". |
| **SLI** | Medição concreta de qualidade do serviço (ex.: % de requisições com resposta < 1s). É o "termômetro". | "SLI de latência caiu" / "esse SLI alimenta o SLO". |
| **SLO** | Meta interna baseada no SLI (ex.: "queremos 99,5% de respostas rápidas"). Mais agressivo que o SLA. | "Estouramos o SLO" / "SLO mensal verde". |
| **Error budget** | "Orçamento de erro" — quanto de falha o SLO permite no mês. Se gasta tudo, freia entregas pra estabilizar. | "Queimamos o error budget" / "tem error budget pra essa mudança?". |
| **SBOM** | Lista completa de tudo que entra no sistema (bibliotecas, versões). Exigida cada vez mais por contratos e regulação. | "Gerar SBOM do release" / "auditoria pediu SBOM". |
| **ROPA** | Registro de Operações de Tratamento de dados pessoais — documento exigido pela LGPD. Diz o que você coleta, por quê e por quanto tempo. | "Atualizar ROPA" / "esse fluxo entra no ROPA". |
| **LGPD** | Lei Geral de Proteção de Dados (Brasil). Define obrigações sobre dados pessoais (consentimento, retenção, direito de apagar). | "LGPD obriga isso" / "exige avaliação LGPD". |
| **PII** | "Dado pessoal" no jargão técnico — nome, CPF, e-mail, endereço, qualquer coisa que identifique alguém. | "Esse campo tem PII" / "PII não pode aparecer no log". |
| **MFA** | Login com **dois fatores** (senha + código no celular, por exemplo). Reduz drasticamente risco de invasão. | "MFA obrigatório pra admin" / "ativar MFA". |
| **JWT** | "Crachá digital" que o sistema dá depois do login, e o usuário apresenta a cada ação. Tem prazo de validade. | "JWT expirou" / "rotacionar chave do JWT". |
| **RLS** | "Row-Level Security" — regra no banco que garante que cliente A só vê linhas dele, nunca de B. Pilar do multi-tenant. | "Falta RLS nessa tabela" / "auditor-tenant pegou RLS quebrado". |
| **WORM** | "Write Once, Read Many" — armazenamento que **só permite gravar**, nunca apagar/editar. Usado em log de auditoria e dado regulatório. | "Esse log vai pra WORM" / "WORM por 7 anos". |
| **STRIDE** | Método pra mapear ameaças de segurança no sistema. Pergunta-se, em cada parte: "alguém pode se passar por outro? alterar dado? negar que fez? ver o que não devia? derrubar? subir de privilégio?". Cobre 6 tipos clássicos de ataque. (As 6 iniciais: **S**poofing, **T**ampering, **R**epudiation, **I**nformation disclosure, **D**enial of service, **E**levation of privilege.) | "Aplicar STRIDE nesse fluxo" / "STRIDE identificou risco X". |
| **PASTA / DREAD / OCTAVE** | Outros métodos de análise de ameaça (alternativas ao STRIDE). PASTA olha o processo de ponta a ponta, DREAD dá nota de 1 a 10 ao risco, OCTAVE foca em ativo crítico. | "Esse projeto adota PASTA" / "DREAD pontuou 8 no risco X". |
| **C4** | Forma padrão de desenhar a arquitetura em camadas (Contexto → Container → Componente → Código). | "Diagrama C4 do sistema" / "atualizar C4 nível 2". |
| **Tenant** | Cada cliente que usa o sistema, isolado dos demais. 1 tenant = 1 cliente, ninguém vê dado de ninguém. | "Esse bug é do tenant X" / "criar tenant novo". |
| **Schrems II** | Decisão judicial europeia que limita transferência de dado pessoal pros EUA. Importa quando seu sistema usa serviço americano (AWS, Google) e tem cliente na Europa. | "Schrems II afeta esse fluxo" / "preciso de cláusula contratual padrão por causa de Schrems II". |
| **safe-harbor** | "Porto-seguro" — promessa formal de não processar judicialmente pesquisador de segurança que reporta vulnerabilidade de boa-fé. Atrai quem ajuda em vez de afastar. | "Nosso SECURITY.md tem cláusula de safe-harbor" / "exigir safe-harbor antes de publicar". |

## Tabela canônica — ferramentas e práticas de engenharia

| Termo técnico | O que significa pro negócio | Quando você vai ouvir |
|---|---|---|
| **MCP** | "Model Context Protocol" — jeito padronizado do Claude conectar em serviços externos (banco, GitHub, navegador, planilha). Funciona como uma "tomada universal": o serviço expõe um servidor MCP e o Claude consegue ler/escrever sem código customizado a cada integração. | "Tem MCP pra isso" / "configurar servidor MCP". |
| **AST** | "Árvore Sintática Abstrata" — jeito do robô enxergar o código **como uma árvore de pecinhas** (este `if` contém esse `for`, que chama essa função…) em vez de só texto. Permite encontrar padrões com precisão, sem confundir com comentário ou string. | "Auditor que lê o AST" / "transformação via AST". |
| **Protocolo HTTP** | Conjunto de regras que o navegador (ou app de celular) usa pra conversar com o servidor (pedir página, mandar formulário, receber resposta). Toda interação web passa por HTTP. | "Erro de protocolo HTTP" / "esse fluxo é HTTP puro". |
| **Sigstore / cosign** | Selo digital que prova quem assinou o software. Como carimbo de cartório no binário, garante origem e impede troca silenciosa. | "Assinar release com cosign" / "verificar sigstore". |
| **lefthook / husky / lint-staged** | Ferramentas que rodam verificações automaticamente antes do commit (lint, type-check, testes do arquivo tocado). Pega bobeira antes de salvar. | "lefthook bloqueou" / "configurar husky pra rodar lint-staged". |
| **GIVEN / WHEN / THEN** | Estrutura padrão pra descrever caso de teste em linguagem natural: **Dado** (estado inicial), **Quando** (ação), **Então** (resultado esperado). | "Reescrever o AC em GIVEN/WHEN/THEN" / "esse teste falha no THEN". |
| **CI / CD** | "Continuous Integration / Continuous Delivery" — robô que, a cada mudança enviada, confere automaticamente (rodando lint, testes, build) e, se passa, publica. | "CI quebrou" / "pipeline de CI/CD". |
| **end-to-end (E2E)** | "De ponta a ponta" — teste que simula o usuário real navegando, clicando, preenchendo. Pega bug que só aparece no fluxo completo. | "Rodar testes end-to-end" / "robô E2E quebrou na tela de login". |
| **5xx** | Família de códigos de erro que o servidor devolve ao navegador quando **o problema é do nosso lado** (não do usuário). 500 = erro genérico, 502 = um intermediário caiu, 503 = sistema fora do ar. Se a taxa de 5xx sobe, é alarme: cliente está vendo tela de erro. | "Taxa de 5xx subiu" / "alarme dispara se 5xx > 1%". |
| **TTL** | "Time To Live" — validade temporal de algo (cache, token, link). Depois desse prazo, expira sozinho. | "TTL do cache é 5 minutos" / "JWT com TTL de 1 hora". |
| **RTO** | "Recovery Time Objective" — tempo **máximo** que o sistema pode ficar fora do ar num desastre. Acordado em contrato. | "RTO contratual é 4 horas" / "esse cenário viola o RTO". |
| **RPO** | "Recovery Point Objective" — perda **máxima** de dados aceitável num desastre (medida em tempo: "podemos perder até 15 min de dado"). | "RPO de 15 minutos" / "backup atual não atende o RPO". |
| **MTTR** | "Mean Time To Repair" — tempo médio que levamos pra voltar ao normal depois de um incidente. Quanto menor, melhor. | "MTTR do mês ficou em 35 min" / "reduzir MTTR é meta do trimestre". |
| **expand/contract** | Padrão de migração de banco em duas fases: primeiro **adiciona** o campo novo (expand) e o código passa a usar ambos; depois, num release seguinte, **remove** o antigo (contract). Evita janela onde o sistema quebra. | "Migration em expand/contract" / "ainda estamos na fase expand". |

## Tabela canônica — stacks, vendors e regulação setorial

Termos que aparecem em AGENTS.md/REGRAS específicos por tipo de projeto. Você vai topar quando o agente IA explica decisão de stack ou regulação do seu setor.

### Licenças e modelos OSS

| Termo técnico | O que significa pro negócio | Quando você vai ouvir |
|---|---|---|
| **OSS** | "Open-Source Software" — código aberto. Qualquer pessoa pode ler, copiar e contribuir. Bom pra atrair comunidade; ruim se você quer cobrar pelo código em si (cobra-se serviço/suporte). | "Esse projeto é OSS" / "vamos abrir como OSS". |
| **MIT** | Licença open-source mais permissiva e popular. Permite qualquer uso (até comercial) só pedindo que se mantenha o aviso de autoria. Compatível com quase tudo. | "Licença MIT" / "MIT é OK pra empresa usar". |
| **Apache-2.0** | Licença OSS parecida com MIT, mas com cláusula explícita de patente (protege contra uso de patente do contribuidor) e exige nota de mudança. Padrão corporativo. | "Apache-2.0 dá mais segurança jurídica" / "release sob Apache-2.0". |

### Stack Python típica (SaaS / API)

| Termo técnico | O que significa pro negócio | Quando você vai ouvir |
|---|---|---|
| **FastAPI** | Framework Python pra construir APIs (endpoints) com pouca cerimônia. Gera documentação automática e valida payload. Padrão moderno em SaaS Python. | "API vai usar FastAPI" / "endpoint novo no FastAPI". |
| **SQLAlchemy** | "Tradutor" entre Python e banco relacional (Postgres, MySQL). Em vez de escrever SQL na unha, escreve em Python e ele traduz. | "Modelo SQLAlchemy de Cliente" / "query no SQLAlchemy". |
| **Alembic** | Ferramenta que **versiona** mudanças de banco (ver "migration") no projeto Python/SQLAlchemy. Cada migration vira arquivo carimbado e auditável. | "Subir migration no Alembic" / "rollback do Alembic". |
| **Celery** | Robô que executa tarefas demoradas **fora da requisição do cliente** (mandar e-mail, gerar relatório, processar arquivo). Permite responder rápido e processar depois. | "Manda pro Celery" / "fila Celery travou". |
| **Redis** | Banco de dados que vive **em memória** (rapidíssimo) — usado pra cache, fila do Celery, contadores temporários, sessão. Não substitui Postgres; complementa. | "Redis caiu" / "cache no Redis". |
| **pytest** | Robô de teste padrão do mundo Python. Roda os testes da suíte do projeto, dá o veredito. | "Pytest reprovou 3 testes" / "rodar `pytest`". |
| **mypy** | Conferência de tipos em Python (ver "type-check"). Pega bug bobo cedo, antes de subir. | "Mypy reclamou" / "ignorar mypy nessa linha exige ADR". |
| **ruff** | Linter (ver "lint") modernísssimo pra Python, super rápido. Substitui flake8/black em projetos novos. | "Ruff bloqueou" / "configurar ruff". |
| **async** | Forma de escrever código que **espera coisas demoradas (rede, banco) sem travar o programa**. Em vez de "para tudo e espera", o programa segue fazendo outra coisa enquanto espera. Muda a forma de pensar do desenvolvedor. | "Esse endpoint é async" / "tem que ser async pra escalar". |
| **middleware** | Camada que fica **no meio do caminho** entre o pedido do cliente e a resposta do sistema. Faz coisas como autenticar, logar, medir tempo. Você adiciona ou remove sem mexer no resto. | "Middleware de auth" / "criar middleware de log". |
| **ORM** | "Object-Relational Mapper" — categoria a que SQLAlchemy pertence. Em vez de SQL bruto, você trabalha com objetos da linguagem. | "ORM facilita refactor" / "anti-pattern de ORM". |

### Stack TypeScript / JavaScript / frontend

| Termo técnico | O que significa pro negócio | Quando você vai ouvir |
|---|---|---|
| **Next.js** | Framework JavaScript/React pra construir sites e aplicações web com performance e SEO. Roda parte no servidor, parte no navegador, transparentemente. | "Front em Next.js" / "deploy do Next.js". |

### Vendors AWS (nuvem Amazon)

| Termo técnico | O que significa pro negócio | Quando você vai ouvir |
|---|---|---|
| **Cognito** | Serviço da AWS que cuida do **login dos usuários** (cadastro, senha, MFA, recuperação). Em vez de construir login do zero, plugue no Cognito. | "Auth via Cognito" / "Cognito controla MFA". |
| **ECS Fargate** | Serviço da AWS que **roda containers sem você administrar servidor**. Você empacota o app, a AWS provisiona o que precisa. Custo por uso. | "Subir no Fargate" / "ECS Fargate escalou ontem". |
| **CloudWatch** | Serviço da AWS de **logs e métricas**. Tudo que o sistema imprime vai pra lá, dá pra criar alarme em cima. Pilar da observabilidade em projeto AWS. | "Ver no CloudWatch" / "alarme no CloudWatch disparou". |

### Vendors de observabilidade

| Termo técnico | O que significa pro negócio | Quando você vai ouvir |
|---|---|---|
| **Sentry** | Serviço externo que **captura erros do programa em produção** e te avisa com contexto (qual usuário, qual fluxo, qual linha). Muito útil em frontend. | "Sentry alertou erro novo" / "olhar no Sentry". |
| **Datadog** | Plataforma comercial completa de observabilidade (logs + métricas + traces + alarme). Concorrente do CloudWatch, mais caro, mais poderoso. | "Dashboard no Datadog" / "Datadog cobra por host". |

### Regulação setorial (Brasil — financeiro / governo)

| Termo técnico | O que significa pro negócio | Quando você vai ouvir |
|---|---|---|
| **Bacen** | Banco Central do Brasil. Regula bancos, pagamentos, instituições financeiras. Quem opera com dinheiro institucional **precisa** seguir regra do Bacen. | "Exige aprovação Bacen" / "circular do Bacen". |
| **Open Finance** | Sistema brasileiro (lei do Bacen) que obriga bancos a compartilharem dado do cliente, com consentimento, com outras instituições autorizadas. Quem se conecta no Open Finance vira regulado. | "Integrar Open Finance" / "Open Finance exige certificado ICP". |
| **CNAB** | Formato padrão de arquivo (texto fixo, definido pela FEBRABAN) que bancos brasileiros usam pra trocar lote de cobrança, pagamento, débito automático. Muito antigo, mas ainda dominante. | "Gerar arquivo CNAB" / "layout CNAB 240/400". |
| **ICP-Brasil** | Infraestrutura de Chaves Públicas Brasileira — sistema oficial de **assinatura digital com validade jurídica** no Brasil (e-CPF, e-CNPJ). Necessário pra Nota Fiscal Eletrônica, Open Finance, contratos digitais com peso de papel-assinado-em-cartório. | "Certificado ICP-Brasil" / "exige assinatura ICP-Br". |

## Leitura mínima pro dono não-técnico

Você **não precisa** ler o manual inteiro. Leia o que está abaixo no ritmo do projeto.

### Antes de qualquer coisa — 30 minutos
- Este glossário (você está aqui).
- `AGENTS.md` do projeto — apenas seções **1, 2, 5 e 11** (visão, princípios, comunicação, decisões que exigem você).
- `REGRAS-INEGOCIAVEIS.md` do projeto — leia inteiro, é curto e crítico.

Ao fim, você sabe o que o agente pode e não pode fazer sozinho.

### Antes de aprovar um módulo — 1 a 2 horas
- `docs/dominios/<dom>/modulos/<mod>/problema.md` — qual dor estamos resolvendo, pra quem.
- `docs/dominios/<dom>/modulos/<mod>/personas.md` — quem usa esse módulo.
- `docs/dominios/<dom>/modulos/<mod>/spec.md` — **só** a seção "User stories" e os AC. O resto é técnico.
- `docs/dominios/<dom>/modulos/<mod>/plan.md` — **só** a seção "Riscos". O resto é execução.

Ao fim, você sabe se o escopo é o que você quer e se os riscos foram nomeados.

### Antes de fechar marco — 30 minutos
- `.agent/CURRENT.md` — onde o projeto está agora.
- `docs/governanca/auditoria-saida.md` — resumo dos achados dos auditores.
- `docs/dominios/<dom>/modulos/<mod>/retrospectiva.md` — o que funcionou, o que não funcionou.

Ao fim, você sabe se está em PASS ZERO e se pode bater o martelo.

## Quando o agente vai parar e te perguntar

O agente é **proativo** — ele decide e executa sozinho na maioria dos casos. Mas tem coisas que ele **obrigatoriamente** te consulta antes de fazer.

### Obrigatório parar e perguntar
- **Apagar dados que o cliente já viu** (deletar registros de produção, dropar tabela).
- **Mudar visibilidade do repositório** (público ↔ privado).
- **Subir mudança que muda preço, política ou texto legal** que o cliente lê.
- **Gastar dinheiro** (assinar serviço, comprar domínio, contratar API paga).
- **Operação que precisa do seu celular** (2FA/MFA, código do banco).
- **Override de regra inegociável** (REGRAS-INEGOCIAVEIS.md) — exige sua autorização explícita.
- **Push --force, reset --hard, rm -rf** ou equivalente destrutivo.
- **Mensagem ambígua sua** (ex.: "tira essa mensagem" pode ser "esconde do cliente" ou "conserta pra aparecer") — ele pergunta antes de mexer.

### Pode ignorar e seguir sem perguntar
- Criar/editar arquivo de documentação interno.
- Rodar testes, lint, build, type-check.
- Abrir issue/PR, comentar em PR, criar release/tag.
- Push fast-forward normal pra branch principal.
- Aplicar correção que o próprio auditor apontou.
- Renomear variável interna, reorganizar arquivo (sem mudar comportamento).
- Atualizar dependência de patch (sem mudança de comportamento).

Regra geral: **se é executável, não destrói, não gasta dinheiro e não muda o que o cliente vê**, o agente faz e te avisa depois. Se é destrutivo, irreversível, financeiro ou ambíguo, ele para e pergunta.
