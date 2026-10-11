function store_() {
  const props=PropertiesService.getScriptProperties(), spreadsheetId=props.getProperty('SPREADSHEET_ID');
  if(!spreadsheetId)RetentionCore.fail('SPREADSHEET_ID belum diatur. Jalankan setupSheets dahulu.','SETUP_REQUIRED');
  const spreadsheet=SpreadsheetApp.openById(spreadsheetId),memo={},original={},changed=new Set();
  function read(table){
    if(memo[table])return memo[table];
    const sheet=spreadsheet.getSheetByName(table);if(!sheet)RetentionCore.fail('Sheet '+table+' belum tersedia. Jalankan setupSheets.','SETUP_REQUIRED');
    const values=sheet.getDataRange().getValues(),headers=values[0],rows=values.slice(1).filter(row=>row.some(v=>v!==''));
    memo[table]=rows.map(row=>Object.fromEntries(headers.map((h,i)=>[h,row[i] instanceof Date?Utilities.formatDate(row[i],'Asia/Jakarta',String(h).includes('tanggal_input')||['dibuat','diperbarui','waktu','last_login','closed_at'].includes(h)?"yyyy-MM-dd'T'HH:mm:ssXXX":'yyyy-MM-dd'):row[i]])));
    original[table]=memo[table].map(r=>JSON.stringify(r));return memo[table];
  }
  function keyFor(table,r){const key=RetentionCore.KEYS[table];return typeof key==='function'?key(r):r[key];}
  function safeCell(value){if(typeof value==='string'&&/^[=+@]/.test(value))return "'"+value;return value??'';}
  return {
    read,
    append:(table,rows)=>{read(table).push(...rows);changed.add(table);},
    upsert:(table,row)=>{const rows=read(table),key=keyFor(table,row),i=rows.findIndex(r=>keyFor(table,r)===key);if(i<0)rows.push(row);else rows[i]=row;changed.add(table);},
    commit:()=>{
      // Each changed group uses a batch range; rows are buffered until validation succeeds.
      changed.forEach(table=>{const sheet=spreadsheet.getSheetByName(table),headers=RetentionCore.SCHEMA[table],rows=memo[table],before=original[table];let indices=[];rows.forEach((row,i)=>{if(JSON.stringify(row)!==before[i])indices.push(i);});
        for(let x=0;x<indices.length;){let first=indices[x],last=first;x++;while(x<indices.length&&indices[x]===last+1){last=indices[x];x++;}const values=rows.slice(first,last+1).map(r=>headers.map(h=>safeCell(r[h])));if(last+2>sheet.getMaxRows())sheet.insertRowsAfter(sheet.getMaxRows(),last+2-sheet.getMaxRows());sheet.getRange(first+2,1,values.length,headers.length).setValues(values);}
      });SpreadsheetApp.flush();return Array.from(changed);
    }
  };
}

const CACHE_DOMAINS_={
  bootstrap:['nc','signals','requests','plans','onboarding','config','users','attrition'],dashboard:['nc','signals','requests','plans','onboarding','config','attrition'],
  'nc.list':['nc','signals','requests','onboarding','config','users'],'onboarding.list':['nc','onboarding','signals','config','users','requests'],
  'nc.detail':['nc','signals','requests','plans','onboarding','conversations','config','attrition'],
  'requests.list':['nc','requests'],calendar:['nc','requests','config'],'plans.list':['nc','plans','signals','requests','config'],
  'conversations.list':['nc','conversations'],reminders:['nc','plans','requests','onboarding','signals','config','conversations','users'],
  attrition:['nc','attrition'],leaderboard:['nc','attrition','plans','conversations','signals','users'],report:['nc','signals','requests','plans','onboarding','config','attrition'],audit:['audit'],'users.list':['users'],balance:['requests','config']
};
const TABLE_DOMAIN_={NC:'nc',Signals:'signals',Risk_Snapshot:'signals',Risk_Events:'signals',Requests:'requests',Leave_Balance:'requests',Training:'onboarding',Onboarding_Log:'onboarding',Onboarding_Checklist:'onboarding',Onboarding_CheckIns:'onboarding',ActionPlans:'plans',ActionItems:'plans',CheckIns:'plans',Conversations:'conversations',Attrition_Log:'attrition',Config:'config',Users:'users',Audit_Log:'audit',Request_Receipts:'receipts'};
function cacheKey_(action,params,user){const props=PropertiesService.getScriptProperties(),epochs=(CACHE_DOMAINS_[action]||[]).map(d=>d+':'+(props.getProperty('EPOCH_'+d)||'0')).join('|');return'data:'+digest_(JSON.stringify([action,params,user.user_id,user.role,epochs]));}
function cacheRead_(key){try{const cache=CacheService.getScriptCache(),manifest=cache.get(key);if(!manifest)return null;const m=JSON.parse(manifest),keys=Array.from({length:m.n},(_,i)=>key+':'+m.id+':'+i),parts=cache.getAll(keys);if(keys.some(k=>parts[k]===undefined||parts[k]===null))return null;const base64=keys.map(k=>parts[k]).join(''),blob=Utilities.newBlob(Utilities.base64Decode(base64),'application/gzip');return JSON.parse(Utilities.ungzip(blob).getDataAsString());}catch(e){return null;}}
function cacheWrite_(key,value,ttl){try{const cache=CacheService.getScriptCache(),text=Utilities.base64Encode(Utilities.gzip(Utilities.newBlob(JSON.stringify(value),'application/json')).getBytes()),id=Utilities.getUuid().slice(0,8),n=Math.ceil(text.length/85000);if(n>30)return;const chunks={};for(let i=0;i<n;i++)chunks[key+':'+id+':'+i]=text.slice(i*85000,(i+1)*85000);cache.putAll(chunks,ttl||300);cache.put(key,JSON.stringify({n,id}),ttl||300);}catch(e){/* Cache eviction must not fail a request. */}}
function invalidate_(tables){const props=PropertiesService.getScriptProperties(),epoch=Utilities.getUuid(),values={};tables.forEach(t=>values['EPOCH_'+TABLE_DOMAIN_[t]]=epoch);props.setProperties(values,false);}
