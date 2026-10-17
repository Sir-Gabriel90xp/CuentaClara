# Cuenta Clara

Web estática en español con 26 páginas, cuatro calculadoras, búsqueda Pagefind, fuentes autoalojadas y cinco guías del Plan Maestro conservadas como borradores. Contacto público: Gabriel10xp@gmail.com.

## Abrir la web terminada en tu equipo

1. Extrae el ZIP completo.
2. Abre `ABRIR_WEB.cmd` en Windows.
3. Se abrirá `http://127.0.0.1:4321/` en tu navegador.

El lanzador necesita Python 3, instalado en el equipo en el que se preparó el proyecto. Mantén abierta la ventana del servidor mientras visitas la web; ciérrala para detenerlo. Si el puerto está ocupado, cierra la otra vista previa.

La carpeta `dist/` contiene la web generada. No hace falta instalar Node ni dependencias para abrir esta versión con el lanzador. Los enlaces, calculadoras y búsqueda requieren servirla por HTTP; no abras directamente el HTML con doble clic.

## Resultado verificado

- Exportación estática de 26 rutas con el compilador y el renderizador de Astro.
- Índice Pagefind en español: 24 páginas; búsqueda y 404 excluidas del índice.
- Comprobación de 535 enlaces internos, 84 referencias a recursos y 26 bloques JSON-LD sin errores.
- Cuatro pruebas de calculadoras aprobadas, con ejemplos del documento y casos límite.
- Imagen social PNG 1200 × 630, canonical, descripciones, sitemap y favicon.
- Fuentes e interactividad servidas desde el propio sitio; sin anuncios ni analítica.

La conexión al navegador de Codex no estuvo disponible. No se ha verificado visualmente la web en navegador ni medido Lighthouse o Core Web Vitals. Sí se han generado y comprobado los archivos estáticos.

## Publicación

Para publicar en Netlify o Cloudflare Pages, usa el contenido de `dist/` como salida estática. Para cambiar de dominio, actualiza `site` en `astro.config.mjs`, en `scripts/build-portable.mjs` y en `public/robots.txt`; vuelve a construir.

No se incluyen credenciales ni identificadores de proyectos privados. La publicación en GitHub Pages requiere configurar Pages o un workflow de despliegue por separado.

## Modificar el proyecto

Requiere Node 22.14 o superior y npm.

```sh
npm ci
npm run dev
```

La construcción habitual conserva Astro, MDX y Pagefind:

```sh
npm test
npm run check:source
npm run build
npm run check:dist
```

La búsqueda funciona después de generar su índice.

## Exportación cuando el entorno bloquea esbuild

La exportación portátil utiliza el compilador de Astro y Astro Container. Los cinco MDX actuales contienen únicamente Markdown y se exportan con el procesador de Markdown. Si añades componentes JSX a los MDX, usa el build habitual.

```sh
node scripts/build-portable.mjs
```

Después ejecuta Pagefind. En Windows, incluso cuando Node no puede iniciar procesos hijos:

```powershell
& './node_modules/@pagefind/windows-x64/bin/pagefind_extended.exe' --site dist
node scripts/validate-dist.mjs
```

Pruebas sin aislamiento mediante procesos:

```sh
node --experimental-strip-types --test --test-isolation=none tests/calculations.test.ts
```

## Contenido y lanzamiento público

Las guías están en `src/content/guias/`. El esquema de `src/content.config.ts` exige revisión y fuentes para las guías publicadas. Antes de cambiar `draft` a falso, verifica el contenido, identifica autor y revisor y registra la fecha. Esta versión permite leer borradores para revisión privada; no acredita revisión profesional humana.

El correo de contacto ya está incorporado. La identidad legal del titular y las páginas legales necesitan completarse y revisarse antes del lanzamiento público. No se han inventado datos del responsable.

AdSense y analítica permanecen desactivados. El panel de preferencias solo guarda una elección local y no es un CMP certificado. Configura CMP, identificador de editor y ads.txt antes de activar publicidad. No se han configurado campañas, pagos ni suscripciones.
