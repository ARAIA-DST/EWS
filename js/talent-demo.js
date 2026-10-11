import '../shared/talent-core.js';
const T=globalThis.TalentCore;
export async function talentDemoRequest(action,params,session,currentDB,save){
  const p={...params};const requestId=p._requestId;delete p._requestId;
  const user=currentDB.Users.find(u=>u.user_id===session.user.user_id&&globalThis.RetentionCore.TRUE(u.aktif));if(!user)T.fail('Sesi demo berakhir.','AUTH');
  const draft=structuredClone(currentDB),store=T.memoryStore(draft),engine=T.createEngine(store,user),writing=T.WRITES.includes(action)||['talent.photo.upload','talent.ai.generate'].includes(action);
  if(action==='talent.ai.status')return{enabled:false,demo:true,message:'Mode demo menyediakan analytics dan analisis otomatis. AI generatif tersedia setelah backend dan penyedia AI dikonfigurasi.'};
  if(action==='talent.photo'){const spg=engine.get(p.spg_id);return{dataUrl:draft._talentPhotos?.[spg.spg_id]||'',url:spg.foto_url||''};}
  if(!writing)return engine.read(action,p);
  engine.authorize(action,p);const fingerprint=JSON.stringify([action,p]),key=session.user.user_id+':'+requestId,previous=draft._talentReceipts?.[key];if(previous){if(previous.fingerprint!==fingerprint)T.fail('requestId sudah digunakan untuk perubahan lain.');return previous.result;}
  let result;if(action==='talent.ai.generate')T.fail('AI generatif memerlukan backend dan konfigurasi penyedia AI. Analisis otomatis tersedia di halaman ini.','AI_NOT_CONFIGURED');
  else if(action==='talent.photo.upload'){if(!['image/jpeg','image/png','image/webp'].includes(p.mime)||String(p.base64).length>820000)T.fail('Format atau ukuran foto tidak sesuai.');const spg=engine.get(p.spg_id);draft._talentPhotos??={};draft._talentPhotos[spg.spg_id]='data:'+p.mime+';base64,'+p.base64;const photoVersion=new Date().toISOString();store.upsert('SPG_Database',{...spg,photo_file_id:'demo_'+spg.spg_id,foto_url:'',updated_at:photoVersion});result={spg_id:spg.spg_id,hasPhoto:true,photoVersion};}
  else result=engine.mutate(action,p);
  draft._talentReceipts??={};draft._talentReceipts[key]={fingerprint,result};save(draft);return result;
}
