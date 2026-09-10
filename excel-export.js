/* Exportación XLSX de presentación desde la tabla visible del dashboard DGIC. */
(() => {
'use strict';

const $ = id => document.getElementById(id);
const CLEAN = v => String(v ?? '').replace(/\s+/g,' ').trim();
const SAFE = v => {
  const s = CLEAN(v);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
};
const BLUE = '173C78', BLUE2 = '2E67F8', LIGHT = 'EAF2FF', LINE = 'D7E1EF',
      TEXT = '183153', MUTED = '5E7496', GREEN = 'E6F6ED', GREEN_TEXT = '1E8C4D',
      AMBER = 'FFF1DF', AMBER_TEXT = 'A86408', PURPLE = 'F1EDF9', PURPLE_TEXT = '6B4C9A',
      RED = 'FDE9E6', RED_TEXT = 'B84236', GRAY = 'F2F5F9';

function showError(message) {
  const box = $('errorBox');
  if (box) { box.hidden = false; box.textContent = message; }
  else window.alert(message);
}

function tableSnapshot(selectedOnly) {
  const ths = [...document.querySelectorAll('#tableHead th')];
  if (ths.length < 3) throw new Error('No hay una tabla disponible para exportar.');
  const headers = ths.slice(1,-1).map(th => CLEAN(th.textContent));
  const rows = [...document.querySelectorAll('#tableBody tr')]
    .filter(tr => tr.querySelectorAll('td').length > 1)
    .filter(tr => !selectedOnly || tr.querySelector('input[data-row]')?.checked)
    .map(tr => [...tr.querySelectorAll('td')].slice(1,-1).map(td => SAFE(td.innerText)));
  if (!rows.length) throw new Error(selectedOnly ? 'Selecciona al menos una fila para exportar.' : 'No hay registros en esta página.');
  return { headers, rows };
}

function filtersSnapshot() {
  const items = [];
  document.querySelectorAll('.filter-group').forEach(group => {
    const title = CLEAN(group.querySelector('summary')?.textContent || 'Filtro');
    const all = group.querySelector('[data-all]');
    if (all?.checked && !all.indeterminate) {
      items.push([title, 'Todos']);
      return;
    }
    const checked = [...group.querySelectorAll('input[data-option]:checked')]
      .map(x => CLEAN(x.closest('label')?.textContent || x.value));
    items.push([title, checked.length ? checked.join(', ') : 'Ninguno']);
  });
  return items;
}

function kpiSnapshot() {
  return [...document.querySelectorAll('#kpis .kpi')].map(card => ({
    label: CLEAN(card.querySelector('.kpi-label')?.textContent),
    value: CLEAN(card.querySelector('.kpi-value')?.textContent),
    note: CLEAN(card.querySelector('small')?.textContent)
  })).filter(x => x.label);
}

function contextSnapshot(selectedOnly, rowCount) {
  const operatorMode = document.body.classList.contains('operator-mode');
  const activeProject = CLEAN(document.querySelector('.project-tab.active .tab-label')?.textContent || $('moduleTitle')?.textContent || 'Dashboard');
  const operator = operatorMode ? CLEAN(document.querySelector('#operatorBanner h2')?.textContent || 'Selección de operadores') : 'Según filtros de proyecto';
  return {
    title: 'DASHBOARD DE COMPROMISOS DGIC',
    mode: operatorMode ? 'Vista por operador' : 'Vista por proyecto',
    project: activeProject,
    operator,
    updated: CLEAN($('snapshot')?.textContent || 'Sin fecha informada'),
    page: CLEAN($('pageNumber')?.textContent || 'Página actual'),
    scope: selectedOnly ? `Selección de ${rowCount} registro(s)` : `Página exportada: ${rowCount} registro(s)`
  };
}

function styleCell(cell, fill, color=TEXT, bold=false, size=10) {
  cell.fill = { type:'pattern', pattern:'solid', fgColor:{argb:'FF'+fill} };
  cell.font = { name:'Aptos', color:{argb:'FF'+color}, bold, size };
  cell.alignment = { vertical:'middle', wrapText:true };
  cell.border = {
    top:{style:'thin',color:{argb:'FF'+LINE}}, bottom:{style:'thin',color:{argb:'FF'+LINE}},
    left:{style:'thin',color:{argb:'FF'+LINE}}, right:{style:'thin',color:{argb:'FF'+LINE}}
  };
}

function styleStatus(cell) {
  const t = CLEAN(cell.value).toLowerCase();
  let fill = GRAY, color = MUTED;
  if (/cumpl|instalad|atendid|evidencia/.test(t) && !/sin evidencia/.test(t)) { fill=GREEN; color=GREEN_TEXT; }
  else if (/reemplaz/.test(t)) { fill=PURPLE; color=PURPLE_TEXT; }
  else if (/riesgo|pendient|sin evidencia/.test(t)) { fill=AMBER; color=AMBER_TEXT; }
  else if (/no iniciado|fuerza mayor|alerta/.test(t)) { fill=RED; color=RED_TEXT; }
  cell.fill = { type:'pattern', pattern:'solid', fgColor:{argb:'FF'+fill} };
  cell.font = { name:'Aptos', color:{argb:'FF'+color}, bold:true, size:9 };
  cell.alignment = { vertical:'middle', horizontal:'center', wrapText:true };
}

function addSummarySheet(wb, ctx, kpis, filters) {
  const ws = wb.addWorksheet('Resumen', {
    properties:{tabColor:{argb:'FF'+BLUE}},
    pageSetup:{orientation:'landscape',fitToPage:true,fitToWidth:1,fitToHeight:0,paperSize:9,
      margins:{left:.3,right:.3,top:.45,bottom:.45,header:.2,footer:.2}}
  });
  ws.columns = Array.from({length:10}, () => ({width:15}));
  ws.mergeCells('A1:J2');
  const title = ws.getCell('A1'); title.value = ctx.title;
  title.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF'+BLUE}};
  title.font={name:'Aptos Display',size:20,bold:true,color:{argb:'FFFFFFFF'}};
  title.alignment={vertical:'middle',horizontal:'center'};
  ws.getRow(1).height=26; ws.getRow(2).height=20;

  ws.mergeCells('A3:J3');
  const sub=ws.getCell('A3'); sub.value=`${ctx.mode} · ${ctx.project}`;
  sub.font={name:'Aptos',size:11,bold:true,color:{argb:'FF385F93'}}; sub.alignment={horizontal:'center'};

  const info = [
    ['Ámbito',ctx.scope],['Operador',ctx.operator],['Página',ctx.page],['Datos preparados',ctx.updated],
    ['Generado',new Intl.DateTimeFormat('es-PE',{dateStyle:'medium',timeStyle:'short'}).format(new Date())]
  ];
  info.forEach((x,i)=>{const c=1+i*2;ws.mergeCells(4,c,4,c+1);const cell=ws.getCell(4,c);cell.value=`${x[0]}: ${x[1]}`;styleCell(cell,LIGHT,BLUE,false,9);cell.alignment={horizontal:'center',vertical:'middle',wrapText:true};});
  ws.getRow(4).height=36;

  const visibleKpis=kpis.slice(0,5);
  visibleKpis.forEach((k,i)=>{
    const c=1+i*2;
    ws.mergeCells(6,c,6,c+1); ws.mergeCells(7,c,8,c+1); ws.mergeCells(9,c,9,c+1);
    let a=ws.getCell(6,c); a.value=k.label; styleCell(a,LIGHT,MUTED,true,9); a.alignment={horizontal:'center',vertical:'middle',wrapText:true};
    let b=ws.getCell(7,c); b.value=k.value; styleCell(b,'FFFFFF',BLUE,true,18); b.alignment={horizontal:'center',vertical:'middle'};
    let d=ws.getCell(9,c); d.value=k.note; styleCell(d,'FFFFFF',MUTED,false,8); d.alignment={horizontal:'center',vertical:'middle',wrapText:true};
  });
  ws.getRow(7).height=25; ws.getRow(8).height=22;

  ws.mergeCells('A11:J11');
  let fh=ws.getCell('A11'); fh.value='Filtros aplicados'; styleCell(fh,BLUE,'FFFFFF',true,11);
  let row=12;
  filters.forEach(([label,value])=>{
    ws.getCell(row,1).value=label; styleCell(ws.getCell(row,1),'F6F9FD',BLUE,true,9);
    ws.mergeCells(row,2,row,10); ws.getCell(row,2).value=value; styleCell(ws.getCell(row,2),'FFFFFF',TEXT,false,9);
    row++;
  });
  row++;
  ws.mergeCells(row,1,row,10);
  ws.getCell(row,1).value='Nota: esta descarga es una versión de presentación de la página o selección visible. Los datos completos continúan disponibles en la ficha del dashboard.';
  styleCell(ws.getCell(row,1),'FFF9E8','7A5A10',false,9);
  ws.getRow(row).height=34;
  ws.headerFooter.oddFooter='&LGenerado desde Dashboard DGIC&C&P de &N&R'+ctx.project;
  return ws;
}

function addDetailSheet(wb, headers, rows, ctx) {
  const ws=wb.addWorksheet('Detalle', {
    properties:{tabColor:{argb:'FF'+BLUE2}},
    views:[{state:'frozen',ySplit:1}],
    pageSetup:{orientation:'landscape',fitToPage:true,fitToWidth:1,fitToHeight:0,paperSize:9,
      margins:{left:.25,right:.25,top:.35,bottom:.35,header:.2,footer:.2}}
  });
  ws.addTable({
    name:'DetalleDGIC', ref:'A1', headerRow:true, totalsRow:false,
    style:{theme:'TableStyleMedium2',showRowStripes:true,showFirstColumn:false,showLastColumn:false},
    columns:headers.map(name=>({name:name||'Campo'})), rows
  });
  ws.getRow(1).height=28;
  ws.getRow(1).eachCell(cell=>{
    cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF'+BLUE}};
    cell.font={name:'Aptos',bold:true,color:{argb:'FFFFFFFF'},size:10};
    cell.alignment={vertical:'middle',horizontal:'center',wrapText:true};
  });
  headers.forEach((h,i)=>{
    const col=ws.getColumn(i+1);
    let max=CLEAN(h).length;
    rows.slice(0,200).forEach(r=>{max=Math.max(max,CLEAN(r[i]).length);});
    col.width=Math.min(Math.max(max+2,11),34);
    col.alignment={vertical:'top',wrapText:true};
  });
  const statusCols=headers.map((h,i)=>({h:CLEAN(h).toLowerCase(),i:i+1})).filter(x=>/estado|ejecución|cambio/.test(x.h));
  for(let r=2;r<=rows.length+1;r++)statusCols.forEach(x=>styleStatus(ws.getCell(r,x.i)));
  ws.autoFilter={from:{row:1,column:1},to:{row:rows.length+1,column:headers.length}};
  ws.headerFooter.oddHeader='&CDGIC · '+ctx.project+' · '+ctx.mode;
  ws.headerFooter.oddFooter='&L'+ctx.scope+'&C&P de &N&R'+ctx.updated;
  return ws;
}

async function exportExcel(selectedOnly) {
  if (!window.ExcelJS) throw new Error('No se pudo cargar el motor de Excel. Recarga la página y vuelve a intentar.');
  const button = selectedOnly ? $('exportSelected') : $('exportPage');
  const original = button.innerHTML;
  button.disabled=true; button.textContent='Generando Excel…';
  try {
    const snap=tableSnapshot(selectedOnly);
    const ctx=contextSnapshot(selectedOnly,snap.rows.length);
    const wb=new ExcelJS.Workbook();
    wb.creator='DGIC'; wb.lastModifiedBy='Dashboard DGIC'; wb.created=new Date(); wb.modified=new Date();
    wb.subject=`${ctx.mode} · ${ctx.project}`; wb.title='Dashboard de Compromisos DGIC';
    addSummarySheet(wb,ctx,kpiSnapshot(),filtersSnapshot());
    addDetailSheet(wb,snap.headers,snap.rows,ctx);
    const buffer=await wb.xlsx.writeBuffer();
    const blob=new Blob([buffer],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
    const url=URL.createObjectURL(blob); const a=document.createElement('a');
    const clean=s=>CLEAN(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^A-Za-z0-9_-]+/g,'_').replace(/^_+|_+$/g,'');
    a.href=url; a.download=`DGIC_${clean(ctx.project)}_${selectedOnly?'seleccion':'pagina'}_${clean(ctx.page)}.xlsx`;
    document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
  } finally { button.innerHTML=original; button.disabled=false; }
}

function activate() {
  const page=$('exportPage'), selected=$('exportSelected');
  if(!page||!selected)return;
  page.title='Descargar esta página como Excel de presentación';
  selected.title='Descargar las filas seleccionadas como Excel de presentación';
  page.innerHTML=(window.DGIC_UI?.icon('download')||'')+'<span>Excel página</span>';
  selected.innerHTML=(window.DGIC_UI?.icon('download')||'')+'<span>Excel selección</span>';
  page.onclick=e=>{e.preventDefault();exportExcel(false).catch(err=>showError('No se pudo generar el Excel: '+err.message));};
  selected.onclick=e=>{e.preventDefault();exportExcel(true).catch(err=>showError('No se pudo generar el Excel: '+err.message));};
  const version=document.querySelector('.version');
  if(version)version.textContent='Interfaz 3.3 · Excel de presentación · Supabase';
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',activate,{once:true});else activate();
window.DGIC_EXCEL=Object.freeze({exportExcel,tableSnapshot,filtersSnapshot,kpiSnapshot});
})();