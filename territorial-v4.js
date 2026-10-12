/* Capa visual territorial. No consulta la BD ni modifica el estado de negocio. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  if (!$('mapCard') || !$('departmentChart') || document.body.dataset.territorialReady) return;
  document.body.dataset.territorialReady = 'true';
  document.body.classList.add('territorial-v4');
  const icon = name => window.DGIC_UI?.icon(name) || '';
  const badgeStyle=document.createElement('style');
  badgeStyle.textContent='.territorial-v4 .filter-selection-count::before{content:attr(data-label)}';
  document.head.append(badgeStyle);
  const grid = document.querySelector('.visual-grid');
  const side = document.querySelector('.sidebar');
  side.id = 'territorialFilters';

  // Reubicar los mismos nodos conserva listeners, IDs y la actualización original.
  const more = document.createElement('details');
  more.className = 'card territorial-more';
  more.id = 'territorialMore';
  more.innerHTML = '<summary>'+icon('layers')+' Análisis por operador y periodo</summary><div class="territorial-more-body"></div>';
  const moreBody = more.querySelector('div');
  ['operatorCard'].forEach(id => { if ($(id)) moreBody.append($(id)); });
  grid.querySelectorAll('.operator-analytics').forEach(el => moreBody.append(el));
  grid.insertAdjacentElement('afterend', more);

  const dept = document.createElement('article');
  dept.className = 'card territorial-department-card';
  dept.innerHTML = '<div class="card-head"><h3>Distribución por departamento</h3><p id="territorialDeptNote">Hasta cinco resultados de la selección.</p></div><div id="territorialDepartment" class="bar-chart"></div>';
  const state = grid.querySelector('.state-card');
  grid.append($('mapCard'), state, dept);

  // Copia visual de barras ya calculadas. No se vuelve a sumar ni se cambia la unidad.
  const departmentSource = $('departmentChart');
  const departmentTarget = $('territorialDepartment');
  function mirrorDepartments() {
    const rows = [...departmentSource.querySelectorAll(':scope > .bar-row')];
    departmentTarget.replaceChildren();
    rows.sort((a,b) => parseFloat(b.querySelector('.bar-fill')?.style.width || '0') - parseFloat(a.querySelector('.bar-fill')?.style.width || '0'));
    if (rows.length) rows.slice(0, 5).forEach(row => departmentTarget.append(row.cloneNode(true)));
    else departmentTarget.textContent = departmentSource.textContent || 'Esperando la consulta.';
    $('territorialDeptNote').textContent = 'Hasta cinco departamentos · misma unidad y selección del resumen.';
  }
  new MutationObserver(mirrorDepartments).observe(departmentSource, {childList:true,subtree:true,characterData:true});
  mirrorDepartments();

  // Indicador de casillas seleccionadas; describe la edición, no filtros ya aplicados.
  function filterCounts() {
    $('filters').querySelectorAll('.filter-group').forEach(group => {
      const summary = group.querySelector('summary');
      if (!summary) return;
      const boxes = [...group.querySelectorAll('[data-option]')];
      const count = boxes.filter(box => box.checked).length;
      let badge = summary.querySelector('.filter-selection-count');
      if (!badge) { badge=document.createElement('span');badge.className='filter-selection-count';summary.append(badge); }
      const value = count === boxes.length && boxes.length ? 'Todos' : count + ' / ' + boxes.length;
      // El contador no contamina la etiqueta que se exporta a Excel.
      badge.dataset.label = value;
      badge.setAttribute('aria-label', value);
      badge.title = 'Opciones marcadas. Usa Aplicar filtros para consultar.';
    });
  }
  let queued=false;
  const queueCounts = () => { if(queued)return;queued=true;queueMicrotask(()=>{queued=false;filterCounts();}); };
  new MutationObserver(queueCounts).observe($('filters'), {childList:true});
  $('filters').addEventListener('change',queueCounts);
  filterCounts();

  const toggle=document.createElement('button');
  toggle.type='button';toggle.className='btn territorial-mobile-toggle';toggle.id='territorialToggleFilters';
  toggle.setAttribute('aria-controls',side.id);
  const mobile=window.matchMedia('(max-width: 800px)');
  let mobileOpen=false;
  function showFilters(){
    document.body.classList.toggle('filters-collapsed',mobile.matches&&!mobileOpen);
    toggle.setAttribute('aria-expanded',String(!mobile.matches||mobileOpen));
    toggle.innerHTML=icon('filter')+(mobileOpen?'Ocultar filtros':'Mostrar filtros');
  }
  toggle.onclick=()=>{mobileOpen=!mobileOpen;showFilters();};
  side.before(toggle);
  mobile.addEventListener('change',showFilters);showFilters();
  $('applyFilters').addEventListener('click',()=>{if(mobile.matches){mobileOpen=false;showFilters();}});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&mobile.matches&&mobileOpen&&!$('loginDialog').open&&!$('recordDialog').open){mobileOpen=false;showFilters();toggle.focus();}});

  const legendButton=document.createElement('button');
  legendButton.type='button';legendButton.className='link';legendButton.id='territorialLegend';
  legendButton.innerHTML=icon('layers')+' Leyenda';
  legendButton.setAttribute('aria-controls','mapLegend');legendButton.setAttribute('aria-expanded','true');
  legendButton.onclick=()=>{const legend=$('mapLegend');legend.hidden=!legend.hidden;legendButton.setAttribute('aria-expanded',String(!legend.hidden));};
  $('mapCard').querySelector('.map-actions').prepend(legendButton);
  const mapLink=document.createElement('button');mapLink.type='button';mapLink.className='btn';mapLink.id='territorialViewMap';
  mapLink.innerHTML=icon('map')+' Vista mapa';
  mapLink.onclick=()=>{const card=$('mapCard');card.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});$('fitMap').focus({preventScroll:true});};
  document.querySelector('.exports').append(mapLink);

  // Leaflet debe recalcular su contenedor, sin alterar las coordenadas ni el zoom elegido.
  let frame=0,lastWidth=0,lastHeight=0;
  if ('ResizeObserver' in window) new ResizeObserver(entries=>{
    const rect=entries[0].contentRect;
    if(rect.width===lastWidth&&rect.height===lastHeight)return;
    lastWidth=rect.width;lastHeight=rect.height;
    cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>window.DGIC_MAP?.resize());
  }).observe($('map'));
  document.querySelector('.version').textContent='Interfaz 4.0.1 · Diseño territorial · Supabase';
})();
