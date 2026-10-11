const API_VERSION_='1.0.0';
const WRITE_ACTIONS_=['nc.save','signals.save','signals.import','onboarding.save','checklist.set','onboarding.checkin','request.submit','request.decide','conversation.save','plan.create','item.set','plan.checkin','plan.close','attrition.create','config.save','user.save'];
function doGet(e){return handle_(e,false);}
function doPost(e){return handle_(e,true);}
function json_(ok,data,error,meta){return ContentService.createTextOutput(JSON.stringify({ok,data:ok?data:null,error:ok?null:error,meta:{version:API_VERSION_,time:new Date().toISOString(),...meta}})).setMimeType(ContentService.MimeType.JSON);}
function handle_(e,isPost){
  const started=Date.now();let lock=null;
  try{
    const payload=isPost?JSON.parse(e.postData?.contents||'{}'):{...(e.parameter||{})};if(!payload||typeof payload!=='object')RetentionCore.fail('Request tidak valid.');
    const action=String(payload.action||'health'),p=typeof payload.params==='string'?JSON.parse(payload.params):payload.params||{};
    if(typeof talentHandles_==='function'&&talentHandles_(action))return talentHandle_(payload,isPost);
    if(action==='health')return json_(true,{service:'NC Retention API',configured:!!PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID')},null,{});
    if(action==='login'&&!isPost)RetentionCore.fail('Login membutuhkan POST.','METHOD');
    const writing=action==='login'||action==='logout'||action==='batch'||WRITE_ACTIONS_.includes(action);
    if(writing&&!isPost)RetentionCore.fail('Perubahan data membutuhkan POST.','METHOD');
    if(writing){lock=LockService.getScriptLock();if(!lock.tryLock(5000))RetentionCore.fail('Sistem sedang menyimpan data lain. Coba lagi beberapa detik.','BUSY');}
    const store=store_();
    if(action==='login')return json_(true,login_(store,p),null,{duration:Date.now()-started});
    const session=auth_(store,payload.token),user=session.user;
    if(action==='logout'){CacheService.getScriptCache().remove('session:'+digest_(payload.token));return json_(true,{loggedOut:true},null,{});}
    if(writing){
      const requestId=String(payload.requestId||'');if(!/^[a-zA-Z0-9_-]{8,100}$/.test(requestId))RetentionCore.fail('requestId wajib untuk mencegah duplikasi.');
      authorizeWrite_(store,user,action,p);
      const receiptKey='receipt:'+digest_(user.user_id+':'+requestId),cachedReceipt=cacheRead_(receiptKey),savedReceipt=cachedReceipt?null:store.read('Request_Receipts').find(r=>r.user_id===user.user_id&&r.request_id===requestId),previous=cachedReceipt||(savedReceipt?{fingerprint:savedReceipt.fingerprint,result:JSON.parse(Utilities.ungzip(Utilities.newBlob(Utilities.base64Decode(savedReceipt.result_gzip),'application/gzip')).getDataAsString())}:null);if(previous){if(previous.fingerprint!==digest_(JSON.stringify([action,p])))RetentionCore.fail('requestId sudah digunakan untuk perubahan lain.');return json_(true,previous.result,null,{replayed:true});}
      let result;
      if(action==='batch'){
        if(!Array.isArray(p.actions)||p.actions.length<1||p.actions.length>20)RetentionCore.fail('Batch harus berisi 1–20 aksi.');
        result=p.actions.map(a=>{if(!WRITE_ACTIONS_.includes(a.action))RetentionCore.fail('Batch hanya menerima aksi tulis.');return a.action==='user.save'?saveUser_(store,user,a.params||{}):RetentionCore.createEngine(store,user,{uuid:()=>Utilities.getUuid()}).mutate(a.action,a.params||{});});
      }else result=action==='user.save'?saveUser_(store,user,p):RetentionCore.createEngine(store,user,{uuid:()=>Utilities.getUuid()}).mutate(action,p);
      const compressed=Utilities.base64Encode(Utilities.gzip(Utilities.newBlob(JSON.stringify(result),'application/json')).getBytes());if(compressed.length>45000)RetentionCore.fail('Hasil batch terlalu besar; kirim batch lebih kecil.');store.append('Request_Receipts',[{request_id:requestId,user_id:user.user_id,fingerprint:digest_(JSON.stringify([action,p])),dibuat:new Date().toISOString(),result_gzip:compressed}]);const changed=store.commit();invalidate_(changed);cacheWrite_(receiptKey,{fingerprint:digest_(JSON.stringify([action,p])),result},21600);
      return json_(true,result,null,{duration:Date.now()-started});
    }
    const key=cacheKey_(action,p,user),cached=cacheRead_(key);if(cached!==null)return json_(true,cached,null,{cached:true,duration:Date.now()-started});
    const result=RetentionCore.createEngine(store,user,{uuid:()=>Utilities.getUuid()}).read(action,p);cacheWrite_(key,result,300);
    return json_(true,result,null,{cached:false,duration:Date.now()-started});
  }catch(err){return json_(false,null,{code:err.code||'SERVER',message:err.code?err.message:'Request gagal. Periksa konfigurasi backend atau coba kembali.'},{duration:Date.now()-started});}
  finally{if(lock)lock.releaseLock();}
}
function digest_(value){return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,String(value),Utilities.Charset.UTF_8).map(b=>(b+256)%256).map(b=>('0'+b.toString(16)).slice(-2)).join('');}
function authorizeWrite_(store,user,action,p){
  if(!['Admin','HR','Supervisor'].includes(user.role))RetentionCore.fail('Akun ini hanya dapat melihat data.','FORBIDDEN');
  if(action==='batch'){if(!Array.isArray(p.actions)||p.actions.length>20)RetentionCore.fail('Batch tidak valid.');p.actions.forEach(a=>authorizeWrite_(store,user,a.action,a.params||{}));return;}
  if(!WRITE_ACTIONS_.includes(action))RetentionCore.fail('Aksi tulis tidak tersedia.','NOT_FOUND');
  if(['config.save','user.save'].includes(action)&&user.role!=='Admin')RetentionCore.fail('Aksi ini membutuhkan Admin.','FORBIDDEN');
  if(['nc.save','attrition.create'].includes(action)&&!['Admin','HR'].includes(user.role))RetentionCore.fail('Aksi ini membutuhkan HR atau Admin.','FORBIDDEN');
  if(user.role!=='Supervisor')return;
  let ids=p.nc_id?[p.nc_id]:[];if(action==='signals.import')ids=(p.rows||[]).map(r=>r.nc_id);
  if(p.req_id)ids.push(store.read('Requests').find(r=>r.req_id===p.req_id)?.nc_id);
  if(p.plan_id)ids.push(store.read('ActionPlans').find(r=>r.plan_id===p.plan_id)?.nc_id);
  if(p.item_id){const planId=store.read('ActionItems').find(r=>r.item_id===p.item_id)?.plan_id;ids.push(store.read('ActionPlans').find(r=>r.plan_id===planId)?.nc_id);}
  ids.forEach(id=>{const nc=store.read('NC').find(n=>n.nc_id===id);if(!nc||nc.supervisor_id!==user.user_id)RetentionCore.fail('NC di luar akses Anda.','FORBIDDEN');});
}
function passwordHash_(password,salt){return digest_(salt+':'+password+':'+PropertiesService.getScriptProperties().getProperty('AUTH_PEPPER'));}
function constantEqual_(a,b){if(typeof a!=='string'||typeof b!=='string'||a.length!==b.length)return false;let result=0;for(let i=0;i<a.length;i++)result|=a.charCodeAt(i)^b.charCodeAt(i);return result===0;}
function userPublic_(u){return{user_id:u.user_id,username:u.username,nama:u.nama,role:u.role,area:u.area};}
function login_(store,p){
  const username=String(p.username||'').trim().toLowerCase(),password=String(p.password||'');if(!username||username.length>80||!password||password.length>200)RetentionCore.fail('Masukkan username dan password.','AUTH');
  const cache=CacheService.getScriptCache(),throttle='login:'+digest_(username),tries=Number(cache.get(throttle)||0);if(tries>=8)RetentionCore.fail('Terlalu banyak percobaan. Coba lagi setelah 15 menit.','RATE_LIMIT');
  const u=store.read('Users').find(u=>u.username===username&&RetentionCore.TRUE(u.aktif));
  if(!u||!constantEqual_(u.pin_hash,passwordHash_(password,u.salt))){cache.put(throttle,String(tries+1),900);RetentionCore.fail('Username atau password salah.','AUTH');}
  cache.remove(throttle);const token=Utilities.getUuid()+Utilities.getUuid(),expires=Date.now()+21600000,session={user_id:u.user_id,hash:u.pin_hash,role:u.role,expires};cache.put('session:'+digest_(token),JSON.stringify(session),21600);
  store.upsert('Users',{...u,last_login:new Date().toISOString()});store.append('Audit_Log',[{waktu:new Date().toISOString(),user:u.user_id,aksi:'login',entitas:'Users',id:u.user_id,ringkasan:'Login berhasil'}]);invalidate_(store.commit());return{token,expires,user:userPublic_(u)};
}
function auth_(store,token){const raw=typeof token==='string'&&token.length<200?CacheService.getScriptCache().get('session:'+digest_(token)):null;if(!raw)RetentionCore.fail('Sesi berakhir. Silakan masuk kembali.','AUTH');const s=JSON.parse(raw);if(s.expires<Date.now())RetentionCore.fail('Sesi berakhir. Silakan masuk kembali.','AUTH');const u=store.read('Users').find(u=>u.user_id===s.user_id&&RetentionCore.TRUE(u.aktif));if(!u||!constantEqual_(s.hash,u.pin_hash)||u.role!==s.role)RetentionCore.fail('Akun berubah atau nonaktif. Silakan masuk kembali.','AUTH');return{user:u,expires:s.expires};}
function saveUser_(store,user,p){if(user.role!=='Admin')RetentionCore.fail('Hanya Admin dapat mengelola user.','FORBIDDEN');const role=String(p.role);if(!['Admin','HR','Supervisor','Viewer'].includes(role))RetentionCore.fail('Role tidak valid.');const username=String(p.username||'').trim().toLowerCase();if(!/^[a-z0-9._-]{3,60}$/.test(username))RetentionCore.fail('Username harus 3–60 huruf/angka/titik/garis bawah.');const users=store.read('Users'),existing=p.user_id?users.find(u=>u.user_id===p.user_id):null;if(p.user_id&&!existing)RetentionCore.fail('User tidak ditemukan.');if(users.some(u=>u.username===username&&u.user_id!==p.user_id))RetentionCore.fail('Username sudah dipakai.');const active=p.aktif!==false;if(existing?.user_id===user.user_id&&(!active||role!=='Admin'))RetentionCore.fail('Admin yang sedang masuk tidak dapat menonaktifkan atau menurunkan role sendiri.');let salt=existing?.salt,hash=existing?.pin_hash;if(p.password||!existing){if(String(p.password||'').length<8||String(p.password).length>200)RetentionCore.fail('Password minimal 8 karakter.');salt=Utilities.getUuid();hash=passwordHash_(p.password,salt);}const row={user_id:existing?.user_id||'USR_'+Utilities.getUuid(),username,nama:String(p.nama||'').trim().slice(0,100),role,area:String(p.area||'').slice(0,100),supervisor_id:'',salt,pin_hash:hash,aktif:active,last_login:existing?.last_login||''};if(!row.nama)RetentionCore.fail('Nama user wajib.');store.upsert('Users',row);store.append('Audit_Log',[{waktu:new Date().toISOString(),user:user.user_id,aksi:'user.save',entitas:'Users',id:row.user_id,ringkasan:'Data user diperbarui'}]);return{...userPublic_(row),aktif:active};}
