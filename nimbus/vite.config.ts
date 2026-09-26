import {defineConfig} from 'vite';
export default defineConfig({
 base:'./',
 server:{proxy:{
  '/api/live-aws':{target:'http://127.0.0.1:8792',changeOrigin:false,rewrite:path=>path.replace(/^\/api\/live-aws/,'/mcp')},
  '/api/trueforge':{target:'http://127.0.0.1:8790',changeOrigin:false,rewrite:path=>path.replace(/^\/api\/trueforge/,'')}
 }}
});
