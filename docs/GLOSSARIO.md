---
lang: pt-br
owner: tech-writer
revisado-em: 2026-05-24
status: stable
---

# Glossário sem jargão

> Cada termo que aparece nos comandos, nas mensagens do framework e nas conversas com o assistente — traduzido pra linguagem de quem **não programa**. Se você é dono do produto e quer entender o que o sistema está fazendo no seu lugar, comece aqui.

## Termos do dia-a-dia

| Termo técnico | O que significa na prática |
|---|---|
| **Framework** | Conjunto de regras e ferramentas prontas. Você não escreve do zero — segue o que já existe. |
| **Agente / subagente** | Especialista virtual com função fixa (gerente de produto, investigador, revisor). Você fala com o assistente, ele chama o agente certo. |
| **Hook** | Regra automática que dispara sozinha. Ex: "se tentar apagar tudo, bloqueia". Você não precisa lembrar — o sistema lembra. |
| **Skill** | Função pronta que o assistente sabe rodar. Ex: validar CPF, gerar QR Code Pix. |
| **Addon** | Pacote extra com regras de um setor específico (fintech, varejo, saúde). Você instala só o que precisa. |
| **Slash command** (`/feature`, `/bug`) | Roteiro pronto. Você digita o comando, o assistente segue os passos. |
| **Commit / commitar** | Salvar uma mudança no histórico do projeto. Como salvar uma versão do documento. |
| **Push** | Enviar essas mudanças pro servidor onde o time vê. |
| **Branch** | Cópia paralela do projeto pra trabalhar sem mexer no que está no ar. |
| **Merge** | Juntar duas cópias. Ex: a versão de teste vira a versão oficial. |
| **Pull request (PR)** | Pedido de revisão antes de juntar duas versões. |
| **Deploy** | Subir a versão nova pro servidor que o cliente acessa. |
| **Rollback** | Voltar pra versão anterior. "Desfazer o último deploy." |
| **Refactor** | Reorganizar o código por dentro sem mudar o que aparece pra quem usa. |
| **Migration** | Mudança na estrutura dos dados salvos (ex: adicionar campo "telefone" na ficha de cliente). |
| **Mock / fixture** | Dado falso usado em teste. Tipo um cliente "João da Silva, CPF 123…" inventado. |
| **Lint** | Programa que checa se o código está dentro do padrão. Como corretor ortográfico. |
| **CI / pipeline** | Linha de montagem automática: cada mudança passa por testes antes de virar oficial. |
| **API** | Porta de entrada pra outros programas conversarem com o seu. |
| **Endpoint** | Endereço específico dentro dessa porta. Ex: `/clientes` é o endpoint que devolve a lista de clientes. |
| **Payload** | Conteúdo que vai junto numa mensagem entre programas. |
| **Token** | Senha digital de uso único que prova quem você é. |
| **Stack** | Conjunto de tecnologias usadas (linguagem, banco, servidor). |

## Termos do framework

| Termo | O que significa |
|---|---|
| **REGRA #0** | Sempre investigar antes de mexer em código que não está funcionando. Olhar dado real (banco, log) antes de chutar a solução. |
| **Spec / PRD / story** | Documento que descreve o que precisa ser feito **antes** de fazer. |
| **ADR** | Anotação de uma decisão importante e o porquê dela (pra ninguém esquecer mês que vem). |
| **Plan mode** | O assistente planeja antes de executar — sem alterar nada no seu projeto. |
| **Worktree** | Pasta paralela onde dá pra trabalhar em outra coisa sem misturar. |
| **MCP** | Conector que liga seu assistente a outros sistemas (Gmail, Drive, banco de dados). |
| **Frontmatter** | Cabeçalho de informações no topo de um arquivo (dono, data, status). |
| **LGPD** | Lei brasileira de proteção de dados. Define como pode coletar e guardar dado pessoal. |
| **NF-e / NFS-e** | Nota fiscal eletrônica (produto / serviço). |
| **Pix** | Sistema de pagamento instantâneo do Brasil. |
| **CNPJ alfanumérico** | A partir de jul/2026, CNPJ pode ter letras junto com números. Todo sistema precisa aceitar. |
| **Reforma Tributária 2026-2033** | Mudança grande nos impostos brasileiros. Sistemas vão precisar calcular do jeito velho **e** novo em paralelo. |

## Quando você ouvir o assistente dizer algo estranho

| O que ele disse | Tradução |
|---|---|
| "Vou rodar os testes" | "Vou checar se nada quebrou." |
| "CI verde" | "Tudo passou nos testes automáticos." |
| "CI vermelho" | "Tem coisa que não está passando — preciso arrumar." |
| "Fiz commit + push" | "Salvei no histórico e mandei pro servidor." |
| "Vou abrir uma PR" | "Vou pedir revisão antes de juntar com a versão principal." |
| "Tem conflito" | "Duas pessoas mexeram no mesmo lugar — preciso decidir qual vale." |
| "Está em homologação" | "Está num ambiente parecido com o real, mas só pra teste — cliente não vê." |
| "Subi em produção" | "Agora o cliente já está usando essa versão." |
| "Tem débito técnico" | "Tem coisa meia-feita ou improvisada que vou precisar limpar depois." |

---

_Faltou algum termo? Abra issue em [github.com/roldaobatista/roldao-method/issues](https://github.com/roldaobatista/roldao-method/issues)._
