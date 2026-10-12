/* Capa visual de la referencia aprobada. Mantiene los controles y sus listeners. */
(() => {
'use strict';
const $=id=>document.getElementById(id), body=document.body;
if(!$('mapCard')||body.dataset.referenceReady)return;
body.dataset.referenceReady='true';body.classList.add('reference-v5');
const icon=n=>window.DGIC_UI?.icon(n)||'';
const statusColor=text=>/sin evidencia/i.test(text)?'#438fee':/evidencia de ejecución|ejecutad|atendido/i.test(text)?'#19a467':/reemplaz/i.test(text)?'#9473c9':/pendient/i.test(text)?'#f5a232':'#5397e4';
const logos={
 AMOV:'<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="31" fill="#e51428"/><text x="30" y="39" text-anchor="middle" font-family="Arial,sans-serif" font-weight="700" font-size="20" fill="white" letter-spacing="-1.2">Claro</text><g stroke="white" stroke-width="2" stroke-linecap="round"><path d="M43 20l3-6M48 24l6-3M49 29h7"/></g></svg>',
 ENTEL:'<svg viewBox="0 0 66 64" aria-hidden="true"><text x="24" y="50" text-anchor="middle" font-family="Arial,sans-serif" font-size="61" font-weight="700" fill="#0067ca">e</text><path d="M51 14q21 18 0 36" fill="none" stroke="#ff6a16" stroke-width="9"/></svg>',
 INTEGRATEL:'<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M49 5C10 25 5 43 27 58C16 34 43 19 49 5Z" fill="#0e6fba"/><path d="M54 4C19 26 13 40 28 58C24 37 44 21 54 4Z" fill="#21bdd0"/><path d="M56 5C24 32 21 42 31 58C30 36 47 22 56 5Z" fill="#ee344b"/><path d="M59 2C38 23 29 38 31 59C35 38 51 19 59 2Z" fill="#ffbe0a"/><path d="M58 15C37 36 33 47 34 60C40 43 50 27 58 15Z" fill="#6bc329"/></svg>',
 VIETTEL:'<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="31" fill="#ffd82f"/><text x="32" y="40" text-anchor="middle" font-family="Arial,sans-serif" font-size="25" font-weight="750" fill="#006baf" letter-spacing="-1.4">bitel</text></svg>'
};
function brandCards(){
 $('operatorCards')?.querySelectorAll('.operator-card').forEach(card=>{
  const code=card.querySelector('input')?.dataset.operatorCode,mark=card.querySelector('.operator-mark');
  if(mark&&logos[code]&&!mark.dataset.refLogo){mark.innerHTML=logos[code];mark.dataset.refLogo=code;}
 });
}
new MutationObserver(brandCards).observe($('operatorCards'),{childList:true});brandCards();

// Identidad con el nombre correcto de la unidad. No se toma la denominación inventada de la maqueta.
const header=document.querySelector('.topbar'),brand=header.querySelector('.brand'),session=header.querySelector('.session');
const identity=document.createElement('div');identity.className='institutional-id';
identity.innerHTML='<div class="ministry-id"><span class="peru-mark">PERÚ</span><span>Ministerio<br>de Transportes<br>y Comunicaciones</span></div><div class="dgic-id">Dirección de Gestión<br>de Inversiones en<br>Comunicaciones <strong>(DGIC)</strong></div>';
header.prepend(identity);
const right=document.createElement('div');right.className='topbar-right';
const updated=document.querySelector('.updated');
if(updated){const cal=document.createElement('span');cal.className='header-calendar';cal.innerHTML=icon('calendar');const label=document.createElement('span');label.className='header-date-label';label.textContent='Datos preparados';const time=$('snapshot'),refresh=$('refresh');updated.replaceChildren(cal,label,time,refresh);right.append(updated);}
right.append(session);header.append(right);
brand.querySelector('p').textContent='Seguimiento de compromisos de inversión en telecomunicaciones';
const note=document.createElement('span');note.className='academic-note';note.textContent='Proyecto académico de seguimiento. La presentación no sustituye los documentos contractuales.';document.querySelector('footer').append(note);

// Reubica los nodos originales; conserva los IDs que usa el controlador y el exportador.
const grid=document.querySelector('.visual-grid'),more=document.createElement('details');
more.className='card reference-more';more.id='referenceMore';more.innerHTML='<summary>'+icon('layers')+' Análisis por operador y año contractual</summary><div class="reference-more-body"></div>';
const moreBody=more.querySelector('div');
moreBody.append($('operatorCard'));grid.querySelectorAll('.operator-analytics').forEach(n=>moreBody.append(n));
document.querySelector('.detail-card').after(more);
const dept=document.createElement('article');dept.className='card reference-dept';
dept.innerHTML='<div class="card-head"><h3>Compromisos por departamento (Top 5)</h3><p id="referenceDeptCaption">Según la selección aplicada.</p></div><div id="referenceDepartments" class="bar-chart"></div>';
grid.append($('mapCard'),grid.querySelector('.state-card'),dept);
function mirrorDepartments(){
 const rows=[...$('departmentChart').querySelectorAll(':scope>.bar-row')];
 rows.sort((a,b)=>parseFloat(b.querySelector('.bar-fill')?.style.width||0)-parseFloat(a.querySelector('.bar-fill')?.style.width||0));
 $('referenceDepartments').replaceChildren(...rows.slice(0,5).map(n=>n.cloneNode(true)));
 if(!rows.length)$('referenceDepartments').textContent=$('departmentChart').textContent||'Esperando datos.';
 const caption=$('referenceDeptCaption');
 const active=document.querySelector('.project-tab.active')?.dataset.source;
 caption.textContent=active==='3.5 GHz-Km'?'Kilómetros comprometidos; no se suman con localidades.':active==='PLANTA REPORTADA_C4'?'Reportes C4; no son nuevos compromisos.':'Compromisos vigentes de la selección.';
}
new MutationObserver(mirrorDepartments).observe($('departmentChart'),{childList:true,subtree:true,characterData:true});mirrorDepartments();

// Cinco tarjetas en el consolidado sin inventar un estado "En atraso".
function entityCard(){
 const area=$('kpis'),native=[...area.querySelectorAll('.kpi:not([data-reference-extra])')];
 let extra=area.querySelector('[data-reference-extra]');
 const valid=body.classList.contains('operator-mode')&&!body.classList.contains('anexo2-5g-mode')&&native.length===4;
 const m=[...$('meta').querySelectorAll('span')].find(n=>/^Entidades:/.test(n.textContent));
 if(!valid||!m){extra?.remove();return;}
 const value=m.textContent.replace(/^Entidades:\s*/,'').trim();
 if(!extra){extra=document.createElement('article');extra.className='kpi';extra.dataset.referenceExtra='entities';extra.innerHTML='<div class="kpi-symbol" aria-hidden="true">'+icon('building')+'</div><div><span class="kpi-label">Entidades únicas</span><strong class="kpi-value"></strong><small>Sin duplicar por operador</small></div>';area.insertBefore(extra,native[3]);}
 if(extra.querySelector('.kpi-value').textContent!==value)extra.querySelector('.kpi-value').textContent=value;
}
new MutationObserver(entityCard).observe($('kpis'),{childList:true});new MutationObserver(entityCard).observe($('meta'),{childList:true});

// Mantiene los valores y estados de la leyenda; solo uniforma sus colores.
function stateChartColors(){
 const rows=[...$('stateChart').querySelectorAll('.legend-row')],donut=$('stateChart').querySelector('.donut');if(!donut)return;
 const values=rows.map(n=>Number((n.querySelector('strong')?.textContent||'').replace(/[^0-9]/g,''))),total=values.reduce((a,b)=>a+b,0);if(!total)return;
 let progress=0;const stops=[];
 rows.forEach((row,i)=>{const color=statusColor(row.querySelector('span')?.textContent||''),end=progress+values[i]*100/total;row.querySelector('i').style.background=color;stops.push(`${color} ${progress}% ${end}%`);progress=end;});
 donut.style.background='conic-gradient('+stops.join(',')+')';
}
new MutationObserver(stateChartColors).observe($('stateChart'),{childList:true});

const filterRoot=$('filters'),defaultClosed=new Set();let advancedOpen=false;
const priority=['OPERADOR','DEPARTAMENTO','PROVINCIA','DISTRITO','ANIO','ESTADO','SECTOR','TIPO','FUENTE'];
function filterPresentation(){
 const groups=[...filterRoot.querySelectorAll('.filter-group')];
 const context=(body.classList.contains('operator-mode')?'operator:':'project:')+(document.querySelector('.project-tab.active')?.dataset.source||'');
 const first=!defaultClosed.has(context);if(groups.length)defaultClosed.add(context);
 for(const group of groups){
  const summary=group.querySelector('summary');if(!summary)continue;
  if(!summary.dataset.refReady){
   const title=summary.textContent.trim();summary.textContent='';
   const label=document.createElement('span');label.className='filter-name';label.textContent=title;
   const display=document.createElement('span');display.className='filter-select-display';display.setAttribute('aria-hidden','true');display.innerHTML='<i></i>';
   summary.append(label,display);summary.dataset.refReady='true';
  }
  const boxes=[...group.querySelectorAll('[data-option]')],marked=boxes.filter(n=>n.checked),display=summary.querySelector('.filter-select-display');
  const text=marked.length===boxes.length&&boxes.length?'Todos ('+boxes.length+')':marked.length===0?'Ninguno':marked.length===1?(marked[0].closest('label')?.textContent.trim()||'1 seleccionado'):marked.length+' seleccionados';
  display.dataset.label=text;display.dataset.none=String(marked.length===0);summary.setAttribute('aria-label',summary.querySelector('.filter-name').textContent+': '+text);
  group.classList.toggle('filter-states',group.dataset.dimension==='ESTADO');
  if(first)group.open=group.dataset.dimension==='ESTADO';
  if(group.dataset.dimension==='ESTADO')group.querySelectorAll('.check').forEach(n=>n.style.setProperty('--status-color',statusColor(n.textContent)));
 }
 // Los filtros técnicos siguen disponibles, dentro de un grupo desplegable.
 let advanced=filterRoot.querySelector('.advanced-filters');
 if(!advanced&&groups.some(g=>!priority.includes(g.dataset.dimension))){advanced=document.createElement('details');advanced.className='advanced-filters';advanced.innerHTML='<summary>Más filtros · tecnología y contrato</summary>';advanced.open=advancedOpen;advanced.addEventListener('toggle',()=>{advancedOpen=advanced.open;});filterRoot.append(advanced);}
 for(const g of groups){if(advanced&&!priority.includes(g.dataset.dimension)&&g.parentElement!==advanced)advanced.append(g);}
}
let filterQueued=false;const queueFilters=()=>{if(filterQueued)return;filterQueued=true;queueMicrotask(()=>{filterQueued=false;filterPresentation();});};
new MutationObserver(queueFilters).observe(filterRoot,{childList:true});filterRoot.addEventListener('change',queueFilters);filterPresentation();

const map=$('map'),legend=$('mapLegend'),stage=document.createElement('div');stage.className='map-stage';map.before(stage);stage.append(map,legend);
const mapNote=$('mapNote'),notePanel=document.createElement('details');notePanel.className='map-note-panel';notePanel.innerHTML='<summary>Alcance del mapa y calidad de coordenadas</summary>';mapNote.before(notePanel);notePanel.append(mapNote);
const actions=$('mapCard').querySelector('.map-actions'),legendButton=document.createElement('button');legendButton.type='button';legendButton.className='link';legendButton.innerHTML=icon('layers')+' Leyenda';legendButton.id='referenceLegend';legendButton.setAttribute('aria-controls','mapLegend');legendButton.setAttribute('aria-expanded','true');
legendButton.onclick=()=>{legend.hidden=!legend.hidden;legendButton.setAttribute('aria-expanded',String(!legend.hidden));};actions.prepend(legendButton);
const mapLink=document.createElement('button');mapLink.type='button';mapLink.className='btn';mapLink.id='referenceViewMap';mapLink.innerHTML=icon('map')+' Vista mapa';mapLink.onclick=()=>{$('mapCard').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});$('fitMap').focus({preventScroll:true});};document.querySelector('.exports').append(mapLink);

const side=document.querySelector('.sidebar');side.id='referenceFilters';
const toggle=document.createElement('button');toggle.type='button';toggle.className='btn reference-mobile-filter';toggle.id='referenceToggleFilters';toggle.setAttribute('aria-controls',side.id);side.before(toggle);
const mobile=matchMedia('(max-width:760px)');let mobileOpen=false;
function setMobile(){body.classList.toggle('filters-closed',mobile.matches&&!mobileOpen);toggle.setAttribute('aria-expanded',String(!mobile.matches||mobileOpen));toggle.innerHTML=icon('filter')+(mobileOpen?' Ocultar filtros':' Mostrar filtros');}
toggle.onclick=()=>{mobileOpen=!mobileOpen;setMobile();};mobile.addEventListener('change',setMobile);setMobile();
let resizeFrame,lastW=0,lastH=0;
if(window.ResizeObserver)new ResizeObserver(([e])=>{if(lastW===e.contentRect.width&&lastH===e.contentRect.height)return;lastW=e.contentRect.width;lastH=e.contentRect.height;cancelAnimationFrame(resizeFrame);resizeFrame=requestAnimationFrame(()=>window.DGIC_MAP?.resize());}).observe(map);
document.querySelector('.version').textContent='Interfaz 5.0 · Referencia territorial · Supabase';
})();
