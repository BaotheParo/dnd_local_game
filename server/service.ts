import type { Actor, Command, Pack, Seat, State } from './model.ts';
import { Store } from './database.ts';
import { command, event, expire, newState, requireRule, restorePaused, secret, stageKey } from './engine.ts';
import { gmView, playerView, publicView } from './projection.ts';
import { timingSafeEqual } from 'node:crypto';

export class RoomService {
  state: State; lastSeen=new Map<string,number>(); private queue: Promise<unknown>=Promise.resolve();
  constructor(public store: Store,public hostKey: string,firstPack: Pack,public clock=()=>Date.now()) {
    this.state=store.active() || newState(firstPack);store.pack(this.state.pack.id,this.state.pack.version,this.state.pack.digest);
    restorePaused(this.state,Math.min(clock(),store.snapshotTime()??clock()));store.commit(this.state,undefined,clock());
    this.state.players.filter(x=>x.token).forEach(x=>this.lastSeen.set(x.id,clock()));
  }
  get pack() {const p=this.state.pack;return this.store.pack(p.id,p.version,p.digest);}
  ordered<T>(fn:()=>T|Promise<T>):Promise<T> {const result=this.queue.then(fn);this.queue=result.catch(()=>{});return result;}
  equal(a: string,b: string) {const aa=Buffer.from(a),bb=Buffer.from(b);return aa.length===bb.length&&timingSafeEqual(aa,bb);}
  actor(token: string):Actor {if(this.equal(token,this.hostKey))return {kind:'gm',id:'gm'};const player=this.state.players.find(x=>x.token&&this.equal(token,x.token));requireRule(player,'Invalid or replaced device credential');return {kind:'player',id:player.id};}
  connected=(seat: Seat)=>Boolean(seat.token&&this.clock()-(this.lastSeen.get(seat.id)||0)<10000);
  touch(actor: Actor) {if(actor.kind==='player')this.lastSeen.set(actor.id,this.clock());}
  view(view: string,token='') {
    if(view==='tv')return publicView(this.state,this.pack,this.connected);
    const actor=this.actor(token);this.touch(actor);
    if(view==='gm') {requireRule(actor.kind==='gm','GM credential required');return gmView(this.state,this.pack,this.connected);}
    requireRule(view==='player'&&actor.kind==='player','Player credential required');return playerView(this.state,this.pack,this.state.players.find(x=>x.id===actor.id)!,this.connected);
  }
  mutate(fn:(copy: State)=>void) {const copy=structuredClone(this.state);fn(copy);this.store.commit(copy,undefined,this.clock());this.state=copy;}
  tick() {
    const now=this.clock();const s=this.state;
    if(s.phase==='lobby'||s.phase==='ended'||s.paused)return;
    const missing=s.players.filter(x=>!this.connected(x));const key=`${stageKey(s)}:${s.phase}`;
    if(s.deadline!==null&&missing.length&&!s.disconnectPauseKeys.includes(key)) {
      // A reissued invitation also gets ten seconds before a timed phase pauses.
      const longMissing=missing.some(x=>now-(this.lastSeen.get(x.id)??now)>=10000);
      if(longMissing) {this.mutate(copy=>{copy.paused=true;copy.remaining=Math.max(0,copy.deadline!-now);copy.deadline=null;copy.disconnectPauseKeys.push(key);copy.revision++;event(copy,'disconnect_pause',{seats:missing.map(x=>x.id)});});return;}
    }
    const copy=structuredClone(s);if(expire(copy,this.pack,now)){this.store.commit(copy,undefined,now);this.state=copy;}
  }
  execute(token: string,cmd: Command) {
    const actor=this.actor(token);this.touch(actor);
    requireRule(typeof cmd.id==='string'&&/^[a-zA-Z0-9_-]{8,100}$/.test(cmd.id)&&typeof cmd.instance==='string'&&typeof cmd.stageKey==='string'&&typeof cmd.type==='string'&&cmd.payload&&typeof cmd.payload==='object'&&!Array.isArray(cmd.payload),'Invalid command envelope');
    const replay=this.store.replay(this.state,actor,cmd);if(replay)return replay;
    this.tick();const copy=structuredClone(this.state);command(copy,this.pack,actor,cmd,this.clock());
    const result={accepted:true,commandId:cmd.id,revision:copy.revision,instance:copy.instance};
    this.store.commit(copy,{actor,cmd,result},this.clock());this.state=copy;return result;
  }
  join(seatId: string,invite: string) {
    requireRule(typeof seatId==='string'&&typeof invite==='string','Invitation required');
    const seat=this.state.players.find(x=>x.id===seatId);requireRule(seat&&!seat.token&&this.equal(invite,seat.invite),'Invitation is invalid or has already been used. Reconnect with your saved credential or ask the GM to replace the device.');
    const token=secret();this.mutate(copy=>{const player=copy.players.find(x=>x.id===seatId)!;player.token=token;player.invite=secret();copy.revision++;event(copy,'seat_joined',{seat:seatId},seatId,'gm');});this.lastSeen.set(seatId,this.clock());return {token,seat:seatId,session:this.state.id};
  }
  newMission(token: string,id: string,version: string) {
    requireRule(this.actor(token).kind==='gm','GM required');requireRule(this.state.phase==='ended'||this.state.phase==='lobby','Finish or interrupt this mission before starting another');
    const p=this.store.pack(id,version);const next=newState(p,this.state);this.store.commit(next,undefined,this.clock());this.state=next;this.lastSeen.clear();return {session:next.id};
  }
}
