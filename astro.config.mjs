import {defineConfig} from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
export default defineConfig({site:'https://cuenta-clara-gabriel.dafanymejia.chatgpt.site',integrations:[mdx(),sitemap({filter:page=>!page.includes('/guias/')&&!page.includes('/buscar/')&&!page.includes('/404')})],output:'static'});
