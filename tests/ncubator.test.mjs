import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {environment,profile} from './talent-env.mjs';
import {navFor,routeAllowed,groupFor} from '../js/navigation.js';
import {network} from '../js/request-queue.js';
const C=globalThis.RetentionCore;
function addNC(e,admin,ncId=e.sheets.NC[1][0],username='nc-test'){
  const saved=e.req('user.save',{username,nama:'Akun NC Uji',role:'NC',nc_id:ncId,password:'TestPassword123',aktif:true},admin.token,true);
  assert.equal(saved.ok,true,JSON.stringify(saved.error));const logged=e.login(username);assert.ok(logged?.token);return logged;
}
test('login returns light context without calculating risk or dashboard and does not invalidate business caches',()=>{
  const e=environment(),a=e.login();assert.ok(a.context);assert.equal(a.context.dashboard,undefined);assert.equal(e.reads.Signals||0,0);assert.equal(e.reads.ActionPlans||0,0);assert.equal(e.req('dashboard',{},a.token).ok,true);
  e.login('hr');assert.equal(e.req('dashboard',{},a.token).meta.cached,true);assert.ok(!JSON.stringify(a.context).includes('pin_hash'));assert.ok(!JSON.stringify(a.context).includes('salt'));
});
test('cached requests authenticate by one fresh user row and use one properties snapshot',()=>{
  const e=environment(),a=e.login();e.req('dashboard',{},a.token);const before={...e.reads},snap=e.propertyReads.snapshot,single=e.propertyReads.single,rows=e.rangeReads.Users;
  const r=e.req('dashboard',{},a.token);assert.equal(r.meta.cached,true);assert.deepEqual(e.reads,before);assert.equal(e.rangeReads.Users,rows+1);assert.equal(e.propertyReads.snapshot,snap+1);assert.equal(e.propertyReads.single,single);
  e.sheets.Users.find(r=>r[0]===a.user.user_id)[C.SCHEMA.Users.indexOf('aktif')]=false;assert.equal(e.req('dashboard',{},a.token).error.code,'AUTH');
});
test('shared sheet datasets reduce full reads across 300 distinct registered accounts without sharing scoped responses',()=>{
  const e=environment(),a=e.login();const importResult=e.req('talent.import',{rows:Array.from({length:1000},(_,i)=>profile(i+1))},a.token,true);assert.equal(importResult.ok,true);const users=[];
  for(let i=0;i<300;i++){
    const id='LOAD_'+i,role=i%2?'Supervisor':'Viewer';e.sheets.Users.push(C.SCHEMA.Users.map(h=>({user_id:id,username:'load-'+i,nama:'Account '+i,role,area:'Uji',aktif:true,salt:'test-salt',pin_hash:e.context.passwordHash_('TestPassword123','test-salt')})[h]??''));users.push({id,role,row:e.sheets.Users.length});
  }
  const before={...e.reads};let fullCount=0;
  for(const u of users){const token='load-token-'+u.id;e.cache.set('session:'+e.context.digest_(token),JSON.stringify({user_id:u.id,hash:e.sheets.Users[u.row-1][7],role:u.role,expires:Date.now()+60000,user_row:u.row}));const r=e.req('talent.list',{pageSize:20},token);assert.equal(r.ok,true);assert.equal(r.data.total,u.role==='Viewer'?1000:0);if(u.role==='Viewer')assert.equal(r.data.rows[0].no_hp,undefined);assert.ok(r.data.rows.length<=20);}
  for(const t of ['SPG_Database','NC'])fullCount+=(e.reads[t]||0)-(before[t]||0);assert.ok(fullCount<=2,'300 scoped requests should reuse the dataset cache');assert.equal(e.reads.SPG_Database-(before.SPG_Database||0),1);
});
test('sheet writes invalidate the shared dataset and refreshed photos keep authentication and TL scope',()=>{
  const e=environment(),a=e.login(),s=e.req('talent.save',profile(),a.token,true).data;e.req('talent.list',{},a.token);e.req('talent.save',{...profile(),spg_id:s.spg_id,nama:'Nama diperbarui'},a.token,true);assert.equal(e.req('talent.list',{},a.token).data.rows[0].nama,'Nama diperbarui');
  const png=Buffer.from([137,80,78,71,13,10,26,10,1]).toString('base64'),r=e.req('talent.photo.upload',{spg_id:s.spg_id,mime:'image/png',base64:png},a.token,true);assert.equal(r.ok,true);assert.ok(r.data.photoVersion);assert.ok(e.req('talent.photo',{spg_id:s.spg_id},a.token).data.dataUrl.startsWith('data:image/png'));
  const sup=e.login('supervisor'),idx=globalThis.TalentCore.SCHEMA.SPG_Database.indexOf('owner_id');e.sheets.SPG_Database[1][idx]='SUP02';e.context.clearNCUBATORCache();assert.equal(e.req('talent.photo',{spg_id:s.spg_id},sup.token).error.code,'FORBIDDEN');assert.equal(e.req('talent.photo',{spg_id:s.spg_id}).error.code,'AUTH');
});
test('an NC account reads only its own portal and cannot access team, market, AI or sensitive conversations',()=>{
  const e=environment(),admin=e.login(),nc=addNC(e,admin);assert.equal(nc.context.user.nc_id,nc.user.nc_id);assert.ok(nc.context.lookups.supervisors.length<=1);
  const home=e.req('self.home',{nc_id:e.sheets.NC[2][0]},nc.token);assert.equal(home.data.profile.nc_id,nc.user.nc_id);const text=JSON.stringify(home.data);assert.ok(!text.includes('catatan'));assert.ok(!text.includes('akar_masalah'));assert.ok(!text.includes('initial_score'));
  for(const action of ['dashboard','nc.list','nc.detail','report','users.list','talent.list','talent.meta','market.daily.list','talent.ai.generate']){const r=e.req(action,{nc_id:nc.user.nc_id},nc.token,action==='talent.ai.generate');assert.equal(r.ok,false,action);assert.equal(r.error.code,'FORBIDDEN',action);}
});
test('NC submits its own leave with idempotency and cannot approve or submit for somebody else',()=>{
  const e=environment(),admin=e.login(),nc=addNC(e,admin),own=nc.user.nc_id,params={nc_id:own,tipe:'izin',jenis:'Dinas/lainnya',mulai:C.plus(C.nowDay(),40),selesai:C.plus(C.nowDay(),40),alasan:'Pengajuan uji portal'};
  const r=e.req('request.submit',params,nc.token,true,'self-request-001');assert.equal(r.ok,true,JSON.stringify(r.error));assert.equal(e.req('request.submit',params,nc.token,true,'self-request-001').meta.replayed,true);
  assert.equal(e.req('request.submit',{...params,nc_id:e.sheets.NC[2][0]},nc.token,true).error.code,'FORBIDDEN');assert.equal(e.req('request.decide',{req_id:r.data.req_id},nc.token,true).error.code,'FORBIDDEN');assert.equal(e.req('signals.save',{nc_id:own},nc.token,true).error.code,'FORBIDDEN');assert.equal(e.req('batch',{actions:[{action:'request.submit',params}]},nc.token,true).error.code,'FORBIDDEN');
  const list=e.req('self.requests',{pageSize:50},nc.token);assert.ok(list.data.rows.every(r=>r.nc_id===own));assert.ok(list.data.rows.some(x=>x.req_id===r.data.req_id));
});
test('changing an NC account binding revokes its current session and duplicate binding is rejected',()=>{
  const e=environment(),a=e.login(),nc=addNC(e,a);assert.equal(e.req('user.save',{username:'other-nc',nama:'Lain',role:'NC',nc_id:nc.user.nc_id,password:'TestPassword123'},a.token,true).ok,false);
  e.sheets.NC_User_Links[1][1]=e.sheets.NC[2][0];assert.equal(e.req('self.home',{},nc.token).error.code,'AUTH');
});
test('safe setup is idempotent and preserves all 19 original sheet headers, records and auth pepper',()=>{
  const e=environment();delete e.sheets.NC_User_Links;const tables=Object.keys(C.SCHEMA).filter(t=>t!=='NC_User_Links'),before=Object.fromEntries(tables.map(t=>[t,structuredClone(e.sheets[t])])),pepper=e.props.get('AUTH_PEPPER');e.context.setupNCUBATOR();e.context.setupNCUBATOR();assert.equal(e.props.get('AUTH_PEPPER'),pepper);for(const t of tables)assert.deepEqual(e.sheets[t],before[t]);assert.deepEqual(e.sheets.NC_User_Links[0],C.SCHEMA.NC_User_Links);
});
test('role menus have unique primary workflows and preserve former links as tabs',()=>{
  for(const role of ['Admin','HR','Supervisor','Viewer','NC']){const nav=navFor(role);assert.equal(new Set(nav.map(g=>g.id)).size,nav.length);assert.equal(nav.some(g=>g.id==='users'),role==='Admin');}
  assert.equal(groupFor('readiness','Admin'),'onboarding');assert.equal(groupFor('plans','Supervisor'),'early-warning');assert.equal(groupFor('talent-insights','Viewer'),'reports');assert.equal(routeAllowed('signals','Viewer'),false);assert.equal(routeAllowed('talent','NC'),false);assert.equal(routeAllowed('self-home','NC'),true);assert.equal(routeAllowed('self-home','Admin'),false);
});
test('browser request queue limits concurrent work and does not run an aborted queued request',async()=>{
  let active=0,max=0,calls=0;const tasks=Array.from({length:20},()=>network(async()=>{active++;max=Math.max(max,active);calls++;await new Promise(r=>setTimeout(r,4));active--;return true;}));await Promise.all(tasks);assert.equal(calls,20);assert.ok(max<=3);
  const c=new AbortController();c.abort();await assert.rejects(network(()=>{throw new Error('must not execute');},c.signal),e=>e.name==='AbortError');
});
test('photographs use viewport observation without the hidden native-lazy-loading deadlock',()=>{
  const s=readFileSync(new URL('../js/talent-addon.js',import.meta.url),'utf8');assert.ok(!s.includes('loading="lazy" hidden'));assert.ok(s.includes("image.loading='eager'"));assert.ok(s.includes('readPhoto'));assert.ok(s.includes('profile_photo'));
});
test('receipt search preserves case-sensitive request IDs despite Sheets case-insensitive text matching',()=>{
  const e=environment(),a=e.login(),p={username:'case-test',nama:'Account Uji',role:'Viewer',password:'TestPassword123'};
  assert.equal(e.req('user.save',p,a.token,true,'case-receipt-001').ok,true);e.cache.clear();const again=e.login();
  const r=e.req('user.save',p,again.token,true,'Case-receipt-001');assert.equal(r.ok,false);assert.equal(r.error.code,'VALIDATION');assert.equal(r.meta.replayed,undefined);
});
