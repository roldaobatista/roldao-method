---
name: emitir-sat-cfe
description: Guia de implementação para emissão de SAT-CF-e modelo 59 (exclusivo SP). Use ao implementar PDV no estado de São Paulo OU ao auditar emissão SAT existente.
---

# emitir-sat-cfe

SAT-CF-e (Cupom Fiscal Eletrônico — Sistema Autenticador e Transmissor) é o documento fiscal de varejo do estado de São Paulo. Modelo 59. Equipamento físico (caixa SAT) + software.

## Quando usar

- PDV em loja física **no estado de São Paulo**.
- Substituição de ECF (emissor de cupom fiscal — legado).

## Quando NÃO usar

- Demais UFs → usar NFC-e mod 65.
- CE → usar MFE.

## Características

- **Funciona offline.** Por design — equipamento SAT autoriza local com certificado próprio.
- **Sincronização a cada 5 dias úteis.** Senão, SAT bloqueia.
- **CFe-SAT XML** + impressão de extrato em impressora não-fiscal.
- **MFE-SP** (Memória Fiscal de Estoque Pessoal) — equipamento físico.

## Estrutura mínima do XML CFe

```xml
<?xml version="1.0" encoding="UTF-8"?>
<CFe>
  <infCFe Id="CFeXXXXXXXX...">
    <ide>
      <CNPJ>12345678000190</CNPJ>
      <signAC>...</signAC>
      <numeroCaixa>001</numeroCaixa>
    </ide>
    <emit>
      <CNPJ>12345678000190</CNPJ>
      <IE>123456789012</IE>
      <indRatISSQN>N</indRatISSQN>
    </emit>
    <dest>
      <!-- opcional para cliente CPF/CNPJ -->
      <CPF>12345678909</CPF>
    </dest>
    <det nItem="1">
      <prod>
        <cProd>00001</cProd>
        <cEAN>7891234567890</cEAN>
        <xProd>Produto Teste</xProd>
        <NCM>22030000</NCM>
        <CFOP>5102</CFOP>
        <uCom>UN</uCom>
        <qCom>1.0000</qCom>
        <vUnCom>10.00</vUnCom>
        <vProd>10.00</vProd>
        <indRegra>A</indRegra>
      </prod>
      <imposto>
        <ICMS>
          <ICMS00>
            <Orig>0</Orig>
            <CST>00</CST>
            <pICMS>18.00</pICMS>
          </ICMS00>
        </ICMS>
        <PIS>
          <PISAliq>
            <CST>01</CST>
            <vBC>10.00</vBC>
            <pPIS>1.65</pPIS>
            <vPIS>0.17</vPIS>
          </PISAliq>
        </PIS>
        <COFINS>
          <COFINSAliq>
            <CST>01</CST>
            <vBC>10.00</vBC>
            <pCOFINS>7.60</pCOFINS>
            <vCOFINS>0.76</vCOFINS>
          </COFINSAliq>
        </COFINS>
      </imposto>
    </det>
    <total>
      <ICMSTot>
        <vICMS>1.80</vICMS>
        <vProd>10.00</vProd>
      </ICMSTot>
      <vCFe>10.00</vCFe>
    </total>
    <pgto>
      <MP>
        <cMP>01</cMP>  <!-- 01=Dinheiro, 02=Cheque, 03=Cartao Credito, 04=Cartao Debito, 05=Crediario, 10=Vale Alimentacao, 11=Vale Refeicao, 12=Vale Presente, 13=Vale Combustivel, 17=Pix, 99=Outros -->
        <vMP>10.00</vMP>
      </MP>
    </pgto>
  </infCFe>
</CFe>
```

## Checklist de implementação

- [ ] Equipamento SAT validado (chave do equipamento — `signAC` calculada).
- [ ] CNPJ do contribuinte ativado no SAT (1x por equipamento).
- [ ] Tabela de produtos com NCM, CFOP, CST corretos.
- [ ] Regra tributária por estado (alíquotas ICMS, PIS, COFINS, ST).
- [ ] Impressora não-fiscal validada (cupom-teste no startup — PDV-003).
- [ ] Modo de pagamento (cMP) cobre o que cliente aceita.
- [ ] Sincronização periódica (5 dias úteis máx).
- [ ] Cancelamento (até 30 min) implementado.
- [ ] Backup XML local + sincronização com retaguarda.

## Cancelamento

Até 30 min do CFe original. Envia CFe-Cancelamento referenciando o original.

## Anti-padrões

| Errado | Por quê | Certo |
|---|---|---|
| Tentar emitir online sem SAT físico | SAT exige equipamento | Comprar SAT homologado |
| Sem sincronização 5 dias | SAT bloqueia | Cron de sync |
| NCM/CFOP errado | Vira pendência fiscal | Tabela curada + validação no cadastro |
| Sem cupom-teste no startup | Caixa vende sem imprimir | Validar PDV-003 |
| `tpAmb` hardcoded | Vai pra produção em dev | Variável de ambiente (FISCAL-003) |

## Stack recomendada

| Linguagem | Lib |
|---|---|
| .NET | SDK oficial do SAT (Bematech, Sweda, Elgin) |
| Java | `sat-fiscal` (open-source) |
| C++ | DLL nativa do equipamento |
| Node.js | wrapper FFI da DLL ou via subprocess |

## Documentação oficial

- SAT-CF-e SP: <https://portal.fazenda.sp.gov.br/servicos/sat>
- Manual de Orientação do Contribuinte SAT-CF-e (vigente).
- Skills relacionadas: `emitir-nfce` (demais UF), `integrar-balanca-impressora`.
