# Rede Papaki — plugin do Claude Code

Liga o Claude ao Segundo Cérebro de IA da Papaki. Com ele, você **documenta**, **consulta** e **analisa** os processos, automações, prompts e ferramentas de IA da sua equipe com o comando `/rede-papaki`.

Este repositório tem só o plugin (skill, trava de gravação e conexão com o vault). Os documentos ficam no vault da pasta compartilhada da empresa, nunca aqui.

## Instalar

**Antes, uma vez por computador:** instale o Node.js, que roda a conexão com o vault.

```bash
winget install OpenJS.NodeJS.LTS
```

**No Claude Code**, adicione o marketplace e instale o plugin:

```
/plugin marketplace add ognistie/rede-papaki-plugin
/plugin install rede-papaki@rede-papaki
/reload-plugins
```

Na instalação, o Claude Code pergunta:

| Pergunta | O que responder |
|---|---|
| Pasta do vault Rede Papaki | O caminho da pasta compartilhada que o Time de IA passar (ex.: `\\SERVIDOR\Compartilhado\Rede Papaki`) |
| Sua equipe | `01 RH`, `02 Financeiro`, `03 Administração` ou `04 IA` |
| Escopo de acesso | Deixe `setor`. Só o RH usa `todos-os-setores` e o Time de IA, `administrador` |

Depois, **abra uma sessão nova**. Ela começa com a linha `Rede Papaki: setor do usuário = … · escopo = …` e o comando `/rede-papaki` já funciona.

## Usar

- `/rede-papaki documentar <o que você faz com IA>` — monta o documento no padrão, mostra a prévia e só grava com o seu "sim", na pasta `_Entrada` da sua equipe.
- `/rede-papaki consultar <pergunta>` — responde com base nos documentos aprovados, citando a fonte.
- `/rede-papaki analisar` — mostra o que está incompleto, o que vence revisão e as ferramentas mais usadas.

Também funciona em linguagem natural: "documenta isso na Rede", "temos automação para cobrança?".

## Segurança

- O Claude só enxerga `00 Políticas e Documentação` e a pasta da sua equipe (ou mais, se o seu escopo permitir).
- Ele só **cria** documentos novos em `<sua equipe>/_Entrada/<Assunto>/`, sempre pedindo sua aprovação. Nunca edita, move nem apaga.
- CPF, CNPJ, senhas e chaves são bloqueados na gravação. Mesmo assim, **não cole dados pessoais nem segredos no chat**.
- O acesso de verdade é garantido pelas permissões da pasta compartilhada; mudar o escopo na configuração não libera pastas que o Windows nega.

## Mudar a configuração, atualizar e desinstalar

| O quê | Como |
|---|---|
| Trocar vault, equipe ou escopo | `/plugin configure rede-papaki@rede-papaki` e abrir sessão nova |
| Receber a versão nova | `/plugin marketplace update rede-papaki` e depois `/reload-plugins` |
| Desinstalar | `/plugin uninstall rede-papaki@rede-papaki` e apagar a pasta `%USERPROFILE%\.claude\skills\rede-papaki` |

## Problemas comuns

| Sintoma | O que fazer |
|---|---|
| `/rede-papaki` não aparece | Abra uma sessão nova |
| "Rede desconectada" ou o Claude não acha o vault | Confira `node --version` e o caminho do vault em `/plugin configure rede-papaki@rede-papaki` |
| O Claude vê pastas de outras equipes | Pare de usar e avise o Time de IA |
| A gravação foi bloqueada | Leia o motivo: a skill corrige nome, ID, data ou dado sensível e tenta de novo |

Dúvidas: Time de IA.
