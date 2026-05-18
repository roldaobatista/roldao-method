---
tipo: prd
subtipo: fiscal
id: PRD-NNN
versao: 1
status: draft
owner: gerente-produto + fiscal-br
revisado-em: AAAA-MM-DD
---

# PRD-NNN — _(iniciativa fiscal — nome curto)_

> **PRD Fiscal**: aplicado a iniciativa que toca **documento fiscal eletrônico** (NF-e, NFS-e, NFC-e, CT-e, MDF-e) ou **apuração de tributo** (ICMS, PIS, COFINS, ISS, CBS/IBS pós-Reforma).
>
> Co-owner: `gerente-produto` (produto) + `fiscal-br` (técnico fiscal). Decisão fiscal sem aval do `fiscal-br` é débito legal.

---

## 1. Problema

_(1-3 parágrafos. Quem sofre, com que frequência, com que custo. Inclui custo de não-conformidade se aplicável.)_

**Evidência:**
- _(métrica, ticket, multa, autuação recente, ineficiência operacional)_

---

## 2. Personas

| Persona | Quem é | Necessidade fiscal |
|---|---|---|
| _(ex: contador da PME)_ | _(papel)_ | _(emitir, conferir, escriturar)_ |
| _(ex: usuário interno)_ | _(...)_ | _(...)_ |

---

## 3. Hipótese de solução

_(1 parágrafo. Direção em alto nível.)_

---

## 4. Escopo fiscal

### 4.1 Documentos fiscais emitidos/recebidos

| Documento | Direção | Modelo | UF/Município |
|---|---|---|---|
| NF-e | Emissão | 55 | _(UFs cobertas)_ |
| NFS-e | Emissão | _(varia por município)_ | _(municípios)_ |
| _(outros)_ | _(...)_ | _(...)_ | _(...)_ |

### 4.2 Tributos calculados

| Tributo | Regime | Atenção especial |
|---|---|---|
| ICMS | _(regime tributário)_ | DIFAL, ST se aplica |
| PIS/COFINS | _(cumulativo / não-cumulativo)_ | Vai ser extinto pela Reforma |
| ISS | _(...)_ | Município de incidência |
| CBS / IBS | _(transição 2026-2033)_ | Cálculo paralelo |

### 4.3 Obrigações acessórias afetadas

- [ ] SPED Fiscal
- [ ] SPED Contribuições
- [ ] ECD
- [ ] ECF
- [ ] eSocial
- [ ] REINF
- [ ] DCTFWeb
- [ ] _(outros)_

---

## 5. User stories

### US-001 — Emitir NF-e modelo 55

**Como** _(persona)_, **quero** emitir nota fiscal eletrônica modelo 55 **para** cumprir obrigação fiscal na venda B2B.

**Critérios de aceitação:**
- **AC-001-1** — Dado um pedido com itens, quando o usuário clicar "emitir nota", o sistema deve montar XML conforme schema NF-e vigente.
- **AC-001-2** — XML deve ser assinado com certificado digital A1 do tenant (não compartilhado).
- **AC-001-3** — Transmissão deve usar ambiente conforme variável `SEFAZ_AMBIENTE` (2 em dev, 1 em prod).
- **AC-001-4** — Resposta com `cStat=100` deve persistir XML autorizado **imutável** + protocolo de autorização (FISCAL-001).
- **AC-001-5** — Falha SEFAZ aciona contingência SVC-AN se prevista; senão, retry exponencial.

### US-002 — _(...)_

---

## 6. Compliance fiscal específica

### 6.1 Reforma Tributária 2026-2033 (FISCAL-006)

- [ ] Sistema preparado pra cálculo paralelo ICMS+CBS+IBS em 2026.
- [ ] Alíquotas por UF e por período configuráveis.
- [ ] NF-e emitida no regime atual continua imutável.
- [ ] Quando regime mudar, NF-e nova usa novos campos sem perder retrocompatibilidade.

### 6.2 CNPJ alfanumérico (FISCAL-005)

- [ ] Sistema aceita CNPJ com letras (A-Z, exceto I/O) a partir de jul/2026.
- [ ] Validação de DV com algoritmo módulo 11 atualizado.
- [ ] Skill `validar-cpf-cnpj` chamada nos pontos de entrada.

### 6.3 Imutabilidade de documento autorizado (FISCAL-001)

- [ ] XML autorizado gravado byte a byte.
- [ ] Hash SHA-256 do XML armazenado pra auditoria.
- [ ] Não há rotina que regere XML autorizado.

### 6.4 Certificado por tenant (FISCAL-002)

- [ ] Cada empresa-cliente tem certificado próprio.
- [ ] Certificado armazenado criptografado (Vault / AWS Secrets).
- [ ] Senha do certificado não em texto puro.
- [ ] Renovação alertada 30 dias antes do vencimento.

### 6.5 Contingência (FISCAL-004)

- [ ] Modo de contingência (SVC-AN, SVC-RS, EPEC) implementado.
- [ ] Fila de retransmissão automática quando SEFAZ voltar.
- [ ] Limite legal de 168h após emissão em contingência respeitado.

---

## 7. Non-goals (INV-003)

- _(o que NÃO está no escopo: ex. "não vamos cobrir NFS-e dos municípios fora da capital")_
- _(ex: "não vamos integrar com sistema contábil legado")_

---

## 8. Métricas de sucesso

| Métrica | Atual | Meta | Como medir |
|---|---|---|---|
| Taxa de emissão NF-e bem-sucedida | _(X%)_ | _(99,5%+)_ | Logs SEFAZ |
| Tempo médio de emissão | _(Xs)_ | _(<3s)_ | Métrica de aplicação |
| Notas em contingência por mês | _(X)_ | _(<Y)_ | Dashboard SEFAZ |
| Custo de não-conformidade evitado | _(...)_ | _(...)_ | Cálculo contábil |

---

## 9. Riscos fiscais

| Risco | Probab | Impacto | Mitigação |
|---|---|---|---|
| SEFAZ instável | Alta | Médio | Contingência + retry |
| Certificado vence sem aviso | Baixa | Crítico | Alerta 30 dias antes |
| Mudança de MOC SEFAZ no meio do projeto | Média | Médio | Acompanhar comunicados SEFAZ |
| Reforma Tributária muda regra antes do esperado | Média | Alto | Cálculo configurável, não hardcoded |
| Erro de cálculo gera autuação | Baixa | Crítico | Testes com planilhas de referência (TaxLab, contador) |

---

## 10. Dependências externas

- **SEFAZ da UF** — webservice oficial
- **Receita Federal** — emissão de certificado
- **Provedor de certificado digital** — ICP-Brasil
- **TecnoSpeed/PlugNotas/NFE.io** — se usar SaaS
- **Contador parceiro** — homologação de cálculos

---

## 11. Validação com contabilidade

- [ ] Contador do cliente revisou regras de cálculo.
- [ ] Cálculo bate com planilha de referência em 100% dos cenários testados.
- [ ] Casos edge revisados: substituição tributária, DIFAL, isenção, suspensão, ST de combustível.
- [ ] NF-e de teste passou em homologação SEFAZ.

---

## 12. LGPD aplicável

- **Dados pessoais na NF-e:** CPF/CNPJ destinatário, nome, endereço — **base legal: cumprimento de obrigação legal (LGPD Art. 7 II)**.
- Acesso ao XML autorizado restrito (trilha de quem consultou — LGPD-004).
- Cliente pode pedir cópia do XML (acesso, Art. 18 II).
- **Não** pode pedir exclusão de NF-e autorizada (cumprimento de obrigação legal vence direito ao esquecimento).

Ver `checklist-lgpd` para detalhes.

---

## 13. Roll-out

| Fase | Quando | Critério de avançar |
|---|---|---|
| Homologação interna | Sprint 1-2 | 100% testes passando, contador OK |
| Beta com 3 clientes-piloto | Sprint 3 | Zero erro fiscal por 30 dias |
| GA (todos clientes) | Sprint 4+ | Beta estável |

---

## 14. Histórico

| Data | Versão | Autor | Mudança |
|---|---|---|---|
| AAAA-MM-DD | 1 | _(quem)_ | criação |
