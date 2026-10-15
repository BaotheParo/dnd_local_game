import { createHash } from 'node:crypto';
import type { Pack, Scene } from './model.ts';

function assert(ok: unknown, message: string): asserts ok { if (!ok) throw new Error(`Pack: ${message}`); }
function object(value: unknown, keys: string[], where: string): asserts value is Record<string, any> {
  assert(value && typeof value === 'object' && !Array.isArray(value), `${where} must be an object`);
  assert(Object.keys(value).every(k => keys.includes(k)) && keys.every(k => Object.hasOwn(value, k)), `${where} fields differ from schema`);
}
function str(v: unknown, max = 5000): asserts v is string { assert(typeof v === 'string' && v.length > 0 && v.length <= max, 'invalid text'); }
function id(v: unknown) { str(v, 80); assert(/^[a-z][a-z0-9_-]*$/.test(v), `invalid identifier ${v}`); }
function num(v: unknown, lo: number, hi: number) { assert(Number.isInteger(v) && Number(v) >= lo && Number(v) <= hi, 'numeric bound'); }
function list(v: unknown, lo: number, hi: number): asserts v is any[] { assert(Array.isArray(v) && v.length >= lo && v.length <= hi, 'invalid array length'); }
const resources = ['supplies', 'integrity', 'alarm'];
export const digestPack = (p: Pack) => createHash('sha256').update(JSON.stringify(p)).digest('hex');

export function validatePack(raw: unknown): Pack {
  object(raw, ['id','version','schemaVersion','engineRange','title','language','assets','mission','intrigue','scenes'], 'manifest');
  id(raw.id); str(raw.version, 30); assert(/^\d+\.\d+\.\d+$/.test(raw.version), 'semantic version required');
  assert(raw.schemaVersion === 3 && raw.engineRange === '3', 'unsupported engine/schema'); str(raw.title, 160); str(raw.language, 20);
  list(raw.assets, 0, 30);
  raw.assets.forEach((a: unknown) => { str(a, 180); assert(/^(art|licenses)\/[a-zA-Z0-9_/-]+\.(png|webp|jpg|ogg|mp3|woff2|txt)$/.test(a) && !a.includes('..'), 'unsafe asset path'); });
  const m = raw.mission;
  object(m, ['entryScene','allowedModes','rosterRange','resources','endings'], 'mission'); id(m.entryScene);
  list(m.allowedModes, 1, 2); assert(new Set(m.allowedModes).size === m.allowedModes.length && m.allowedModes.every((x: unknown) => x === 'cooperative' || x === 'intrigue'), 'mode');
  assert(JSON.stringify(m.rosterRange) === '[8,8]', 'this release requires exactly eight players');
  object(m.resources, resources, 'resources'); num(m.resources.supplies, 0, 12); num(m.resources.integrity, 1, 6); num(m.resources.alarm, 0, 6);
  object(m.endings, ['delivered','urgent','evacuated'], 'endings'); Object.values(m.endings).forEach(x => str(x));
  if (raw.intrigue !== null) {
    object(raw.intrigue, ['certification','windows','agendaCounts','traceSize','minIntersection'], 'intrigue');
    assert(raw.intrigue.certification === 'mistbound-v3-eight' && JSON.stringify(raw.intrigue.windows) === '["W1","W2"]' && JSON.stringify(raw.intrigue.agendaCounts) === '[6,1,1]' && raw.intrigue.traceSize === 4 && raw.intrigue.minIntersection === 2, 'intrigue contract');
  }
  assert(!m.allowedModes.includes('intrigue') || raw.intrigue !== null, 'intrigue needs complete certification');
  list(raw.scenes, 2, 60);
  const ids = new Set<string>(); const cardIds = new Set<string>();
  raw.scenes.forEach((s: unknown) => {
    object(s, ['id','family','title','text','practice','seconds','default','options','cards','next','checkpoint','puzzle'], 'scene');
    id(s.id); assert(!ids.has(s.id), 'duplicate scene'); ids.add(s.id);
    assert(['choice','deduction','negotiation','rest','allocation','ending'].includes(s.family), 'unsupported family');
    str(s.title, 180); str(s.text); str(s.practice); num(s.seconds, 20, 900); str(s.default, 80);
    assert(s.next === null || typeof s.next === 'string', 'next scene'); assert(['none','rest'].includes(s.checkpoint), 'checkpoint');
    assert(s.checkpoint!=='rest'||s.family==='rest','W1 checkpoint must follow a rest scene');
    list(s.options, 0, 12); const options = new Set<string>();
    s.options.forEach((o: unknown) => {
      object(o, ['id','title','consequence','next','cost','conditions','effects','engineer'], 'option');
      id(o.id); assert(!options.has(o.id), 'duplicate option'); options.add(o.id); str(o.title, 180); str(o.consequence); id(o.next); num(o.cost, 0, 12); assert(typeof o.engineer === 'boolean', 'engineer');
      list(o.conditions, 0, 10); o.conditions.forEach((c: unknown) => {
        assert(c && typeof c === 'object', 'condition');
        if ((c as any).op === 'resource') { object(c, ['op','key','min'], 'condition'); assert(resources.includes(c.key), 'resource'); num(c.min, 0, c.key==='supplies'?12:6); }
        else { object(c, ['op','key','equals'], 'condition'); assert(c.op === 'flag', 'unknown condition'); id(c.key); assert(typeof c.equals === 'boolean', 'flag value'); }
      });
      list(o.effects, 0, 12); o.effects.forEach((e: unknown) => {
        assert(e && typeof e === 'object', 'effect');
        switch ((e as any).op) {
          case 'resource': object(e, ['op','key','delta'], 'effect'); assert(resources.includes(e.key), 'effect resource'); num(e.delta, -12, 12); break;
          case 'flag': object(e, ['op','key','value'], 'effect'); id(e.key); assert(typeof e.value === 'boolean', 'flag value'); break;
          case 'risk': object(e, ['op','dc','failureIntegrity'], 'effect'); assert([10,13,16].includes(e.dc), 'risk DC'); num(e.failureIntegrity, 1, 2); break;
          case 'repair': object(e, ['op'], 'effect'); break;
          default: throw new Error('Pack: unknown executable effect');
        }
      });
    });
    list(s.cards, 0, 8); assert(s.cards.length === 0 || s.cards.length === 8, 'private cards must cover all eight seats');
    s.cards.forEach((c: unknown) => { object(c, ['id','issuer','type','text','factRefs'], 'card'); id(c.id); assert(!cardIds.has(c.id), 'duplicate evidence'); cardIds.add(c.id); str(c.issuer, 180); str(c.text); assert(['authenticated','testimony'].includes(c.type), 'evidence type'); list(c.factRefs, 1, 10); c.factRefs.forEach((f: unknown) => id(f)); });
    if (s.family === 'deduction') {
      object(s.puzzle, ['answer','maxAttempts','hints','bridges','destination','weights'], 'puzzle');
      const p = s.puzzle; num(p.maxAttempts, 1, 2); list(p.hints, 1, 3); p.hints.forEach((h: unknown) => str(h)); str(p.destination, 40); list(p.weights, 2, 2); assert(JSON.stringify(p.weights) === '[6,7]', 'validate both passenger weights'); list(p.bridges, 3, 3);
      const bridgeIds = new Set<string>();
      p.bridges.forEach((b: unknown) => { object(b, ['id','capacity','gate','open'], 'bridge'); id(b.id); assert(!bridgeIds.has(b.id), 'duplicate bridge'); bridgeIds.add(b.id); num(b.capacity, 1, 12); str(b.gate, 40); assert(typeof b.open === 'boolean', 'bridge availability'); });
      p.weights.forEach((w: number) => { const solutions = p.bridges.filter((b: any) => b.open && b.capacity >= w && b.gate === p.destination); assert(solutions.length === 1 && solutions[0].id === p.answer, 'puzzle must have one canonical answer at weights 6 and 7'); });
      assert(s.cards.length === 8 && s.next, 'deduction needs clues and continuation');
      const north=p.bridges.find((b:any)=>b.id==='north'),middle=p.bridges.find((b:any)=>b.id==='middle'),south=p.bridges.find((b:any)=>b.id==='south');
      assert(north&&middle&&south&&north.open&&!middle.open&&south.open,'supported bridge template requires North/South open and rain-retracted Middle');
      const facts=[
        'The vehicle weighs six. Essential cargo is already included and cannot be discarded.',
        'Taking the family aboard adds one unit of weight.',
        `North supports ${['zero','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve'][north.capacity]} and leads through ${north.gate}.`,
        `Middle supports ${['zero','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve'][middle.capacity]} and leads through ${middle.gate}.`,
        `South supports ${['zero','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve'][south.capacity]} and leads through ${south.gate}.`,
        'Rain is falling upstream.','Rain retracts Middle.',`The destination is beyond ${p.destination}.`,
      ];
      s.cards.forEach((c:any,i:number)=>assert(c.type==='authenticated'&&c.text===facts[i]&&JSON.stringify(c.factRefs)===JSON.stringify([`bridge_fact_${i+1}`]),'bridge clues must match canonical facts'));
      assert(options.size === 3 && p.bridges.every((b: any) => options.has(b.id)), 'bridge choices must match facts');
    } else assert(s.puzzle === null, 'puzzle only on deduction');
    if (['choice','negotiation','rest'].includes(s.family)) {
      assert(options.has(s.default), 'missing default');
      const fallback = s.options.find((o: any) => o.id === s.default);
      assert(fallback.cost === 0 && fallback.conditions.length === 0, 'default must always be affordable');
    }
    if (s.family === 'allocation') assert(s.next && s.options.length === 0, 'allocation continuation');
    if (s.family === 'ending') assert(s.next === null && s.options.length === 0, 'ending cannot continue');
  });
  const pack = raw as unknown as Pack;
  const map = new Map(pack.scenes.map(s => [s.id, s])); assert(map.has(pack.mission.entryScene), 'missing entry scene');
  const visiting = new Set<string>(), visited = new Set<string>();
  function walk(key: string): boolean {
    assert(map.has(key), `dangling scene ${key}`); assert(!visiting.has(key), 'uncontrolled scene loop');
    if (visited.has(key)) return true;
    visiting.add(key); const s = map.get(key)!;
    const nexts = new Set([...(s.next ? [s.next] : []), ...s.options.map(o => o.next)]);
    assert(s.family === 'ending' || nexts.size > 0, 'scene without ending');
    for (const n of nexts) walk(n);
    visiting.delete(key); visited.add(key); return true;
  }
  walk(pack.mission.entryScene); assert(visited.size === map.size, 'unreachable scene');
  assert(pack.scenes.some(s => s.family === 'allocation') && pack.scenes.some(s => s.family === 'deduction') && pack.scenes.some(s => s.family === 'negotiation'), 'launch pack needs all three supported families');
  if (m.allowedModes.includes('intrigue')) {
    assert(pack.scenes.filter(s => s.checkpoint === 'rest').length === 1 && pack.scenes.filter(s => s.family === 'allocation').length === 1, 'intrigue requires exactly one rest and storm');
    const checked=new Set<string>();
    function checkWindows(key:string,progress:number) {
      const signature=`${key}:${progress}`;if(checked.has(signature))return;checked.add(signature);
      const scene=map.get(key)!;
      if(scene.checkpoint==='rest'){assert(progress===0,'rest/private window order');progress=1;}
      if(scene.family==='allocation'){assert(progress===1,'intrigue storm must follow W1 and Watch');progress=2;}
      if(scene.family==='ending')assert(progress===2,'intrigue ending cannot bypass its declared windows');
      for(const next of new Set([...(scene.next?[scene.next]:[]),...scene.options.map(o=>o.next)]))checkWindows(next,progress);
    }
    checkWindows(pack.mission.entryScene,0);
  }
  // Prove an affordable cooperative path for every published choice from all reachable resource states.
  const memo = new Set<string>(); let states = 0;
  function feasible(scene: Scene, supply: number, flags: Record<string, boolean>): boolean {
    assert(++states < 15000, 'feasibility budget exceeded');
    const key = JSON.stringify([scene.id,supply,flags]); if (memo.has(key)) return true; memo.add(key);
    if (scene.family === 'ending') return true;
    if (scene.family === 'allocation' || scene.family === 'deduction') return feasible(map.get(scene.next!)!, supply, flags);
    const available = scene.options.filter(o => o.cost <= supply && o.conditions.every(c => c.op === 'flag' ? Boolean(flags[c.key]) === c.equals : c.key !== 'supplies' || supply >= c.min));
    assert(available.length, 'no affordable continuation');
    return available.every(o => {
      let after = supply - o.cost; const nextFlags = { ...flags };
      for (const e of o.effects) { if (e.op === 'resource' && e.key === 'supplies') after = Math.max(0,Math.min(12,after + e.delta)); if (e.op === 'flag') nextFlags[e.key] = e.value; }
      return feasible(map.get(o.next)!, after, nextFlags);
    });
  }
  feasible(map.get(m.entryScene)!, m.resources.supplies, {});
  return structuredClone(pack);
}
