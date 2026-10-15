import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { networkInterfaces } from 'node:os';
import express from 'express';
import { createServer as createHttpServer } from 'node:http';
import { Store } from './database.ts';
import { RoomService } from './service.ts';
import { secret } from './engine.ts';
import { createApp, errorHandler } from './app.ts';

const data=resolve(process.env.MISTBOUND_DATA || '.cache/mistbound-v3');mkdirSync(data,{recursive:true});
const keyPath=resolve(data,'gm-key');if(!existsSync(keyPath))writeFileSync(keyPath,secret(),{mode:0o600});
const hostKey=readFileSync(keyPath,'utf8').trim();
const store=new Store(resolve(data,'room.sqlite'));
const first=store.install(JSON.parse(readFileSync('server/content/last_lantern_delivery.json','utf8')));
store.install(JSON.parse(readFileSync('server/content/ferry_medicine_exchange.json','utf8')));
const service=new RoomService(store,hostKey,first);
const app=createApp(service);const production=process.argv.includes('--production');
const server=createHttpServer(app);
if(production){
  app.use(express.static(resolve('dist'),{index:false,dotfiles:'deny'}));
  app.get(['/','/gm','/tv','/play'],(_req,res)=>res.sendFile(resolve('dist/index.html')));
} else {
  // Vite is deliberately restricted: its usual source-file serving would expose server packs/secrets.
  const {createServer}=await import('vite');
  const vite=await createServer({server:{middlewareMode:true,hmr:false,ws:{server}},appType:'spa'});
  app.use((req,res,next)=>{
    let path: string;try{path=decodeURIComponent(req.path);}catch{res.sendStatus(400);return;}
    const entry=['/','/gm','/tv','/play','/index.html'].includes(path);
    const allowed=entry||path==='/src/main.tsx'||path==='/src/index.css'||path.startsWith('/src/lan/')||path.startsWith('/node_modules/')||path.startsWith('/@vite/')||path.startsWith('/@id/')||path==='/@react-refresh'||path.startsWith('/art/')||path.startsWith('/licenses/');
    if(!allowed||path.includes('..')||/[\\%\0]/.test(path)||path.includes('/node_modules/.cache/')){res.sendStatus(404);return;}next();
  });
  app.use(vite.middlewares);
}
app.use(errorHandler);
const port=Number(process.env.PORT||3000);
server.listen(port,'0.0.0.0',()=>{
  console.log(`\nThe Mistbound Caravan • one GM + eight players\nGM (private): http://localhost:${port}/gm#key=${hostKey}\nTV (public): http://localhost:${port}/tv`);
  for(const entries of Object.values(networkInterfaces()))for(const entry of entries||[])if(entry.family==='IPv4'&&!entry.internal)console.log(`LAN: http://${entry.address}:${port}/play`);
  console.log(`Database: ${resolve(data,'room.sqlite')}\nKeep the GM link and backup private.\n`);
});
const timer=setInterval(()=>{service.ordered(()=>service.tick()).catch(e=>console.error('Room tick failed; state was not committed:',e.message));},500);
const shutdown=()=>{clearInterval(timer);server.close(()=>{store.close();process.exit(0);});};process.on('SIGINT',shutdown);process.on('SIGTERM',shutdown);
