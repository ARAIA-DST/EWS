/* Add-on sheet adapter. Legacy tables continue to use the unchanged V1 adapter. */
function talentStore_(){
  const base=store_(),props=PropertiesService.getScriptProperties(),book=SpreadsheetApp.openById(props.getProperty('SPREADSHEET_ID')),memo={},before={},positions={},changed=new Set();
  function isNew(t){return Object.prototype.hasOwnProperty.call(TalentCore.SCHEMA,t);}
  function read(t){
    if(!isNew(t))return base.read(t);if(memo[t])return memo[t];
    const sheet=book.getSheetByName(t);if(!sheet)TalentCore.fail('Modul talent belum dipasang. Jalankan setupTalentAddon di Apps Script.','SETUP_REQUIRED');
    const values=sheet.getDataRange().getValues(),headers=TalentCore.SCHEMA[t];
    if(headers.some((h,i)=>values[0]?.[i]!==h))TalentCore.fail('Header sheet '+t+' berbeda. Periksa panduan add-on.','SETUP_REQUIRED');
    memo[t]=values.slice(1).filter(row=>row.some(v=>v!=='')).map(row=>Object.fromEntries(headers.map((h,i)=>[h,row[i] instanceof Date?Utilities.formatDate(row[i],'Asia/Jakarta',(['created_at','updated_at','submitted_at','reviewed_at'].includes(h)||(t==='SPG_NC_Links'&&h==='tanggal'))?"yyyy-MM-dd'T'HH:mm:ssXXX":'yyyy-MM-dd'):row[i]])));
    before[t]=memo[t].map(r=>JSON.stringify(r));positions[t]=new Map(memo[t].map((r,i)=>[r[TalentCore.KEYS[t]],i]));return memo[t];
  }
  function upsert(t,row){if(!isNew(t))return base.upsert(t,row);const rows=read(t),key=row[TalentCore.KEYS[t]],pos=positions[t].get(key);if(pos===undefined){positions[t].set(key,rows.length);rows.push(row);}else rows[pos]=row;changed.add(t);}
  function append(t,rows){if(!isNew(t))return base.append(t,rows);rows.forEach(r=>upsert(t,r));}
  function safe(v){return typeof v==='string'&&/^[=+@\-\t\r]/.test(v)?"'"+v:(v??'');}
  function commit(){
    // All mutations have been validated in memory before any range is written.
    changed.forEach(t=>{const sheet=book.getSheetByName(t),headers=TalentCore.SCHEMA[t],rows=memo[t],indices=[];rows.forEach((r,i)=>{if(JSON.stringify(r)!==before[t][i])indices.push(i);});for(let x=0;x<indices.length;){const first=indices[x];let last=first;x++;while(x<indices.length&&indices[x]===last+1){last=indices[x];x++;}if(last+2>sheet.getMaxRows())sheet.insertRowsAfter(sheet.getMaxRows(),last+2-sheet.getMaxRows());sheet.getRange(first+2,1,last-first+1,headers.length).setValues(rows.slice(first,last+1).map(r=>headers.map(h=>safe(r[h]))));}});
    return [...base.commit(),...changed];
  }
  return{read,upsert,append,commit};
}
function talentInvalidate_(tables){const legacy=tables.filter(t=>Object.prototype.hasOwnProperty.call(RetentionCore.SCHEMA,t));if(legacy.length)invalidate_(legacy);PropertiesService.getScriptProperties().setProperty('TALENT_EPOCH',Utilities.getUuid());}
function talentCacheKey_(action,params,user){const props=PropertiesService.getScriptProperties(),domains=['nc','signals','requests','plans','onboarding','config','attrition','users'],epochs=domains.map(d=>props.getProperty('EPOCH_'+d)||'0');return'talent:data:'+digest_(JSON.stringify([action,params,user.user_id,user.role,props.getProperty('TALENT_EPOCH')||'0',epochs]));}
