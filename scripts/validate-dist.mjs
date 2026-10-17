import fs from 'node:fs/promises';import path from 'node:path';import {parse} from 'parse5';import vm from 'node:vm';
const root=path.resolve('dist');const pages=[];const issues=[];let links=0,assets=0,schemas=0;
async function walk(dir){for(const entry of await fs.readdir(dir,{withFileTypes:true})){const p=path.join(dir,entry.name);if(entry.isDirectory())await walk(p);else if(p.endsWith('.html'))pages.push(p);}}
function all(node,tag){return [...(node.tagName===tag?[node]:[]),...(node.childNodes||[]).flatMap(n=>all(n,tag))];}function attr(n,key){return n.attrs?.find(x=>x.name===key)?.value;}function text(n){return n.value||n.childNodes?.map(text).join('')||'';}
async function exists(file){try{return (await fs.stat(file)).isFile()}catch{return false}}
await walk(root);
for(const file of pages){const html=await fs.readFile(file,'utf8');const tree=parse(html);const relative=path.relative(root,file);const fail=message=>issues.push(relative+': '+message);
if(all(tree,'h1').length!==1)fail('Debe existir exactamente un H1');
const title=text(all(tree,'title')[0]);if(title.length>60)fail('Título supera 60 caracteres');
const meta=all(tree,'meta');const description=meta.find(m=>attr(m,'name')==='description');if(!description||attr(description,'content').length>155)fail('Descripción ausente o demasiado larga');
if(!all(tree,'link').some(n=>attr(n,'rel')==='canonical'))fail('Canonical ausente');
for(const input of all(tree,'input')){const id=attr(input,'id');if(!all(tree,'label').some(l=>attr(l,'for')===id))fail('Campo sin etiqueta: '+id);}
for(const script of all(tree,'script')){if(attr(script,'type')==='application/ld+json'){try{JSON.parse(text(script));schemas++;}catch{fail('JSON-LD inválido');}}else if(!attr(script,'src')&&attr(script,'type')!=='module'){try{new vm.Script(text(script));}catch(e){fail('Script inválido: '+e.message)}}}
for(const node of [...all(tree,'a'),...all(tree,'link'),...all(tree,'script'),...all(tree,'img')]){
  const target=attr(node,'href')||attr(node,'src');if(!target||target.startsWith('#')||target.startsWith('data:')||target.startsWith('mailto:'))continue;
  if(/^https?:/.test(target)){if(node.tagName==='script'||node.tagName==='img'||node.tagName==='link'&&attr(node,'rel')==='stylesheet')fail('Recurso externo antes del consentimiento: '+target);continue;}
  let decoded=decodeURIComponent(target.split(/[?#]/)[0]);let local=decoded.startsWith('/')?path.join(root,decoded):path.resolve(path.dirname(file),decoded);if(local.endsWith(path.sep))local=path.join(local,'index.html');
  if(!await exists(local)&&await exists(path.join(local,'index.html')))local=path.join(local,'index.html');
  if(!await exists(local))fail('Referencia rota: '+target);if(node.tagName==='a')links++;else assets++;
}
}
if(issues.length){console.error(issues.join('\n'));process.exitCode=1;}else console.log(`OK: ${pages.length} páginas, ${links} enlaces, ${assets} recursos y ${schemas} bloques JSON-LD; sin referencias rotas ni recursos externos.`);
