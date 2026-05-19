---
tipo: checklist
id: CHK-FISCAL
versao: 1
status: stable
owner: fiscal-br
revisado-em: 2026-05-18
---

# Checklist — Compliance Fiscal BR

> Aplica antes de ligar feature que emite/recebe documento fiscal (NF-e, NFS-e, NFC-e, CT-e, MDF-e, SAT/CF-e), ou que lida com tributo (ICMS, PIS, COFINS, ISS, CBS/IBS pós-Reforma).
>
> Quem roda: agente `fiscal-br`. Cita IDs `FISCAL-001` a `FISCAL-007` do `REGRAS-INEGOCIAVEIS.md`.

## 1. Identificação fiscal (FISCAL-002)

- [ ] CNPJ do emitente validado (skill `validar-cpf-cnpj`).
- [ ] Inscrição Estadual (IE) validada por UF (algoritmo da SEFAZ correspondente).
- [ ] **CNPJ alfanumérico** suportado se sistema operará após **jul/2026** (FISCAL-005).
- [ ] Certificado digital A1/A3 associado ao tenant correto, não compartilhado entre clientes.

## 2. Imutabilidade do documento (FISCAL-001)

- [ ] XML autorizado fica gravado **byte a byte** como recebido pela SEFAZ.
- [ ] Não há rotina que regere XML autorizado.
- [ ] Backup do XML autorizado em local seguro (S3 com versionamento, ou equivalente).
- [ ] Hash SHA-256 do XML gravado pra auditoria de integridade.

## 3. Ambiente SEFAZ (FISCAL-003)

- [ ] Ambiente **homologação (2)** usado em todo desenvolvimento e teste.
- [ ] Promoção pra **produção (1)** segue checklist de release dedicado.
- [ ] Variável de ambiente `SEFAZ_AMBIENTE` separa configs — nunca hardcoded.
- [ ] URL de webservice da UF correta (cada UF tem URL própria de NF-e/NFS-e).

## 4. Contingência (FISCAL-004)

- [ ] Modo de contingência (SVC-AN, SVC-RS, EPEC) tratado se SEFAZ cair.
- [ ] Fila de retransmissão automática quando SEFAZ voltar.
- [ ] Alerta operacional quando contingência for ativada (não silencioso).
- [ ] Limite de tempo em contingência respeitado (legal: 168h pra transmitir após emissão em contingência).

## 5. Reforma Tributária 2026-2033 (FISCAL-006)

- [ ] Sistema preparado pra cálculo paralelo ICMS+CBS+IBS durante transição.
- [ ] Alíquotas configuráveis por UF e por período (não hardcoded).
- [ ] Regime de transição implementado conforme cronograma:
  - 2026: CBS 0,9% + IBS 0,1% em teste
  - 2027: CBS plena (0,9% → alíquota cheia)
  - 2029-2032: redução gradual ICMS+ISS, aumento IBS
  - 2033: regime novo pleno
- [ ] Notas fiscais antigas (regime velho) continuam consultáveis e imutáveis.

## 6. Obrigações acessórias (FISCAL-007)

- [ ] SPED Fiscal/Contribuições gerado nos prazos.
- [ ] EFD-ICMS, EFD-Contribuições, ECD, ECF — calendário automatizado se aplicável.
- [ ] eSocial: eventos S-1000 a S-3000 enviados se há vínculo trabalhista.
- [ ] REINF se há retenções de PIS/COFINS/CSLL.
- [ ] DCTFWeb consolidando eSocial+REINF, prazos respeitados.

## 7. Validação numérica

- [ ] Cálculo de tributo bate com referência (planilha contábil ou ferramenta como TaxLab/Avalara).
- [ ] Arredondamento usa modo **HALF_EVEN** (banker's rounding) ou regra explícita do fisco.
- [ ] Casas decimais respeitam Manual de Orientação do Contribuinte (NF-e: 2 ou 4 conforme campo).
- [ ] Conversão de moeda usa câmbio da data de emissão (Bacen PTAX se necessário).

## 8. Segurança do certificado

- [ ] Certificado digital armazenado criptografado (não em texto puro).
- [ ] Senha do certificado não commitada — vem de gerenciador (Vault, AWS Secrets, etc.).
- [ ] Acesso ao certificado logado (auditoria de uso).
- [ ] Renovação programada com alerta 30 dias antes do vencimento.

## 9. Dados pessoais no documento fiscal

- [ ] CPF/CNPJ do destinatário tem base legal LGPD (geralmente cumprimento de obrigação legal — Art. 7 II).
- [ ] Acesso ao XML restrito (XML tem dado pessoal: nome, endereço, CPF).
- [ ] Trilha de quem consultou XML existe (LGPD-004).

## 10. Cancelamento e correção

- [ ] Cancelamento dentro de 24h (NF-e) implementado.
- [ ] Carta de Correção Eletrônica (CC-e) suportada — máx 20 por nota (`nSeqEvento` 1→20); cada CC-e consolida as anteriores (a última é a válida); prazo 720h (30 dias) após autorização da NF-e.
- [ ] Inutilização de numeração tratada (pulou número de série).
- [ ] Denegação tratada (nota recusada não pode ser reemitida com mesma chave).

---

**Sinal de bloqueio:** itens 1, 2, 3, 5 (se pós-2026), 8 marcados parcial = feature NÃO vai pra produção. Volta pro `fiscal-br` + `tech-lead`.

**Itens 4, 6, 7, 9, 10** geram aviso — débito fiscal aceitável só se documentado em ADR.
