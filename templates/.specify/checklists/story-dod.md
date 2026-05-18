---
tipo: checklist
id: CHK-STORY-DOD
versao: 1
status: stable
owner: auditor-qualidade
revisado-em: 2026-05-18
---

# Checklist — Definition of Done (Story)

> Aplica antes de marcar uma user story (`US-NNN`) como entregue. Quem roda: `auditor-qualidade` (no `/auditoria`) ou `revisor` (no `/feature`).
>
> Regra mestre: **não basta funcionar — tem que ser auditável, reversível e sem débito escondido.**

## 1. Aderência à spec

- [ ] Todos os `AC-NNN-N` da story foram atendidos.
- [ ] Nenhum `non-goal` da story foi implementado por engano.
- [ ] Decisões fora do escopo foram registradas em ADR (`gerar-adr-pt-br`), não enfiadas silenciosamente.

## 2. Cadeia rastreável (INV-004)

- [ ] Cada `T-NNN` virou exatamente 1 commit atômico citando o ID.
- [ ] Mensagem de commit cita `US-NNN` e/ou `AC-NNN-N`.
- [ ] Arquivos novos têm frontmatter com `owner`, `revisado-em`, `status`.

## 3. Testes (TST-001 a TST-003)

- [ ] Cobertura proporcional ao risco: TDD em lógica de negócio, smoke em UI.
- [ ] Nenhum teste foi pulado/skipado/mascarado (hook `anti-mascaramento` deve ter passado).
- [ ] Teste de integração **não usa mock** de colaborador interno (TST-003).
- [ ] Dados de teste são sintéticos — sem CPF/CNPJ/email/telefone real (TST-004).
- [ ] Suite completa roda **verde** localmente antes do commit final.

## 4. Causa raiz (INV-006)

- [ ] Se a story corrige bug, a correção é no **ponto raiz**, não no sintoma.
- [ ] Investigador documentou no `contexto técnico` da story onde estava o bug real.
- [ ] Nenhum `// TODO` ou `// FIXME` foi deixado sem ID rastreável.

## 5. Regulamentação BR (quando aplicável)

- [ ] Se toca dado pessoal → checklist `lgpd-privacy-review.md` rodado.
- [ ] Se toca NF-e / fiscal → checklist `fiscal-compliance.md` rodado.
- [ ] Se toca Pix → skill `validar-pix` chamada nos pontos de entrada.
- [ ] IDs aplicáveis citados na seção "Regulamentação BR" da story (LGPD-NNN, FISCAL-NNN, PIX-NNN).

## 6. Segurança (SEC-001 a SEC-004)

- [ ] Nenhum secret commitado (hook `secrets-scanner` passou).
- [ ] URL/host de serviço externo vem de variável de ambiente, não hardcoded (SEC-003).
- [ ] Input externo validado no ponto de entrada (SEC-002).
- [ ] Princípio do menor privilégio respeitado em queries/permissões (SEC-004).

## 7. Operação

- [ ] Migration (se existe) tem backup automático ou plano de rollback documentado.
- [ ] Feature flag (se existe) tem critério escrito de quando ligar/desligar.
- [ ] Logs novos não vazam dado pessoal em texto puro (LGPD-004).

## 8. Documentação

- [ ] `AGENTS.md` continua ≤ 200 linhas (hook `context-budget` passou).
- [ ] Se mudou contrato de API/IPC, doc do contrato foi atualizada na mesma branch.
- [ ] Se mudou stack/biblioteca, ADR registrado.

## 9. Comunicação com usuário não-técnico

- [ ] Mensagem de release/changelog está em PT-BR claro, sem jargão (skill `traduzir-jargao`).
- [ ] Tela ou mensagem de erro nova foi revisada por linguagem (sem "Internal Server Error" cru).

## 10. Status

- [ ] Story marcada como `entregue` no frontmatter.
- [ ] Histórico da story atualizado com data + autor + mudança.
- [ ] PRD pai (se existir) atualizado se a story trouxe aprendizado novo.

---

**Sinal de bloqueio:** qualquer caixa essencial (1, 2, 3, 5 quando aplicável, 6) marcada `não` = story NÃO entregue. Volta pro dev.

**Itens 4, 7, 8, 9 são fortemente recomendados** — não bloqueiam, mas geram débito se ignorados.
