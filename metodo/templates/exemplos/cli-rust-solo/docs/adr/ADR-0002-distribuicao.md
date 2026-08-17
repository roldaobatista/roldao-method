---
id: ADR-0002
titulo: Distribuir tempo-cli via cargo install + binários pré-compilados em GitHub Releases
status: aceita
data-proposta: 2026-05-22
data-aceite: 2026-05-26
depende-de: [ADR-0001]
bloqueia-fase: F-2
superseded-by:
owner: roldao
ultima-conferencia: 2026-05-27
idioma: pt-BR
limite-linhas: 100
proposito: exemplo preenchido do meta-template para referência e comparação
---

# ADR-0002: Distribuir tempo-cli via cargo install + binários pré-compilados em GitHub Releases

## Contexto

ADR-0001 fixou Rust. Agora é preciso decidir **como o usuário final instala** o `tempo-cli`. O usuário-alvo é dev terminal-first, mas isso não significa que ele tenha Rust instalado — muitos devs trabalham em Node/Python/Go e não têm `cargo`.

Restrições:
- Sem servidor próprio (decisão fundadora D-001).
- Sem custo recorrente (não vamos pagar Cloudflare R2 ou similar pra hospedar binários).
- O usuário precisa conseguir instalar em até 1 comando.

## Opções consideradas

### Opção 1: Só `cargo install tempo-cli`

- **Prós:** zero infraestrutura — crates.io hospeda; comando único; atualização via `cargo install --force tempo-cli`.
- **Contras:** exige Rust instalado no usuário (~1.5GB de toolchain); usuário não-Rust vai abandonar.
- **Custo:** zero.

### Opção 2: Só binários pré-compilados via GitHub Releases + script `curl | sh`

- **Prós:** instalação rápida para usuário sem Rust; padrão usado por `gh`, `starship`, `rustup`.
- **Contras:** precisa CI gerando binários para 3+ alvos a cada release; script `curl | sh` tem péssima reputação de segurança (e o dono concorda); usuário paranoico tem que baixar binário manualmente.
- **Custo:** médio. ~2 dias setando GitHub Actions de release.

### Opção 3: Crates.io + GitHub Releases (binários) — duas vias

- **Prós:** atende ambos os públicos. Dev Rust faz `cargo install tempo-cli`; dev não-Rust baixa binário pré-compilado de https://github.com/roldao/tempo-cli/releases. README mostra ambas opções.
- **Contras:** dois caminhos pra manter; o release script precisa fazer as duas coisas em sequência (publicar no crates.io + tag no GitHub + binários no Release).
- **Custo:** médio-alto na primeira vez. ~3 dias. Depois é só rodar o workflow.

### Opção 4: Adicionar Homebrew + Scoop + AUR

- **Prós:** instalação one-liner em cada gerenciador nativo.
- **Contras:** cada gerenciador exige manutenção (formula no Homebrew, manifest no Scoop, PKGBUILD no AUR); overhead alto para projeto solo; pode ser adicionado depois quando houver demanda.
- **Custo:** alto. ~1 semana inicial + manutenção contínua. **Adiar.**

## Decisão

Escolhemos a **Opção 3: Crates.io + GitHub Releases (binários)**.

Justificativa: cobre ambos os públicos (Rust e não-Rust) sem custo recorrente. Crates.io e GitHub são gratuitos para OSS. O script `curl | sh` da Opção 2 está descartado por segurança — o README vai recomendar download manual do binário + verificação de checksum publicado no Release.

Opção 4 (Homebrew/Scoop/AUR) fica como **ADR futura** quando houver pelo menos 100 estrelas no repo (sinal de demanda real).

## Consequências

### Positivas
- Cobertura ampla (Rust + não-Rust) com infraestrutura zero do nosso lado.
- Versionamento sincronizado: a tag `v0.X.Y` no Git dispara ambos os publishes.
- Checksums publicados permitem que o usuário valide a integridade.

### Negativas
- Workflow de release tem mais passos (crates.io + GH Release + checksums). Documentado em `docs/operacao/release.md` (a criar antes do primeiro release).
- `cargo publish` é irreversível (versão N nunca pode ser republicada). Cada release exige changelog cuidadoso e aprovação humana — já operacionalizado em `AGENTS.md §13` (cargo publish está na lista destrutiva).

### Reversibilidade
Alta. Se quisermos voltar para "só crates.io", basta parar de criar Releases — nada quebra. Se quisermos adicionar Homebrew, é incremento, não substituição.

## Non-goals

Esta ADR NÃO decide:
- Política de versionamento (semver vs calendar) — assunto de ADR-0003 quando v0.x → v1.x.
- Sign de binários (Apple notarization, Windows code signing) — adiar até primeiro relato de "Windows Defender bloqueou".
- Auto-update do CLI (`tempo self-update`) — adiar até pedido explícito.

## Como validar (gates)

- [ ] `.github/workflows/release.yml` existe e dispara em tag `v*`.
- [ ] Workflow publica crate em crates.io.
- [ ] Workflow gera binários para `x86_64-unknown-linux-gnu`, `x86_64-pc-windows-gnu`, `x86_64-apple-darwin`, `aarch64-apple-darwin`.
- [ ] Workflow gera arquivo `SHA256SUMS` com checksums e anexa ao Release.
- [ ] README documenta ambas as formas de instalar.
- [ ] `docs/operacao/release.md` documenta o procedimento manual (em caso do workflow falhar).

## Referências

- ADR-0001 (stack Rust — pré-requisito).
- https://github.com/cli/cli/releases (`gh` como referência de layout de Release).
- https://github.com/starship/starship (referência de workflow de release multi-target Rust).
- https://doc.rust-lang.org/cargo/reference/publishing.html
