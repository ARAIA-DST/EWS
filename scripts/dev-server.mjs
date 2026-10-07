import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,extname,dirname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
const args=process.argv.slice(2),portIndex=args.indexOf('--port'),port=Number(portIndex>=0?args[portIndex+1]:process.env.PORT||4173),root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const mime={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.png':'image/png','.json':'application/json','.md':'text/plain','.gs':'text/plain'};
createServer(async(req,res)=>{try{let path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);let file=resolve(root,'.'+path);if(file!==root&&!file.startsWith(root+sep))throw new Error('Invalid path');if((await stat(file)).isDirectory())file=resolve(file,'index.html');const bytes=await readFile(file);res.writeHead(200,{'Content-Type':(mime[extname(file)]||'application/octet-stream')+';charset=utf-8','Cache-Control':'no-store'});res.end(bytes);}catch{res.writeHead(404);res.end('Not found');}}).listen(port,'0.0.0.0',()=>console.log('NC Retention preview: http://localhost:'+port));
