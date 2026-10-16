import http from 'node:http';
import {mkdir,readFile,writeFile,rename} from 'node:fs/promises';
import {createHash,randomUUID} from 'node:crypto';
import worker from './worker/index.js';
await mkdir('.local-games',{recursive:true});
const locks=new Map();
const file=k=>'.local-games/'+k.replaceAll('/','_')+'.json';
const env={BUCKET:{async get(k){try{const text=await readFile(file(k),'utf8');return {etag:createHash('sha256').update(text).digest('hex'),text:async()=>text}}catch(e){if(e.code==='ENOENT')return null;throw e}},async put(k,text,opt={}){const previous=locks.get(k)||Promise.resolve();let release;const current=new Promise(r=>release=r);locks.set(k,current);await previous;try{const old=await this.get(k);if(opt.onlyIf instanceof Headers&&opt.onlyIf.get('If-None-Match')==='*'&&old)return null;if(opt.onlyIf?.etagMatches&&old?.etag!==opt.onlyIf.etagMatches)return null;const tmp=file(k)+'.'+randomUUID();await writeFile(tmp,text,{mode:0o600});await rename(tmp,file(k));return {etag:createHash('sha256').update(text).digest('hex')}}finally{release();if(locks.get(k)===current)locks.delete(k)}}}};
http.createServer(async(req,res)=>{try{let chunks=[],size=0;for await(const chunk of req){size+=chunk.length;if(size>4096){res.writeHead(413);res.end('Request too large');return}chunks.push(chunk)}const request=new Request('http://localhost:8787'+req.url,{method:req.method,headers:req.headers,...(!['GET','HEAD'].includes(req.method)?{body:Buffer.concat(chunks)}:{})});const response=await worker.fetch(request,env);res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()))}catch{res.writeHead(500);res.end('Local server error')}}).listen(8787,'127.0.0.1',()=>console.log('Tidebound at http://localhost:8787'));
