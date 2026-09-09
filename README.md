# Dashboard DGIC

Frontend estático conectado a Supabase para visualizar la base `BD_DGIC_COMPROMISOS`.

## Incluye
- filtros múltiples y dependientes;
- KPI dinámicos;
- gráficos con Chart.js;
- login Supabase Auth;
- detalle paginado de compromisos;
- tramos viales;
- Planta C4;
- exportación CSV de la página visible.

## Seguridad
`config.js` usa una **publishable key**, apta para frontend. No contiene `service_role`, contraseñas ni connection strings.

El detalle se protege mediante RLS/RPC y requiere un usuario de Supabase Auth.

## Publicación
Es un sitio estático. Se puede publicar directamente en Render Static Site, GitHub Pages, Cloudflare Pages, Netlify o similar.
