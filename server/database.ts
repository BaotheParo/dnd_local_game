import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import type { Actor, Command, Pack, State } from './model.ts';
import { digestPack, validatePack } from './packs.ts';

export class Store {
  db: DatabaseSync;
  constructor(public path: string) {
    if(path!==':memory:') mkdirSync(dirname(path),{recursive:true});
    this.db=new DatabaseSync(path);this.db.exec(`
      PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA synchronous=FULL;
      CREATE TABLE IF NOT EXISTS packs(id TEXT,version TEXT,digest TEXT,content TEXT NOT NULL,PRIMARY KEY(id,version));
      CREATE TABLE IF NOT EXISTS members(id TEXT PRIMARY KEY,name TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS sessions(id TEXT PRIMARY KEY,gm_member_id TEXT NOT NULL,mode TEXT NOT NULL,rules_version INTEGER NOT NULL,pack_id TEXT,pack_version TEXT,digest TEXT,seed TEXT,status TEXT,FOREIGN KEY(pack_id,pack_version) REFERENCES packs(id,version));
      CREATE TABLE IF NOT EXISTS participants(session_id TEXT,seat TEXT,member_id TEXT,name TEXT,squad TEXT,role TEXT,PRIMARY KEY(session_id,seat),UNIQUE(session_id,member_id));
      CREATE TABLE IF NOT EXISTS private_state(session_id TEXT,seat TEXT,state TEXT NOT NULL,PRIMARY KEY(session_id,seat));
      CREATE TABLE IF NOT EXISTS scene_instances(session_id TEXT,instance_id TEXT,scene_id TEXT,phase TEXT,round INTEGER,stage TEXT,deadline INTEGER,revision INTEGER,state TEXT,PRIMARY KEY(session_id,instance_id));
      CREATE TABLE IF NOT EXISTS accepted_commands(session_id TEXT,command_id TEXT,actor TEXT,payload_hash TEXT,instance_id TEXT,accepted_at INTEGER,result TEXT,PRIMARY KEY(session_id,command_id));
      CREATE TABLE IF NOT EXISTS resolved_events(session_id TEXT,ordinal INTEGER,resolution_key TEXT,actor TEXT,type TEXT,payload TEXT,visibility TEXT,at INTEGER,PRIMARY KEY(session_id,ordinal));
      CREATE TABLE IF NOT EXISTS outcomes(session_id TEXT PRIMARY KEY,result TEXT);
      CREATE TABLE IF NOT EXISTS snapshots(session_id TEXT PRIMARY KEY,revision INTEGER,state TEXT NOT NULL,updated_at INTEGER);
      CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY,value TEXT NOT NULL);
    `);
  }
  transaction<T>(fn:()=>T):T {this.db.exec('BEGIN IMMEDIATE');try {const out=fn();this.db.exec('COMMIT');return out;}catch(e){this.db.exec('ROLLBACK');throw e;}}
  install(raw: unknown) {
    const pack=validatePack(raw); const digest=digestPack(pack);
    // Assets are shipped locally; JSON imports cannot install arbitrary files.
    for(const asset of pack.assets) readFileSync(resolve('public',asset));
    this.transaction(()=>{const existing=this.db.prepare('SELECT digest FROM packs WHERE id=? AND version=?').get(pack.id,pack.version);if(existing&&existing.digest!==digest)throw new Error('Pack version already exists with different content; increment its version.');this.db.prepare('INSERT OR IGNORE INTO packs VALUES(?,?,?,?)').run(pack.id,pack.version,digest,JSON.stringify(pack));});return pack;
  }
  packs() {return this.db.prepare('SELECT id,version,digest,content FROM packs ORDER BY id,version').all().map(row=>{const p=JSON.parse(String(row.content)) as Pack;return {id:row.id,version:row.version,digest:row.digest,title:p.title,modes:p.mission.allowedModes};});}
  pack(id: string,version: string,digest?: string) {
    const row=this.db.prepare('SELECT content,digest FROM packs WHERE id=? AND version=?').get(id,version);
    if(!row||digest&&row.digest!==digest)throw new Error('The exact saved pack version/digest is missing. Restore it from backup; this session cannot be guessed.');
    return JSON.parse(String(row.content)) as Pack;
  }
  active(): State|undefined {const row=this.db.prepare("SELECT state FROM snapshots WHERE session_id=(SELECT value FROM settings WHERE key='active_session')").get();return row?JSON.parse(String(row.state)):undefined;}
  snapshotTime(): number|undefined {const row=this.db.prepare("SELECT updated_at FROM snapshots WHERE session_id=(SELECT value FROM settings WHERE key='active_session')").get();return row?Number(row.updated_at):undefined;}
  commit(s: State,accepted?: {actor: Actor;cmd: Command;result: unknown},now=Date.now()) {
    this.transaction(()=>{
      this.db.prepare('INSERT OR REPLACE INTO members VALUES(?,?)').run(s.gm.memberId,s.gm.name);
      this.db.prepare('INSERT OR REPLACE INTO sessions VALUES(?,?,?,?,?,?,?,?,?)').run(s.id,s.gm.memberId,s.mode,s.rulesVersion,s.pack.id,s.pack.version,s.pack.digest,s.seed,s.phase);
      for (const player of s.players) {
        this.db.prepare('INSERT OR REPLACE INTO members VALUES(?,?)').run(player.memberId,player.name);
        this.db.prepare('INSERT OR REPLACE INTO participants VALUES(?,?,?,?,?,?)').run(s.id,player.id,player.memberId,player.name,player.squad,player.role);
        this.db.prepare('INSERT OR REPLACE INTO private_state VALUES(?,?,?)').run(s.id,player.id,JSON.stringify(player));
      }
      this.db.prepare('INSERT OR REPLACE INTO scene_instances VALUES(?,?,?,?,?,?,?,?,?)').run(s.id,s.instance,s.scene,s.phase,s.round,s.stage,s.deadline,s.revision,JSON.stringify({inputs:s.inputs,remaining:s.remaining,paused:s.paused,resolved:s.resolved}));
      for(const ev of s.events) this.db.prepare('INSERT OR IGNORE INTO resolved_events VALUES(?,?,?,?,?,?,?,?)').run(s.id,ev.ordinal,ev.key,ev.actor,ev.type,JSON.stringify(ev.data),ev.visibility,ev.at);
      if(s.outcome)this.db.prepare('INSERT OR REPLACE INTO outcomes VALUES(?,?)').run(s.id,JSON.stringify(s.outcome));
      this.db.prepare('INSERT OR REPLACE INTO snapshots VALUES(?,?,?,?)').run(s.id,s.revision,JSON.stringify(s),now);
      this.db.prepare("INSERT OR REPLACE INTO settings VALUES('active_session',?)").run(s.id);
      if(accepted)this.db.prepare('INSERT INTO accepted_commands VALUES(?,?,?,?,?,?,?)').run(s.id,accepted.cmd.id,accepted.actor.id,this.hash(accepted.cmd),accepted.cmd.instance,now,JSON.stringify(accepted.result));
    });
  }
  hash(cmd: Command) {return createHash('sha256').update(JSON.stringify(cmd)).digest('hex');}
  replay(s: State,actor: Actor,cmd: Command) {
    const row=this.db.prepare('SELECT actor,payload_hash,result FROM accepted_commands WHERE session_id=? AND command_id=?').get(s.id,cmd.id);
    if(!row)return undefined;
    if(row.actor!==actor.id||row.payload_hash!==this.hash(cmd))throw new Error('Command ID has already been used for a different actor or payload.');
    return JSON.parse(String(row.result));
  }
  backup() {
    // SQLite serialize yields a consistent standalone DB including pack versions and secrets.
    // VACUUM INTO runs with a generated path, passed as an SQL parameter.
    const target=resolve(dirname(this.path),`backup-${Date.now()}-${Math.random().toString(16).slice(2)}.sqlite`);
    this.db.prepare('VACUUM INTO ?').run(target);return target;
  }
  close() {this.db.close();}
}
