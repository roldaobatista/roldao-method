---
tipo: checklist
id: CHK-LGPD
versao: 1
status: stable
owner: auditor-seguranca
revisado-em: 2026-05-18
---

# Checklist — LGPD Privacy Review

> Aplica antes de ligar feature que **coleta, armazena, processa, compartilha ou exclui** dado pessoal (CPF, nome, email, telefone, endereço, foto, geolocalização, dado de saúde, dado financeiro, etc.).
>
> Quem roda: `auditor-seguranca` (no `/auditoria`). Complementa a skill `checklist-lgpd`.
>
> Cita IDs `LGPD-001` a `LGPD-010` do `REGRAS-INEGOCIAVEIS.md`.

## 1. Base legal definida (LGPD-001)

- [ ] Cada dado pessoal coletado tem **base legal** explícita (Art. 7 ou Art. 11 LGPD).
- [ ] Base legal documentada na user story / PRD, não inferida.
- [ ] Se base legal é **consentimento**: tela de coleta mostra finalidade clara e tem opção real de negar.
- [ ] Se base legal é **execução de contrato**: termo de uso registra o uso.
- [ ] Se base legal é **legítimo interesse**: teste de balanceamento documentado.

### Árvore de decisão rápida
```
Dado pessoal sensível (saúde, raça, religião, opinião política, biometria)?
├─ SIM → Art. 11 (consentimento ESPECÍFICO + DESTACADO ou hipóteses Art. 11)
└─ NÃO → Art. 7
         ├─ Contratante? → execução de contrato (Art. 7 V)
         ├─ Obrigação legal/regulatória? → cumprimento (Art. 7 II)
         ├─ Vida do titular em risco? → proteção (Art. 7 IV)
         ├─ Função pública? → políticas públicas (Art. 7 III)
         └─ Nada se encaixa? → consentimento (Art. 7 I) — última opção
```

## 2. Minimização (LGPD-003)

- [ ] Só coleta os dados **estritamente necessários** pra finalidade declarada.
- [ ] Campos opcionais marcados como opcionais (não força preenchimento).
- [ ] Não há "vamos guardar caso precise" — se não tem uso definido, não coleta.

## 3. Direito ao esquecimento (LGPD-002)

- [ ] Existe rota de exclusão **end-to-end** (UI → backend → banco → backup → terceiros).
- [ ] Exclusão também limpa **backups e réplicas** dentro de prazo razoável (90 dias máx).
- [ ] Exclusão notifica integrações que receberam o dado (processadores).
- [ ] Exclusão em logs estruturados: anonimização (hash com salt) ou expurgo.

## 4. Trilha de acesso (LGPD-004)

- [ ] Acesso a dado pessoal por humano (suporte, dev em prod, BI) é **logado**.
- [ ] Log tem: quem acessou, quando, qual dado, qual finalidade.
- [ ] Acesso em massa (export, dump) gera alerta.
- [ ] Logs de acesso retidos pelo prazo legal (mínimo 6 meses recomendado).

## 5. Transferência internacional (LGPD-005)

- [ ] Se dado sai do Brasil: país tem nível adequado de proteção (lista ANPD) **OU**
- [ ] Existe contrato com cláusulas-padrão da ANPD **OU**
- [ ] Existe consentimento específico do titular pra transferência.
- [ ] SaaS de terceiro (AWS US, GCP US, OpenAI) tem DPA assinado.

## 6. Incidente de segurança (LGPD-006)

- [ ] Plano de resposta a incidente documentado.
- [ ] Comunicação à ANPD em **até 72h** quando há risco a titulares (template pronto).
- [ ] Comunicação aos titulares afetados (template pronto).
- [ ] Logs preservados por 6 meses pra investigação forense.

## 7. RIPD — Relatório de Impacto (LGPD-007)

- [ ] RIPD elaborado se a feature tem **alto risco** (tratamento em larga escala, dado sensível, decisão automatizada, monitoramento contínuo).
- [ ] RIPD documenta: finalidade, necessidade, riscos, medidas mitigatórias.
- [ ] RIPD versionado junto com a feature (não em pasta esquecida).

## 8. DPO — Encarregado (LGPD-008)

- [ ] DPO designado e nome publicado no site (Art. 41).
- [ ] Canal de contato com DPO funcional (email, formulário).
- [ ] SLA de resposta ao titular: máx 15 dias (Art. 19).
- [ ] DPO ciente das mudanças que essa feature traz.

## 9. Decisão automatizada (LGPD-009)

- [ ] Se a feature **decide automaticamente** algo que afeta o titular (crédito, contratação, preço dinâmico, score):
  - [ ] Titular pode pedir revisão por humano.
  - [ ] Critérios da decisão são explicáveis em termos claros.
  - [ ] Não há discriminação indireta (variáveis-proxy de raça/gênero/religião).

## 10. Dado de criança/adolescente (LGPD-010)

- [ ] Se há possibilidade de coletar dado de < 18 anos:
  - [ ] Consentimento de pelo menos um dos pais/responsável.
  - [ ] Interesse melhor da criança considerado (Art. 14).
  - [ ] Não há propaganda direcionada a < 18 com base em perfil.

## 11. Segurança técnica

- [ ] Dado pessoal em trânsito: TLS 1.2+ obrigatório.
- [ ] Dado pessoal em repouso: criptografado (AES-256 ou equivalente).
- [ ] Dado sensível: criptografia em coluna ou tokenização.
- [ ] Acesso a banco com dado pessoal: princípio do menor privilégio (SEC-004).

## 12. Documentação e contratos

- [ ] Política de Privacidade atualizada se a feature muda o tratamento.
- [ ] Termos de Uso atualizados se cria nova obrigação ao titular.
- [ ] Registro de Operações de Tratamento (Art. 37) atualizado.
- [ ] DPA com cada operador (terceiro que processa em nome do controlador) assinado.

---

**Sinal de bloqueio:** itens 1, 2, 3, 5 (se aplica), 11 marcados parcial = feature NÃO vai pra produção.

**Itens 4, 6, 7, 8, 9, 10, 12** geram aviso — débito legal aceitável só com ADR + prazo de regularização.
