'use strict';
/* =========================================================
   Escala – Auxiliares da Porta (app único, 4 escalas)
   Dados salvos no navegador (localStorage) — não precisa
   carregar JSON ao abrir.
   ========================================================= */

const STORAGE_KEY = 'escalaPorta.v4';
const LAST_KEY = 'escalaPorta.ultima';
const DIA_MS = 864e5;
const DIAS_CURTOS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

/* ---------- utilidades ---------- */
const mod = (a, n) => ((a % n) + n) % n;
const esc = s => String(s ?? '').replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clone = o => JSON.parse(JSON.stringify(o));
const toUTC = str => { const [y, m, d] = str.split('-').map(Number); return Date.UTC(y, m - 1, d); };
const hojeUTC = () => { const t = new Date(); return Date.UTC(t.getFullYear(), t.getMonth(), t.getDate()); };
const fmtData = ms => { const d = new Date(ms); return `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}/${d.getUTCFullYear()}`; };
const semanas = (baseStr, ms) => Math.round((ms - toUTC(baseStr)) / (7 * DIA_MS));
const splitNomes = txt => String(txt || '').split(/\s*[-,;]\s*|\n/).map(s => s.trim()).filter(Boolean);

/* ---------- posições ---------- */
function posicoes(v) {
  return [
    { nome: 'Pedido de Oração', vagas: v[0] },
    { nome: 'Átrio', vagas: v[1] },
    { nome: 'Porta do Meio', vagas: v[2] },
    { nome: 'Banheiro', vagas: v[3] }
  ];
}

/* Rodízio automático: a cada culto a lista anda uma casa */
function gerarCiclo(nomes, pos) {
  const rows = [];
  for (let k = 0; k < nomes.length; k++) {
    const rot = nomes.slice(k).concat(nomes.slice(0, k));
    let i = 0;
    rows.push(pos.map(p => { const s = rot.slice(i, i + p.vagas); i += p.vagas; return s; }));
  }
  return rows;
}

/* ---------- dados padrão (planilhas 2º semestre 2026) ---------- */
function dadosPadrao() {
  const posQuinta = posicoes([1, 2, 1, 1]);
  const posSabado = posicoes([1, 2, 1, 1]);
  const posDomingo = posicoes([1, 2, 1, 1]);
  return {
    versao: 4,
    pin: '1234',
    escalas: [
      {
        id: 'quinta', nome: 'Quinta – Culto Oficial', curto: 'Quinta', dia: 4, tipo: 'fixa',
        posicoes: posQuinta, dataBase: '2026-07-02',
        ciclo: gerarCiclo(['JOSÉ LOPES', 'GERALDO', 'VALENTINO', 'ANTÔNIO', 'ADONIAS'], posQuinta)
      },
      {
        id: 'sabado', nome: 'Sábado – Culto Oficial', curto: 'Sábado', dia: 6, tipo: 'fixa',
        posicoes: posSabado, dataBase: '2026-07-04',
        ciclo: gerarCiclo(['JULIO', 'DJALMA', 'CARLINHOS', 'EDSON', 'CIDINHO'], posSabado)
      },
      {
        id: 'domingo', nome: 'Domingo – Culto Oficial', curto: 'Domingo', dia: 0, tipo: 'fixa',
        posicoes: posDomingo, dataBase: '2026-07-05',
        ciclo: gerarCiclo(['VALDEMIR', 'ODAIR', 'JOÃO', 'AIRTON', 'ISRAEL', 'GILSON'], posDomingo)
      },
      {
        id: 'jovens', nome: 'Domingo – Culto de Jovens', curto: 'Jovens', dia: 0, tipo: 'grupos',
        posicoes: posicoes([1, 1, 1, 1]), dataBase: '2026-11-22',
        // rodízio das posições igual ao app antigo (escala.json v7):
        // conta os domingos desde 04/01/2026 e gira a lista uma casa por domingo
        rotBase: '2026-01-04',
        grupos: [
          { nome: 'Grupo 1', membros: ['Claudeci', 'Willian', 'Casé', 'Rodrigo'] },
          { nome: 'Grupo 2', membros: ['Jorge', 'Milton', 'Luis', 'Arthur'] },
          { nome: 'Grupo 3', membros: ['Edvaldo', 'Rafael', 'Pedro', 'Marcelo'] }
        ]
      }
    ]
  };
}

/* ---------- persistência ---------- */
function carregar() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const d = JSON.parse(raw);
      if (d && Array.isArray(d.escalas) && d.escalas.length) return d;
    }
  } catch (e) { console.warn('Falha ao ler dados salvos', e); }
  const d = dadosPadrao();
  salvar(d);
  return d;
}
function salvar(d) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); }
  catch (e) { alert('Não foi possível salvar no navegador: ' + e.message); }
}

/* ---------- motor da escala ---------- */
function escalaDoDia(e, ms) {
  const w = semanas(e.dataBase, ms);
  if (e.tipo === 'fixa') {
    if (!e.ciclo.length) return { grupo: null, celulas: e.posicoes.map(() => []) };
    const row = e.ciclo[mod(w, e.ciclo.length)];
    return { grupo: null, celulas: e.posicoes.map((p, i) => row[i] || []) };
  }
  // grupos com revezamento
  const G = e.grupos.length;
  const g = mod(w, G);
  const rot = semanas(e.rotBase || e.dataBase, ms); // giro das posições
  const membros = e.grupos[g].membros.filter(x => x !== '');
  const m = membros.length;
  const celulas = [];
  let s = 0;
  e.posicoes.forEach(p => {
    const c = [];
    for (let k = 0; k < p.vagas; k++, s++) c.push(m ? membros[mod(s + rot, m)] : '');
    celulas.push(c.filter(x => x !== undefined));
  });
  return { grupo: e.grupos[g].nome, celulas };
}

function datasDoPeriodo(e, ano, mes /* null = ano todo */) {
  const out = [];
  const ini = mes == null ? Date.UTC(ano, 0, 1) : Date.UTC(ano, mes, 1);
  const fim = mes == null ? Date.UTC(ano + 1, 0, 1) : Date.UTC(ano, mes + 1, 1);
  for (let t = ini; t < fim; t += DIA_MS) if (new Date(t).getUTCDay() === e.dia) out.push(t);
  return out;
}

/* ---------- estado ---------- */
const hoje = new Date();
const state = {
  dados: carregar(),
  escId: null,
  ano: hoje.getFullYear(),
  mes: hoje.getMonth(),
  adm: false
};
(function escolherEscalaInicial() {
  const param = new URLSearchParams(location.search).get('escala');
  const ids = state.dados.escalas.map(e => e.id);
  if (param && ids.includes(param)) state.escId = param;
  else if (ids.includes(localStorage.getItem(LAST_KEY))) state.escId = localStorage.getItem(LAST_KEY);
  else state.escId = ids[0];
})();
const escAtual = () => state.dados.escalas.find(e => e.id === state.escId);

/* ---------- render ---------- */
const $ = id => document.getElementById(id);

function render() {
  renderAbas();
  renderNav();
  renderLista();
  renderAdm();
}

function renderAbas() {
  $('abas').innerHTML = state.dados.escalas.map(e =>
    `<button class="aba ${e.id === state.escId ? 'ativa' : ''}" data-id="${esc(e.id)}">${esc(e.nome)}</button>`
  ).join('');
}

function renderNav() {
  $('mesLabel').textContent = `${MESES[state.mes]} ${state.ano}`;
}

function nomesHTML(lista) {
  const l = lista.filter(Boolean);
  return l.length ? l.map(esc).join(' – ') : '<span class="vazio">—</span>';
}

function renderLista() {
  const e = escAtual();
  const datas = datasDoPeriodo(e, state.ano, state.mes);
  const h = hojeUTC();
  const proximo = datasDoPeriodo(e, state.ano, state.mes).find(t => t >= h);
  $('tituloEscala').textContent = e.nome;
  $('lista').innerHTML = datas.map(t => {
    const r = escalaDoDia(e, t);
    const cls = t === h ? 'hoje' : (t === proximo ? 'proximo' : (t < h ? 'passado' : ''));
    const tag = t === h ? '<span class="tag">Hoje</span>' : (t === proximo ? '<span class="tag">Próximo</span>' : '');
    return `<article class="card ${cls}">
      <div class="card-top">
        <span class="data">${fmtData(t).slice(0, 5)} · ${DIAS_CURTOS[e.dia]}</span>
        ${r.grupo ? `<span class="badge">${esc(r.grupo)}</span>` : ''}${tag}
      </div>
      ${e.posicoes.map((p, i) => `<div class="linha"><span class="pos">${esc(p.nome)}</span><span class="nomes">${nomesHTML(r.celulas[i])}</span></div>`).join('')}
    </article>`;
  }).join('') || '<p class="vazio">Nenhum culto neste mês.</p>';
}

/* ---------- ADM ---------- */
function renderAdm() {
  const box = $('adm');
  $('btnAdm').textContent = state.adm ? 'Sair do ADM' : 'ADM';
  if (!state.adm) { box.hidden = true; box.innerHTML = ''; return; }
  box.hidden = false;
  const e = escAtual();
  let corpo = '';

  if (e.tipo === 'fixa') {
    corpo = `
      <label class="campo">Data do 1º culto do ciclo (Semana 1)
        <input type="date" id="admBase" value="${esc(e.dataBase)}"></label>
      <p class="ajuda">Ciclo de ${e.ciclo.length} semana(s). Depois da última semana, volta para a Semana 1.
      Vários nomes na mesma posição: separe com hífen (ex.: GERALDO - VALENTINO).</p>
      <div class="tabela-wrap"><table class="ciclo">
        <thead><tr><th>Semana</th>${e.posicoes.map(p => `<th>${esc(p.nome)}</th>`).join('')}<th></th></tr></thead>
        <tbody>${e.ciclo.map((row, r) => `<tr>
          <td>${r + 1}</td>
          ${e.posicoes.map((p, i) => `<td><input data-r="${r}" data-i="${i}" class="celula" value="${esc((row[i] || []).join(' - '))}"></td>`).join('')}
          <td><button class="mini perigo" data-del="${r}" title="Remover semana">✕</button></td></tr>`).join('')}
        </tbody></table></div>
      <button class="sec" id="admAddLinha">+ Adicionar semana</button>
      <details class="auto">
        <summary>Gerar rodízio automático</summary>
        <p class="ajuda">Um nome por linha, na ordem da Semana 1. A cada culto todos andam uma posição.
        Isso substitui o ciclo atual desta escala.</p>
        <textarea id="admNomes" rows="6">${esc(nomesUnicos(e).join('\n'))}</textarea>
        <button class="sec" id="admGerar">Gerar ciclo</button>
      </details>`;
  } else {
    const total = e.posicoes.reduce((a, p) => a + p.vagas, 0);
    const slots = e.posicoes.flatMap(p => Array.from({ length: p.vagas }, () => p.nome));
    corpo = `
      <label class="campo">Data em que o ${esc(e.grupos[0].nome)} trabalhou
        <input type="date" id="admBase" value="${esc(e.dataBase)}"></label>
      <p class="ajuda">Os grupos seguem em sequência (${e.grupos.map(g => esc(g.nome)).join(' → ')}).
      Os nomes abaixo são a ordem base do grupo (mesma ordem do app antigo);
      o app gira as posições automaticamente a cada domingo.</p>
      ${e.grupos.map((g, gi) => `
        <fieldset class="grupo"><legend>${esc(g.nome)}</legend>
          ${Array.from({ length: total }, (_, k) => `<label class="campo">Membro ${k + 1}
            <input class="membro" data-g="${gi}" data-k="${k}" value="${esc(g.membros[k] || '')}"></label>`).join('')}
        </fieldset>`).join('')}`;
  }

  box.innerHTML = `
    <h2>Administração — ${esc(e.nome)}</h2>
    ${corpo}
    <div class="acoes">
      <button class="pri" id="admSalvar">Salvar alterações</button>
      <button class="sec" id="admRestaurar">Restaurar original desta escala</button>
    </div>
    <h3>Exportar / Importar</h3>
    <div class="acoes">
      <button class="sec" id="admXlsx">Exportar Excel – ${esc(e.curto)} ${state.ano}</button>
      <button class="sec" id="admXlsxTodas">Exportar Excel – todas ${state.ano}</button>
      <button class="sec" id="admJson">Exportar JSON (backup)</button>
      <label class="sec arquivo">Importar JSON<input type="file" id="admImport" accept=".json,application/json" hidden></label>
    </div>
    <h3>Links diretos</h3>
    <div class="links">${state.dados.escalas.map(x => {
      const url = `${location.origin}${location.pathname}?escala=${x.id}`;
      return `<div><span>${esc(x.nome)}</span><button class="mini" data-copy="${esc(url)}">Copiar link</button></div>`;
    }).join('')}</div>
    <h3>Senha do ADM</h3>
    <div class="acoes"><button class="sec" id="admPin">Trocar senha</button></div>`;
}

function nomesUnicos(e) {
  const vistos = [];
  (e.ciclo[0] || []).flat().forEach(n => { if (n && !vistos.includes(n)) vistos.push(n); });
  e.ciclo.flat(2).forEach(n => { if (n && !vistos.includes(n)) vistos.push(n); });
  return vistos;
}

/* lê o formulário para o objeto da escala */
function lerFormulario(e) {
  const base = $('admBase').value;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(base)) { alert('Informe uma data válida.'); return false; }
  if (new Date(toUTC(base)).getUTCDay() !== e.dia) {
    alert(`A data precisa ser uma ${['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'][e.dia]}.`);
    return false;
  }
  e.dataBase = base;
  if (e.tipo === 'fixa') {
    const rows = e.ciclo.map(() => e.posicoes.map(() => []));
    document.querySelectorAll('#adm .celula').forEach(inp => {
      rows[+inp.dataset.r][+inp.dataset.i] = splitNomes(inp.value);
    });
    e.ciclo = rows;
  } else {
    document.querySelectorAll('#adm .membro').forEach(inp => {
      e.grupos[+inp.dataset.g].membros[+inp.dataset.k] = inp.value.trim();
    });
  }
  return true;
}

function persistir() { salvar(state.dados); render(); }

/* ---------- exportação ---------- */
function linhasExport(e, ano) {
  const cab = ['Data'].concat(e.tipo === 'grupos' ? ['Grupo'] : [], e.posicoes.map(p => p.nome));
  const linhas = datasDoPeriodo(e, ano, null).map(t => {
    const r = escalaDoDia(e, t);
    return [fmtData(t)].concat(e.tipo === 'grupos' ? [r.grupo] : [], r.celulas.map(c => c.filter(Boolean).join(' - ')));
  });
  return [cab].concat(linhas);
}

function carregarXLSX() {
  if (window.XLSX) return Promise.resolve(window.XLSX);
  return new Promise((ok, falha) => {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
    s.onload = () => ok(window.XLSX);
    s.onerror = () => falha(new Error('sem internet'));
    document.head.appendChild(s);
  });
}

function baixar(nome, blob) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = nome;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

async function exportarExcel(escalas, ano, nomeArq) {
  try {
    const X = await carregarXLSX();
    const wb = X.utils.book_new();
    escalas.forEach(e => {
      const ws = X.utils.aoa_to_sheet(linhasExport(e, ano));
      ws['!cols'] = linhasExport(e, ano)[0].map((_, i) => ({ wch: i === 0 ? 12 : 26 }));
      X.utils.book_append_sheet(wb, ws, e.curto.slice(0, 31));
    });
    X.writeFile(wb, nomeArq + '.xlsx');
  } catch (err) {
    // sem internet: exporta CSV (abre no Excel)
    const csv = escalas.map(e => [[e.nome]].concat(linhasExport(e, ano))
      .map(l => l.map(c => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\r\n')).join('\r\n\r\n');
    baixar(nomeArq + '.csv', new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' }));
    alert('Sem conexão para gerar .xlsx — foi exportado em CSV (abre no Excel).');
  }
}

/* ---------- eventos ---------- */
document.addEventListener('click', ev => {
  const b = ev.target.closest('button');
  if (!b) return;
  const e = escAtual();

  if (b.classList.contains('aba')) {
    state.escId = b.dataset.id;
    localStorage.setItem(LAST_KEY, state.escId);
    history.replaceState(null, '', `?escala=${state.escId}`);
    render(); return;
  }
  if (b.dataset.copy) {
    navigator.clipboard?.writeText(b.dataset.copy).then(() => alert('Link copiado!'), () => prompt('Copie o link:', b.dataset.copy));
    return;
  }
  if (b.dataset.del !== undefined) {
    if (e.ciclo.length <= 1) return alert('O ciclo precisa ter pelo menos 1 semana.');
    if (!lerFormulario(e)) return;
    e.ciclo.splice(+b.dataset.del, 1); persistir(); return;
  }

  switch (b.id) {
    case 'btnPrev': if (--state.mes < 0) { state.mes = 11; state.ano--; } render(); break;
    case 'btnNext': if (++state.mes > 11) { state.mes = 0; state.ano++; } render(); break;
    case 'btnHoje': state.ano = new Date().getFullYear(); state.mes = new Date().getMonth(); render(); break;
    case 'btnAdm':
      if (state.adm) { state.adm = false; render(); break; }
      if (prompt('Senha do ADM:') === state.dados.pin) { state.adm = true; render(); $('adm').scrollIntoView({ behavior: 'smooth' }); }
      else alert('Senha incorreta.');
      break;
    case 'admSalvar': if (lerFormulario(e)) { persistir(); alert('Alterações salvas.'); } break;
    case 'admAddLinha': if (lerFormulario(e)) { e.ciclo.push(e.posicoes.map(() => [])); persistir(); } break;
    case 'admGerar': {
      const nomes = $('admNomes').value.split('\n').map(s => s.trim()).filter(Boolean);
      if (!nomes.length) return alert('Informe os nomes.');
      if (!confirm(`Substituir o ciclo atual por um rodízio de ${nomes.length} pessoas?`)) return;
      if (!lerFormulario(e)) return;
      e.ciclo = gerarCiclo(nomes, e.posicoes); persistir(); break;
    }
    case 'admRestaurar': {
      if (!confirm(`Restaurar "${e.nome}" para os dados originais? As alterações desta escala serão perdidas.`)) return;
      const orig = dadosPadrao().escalas.find(x => x.id === e.id);
      const i = state.dados.escalas.findIndex(x => x.id === e.id);
      state.dados.escalas[i] = orig; persistir(); break;
    }
    case 'admXlsx': exportarExcel([e], state.ano, `Escala_${e.curto}_${state.ano}`); break;
    case 'admXlsxTodas': exportarExcel(state.dados.escalas, state.ano, `Escalas_${state.ano}`); break;
    case 'admJson':
      baixar(`escalas_backup_${fmtData(hojeUTC()).replace(/\//g, '-')}.json`,
        new Blob([JSON.stringify(state.dados, null, 2)], { type: 'application/json' }));
      break;
    case 'admPin': {
      const novo = prompt('Nova senha do ADM:');
      if (novo && novo.trim()) { state.dados.pin = novo.trim(); salvar(state.dados); alert('Senha alterada.'); }
      break;
    }
  }
});

document.addEventListener('change', ev => {
  if (ev.target.id !== 'admImport') return;
  const f = ev.target.files[0];
  if (!f) return;
  const rd = new FileReader();
  rd.onload = () => {
    try {
      const d = JSON.parse(rd.result);
      if (!d || !Array.isArray(d.escalas)) throw new Error('formato inválido');
      if (!confirm('Substituir todos os dados do app por este arquivo?')) return;
      state.dados = d;
      if (!d.escalas.some(x => x.id === state.escId)) state.escId = d.escalas[0].id;
      persistir(); alert('Dados importados.');
    } catch (err) { alert('Arquivo JSON inválido: ' + err.message); }
  };
  rd.readAsText(f);
});

/* ---------- início ---------- */
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
render();
window.scrollTo(0, 0);
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});

/* exporta para testes */
if (typeof module !== 'undefined') module.exports = { dadosPadrao, escalaDoDia, toUTC, fmtData };
