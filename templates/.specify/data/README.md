---
owner: framework
revisado-em: 2026-05-18
status: stable
---

# Knowledge Bases — ROLDAO-METHOD

Memórias externas que os agentes consultam. Cada KB é estável (muda raramente), curada, e cita fonte oficial quando aplicável.

| KB | Usado por | Conteúdo |
|---|---|---|
| [kb-pt-br.md](kb-pt-br.md) | `traduzir-jargao`, todos | Glossário, tabela de tradução, termos BR (Pix, NF-e, SEFAZ) |
| [kb-fiscal.md](kb-fiscal.md) | `fiscal-br` | NF-e, NFS-e, SEFAZ, Reforma Tributária 2026-2033, CNPJ alfanumérico, obrigações acessórias |
| [kb-lgpd.md](kb-lgpd.md) | `auditor-seguranca`, `checklist-lgpd` | Bases legais Art. 7/11, direitos, RIPD, incidente 72h, transferência internacional |
| [kb-pix.md](kb-pix.md) | `validar-pix` | Chaves, EndToEndId, TxId, BR Code, Open Finance, DICT |
| [kb-stack-br.md](kb-stack-br.md) | `tech-lead` | Stack recomendada BR, anti-padrões de locale/fuso/moeda |
| [kb-brainstorming-pt-br.md](kb-brainstorming-pt-br.md) | `brainstormar-ideia` | 15 técnicas de brainstorming adaptadas ao contexto BR |
| [kb-elicitation-pt-br.md](kb-elicitation-pt-br.md) | `gerente-produto`, `/clarificar` | Métodos de elicitação/questionamento estruturado antes de codar |

São **7 knowledge bases** no total.

## Como usar

Agentes citam KBs como referência:
> "Conforme `kb-fiscal.md`, FISCAL-005 aceita CNPJ alfanumérico após jul/2026."

KBs são **leitura**, não execução. Para regras que **bloqueiam**, ver `.claude/hooks/`.

## Quando atualizar

- **Mudança de lei/regulação BR**: ANPD publica resolução, Receita atualiza MOC, Bacen atualiza Pix → atualizar KB imediatamente.
- **Mudança de stack consolidada**: ferramenta nova vira padrão (ex: Bun substituindo Node em 2027?) → atualizar `kb-stack-br.md`.
- **Termo novo no jargão**: time começa a usar termo novo → adicionar em `kb-pt-br.md` com tradução.

## Princípio

KB é **memória curada**, não wiki aberta. Cada item é necessário pra o agente decidir corretamente. Se a informação é óbvia ou está no código, **não vai pra KB**.
