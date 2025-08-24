// ---------------------- EXIGÊNCIAS E INGREDIENTES ----------------------
const exigencias = [
    { c: 'bezerro', min: 50, max: 150, gpd: 0.5, pb: 18.0, ed: 2.8, cms: 2.5 },
    { c: 'bezerro', min: 151, max: 250, gpd: 0.8, pb: 16.0, ed: 2.9, cms: 2.3 },
    { c: 'novilho', min: 251, max: 350, gpd: 1.0, pb: 14.0, ed: 3.0, cms: 2.1 },
    { c: 'novilho', min: 351, max: 450, gpd: 1.2, pb: 13.0, ed: 3.1, cms: 2.0 },
    { c: 'boi', min: 451, max: 700, gpd: 1.5, pb: 12.0, ed: 3.2, cms: 1.9 },
];

const defaultIngredientes = [
    { id: 'milho', nome: 'Milho grão', pb: 8.5, ed: 3.4, ms: 88, preco: 1.20, categoria: 'concentrado' },
    { id: 'soja', nome: 'Farelo de soja', pb: 45, ed: 3.3, ms: 90, preco: 2.50, categoria: 'concentrado' },
    { id: 'casca', nome: 'Casca de soja', pb: 12, ed: 3.0, ms: 90, preco: 1.80, categoria: 'concentrado' },
    { id: 'silagem', nome: 'Silagem de milho', pb: 7.5, ed: 2.4, ms: 35, preco: 0.30, categoria: 'volumoso' },
    { id: 'feno', nome: 'Feno de capim', pb: 8.0, ed: 1.8, ms: 85, preco: 0.50, categoria: 'volumoso' },
    { id: 'mineral', nome: 'Suplemento mineral', pb: 0, ed: 0, ms: 95, preco: 5.00, categoria: 'concentrado', minDM: 0.001 },
    { id: 'ureia', nome: 'Ureia pecuária', pb: 281, ed: 0, ms: 98, preco: 3.00, categoria: 'concentrado', maxDM: 0.01 },
];
let ingredientes = JSON.parse(localStorage.getItem('ingredientesMVP2_full') || 'null') || defaultIngredientes.map(i => ({ ...i, usar: true }));

const pastosPadrao = {
    'brachiaria': { pb: 8.0, ed: 2.2, ms: 30 },
    'panicum': { pb: 11.0, ed: 2.4, ms: 30 },
    'sem_pasto': { pb: 0, ed: 0, ms: 0 }
};

function carregarPadraoPasto() {
    const tipo = document.getElementById('pastoTipo').value;
    const p = pastosPadrao[tipo] || pastosPadrao['brachiaria'];
    document.getElementById('pastoPB').value = p.pb;
    document.getElementById('pastoED').value = p.ed;
    document.getElementById('pastoMS').value = p.ms;
}
document.getElementById('pastoTipo').addEventListener('change', carregarPadraoPasto);
window.addEventListener('load', carregarPadraoPasto);

// ---------------------- UI: INGREDIENTES TABLE ----------------------
function renderIngredientes() {
    const tbody = document.getElementById('ingredientesBody');
    tbody.innerHTML = '';
    ingredientes.forEach((ing, idx) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
      <td class="px-3 py-2"><input type="checkbox" ${ing.usar ? 'checked' : ''} onchange="toggleUsar(${idx}, this.checked)"></td>
      <td class="px-3 py-2">${ing.nome}</td>
      <td class="px-3 py-2 text-right"><input title="Proteína" type="number" step="0.1" value="${ing.pb}" class="w-24 border rounded px-2 py-1 text-right" onchange="updIng(${idx}, 'pb', this.value)"></td>
      <td class="px-3 py-2 text-right"><input title="Energia" type="number" step="0.01" value="${ing.ed}" class="w-24 border rounded px-2 py-1 text-right" onchange="updIng(${idx}, 'ed', this.value)"></td>
      <td class="px-3 py-2 text-right"><input title="Matéria seca" type="number" step="0.1" value="${ing.ms}" class="w-20 border rounded px-2 py-1 text-right" onchange="updIng(${idx}, 'ms', this.value)"></td>
      <td class="px-3 py-2 text-right"><input title="Preço por kg" type="number" step="0.01" value="${ing.preco}" class="w-28 border rounded px-2 py-1 text-right" onchange="updIng(${idx}, 'preco', this.value)"></td>
      <td class="px-3 py-2">${ing.categoria}</td>
      <td class="px-3 py-2 text-xs text-gray-600">
        ${ing.minDM ? `Mín: ${(ig(ing.minDM * 100))}% MS` : '—'}${ing.maxDM ? ` · Máx: ${(ig(ing.maxDM * 100))}% MS` : ''}
      </td>
    `;
        tbody.appendChild(tr);
    });
}
function ig(v) { return Number(v).toFixed(1); }
function toggleUsar(idx, val) {
    ingredientes[idx].usar = val;
    persistIngredientes();
}
function updIng(idx, key, val) {
    ingredientes[idx][key] = Number(val);
    persistIngredientes();
}
function persistIngredientes() {
    localStorage.setItem('ingredientesMVP2_full', JSON.stringify(ingredientes));
}
function resetarIngredientes() {
    ingredientes = defaultIngredientes.map(i => ({ ...i, usar: true }));
    persistIngredientes();
    renderIngredientes();
}
renderIngredientes();

// ---------------------- NÚCLEO: CÁLCULO ----------------------
function acharExigencia(categoria, peso, gpd) {
    const candidatos = exigencias.filter(e => e.c === categoria && peso >= e.min && peso <= e.max);
    if (candidatos.length === 0) return null;
    let best = candidatos[0];
    let bestDiff = Math.abs(candidatos[0].gpd - gpd);
    for (let i = 1; i < candidatos.length; i++) {
        const d = Math.abs(candidatos[i].gpd - gpd);
        if (d < bestDiff) { best = candidatos[i]; bestDiff = d; }
    }
    return best;
}

function calcular() {
    const qtdAnimais = Number(document.getElementById('qtdAnimais').value || 0);
    const categoria = document.getElementById('categoria').value;
    const peso = Number(document.getElementById('peso').value || 0);
    const gpd = Number(document.getElementById('gpd').value || 0);
    const orcamento = Number(document.getElementById('orcamento').value || 0);
    const tipoPasto = document.getElementById('pastoTipo').value;
    const pastoPB = Number(document.getElementById('pastoPB').value || 0);
    const pastoED = Number(document.getElementById('pastoED').value || 0);
    const pastoMS = Number(document.getElementById('pastoMS').value || 0);

    if (!qtdAnimais || !categoria || !peso || !gpd) { alert('Preencha quantidade, categoria, peso e ganho por dia.'); return; }

    const ex = acharExigencia(categoria, peso, gpd);
    if (!ex) { alert('Não encontrei exigências para esses parâmetros. Ajuste o peso/GPD.'); return; }

    const cmsKg = peso * (ex.cms / 100);

    const ingsSel = ingredientes.filter(i => i.usar);
    if (tipoPasto !== 'sem_pasto') {
        ingsSel.unshift({ id: 'pasto', nome: 'Pasto', pb: pastoPB, ed: pastoED, ms: pastoMS, preco: 0, categoria: 'pasto' });
    }

    let mix = ingsSel.map(i => ({ id: i.id, nome: i.nome, ms: i.ms, pb: i.pb, ed: i.ed, preco: i.preco, cat: i.categoria, dm: 0 }));
    let dmPastoInicial = (tipoPasto === 'sem_pasto') ? 0 : cmsKg;
    for (const m of mix) if (m.id === 'pasto') m.dm = dmPastoInicial;

    const limiteUreia = 0.01 * cmsKg;
    const mineralMin = 0.001 * cmsKg;
    const mMineral = mix.find(m => m.id === 'mineral');
    if (mMineral) mMineral.dm = mineralMin;

    function estado(mixArr) {
        const dmTotal = mixArr.reduce((s, m) => s + m.dm, 0);
        const pbKg = mixArr.reduce((s, m) => s + m.dm * (m.pb / 100), 0);
        const edMcal = mixArr.reduce((s, m) => s + m.dm * m.ed, 0);
        return { dmTotal, pbPerc: dmTotal > 0 ? (pbKg / dmTotal) * 100 : 0, ed: dmTotal > 0 ? (edMcal / dmTotal) : 0, pbKg, edMcal };
    }
    function custoDia(mixArr) {
        return mixArr.reduce((s, m) => {
            if (m.ms <= 0) return s;
            const mnKg = m.dm / (m.ms / 100);
            return s + mnKg * m.preco;
        }, 0);
    }
    function liberarEspacoDM(necessarioDM) {
        let restante = necessarioDM;
        const p = mix.find(m => m.id === 'pasto');
        if (p) {
            const tirar = Math.min(restante, p.dm);
            p.dm -= tirar; restante -= tirar;
        }
        if (restante > 0) {
            const candidatos = mix.filter(m => m.id !== 'mineral' && m.id !== 'ureia' && m.id !== 'pasto');
            const totalDM = candidatos.reduce((s, m) => s + m.dm, 0);
            if (totalDM > 0) {
                candidatos.forEach(m => { const tirar = restante * (m.dm / totalDM); m.dm = Math.max(0, m.dm - tirar); });
                restante = 0;
            }
        }
    }

    const fontesPB = mix.filter(m => m.id !== 'pasto' && m.pb > 0 && m.id !== 'mineral').map(m => {
        const custoDM = (m.preco) / (m.ms / 100);
        const custoPorKgPB = (m.pb > 0) ? (custoDM / (m.pb / 100)) : Infinity;
        return { ...m, custoDM, custoPorKgPB };
    }).sort((a, b) => a.custoPorKgPB - b.custoPorKgPB);

    const fontesED = mix.filter(m => m.id !== 'pasto' && m.ed > 0 && m.id !== 'mineral' && m.id !== 'ureia').map(m => {
        const custoDM = (m.preco) / (m.ms / 100);
        const custoPorMcal = (m.ed > 0) ? (custoDM / m.ed) : Infinity;
        return { ...m, custoDM, custoPorMcal };
    }).sort((a, b) => a.custoPorMcal - b.custoPorMcal);

    function addDM(id, dmToAdd) {
        const m = mix.find(x => x.id === id);
        if (!m) return 0;
        let add = dmToAdd;
        if (m.id === 'ureia') {
            const espacoU = Math.max(0, limiteUreia - m.dm);
            add = Math.min(add, espacoU);
        }
        if (m.id === 'mineral') {
            const maxMineral = 0.005 * cmsKg;
            const espacoMin = Math.max(0, maxMineral - m.dm);
            add = Math.min(add, espacoMin);
        }
        liberarEspacoDM(add);
        m.dm += add;
        return add;
    }

    let it = 0, travas = 0;
    while (it < 200) {
        it++;
        const est = estado(mix);
        if (Math.abs(est.dmTotal - cmsKg) > 1e-3) {
            if (est.dmTotal < cmsKg) {
                const falta = cmsKg - est.dmTotal;
                const p = mix.find(m => m.id === 'pasto');
                if (p) p.dm += falta; else {
                    const vols = mix.filter(m => m.cat === 'volumoso' || m.id === 'silagem');
                    const cand = vols.sort((a, b) => (a.preco / (a.ms / 100)) - (b.preco / (b.ms / 100)))[0];
                    if (cand) cand.dm += falta;
                }
            } else {
                liberarEspacoDM(est.dmTotal - cmsKg);
            }
        }
        const est2 = estado(mix);
        const okPB = est2.pbPerc >= ex.pb * 0.98;
        const okED = est2.ed >= ex.ed * 0.98;
        if (okPB && okED) break;

        const antes = JSON.stringify(mix.map(m => ({ id: m.id, dm: m.dm })));
        if (!okPB) {
            const alvo = fontesPB[0] || null;
            if (alvo) addDM(alvo.id, 0.02 * cmsKg);
        }
        if (!okED) {
            const alvoE = fontesED[0] || null;
            if (alvoE) addDM(alvoE.id, 0.02 * cmsKg);
        }
        const depois = JSON.stringify(mix.map(m => ({ id: m.id, dm: m.dm })));
        if (antes === depois) { travas++; if (travas > 5) break; }
    }

    const estF = estado(mix);
    const atende = (estF.pbPerc >= ex.pb * 0.95 && estF.pbPerc <= ex.pb * 1.10) && (estF.ed >= ex.ed * 0.95 && estF.ed <= ex.ed * 1.10);
    const custo = custoDia(mix);
    const custoLote = custo * qtdAnimais;
    let avisoOrc = '';
    if (orcamento > 0 && custo > orcamento) avisoOrc = `Ultrapassa orçamento: R$ ${custo.toFixed(2)} > R$ ${orcamento.toFixed(2)} por animal/dia`;

    const linhas = [];
    let totalMN = 0;
    for (const m of mix) {
        if (m.dm <= 0) continue;
        const mn = (m.ms > 0) ? m.dm / (m.ms / 100) : 0;
        const custoParc = mn * m.preco;
        totalMN += mn;
        linhas.push({ id: m.id, nome: m.nome, mn, custo: custoParc });
    }
    linhas.forEach(l => { l.pctMN = totalMN > 0 ? (l.mn / totalMN) * 100 : 0; });

    const deCocho = linhas.filter(l => l.id !== 'pasto');
    const totalMNCocho = deCocho.reduce((s, l) => s + l.mn, 0);
    let htmlReceita = '';
    function blocoReceita(alvoKg) {
        let out = `<div class="mb-2"><b>Para ${alvoKg} kg de mistura (como fornecido):</b></div><ul class="list-disc ml-6">`;
        deCocho.forEach(l => {
            const kg = totalMNCocho > 0 ? (l.mn / totalMNCocho) * alvoKg : 0;
            out += `<li>${l.nome}: <b>${kg.toFixed(1)} kg</b></li>`;
        });
        out += `</ul>`;
        return out;
    }
    htmlReceita += blocoReceita(100);
    htmlReceita += `<div class="my-2"></div>`;
    htmlReceita += blocoReceita(30);
    document.getElementById('receitaCocho').innerHTML = htmlReceita;

    showTab('resultado');
    const badge = document.getElementById('badgeAtende');
    badge.className = 'badge ' + (atende ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800');
    badge.textContent = atende ? 'Atende as metas (±5–10%)' : 'Atenção: pode não atender (ajuste valores)';

    const resumo = [
        { t: 'Consumo de MS', v: `${cmsKg.toFixed(2)} kg/animal/dia` },
        { t: 'PB calculada', v: `${estF.pbPerc.toFixed(2)}% (alvo ${ex.pb}%)` },
        { t: 'ED calculada', v: `${estF.ed.toFixed(2)} Mcal/kg (alvo ${ex.ed})` },
        { t: 'Custo', v: `R$ ${custo.toFixed(2)} / animal/dia` },
    ];
    const resResumo = document.getElementById('resResumo');
    resResumo.innerHTML = '';
    resumo.forEach(r => {
        const div = document.createElement('div');
        div.className = 'card';
        div.innerHTML = `<div class="text-sm text-gray-600">${r.t}</div><div class="text-2xl font-bold text-gray-900">${r.v}</div>`;
        resResumo.appendChild(div);
    });

    const tbody = document.getElementById('resTabela');
    tbody.innerHTML = '';
    linhas.forEach(l => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
      <td class="px-3 py-2">${l.nome}</td>
      <td class="px-3 py-2 text-right">${l.pctMN.toFixed(1)}%</td>
      <td class="px-3 py-2 text-right">${l.mn.toFixed(3)}</td>
      <td class="px-3 py-2 text-right">R$ ${l.custo.toFixed(2)}</td>
    `;
        tbody.appendChild(tr);
    });

    const ind = document.getElementById('resIndicadores');
    ind.innerHTML = `
    <li><b>Animais no lote:</b> ${qtdAnimais}</li>
    <li><b>Categoria:</b> ${categoria} — <b>Peso:</b> ${peso} kg — <b>GPD alvo:</b> ${gpd} kg/dia</li>
    <li><b>Consumo total MS do lote:</b> ${(cmsKg * qtdAnimais).toFixed(1)} kg/dia</li>
    <li><b>Custo diário do lote:</b> R$ ${custoLote.toFixed(2)}</li>
    ${avisoOrc ? `<li class="text-red-700"><b>Orçamento:</b> ${avisoOrc}</li>` : ''}
    <li class="text-gray-500 text-xs mt-2">Limites aplicados: ureia ≤ 1,0% MS; mineral ≈ 0,1–0,5% MS. Faça adaptação.</li>
  `;
}

// ---------------------- NAVEGAÇÃO ----------------------
function showTab(tab) {
    ['form', 'ingredientes', 'resultado', 'consultoria', 'glossario'].forEach(id => {
        document.getElementById('tab-' + id).classList.add('hidden');
    });
    document.getElementById('tab-' + tab).classList.remove('hidden');
}