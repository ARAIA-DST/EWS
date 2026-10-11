import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {profile} from './talent-env.mjs';
function storage(){const map=new Map();return{getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,String(v)),removeItem:k=>map.delete(k),key:i=>[...map.keys()][i],get length(){return map.size;}};}
test('demo gateway persists two separate conversions and refreshes original NC data',async()=>{
  globalThis.localStorage=storage();globalThis.sessionStorage=storage();
  const base=await import('../js/api.js'),addon=await import('../js/talent-service.js');
  await base.login('admin','demo12345',true);const before=await base.read('dashboard');
  for(let i=1;i<=2;i++){const r=await addon.write('talent.save',profile(i)),rid=randomUUID(),p={spg_id:r.spg_id,area:'Jakarta',supervisor_id:'SUP01',tanggal_join:globalThis.RetentionCore.nowDay()};const first=await addon.write('talent.convert',p,{requestId:rid}),repeat=await addon.write('talent.convert',p,{requestId:rid});assert.equal(repeat.nc_id,first.nc_id);}
  const after=await base.read('dashboard');assert.equal(after.total,before.total+2);const list=await addon.read('talent.list');assert.equal(list.rows.filter(r=>r.nc_id).length,2);
  await base.logout();delete globalThis.localStorage;delete globalThis.sessionStorage;
});
test('demo daily TL reporting persists through role changes and permits HR review without altering NC',async()=>{
  globalThis.localStorage=storage();globalThis.sessionStorage=storage();const base=await import('../js/api.js'),addon=await import('../js/talent-service.js');await base.login('supervisor','demo12345',true);const before=await base.read('dashboard');
  const p={tanggal:globalThis.RetentionCore.nowDay(),area:'Jakarta',industry_id:'fmcg',outlets_visited:2,summary:'Kegiatan kunjungan',market_condition:'Traffic ramai',competitor_activity:'Sampling kompetitor',next_action:'Koordinasi materi',source_type:'Observasi lapangan',source_ref:'Outlet Uji',send:true},rid=randomUUID(),report=await addon.write('market.daily.save',p,{requestId:rid});assert.equal(report.status,'Dikirim');assert.equal((await addon.write('market.daily.save',p,{requestId:rid})).report_id,report.report_id);assert.equal((await addon.read('market.daily.list',{day:'all'})).total,1);assert.equal((await base.read('dashboard')).total,before.total);
  await base.logout();await base.login('hr','demo12345',true);const reviewed=await addon.write('market.daily.review',{report_id:report.report_id,revision:report.revision,status:'Ditinjau',review_note:'Sudah diperiksa'});assert.equal(reviewed.status,'Ditinjau');assert.equal((await addon.read('market.daily.detail',{report_id:report.report_id})).history.length,2);await base.logout();delete globalThis.localStorage;delete globalThis.sessionStorage;
});
