# Regras de segurança e LGPD da Rede Papaki

## Segredos — nunca registrar

Substitua qualquer valor real por `{{SEGREDO: <nome no cofre>}}`.

| Exemplo encontrado | Substituir por |
|---|---|
| `sk-ant-api03-...`, `sk-proj-...` | `{{SEGREDO: chave API Anthropic - cofre TI}}` |
| `senha: Papaki@2026` | `senha: {{SEGREDO: senha do sistema X}}` |
| Tokens de webhook, `ghp_...`, `xoxb-...`, `AKIA...` | `{{SEGREDO: token <serviço>}}` |
| URL com `?token=...` ou `?key=...` | URL sem o parâmetro + `{{SEGREDO: ...}}` |

Se o usuário colar um segredo na conversa, avise: "Removi a chave do documento. Recomendo trocá-la (rotacionar), pois ela apareceu em texto."

## Dados pessoais — usar placeholders

Documentos descrevem **o processo**, não as pessoas. Substitua por `{{DADO_PESSOAL: <tipo>}}`:

- CPF, RG, CNH, PIS, endereço, telefone pessoal, conta bancária de pessoa física.
- Salário individual, avaliação de desempenho de pessoa identificável, dados de saúde, atestados, dados de candidatos.

Se o processo **trata** dados pessoais (ex.: triagem de currículos, folha), marque `dados_pessoais: sim`, `classificacao: restrito` ou `confidencial`, e preencha a seção "Dados e riscos" com: base legal provável (a confirmar com o jurídico/DPO), onde os dados ficam, quem acessa, e se há revisão humana antes de decisões.

## Classificação

| Valor | Uso |
|---|---|
| `publico` | Pode sair da empresa |
| `interno` | Padrão: qualquer funcionário da área |
| `restrito` | Envolve dados pessoais ou financeiros agregados |
| `confidencial` | Dados sensíveis, estratégicos ou contratuais |

## Revisão humana

Toda automação que toma ou sugere decisão sobre pessoas (contratação, desligamento, crédito, pagamento) deve registrar **quem revisa** a saída da IA antes da decisão. Se o usuário não souber, registre `A confirmar` e destaque na prévia.
