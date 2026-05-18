---
tipo: addon-template
nome: eventos-esocial-cobertos
revisado-em: 2026-05-18
status: stable
---

# Eventos eSocial — Cobertura do Addon

> Lista completa dos eventos eSocial que este addon cobre, com schema, prazo legal, lib recomendada por linguagem, e exemplo de payload.

## Tabela completa

| Evento | Nome | Schema | Prazo | Multa atraso | Cobertura |
|---|---|---|---|---|---|
| S-1000 | Empregador | S-1000.xsd | Anterior ao 1º evento | R$ 500-24k | ✅ |
| S-1005 | Estabelecimento | S-1005.xsd | Anterior ao uso | R$ 500-24k | ✅ |
| S-1010 | Tabela rubricas | S-1010.xsd | Anterior ao uso | R$ 500-24k | ✅ |
| S-1020 | Tabela lotações | S-1020.xsd | Anterior ao uso | R$ 500-24k | ✅ |
| S-2190 | Admissão Preliminar | S-2190.xsd | **Antes do início**, quando não dá pra enviar o S-2200 completo a tempo | R$ 500-24k | ✅ |
| S-2200 | Admissão | S-2200.xsd | **Dia imediatamente anterior à prestação de serviço** (S-2190 p/ última hora) | R$ 500-24k | ✅ |
| S-2205 | Alteração dados cadastrais | S-2205.xsd | Dia 15 mês seguinte | R$ 500-24k | ✅ |
| S-2231 | Cessão / exercício em outro órgão | S-2231.xsd | Dia 15 mês seguinte | R$ 500-24k | ✅ |
| S-2206 | Alteração contratual | S-2206.xsd | Dia 15 mês seguinte | R$ 500-24k | ✅ |
| S-2210 | CAT (acidente) | S-2210.xsd | **1 dia útil (imediato se fatal)** | **Alta** | ✅ |
| S-2220 | ASO (saúde ocupacional) | S-2220.xsd | Dia 15 mês seguinte | R$ 500-24k | ✅ |
| S-2230 | Afastamento temporário | S-2230.xsd | Dia 15 mês seguinte (>15d) | R$ 500-24k | ✅ |
| S-2240 | Condições ambientais (SST) | S-2240.xsd | Dia 15 mês seguinte | R$ 500-24k | ✅ |
| S-2250 | Aviso prévio | S-2250.xsd | Antes do término | R$ 500-24k | ✅ |
| S-2299 | Desligamento | S-2299.xsd | **10º dia ou TRCT** | R$ 500-24k | ✅ |
| S-2300 | Trabalhador sem vínculo | S-2300.xsd | Dia 15 mês seguinte | R$ 500-24k | ✅ |
| S-2399 | Término sem vínculo | S-2399.xsd | Dia 15 mês seguinte | R$ 500-24k | ✅ |
| S-2400 | Cadastro beneficiário | S-2400.xsd | Antes do pagamento | R$ 500-24k | ✅ |
| S-1200 | Remuneração | S-1200.xsd | Dia 15 mês seguinte | R$ 500-24k | ✅ |
| S-1202 | Remuneração RPPS | S-1202.xsd | Dia 15 mês seguinte | R$ 500-24k | ⚠️ apenas RPPS |
| S-1207 | Benefícios previdenciários | S-1207.xsd | Dia 15 mês seguinte | R$ 500-24k | ✅ |
| S-1210 | Pagamentos | S-1210.xsd | Dia 15 mês seguinte | R$ 500-24k | ✅ |
| S-1280 | Informações complementares | S-1280.xsd | Antes do S-1299 | R$ 500-24k | ✅ |
| S-1295 | Solicitação de totalizadores | S-1295.xsd | Antes do S-1299 | R$ 500-24k | ✅ |
| S-1298 | Reabertura de eventos | S-1298.xsd | A qualquer tempo | n/a | ✅ |
| S-1299 | Fechamento | S-1299.xsd | Após S-1200/1210 | R$ 500-24k | ✅ |
| S-1300 | Contribuição sindical patronal | S-1300.xsd | Dia 15 mês seguinte | R$ 500-24k | ⚠️ opcional |
| S-3000 | Exclusão/retificação | S-3000.xsd | A qualquer tempo | n/a | ✅ |

## Stack recomendada por linguagem

| Linguagem | Lib open-source | SaaS alternativo |
|---|---|---|
| Node.js | `node-esocial` (limitada) | Tagplus, Domínio, Sage |
| Python | `pyesocial` (incompleta) | Tagplus, Domínio |
| .NET | `EsocialNet` (estável) | Sage, Senior, TOTVS |
| Java | `esocial-client` (estável) | Sage, Senior, TOTVS |
| Go | sem lib madura | SaaS |
| Ruby | sem lib madura | SaaS |
| PHP | `esocial-php` (limitada) | SaaS |

## Exemplo de payload S-2200 (admissão)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<eSocial xmlns="http://www.esocial.gov.br/schema/evt/evtAdmissao/v_S_01_03_00">
  <evtAdmissao Id="ID1234567890123456789012345678901234567890">
    <ideEvento>
      <indRetif>1</indRetif>
      <nrRecibo></nrRecibo>
      <tpAmb>2</tpAmb>  <!-- 1=Produção, 2=Homologação -->
      <procEmi>1</procEmi>
      <verProc>1.0.0</verProc>
    </ideEvento>
    <ideEmpregador>
      <tpInsc>1</tpInsc>
      <nrInsc>12345678000190</nrInsc>
    </ideEmpregador>
    <trabalhador>
      <cpfTrab>12345678909</cpfTrab>
      <nmTrab>Fulano Teste Sintetico</nmTrab>
      <sexo>M</sexo>
      <racaCor>1</racaCor>
      <estCiv>1</estCiv>
      <grauInstr>06</grauInstr>
      <nascimento>
        <dtNascto>1990-01-01</dtNascto>
        <paisNascto>105</paisNascto>
        <paisNac>105</paisNac>
      </nascimento>
    </trabalhador>
    <vinculo>
      <matricula>001</matricula>
      <tpRegTrab>1</tpRegTrab>
      <tpRegPrev>1</tpRegPrev>
      <infoRegimeTrab>
        <infoCeletista>
          <dtAdm>2026-06-01</dtAdm>
          <tpAdmissao>1</tpAdmissao>
          <indAdmissao>1</indAdmissao>
          <tpRegJor>1</tpRegJor>
          <natAtividade>1</natAtividade>
          <dtOpcFGTS>2026-06-01</dtOpcFGTS>
        </infoCeletista>
      </infoRegimeTrab>
      <infoContrato>
        <nmCargo>Analista</nmCargo>
        <CBOCargo>252510</CBOCargo>
        <remuneracao>
          <vrSalFx>3500.00</vrSalFx>
          <undSalFixo>5</undSalFixo>
        </remuneracao>
        <duracao>
          <tpContr>1</tpContr>
        </duracao>
        <localTrabalho>
          <localTrabGeral>
            <tpInsc>1</tpInsc>
            <nrInsc>12345678000190</nrInsc>
          </localTrabGeral>
        </localTrabalho>
      </infoContrato>
    </vinculo>
  </evtAdmissao>
</eSocial>
```

## Validações locais ANTES do envio

1. **CPF:** módulo 11 (skill `validar-cpf-cnpj`).
2. **PIS:** módulo 11 (skill `validar-pis-pasep`).
3. **CBO:** existe na tabela atualizada?
4. **CNAE do empregador:** consistente com S-1000.
5. **Salário:** > salário mínimo nacional / regional aplicável.
6. **Data de admissão:** ≥ hoje (não pode ser retroativa sem retificação).

## Ambiente

- `tpAmb=1` → Produção (real, com efeito legal).
- `tpAmb=2` → Homologação (testes, sem efeito legal).
- `tpAmb=3` → Produção restrita (dados reais, mas ainda sem efeito).

**Hook `validate-esocial-prazo` + FISCAL-003 / ESOCIAL-003** bloqueiam ambiente hardcoded.

## Onde achar schemas XSD oficiais

<https://www.gov.br/esocial/pt-br/documentacao-tecnica/leiautes-esocial-conhecimentos-gerais>

Versionar localmente. Não confiar em URL externo no runtime.
