import express from 'express';
import { readFileSync } from 'node:fs';
import { networkInterfaces } from 'node:os';
import { requireRule, RuleError } from './engine.ts';
import { RoomService } from './service.ts';

export function createApp(service: RoomService) {
  const app=express(); app.disable('x-powered-by');
  app.use((req,res,next)=>{
    res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');
    if(req.path.startsWith('/api')&&req.method!=='GET'&&req.headers.origin&&req.headers.origin!==`${req.protocol}://${req.get('host')}`){res.status(403).json({error:'Cross-origin commands are not permitted'});return;}
    next();
  });
  app.use(express.json({limit:'1mb',strict:true}));
  const token=(req: express.Request)=>req.headers.authorization?.replace(/^Bearer /,'')||'';
  const route=(fn:(req:express.Request,res:express.Response)=>unknown)=> (req:express.Request,res:express.Response,next:express.NextFunction)=>{service.ordered(()=>fn(req,res)).catch(next);};
  app.get('/api/health',(_req,res)=>res.json({ok:true,rulesVersion:3}));
  app.get('/api/state',route((req,res)=>res.json(service.view(String(req.query.view||'tv'),token(req)))));
  app.post('/api/join',route((req,res)=>res.json(service.join(req.body.seat,req.body.invite))));
  app.post('/api/command',route((req,res)=>res.json(service.execute(token(req),req.body))));
  app.get('/api/packs',route((req,res)=>{requireRule(service.actor(token(req)).kind==='gm','GM required');res.json(service.store.packs());}));
  app.get('/api/network',route((req,res)=>{requireRule(service.actor(token(req)).kind==='gm','GM required');const port=req.get('host')?.split(':').at(-1);const addresses=Object.values(networkInterfaces()).flatMap(xs=>(xs||[]).filter(x=>x.family==='IPv4'&&!x.internal).map(x=>`http://${x.address}${port&&/^\d+$/.test(port)?`:${port}`:''}`));const score=(url:string)=>/^http:\/\/192\.168\./.test(url)?0:/^http:\/\/10\./.test(url)?1:/^http:\/\/172\.(1[6-9]|2\d|3[01])\./.test(url)?2:3;addresses.sort((a,b)=>score(a)-score(b));res.json(addresses);}));
  app.post('/api/packs',route((req,res)=>{requireRule(service.actor(token(req)).kind==='gm','GM required');const pack=service.store.install(req.body);res.json({installed:true,id:pack.id,version:pack.version});}));
  app.post('/api/mission',route((req,res)=>res.json(service.newMission(token(req),req.body.id,req.body.version))));
  app.get('/api/backup',route((req,res)=>{requireRule(service.actor(token(req)).kind==='gm','GM required');const file=service.store.backup();res.setHeader('Content-Disposition','attachment; filename="mistbound-backup.sqlite"');res.type('application/vnd.sqlite3').send(readFileSync(file));}));
  app.use('/api',(_req,res)=>res.status(404).json({error:'Unknown API route'}));
  return app;
}
export function errorHandler(error: any,_req:express.Request,res:express.Response,_next:express.NextFunction) {
  if(error instanceof RuleError || /^(Pack:|Command ID|Pack version)/.test(error.message))res.status(400).json({error:error.message});
  else if(error.type==='entity.too.large')res.status(413).json({error:'Pack or command exceeds 1 MB'});
  else if(error instanceof SyntaxError)res.status(400).json({error:'Invalid JSON'});
  else {console.error(error);res.status(500).json({error:'The operation could not be committed. Refresh and retry the same command.'});}
}
