#!/usr/bin/env node
// Trava de gravação da Rede Papaki: hook PreToolUse sobre as ferramentas do MCP deste plugin.
// Leitura passa. Gravação só cria um documento novo, no padrão de nome e sem dado sensível, em
// <vault>/<equipe>/_Entrada/, e sempre pede a aprovação da pessoa ("ask"). Todo o resto é bloqueado.
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
const RE_NOME = /^(RH|FIN|ADM|IA)-(PRC|AUT|PRM|FER)-(\d{3}) [^\\/:*?"<>|]+?( \(v\d+\.\d+\.\d+\))?\.md$/;

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
  if (ferramenta !== 'write_file') {
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
  const conteudo = String(entrada.content || '');
  if (!path.isAbsolute(alvo)) return bloquear('informe o caminho absoluto do arquivo dentro de _Entrada.');

  const pastaEntrada = real(path.join(vault, equipe, '_Entrada'));
  const pasta = real(path.dirname(alvo));
  if (!pastaEntrada || !pasta || chave(pastaEntrada) !== chave(pasta)) {
    return bloquear(`só é permitido gravar direto em "${equipe}/_Entrada/".`);
  }
  if (existe(alvo)) return bloquear('já existe um arquivo com esse nome em _Entrada. Não sobrescreva; proponha o próximo ID.');

  const nome = path.basename(alvo).normalize('NFC');
  const partes = RE_NOME.exec(nome);
  if (!partes) {
    return bloquear(`nome fora do padrão. Use "${area}-<PRC|AUT|PRM|FER>-<NNN> <Título>.md" (ou "… (vX.Y.Z).md" para nova versão).`);
  }
  if (partes[1] !== area) return bloquear(`o ID precisa ser da área ${area} (${equipe}); recebido ${partes[1]}.`);

  const id = `${partes[1]}-${partes[2]}-${partes[3]}`;
  const usado = documentosDaEquipe(path.join(vault, equipe)).some((n) => n === `${id}.md` || n.startsWith(`${id} `));
  if (!partes[4] && usado) return bloquear(`o ID ${id} já existe na equipe. Use o próximo número livre.`);
  if (partes[4] && !usado) return bloquear(`nova versão de ${id}, mas esse ID não existe na equipe.`);

  if (Buffer.byteLength(conteudo, 'utf8') > LIMITE_BYTES) return bloquear('documento maior que 200 KB.');
  if (!new RegExp(`^---[\\s\\S]*?^id:\\s*["']?${id}["']?\\s*$`, 'm').test(conteudo.replace(/^﻿/, ''))) {
    return bloquear(`o cabeçalho do documento precisa ter "id: ${id}", igual ao nome do arquivo.`);
  }
  const achados = SENSIVEIS.filter(([, padrao]) => padrao.test(conteudo)).map(([rotulo]) => rotulo);
  if (achados.length) {
    return bloquear(`dado sensível no texto (${achados.join(', ')}). Troque por {{DADO_PESSOAL: tipo}} ou {{SEGREDO: nome}} e tente de novo.`);
  }

  return pedirAprovacao(`Rede Papaki: anexar "${nome}" em ${equipe}/_Entrada? Confira a prévia antes de aprovar.`);
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
