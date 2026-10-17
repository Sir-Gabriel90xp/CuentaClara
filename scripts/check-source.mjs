import {readdir,readFile} from 'node:fs/promises';
import {transform} from '@astrojs/compiler';
import {compile} from '@mdx-js/mdx';
async function files(dir){let result=[];for(const item of await readdir(dir,{withFileTypes:true})){const path=dir+'/'+item.name;if(item.isDirectory())result.push(...await files(path));else result.push(path);}return result;}
let count=0;for(const file of await files('src')){const source=await readFile(file,'utf8');if(file.endsWith('.astro')){const result=await transform(source,{filename:file});const errors=result.diagnostics.filter(d=>d.severity===1);if(errors.length)throw new Error(file+': '+JSON.stringify(errors));count++;}if(file.endsWith('.mdx')){await compile(source.replace(/^---[\s\S]*?---\s*/,''));if(!source.includes('dateReviewed:')||!source.includes('sources:'))throw new Error('Metadatos incompletos: '+file);count++;}}console.log(`${count} plantillas Astro y guías MDX validadas.`);
