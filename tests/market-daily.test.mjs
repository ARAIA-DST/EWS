import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {environment} from './talent-env.mjs';
import {dailyCSV,dailyForm,dailySubmitButtons} from '../js/market-daily-ui.js';
const C=globalThis.RetentionCore,T=globalThis.TalentCore;
const clearDataCache=x=>{for(const key of x.cache.keys())if(!key.startsWith('session:'))x.cache.delete(key);};
export function daily(overrides={}){return{tanggal:C.nowDay(),area:'Jakarta',outlets:'Outlet Uji A; Outlet Uji B',outlets_visited:2,industry_id:'fmcg',brands:'Brand Uji',summary:'Dua kunjungan sesuai jadwal.',market_condition:'Traffic sore lebih ramai.',competitor_activity:'Brand Uji mengadakan sampling.',promo_findings:'Promo paket pembelian tercatat di rak.',obstacles:'Materi promosi perlu diperbarui.',next_action:'Koordinasi materi dan kunjungan berikutnya.',source_type:'Observasi lapangan',source_ref:'Kunjungan outlet Uji A dan B.',evidence_url:'https://example.test/bukti',send:false,...overrides};}
const save=(x,token,p)=>{const r=x.req('market.daily.save',p,token,true);assert.equal(r.ok,true,JSON.stringify(r.error));return r.data;};
test('TL owns dated drafts and can input past activity at any time without changing legacy tables',()=>{
  const x=environment(),tl=x.login('supervisor'),before=JSON.stringify(Object.fromEntries(Object.keys(C.SCHEMA).filter(k=>!['Audit_Log','Request_Receipts'].includes(k)).map(k=>[k,x.sheets[k]])));
  const r=save(x,tl.token,daily({tanggal:C.plus(C.nowDay(),-3),tl_id:'SUP02',tl_nama:'Forged',summary:''}));assert.equal(r.tl_id,'SUP01');assert.equal(r.tl_nama,'Dewi Kartika');assert.equal(r.status,'Draft');assert.equal(r.revision,1);assert.equal(r.submitted_at,'');
  assert.equal(JSON.stringify(Object.fromEntries(Object.keys(C.SCHEMA).filter(k=>!['Audit_Log','Request_Receipts'].includes(k)).map(k=>[k,x.sheets[k]]))),before);
  const minimal=save(x,tl.token,{tanggal:C.nowDay(),area:'Bandung',industry_id:'fmcg',outlets_visited:''});assert.equal(minimal.outlets_visited,0);assert.equal(minimal.status,'Draft');
});
test('submission validates a complete report before writing and refuses future dates, bad sources and duplicate day/area',()=>{
  const x=environment(),tl=x.login('supervisor'),before=JSON.stringify(x.sheets.Market_Daily_Reports);
  for(const p of [daily({send:true,source_ref:''}),daily({tanggal:C.plus(C.nowDay(),1)}),daily({outlets_visited:1.5}),daily({evidence_url:'javascript:alert(1)'}),daily({source_ref:'http://example.test'})]){const r=x.req('market.daily.save',p,tl.token,true);assert.equal(r.ok,false);assert.equal(JSON.stringify(x.sheets.Market_Daily_Reports),before);}
  const report=save(x,tl.token,daily({send:true}));assert.equal(report.status,'Dikirim');assert.ok(report.submitted_at);assert.equal(report.canEdit,false);
  assert.equal(x.req('market.daily.save',daily({area:'JAKARTA'}),tl.token,true).error.code,'CONFLICT');
  assert.equal(x.req('market.daily.save',daily({report_id:report.report_id,revision:report.revision}),tl.token,true).error.code,'CONFLICT');
});
test('draft -> submit -> correction -> resubmit -> review retains review history and checks revisions',()=>{
  const x=environment(),tl=x.login('supervisor'),hr=x.login('hr'),draft=save(x,tl.token,daily());
  const sent=x.req('market.daily.submit',{report_id:draft.report_id,revision:draft.revision},tl.token,true).data;assert.equal(sent.status,'Dikirim');
  assert.equal(x.req('market.daily.review',{report_id:sent.report_id,revision:sent.revision,status:'Perlu perbaikan',review_note:''},hr.token,true).ok,false);
  const correction=x.req('market.daily.review',{report_id:sent.report_id,revision:sent.revision,status:'Perlu perbaikan',review_note:'Tambahkan referensi outlet.'},hr.token,true).data;assert.equal(correction.status,'Perlu perbaikan');
  assert.equal(x.req('market.daily.save',daily({report_id:correction.report_id,revision:1}),tl.token,true).error.code,'CONFLICT');
  const updated=save(x,tl.token,daily({report_id:correction.report_id,revision:correction.revision,source_ref:'Outlet Uji A; dokumen kunjungan 001',send:true}));assert.equal(updated.status,'Dikirim');assert.equal(updated.review_note,'');
  const reviewed=x.req('market.daily.review',{report_id:updated.report_id,revision:updated.revision,status:'Ditinjau',review_note:'Sudah diperiksa.'},hr.token,true).data;assert.equal(reviewed.status,'Ditinjau');assert.equal(reviewed.reviewed_by,'HR01');assert.equal(reviewed.canEdit,false);
  const detail=x.req('market.daily.detail',{report_id:reviewed.report_id},tl.token).data;assert.deepEqual(detail.history.map(h=>h.to_status),['Draft','Dikirim','Perlu perbaikan','Dikirim','Ditinjau']);assert.ok(detail.history.some(h=>h.note==='Tambahkan referensi outlet.'));
});
test('daily reads and writes enforce TL ownership, POST, active roles and Viewer publication scope',()=>{
  const x=environment(),tl=x.login('supervisor'),other=x.login('sup.jabar'),viewer=x.login('viewer'),admin=x.login('admin'),draft=save(x,tl.token,daily()),second=save(x,other.token,daily({area:'Bandung',send:true}));
  assert.equal(x.req('market.daily.list',{day:'all'},tl.token).data.total,1);
  assert.equal(x.req('market.daily.detail',{report_id:draft.report_id},other.token).error.code,'FORBIDDEN');
  assert.equal(x.req('market.daily.save',daily({report_id:draft.report_id,revision:1}),other.token,true).error.code,'FORBIDDEN');
  assert.equal(x.req('market.daily.review',{report_id:second.report_id,revision:second.revision,status:'Ditinjau'},other.token,true).error.code,'FORBIDDEN');
  assert.equal(x.req('market.daily.save',daily(),viewer.token,true).error.code,'FORBIDDEN');
  assert.equal(x.req('market.daily.save',daily(),tl.token).error.code,'METHOD');
  assert.equal(x.req('market.daily.detail',{report_id:draft.report_id},viewer.token).error.code,'FORBIDDEN');
  assert.equal(x.req('market.daily.list',{day:'all'},viewer.token).data.total,1);
  assert.equal(x.req('market.daily.list',{day:'all'},admin.token).data.total,2);
});
test('daily receipts replay safely after cache eviction, including submitted and reviewed records',()=>{
  const x=environment(),tl=x.login('supervisor'),hr=x.login('hr'),rid=randomUUID(),p=daily({send:true});
  const first=x.req('market.daily.save',p,tl.token,true,rid);assert.equal(first.ok,true);clearDataCache(x);const replay=x.req('market.daily.save',p,tl.token,true,rid);assert.equal(replay.meta.replayed,true);assert.equal(replay.data.report_id,first.data.report_id);assert.equal(x.sheets.Market_Daily_Reports.length,2);
  const reviewId=randomUUID(),review={report_id:first.data.report_id,revision:first.data.revision,status:'Ditinjau',review_note:'OK'};assert.equal(x.req('market.daily.review',review,hr.token,true,reviewId).ok,true);clearDataCache(x);assert.equal(x.req('market.daily.review',review,hr.token,true,reviewId).meta.replayed,true);assert.equal(x.sheets.Market_Daily_Log.length,3);
  const users=C.SCHEMA.Users,idx=x.sheets.Users.findIndex(row=>row[users.indexOf('user_id')]==='SUP01');x.sheets.Users[idx][users.indexOf('role')]='Viewer';clearDataCache(x);assert.equal(x.req('market.daily.save',p,tl.token,true,rid).error.code,'AUTH');const changed=x.login('supervisor');assert.equal(x.req('market.daily.save',p,changed.token,true,rid).error.code,'FORBIDDEN');
});
test('daily filters, status counts, TL coverage and analytics respect review status and omit narratives from AI',()=>{
  const x=environment(),admin=x.login('admin'),tl=x.login('supervisor'),other=x.login('sup.jabar');
  const sent=save(x,tl.token,daily({send:true,summary:'SECRET-TL-NARRATIVE',source_ref:'SECRET-SOURCE',outlets_visited:3}));save(x,other.token,daily({area:'Bandung',outlets_visited:5}));save(x,other.token,daily({area:'Semarang',tanggal:C.plus(C.nowDay(),-1),send:true,outlets_visited:4}));
  const today=x.req('market.daily.list',{day:C.nowDay()},admin.token).data;assert.equal(today.total,2);assert.equal(today.summary.submitted,1);assert.equal(today.summary.draft,1);assert.equal(today.summary.outletsVisited,3);assert.equal(today.summary.coverage.totalTL,6);assert.equal(today.summary.coverage.reportedTL,1);
  assert.equal(x.req('market.daily.list',{day:'all',tl_id:'SUP02'},admin.token).data.total,2);assert.equal(x.req('market.daily.list',{day:'all',q:'SECRET-TL',area:'Jakarta'},admin.token).data.rows[0].report_id,sent.report_id);
  const analytics=x.req('talent.analytics',{},admin.token).data,facts=T.aiFacts(analytics),payload=JSON.stringify(facts);assert.equal(analytics.daily.sent,2);assert.equal(facts.dailyReports.outletVisitsReported,7);assert.ok(analytics.insights.some(i=>i.id==='M3'));for(const value of ['Dewi Kartika','Bima Pratama','SECRET-TL-NARRATIVE','SECRET-SOURCE','https://example.test/bukti'])assert.ok(!payload.includes(value));
});
test('upgrading setup creates only the two daily tables and each daily request reads tables once',()=>{
  const x=environment();delete x.sheets.Market_Daily_Reports;delete x.sheets.Market_Daily_Log;const previous=JSON.stringify(x.sheets);x.context.setupTalentAddon();assert.equal(JSON.stringify(Object.fromEntries(Object.entries(x.sheets).filter(([k])=>!k.startsWith('Market_Daily_')))),previous);const once=JSON.stringify(x.sheets);x.context.setupTalentAddon();assert.equal(JSON.stringify(x.sheets),once);
  const tl=x.login('supervisor');save(x,tl.token,daily({send:true}));clearDataCache(x);const before={...x.reads};assert.equal(x.req('market.daily.list',{day:'all'},tl.token).ok,true);for(const key of Object.keys(x.reads))assert.ok(x.reads[key]-(before[key]||0)<=1,key+' was read more than once');
});
test('daily export keeps multiline evidence and escapes spreadsheet formulas; forms separate draft from submission',()=>{
  const csv=dailyCSV([{...daily({summary:'=HYPERLINK("https://example.test")',source_ref:'Outlet "A", baris satu\nbaris dua'}),report_id:'R1'}]);assert.ok(csv.startsWith('\uFEFF'));assert.ok(csv.includes("'=HYPERLINK"));assert.ok(csv.includes('"Outlet ""A"", baris satu\nbaris dua"'));
  const form=dailyForm(daily({summary:'<script>bad</script>'}),{nama:'Uji'});assert.ok(form.includes('&lt;script&gt;'));assert.ok(!form.includes('<script>'));assert.ok(dailySubmitButtons.includes('formnovalidate'));assert.ok(dailySubmitButtons.includes('value="send"'));
});
