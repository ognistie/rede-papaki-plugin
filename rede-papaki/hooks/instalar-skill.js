#!/usr/bin/env node
// Instala a skill como skill pessoal (~/.claude/skills/rede-papaki), para o comando ser só /rede-papaki.
// Skills dentro de plugin sempre ganham o prefixo do plugin (/rede-papaki:rede-papaki).
// Roda no SessionStart: só copia quando o conteúdo mudou. Nunca derruba a sessão; erros vão para o stderr.
'use strict';

const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');

const NOME = 'rede-papaki';

function arquivos(raiz, base = raiz, lista = new Map()) {
  for (const item of fs.readdirSync(raiz, { withFileTypes: true })) {
    const caminho = path.join(raiz, item.name);
    if (item.isDirectory()) arquivos(caminho, base, lista);
    else if (item.isFile()) {
      const hash = crypto.createHash('sha256').update(fs.readFileSync(caminho)).digest('hex');
      lista.set(path.relative(base, caminho).split(path.sep).join('/'), hash);
    }
  }
  return lista;
}

function iguais(a, b) {
  if (a.size !== b.size) return false;
  for (const [rel, hash] of a) if (b.get(rel) !== hash) return false;
  return true;
}

/** Copia a skill para <configDir>/skills/rede-papaki se mudou. Devolve true quando instalou. */
function instalar(origem, configDir) {
  const destino = path.join(configDir, 'skills', NOME);
  const novos = arquivos(origem);
  if (fs.existsSync(destino) && iguais(novos, arquivos(destino))) return false;

  const temporario = `${destino}.instalando-${process.pid}`;
  fs.rmSync(temporario, { recursive: true, force: true });
  fs.cpSync(origem, temporario, { recursive: true });
  fs.rmSync(destino, { recursive: true, force: true });
  fs.renameSync(temporario, destino);
  return true;
}

function main() {
  const origem = path.join(__dirname, '..', 'skill', NOME);
  const configDir = process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude');
  try {
    if (instalar(origem, configDir)) {
      process.stderr.write(`Rede Papaki: skill /${NOME} instalada/atualizada em ${configDir}.\n`);
    }
  } catch (erro) {
    process.stderr.write(`Rede Papaki: não foi possível instalar a skill /${NOME} (${erro.message}).\n`);
  }
  process.exit(0);
}

if (require.main === module) main();

module.exports = { instalar };
