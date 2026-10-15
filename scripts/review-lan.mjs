import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { mkdir,readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const port=3103;
const base=`http://localhost:${port}`;
const data=resolve(`.cache/lan-review-${Date.now()}`);
await mkdir('output/lan-review',{recursive:true});
const production=process.argv.includes('--production');
const server=spawn(process.execPath,['--import','tsx','server/index.ts',...(production?['--production']:[])],{cwd:process.cwd(),env:{...process.env,PORT:String(port),MISTBOUND_DATA:data},windowsHide:true,stdio:['ignore','pipe','pipe']});
let serverOutput='';server.stdout.on('data',x=>serverOutput+=x);server.stderr.on('data',x=>serverOutput+=x);
const errors=[],external=[];let browser;
const delay=ms=>new Promise(done=>setTimeout(done,ms));
async function api(path,token='',body){const response=await fetch(base+path,{method:body===undefined?'GET':'POST',headers:{...(token?{Authorization:`Bearer ${token}`} :{}),...(body===undefined?{}:{'Content-Type':'application/json'})},body:body===undefined?undefined:JSON.stringify(body)});const json=await response.json();assert(response.ok,`${path}: ${JSON.stringify(json)}`);return json;}
async function ready(){for(let i=0;i<100;i++){if(server.exitCode!==null)throw new Error(`Test server exited: ${serverOutput.replace(/#key=[^\s]+/g,'#key=[redacted]')}`);try{if((await fetch(base+'/api/health')).ok)return;}catch{}await delay(200);}throw new Error('Test server did not start');}
const screenshot=async(page,name)=>{await page.evaluate(()=>document.fonts.ready);await page.screenshot({path:`output/lan-review/${name}.png`,fullPage:true});};
try{
  await ready();const key=(await readFile(resolve(data,'gm-key'),'utf8')).trim();
  browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
  const context=async(viewport={width:1440,height:1000})=>{const c=await browser.newContext({viewport,reducedMotion:'reduce'});c.on('request',req=>{if(/^https?:/.test(req.url())&&new URL(req.url()).hostname!=='localhost')external.push(req.url());});c.on('page',p=>p.on('pageerror',e=>errors.push(e.message)));return c;};
  const gmContext=await context(),tvContext=await context();const gm=await gmContext.newPage(),tv=await tvContext.newPage();
  await tv.goto(base);await tv.getByRole('heading',{name:/Keep the light|Giữ ngọn hoa đăng/i}).waitFor();await screenshot(tv,'welcome-desktop');
  await tv.getByRole('button',{name:/Open game rules|Mở luật chơi/i}).click();await tv.getByRole('dialog').waitFor();await tv.getByRole('button',{name:/Back to the journey|Trở lại hành trình/i}).click();
  await tv.goto(base+'/tv');await gm.goto(base+`/gm#key=${key}`);await gm.getByRole('heading',{name:/Set the table|Sắp đặt bàn chơi/i}).waitFor();await screenshot(gm,'gm-lobby');
  let state=await api('/api/state?view=gm',key);const clients=[];
  for(const seat of state.private.players){const c=await context({width:390,height:844});const page=await c.newPage();await page.goto(base+`/play#seat=${seat.id}&invite=${seat.invite}`);await page.getByRole('heading',{name:new RegExp(`${seat.name}’s choices|Lựa chọn của ${seat.name}`,'i')}).waitFor();const token=await page.evaluate(()=>localStorage.getItem('mistbound-player'));assert(token);clients.push({context:c,page,token,id:seat.id});}
  const cmd=async(token,type,payload={})=>{const state=await api('/api/state?view=tv');return api('/api/command',token,{id:crypto.randomUUID(),instance:state.instance,stageKey:state.stageKey,type,payload});};
  const gmCmd=(type,payload={})=>cmd(key,type,payload);
  await gm.getByRole('button',{name:/Depart Lantern Depot|Khởi hành từ Trạm Hoa Đăng/i}).click();await gm.getByRole('button',{name:/Start choices after practice|Bắt đầu lựa chọn sau tập huấn/i}).waitFor();await gm.getByRole('button',{name:/Start choices after practice|Bắt đầu lựa chọn sau tập huấn/i}).click();
  await clients[0].page.getByRole('button',{name:/Take the family aboard/i}).click();await clients[0].page.getByRole('button',{name:/I’m ready|Tôi đã sẵn sàng/i}).click();
  for(const c of clients.slice(1))await cmd(c.token,'input',{choice:'aboard',ready:true});
  await screenshot(tv,'tv-ferry');await gm.getByRole('button',{name:/Resolve 8\/8 Ready|Giải quyết.*8\/8/i}).waitFor();await gm.getByRole('button',{name:/Resolve 8\/8 Ready|Giải quyết.*8\/8/i}).click();
  await gm.getByRole('button',{name:/Continue the journey|Tiếp tục hành trình/i}).click();await gm.getByRole('button',{name:/Start choices after practice|Bắt đầu lựa chọn sau tập huấn/i}).click();
  await clients[0].page.getByText('The vehicle weighs six.',{exact:false}).waitFor();await screenshot(clients[0].page,'phone-bridge');
  await clients[0].page.getByRole('button',{name:/Share this exact evidence|Chia sẻ đúng chứng cứ này/i}).click();await tv.getByText('The vehicle weighs six.',{exact:false}).waitFor();
  for(const width of [390,768,1024]){await clients[0].page.setViewportSize({width,height:844});assert.equal(await clients[0].page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`Phone overflow at ${width}`);await screenshot(clients[0].page,`phone-${width}`);}
  await clients[0].page.setViewportSize({width:390,height:844});
  // Continue the actual HTTP room through both modes and a second installed pack.
  async function playToEnd(players,tag){let steps=0;while(steps++<180){const r=await api('/api/state?view=gm',key);if(r.phase==='ended')return r;
      if(r.paused){await gmCmd('pause');continue;}if(r.phase==='reading'){await gmCmd('begin');continue;}if(r.phase==='consequences'){await gmCmd('continue');continue;}if(r.phase==='discussion'){await gmCmd('resolve');continue;}
      if(r.phase==='guardian'){await delay(1000);continue;}if(r.phase==='tie'){await cmd(players.find(c=>c.id===r.tie.seat).token,'tie',{choice:r.tie.options[0]});continue;}
      assert.equal(r.phase,'selection');let choice;
      if(r.stage==='scene')choice=r.scene.family==='deduction'?'north':r.scene.family==='rest'?r.choices.find(c=>c.available&&/rest|keep your resources/i.test(c.title))?.id:r.choices.find(c=>c.available)?.id;
      if(r.stage==='purchase')choice='none';if(r.stage==='watch')choice='abstain';if(r.stage==='watch_confirm'||r.stage==='chest')choice='no';if(r.stage==='finale')choice='finish';
      for(const [i,c] of players.entries()){let ownChoice=choice;
        if(r.stage==='actions')ownChoice=r.round===1?(i<2?'Shield':i<5?'Supply':'Repel'):r.round===2?(i>=4&&i<=6?'Shield':i<3?'Supply':'Repel'):(i===0||i===1||i===4||i===5?'Shield':'Supply');
        const agenda=r.private.players.find(x=>x.id===c.id).agenda;
        if(r.stage==='W1'||r.stage==='W2')ownChoice=agenda==='Saboteur'?'plot':agenda==='Independent Broker'?(r.stage==='W1'?'deal_effort':'deal_role'):'skip';
        await cmd(c.token,'input',{choice:ownChoice,ready:true,...(r.stage==='finale'&&agenda==='Saboteur'?{theft:true}:{})});
      }
      if(r.stage==='actions'&&r.round===2){await tv.reload();await tv.getByRole('heading',{name:/Commit storm actions|Cam kết hành động bão/i}).waitFor();await screenshot(tv,`${tag}-storm`);}
      if(r.stage==='W1'){await tv.reload();await tv.getByRole('heading',{name:/Private arrangements|Thỏa thuận bí mật/i}).waitFor();await screenshot(tv,'intrigue-public-window');const publicState=await api('/api/state?view=tv');assert.equal(publicState.readyCount,null);assert.deepEqual(publicState.choices,[]);assert(!publicState.private);}
      await gmCmd('resolve');
    }throw new Error('Mission did not end');}
  const coop=await playToEnd(clients,'cooperative');assert.equal(coop.outcome.mission,'Delivered');assert.equal(coop.outcome.security,'Secured');await tv.reload();await tv.getByRole('heading',{name:/The lantern remembers|Hoa đăng ghi nhớ/i}).waitFor();await screenshot(tv,'cooperative-ending');
  async function newClients(id){await api('/api/mission',key,{id,version:'3.0.0'});const r=await api('/api/state?view=gm',key);const out=[];for(const p of r.private.players){const joined=await api('/api/join','',{seat:p.id,invite:p.invite});out.push({id:p.id,token:joined.token});}return out;}
  const hiddenClients=await newClients('last_lantern_delivery');await gmCmd('configure',{mode:'intrigue'});await gmCmd('start');const hidden=await playToEnd(hiddenClients,'intrigue');assert.equal(hidden.outcome.security,'Stolen');assert.equal(hidden.traces.length,2);
  await tv.reload();await tv.getByRole('heading',{name:/The lantern remembers|Hoa đăng ghi nhớ/i}).waitFor();await screenshot(tv,'intrigue-ending');
  const medicineClients=await newClients('ferry_medicine_exchange');await gmCmd('start');const medicine=await playToEnd(medicineClients,'medicine');assert.equal(medicine.outcome.mission,'Delivered');assert(medicine.flags.medicine_obtained);
  for(const path of ['/server/content/last_lantern_delivery.json','/.cache/mistbound-v3/gm-key','/@fs/D:/Project%20CV/gud/server/content/last_lantern_delivery.json','/src/content/mission1.ts','/simulator.html'])assert.equal((await fetch(base+path)).status,404,`Source leaked: ${path}`);
  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
  console.log(`Passed (${production?'production':'development'}): isolated local server; GM + TV + eight independent browser contexts; phone UI input/Ready/share; responsive 390/768/1024; complete cooperative, intrigue and second-pack HTTP missions; private projections; source blocking; no browser errors or external runtime requests.`);
  console.log('Screenshots: output/lan-review/. These are simulated clients, not actual phone or group acceptance.');
} finally {await browser?.close();server.kill();}
