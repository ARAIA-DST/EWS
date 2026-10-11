import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {createHash,randomUUID} from 'node:crypto';
import {gzipSync,gunzipSync} from 'node:zlib';
import '../shared/core.js';
import '../shared/seed.js';
import '../shared/talent-core.js';
export function environment(){
  const C=globalThis.RetentionCore,T=globalThis.TalentCore,db=globalThis.RetentionSeed.create(),schemas={...C.SCHEMA,...T.SCHEMA},sheets={},reads={},rangeReads={},propertyReads={snapshot:0,single:0},writes={},files=new Map(),requests=[],folders=new Map();
  for(const [table,headers] of Object.entries(schemas))sheets[table]=[headers.slice(),...(db[table]||[]).map(r=>headers.map(h=>r[h]??''))];
  const props=new Map([['SPREADSHEET_ID','test-sheet'],['AUTH_PEPPER','test-pepper'],['TALENT_PHOTO_FOLDER_ID','photos']]),cache=new Map(),lockState={active:false};
  const blob=(v,mime='application/octet-stream',name='')=>({getBytes:()=>Buffer.isBuffer(v)?v:Buffer.from(v),getDataAsString:()=>Buffer.isBuffer(v)?v.toString():String(v),getContentType:()=>mime,getName:()=>name});
  const makeFile=b=>{const id=randomUUID(),file={getId:()=>id,getBlob:()=>b};files.set(id,file);return file;};
  const sheet=table=>({getLastRow:()=>sheets[table].length,getDataRange:()=>({getValues:()=>{reads[table]=(reads[table]||0)+1;return structuredClone(sheets[table]);}}),getMaxRows:()=>10000,getMaxColumns:()=>30,insertRowsAfter:()=>{},insertColumnsAfter:()=>{},setFrozenRows:()=>{},getRange:(row,col,count,width)=>{const range={createTextFinder:term=>({matchEntireCell(){return this;},findAll:()=>sheets[table].map((r,i)=>({r,i})).filter(x=>x.i>=row-1&&x.i<row-1+count&&String(x.r[col-1]).toLowerCase()===term.toLowerCase()).map(x=>({getRow:()=>x.i+1}))}),getValues:()=>{rangeReads[table]=(rangeReads[table]||0)+1;return Array.from({length:count},(_,i)=>Array.from({length:width},(_,j)=>sheets[table]?.[row-1+i]?.[col-1+j]??''));},setValues:values=>{writes[table]=(writes[table]||0)+1;values.forEach((r,i)=>{sheets[table][row-1+i]??=[];r.forEach((v,j)=>sheets[table][row-1+i][col-1+j]=v);});return range;},setBackground:()=>range,setFontColor:()=>range,setFontWeight:()=>range,setNumberFormat:()=>range};return range;}});
  const book={getId:()=> 'test-sheet',getSheetByName:table=>sheets[table]?sheet(table):null,insertSheet:table=>{sheets[table]=[[]];return sheet(table);}};
  const context=vm.createContext({console,Date,Set,Map,Math,JSON,Intl,Object,Number,String,Array,Error,RegExp,globalThis:null,
    PropertiesService:{getScriptProperties:()=>({getProperties:()=>{propertyReads.snapshot++;return Object.fromEntries(props);},getProperty:k=>{propertyReads.single++;return props.get(k)||null;},setProperty:(k,v)=>props.set(k,v),setProperties:o=>Object.entries(o).forEach(([k,v])=>props.set(k,v)),deleteProperty:k=>props.delete(k)})},
    CacheService:{getScriptCache:()=>({get:k=>cache.get(k)??null,getAll:keys=>Object.fromEntries(keys.filter(k=>cache.has(k)).map(k=>[k,cache.get(k)])),put:(k,v)=>cache.set(k,v),putAll:o=>Object.entries(o).forEach(([k,v])=>cache.set(k,v)),remove:k=>cache.delete(k)})},
    Utilities:{DigestAlgorithm:{SHA_256:'sha256'},Charset:{UTF_8:'utf8'},computeDigest:(algo,value)=>Array.from(createHash('sha256').update(value).digest()),getUuid:randomUUID,newBlob:blob,gzip:b=>blob(gzipSync(b.getBytes())),ungzip:b=>blob(gunzipSync(b.getBytes())),base64Encode:b=>Buffer.from(b).toString('base64'),base64Decode:s=>Buffer.from(s,'base64'),formatDate:d=>d.toISOString().slice(0,10)},
    SpreadsheetApp:{openById:()=>book,flush:()=>{}},LockService:{getScriptLock:()=>({tryLock:()=>{lockState.active=true;return true;},waitLock:()=>{lockState.active=true;},releaseLock:()=>{lockState.active=false;}})},
    ContentService:{MimeType:{JSON:'json'},createTextOutput:content=>({content,setMimeType(){return this;}})},
    DriveApp:{createFolder:name=>{const id=randomUUID();folders.set(id,name);return{getId:()=>id};},getFolderById:id=>({createFile:makeFile}),getFileById:id=>{if(!files.has(id))throw new Error('file missing');return files.get(id);}},
    UrlFetchApp:{fetch:(url,options)=>{requests.push({url,options,sharedWriteLockHeld:lockState.active});const facts=JSON.parse(JSON.parse(options.payload).messages[1].content).facts;return{getResponseCode:()=>200,getContentText:()=>JSON.stringify({choices:[{message:{content:JSON.stringify({summary:'Ringkasan dari data teruji.',insights:[{title:'Ketersediaan talent',explanation:'Ada '+facts.availableSPG+' SPG tersedia.',recommendation:'Periksa profil sebelum seleksi.',evidence_ids:['T1']}]})}}]})};}}
  });context.globalThis=context;
  for(const name of ['Core.gs','Storage.gs','Code.gs','TalentCore.gs','TalentStorage.gs','TalentApi.gs','TalentAdmin.gs','NCubatorAdmin.gs'])vm.runInContext(readFileSync(new URL('../apps-script/'+name,import.meta.url),'utf8'),context,{filename:name});
  const headers=C.SCHEMA.Users;sheets.Users.forEach((r,i)=>{if(i){r[headers.indexOf('salt')]='test-salt';r[headers.indexOf('pin_hash')]=context.passwordHash_('TestPassword123','test-salt');}});
  const req=(action,params={},token='',post=false,requestId=randomUUID())=>{const payload={action,params,token,requestId},r=post?context.doPost({postData:{contents:JSON.stringify(payload)}}):context.doGet({parameter:{action,params:JSON.stringify(params),token}});return JSON.parse(r.content);};
  const login=(username='admin')=>req('login',{username,password:'TestPassword123'},'',true).data;
  return{context,req,login,sheets,reads,rangeReads,propertyReads,writes,props,cache,files,requests,schemas,book};
}
export function profile(i=1,overrides={}){return{external_id:'ARAIA-'+String(i).padStart(4,'0'),nama:'Profil Uji '+i,domisili:i%2?'Jakarta':'Bandung',provinsi:i%2?'DKI Jakarta':'Jawa Barat',no_hp:'628900'+String(i).padStart(6,'0'),bidang:['SPG / SPB','Product Consultant / NC'],industri:['fmcg','retail'],experience_years:i%7,experience_summary:'Pengalaman uji di lapangan.',status:'Tersedia',verification:'Terverifikasi',owner_id:'SUP01',...overrides};}
