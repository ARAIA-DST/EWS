import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import '../shared/assistant-core.js';
import {navFor,routeAllowed} from '../js/navigation.js';
import {environment} from './talent-env.mjs';
const A=globalThis.NCubatorAssistant;
function enabled(){const e=environment();e.props.set('NCUBATOR_ASSISTANT_ENABLED','true');e.props.set('OPENAI_API_KEY','unit-test-key');return e;}
function stubGPT(e,callback=()=>{}){e.context.UrlFetchApp.fetch=(url,options)=>{const payload=JSON.parse(options.payload),facts=JSON.parse(payload.input);e.requests.push({url,payload,facts,locked:!!e.context.LockService.getScriptLock().hasLock?.()});callback(payload,facts);return{getResponseCode:()=>200,getContentText:()=>JSON.stringify({status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify({summary:'Ringkasan konteks untuk pengujian.',insights:[{title:'Prioritas modul',explanation:'Fakta agregat dalam akses akun.',recommendation:'Tinjau bersama penanggung jawab.',priority:'normal',evidence_ids:[facts.metrics.find(m=>!m.suppressed)?.id||'invalid']}]})}]}]})};};}
const generate=(e,s,route,filters={},id='')=>e.req('assistant.generate',{route,filters,id},s.token,true);
test('assistant route access follows existing navigation for every role and rejects endpoint injection',()=>{
  for(const role of ['Admin','HR','Supervisor','Viewer','NC'])for(const route of Object.keys(A.MODULES)){assert.equal(!!(()=>{try{A.source(role,route);return true;}catch{return false;}})(),routeAllowed(route,role),role+' '+route);}
  assert.throws(()=>A.source('NC','dashboard'),{code:'FORBIDDEN'});assert.throws(()=>A.source('Viewer','users'),{code:'FORBIDDEN'});
  const s=A.source('Supervisor','market','',{tab:'daily',page:999999,pageSize:999999,token:'secret',action:'users.list',facts:{override:1}});assert.equal(s.action,'market.daily.list');assert.equal(s.params.pageSize,100);assert.equal(s.params.token,undefined);assert.equal(s.params.action,undefined);
  assert.equal(navFor('Viewer').length,4);
});
test('module metrics are factual, filtered and partial counts are labeled as page counts',()=>{
  const dashboard=A.build(A.source('Admin','dashboard'),{total:38,High:10,Moderate:8,Low:20,pending:4,signalCoverage:37});assert.match(dashboard.insights[0].explanation,/10 dari 38/);assert.equal(dashboard.module,'Dashboard');
  const team=A.build(A.source('Supervisor','team'),{rows:[{status:'High',hasSignal:false}],total:30,page:2});assert.match(team.basis,/Halaman 2 · 1 dari 30/);assert.match(team.insights[0].explanation,/1 NC/);
  const daily=A.build(A.source('Admin','market','',{tab:'daily'}),{summary:{total:8,submitted:5,reviewed:2,draft:1,correction:0,asof:'2026-10-12',coverage:{totalTL:6,reportedTL:5}},rows:[]});assert.match(daily.insights[0].explanation,/5 laporan Dikirim dan 2 Ditinjau/);assert.ok(daily.insights.some(i=>i.explanation.includes('bukan data absensi')));
});
test('GPT facts are an allowlist without identities, photographs, notes or small-group values',()=>{
  const d={total:38,High:3,Low:20,Moderate:15,pending:1,signalCoverage:37,actions:[{nama:'PRIVATE_NAME',no_hp:'PRIVATE_PHONE',catatan:'PRIVATE_NOTES',photo:'PRIVATE_PHOTO'}]};
  const facts=A.facts(A.build(A.source('Admin','dashboard'),d));const text=JSON.stringify(facts);assert.ok(!text.includes('PRIVATE_'));assert.equal(facts.metrics.find(m=>m.label==='Immediate Intervention').value,null);assert.equal(facts.metrics.find(m=>m.label==='NC aktif').value,38);
  const own=A.facts(A.build(A.source('NC','self-home'),{profile:{nama:'PRIVATE_NAME'},checklist:[{item:'PRIVATE_ITEM',selesai:true}],openTasks:1} ,'NC'));assert.ok(own.metrics.every(m=>m.suppressed));assert.ok(!JSON.stringify(own).includes('PRIVATE_'));
  const validated=A.validate({summary:'Ringkasan.',insights:[{title:'Saran',explanation:'Fakta.',recommendation:'Tinjau.',priority:'normal',evidence_ids:['M1','M2','nc_PRIVATE']}]},facts);assert.deepEqual(validated.insights[0].evidence_ids,['M1']);
});
test('status requires authentication, does not expose key and default/demo needs no GPT call',()=>{
  const e=environment(),s=e.login();assert.equal(e.req('assistant.status').error.code,'AUTH');assert.equal(e.req('assistant.status',{},s.token).data.enabled,false);assert.equal(generate(e,s,'dashboard').error.code,'AI_NOT_CONFIGURED');assert.equal(e.requests.length,0);assert.ok(!JSON.stringify(e.req('assistant.status',{},s.token)).includes('API_KEY'));
});
test('GPT reads server-scoped module data, uses Responses strict schema and leaves business sheets unchanged',()=>{
  const e=enabled(),s=e.login('supervisor'),before=structuredClone(e.sheets);let seen;
  stubGPT(e,(payload,facts)=>{seen=facts;assert.equal(payload.store,false);assert.equal(payload.text.format.strict,true);const lock=e.context.LockService.getScriptLock();assert.equal(lock.tryLock(1),true);lock.releaseLock();});
  const expected=e.req('dashboard',{},s.token).data.total,r=generate(e,s,'dashboard');assert.equal(r.ok,true,JSON.stringify(r.error));assert.equal(seen.metrics.find(m=>m.label==='NC aktif').value,expected>=5?expected:null);assert.equal(e.requests[0].url,'https://api.openai.com/v1/responses');assert.deepEqual(e.sheets,before);assert.equal(r.data.generated,true);assert.equal(generate(e,s,'users').error.code,'FORBIDDEN');
  const replay=generate(e,s,'dashboard');assert.equal(replay.data.cached,true);assert.equal(e.requests.length,1);assert.equal(generate(e,s,'dashboard',{page:2}).error.code,'AI_RATE_LIMIT');
});
test('NC can obtain own module insights but cannot ask for another profile or market; Client never reads drafts',()=>{
  const e=enabled(),admin=e.login();const ncId=e.sheets.NC[1][0];assert.equal(e.req('user.save',{username:'assistant-nc',nama:'Own NC',role:'NC',nc_id:ncId,password:'TestPassword123',aktif:true},admin.token,true).ok,true);
  const s=e.login('assistant-nc');stubGPT(e);assert.equal(generate(e,s,'self-home',{nc_id:'OTHER'}).ok,true);assert.equal(generate(e,s,'nc',{},'OTHER').error.code,'FORBIDDEN');assert.equal(generate(e,s,'market').error.code,'FORBIDDEN');assert.ok(e.requests[0].facts.metrics.every(m=>m.suppressed));
  const viewer=e.login('viewer'),r=generate(e,viewer,'market',{tab:'daily'});assert.equal(r.ok,true,JSON.stringify(r.error));const metric=e.requests.at(-1).facts.metrics.find(m=>m.label==='Laporan Draft');assert.equal(metric.value,null);assert.equal(generate(e,viewer,'signals').error.code,'FORBIDDEN');
});
test('provider failure keeps normal reads available and daily GPT budget limits uncached calls',()=>{
  const e=enabled(),s=e.login();e.props.set('NCUBATOR_ASSISTANT_DAILY_LIMIT','1');e.context.UrlFetchApp.fetch=()=>({getResponseCode:()=>503});assert.equal(generate(e,s,'dashboard').error.code,'AI_PROVIDER');assert.equal(e.req('dashboard',{},s.token).ok,true);
  for(const key of e.cache.keys())if(key.startsWith('assistant:recent:'))e.cache.delete(key);
  assert.equal(generate(e,s,'market').error.code,'AI_BUDGET');assert.equal(e.props.get('NCUBATOR_ASSISTANT_USAGE_COUNT'),'1');assert.ok(![...e.cache.keys()].some(k=>k.startsWith('assistant:pending:')));
});
test('role revocation during GPT processing prevents delivery and persistence of stale insights',()=>{
  const e=enabled(),s=e.login('supervisor');stubGPT(e,()=>{const role=e.schemas.Users.indexOf('role');e.sheets.Users.find(r=>r[0]===s.user.user_id)[role]='Viewer';});const r=generate(e,s,'dashboard');assert.equal(r.error.code,'AUTH');assert.ok(![...e.cache.keys()].some(k=>k.startsWith('assistant:result:')));
});
test('assistant shared implementation matches Apps Script and original PNG remains exact',()=>{
  assert.equal(readFileSync(new URL('../shared/assistant-core.js',import.meta.url),'utf8'),readFileSync(new URL('../apps-script/AssistantCore.gs',import.meta.url),'utf8'));
  const view=readFileSync(new URL('../js/views.js',import.meta.url),'utf8');assert.ok(!view.includes('class="ncubator-mark"'));assert.match(view,/class="araia-brand-logo" src="\.\/assets\/araia-new.png"/);
});
