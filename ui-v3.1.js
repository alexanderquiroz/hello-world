/* Interfaz conectada: sin datos de ejemplo. Los RPC calculan sobre PostgreSQL. */
(() => {
'use strict';
const $ = id => document.getElementById(id);
const UI = window.DGIC_UI;
const icon = name => UI.icon(name);
const cfg = window.DGIC_CONFIG;
const esc = v => String(v ?? '').replace(/[&<>"']/g, x => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
const num = (v,d=0) => v === null || v === undefined ? 'Sin dato' : new Intl.NumberFormat('es-PE',{maximumFractionDigits:d}).format(Number(v));
const names = {AMOV:'Claro',ENTEL:'Entel',INTEGRATEL:'Integratel',VIETTEL:'Viettel / Bitel'};
const statusNames = {PENDIENTE_FUENTE:'Pendiente en la fuente',EJECUTADO_REPORTADO:'Con evidencia de ejecución',REEMPLAZADA:'Localidad reemplazada',SIN_ESTADO:'Sin estado registrado',EVIDENCIA_NO_EJECUTADA:'Otra evidencia',SIN_CAMBIO:'Sin cambio',NUEVA_POR_REEMPLAZO:'Nueva por reemplazo',NO_APLICA:'No aplica',ATENDIDO:'Atendido',CASO_FORTUITO_FUERZA_MAYOR:'Caso fortuito o fuerza mayor'};
const human = v => statusNames[v] || v || 'Sin dato';
const colors = {AMOV:'#e35754',ENTEL:'#1976df',INTEGRATEL:'#12a480',VIETTEL:'#d8b326'};
const sources = [
 ['MOVIL_4G','MÓVIL 4G','antenna','Compromisos móviles 4G de AWS-A, AWS-B y 2.3 GHz.'],
 ['COBERTURA_MOVIL','COBERTURA MÓVIL','pin','Compromisos de cobertura móvil por localidad o distrito.'],
 ['ACCESO_INTERNET','ACCESO INTERNET','wifi','Entidades beneficiarias, accesos y velocidades comprometidas.'],
 ['3.5 GHz-COI','3.5 GHz-COI','dish','Compromisos de cobertura de localidades asociados a la banda de 3.5 GHz.'],
 ['3.5 GHz-Km','3.5 GHz-Km','road','Compromisos viales y sus segmentos. La unidad de cobertura es el kilómetro.'],
 ['PLANTA REPORTADA_C4','PLANTA REPORTADA C4','report','Reportes de atención y ejecución: no son nuevos compromisos contractuales.']
];
const dims = [
 ['OPERADOR','Operador','p_operador_ids','id'],['DEPARTAMENTO','Departamento','p_departamento_ids','id'],
 ['PROVINCIA','Provincia','p_provincia_ids','id'],['DISTRITO','Distrito','p_distrito_ids','id'],
 ['ANIO','Año contractual / periodo','p_periodos','code'],['CONTRATO','Contrato','p_contrato_ids','id'],
 ['TECNOLOGIA','Tecnología','p_tecnologia_ids','id'],['ESTADO','Estado registrado','p_estados','code'],
 ['SECTOR','Sector','p_sector_ids','id'],['TIPO','Tipo de compromiso','p_tipo_ids','id'],['FUENTE','Fuente','p_fuentes','code']
];
const S = {view:'project',source:'3.5 GHz-COI',contexts:{},catalog:[],session:null,summary:null,rows:[],chosen:new Set(),page:0,total:0,kind:'commitments',ticket:0,controller:null,map:null,layer:null};
let remember = false;
try { remember=sessionStorage.getItem('dgic.remember')==='yes'; } catch (_) {}
const memory = new Map();
const storage = {
 getItem:k=>{try{return remember?sessionStorage.getItem(k):memory.get(k)||null;}catch(_){return memory.get(k)||null;}},
 setItem:(k,v)=>{memory.set(k,v);try{if(remember)sessionStorage.setItem(k,v);}catch(_){}},
 removeItem:k=>{memory.delete(k);try{sessionStorage.removeItem(k);}catch(_){}}
};
if (!cfg || !window.supabase) { $('errorBox').hidden=false;$('errorBox').textContent='No se cargó la configuración o la biblioteca de Supabase. Revisa la conexión de red y vuelve a cargar.';return; }
const db = window.supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:true,storage,autoRefreshToken:true,detectSessionInUrl:false}});
const c4 = () => S.source==='PLANTA REPORTADA_C4';
const current = () => {
 const key=S.view+':'+S.source;
 return S.contexts[key] ||= {filters:Object.fromEntries(dims.map(([d])=>[d,null])),search:'',applied:null};
};
const clone = x => JSON.parse(JSON.stringify(x));
function notify(message) {$('errorBox').hidden=!message;$('errorBox').textContent=message||'';}
const safe = fn => (...args) => Promise.resolve().then(()=>fn(...args)).catch(e=>{if(e.name!=='AbortError'){notify(e.message||'No se pudo completar la consulta.');$('connection').textContent='Revisar conexión';}});
function optionValue(d,o) {return c4()||dims.find(x=>x[0]===d)?.[3]==='code'?String(o.valor_codigo??''):String(o.valor_id??'');}
function allowed(d) {
 let items=S.catalog.filter(o=>o.dimension===d);
 const parent={PROVINCIA:'DEPARTAMENTO',DISTRITO:'PROVINCIA',CONTRATO:'OPERADOR'}[d];
 if(parent) {
  let permitted=allowed(parent).map(o=>optionValue(parent,o));
  const sel=current().filters[parent];
  if(sel!==null) permitted=permitted.filter(v=>sel.includes(v));
  items=items.filter(o=>permitted.includes(String(o.parent_id)));
 }
 return items.sort((a,b)=>d==='ANIO'?Number(a.orden)-Number(b.orden):label(d,a).localeCompare(label(d,b),'es',{numeric:true,sensitivity:'base'}));
}
function label(d,o) {
 if(d==='OPERADOR')return names[o.valor_codigo]||({ 'América Móvil':'Claro','Viettel':'Viettel / Bitel'}[o.valor_label])||o.valor_label;
 if(d==='ESTADO')return human(o.valor_codigo);
 if(d==='CONTRATO') {
  const parent=S.catalog.find(p=>p.dimension==='OPERADOR'&&optionValue('OPERADOR',p)===String(o.parent_id));
  return o.valor_label+(parent?' · '+label('OPERADOR',parent):'');
 }
 return o.valor_label;
}
function renderFilters() {
 const opened=new Set([...document.querySelectorAll('.filter-group[open]')].map(x=>x.dataset.dimension));
 const initial=!$('filters').children.length;
 $('filters').innerHTML=dims.filter(([d])=>S.catalog.some(o=>o.dimension===d)&&(d!=='FUENTE'||S.source==='ALL')).map(([d,title])=>{
  const options=allowed(d),sel=current().filters[d];
  if(sel!==null)current().filters[d]=sel.filter(v=>options.some(o=>optionValue(d,o)===v));
  const values=current().filters[d];
  const all=values===null,none=values!==null&&values.length===0;
  return `<details class="filter-group" data-dimension="${d}" ${opened.has(d)||(initial&&['OPERADOR','DEPARTAMENTO','ANIO','ESTADO'].includes(d))?'open':''}><summary>${esc(title)}</summary><div class="filter-controls"><label><input type="checkbox" data-all="${d}" ${all?'checked':''}>Todos (${options.length})</label><button type="button" class="link" data-none="${d}">Ninguno</button></div>${options.length>7?`<input class="filter-search" type="search" aria-label="Buscar ${esc(title)}" placeholder="Buscar…">`:''}<div class="filter-options">${options.map(o=>{const v=optionValue(d,o);return `<label class="check"><input type="checkbox" data-option="${d}" value="${esc(v)}" ${all||values.includes(v)?'checked':''}><span>${esc(label(d,o))}</span></label>`;}).join('')||'<p class="empty-options">Sin opciones para esta selección.</p>'}</div>${none?'<small class="empty-options">Ninguna opción: la consulta no tendrá resultados.</small>':''}</details>`;
 }).join('');
 document.querySelectorAll('[data-all]').forEach(x=>{const v=current().filters[x.dataset.all];x.indeterminate=v!==null&&v.length>0;});
}
function changed(d) {
 if(d==='DEPARTAMENTO'){current().filters.PROVINCIA=null;current().filters.DISTRITO=null;}
 if(d==='PROVINCIA')current().filters.DISTRITO=null;
 if(d==='OPERADOR')current().filters.CONTRATO=null;
 renderFilters();$('filterMessage').textContent='Filtros editados. Pulsa Aplicar.';
}
function rpcParams() {
 const p={};
 dims.forEach(([d,,key,type])=>{const values=current().filters[d];p[key]=values===null?null:values.map(v=>type==='id'?Number(v):v);});
 p.p_fuentes=S.source==='ALL'?p.p_fuentes:[S.source];
 p.p_busqueda=current().search.trim()||null;
 return p;
}
function c4Params() {const p={};dims.forEach(([d])=>{if(current().filters[d]!==null)p[d]=current().filters[d];});p.busqueda=current().search;return p;}
async function result(query) {const {data,error}=await query;if(error){const e=new Error(error.message||'Error de Supabase');if(error.message?.includes('AbortError'))e.name='AbortError';throw e;}return data;}
function withSignal(query) {return S.controller?query.abortSignal(S.controller.signal):query;}
async function catalog(source) {
 const rows=[];
 for(let offset=0;offset<20000;offset+=500) {
  const page=await result(withSignal(db.rpc('dashboard_catalogo_proyecto',{p_fuente:source==='ALL'?null:source}).range(offset,offset+499)));
  rows.push(...page);if(page.length<500)return rows;
 }
 throw new Error('El catálogo supera el límite de carga. No se ha mostrado un catálogo parcial.');
}
function tabs() {
 $('projectTabs').innerHTML=(S.view==='operator'?[['ALL','TODOS LOS PROYECTOS','layers']]:[]).concat(sources).map(([id,title,iconName])=>`<button class="project-tab ${S.source===id?'active':''}" data-source="${esc(id)}" aria-current="${S.source===id?'page':'false'}"><span class="tab-icon" aria-hidden="true">${icon(iconName)}</span><span class="tab-label">${title}</span></button>`).join('');
 document.querySelectorAll('[data-view]').forEach(b=>{b.classList.toggle('active',b.dataset.view===S.view);b.setAttribute('aria-pressed',String(b.dataset.view===S.view));});
 const meta=sources.find(x=>x[0]===S.source);
 $('moduleTitle').textContent=meta?.[1]||'Vista consolidada por operador';
 $('moduleIcon').innerHTML=icon(meta?.[2]||'layers');
 $('moduleDescription').textContent=meta?.[3]||'Compara las cinco fuentes de compromisos. Planta C4 permanece como evidencia independiente.';
 $('contextNote').textContent=c4()?'Solo Planta C4. Los filtros y los conteos corresponden a reportes, no a obligaciones nuevas.':S.source==='ALL'?'Vista por operador: las fuentes se consolidan sin sumar C4 como nuevos compromisos. Selecciona uno o varios operadores.':'Solo '+S.source+'. Ningún otro proyecto se suma a los resultados de esta pestaña.';
 $('search').value=current().search;
 $('detailTitle').textContent=c4()?'Detalle de Planta C4':S.kind==='segments'?'Detalle de segmentos viales':'Detalle de compromisos · '+(meta?.[1]||'todas las fuentes');
 $('detailMode').hidden=S.source!=='3.5 GHz-Km';
 document.querySelectorAll('[data-detail]').forEach(b=>b.classList.toggle('active',b.dataset.detail===S.kind));
}
function clearDetails() {
 S.rows=[];S.chosen.clear();$('tableBody').replaceChildren();$('tableHead').replaceChildren();$('rowCount').textContent='';$('selectionCount').textContent='';
 $('exportPage').disabled=$('exportSelected').disabled=true;
 if($('recordDialog').open)$('recordDialog').close();$('recordFields').replaceChildren();
 clearMap();
}
function clearMap() {if(S.map){S.map.remove();S.map=null;}S.layer=null;$('map').innerHTML='<div class="map-placeholder">'+(S.session?'Las ubicaciones se cargarán con el detalle de esta página.':'Inicia sesión para consultar las coordenadas del detalle.')+'</div>';$('mapNote').textContent='';}
function authUI() {
 $('loginButton').hidden=!!S.session;$('logoutButton').hidden=!S.session;
 $('sessionLabel').textContent=UI.accountLabel(S.session?.user);
 $('detailGate').hidden=!!S.session;$('detailArea').hidden=!S.session;
 $('c4Gate').hidden=!(c4()&&!S.session);
}
async function load({reloadCatalog=false}={}) {
 const ticket=++S.ticket;
 if(S.controller)S.controller.abort();S.controller=new AbortController();
 notify('');$('filterMessage').textContent='';$('loading').hidden=false;$('connection').textContent='Consultando…';$('results').hidden=true;clearDetails();tabs();authUI();
 try {
  if(c4()&&!S.session){S.catalog=[];$('filters').replaceChildren();$('results').hidden=true;$('connection').textContent='Resumen público';return;}
  if(c4()) {
   current().applied=c4Params();
   const data=await result(withSignal(db.rpc('dashboard_c4_panel',{p_filtros:current().applied,p_limit:cfg.PAGE_SIZE,p_offset:S.page*cfg.PAGE_SIZE})));
   if(ticket!==S.ticket)return;
   S.catalog=data.catalogos;renderFilters();S.summary=data;S.total=data.kpi.registros;
   renderC4(data);renderRows(data.filas);timestamp(data.kpi.actualizado_at);
  } else {
   if(reloadCatalog){S.catalog=await catalog(S.source);if(ticket!==S.ticket)return;renderFilters();}
   current().applied=rpcParams();
   const data=await result(withSignal(db.rpc('dashboard_resumen_filtrado',current().applied)));
   if(ticket!==S.ticket)return;
   if(!data?.kpi)throw new Error('El RPC no devolvió indicadores válidos.');
   S.summary=data;S.total=data.kpi.registros_historicos;renderSummary(data);
   if(S.session)await detail(ticket);
   if(ticket!==S.ticket)return;
   const stamp=await result(withSignal(db.from('dashboard_kpi').select('snapshot_actualizado_at').limit(1)));
   if(ticket!==S.ticket)return;timestamp(stamp?.[0]?.snapshot_actualizado_at);
  }
  if(ticket===S.ticket){$('results').hidden=false;$('connection').textContent='Conectado a Supabase';if(S.map)setTimeout(()=>S.map?.invalidateSize(),50);}
 }catch(e){if(ticket===S.ticket&&e.name!=='AbortError'){notify('No se pudo cargar esta consulta: '+e.message);$('connection').textContent='Error de consulta';}}
 finally {if(ticket===S.ticket)$('loading').hidden=true;}
}
function timestamp(value) {$('snapshot').textContent=value?new Intl.DateTimeFormat('es-PE',{dateStyle:'medium',timeStyle:'short',timeZone:'America/Lima'}).format(new Date(value))+' (Perú)':'Sin fecha informada';}
function cards(items) {$('kpis').innerHTML=items.map(([title,value,note,iconName='antenna',dec=0])=>`<article class="kpi"><div class="kpi-symbol" aria-hidden="true">${icon(iconName)}</div><div><span class="kpi-label">${esc(title)}</span><strong class="kpi-value">${num(value,dec)}</strong><small>${esc(note)}</small></div></article>`).join('');}
function bars(id,rows,labelKey,valueKey,unit='') {
 const max=Math.max(1,...rows.map(r=>Number(r[valueKey])||0));
 $(id).innerHTML=rows.length?rows.map((r,i)=>`<div class="bar-row"><div class="bar-caption"><span>${esc(labelKey==='operador'?(names[r.codigo_operador]||r[labelKey]):r[labelKey])}</span><strong>${num(r[valueKey],unit?2:0)}${esc(unit)}</strong></div><div class="bar-track"><div class="bar-fill" style="width:${Math.max(0,Number(r[valueKey])||0)/max*100}%;background:${colors[r.codigo_operador]||['#3478d4','#32977e','#7495bd','#8182b7'][i%4]}"></div></div></div>`).join(''):'<p class="no-data">Sin datos para estos filtros.</p>';
}
function donut(rows,countKey,stateKey) {
 const palette=['#397ae8','#8264bc','#20a36a','#c49a47','#8d9eaf'];const total=rows.reduce((n,r)=>n+(Number(r[countKey])||0),0);let angle=0;
 const stops=rows.map((r,i)=>{const start=angle;angle+=total?Number(r[countKey])/total*100:0;return `${palette[i%palette.length]} ${start}% ${angle}%`;});
 $('stateChart').innerHTML=total?`<div class="donut-layout"><div class="donut" style="background:conic-gradient(${stops.join(',')})"><div class="donut-center">${num(total)}<small>registros</small></div></div><div class="legend">${rows.map((r,i)=>`<div class="legend-row"><i style="background:${palette[i%palette.length]}"></i><span>${esc(human(r[stateKey]))}</span><strong>${num(r[countKey])}</strong></div>`).join('')}</div></div>`:'<div class="no-data">Sin registros.</div>';
}
function renderSummary(data) {
 const k=data.kpi;
 const coi=S.source==='3.5 GHz-COI',vial=S.source==='3.5 GHz-Km',internet=S.source==='ACCESO_INTERNET';
 const pct=k.pct_evidencia_ejecutada==null?'Sin base de cálculo':num(k.pct_evidencia_ejecutada,2)+'% de vigentes';
 if(coi)cards([['Localidades vigentes',k.localidades,'Según la información cargada','antenna'],['Reemplazadas',k.localidades_reemplazadas,'Originales conservadas en el histórico','refresh'],['Nuevas por reemplazo',k.nuevas_por_reemplazo,'No son obligaciones adicionales','add'],['Sin evidencia',k.sin_evidencia_ejecucion,'No implica incumplimiento','clock'],['Población-compromiso',k.poblacion_compromiso,'No representa personas únicas','users']]);
 else if(vial)cards([['Kilómetros comprometidos',k.kilometros_comprometidos,'Incluye segmentos preservados','road',2],['Compromisos viales',k.compromisos_vigentes,'Registros padre vigentes','antenna'],['Contratos',k.contratos,'Presentes en la selección','report'],['Con evidencia',k.con_evidencia_ejecutada,pct,'check'],['Sin evidencia',k.sin_evidencia_ejecucion,'No implica incumplimiento','clock']]);
 else cards([['Compromisos vigentes',k.compromisos_vigentes,'Excluye localidades reemplazadas','antenna'],['Con evidencia',k.con_evidencia_ejecutada,pct,'check'],['Sin evidencia',k.sin_evidencia_ejecucion,'No implica incumplimiento','clock'],[internet?'Entidades':'Localidades',internet?k.entidades:k.localidades,'Identificadores únicos vigentes',internet?'building':'pin'],[internet?'Accesos comprometidos':'Kilómetros comprometidos',internet?k.accesos_comprometidos:k.kilometros_comprometidos,internet?'Suma de accesos, no entidades':'No se suman con localidades','road',internet?0:2]]);
 $('meta').innerHTML=`<span>Histórico: ${num(k.registros_historicos)} registros</span><span>Vigentes: ${num(k.compromisos_vigentes)}</span><span>Con evidencia: ${num(k.con_evidencia_ejecutada)} (${esc(pct)})</span><span>Entidades: ${num(k.entidades)}</span><span>Los reemplazos no se suman dos veces</span>`;
 $('operatorTitle').textContent=S.view==='operator'&&S.source==='ALL'?'Registros por fuente (histórico)':'Compromisos vigentes por operador';
 $('operatorSubtitle').textContent=S.view==='operator'&&S.source==='ALL'?'C4 no se suma en esta gráfica.':'Solo dentro del proyecto y filtros aplicados.';
 if(S.view==='operator'&&S.source==='ALL')bars('operatorChart',data.fuentes,'fuente','compromisos');else bars('operatorChart',data.operadores,'operador','vigentes');
 $('stateTitle').textContent='Estado de los registros (histórico)';donut(data.estados,'compromisos','estado_bi');
 bars('departmentChart',data.departamentos,'departamento',vial?'kilometros_comprometidos':'vigentes',vial?' km':'');
 $('periodTitle').textContent='Por periodo contractual';bars('periodChart',data.periodos,'periodo',vial?'kilometros_comprometidos':'vigentes',vial?' km':'');
 $('detailDescription').textContent='Una fila por compromiso, incluidas localidades originales reemplazadas. La selección de filas solo afecta a la descarga.';
}
function renderC4(data) {
 const k=data.kpi;cards([['Registros C4',k.registros,'Filas fuente, incluidas repeticiones','report'],['Grupos únicos',k.grupos_unicos,'Agrupaciones exactas de la fuente','antenna'],['Entidades',k.entidades,'Identificadas en la selección','users'],['Atendidos reportados',k.atendidos,'Filas con estado de atención','check'],['Sin vínculo a compromiso',k.sin_vinculo,'No se asignan por suposición','clock']]);
 $('meta').innerHTML=`<span>Con vínculo: ${num(k.vinculados)}</span><span>Otras evidencias: ${num(k.otras_evidencias)}</span><span>No se suman a los compromisos contractuales</span>`;
 $('operatorTitle').textContent='Reportes por operador enlazado';$('operatorSubtitle').textContent='Los casos sin vínculo se mantienen separados.';bars('operatorChart',data.operadores,'operador','registros');
 $('stateTitle').textContent='Estado de los reportes C4';donut(data.estados,'registros','estado');bars('departmentChart',data.departamentos,'departamento','registros');
 $('periodTitle').textContent='Periodo C4';$('periodChart').innerHTML='<p class="no-data">No hay un año contractual equivalente informado en esta fuente.</p>';
 $('detailDescription').textContent='Una fila por reporte C4. Se conservan repeticiones y casos sin vínculo contractual.';
}
async function detail(ticket) {
 if(!S.session)return;
 if(S.kind==='segments'&&S.source==='3.5 GHz-Km') {
  const d=await result(withSignal(db.rpc('dashboard_segmentos_panel',{p_filtros:current().applied,p_limit:cfg.PAGE_SIZE,p_offset:S.page*cfg.PAGE_SIZE})));
  if(ticket!==S.ticket)return;S.total=d.total;renderRows(d.filas);
  $('detailDescription').textContent='Una fila por segmento; se conservan repeticiones fuente. Distancia de esta selección: '+num(d.kilometros,4)+' km.';
 }else {
  const rows=await result(withSignal(db.rpc('dashboard_detalle_filtrado',{...current().applied,p_limit:cfg.PAGE_SIZE,p_offset:S.page*cfg.PAGE_SIZE})));
  if(ticket!==S.ticket)return;S.total=S.summary.kpi.registros_historicos;renderRows(rows);
 }
}
function rowKey(r) {return c4()?r.reporte_c4_id:S.kind==='segments'?r.segmento_id:r.compromiso_id;}
function badge(text) {return `<span class="badge ${text==='REEMPLAZADA'||text==='NUEVA_POR_REEMPLAZO'?'change':text==='ATENDIDO'||text==='INSTALADO'?'ok':''}">${esc(human(text))}</span>`;}
function renderRows(rows) {
 S.rows=rows||[];S.chosen.clear();
 const heads=c4()?['Registro','Entidad','Departamento','Tecnología','Estado reportado','Operador enlazado','Vínculo a compromiso']:S.kind==='segments'?['Segmento','Operador','Departamento','Año','Tramo','Distancia (km)','Repetición fuente']:['Código','Operador','Localidad / Entidad','Departamento','Año contractual','Tecnologías','Ejecución reportada','Cambio de localidad'];
 $('tableHead').innerHTML='<tr><th><input id="selectPage" type="checkbox" aria-label="Seleccionar esta página"></th>'+heads.map(h=>`<th>${h}</th>`).join('')+'<th>Ficha</th></tr>';
 $('tableBody').innerHTML=S.rows.length?S.rows.map(r=>{
  let cells;
  if(c4())cells=[r.fila_fuente,r.nombre_entidad||r.entidad_valor_normalizado||r.entidad_beneficiaria_fuente,r.departamento_fuente,r.codigo_tecnologia,r.estado_ejecucion,names[r.codigo_operador]||r.operador||'Sin vínculo',r.compromiso_id??'Sin vínculo'];
  else if(S.kind==='segments')cells=[r.segmento_id,names[r.codigo_operador]||r.operador,r.departamento,r.anio_compromiso==null?'Sin periodo':'Año '+r.anio_compromiso,r.codigo_tramo,num(r.distancia_km,4),r.repeticiones_grupo>1?r.orden_repeticion+' / '+r.repeticiones_grupo:'Sin repetición'];
  else cells=[r.codigo_fuente,names[r.codigo_operador]||r.operador,r.localidad||r.entidad_beneficiaria||r.descripcion_tramo||r.distrito,r.departamento||r.departamentos_viales,r.periodo||'Sin periodo',r.tecnologias,r.estados_ejecucion||'Sin evidencia',human(r.estado_cambio)];
  return `<tr><td><input type="checkbox" data-row="${esc(rowKey(r))}" aria-label="Seleccionar registro ${esc(rowKey(r))}"></td>${cells.map(v=>`<td title="${esc(v??'Sin dato')}">${esc(v??'Sin dato')}</td>`).join('')}<td><button class="btn" data-record="${esc(rowKey(r))}">${icon('report')}<span>Ver todo</span></button></td></tr>`;
 }).join(''):`<tr><td colspan="${heads.length+2}" class="no-data">Sin registros para esta selección.</td></tr>`;
 const start=S.total?S.page*cfg.PAGE_SIZE+1:0;
 $('rowCount').textContent=`${num(start)}–${num(Math.min((S.page+1)*cfg.PAGE_SIZE,S.total))} de ${num(S.total)}`;
 $('pageNumber').textContent='Página '+(S.page+1);$('previous').disabled=S.page===0;$('next').disabled=(S.page+1)*cfg.PAGE_SIZE>=S.total;
 $('exportPage').disabled=!S.session||!S.rows.length;selectionUI();renderMap();
}
function selectionUI() {
 $('selectionCount').textContent=S.chosen.size?S.chosen.size+' seleccionados en esta página':'';$('exportSelected').disabled=!S.session||!S.chosen.size;
 const box=$('selectPage');if(box){box.checked=S.rows.length>0&&S.chosen.size===S.rows.length;box.indeterminate=S.chosen.size>0&&S.chosen.size<S.rows.length;}
}
function coordinate(v,max) {if(v===null||v===undefined||String(v).trim()==='')return null;const n=Number(String(v).trim().replace(',','.'));return Number.isFinite(n)&&Math.abs(n)<=max?n:null;}
function renderMap() {
 clearMap();if(!S.session)return;
 if(!window.L){$('map').innerHTML='<div class="map-placeholder">No se pudo cargar el mapa base. Las coordenadas siguen disponibles en Ver todo.</div>';return;}
 $('map').replaceChildren();S.map=L.map('map',{scrollWheelZoom:false}).setView([-9.2,-75.1],5);S.layer=L.featureGroup().addTo(S.map);
 L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:18,attribution:'&copy; OpenStreetMap contributors'}).addTo(S.map);
 let plotted=0;
 for(const r of S.rows) {
  const color=colors[r.codigo_operador]||'#5c79a4';
  if(S.kind==='segments'&&!c4()) {
   const a=coordinate(r.latitud_inicio,90),b=coordinate(r.longitud_inicio,180),x=coordinate(r.latitud_fin,90),y=coordinate(r.longitud_fin,180);
   if([a,b,x,y].some(v=>v===null)||(a===0&&b===0)||(x===0&&y===0))continue;
   L.polyline([[a,b],[x,y]],{color,weight:3,dashArray:'5 4'}).bindPopup('Segmento '+esc(r.segmento_id)+' · '+num(r.distancia_km,4)+' km<br>Línea entre extremos; no es un trazado medido.').addTo(S.layer);plotted++;
  }else {
   const lat=coordinate(c4()?r.latitud_fuente:r.latitud,90),lon=coordinate(c4()?r.longitud_fuente:r.longitud,180);
   if(lat===null||lon===null||(lat===0&&lon===0))continue;
   L.circleMarker([lat,lon],{radius:5,color,fillColor:color,fillOpacity:.8,weight:1}).bindPopup(esc(c4()?r.entidad_valor_normalizado:r.localidad||r.entidad_beneficiaria||r.codigo_fuente)).addTo(S.layer);plotted++;
  }
 }
 if(plotted)S.map.fitBounds(S.layer.getBounds(),{padding:[20,20],maxZoom:13});
 $('mapSubtitle').textContent='Solo los registros de la página actual; no el universo completo.';
 $('mapNote').textContent=plotted+' de '+S.rows.length+' registros con coordenadas válidas.'+(S.kind==='segments'?' Líneas entre extremos, no rutas medidas.':'');
 setTimeout(()=>S.map?.invalidateSize(),60);
}
function record(id) {
 const r=S.rows.find(x=>String(rowKey(x))===id);if(!r)return;
 $('recordFields').innerHTML=Object.entries(r).map(([k,v])=>`<div class="field"><span>${esc(k==='es_retirado'?'Indicador legado de localidad reemplazada':k.replaceAll('_',' '))}</span><strong>${esc(v===null?'Sin dato':typeof v==='boolean'?(v?'Sí':'No'):typeof v==='object'?JSON.stringify(v):v)}</strong></div>`).join('');$('recordDialog').showModal();
}
function csvCell(v) {let s=v==null?'':typeof v==='object'?JSON.stringify(v):String(v);if(typeof v==='string'&&/^\s*[=+\-@]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';}
function download(selectedOnly) {
 if(!S.session)throw new Error('Inicia sesión para descargar el detalle.');
 const rows=selectedOnly?S.rows.filter(r=>S.chosen.has(String(rowKey(r)))):S.rows;
 if(!rows.length)return;const columns=Object.keys(rows[0]);
 const csv='\uFEFF'+[columns.map(csvCell).join(','),...rows.map(r=>columns.map(k=>csvCell(r[k])).join(','))].join('\r\n');
 const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='DGIC_'+S.source.replace(/[^\w-]/g,'_')+'_pagina_'+(S.page+1)+(selectedOnly?'_seleccion':'')+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
async function switchSource(source,view=S.view) {
 const operator=S.view==='operator'?clone(current().filters.OPERADOR):null;
 S.view=view;S.source=source;S.kind='commitments';S.page=0;S.catalog=[];$('filters').replaceChildren();
 if(view==='operator'&&operator!==null)current().filters.OPERADOR=operator;
 await load({reloadCatalog:true});
}
$('projectTabs').onclick=safe(e=>{const b=e.target.closest('[data-source]');if(b)return switchSource(b.dataset.source);});
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=safe(()=>switchSource(b.dataset.view==='operator'?'ALL':'3.5 GHz-COI',b.dataset.view)));
$('filters').onchange=e=>{
 const t=e.target,d=t.dataset.option||t.dataset.all;if(!d)return;
 if(t.dataset.all)current().filters[d]=t.checked?null:[];
 else {const values=current().filters[d]===null?allowed(d).map(o=>optionValue(d,o)):[...current().filters[d]];const set=new Set(values);t.checked?set.add(t.value):set.delete(t.value);current().filters[d]=set.size===allowed(d).length?null:[...set];}
 changed(d);
};
$('filters').onclick=e=>{const b=e.target.closest('[data-none]');if(b){current().filters[b.dataset.none]=[];changed(b.dataset.none);}};
$('filters').oninput=e=>{if(!e.target.classList.contains('filter-search'))return;const q=e.target.value.toLocaleLowerCase('es');e.target.closest('.filter-group').querySelectorAll('.check').forEach(row=>row.hidden=!row.textContent.toLocaleLowerCase('es').includes(q));};
$('applyFilters').onclick=safe(()=>{S.page=0;current().search=$('search').value.trim();return load();});
$('clearFilters').onclick=safe(()=>{current().filters=Object.fromEntries(dims.map(([d])=>[d,null]));current().search='';$('search').value='';S.page=0;renderFilters();return load();});
$('searchForm').onsubmit=e=>{e.preventDefault();safe(()=>{current().search=$('search').value.trim();S.page=0;return load();})();};
$('refresh').onclick=safe(()=>{S.page=0;return load({reloadCatalog:true});});
document.querySelectorAll('[data-detail]').forEach(b=>b.onclick=safe(()=>{S.kind=b.dataset.detail;S.page=0;return load();}));
$('previous').onclick=safe(()=>{if(S.page){S.page--;return load();}});
$('next').onclick=safe(()=>{if((S.page+1)*cfg.PAGE_SIZE<S.total){S.page++;return load();}});
$('tableBody').onchange=e=>{if(!e.target.dataset.row)return;e.target.checked?S.chosen.add(e.target.dataset.row):S.chosen.delete(e.target.dataset.row);selectionUI();};
$('tableHead').onchange=e=>{if(e.target.id!=='selectPage')return;S.chosen=new Set(e.target.checked?S.rows.map(r=>String(rowKey(r))):[]);$('tableBody').querySelectorAll('[data-row]').forEach(x=>x.checked=S.chosen.has(x.dataset.row));selectionUI();};
$('tableBody').onclick=e=>{const b=e.target.closest('[data-record]');if(b)record(b.dataset.record);};
$('exportPage').onclick=safe(()=>download(false));$('exportSelected').onclick=safe(()=>download(true));
$('fitMap').onclick=()=>{if(S.map&&S.layer?.getLayers().length)S.map.fitBounds(S.layer.getBounds(),{padding:[20,20],maxZoom:13});};
const openLogin=()=>{$('loginError').textContent='';$('remember').checked=remember;$('password').type='password';$('togglePassword').setAttribute('aria-pressed','false');$('togglePassword').setAttribute('aria-label','Mostrar contraseña');$('togglePassword').innerHTML=icon('eye');$('loginDialog').showModal();if(!$('username').value)$('username').value='DGIC';$('username').focus();};
$('loginButton').onclick=openLogin;document.querySelectorAll('.open-login').forEach(b=>b.onclick=openLogin);
document.querySelectorAll('.close-dialog').forEach(b=>b.onclick=()=>{b.closest('dialog').close();$('password').value='';});
$('loginDialog').addEventListener('close',()=>{$('password').value='';$('password').type='password';});
$('togglePassword').onclick=()=>{const show=$('password').type==='password';$('password').type=show?'text':'password';$('togglePassword').setAttribute('aria-pressed',String(show));$('togglePassword').setAttribute('aria-label',show?'Ocultar contraseña':'Mostrar contraseña');$('togglePassword').innerHTML=icon(show?'eyeOff':'eye');};
$('loginForm').onsubmit=async e=>{
 e.preventDefault();$('submitLogin').disabled=true;$('loginError').textContent='';
 try {
  remember=$('remember').checked;try{remember?sessionStorage.setItem('dgic.remember','yes'):sessionStorage.removeItem('dgic.remember');}catch(_){}
  const email=UI.resolveLogin($('username').value);
  const {data,error}=await db.auth.signInWithPassword({email,password:$('password').value});
  if(error)throw error;S.session=data.session;authUI();$('loginDialog').close();
 }catch(error){$('loginError').textContent='No se pudo iniciar sesión. Revisa el usuario y la contraseña. En el primer acceso, la cuenta debe estar creada y confirmada en Supabase Auth.';}
 finally {$('password').value='';$('submitLogin').disabled=false;}
};
$('logoutButton').onclick=safe(async()=>{const {error}=await db.auth.signOut({scope:'local'});if(error)throw error;S.session=null;clearDetails();authUI();});
(async()=>{
 try {
  tabs();renderFilters();
  const {data,error}=await db.auth.getSession();if(error)throw error;S.session=data.session;authUI();
  db.auth.onAuthStateChange((event,session)=>{S.session=session;authUI();if(event==='SIGNED_OUT'){clearDetails();}if(['SIGNED_IN','SIGNED_OUT','USER_UPDATED'].includes(event))setTimeout(()=>{S.page=0;load({reloadCatalog:true});},0);});
  await load({reloadCatalog:true});
 }catch(e){notify('No se pudo iniciar el dashboard: '+e.message);$('connection').textContent='Error';}
})();
})();