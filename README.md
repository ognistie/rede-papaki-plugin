# Rede Papaki — skill do Claude

Liga o Claude ao Segundo Cérebro de IA da Papaki. Com ele, você **documenta**, **consulta** e **analisa** os processos, automações, prompts e ferramentas de IA da sua equipe.

Você não instala mais nada: a skill conversa com o servidor da Rede Papaki pela internet, e você entra com a sua conta Google `@papaki.com.br`. Os documentos ficam no vault da empresa, nunca aqui.

## Instalar

### Claude Desktop ou claude.ai

1. *Configurações* › *Conectores* › **Rede Papaki** › *Conectar*.
2. Clique em **Permitir** e entre com a sua conta Google `@papaki.com.br`.
3. Se a skill **rede-papaki** não aparecer em *Personalizar* › *Habilidades*, baixe o `rede-papaki.zip` que o Time de IA passar, clique em *Adicionar* › *Fazer upload de uma habilidade* e ative.

### Claude Code

```
/plugin marketplace add ognistie/rede-papaki-plugin
/plugin install rede-papaki@rede-papaki
/reload-plugins
```

Depois, em `/mcp`, escolha **rede-papaki** › *Authenticate* e entre com a conta Google `@papaki.com.br`.

O seu setor e o que você pode ver são definidos pelo Time de IA. Se aparecer "ainda não tem acesso", peça a ele.

## Usar

Peça em linguagem natural:
- *"Documenta esse processo na Rede"* — monta o documento no padrão, mostra a prévia e só grava com o seu "sim", em `_Entrada` da sua equipe.
- *"Temos automação para cobrança?"*, *"Como funciona o FIN-PRC-001?"* — responde com base nos documentos aprovados, citando a fonte.
- *"O que está incompleto na minha equipe?"* — mostra pendências, revisões vencidas e as ferramentas mais usadas.

No Claude Code também dá para chamar `/rede-papaki:rede-papaki`.

## Segurança

- Você só enxerga `00 Políticas e Documentação` e a pasta da sua equipe (ou mais, se o seu escopo permitir).
- O Claude só **cria** documentos novos em `<sua equipe>/_Entrada/<Assunto>/`, depois do seu "sim". Nunca edita, move nem apaga.
- CPF, CNPJ, senhas e chaves são bloqueados pelo servidor. Mesmo assim, **não cole dados pessoais nem segredos no chat**.
- Cada documento gravado registra o seu e-mail.

## Atualizar e desinstalar

| O quê | Como |
|---|---|
| Versão nova (Claude Code) | `/plugin marketplace update rede-papaki` e `/reload-plugins` |
| Versão nova (Desktop/claude.ai) | Envie o zip novo, ou aguarde o Time de IA atualizar a skill da organização |
| Desconectar | *Configurações* › *Conectores* › **Rede Papaki** › *Desconectar* (Claude Code: `/plugin uninstall rede-papaki@rede-papaki`) |

Tinha a versão 2 no Claude Code? Depois de atualizar, apague a pasta `%USERPROFILE%\.claude\skills\rede-papaki`.

## Problemas comuns

| Sintoma | O que fazer |
|---|---|
| "Rede desconectada" | Conecte (ou reconecte) o conector Rede Papaki e entre com a conta @papaki.com.br |
| "ainda não tem acesso à Rede Papaki" | Peça ao Time de IA para incluir o seu e-mail |
| "só contas @papaki.com.br" | Saia da conta pessoal e entre com a da empresa |
| A gravação foi recusada | Leia o motivo: a skill corrige ID, título, assunto ou dado sensível e tenta de novo |

Dúvidas: Time de IA.
