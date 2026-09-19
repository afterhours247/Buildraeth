import fs from "node:fs";import path from "node:path";
const read=(n)=>JSON.parse(fs.readFileSync(path.join(process.cwd(),"data",n),"utf8"));
const spells=read("spells.json"),mods=read("modifiers.json"),eq=read("equipment.json"),arch=read("archetypes.json"),concepts=read("build-concepts.json");
let bad=false;const fail=(m)=>{console.error("[data:validate] "+m);bad=true};const uniq=(rows,label)=>{const seen=new Set();for(const r of rows){if(!r.id)fail(label+" missing id");if(seen.has(r.id))fail(label+" duplicate "+r.id);seen.add(r.id)}};
uniq(spells,"spell");uniq(mods,"modifier");uniq(eq.sets,"set");uniq(eq.slots,"slot");uniq(arch,"archetype");uniq(concepts,"concept");
const spellIds=new Set(spells.map(x=>x.id)),setIds=new Set(eq.sets.map(x=>x.id));
for(const m of mods)if(!spellIds.has(m.spellId))fail("modifier "+m.id+" references missing spell "+m.spellId);
for(const c of concepts){for(const id of c.spellIds)if(!spellIds.has(id))fail("concept "+c.id+" missing spell "+id);for(const id of c.setIds)if(!setIds.has(id))fail("concept "+c.id+" missing set "+id)}
if(spells.length!==46)fail("expected 46 spells, found "+spells.length);if(eq.sets.length!==23)fail("expected 23 sets, found "+eq.sets.length);if(eq.slots.length!==8)fail("expected 8 slots, found "+eq.slots.length);if(arch.length!==9)fail("expected 9 archetypes, found "+arch.length);
if(bad)process.exit(1);console.log("[data:validate] PASS · 46 spells · "+mods.length+" modifiers · 23 sets · 9 archetypes");