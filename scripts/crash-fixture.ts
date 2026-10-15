// Acceptance helper: deliberately exits without closing SQLite after a committed acknowledgement.
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { Store } from '../server/database.ts';
import { newState, stageKey } from '../server/engine.ts';
import { RoomService } from '../server/service.ts';
const store=new Store(process.argv[2]);
const p=store.install(JSON.parse(readFileSync('server/content/last_lantern_delivery.json','utf8')));
const service=new RoomService(store,'crash_host',p);const s=newState(p);const scenario=process.argv[3];
s.players.forEach((x,i)=>{x.token=`crash_phone_${i}`;x.role='Scout';});
s.mode='intrigue';s.players[0].agenda='Saboteur';s.players[0].intrigue=2;s.players[1].agenda='Independent Broker';
s.phase='selection';s.deadline=Date.now()+90000;
if(scenario==='ack'){s.scene='lantern_rest';s.stage='W1';s.resumeScene='lantern_storm';}
if(scenario==='storm'){s.scene='lantern_storm';s.stage='actions';s.round=2;s.players.forEach(x=>s.inputs[x.id]={choice:'Supply',ready:true});}
if(scenario==='finale'){s.scene='lantern_storm';s.stage='finale';s.players[0].plots=1;s.players.forEach(x=>s.inputs[x.id]={choice:'finish',ready:true});}
store.commit(s);service.state=s;
const type=scenario==='storm'?'resolve':'input';const payload=scenario==='ack'?{choice:'deal_effort',ready:true}:scenario==='finale'?{choice:'finish',theft:true,ready:true}:{};
service.execute(scenario==='storm'?'crash_host':scenario==='ack'?'crash_phone_1':'crash_phone_0',{id:'crash_fixture_command',instance:s.instance,stageKey:stageKey(s),type,payload});
process.exit(23);
