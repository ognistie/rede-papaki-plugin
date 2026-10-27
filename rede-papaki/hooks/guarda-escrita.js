#!/usr/bin/env node
// Trava de gravação da Rede Papaki: hook PreToolUse sobre as ferramentas do MCP deste plugin.
// Leitura passa. Gravação só cria um documento novo, no padrão de nome e sem dado sensível, numa pasta
// de assunto em <vault>/<equipe>/_Entrada/<Assunto>/, e sempre pede a aprovação da pessoa ("ask").
// create_directory só cria essa pasta de assunto. Todo o resto é bloqueado.
// Recebe o evento em JSON pelo stdin; bloqueia com exit 2 e o motivo no stderr (o motivo vai para o Claude).
'use strict';

const fs = require('fs');
const path = require('path');

// Ferramentas só de leitura do @modelcontextprotocol/server-filesystem.
const LEITURA = new Set([
  'read_file',
  'read_text_file',
  'read_media_file',
  'read_multiple_files',
  'list_directory',
  'list_directory_with_sizes',
  'directory_tree',
  'search_files',
  'get_file_info',
  'list_allowed_directories',
]);
const AREA_DA_PASTA = { '01 RH': 'RH', '02 Financeiro': 'FIN', '03 Administração': 'ADM', '04 IA': 'IA' };
const LIMITE_BYTES = 200 * 1024;
// Nome do documento: "<ID> <Título> <AAAA-MM-DD>.md"; todo documento novo tem ID próprio (sem sufixo de versão).
// Mesmo padrão do validador (tools/rede_papaki.py: RE_NOME_DOC, RE_ASSUNTO).
const RE_NOME = /^(RH|FIN|ADM|IA)-(PRC|AUT|PRM|FER)-(\d{3}) [^\\/:*?"<>|]+? (\d{4}-\d{2}-\d{2})\.md$/;
// Pasta de assunto (o "domínio" do documento): até 80 caracteres, sem começar por "_" ou "." nem terminar em espaço ou ".".
const RE_ASSUNTO = /^[^\\/:*?"<>|_. ][^\\/:*?"<>|]{0,78}[^\\/:*?"<>|. ]$|^[^\\/:*?"<>|_. ]$/;

// Mesmas regras de bloqueio do validador (tools/rede_papaki.py: PADROES_SEGREDO, RE_CPF, RE_CNPJ).
const SENSIVEIS = [
  ['CPF', /\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/],
  ['CNPJ', /\b\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}\b/],
  ['chave de API (sk-...)', /\bsk-[A-Za-z0-9_-]{20,}/],
  ['chave de acesso AWS', /\bAKIA[0-9A-Z]{16}\b/],
  ['token do GitHub', /\bgh[pousr]_[A-Za-z0-9]{30,}/],
  ['token do Slack', /\bxox[abprs]-[A-Za-z0-9-]{10,}/],
  ['credencial em texto', /\b(senha|password|passwd|api[_-]?key|token|secret)\b\s*[:=]\s*(?!\{\{)[^\s`|*]{6,}/i],
  ['token em URL', /[?&](token|key|apikey|api_key|access_token)=(?!\{\{)[^\s&]{8,}/i],
];

function chave(caminho) {
  const texto = caminho.normalize('NFC');
  return process.platform === 'win32' ? texto.toLowerCase() : texto;
}

function real(caminho) {
  try {
    return fs.realpathSync.native(caminho);
  } catch {
    return null;
  }
}

function existe(caminho) {
  try {
    fs.lstatSync(caminho);
    return true;
  } catch {
    return false;
  }
}

/** Nomes de todos os .md da pasta da equipe (inclusive subpastas). */
function documentosDaEquipe(raiz) {
  const nomes = [];
  const visitar = (pasta) => {
    let itens = [];
    try {
      itens = fs.readdirSync(pasta, { withFileTypes: true });
    } catch {
      return;
    }
    for (const item of itens) {
      if (item.isDirectory()) visitar(path.join(pasta, item.name));
      else if (item.name.toLowerCase().endsWith('.md')) nomes.push(item.name.normalize('NFC'));
    }
  };
  visitar(raiz);
  return nomes;
}

function hojeLocal() {
  const d = new Date();
  const dois = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${dois(d.getMonth() + 1)}-${dois(d.getDate())}`;
}

/** Valor de uma propriedade no cabeçalho (frontmatter) do documento, ou null. */
function propriedade(conteudo, nome) {
  const cabecalho = /^---\r?\n([\s\S]*?)\r?\n---\s*(\r?\n|$)/.exec(conteudo.replace(/^﻿/, ''));
  if (!cabecalho) return null;
  const linha = new RegExp(`^${nome}:[ \\t]*(.*?)[ \\t]*$`, 'm').exec(cabecalho[1]);
  return linha ? linha[1].replace(/^(["'])(.*)\1$/, '$2') : null;
}

function pedirAprovacao(motivo) {
  return { decisao: 'ask', motivo };
}

function bloquear(motivo) {
  return { decisao: 'deny', motivo: `Rede Papaki: ${motivo}` };
}

/** Decide a chamada: null = segue o fluxo normal; {decisao: 'ask'|'deny', motivo}. */
function decidir(evento, env) {
  const ferramenta = String(evento.tool_name || '').split('__').pop();
  if (LEITURA.has(ferramenta)) return null;
  if (ferramenta !== 'write_file' && ferramenta !== 'create_directory') {
    return bloquear(`"${ferramenta}" está bloqueado. A Rede só cria documentos novos em _Entrada; nunca edita, move nem apaga.`);
  }

  const vault = env.CLAUDE_PLUGIN_OPTION_VAULT;
  const equipe = env.CLAUDE_PLUGIN_OPTION_EQUIPE;
  const area = AREA_DA_PASTA[equipe];
  if (!vault || !area) {
    return bloquear('vault ou equipe não configurados no plugin, gravação bloqueada. Configure com /plugin configure rede-papaki@rede-papaki.');
  }

  const entrada = evento.tool_input || {};
  const alvo = String(entrada.path || '');
  if (!path.isAbsolute(alvo)) return bloquear('informe o caminho absoluto dentro de _Entrada.');
  const pastaEntrada = real(path.join(vault, equipe, '_Entrada'));
  const foraDoPadrao = `só é permitido gravar em "${equipe}/_Entrada/<Assunto>/".`;

  if (ferramenta === 'create_directory') {
    const assunto = path.basename(alvo).normalize('NFC');
    const mae = real(path.dirname(alvo));
    if (!pastaEntrada || !mae || chave(mae) !== chave(pastaEntrada)) return bloquear(foraDoPadrao);
    if (!RE_ASSUNTO.test(assunto)) {
      return bloquear(`nome de pasta de assunto inválido: "${assunto}". Use o nome do assunto, até 80 caracteres, sem \\ / : * ? " < > | e sem começar por "_" ou ".".`);
    }
    return null;
  }

  const conteudo = String(entrada.content || '');
  const pasta = real(path.dirname(alvo));
  if (pastaEntrada && pasta && chave(pasta) === chave(pastaEntrada)) {
    return bloquear(`grave dentro de uma pasta de assunto: "${equipe}/_Entrada/<Assunto>/". Se ela não existir, crie com create_directory.`);
  }
  const mae = pasta && real(path.dirname(pasta));
  if (!pastaEntrada || !mae || chave(mae) !== chave(pastaEntrada)) return bloquear(foraDoPadrao);
  const assunto = path.basename(pasta).normalize('NFC');
  if (!RE_ASSUNTO.test(assunto)) return bloquear(`pasta de assunto fora do padrão: "${assunto}".`);
  if (existe(alvo)) return bloquear('já existe um arquivo com esse nome. Não sobrescreva; use o próximo ID livre.');

  const hoje = hojeLocal();
  const nome = path.basename(alvo).normalize('NFC');
  const partes = RE_NOME.exec(nome);
  if (!partes) {
    return bloquear(`nome fora do padrão. Use "${area}-<PRC|AUT|PRM|FER>-<NNN> <Título> ${hoje}.md" (ID novo, título e a data de hoje).`);
  }
  if (partes[1] !== area) return bloquear(`o ID precisa ser da área ${area} (${equipe}); recebido ${partes[1]}.`);
  if (partes[4] !== hoje) return bloquear(`a data no fim do nome precisa ser a de hoje (${hoje}); recebido ${partes[4]}.`);

  const id = `${partes[1]}-${partes[2]}-${partes[3]}`;
  if (documentosDaEquipe(path.join(vault, equipe)).some((n) => n === `${id}.md` || n.startsWith(`${id} `))) {
    return bloquear(`o ID ${id} já existe na equipe. Todo documento novo, inclusive a continuação de um assunto, usa o próximo número livre.`);
  }

  if (Buffer.byteLength(conteudo, 'utf8') > LIMITE_BYTES) return bloquear('documento maior que 200 KB.');
  if (propriedade(conteudo, 'id') !== id) {
    return bloquear(`o cabeçalho do documento precisa ter "id: ${id}", igual ao nome do arquivo.`);
  }
  if (propriedade(conteudo, 'criado') !== hoje) {
    return bloquear(`o cabeçalho do documento precisa ter "criado: ${hoje}", igual à data do nome.`);
  }
  const achados = SENSIVEIS.filter(([, padrao]) => padrao.test(conteudo)).map(([rotulo]) => rotulo);
  if (achados.length) {
    return bloquear(`dado sensível no texto (${achados.join(', ')}). Troque por {{DADO_PESSOAL: tipo}} ou {{SEGREDO: nome}} e tente de novo.`);
  }

  return pedirAprovacao(`Rede Papaki: anexar "${nome}" em ${equipe}/_Entrada/${assunto}? Confira a prévia antes de aprovar.`);
}

function main() {
  let bruto = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (parte) => (bruto += parte));
  process.stdin.on('end', () => {
    let resultado;
    try {
      resultado = decidir(JSON.parse(bruto), process.env);
    } catch (erro) {
      resultado = bloquear(`evento ilegível pela trava de gravação (${erro.message}); chamada bloqueada.`);
    }
    if (resultado && resultado.decisao === 'deny') {
      process.stderr.write(resultado.motivo + '\n');
      process.exit(2);
    }
    if (resultado && resultado.decisao === 'ask') {
      process.stdout.write(JSON.stringify({
        hookSpecificOutput: {
          hookEventName: 'PreToolUse',
          permissionDecision: 'ask',
          permissionDecisionReason: resultado.motivo,
        },
      }));
    }
    process.exit(0);
  });
}

if (require.main === module) main();

module.exports = { decidir };
