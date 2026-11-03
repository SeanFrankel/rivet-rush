const test = require("node:test");
const assert = require("node:assert/strict");
const Yard = require("../match");
function advance(m, seconds, controls = () => ({})) {
  for(let tick=0;tick<Math.round(seconds*60);tick++) Yard.step(m,controls(tick),1/60);
}
test("the pilot can reach the crane using the first two platforms",()=>{
  const m=Yard.create(), p=m.player;
  advance(m,4.8,tick=>({right:p.x<714,jump:[38,53,147,163].includes(tick)}));
  assert.equal(p.y,208);
  Yard.step(m,{crane:true},1/60);
  assert.equal(m.bridge,10);
  advance(m,10.1);assert.equal(m.bridge,0);
});
test("a push with crew upgrades can end the match",()=>{
  const m=Yard.create();
  advance(m,250,()=>({right:m.player.x<1600,fire:true,buy:m.scrap>=12,pulse:true}));
  assert.equal(m.winner,0);
  assert.equal(m.rank,3);
  const end=m.time;
  advance(m,2);assert.equal(m.time,end);
});
test("the opposing crew can destroy an undefended reactor",()=>{
  const m=Yard.create();advance(m,420);
  assert.equal(m.winner,1);
});
