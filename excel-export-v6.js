/* Integra los reportes compactos con los filtros y la selección existentes. */
(() => {
'use strict';
const $=id=>document.getElementById(id),app=window.DGIC_APP;
if(!app)return;
let engineReady;
function engine(){return engineReady ||= new Promise((resolve,reject)=>{if(window.DGIC_REPORTS_V7)return resolve(window.DGIC_REPORTS_V7);const s=document.createElement('script');s.src='./report-engine-v7.js?v=7.0.1';s.onload=()=>window.DGIC_REPORTS_V7?resolve(window.DGIC_REPORTS_V7):reject(new Error('No se cargó el generador de reportes.'));s.onerror=()=>{engineReady=null;reject(new Error('No se pudo descargar el generador. Recarga la página.'));};document.head.append(s);});}
const bands=['3.5 GHz-COI','3.5 GHz-Km','3.5 GHz - 5G (Entidades)'];
let busy=false,detailBusy=false,queued=false,refreshTimer;
function message(t,error=false){$('exportStatus').textContent=t;if(error){$('errorBox').hidden=false;$('errorBox').textContent=t;}}
function save(bytes,name,type){const url=URL.createObjectURL(new Blob([bytes],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);}
async function reconciliation(){try{const cfg=window.DGIC_CONFIG;const r=await fetch(cfg.SUPABASE_URL+'/rest/v1/rpc/dashboard_5g_control',{method:'POST',headers:{apikey:cfg.SUPABASE_PUBLISHABLE_KEY,'Content-Type':'application/json'},body:'{}'});if(!r.ok)return null;return await r.json();}catch(_){return null;}}
async function download(mode,format){
 if(busy||detailBusy){message('Se está completando una consulta. Vuelve a pulsar cuando finalice.');return;}
 busy=true;app.setExportBusy(true);document.querySelectorAll('[data-am-export]').forEach(b=>b.disabled=true);
 try{
  const api=await engine();message('Recuperando los registros del alcance elegido…');
  const payload=await app.exportRows(mode,(n,total)=>message(`Recuperados ${n.toLocaleString('es-PE')} de ${total.toLocaleString('es-PE')} registros…`));
  const stamp=JSON.stringify(app.context());payload.reconciliation=await reconciliation();
  if(stamp!==JSON.stringify(app.context())||$('detailArea').hidden)throw new Error('Cambió la consulta o la sesión. Ejecuta la descarga nuevamente.');
  const date=new Date().toLocaleDateString('en-CA',{timeZone:'America/Lima'}),tag=mode==='selected'?'Seleccion':mode==='page'?'Pagina':'Resultados';
  if(format==='word'){
   const m=api.model(payload);save(api.buildDocx(payload),'AM_3_5GHz_'+tag+'_'+date+'.docx','application/vnd.openxmlformats-officedocument.wordprocessingml.document');
   message(`Ayuda memoria: ${m.c.length} CCPP, ${m.segments.length} segmentos y ${m.a.length} asignaciones 5G. No incluye otros proyectos.`);
  }else{
   if(!window.ExcelJS)throw new Error('No se cargó ExcelJS. Recarga la página.');
   const wb=api.buildWorkbook(payload),bytes=await wb.xlsx.writeBuffer();
   if(stamp!==JSON.stringify(app.context())||$('detailArea').hidden)throw new Error('Cambió la consulta o la sesión. No se descargó el archivo.');
   save(bytes,'DGIC_Reporte_'+tag+'_'+date+'.xlsx','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');message('Excel preparado. Hojas imprimibles separadas por componente; sin las columnas internas de la base.');
  }
 }catch(e){message('No se descargó el reporte: '+e.message,true);}
 finally{busy=false;app.setExportBusy(false);updateAM();scheduleDetail();}
}
for(const [id,mode]of [['exportPage','page'],['exportSelected','selected'],['exportAll','all']])if($(id))$(id).onclick=()=>download(mode,'excel');
const toolbar=document.querySelector('.exports');
for(const [mode,label] of [['all','AM 3.5 GHz · resultados'],['selected','AM 3.5 GHz · selección']]){const b=document.createElement('button');b.type='button';b.className='btn';b.dataset.amExport=mode;b.title='Ayuda memoria Word, solo CCPP, entidades y vías de la banda 3.5 GHz';b.textContent=label;b.onclick=()=>download(mode,'word');toolbar.append(b);}
function updateAM(){const context=app.context();document.querySelectorAll('[data-am-export]').forEach(b=>{b.disabled=busy||$('detailArea').hidden||(b.dataset.amExport==='selected'?app.selectionCount()===0:!bands.includes(context.source)&&context.source!=='ALL');});}
new MutationObserver(updateAM).observe($('selectionCount'),{childList:true,characterData:true,subtree:true});
new MutationObserver(updateAM).observe($('detailArea'),{attributes:true,attributeFilter:['hidden']});
const pageSignature=()=>JSON.stringify([app.context(),[...$('tableBody').querySelectorAll('input[data-row]')].map(i=>i.dataset.row)]);
async function detailColumns(){
 if(busy||detailBusy){queued=true;return;}updateAM();if($('detailArea').hidden)return;
 const trs=[...$('tableBody').querySelectorAll('tr')].filter(t=>t.querySelector('input[data-row]'));if(!trs.length||trs.every(t=>t.querySelector('[data-report-config]')))return;
 const context=app.context();if(!bands.includes(context.source)&&context.source!=='ALL')return;
 detailBusy=true;const signature=pageSignature();
 try{
  const api=await engine(),payload=await app.exportRows('page');if(signature!==pageSignature()||$('detailArea').hidden)return;
  const key=r=>r.segmento_id!=null?'segmento:'+r.segmento_id:r.reporte_c4_id!=null?'c4:'+r.reporte_c4_id:'compromiso:'+r.compromiso_id;
  const map=new Map(payload.rows.map(r=>[key(r),r]));const header=$('tableHead').querySelector('tr');
  if(!header.querySelector('[data-report-config]')){for(const [k,label]of [['config','Configuración / referencia'],['price','COI / valor de configuración (USD)']]){const th=document.createElement('th');th.dataset['report'+(k==='config'?'Config':'Price')]='true';th.textContent=label;header.insertBefore(th,header.lastElementChild);}}
  for(const tr of trs){const r=map.get(tr.querySelector('input[data-row]').dataset.row);if(!r||tr.querySelector('[data-report-config]'))continue;
   const td=document.createElement('td');td.dataset.reportConfig='true';td.textContent=bands.includes(r.fuente)||r.segmento_id!=null?api.config(r):'No aplica';td.title=r.base_configuracion_reporte||'Configuración de la fuente; no acredita la instalación';td.style.maxWidth='250px';td.style.whiteSpace='normal';tr.insertBefore(td,tr.lastElementChild);
   const val=document.createElement('td');val.dataset.reportPrice='true';let amount=r.valor_configuracion_reporte??r.coi??r.valorizacion;
   if(Array.isArray(r.report_segments)){const gs=[...new Map(r.report_segments.map(s=>[s.grupo_valorizacion,s])).values()];val.textContent=gs.length===1?(gs[0].valor_configuracion_reporte==null?'Sin importe':api.fmt(gs[0].valor_configuracion_reporte,2)+' · compartido'):'Ver '+gs.length+' grupos';}
   else val.textContent=amount==null?(r.fuente==='3.5 GHz-COI'||r.segmento_id!=null?'Sin importe':'No aplica'):api.fmt(amount,2)+(r.valor_compartido?' · referencia compartida':'');
   val.title='USD sin IGV. Los valores de estaciones compartidas no se suman por fila. '+(r.base_valoracion_reporte||r.criterio_valoracion||'');tr.insertBefore(val,tr.lastElementChild);
  }
 }catch(e){if(signature===pageSignature()&&!/Aplica los filtros|Espera|Cambió|cambió|sesión/.test(e.message))message('La tabla se mantiene disponible. No se pudo cargar configuración y valor: '+e.message);}
 finally{detailBusy=false;if(queued){queued=false;scheduleDetail();}}
}
function scheduleDetail(){clearTimeout(refreshTimer);refreshTimer=setTimeout(detailColumns,200);}
new MutationObserver(scheduleDetail).observe($('tableBody'),{childList:true});
new MutationObserver(scheduleDetail).observe($('detailArea'),{attributes:true,attributeFilter:['hidden']});
updateAM();scheduleDetail();
const version=document.querySelector('.version');if(version)version.textContent='Interfaz 6.1 · Reportes imprimibles 3.5 GHz · Configuración y valorización';
})();
