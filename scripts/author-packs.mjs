// Original authored JSON content, kept outside the browser asset graph.
import { mkdirSync, writeFileSync } from 'node:fs';
const flag = (key,value=true) => ({op:'flag',key,value});
const resource = (key,delta) => ({op:'resource',key,delta});
const option = (id,title,consequence,next,cost=0,effects=[],engineer=false,conditions=[]) => ({id,title,consequence,next,cost,conditions,effects,engineer});
const scene = (id,family,title,text,options=[],next=null,extra={}) => ({id,family,title,text,practice:'Everyone chooses on their own phone. Choices can change until closure. Ready does not apply effects. Plain speech is enough; acting is optional.',seconds:90,default:options.find(o=>!o.cost&&!o.conditions.length)?.id || 'abstain',options,cards:[],next,checkpoint:'none',puzzle:null,...extra});
const facts = [
  'The vehicle weighs six. Essential cargo is already included and cannot be discarded.',
  'Taking the family aboard adds one unit of weight.',
  'North supports eight and leads through Sun.',
  'Middle supports ten and leads through Moon.',
  'South supports seven and leads through Leaf.',
  'Rain is falling upstream.',
  'Rain retracts Middle.',
  'The destination is beyond Sun.',
];
const bridges = [{id:'north',capacity:8,gate:'Sun',open:true},{id:'middle',capacity:10,gate:'Moon',open:false},{id:'south',capacity:7,gate:'Leaf',open:true}];
const deduction = (prefix,next) => scene(`${prefix}_bridge`,'deduction','The Three Mist Bridges','Three crossings emerge from the mist. Each crew member holds one authenticated fact. Share your cards, combine load, availability and destination, then each vote for a bridge. Two wrong submissions cost one Alarm each; then the route is explained.',bridges.map(b=>option(b.id,b.id[0].toUpperCase()+b.id.slice(1),'A wrong bridge adds one Alarm. A correct solution needs no roll.',next)),next,{
  default:'abstain',practice:'Practice: a bridge can carry your load and still lead to the wrong gate. Each person shares a fact, then votes independently.',
  cards:facts.map((text,i)=>({id:`${prefix}_fact_${i+1}`,issuer:'Lantern route registry',type:'authenticated',text,factRefs:[`bridge_fact_${i+1}`]})),
  puzzle:{answer:'north',maxAttempts:2,hints:['Compare the required destination with each gate.','The destination is beyond Sun; which bridge leads there?','North is open and supports eight: enough for either passenger load.'],bridges,destination:'Sun',weights:[6,7]},
});
const allocation = (prefix,next) => scene(`${prefix}_storm`,'allocation','The Living Mist','Three rounds: Pathfinder is threatened first, Mechanics second, both third. Two Shields protect a threatened squad; Mechanics needs three in round two if the family is aboard. Three Supply actions earn one Supply and a power round. Three Repel remove one Alarm. Achieve two power rounds to avoid late delivery. Missing actions are Shield in your own squad.',[],next,{
  seconds:60,practice:'Practice for one minute: eight actions must cover protection and power. Two Pathfinder Shield + three Supply + three Repel works in round one. Private arrangements never replace these actions.',
});
const endings = {delivered:'The replacement wick reaches North Lantern Station. A warm beam cuts through the mist. Earlier rescues and promises are recorded.',urgent:'Station rescuers pull the crew and wick to safety. The delivery succeeds under urgent conditions; every earlier rescue still matters.',evacuated:'The caravan cannot continue. Rescuers recover the chosen salvage, but the wick is not delivered. Earlier rescues remain part of the journal.'};
const base = (id,title,entry,scenes,intrigue=true) => ({id,version:'3.0.0',schemaVersion:3,engineRange:'3',title,language:'en',assets:['art/lantern-journey.png'],mission:{entryScene:entry,allowedModes:intrigue?['cooperative','intrigue']:['cooperative'],rosterRange:[8,8],resources:{supplies:6,integrity:5,alarm:0},endings},intrigue:intrigue?{certification:'mistbound-v3-eight',windows:['W1','W2'],agendaCounts:[6,1,1],traceSize:4,minIntersection:2}:null,scenes});
const first = base('last_lantern_delivery','The Last Lantern Delivery','lantern_ferry',[
  scene('lantern_ferry','choice','Stranded at the Ferry','Deliver a replacement wick to North Lantern Station. A family waits at the flooded ferry. The guild seal travels separately; losing it cannot undo the rescue. Decide how to help.',[
    option('aboard','Take the family aboard','Spend 1 Supply. Family safe; weight becomes seven. Mechanics needs one extra Shield in storm round two.','lantern_bridge',1,[flag('family_aboard'),flag('family_safe')]),
    option('equipment','Send rescue equipment','Spend 2 Supplies. Family safe by boat; no extra weight or Shield need.','lantern_bridge',2,[flag('family_by_boat'),flag('family_safe')]),
    option('signal','Signal another crew','Gain 1 Alarm. Rescue remains pending.','lantern_bridge',0,[resource('alarm',1),flag('family_pending')]),
  ]),
  deduction('lantern','lantern_crossing'),
  scene('lantern_crossing','choice','Cross the North Span','The correct route is known. Choose how to cross; solving the route is never invalidated by a die roll. Any Effort pledges apply only if Risk is selected.',[
    option('repair','Repair the crossing','Spend 2 Supplies; Engineer may reduce to 1. Cross safely.','lantern_market',2,[],true),
    option('detour','Take the long path','Gain 2 Alarm. Continue even if this marks the journey urgent.','lantern_market',0,[resource('alarm',2)]),
    option('risk','Risk the crossing — DC 13','Roll server d20 plus up to four pledged Effort. Failure loses 2 Integrity; success loses none.','lantern_market',0,[{op:'risk',dc:13,failureIntegrity:2}]),
  ]),
  scene('lantern_market','negotiation','Ilya’s One-Time Offer','Ilya needs a signal bell to keep the ferry running and cannot abandon its passengers. Your decorative bell is an acceptable trade. Each player votes: immediate protection or a memento?',[
    option('trade','Offer the decorative bell','Give up the bell; first storm shield purchase costs 1 Supply instead of 2. Does not stack with Engineer.','lantern_rest',0,[flag('bell',false),flag('voucher'),flag('ferry_trust')]),
    option('keep','Keep the bell','Retain the bell as a memento. No shield voucher.','lantern_rest'),
  ]),
  scene('lantern_rest','rest','The Warm Kiln','A short rest allows one hull repair. An Engineer may consent to reduce its cost by one. After this stop, intrigue mode opens its first private arrangement and optional Watch vote.',[
    option('repair_hull','Repair the hull','Spend 3 Supplies (2 with one consenting Engineer), gain 1 Integrity up to six.','lantern_storm',3,[{op:'repair'}],true,[{op:'resource',key:'integrity',min:0}]),
    option('rest','Rest without repair','Keep Supplies and continue.','lantern_storm'),
  ],null,{checkpoint:'rest'}),
  allocation('lantern','lantern_end'),
  scene('lantern_end','ending','North Lantern Station','The wick reaches its destination. Resolve security separately and remember the journey.'),
]);
// This complete second pack deliberately uses existing families; the future Silent Market brief is not claimed complete.
const second = base('ferry_medicine_exchange','The Ferry Medicine Exchange','medicine_trade',[
  scene('medicine_trade','negotiation','Nara’s Medicine Ledger','Nara must supply residents as well as your station. Each player holds a different documented constraint. Share them and compare three offers. There is no unrestricted bargaining engine: agree on one posted exchange.',[
    option('pay','Buy the sealed medicine','Spend 3 Supplies; keep the bell and make no promise.','medicine_bridge',3,[flag('medicine_obtained'),flag('paid_fairly')]),
    option('bell','Exchange the bell and one Supply','Spend 1 Supply and the bell. Gain medicine and ferry trust.','medicine_bridge',1,[flag('medicine_obtained'),flag('bell',false),flag('ferry_trust')]),
    option('promise','Accept a documented return journey','Gain medicine without spending Supplies; gain 1 Alarm and record a return promise.','medicine_bridge',0,[flag('medicine_obtained'),flag('return_promise'),resource('alarm',1)]),
  ],null,{cards:[
    'Nara will release the essential medicine through any one of the three posted offers.',
    'The station needs sealed medicine; opening the package is not a valid offer.',
    'The decorative bell can serve the ferry as a warning signal.',
    'Trading the bell improves ferry trust but removes the crew’s memento.',
    'Paying three Supplies creates no future obligation.',
    'A documented return journey costs time now: one Alarm.',
    'No offer grants an additional storm shield voucher.',
    'The coming storm needs at least two powered rounds; preserving Supplies may help protection.',
  ].map((text,i)=>({id:`medicine_offer_${i+1}`,issuer:'Nara’s posted exchange ledger',type:'authenticated',text,factRefs:[`offer_constraint_${i+1}`]}))}),
  deduction('medicine','medicine_route'),
  scene('medicine_route','choice','The Loaded Causeway','The medicine is sealed in the wagon. The correct bridge still needs a crossing plan.',[
    option('brace','Brace the causeway','Spend 2 Supplies; one Engineer may reduce the cost to 1.','medicine_rest',2,[],true),
    option('long','Use the ridge road','Gain 2 Alarm and preserve Supplies.','medicine_rest',0,[resource('alarm',2)]),
    option('chance','Risk the span — DC 13','Pledge up to four Effort; failure loses 2 Integrity.','medicine_rest',0,[{op:'risk',dc:13,failureIntegrity:2}]),
  ]),
  scene('medicine_rest','rest','Orin’s Workshop','Orin can restore one Integrity before the storm. Your chosen medicine exchange remains recorded in the season journal.',[
    option('fix','Buy one hull repair','Spend 3 Supplies (2 with Engineer), restore 1 Integrity.','medicine_storm',3,[{op:'repair'}],true),
    option('leave','Keep your resources','Continue with current Integrity.','medicine_storm'),
  ],null,{checkpoint:'rest'}),
  allocation('medicine','medicine_end'),
  scene('medicine_end','ending','The Medicine Lantern','Keep the medicine promise and the station’s lantern lit.'),
],false);
second.mission.endings = {delivered:'The medicine and replacement wick arrive intact. Nara’s exchange and any return promise are entered in the journal.',urgent:'Station rescuers receive the medicine and wick under urgent conditions. The exchange obligations remain.',evacuated:'The wagon is abandoned. The salvage choice and earlier promises are recorded; delivery fails.'};
mkdirSync('server/content',{recursive:true});
for (const p of [first,second]) writeFileSync(`server/content/${p.id}.json`,JSON.stringify(p,null,2)+'\n');
