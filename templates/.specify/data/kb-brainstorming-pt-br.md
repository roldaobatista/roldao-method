---
owner: framework
revisado-em: 2026-05-18
status: stable
---

# KB — Brainstorming em PT-BR

> 15 técnicas adaptadas ao contexto brasileiro pra usar em `/prd`, `/epico`, `/inicio`, `/brownfield`, `/retro` e na skill `brainstormar-ideia`.

---

## Como escolher

| Situação | Técnica recomendada |
|---|---|
| Time travado, precisa volume de ideias rápido | Crazy 8s, Brainwriting 6-3-5 |
| Ideia já existe, falta refinar | Seis Chapéus, SCAMPER |
| Não consegue ver o problema | Inversão, Reverse Brainstorming |
| Risco de fracasso no lançamento | Pre-mortem |
| Causa raiz de bug recorrente | 5 Porquês |
| Decisão entre alternativas | First Principles, Six Universal Questions |
| Time silencioso/heterogêneo | Round Robin, Brainwriting |
| Reunião monopolizada por 1 voz | Brainwriting silencioso, Yes-And |

---

## DIVERGIR (gerar muitas ideias)

### 1. Brainwriting 6-3-5

**O quê:** 6 pessoas, 3 ideias cada, 5 minutos. Passa folha pro lado, próximo adiciona 3 (pode complementar).
**Quando:** quando precisa volume sem influência de hierarquia ou "alpha voice".
**Por quê funciona:** silêncio neutraliza dominância; iteração força construção sobre o anterior.
**Adaptação BR:** funciona online via Google Docs compartilhado, 1 aba por pessoa.

### 2. Crazy 8s (Design Sprint)

**O quê:** 8 ideias diferentes, 1 por minuto, em 8 min. Folha dobrada em 8.
**Quando:** UI/UX; opções de tela; layouts alternativos.
**Por quê funciona:** timeboxing brutal mata o filtro interno ("essa é ruim").
**Output:** 8 esboços, escolhe 2-3 pra prototipar.

### 3. SCAMPER

**O quê:** 7 perguntas sobre algo existente:
- **S**ubstituir — trocar parte por outra
- **C**ombinar — juntar com outra coisa
- **A**daptar — copiar de domínio diferente
- **M**odificar/Magnificar — exagerar atributo
- **P**ôr em outro uso — função alternativa
- **E**liminar — remover etapa/feature
- **R**everter — inverter ordem/papel

**Quando:** evoluir produto/feature existente; redesign.

### 4. Random Stimulation (Estímulo Aleatório)

**O quê:** sortear palavra/imagem fora do contexto e forçar conexão com o problema.
**Quando:** time engasgado, ideias todas iguais.
**Adaptação BR:** dicionário aleatório, lista Wikipedia BR aleatória, foto aleatória do Unsplash.

### 5. Reverse Brainstorming (Brainstorming Reverso)

**O quê:** em vez de "como resolver X?", pergunte "como GARANTIR que X falhe?". Depois inverta as respostas.
**Quando:** problema parece sem ângulo de ataque.
**Exemplo:** "como garantir que ninguém use o app?" → respostas → inverter pra plano de adoção.

### 6. Worst Possible Idea

**O quê:** proponha a pior ideia possível com cara séria. Time critica. Da crítica nascem boas ideias.
**Quando:** clima sério demais, time tenso, autocensura alta.

---

## CONVERGIR (refinar e escolher)

### 7. Seis Chapéus do Pensamento (Edward de Bono)

**O quê:** 6 perspectivas obrigatórias, 1 por vez. Todo mundo "veste o mesmo chapéu" ao mesmo tempo.

| Chapéu | Foco |
|---|---|
| 🟦 Azul | Processo, gestão da reunião, próximos passos |
| ⚪ Branco | Fatos, dados, números — sem opinião |
| 🔴 Vermelho | Emoção, intuição, sentimento — sem justificar |
| ⚫ Preto | Crítica, riscos, problemas — só negativo |
| 🟡 Amarelo | Otimismo, benefícios, valor — só positivo |
| 🟢 Verde | Criatividade, alternativas, novidades |

**Quando:** decisão complexa com múltiplos stakeholders.
**Adaptação BR:** se cultura tem aversão a confronto, começar pelo Amarelo antes do Preto.

### 8. Round Robin

**O quê:** roda a mesa, cada um faz 1 crítica ou pergunta sobre 1 ideia. Sem repetir.
**Quando:** time grande, garante voz de todos.

### 9. Mind Map (Mapa Mental)

**O quê:** tema no centro, ramos hierárquicos. Visual.
**Quando:** escopo amplo, precisa visualizar relações.
**Ferramenta BR:** Whimsical, Miro, Excalidraw, papel/quadro.

### 10. Six Universal Questions

**O quê:** Quem? O quê? Quando? Onde? Por quê? Como?
**Quando:** definir escopo de feature/iniciativa de forma estruturada.
**Adaptação BR:** usar as 6 como seções iniciais do PRD curto.

---

## ANALISAR (diagnóstico de causa/risco)

### 11. 5 Porquês (Toyota)

**O quê:** pergunte "por quê?" 5x sobre o problema. A 5ª resposta geralmente é causa raiz.
**Exemplo:**
- "A NF-e não foi emitida"
  - Por quê? "Certificado expirou"
  - Por quê? "Ninguém renovou"
  - Por quê? "Não há alerta de vencimento"
  - Por quê? "Sistema não monitora data do cert"
  - Por quê? "Não tinha requisito no PRD original"
- **Causa raiz:** PRD não cobriu observabilidade do certificado.

**Quando:** bug recorrente, incidente, post-mortem.
**Aplica REGRA #0** — usado pelo agente `investigador`.

### 12. Pre-mortem (Gary Klein)

**O quê:** "imagine que estamos em 6 meses e este projeto fracassou. Por quê?".
**Quando:** antes de lançar feature/iniciativa de risco.
**Output:** lista de cenários de falha → priorizar mitigação.

### 13. First Principles (Elon Musk style)

**O quê:** quebre o problema até axiomas inquestionáveis. Reconstrua sem amarras de "como sempre fizemos".
**Quando:** problema parece bloqueado por convenção/legado.
**Exemplo BR:** "por que NF-e usa XML?" → "porque SEFAZ exige" → "axioma: comunicação SEFAZ é XML. Mas internamente NÃO PRECISA usar XML."

### 14. Inversão

**O quê:** "qual é o oposto da pergunta?". Resolva o oposto, depois inverta.
**Quando:** problema parece intratável de frente.
**Exemplo:** "como reter cliente?" → "como expulsar cliente?" → cataloga atritos → remove.

---

## DECIDIR

### 15. Yes-And Construtivo

**O quê:** regra do improviso: nunca diga "não, mas..." — sempre "sim, e...". Cada nova ideia ESTENDE a anterior.
**Quando:** time crítico demais, mata ideias antes de explorar.
**Adaptação BR:** em cultura BR, "sim, e" parece concordância forçada. Use "interessante, e podemos somar X".

---

## Anti-padrões em brainstorming

- Reunião sem timebox → vira terapia.
- Reunião sem facilitador → uma voz domina.
- "Brainstorming livre" sem técnica → 80% do tempo conversando.
- Julgar ideia na fase de divergir → mata o fluxo.
- Convergir sem critério explícito → vence o mais barulhento.
- Não documentar → ideia boa some na semana seguinte.

---

## Integração com outros artefatos

- **PRD:** Seções "Discovery" e "Alternatives Considered" devem citar a técnica usada.
- **ADR:** "Decisão" deve referenciar Pre-mortem se houver risco material.
- **Retro:** usar Six Hats pra retro estruturado.
- **`/bug`:** investigador usa 5 Porquês obrigatoriamente.
