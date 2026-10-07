import '../shared/core.js';
import '../shared/seed.js';
import {uuid} from './ui.js';
const C=globalThis.RetentionCore, KEY='araia.nc.demo.v1';
let db;
function load(){if(!db){try{db=JSON.parse(localStorage.getItem(KEY));}catch{}if(!db){db=globalThis.RetentionSeed.create();save();}}return db;}
function save(){localStorage.setItem(KEY,JSON.stringify(db));}
export function resetDemo(){db=globalThis.RetentionSeed.create();save();}
export function demoLogin(username,password){const user=load().Users.find(u=>u.username===username&&C.TRUE(u.aktif));if(!user||password!=='demo12345')throw Object.assign(new Error('Mode demo: pilih akun contoh dan gunakan password demo12345.'),{code:'AUTH'});return{token:'demo_'+uuid(),expires:Date.now()+21600000,user:{user_id:user.user_id,username:user.username,nama:user.nama,role:user.role,area:user.area}};}
export async function demoRequest(action,params,session){await new Promise(r=>setTimeout(r,100));const current=load().Users.find(u=>u.user_id===session.user.user_id&&C.TRUE(u.aktif));if(!current)throw Object.assign(new Error('Akun demo tidak aktif.'),{code:'AUTH'});const draft=structuredClone(db),store=C.memoryStore(draft),engine=C.createEngine(store,current);if(action==='logout')return{loggedOut:true};
  if(action==='user.save'){if(current.role!=='Admin')C.fail('Hanya Admin dapat mengelola user.','FORBIDDEN');const existing=draft.Users.find(u=>u.user_id===params.user_id);if(existing?.user_id===current.user_id&&(params.aktif===false||params.role!=='Admin'))C.fail('Admin yang sedang masuk tidak dapat menonaktifkan atau menurunkan role sendiri.');if(!/^[a-z0-9._-]{3,60}$/.test(params.username||'')||!params.nama||!['Admin','HR','Supervisor','Viewer'].includes(params.role))C.fail('Data user tidak valid.');if(draft.Users.some(u=>u.username===params.username&&u.user_id!==params.user_id))C.fail('Username sudah dipakai.');const row={...existing,...params,user_id:params.user_id||'USR_'+uuid(),aktif:params.aktif!==false};delete row.password;store.upsert('Users',row);store.append('Audit_Log',[{waktu:new Date().toISOString(),user:current.user_id,aksi:action,entitas:'Users',id:row.user_id,ringkasan:'User demo disimpan'}]);db=draft;save();return row;}
  if(action==='batch'){const result=params.actions.map(a=>engine.mutate(a.action,a.params));db=draft;save();return result;}
  if(action.match(/\.(save|import|submit|decide|create|set|checkin|close)$/)){const result=engine.mutate(action,params);db=draft;save();return result;}return engine.read(action,params);
}
