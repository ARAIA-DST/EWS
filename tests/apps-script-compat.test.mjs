import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync,readdirSync} from 'node:fs';
const root=new URL('../',import.meta.url);
test('Apps Script sources avoid logical assignment operators and shared talent core matches backend',()=>{
  for(const name of readdirSync(new URL('apps-script/',root)).filter(n=>n.endsWith('.gs'))){
    const source=readFileSync(new URL('apps-script/'+name,root),'utf8');
    assert.ok(!/\?\?=|\|\|=|&&=/.test(source),name+' contains a logical assignment operator rejected by the reported Apps Script editor.');
    new vm.Script(source,{filename:name});
  }
  assert.equal(readFileSync(new URL('shared/talent-core.js',root),'utf8'),readFileSync(new URL('apps-script/TalentCore.gs',root),'utf8'));
});
test('memory initialization preserves existing talent data and benchmarks work without Array.at',()=>{
  const context=vm.createContext({console,Intl,Date});
  for(const file of ['apps-script/Core.gs','shared/seed.js','apps-script/TalentCore.gs'])vm.runInContext(readFileSync(new URL(file,root),'utf8'),context,{filename:file});
  vm.runInContext('Array.prototype.at=undefined;',context);
  const db=context.RetentionSeed.create('2026-10-11'),existing=[];
  db.SPG_Database=existing;db.SPG_Experience=null;
  const store=context.TalentCore.memoryStore(db);
  assert.equal(store.read('SPG_Database'),existing);assert.equal(store.read('SPG_Experience').length,0);
  const engine=context.TalentCore.createEngine(store,db.Users[0],{today:'2026-10-11'}),row=engine.mutate('talent.save',{external_id:'TEST-PRESERVE',nama:'Profil uji',domisili:'Jakarta',provinsi:'DKI Jakarta',bidang:['SPG / SPB'],industri:['fmcg'],experience_years:1});
  row.nama='Changed response only';assert.equal(store.read('SPG_Database')[0].nama,'Profil uji');
  const p={title:'Observasi uji',domisili:'Jakarta',industry_id:'fmcg',brand:'Brand uji',topic:'Insentif',observation:'Nominal teramati',source_type:'Observasi lapangan',source_ref:'Dokumen uji',verification:'Terverifikasi',amount_min:100,amount_max:200,amount_period:'Harian'};
  engine.mutate('market.save',{...p,tanggal:'2026-10-04'});engine.mutate('market.save',{...p,tanggal:'2026-10-10'});
  const a=engine.aggregate();assert.equal(a.benchmarks.length,1);assert.equal(a.benchmarks[0].latest,'2026-10-10');assert.equal(a.benchmarks[0].count,2);
});
