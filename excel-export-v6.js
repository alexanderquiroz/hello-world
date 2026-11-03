/* Exporta filas recuperadas de Supabase. Nunca usa los KPI globales como resumen de una selección. */
(() => {
'use strict';
const $=id=>document.getElementById(id),N='16333E';
const text=v=>v==null?'':typeof v==='object'?JSON.stringify(v):String(v);
const safe=v=>v==null?null:typeof v==='number'||typeof v==='boolean'?v:/^\s*[=+\-@]/.test(text(v))?"'"+text(v):text(v);
const kind=r=>r.reporte_c4_id!=null?'C4':r.segmento_id!=null?'Segmentos':'Compromisos';
const date=()=>new Intl.DateTimeFormat('es-PE',{dateStyle:'short',timeStyle:'short',timeZone:'America/Lima'}).format(new Date());
const labels={compromiso_id:'Compromiso ID',codigo_fuente:'Código fuente',fuente:'Proyecto',operador:'Operador',codigo_operador:'Código operador',departamento:'Departamento',provincia:'Provincia',distrito:'Distrito',localidad:'Localidad',entidad_beneficiaria:'Entidad',anio_compromiso:'Año contractual',codigo_tramo:'Ruta',descripcion_tramo:'Tramo',nombre_corredor:'Corredor',km_comprometidos:'Km del compromiso completo',km_en_ambito_exportado:'Km en departamentos filtrados',distancia_km:'Longitud del segmento (km)',coi:'COI de la localidad',coi_maestro:'COI consignado en maestro',coi_literal_maestro:'COI literal del maestro',configuracion_maestro:'Configuración consignada',estado_maestro:'ESTADO (maestro)',tipo_maestro:'TIPO (maestro)',carta_maestro:'CARTA (maestro)',operador_documento_maestro:'OPERADOR del documento (maestro)',hr_maestro:'HR (maestro)',fecha_carta_literal:'Fecha carta literal',oficio_mtc_maestro:'Oficio MTC',informe_mtc_maestro:'Informe MTC',fecha_mtc_literal:'Fecha MTC literal',comentario_maestro:'Comentario del maestro',condicion_maestro:'Condición en maestro',estacion_referencia_codigo:'Estación de referencia',sitio_implantacion_ubigeo:'UBIGEO de implantación',compromiso_aportante_id:'Compromiso que registra el valor',coi_estacion_referencia:'Valor compartido de estación (NO SUMAR)',configuracion_referencia:'Configuración del contrato original',valoracion_estado:'Control de valorización',valoracion_sustento_url:'Sustento de valorización',valoracion_sustento_pagina:'Página del sustento',alerta_maestro:'Alerta de cotejo',archivo_maestro:'Archivo maestro',url_maestro:'Enlace maestro',hoja_maestro:'Hoja maestro',fila_maestro:'Fila maestro',filas_maestro:'Filas maestro',maestro_sha256:'Huella del maestro',criterio_valoracion:'Criterio de valorización',estado_cambio:'Cambio de objetivo',es_vigente:'Vigente en base',tecnologias:'Tecnologías',estados_ejecucion:'Ejecución reportada',segmento_id:'Segmento ID',reporte_c4_id:'Reporte C4 ID',nombre_entidad:'Entidad C4',departamento_fuente:'Departamento fuente',codigo_tecnologia:'Tecnología fuente',estado_ejecucion:'Estado fuente',origen_anio:'Origen del año',valor_segmentos_informado:'Valor consignado en segmentos (no estaciones)',segmentos_sin_valor:'Segmentos sin valor',snapshot_actualizado_at:'Fecha de datos'};
const docFields=['condicion_maestro','estado_maestro','tipo_maestro','carta_maestro','operador_documento_maestro','hr_maestro','fecha_carta_literal','oficio_mtc_maestro','informe_mtc_maestro','fecha_mtc_literal','comentario_maestro','coi_maestro','coi_literal_maestro','configuracion_maestro','estacion_referencia_codigo','sitio_implantacion_ubigeo','compromiso_aportante_id','coi_estacion_referencia','configuracion_referencia','valoracion_estado','valoracion_sustento_url','valoracion_sustento_pagina','alerta_maestro','archivo_maestro','url_maestro','hoja_maestro','fila_maestro','filas_maestro','maestro_sha256','criterio_valoracion'];
function summaryModel(payload){
 const groups={Compromisos:[],Segmentos:[],C4:[]};payload.rows.forEach(r=>groups[kind(r)].push(r));
 const c=groups.Compromisos,s=groups.Segmentos,reports=groups.C4;
 const summary=[['Registros exportados',payload.rows.length],['Compromisos (no incluye C4 ni segmentos)',c.length],['Compromisos vigentes',c.filter(r=>r.es_vigente===true).length],['Originales históricos reemplazados',c.filter(r=>r.es_reemplazada===true).length],['Segmentos exportados (no son compromisos nuevos)',s.length],['Reportes C4 exportados (no son compromisos nuevos)',reports.length]];
 const bySource=new Map();c.forEach(r=>{const k=r.fuente||'Sin fuente';if(!bySource.has(k))bySource.set(k,{n:0,v:0});const g=bySource.get(k);g.n++;if(r.es_vigente)g.v++;});
 return {groups,summary,bySource:[...bySource].map(([f,x])=>[f,x.n,x.v])};
}
function common(ws){ws.properties.defaultRowHeight=20;ws.pageSetup={orientation:'landscape',fitToPage:true,fitToWidth:1,fitToHeight:0,paperSize:9,margins:{left:.25,right:.25,top:.4,bottom:.4,header:.2,footer:.2}};ws.headerFooter.oddFooter='&LDGIC · Exportación de consulta&C&P de &N&R'+date();}
function header(row){row.height=32;row.eachCell(c=>{c.font={name:'Aptos',size:10,bold:true,color:{argb:'FFFFFFFF'}};c.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF'+N}};c.alignment={vertical:'middle',wrapText:true};});}
const FONT={name:'Aptos',size:10,color:{argb:'FF253C44'}},FILL={type:'pattern',pattern:'solid',fgColor:{argb:'FFF3F6F6'}},WRAP={vertical:'top',wrapText:true},NOWRAP={vertical:'top',wrapText:false};
function makeData(wb,name,keys,rows,raw=false){
 const ws=wb.addWorksheet(name,{views:[{state:'frozen',xSplit:raw?2:1,ySplit:1,showGridLines:false}]});common(ws);
 ws.addRow(keys.map(k=>raw?k:labels[k]||k.replaceAll('_',' ')));header(ws.getRow(1));
 rows.forEach(r=>{const row=ws.addRow(keys.map(k=>safe(r[k])));row.height=raw?22:34;row.eachCell(c=>{c.font=FONT;c.alignment=raw?NOWRAP:WRAP;if(row.number%2===0)c.fill=FILL;});});
 keys.forEach((k,i)=>{const col=ws.getColumn(i+1);col.width=/id$|anio/.test(k)?14:/nombre|descripcion|entidad|localidad|alerta|criterio/.test(k)?32:/url|carta|informe|configuracion/.test(k)?30:22;if(/coi|valor|distancia|km_/.test(k)&&!(/estado|literal|sustento|criterio/.test(k)))col.numFmt='#,##0.00;[Red](#,##0.00);0.00';});
 ws.autoFilter={from:{row:1,column:1},to:{row:rows.length+1,column:keys.length}};ws.pageSetup.printTitlesRow='1:1';
 return ws;
}
function makeSummary(wb,payload,model){
 const ws=wb.addWorksheet('Resumen',{views:[{showGridLines:false}]});common(ws);ws.columns=[{width:47},{width:26},{width:24},{width:42}];
 ws.mergeCells('A1:D2');const title=ws.getCell('A1');title.value='DGIC / CONTROL TERRITORIAL';title.font={name:'Aptos',bold:true,size:20,color:{argb:'FFFFFFFF'}};title.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF'+N}};title.alignment={vertical:'middle'};ws.getRow(1).height=24;ws.getRow(2).height=20;
 const scope=payload.mode==='selected'?'Selección manual conservada entre páginas y proyectos':payload.mode==='all'?'Todos los resultados de la consulta aplicada':'Solo la página '+payload.context.page;
 const lines=[['Alcance de la descarga',scope],['Consulta activa',payload.context.source],['Generado en Lima',date()],['Datos preparados',payload.context.updated],['Regla de conteo','El resumen se calcula solo con las filas incluidas en este archivo.'],['Regla documental','APROBADO del maestro no equivale a ejecución ni a aceptación del servicio.'],['Regla de precios','No sumar valores compartidos de estación por localidad. Vacío no equivale a cero.']];
 if(payload.mode==='selected')lines.push(['Selección manual','Puede incluir otros proyectos o páginas. Los filtros actuales no limitan registros ya marcados.']);
 lines.forEach(x=>{const r=ws.addRow(x);ws.mergeCells(r.number,2,r.number,4);r.height=32;});
 ws.addRow([]);header(ws.addRow(['Contenido del archivo','Cantidad']));model.summary.forEach(x=>ws.addRow(x));
 ws.addRow([]);header(ws.addRow(['Proyecto de los compromisos','Históricos exportados','Vigentes exportados']));model.bySource.forEach(x=>ws.addRow(x));
 ws.addRow([]);header(ws.addRow([payload.mode==='selected'?'Filtros de la consulta activa (referencia)':'Filtros aplicados']));
 payload.context.filters.forEach(x=>{const r=ws.addRow(x);ws.mergeCells(r.number,2,r.number,4);r.height=30;});
 if(payload.context.search){const r=ws.addRow(['Búsqueda',safe(payload.context.search)]);ws.mergeCells(r.number,2,r.number,4);}
 ws.eachRow(r=>{if(r.number>2)r.eachCell(c=>{if(!c.font?.bold)c.font=FONT;c.alignment={vertical:'middle',wrapText:true};});});
}
function buildWorkbook(payload){
 if(!payload.rows.length)throw new Error('No hay registros en el alcance seleccionado.');
 const model=summaryModel(payload),wb=new ExcelJS.Workbook();wb.creator='DGIC';wb.created=new Date();wb.title='DGIC · Consulta y sustento documental';makeSummary(wb,payload,model);
 const display={Compromisos:['compromiso_id','codigo_fuente','fuente','operador','departamento','provincia','distrito','localidad','entidad_beneficiaria','codigo_tramo','descripcion_tramo','anio_compromiso','tecnologias','es_vigente','estado_cambio','estados_ejecucion','coi','km_comprometidos','km_en_ambito_exportado'],Segmentos:['segmento_id','compromiso_id','codigo_fuente_segmento','operador','departamento','codigo_tramo','descripcion_tramo','anio_compromiso','distancia_km','valorizacion','condicion_maestro'],C4:['reporte_c4_id','compromiso_id','fila_fuente','nombre_entidad','departamento_fuente','provincia_fuente','distrito_fuente','codigo_tecnologia','estado_ejecucion','operador']};
 for(const [k,rows]of Object.entries(model.groups)){if(!rows.length)continue;makeData(wb,k,display[k].filter(key=>rows.some(r=>Object.hasOwn(r,key))),rows);const keys=[...new Set(rows.flatMap(r=>Object.keys(r)))].filter(key=>rows.some(r=>r[key]!=null&&r[key]!==''));makeData(wb,'Datos_'+k,keys,rows,true);}
 const docs=payload.rows.filter(r=>r.archivo_maestro);if(docs.length)makeData(wb,'Sustento_maestro',['compromiso_id','segmento_id','codigo_fuente','operador','localidad','descripcion_tramo',...docFields],docs);
 return wb;
}
let busy=false;
async function download(mode){
 if(busy)return;busy=true;const app=window.DGIC_APP;app?.setExportBusy(true);const status=$('exportStatus');status.textContent='Recuperando todos los registros del alcance elegido…';
 try{
  if(!app||!window.ExcelJS)throw new Error('No se cargó el módulo de Excel. Recarga la página.');
  const payload=await app.exportRows(mode,(n,total)=>status.textContent=`Recuperados ${n.toLocaleString('es-PE')} de ${total.toLocaleString('es-PE')} registros…`);
  status.textContent='Preparando un solo libro de Excel…';const wb=buildWorkbook(payload);const bytes=await wb.xlsx.writeBuffer();
  const url=URL.createObjectURL(new Blob([bytes],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));const a=document.createElement('a');a.href=url;a.download='DGIC_'+(mode==='selected'?'Seleccion_acumulada':payload.context.source.replace(/[^\w-]/g,'_'))+'_'+mode+'_'+payload.rows.length+'_'+new Date().toISOString().slice(0,10)+'.xlsx';a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);status.textContent=`Excel preparado: ${payload.rows.length.toLocaleString('es-PE')} registros. El resumen corresponde a este archivo.`;
 }catch(e){status.textContent='No se descargó el archivo: '+(e.message||'Error de exportación');const box=$('errorBox');box.hidden=false;box.textContent=status.textContent;}
 finally{busy=false;app?.setExportBusy(false);}
}
for(const [id,mode] of [['exportPage','page'],['exportSelected','selected'],['exportAll','all']])if($(id))$(id).onclick=()=>download(mode);
window.DGIC_EXPORT_V6=Object.freeze({summaryModel,buildWorkbook});
})();
