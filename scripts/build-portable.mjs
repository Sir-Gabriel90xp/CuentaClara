// Static export using Astro's own compiler and renderer, without Vite/esbuild child processes.
// Intended for environments that prohibit starting the native esbuild service.
import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {stripTypeScriptTypes} from 'node:module';
import {transform} from '@astrojs/compiler';
import {experimental_AstroContainer} from 'astro/container';
import {unified} from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';

const root=process.cwd(), source=path.join(root,'src'), cache=path.join(root,'.portable-build'), dist=path.join(root,'dist');
const site='https://cuenta-clara-gabriel.dafanymejia.chatgpt.site';
await fs.mkdir(cache,{recursive:true});await fs.mkdir(dist,{recursive:true});
const guides=[];
for(const name of await fs.readdir(path.join(source,'content/guias'))){
  if(!name.endsWith('.mdx'))continue;
  const text=await fs.readFile(path.join(source,'content/guias',name),'utf8');
  const match=text.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n([\s\S]*)$/);
  if(!match)throw new Error('Frontmatter inválido: '+name);
  const data=Object.fromEntries(match[1].split(/\r?\n/).filter(Boolean).map(line=>{const i=line.indexOf(':');return [line.slice(0,i),JSON.parse(line.slice(i+1))]}));
  if(!data.draft&&(!data.dateReviewed||!data.sources?.length))throw new Error('Guía publicada sin fuentes o revisión: '+name);
  const html=String(await unified().use(remarkParse).use(remarkRehype).use(rehypeStringify).process(match[2]));
  guides.push({id:name.replace(/\.mdx$/,''),data,html});
}
await fs.writeFile(path.join(cache,'content.mjs'),`import {createComponent,render as template,unescapeHTML} from 'astro/runtime/server/index.js';\nconst guides=${JSON.stringify(guides)};\nexport async function getCollection(name){if(name!=='guias')throw new Error('Colección desconocida');return guides;}\nexport async function render(guide){return {Content:createComponent(()=>template\`\${unescapeHTML(guide.html)}\`)};}\n`);

const processed=new Map(),scripts=new Map();let assetCount=0;
function modulePath(file){return path.join(cache,path.relative(source,file).replace(/\.(astro|ts)$/,'.mjs'));}
async function resolveModule(from,specifier){
  if(specifier==='astro:content')return pathToFileURL(path.join(cache,'content.mjs')).href;
  if(!specifier.startsWith('.'))return specifier;
  let full=path.resolve(path.dirname(from),specifier);
  for(const candidate of [full,full+'.ts',full+'.astro']){try{if((await fs.stat(candidate)).isFile()){full=candidate;break;}}catch{}}
  if(full.endsWith('.css'))return null;
  if(full.endsWith('.astro')||full.endsWith('.ts')){await compileFile(full);return pathToFileURL(modulePath(full)).href;}
  return pathToFileURL(full).href;
}
async function rewriteImports(code,from){
  const matches=[...code.matchAll(/(?:\bfrom\s*|\bimport\s*)(['"])([^'"\n]+)\1/g)];
  for(const m of matches.reverse()){
    const resolved=await resolveModule(from,m[2]);
    if(resolved===null){const start=code.lastIndexOf('import',m.index);const end=code.indexOf(';',m.index);code=code.slice(0,start)+code.slice(end+1);}
    else{const start=m.index+m[0].lastIndexOf(m[2]);code=code.slice(0,start)+resolved+code.slice(start+m[2].length);}
  }
  return code;
}
async function compileFile(file){
  if(processed.has(file))return;processed.set(file,true);
  let code=await fs.readFile(file,'utf8');
  if(file.endsWith('.astro')){
    const compiled=await transform(code,{filename:file.replaceAll('\\','/'),normalizedFilename:path.relative(root,file).replaceAll('\\','/'),internalURL:'astro/compiler-runtime',astroGlobalArgs:JSON.stringify(site),resultScopedSlot:true,renderScript:true});
    const errors=compiled.diagnostics.filter(d=>d.severity===1);if(errors.length)throw new Error(JSON.stringify(errors));
    // Metadata is a compiler intermediate removed by Astro's Vite plugin as well.
    code=compiled.code.replace(/,?\s*createMetadata as \$\$createMetadata\s*/,'\n').replace(/export const \$\$metadata = [\s\S]*?\n\n/,'').replace(/\bAstro\.site\b/g,'$$$Astro.site');
    for(const [i,s] of compiled.scripts.entries()){
      if(s.type!=='inline')throw new Error('Unsupported external processed script');
      let js=stripTypeScriptTypes(s.code,{mode:'strip'});
      js=js.replace(/from\s*(['"])\.\.\/\.\.\/tools\/calculations\1/g,`from '/assets/calculations.js'`);
      const asset=`/assets/script-${assetCount++}.js`;
      await fs.mkdir(path.join(dist,'assets'),{recursive:true});await fs.writeFile(path.join(dist,asset),js);
      scripts.set(`${file.replaceAll('\\','/')}?astro&type=script&index=${i}&lang.ts`,asset);
      // Compiler without Vite may retain the literal script URL.
      scripts.set(`${path.relative(root,file).replaceAll('\\','/')}?astro&type=script&index=${i}&lang.ts`,asset);
    }
  }
  code=await rewriteImports(code,file);
  code=stripTypeScriptTypes(code,{mode:'strip'});
  const dest=modulePath(file);await fs.mkdir(path.dirname(dest),{recursive:true});await fs.writeFile(dest,code);
}
for(const dir of ['layouts','components','pages'])await walk(path.join(source,dir));
async function walk(dir){for(const entry of await fs.readdir(dir,{withFileTypes:true})){const f=path.join(dir,entry.name);if(entry.isDirectory())await walk(f);else if(f.endsWith('.astro'))await compileFile(f);}}
await fs.cp(path.join(root,'public'),dist,{recursive:true});
let css=await fs.readFile(path.join(source,'styles/base.css'),'utf8');
const imports=[...css.matchAll(/@import\s*['"]([^'"]+)['"];?/g)];let fontCss='';
for(const match of imports){
  const packagePath=path.join(root,'node_modules',match[1]);let font=await fs.readFile(packagePath,'utf8');
  for(const u of [...font.matchAll(/url\(([^)]+)\)/g)].reverse()){
    const rel=u[1].replace(/['"]/g,'');const full=path.resolve(path.dirname(packagePath),rel);const filename=path.basename(full);
    await fs.mkdir(path.join(dist,'fonts'),{recursive:true});await fs.copyFile(full,path.join(dist,'fonts',filename));font=font.slice(0,u.index)+`url('/fonts/${filename}')`+font.slice(u.index+u[0].length);
  }fontCss+=font+'\n';css=css.replace(match[0],'');
}
await fs.mkdir(path.join(dist,'assets'),{recursive:true});await fs.writeFile(path.join(dist,'assets/site.css'),fontCss+css);
await fs.writeFile(path.join(dist,'assets/calculations.js'),stripTypeScriptTypes(await fs.readFile(path.join(source,'tools/calculations.ts'),'utf8'),{mode:'strip'}));
const container=await experimental_AstroContainer.create({resolve:async id=>{const asset=scripts.get(id);if(asset)return asset;throw new Error('Script sin resolver: '+id);}});
const routes=[];
async function output(file,url,props={},params={}){
  const component=await import(pathToFileURL(modulePath(path.join(source,file))).href);
  let html=await container.renderToString(component.default,{request:new Request(site+url),props,params,partial:false});
  html=html.replace('</head>',`<link rel="stylesheet" href="/assets/site.css"></head>`);
  const destination=url==='/404/'?path.join(dist,'404.html'):path.join(dist,url,'index.html');await fs.mkdir(path.dirname(destination),{recursive:true});await fs.writeFile(destination,html);routes.push(url);
}
await output('pages/index.astro','/');
await output('pages/herramientas/index.astro','/herramientas/');
await output('pages/buscar.astro','/buscar/');await output('pages/404.astro','/404/');
for(const [file,prefix] of [['pages/herramientas/[slug].astro','/herramientas/'],['pages/guias/[slug].astro','/guias/'],['pages/[slug].astro','/']]){
  const module=await import(pathToFileURL(modulePath(path.join(source,file))).href);
  for(const route of await module.getStaticPaths())await output(file,prefix+route.params.slug+'/',route.props||{},route.params);
}
const publicRoutes=routes.filter(r=>r!=='/404/'&&r!=='/buscar/'&&!r.startsWith('/guias/'));
await fs.writeFile(path.join(dist,'sitemap-0.xml'),'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+publicRoutes.map(r=>`<url><loc>${site}${r}</loc></url>`).join('')+'</urlset>');
await fs.writeFile(path.join(dist,'sitemap-index.xml'),`<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><sitemap><loc>${site}/sitemap-0.xml</loc></sitemap></sitemapindex>`);
console.log(`Exportación Astro portátil: ${routes.length} rutas, ${scripts.size/2} scripts, fuentes locales.`);
