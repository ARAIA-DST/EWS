/* Add-on only: the V1 retention engine, schema, scoring and workflows remain intact. */
var TalentCore = (() => {
  const INDUSTRIES = [
    ['fmcg','Sektor Konsumsi & Ritel','FMCG','Makanan, minuman, sabun, kosmetik'],
    ['retail','Sektor Konsumsi & Ritel','Retail & E-commerce','Toko, supermarket, dan e-commerce'],
    ['electronics','Sektor Konsumsi & Ritel','Consumer Electronics','Smartphone, laptop, elektronik rumah tangga'],
    ['fashion','Sektor Konsumsi & Ritel','Apparel & Fashion','Pakaian, alas kaki, aksesori'],
    ['automotive','Sektor Manufaktur & Transportasi','Otomotif','Kendaraan bermotor dan komponennya'],
    ['machinery','Sektor Manufaktur & Transportasi','Manufaktur Berat','Alat berat, mesin pabrik, peralatan industri'],
    ['logistics','Sektor Manufaktur & Transportasi','Logistik & Transportasi','Pengiriman, gudang, maskapai, kereta api'],
    ['pharma','Sektor Manufaktur & Transportasi','Farmasi & Alat Kesehatan','Obat dan peralatan medis'],
    ['it','Sektor Teknologi & Jasa','IT & Software','Aplikasi, AI, cloud, keamanan siber'],
    ['telecom','Sektor Teknologi & Jasa','Telekomunikasi','Internet, seluler, infrastruktur komunikasi'],
    ['bfsi','Sektor Teknologi & Jasa','Perbankan & Keuangan','Bank, asuransi, investasi, fintech'],
    ['media','Sektor Teknologi & Jasa','Media & Hiburan','Film, musik, broadcasting, gaming, periklanan'],
    ['energy','Sektor Sumber Daya & Energi','Energi, Minyak & Gas','Bahan bakar dan energi terbarukan'],
    ['mining','Sektor Sumber Daya & Energi','Pertambangan','Batubara, emas, nikel, mineral'],
    ['agribusiness','Sektor Sumber Daya & Energi','Pertanian & Perkebunan','Sawit, karet, pangan, peternakan'],
    ['property','Sektor Infrastruktur & Jasa Profesional','Properti & Real Estate','Perumahan, kantor, mal'],
    ['construction','Sektor Infrastruktur & Jasa Profesional','Konstruksi & Teknis','Jalan, jembatan, arsitektur'],
    ['hospitality','Sektor Infrastruktur & Jasa Profesional','Perhotelan & Pariwisata','Hotel, restoran, perjalanan'],
    ['professional','Sektor Infrastruktur & Jasa Profesional','Konsultan & Jasa Profesional','Hukum, bisnis, akuntan, rekrutmen']
  ].map(([id,sector,label,description])=>({id,sector,label,description}));
  const FIELDS=['SPG / SPB','Brand Ambassador','Direct Selling','Merchandiser','Beauty Advisor','Product Consultant / NC','Event & Activation','Team Leader / Supervisor'];
  const STATUSES=['Tersedia','Dipertimbangkan','Tidak tersedia','Menjadi NC','Arsip'];
  const TOPICS=['Kompensasi','Insentif','Target & KPI','Training','Jadwal kerja','Rekrutmen','Aktivasi & promosi','Produk & channel','Lainnya'];
  const VERIFY=['Belum diverifikasi','Terverifikasi'];
  const DAILY_STATUSES=['Draft','Dikirim','Ditinjau','Perlu perbaikan'];
  const SCHEMA={
    SPG_Database:['spg_id','external_id','nama','domisili','provinsi','no_hp','email','foto_url','photo_file_id','bidang','industri','experience_years','experience_summary','status','verification','owner_id','nc_id','catatan','created_at','updated_at','created_by'],
    SPG_Experience:['experience_id','spg_id','company','brand','industry_id','field','position','channel','mulai','selesai','is_current','tasks','achievements','competitor','verification','created_by','created_at','updated_at'],
    Market_Intelligence:['intel_id','title','tanggal','domisili','industry_id','brand','topic','observation','source_type','source_ref','verification','amount_min','amount_max','amount_period','created_by','created_at','updated_at'],
    Market_Daily_Reports:['report_id','tanggal','tl_id','tl_nama','area','outlets','industry_id','brands','outlets_visited','summary','market_condition','competitor_activity','promo_findings','obstacles','next_action','source_type','source_ref','evidence_url','status','revision','submitted_at','reviewed_at','reviewed_by','review_note','created_at','updated_at'],
    Market_Daily_Log:['event_id','report_id','from_status','to_status','action','actor_id','actor_nama','revision','note','created_at'],
    SPG_NC_Links:['link_id','spg_id','nc_id','tanggal','oleh'],
    Talent_AI_Log:['insight_id','created_at','created_by','focus','model','facts_json','result_json']
  };
  const KEYS={SPG_Database:'spg_id',SPG_Experience:'experience_id',Market_Intelligence:'intel_id',Market_Daily_Reports:'report_id',Market_Daily_Log:'event_id',SPG_NC_Links:'link_id',Talent_AI_Log:'insight_id'};
  const WRITES=['talent.save','talent.import','talent.convert','talent.experience.save','market.save','market.daily.save','market.daily.submit','market.daily.review'];
  const IMPORT_HEADERS=['external_id','nama','domisili','provinsi','no_hp','email','foto_url','bidang','industri','experience_years','experience_summary','status','owner_id'];
  const FOCUS=['Ringkasan operasional','Kesiapan kandidat NC','Retensi NC','Kondisi pasar & kompetitor'];
  const C=()=>globalThis.RetentionCore;
  function fail(message,code='VALIDATION'){C().fail(message,code);}
  function text(v,label,max=100,required=false){const s=String(v??'').trim();if((required&&!s)||s.length>max)fail(label+(required?' wajib diisi':'')+' (maksimal '+max+' karakter).');return s;}
  function one(v,values,label){if(!values.includes(v))fail(label+' tidak valid.');return v;}
  function num(v,min,max,label){if(v===''||v===null||v===undefined||!Number.isFinite(Number(v))||Number(v)<min||Number(v)>max)fail(label+' harus '+min+'–'+max+'.');return Number(v);}
  function date(v,label){if(!/^\d{4}-\d{2}-\d{2}$/.test(String(v))||Number.isNaN(new Date(v+'T00:00:00Z').getTime())||new Date(v+'T00:00:00Z').toISOString().slice(0,10)!==v)fail(label+' tidak valid.');return v;}
  function url(v){const s=text(v,'Link',1500);if(s&&!/^https:\/\/[^\s<>"']+$/i.test(s))fail('Link foto/sumber harus HTTPS.');return s;}
  function list(v,allowed,label){let a=Array.isArray(v)?v:String(v||'').split(';');a=[...new Set(a.map(s=>String(s).trim()).filter(Boolean))];if(a.length>allowed.length||a.some(s=>!allowed.includes(s)))fail(label+' tidak sesuai daftar pilihan.');return a;}
  const parseList=v=>Array.isArray(v)?v:String(v||'').split(';').filter(Boolean);
  const normalizePhone=v=>{const s=String(v||'').replace(/[\s()+.\-]/g,'');if(s&&!/^\d{8,16}$/.test(s))fail('Nomor HP harus 8–16 angka.');return s.startsWith('0')?'62'+s.slice(1):s;};
  const page=(rows,p)=>C().paginate(rows,{...p,pageSize:p.pageSize||20});
  const sorted=(rows,field='nama')=>rows.slice().sort((a,b)=>String(a[field]||'').localeCompare(String(b[field]||''),'id'));
  function completeness(r){return Math.round([r.nama,r.domisili,r.provinsi,r.no_hp,r.foto_url||r.photo_file_id,parseList(r.bidang).length,parseList(r.industri).length,r.experience_summary].filter(Boolean).length/8*100);}
  function createEngine(store,user,options={}){
    const today=options.today||C().nowDay(),stamp=options.stamp||new Date().toISOString(),id=prefix=>prefix+'_'+(options.uuid?options.uuid():Math.random().toString(36).slice(2)+Date.now().toString(36));
    const hr=()=>{if(!['Admin','HR'].includes(user.role))fail('Aksi ini membutuhkan HR atau Admin.','FORBIDDEN');};
    const edit=()=>{if(!['Admin','HR','Supervisor'].includes(user.role))fail('Akun ini hanya dapat melihat data.','FORBIDDEN');};
    const allowed=r=>!!r&&(user.role!=='Supervisor'||r.owner_id===user.user_id||!!(r.nc_id&&store.read('NC').some(n=>n.nc_id===r.nc_id&&n.supervisor_id===user.user_id)));
    const get=spgId=>{const r=store.read('SPG_Database').find(r=>r.spg_id===spgId);if(!allowed(r))fail('Profil SPG tidak ditemukan atau di luar akses Anda.','FORBIDDEN');return r;};
    const people=()=>store.read('SPG_Database').filter(allowed);
    const publicSPG=r=>{const out={...r,bidang:parseList(r.bidang),industri:parseList(r.industri),experience_years:Number(r.experience_years),completeness:completeness(r),hasPhoto:!!(r.photo_file_id||r.foto_url)};delete out.photo_file_id;if(user.role==='Viewer'){delete out.no_hp;delete out.email;delete out.catatan;delete out.external_id;delete out.owner_id;}return out;};
    const publicExperience=r=>{const out={...r,competitor:C().TRUE(r.competitor),is_current:C().TRUE(r.is_current)};if(user.role==='Viewer'){delete out.tasks;delete out.achievements;}return out;};
    const audit=(action,entity,entityId,summary)=>store.append('Audit_Log',[{waktu:stamp,user:user.user_id,aksi:action,entitas:entity,id:entityId,ringkasan:summary}]);
    function verifyPermission(value,existing){if(value==='Terverifikasi')hr();return value;}
    function validateProfile(p,existing=null){
      const users=store.read('Users');const owner=text(p.owner_id??existing?.owner_id??(user.role==='Supervisor'?user.user_id:''),'Supervisor',100);
      if(owner&&!users.some(u=>u.user_id===owner&&u.role==='Supervisor'&&C().TRUE(u.aktif)))fail('Pilih supervisor aktif untuk pemilik profil.');
      if(user.role==='Supervisor'&&owner!==user.user_id)fail('Supervisor hanya dapat menyimpan profil miliknya.','FORBIDDEN');
      const status=one(p.status||existing?.status||'Tersedia',STATUSES,'Status');
      if(!existing?.nc_id&&status==='Menjadi NC')fail('Gunakan tombol Jadikan NC untuk status Menjadi NC.');
      if(existing?.nc_id&&status!=='Menjadi NC')fail('Profil yang sudah menjadi NC tetap berstatus Menjadi NC.');
      const verification=verifyPermission(one(p.verification||existing?.verification||VERIFY[0],VERIFY,'Verifikasi'),existing);
      const email=text(p.email??existing?.email,'Email',150);if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))fail('Email tidak valid.');
      const row={spg_id:existing?.spg_id||id('SPG'),external_id:text(p.external_id??existing?.external_id,'ID Araia',100),nama:text(p.nama,'Nama',100,true),domisili:text(p.domisili,'Domisili',100,true),provinsi:text(p.provinsi,'Provinsi',100,true),no_hp:normalizePhone(p.no_hp??existing?.no_hp),email,foto_url:url(p.foto_url??existing?.foto_url),photo_file_id:existing?.photo_file_id||'',bidang:list(p.bidang,FIELDS,'Kategori bidang').join(';'),industri:list(p.industri,INDUSTRIES.map(i=>i.id),'Industri').join(';'),experience_years:num(p.experience_years??existing?.experience_years??0,0,60,'Pengalaman (tahun)'),experience_summary:text(p.experience_summary,'Ringkasan pengalaman',3000),status,verification,owner_id:owner,nc_id:existing?.nc_id||'',catatan:text(p.catatan??existing?.catatan,'Catatan',3000),created_at:existing?.created_at||stamp,updated_at:stamp,created_by:existing?.created_by||user.user_id};
      if(!row.bidang||!row.industri)fail('Pilih minimal satu kategori bidang dan industri.');return row;
    }
    function listPeople(p){let rows=people();const q=String(p.q||'').trim().toLowerCase();if(q)rows=rows.filter(r=>[r.nama,r.spg_id,r.external_id,r.domisili,r.provinsi,r.experience_summary].some(x=>String(x||'').toLowerCase().includes(q)));['domisili','provinsi','status','verification'].forEach(k=>{if(p[k])rows=rows.filter(r=>r[k]===p[k]);});if(p.industry)rows=rows.filter(r=>parseList(r.industri).includes(p.industry));if(p.field)rows=rows.filter(r=>parseList(r.bidang).includes(p.field));if(p.sector){const ids=new Set(INDUSTRIES.filter(i=>i.sector===p.sector).map(i=>i.id));rows=rows.filter(r=>parseList(r.industri).some(i=>ids.has(i)));}if(p.minExperience)rows=rows.filter(r=>Number(r.experience_years)>=num(p.minExperience,0,60,'Minimal pengalaman'));return{...page(sorted(rows),p),rows:page(sorted(rows),p).rows.map(publicSPG)};}
    function marketRows(){return store.read('Market_Intelligence').filter(r=>user.role==='Admin'||user.role==='HR'||r.verification==='Terverifikasi'||r.created_by===user.user_id);}
    function filteredMarket(p){let rows=marketRows();if(p.q){const q=String(p.q).toLowerCase();rows=rows.filter(r=>[r.title,r.brand,r.domisili,r.observation].some(v=>String(v||'').toLowerCase().includes(q)));}['domisili','brand','topic','verification','industry_id'].forEach(k=>{if(p[k])rows=rows.filter(r=>r[k]===p[k]);});if(p.from){date(p.from,'Tanggal awal');rows=rows.filter(r=>r.tanggal>=p.from);}if(p.to){date(p.to,'Tanggal akhir');rows=rows.filter(r=>r.tanggal<=p.to);}return rows.sort((a,b)=>b.tanggal.localeCompare(a.tanggal));}
    function dailyRows(){
      return store.read('Market_Daily_Reports').filter(r=>user.role==='Viewer'?['Dikirim','Ditinjau'].includes(r.status):user.role==='Supervisor'?r.tl_id===user.user_id:true);
    }
    function getDaily(reportId){const r=dailyRows().find(r=>r.report_id===reportId);if(!r)fail('Laporan tidak ditemukan atau di luar akses Anda.','FORBIDDEN');return r;}
    function dailyPublic(r){return{...r,outlets_visited:Number(r.outlets_visited||0),revision:Number(r.revision),canEdit:user.role!=='Viewer'&&r.tl_id===user.user_id&&['Draft','Perlu perbaikan'].includes(r.status),canReview:['Admin','HR'].includes(user.role)&&r.status==='Dikirim'};}
    function filteredDaily(p={}){
      let rows=dailyRows();
      if(p.day&&p.day!=='all'){date(p.day,'Tanggal laporan');rows=rows.filter(r=>r.tanggal===p.day);}
      if(p.from){date(p.from,'Tanggal awal');rows=rows.filter(r=>r.tanggal>=p.from);}
      if(p.to){date(p.to,'Tanggal akhir');rows=rows.filter(r=>r.tanggal<=p.to);}
      if(p.from&&p.to&&p.from>p.to)fail('Tanggal akhir tidak boleh sebelum tanggal awal.');
      ['area','tl_id','status','industry_id'].forEach(k=>{if(p[k])rows=rows.filter(r=>r[k]===p[k]);});
      if(p.q){const q=String(p.q).trim().toLowerCase();rows=rows.filter(r=>[r.tl_nama,r.area,r.outlets,r.brands,r.summary,r.competitor_activity].some(v=>String(v||'').toLowerCase().includes(q)));}
      return rows.slice().sort((a,b)=>b.tanggal.localeCompare(a.tanggal)||String(b.updated_at).localeCompare(String(a.updated_at))||a.report_id.localeCompare(b.report_id));
    }
    function dailySummary(p={}){
      const rows=filteredDaily(p),day=p.day&&p.day!=='all'?p.day:today,all=dailyRows(),sent=rows.filter(r=>['Dikirim','Ditinjau'].includes(r.status)),users=store.read('Users'),tls=users.filter(u=>u.role==='Supervisor'&&C().TRUE(u.aktif)&&(user.role!=='Supervisor'||u.user_id===user.user_id)&&(!p.tl_id||u.user_id===p.tl_id));
      const todaySent=new Set(all.filter(r=>r.tanggal===day&&['Dikirim','Ditinjau'].includes(r.status)).map(r=>r.tl_id));
      const count=k=>rows.filter(r=>r.status===k).length;
      return{total:rows.length,draft:count('Draft'),submitted:count('Dikirim'),reviewed:count('Ditinjau'),correction:count('Perlu perbaikan'),sent:sent.length,outletsVisited:sent.reduce((n,r)=>n+Number(r.outlets_visited||0),0),asof:day,coverage:{totalTL:tls.length,reportedTL:tls.filter(u=>todaySent.has(u.user_id)).length,missing:tls.filter(u=>!todaySent.has(u.user_id)).map(u=>({user_id:u.user_id,nama:u.nama,area:u.area}))},industries:INDUSTRIES.map(i=>({id:i.id,label:i.label,count:sent.filter(r=>r.industry_id===i.id).length})).filter(i=>i.count)};
    }
    function dailyRevision(p,r){if(r&&Number(p.revision)!==Number(r.revision))fail('Laporan sudah diperbarui. Segarkan dan buka kembali sebelum menyimpan.','CONFLICT');}
    function dailyRequired(r){
      ['summary','market_condition','competitor_activity','next_action','source_type','source_ref'].forEach(k=>{if(!r[k])fail('Lengkapi ringkasan, kondisi pasar, aktivitas kompetitor, tindak lanjut, dan sumber sebelum mengirim laporan.');});
    }
    function dailyLog(action,before,after,note=''){
      store.append('Market_Daily_Log',[{event_id:id('DLOG'),report_id:after.report_id,from_status:before?.status||'',to_status:after.status,action,actor_id:user.user_id,actor_nama:user.nama||user.user_id,revision:after.revision,note,created_at:stamp}]);
      audit(action,'Market_Daily_Reports',after.report_id,'Laporan harian '+after.tanggal+' · '+after.status+' · revisi '+after.revision);
    }
    function saveDaily(p){
      const existing=p.report_id?getDaily(p.report_id):null;dailyRevision(p,existing);
      const tanggal=date(p.tanggal,'Tanggal laporan');if(tanggal>today)fail('Tanggal laporan tidak boleh di masa depan.');
      const area=text(p.area,'Area',100,true),send=C().TRUE(p.send),owner=existing?.tl_id||user.user_id;
      if(store.read('Market_Daily_Reports').some(r=>r.report_id!==existing?.report_id&&r.tl_id===owner&&r.tanggal===tanggal&&r.area.toLowerCase()===area.toLowerCase()))fail('Laporan untuk TL, tanggal, dan area ini sudah ada. Buka laporan tersebut untuk melanjutkan.','CONFLICT');
      const ref=text(p.source_ref,'Sumber laporan',1500);if(/^https?:/i.test(ref))url(ref);
      const visited=num(p.outlets_visited===''?0:p.outlets_visited??0,0,10000,'Jumlah outlet dikunjungi');if(!Number.isInteger(visited))fail('Jumlah outlet harus bilangan bulat.');
      const row={report_id:existing?.report_id||id('DR'),tanggal,tl_id:owner,tl_nama:existing?.tl_nama||user.nama||user.user_id,area,outlets:text(p.outlets,'Outlet / lokasi',1500),industry_id:one(p.industry_id,INDUSTRIES.map(i=>i.id),'Industri'),brands:text(p.brands,'Brand yang diamati',300),outlets_visited:visited,summary:text(p.summary,'Ringkasan kegiatan',3000),market_condition:text(p.market_condition,'Kondisi pasar',4000),competitor_activity:text(p.competitor_activity,'Aktivitas kompetitor',4000),promo_findings:text(p.promo_findings,'Promo / harga',4000),obstacles:text(p.obstacles,'Kendala',3000),next_action:text(p.next_action,'Tindak lanjut',3000),source_type:p.source_type?one(p.source_type,['Observasi lapangan','Wawancara','Laporan publik'],'Jenis sumber'):'',source_ref:ref,evidence_url:url(p.evidence_url),status:send?'Dikirim':existing?.status==='Perlu perbaikan'?'Perlu perbaikan':'Draft',revision:Number(existing?.revision||0)+1,submitted_at:send?stamp:existing?.submitted_at||'',reviewed_at:send?'':existing?.reviewed_at||'',reviewed_by:send?'':existing?.reviewed_by||'',review_note:send?'':existing?.review_note||'',created_at:existing?.created_at||stamp,updated_at:stamp};
      if(send)dailyRequired(row);
      store.upsert('Market_Daily_Reports',row);dailyLog(send?'market.daily.submit':'market.daily.save',existing,row);return dailyPublic(row);
    }
    function aggregate(p={}){
      const all=people().filter(r=>r.status!=='Arsip'),available=all.filter(r=>r.status==='Tersedia'),converted=all.filter(r=>r.nc_id),expIds=new Set(all.map(r=>r.spg_id)),experiences=store.read('SPG_Experience').filter(e=>expIds.has(e.spg_id)),market=filteredMarket(p),verified=market.filter(r=>r.verification==='Terverifikasi'),ret=C().createEngine(store,user,options),dashboard=ret.read('dashboard'),roster=ret.roster();
      const distribution=(values,key)=>[...new Set(values.flatMap(r=>key(r)))].map(label=>({label,count:values.filter(r=>key(r).includes(label)).length})).sort((a,b)=>b.count-a.count||a.label.localeCompare(b.label));
      const industries=INDUSTRIES.map(i=>({...i,count:all.filter(r=>parseList(r.industri).includes(i.id)).length,available:available.filter(r=>parseList(r.industri).includes(i.id)).length}));
      const competitors=distribution(experiences.filter(e=>C().TRUE(e.competitor)),r=>[r.brand||r.company]).filter(r=>r.label);
      const compensation=verified.filter(r=>r.amount_min!==''&&r.amount_max!=='');
      const benchmarks=[...new Set(compensation.map(r=>r.industry_id+'|'+r.amount_period))].map(key=>{const [industry_id,period]=key.split('|'),rows=compensation.filter(r=>r.industry_id===industry_id&&r.amount_period===period);return{industry_id,period,count:rows.length,min:Math.min(...rows.map(r=>Number(r.amount_min))),max:Math.max(...rows.map(r=>Number(r.amount_max))),latest:rows.map(r=>r.tanggal).sort().slice(-1)[0]};});
      const insights=[];
      if(all.length)insights.push({id:'T1',title:'Ketersediaan talent',finding:available.length+' dari '+all.length+' SPG berstatus Tersedia.',action:'Gunakan filter domisili dan industri untuk memilih kandidat NC.',count:available.length});
      const incomplete=all.filter(r=>completeness(r)<100).length;if(incomplete)insights.push({id:'T2',title:'Kelengkapan profil',finding:incomplete+' profil masih memiliki informasi yang belum lengkap.',action:'Lengkapi foto, kontak, kategori dan ringkasan pengalaman sebelum seleksi.',count:incomplete});
      const noPhoto=all.filter(r=>!r.photo_file_id&&!r.foto_url).length;if(noPhoto)insights.push({id:'T3',title:'Foto profil',finding:noPhoto+' profil belum memiliki foto.',action:'Tambahkan foto melalui profil atau link HTTPS pada import.',count:noPhoto});
      if(dashboard.High)insights.push({id:'R1',title:'Pendampingan NC',finding:dashboard.High+' NC dalam akses Anda berada pada risiko tinggi.',action:'Tinjau Early Warning dan action plan yang sudah tersedia.',count:dashboard.High});
      const noSignal=dashboard.total-dashboard.signalCoverage;if(noSignal)insights.push({id:'R2',title:'Cakupan sinyal mingguan',finding:noSignal+' NC aktif belum memiliki input sinyal.',action:'Perbarui Input Sinyal sebelum menilai perkembangan risiko.',count:noSignal});
      const stale=verified.filter(r=>C().days(r.tanggal,today)>90).length;if(stale)insights.push({id:'M1',title:'Kesegaran market intelligence',finding:stale+' observasi terverifikasi berusia lebih dari 90 hari.',action:'Perbarui observasi pasar dan verifikasi ulang sumbernya.',count:stale});
      if(market.length)insights.push({id:'M2',title:'Sumber observasi pasar',finding:verified.length+' dari '+market.length+' observasi sudah terverifikasi.',action:'Gunakan observasi terverifikasi sebagai bahan diskusi dan evaluasi.',count:verified.length});
      const daily=dailySummary(p);
      if(daily.submitted)insights.push({id:'M3',title:'Tinjauan laporan harian',finding:daily.submitted+' laporan harian menunggu tinjauan HR/Admin.',action:'Buka tab Laporan harian TL untuk meninjau laporan yang dikirim.',count:daily.submitted});
      if(daily.coverage.missing.length)insights.push({id:'M4',title:'Cakupan laporan harian',finding:daily.coverage.reportedTL+' dari '+daily.coverage.totalTL+' TL aktif memiliki laporan terkirim untuk '+daily.asof+'.',action:'Periksa jadwal kegiatan dan kelengkapan laporan harian.',count:daily.coverage.missing.length});
      return{asof:today,scope:user.role==='Supervisor'?'Tim Anda':'Dalam akses akun',total:all.length,available:available.length,considered:all.filter(r=>r.status==='Dipertimbangkan').length,converted:converted.length,verified:all.filter(r=>r.verification==='Terverifikasi').length,withPhoto:all.length-noPhoto,complete:all.filter(r=>completeness(r)===100).length,industries,domisili:distribution(all,r=>[r.domisili]),fields:distribution(all,r=>parseList(r.bidang)),experience:[{label:'< 1 tahun',count:all.filter(r=>Number(r.experience_years)<1).length},{label:'1–< 3 tahun',count:all.filter(r=>Number(r.experience_years)>=1&&Number(r.experience_years)<3).length},{label:'3–< 5 tahun',count:all.filter(r=>Number(r.experience_years)>=3&&Number(r.experience_years)<5).length},{label:'≥ 5 tahun',count:all.filter(r=>Number(r.experience_years)>=5).length}],competitors,marketCount:market.length,marketVerified:verified.length,marketTopics:distribution(verified,r=>[r.topic]),benchmarks,daily,retention:{total:dashboard.total,Low:dashboard.Low,Moderate:dashboard.Moderate,High:dashboard.High,signalCoverage:dashboard.signalCoverage,onboarding:dashboard.onboarding},priorities:roster.filter(r=>r.status==='High').sort((a,b)=>b.score-a.score).slice(0,8).map(r=>({nc_id:r.nc_id,nama:r.nama,area:r.area,score:r.score,dominant:r.dominant})),insights};
    }
    function matching(p){
      const industry=p.industry?one(p.industry,INDUSTRIES.map(i=>i.id),'Industri'):'';
      const field=p.field?one(p.field,FIELDS,'Bidang'):'';const city=text(p.domisili,'Domisili',100),min=p.minExperience?num(p.minExperience,0,60,'Minimal pengalaman'):0;
      if(!industry&&!field&&!city&&!min)fail('Pilih minimal satu kriteria pencocokan.');
      const criteria=[...(industry?[{label:'Industri',weight:40,test:r=>parseList(r.industri).includes(industry)}]:[]),...(city?[{label:'Domisili',weight:30,test:r=>r.domisili.toLowerCase()===city.toLowerCase()}]:[]),...(field?[{label:'Bidang',weight:20,test:r=>parseList(r.bidang).includes(field)}]:[]),...(min?[{label:'Pengalaman',weight:10,test:r=>Number(r.experience_years)>=min}]:[])];
      const weight=criteria.reduce((s,c)=>s+c.weight,0);const rows=people().filter(r=>r.status==='Tersedia'&&!r.nc_id).map(r=>({...publicSPG(r),matchScore:Math.round(criteria.filter(c=>c.test(r)).reduce((s,c)=>s+c.weight,0)/weight*100),reasons:criteria.map(c=>({label:c.label,matched:c.test(r),weight:Math.round(c.weight/weight*100)}))})).filter(r=>r.matchScore>0).sort((a,b)=>b.matchScore-a.matchScore||b.completeness-a.completeness||a.nama.localeCompare(b.nama));return{...page(rows,p),method:'Kecocokan kriteria yang dipilih; keputusan seleksi oleh HR.',criteria:criteria.map(c=>({label:c.label,weight:Math.round(c.weight/weight*100)}))};
    }
    function authorize(action,p){
      if(['talent.save','talent.import','talent.convert'].includes(action)){hr();if(p.spg_id)get(p.spg_id);}
      else if(action==='talent.experience.save'){edit();get(p.spg_id);if(p.experience_id&&!store.read('SPG_Experience').some(e=>e.experience_id===p.experience_id&&e.spg_id===p.spg_id))fail('Pengalaman tidak ditemukan.');}
      else if(action==='market.save'){edit();if(p.intel_id){const r=store.read('Market_Intelligence').find(r=>r.intel_id===p.intel_id);if(!r)fail('Observasi tidak ditemukan.');if(user.role==='Supervisor'&&r.created_by!==user.user_id)fail('Observasi ini di luar akses edit Anda.','FORBIDDEN');}}
      else if(['market.daily.save','market.daily.submit'].includes(action)){edit();if(p.report_id){const r=getDaily(p.report_id);if(r.tl_id!==user.user_id)fail('Anda hanya dapat mengisi laporan milik sendiri.','FORBIDDEN');}else if(action==='market.daily.submit')fail('Pilih laporan untuk dikirim.');}
      else if(action==='market.daily.review'){hr();getDaily(p.report_id);}
      else if(action==='talent.photo.upload'){hr();get(p.spg_id);}
      else if(action==='talent.ai.generate')hr();
      else fail('Aksi tambahan tidak tersedia.','NOT_FOUND');
    }
    function mutate(action,p={}){
      authorize(action,p);
      if(action==='market.daily.save'){
        if(p.report_id&&!['Draft','Perlu perbaikan'].includes(getDaily(p.report_id).status))fail('Laporan yang sudah dikirim hanya dapat diperbaiki setelah HR/Admin meminta perbaikan.','CONFLICT');
        return saveDaily(p);
      }
      if(action==='market.daily.submit'){
        const before=getDaily(p.report_id);dailyRevision(p,before);if(!['Draft','Perlu perbaikan'].includes(before.status))fail('Status laporan tidak dapat dikirim kembali.','CONFLICT');dailyRequired(before);
        const row={...before,status:'Dikirim',revision:Number(before.revision)+1,submitted_at:stamp,reviewed_at:'',reviewed_by:'',review_note:'',updated_at:stamp};store.upsert('Market_Daily_Reports',row);dailyLog(action,before,row);return dailyPublic(row);
      }
      if(action==='market.daily.review'){
        const before=getDaily(p.report_id);dailyRevision(p,before);if(before.status!=='Dikirim')fail('Hanya laporan berstatus Dikirim yang dapat ditinjau.','CONFLICT');
        const status=one(p.status,['Ditinjau','Perlu perbaikan'],'Hasil tinjauan'),note=text(p.review_note,'Catatan tinjauan',3000,status==='Perlu perbaikan'),row={...before,status,revision:Number(before.revision)+1,reviewed_at:stamp,reviewed_by:user.user_id,review_note:note,updated_at:stamp};store.upsert('Market_Daily_Reports',row);dailyLog(action,before,row,note);return dailyPublic(row);
      }
      if(action==='talent.save'){
        const existing=p.spg_id?get(p.spg_id):null,row=validateProfile(p,existing),all=store.read('SPG_Database');
        if(row.external_id&&all.some(r=>r.external_id===row.external_id&&r.spg_id!==row.spg_id))fail('ID Araia sudah digunakan.');
        if(row.no_hp&&all.some(r=>r.no_hp===row.no_hp&&r.spg_id!==row.spg_id))fail('Nomor HP sudah terdaftar pada profil lain.');
        store.upsert('SPG_Database',row);audit(action,'SPG_Database',row.spg_id,'Profil SPG disimpan');return publicSPG(row);
      }
      if(action==='talent.import'){
        if(!Array.isArray(p.rows)||!p.rows.length||p.rows.length>1000)fail('Import harus berisi 1–1.000 profil.');
        const all=store.read('SPG_Database'),byExternal=new Map(all.filter(r=>r.external_id).map(r=>[r.external_id,r])),byPhone=new Map(all.filter(r=>r.no_hp).map(r=>[r.no_hp,r.spg_id])),seen=new Set(),phones=new Set();let created=0,updated=0;
        const rows=p.rows.map((raw,index)=>{try{
          const external=text(raw.external_id,'ID Araia',100,true);if(seen.has(external))fail('ID Araia duplikat pada tabel import.');seen.add(external);
          const existing=byExternal.get(external)||null;if(existing&&!allowed(existing))fail('Profil di luar akses Anda.','FORBIDDEN');
          const row=validateProfile({...raw,external_id:external},existing);if(row.no_hp){if(phones.has(row.no_hp))fail('Nomor HP duplikat pada tabel import.');phones.add(row.no_hp);const oldId=byPhone.get(row.no_hp);if(oldId&&oldId!==row.spg_id)fail('Nomor HP sudah dipakai oleh profil lain.');}
          existing?updated++:created++;return row;
        }catch(e){fail('Baris '+(index+2)+': '+e.message,e.code);}});
        rows.forEach(row=>store.upsert('SPG_Database',row));audit(action,'SPG_Database','import',created+' profil baru, '+updated+' diperbarui');return{count:rows.length,created,updated};
      }
      if(action==='talent.convert'){
        const spg=get(p.spg_id);if(spg.nc_id){if(!store.read('NC').some(n=>n.nc_id===spg.nc_id))fail('Relasi NC perlu diperiksa oleh Admin.');return{spg_id:spg.spg_id,nc_id:spg.nc_id,alreadyConverted:true};}
        if(!['Tersedia','Dipertimbangkan'].includes(spg.status))fail('Pilih profil berstatus Tersedia atau Dipertimbangkan.');
        if(spg.verification!=='Terverifikasi')fail('Verifikasi profil SPG sebelum menjadikannya NC.');
        if(spg.no_hp&&store.read('NC').some(n=>normalizePhone(n.no_hp)===spg.no_hp))fail('Nomor HP sudah terdaftar pada NC. Periksa sebelum membuat NC baru.');
        const nc=C().createEngine(store,user,options).mutate('nc.save',{nama:spg.nama,area:text(p.area,'Area penempatan',80,true),supervisor_id:p.supervisor_id,tanggal_join:p.tanggal_join,no_hp:spg.no_hp,catatan:'Sumber database SPG Araia: '+spg.spg_id});
        store.upsert('SPG_Database',{...spg,status:'Menjadi NC',nc_id:nc.nc_id,owner_id:p.supervisor_id,updated_at:stamp});store.append('SPG_NC_Links',[{link_id:id('LINK'),spg_id:spg.spg_id,nc_id:nc.nc_id,tanggal:stamp,oleh:user.user_id}]);audit(action,'SPG_Database',spg.spg_id,'Dilanjutkan menjadi NC '+nc.nc_id);return{spg_id:spg.spg_id,nc_id:nc.nc_id,nc};
      }
      if(action==='talent.experience.save'){
        const existing=p.experience_id?store.read('SPG_Experience').find(e=>e.experience_id===p.experience_id&&e.spg_id===p.spg_id):null;
        const mulai=date(p.mulai,'Tanggal mulai'),current=C().TRUE(p.is_current),selesai=current?'':date(p.selesai,'Tanggal selesai');if(mulai>today||(!current&&(selesai<mulai||selesai>today)))fail('Rentang pengalaman tidak valid.');
        const verification=verifyPermission(one(p.verification||VERIFY[0],VERIFY,'Verifikasi'),existing);
        const row={experience_id:existing?.experience_id||id('EXP'),spg_id:p.spg_id,company:text(p.company,'Perusahaan',150,true),brand:text(p.brand,'Brand',150,true),industry_id:one(p.industry_id,INDUSTRIES.map(i=>i.id),'Industri'),field:one(p.field,FIELDS,'Bidang'),position:text(p.position,'Posisi',100,true),channel:text(p.channel,'Channel',100),mulai,selesai,is_current:current,tasks:text(p.tasks,'Tugas',3000),achievements:text(p.achievements,'Pencapaian',3000),competitor:C().TRUE(p.competitor),verification,created_by:existing?.created_by||user.user_id,created_at:existing?.created_at||stamp,updated_at:stamp};store.upsert('SPG_Experience',row);audit(action,'SPG_Experience',row.experience_id,'Pengalaman SPG dicatat');return publicExperience(row);
      }
      if(action==='market.save'){
        const existing=p.intel_id?store.read('Market_Intelligence').find(r=>r.intel_id===p.intel_id):null,tanggal=date(p.tanggal,'Tanggal observasi');if(tanggal>today)fail('Observasi tidak boleh di masa depan.');
        const verification=verifyPermission(one(p.verification||VERIFY[0],VERIFY,'Verifikasi'),existing),min=p.amount_min===''||p.amount_min===undefined?'':num(p.amount_min,0,1000000000,'Nilai minimum'),max=p.amount_max===''||p.amount_max===undefined?'':num(p.amount_max,0,1000000000,'Nilai maksimum');if((min==='')!==(max==='')||(min!==''&&min>max))fail('Isi rentang nominal minimum dan maksimum yang benar.');
        const ref=text(p.source_ref,'Referensi sumber',1500,true);if(/^https?:/i.test(ref))url(ref);
        const row={intel_id:existing?.intel_id||id('MI'),title:text(p.title,'Judul',200,true),tanggal,domisili:text(p.domisili,'Area observasi',100,true),industry_id:one(p.industry_id,INDUSTRIES.map(i=>i.id),'Industri'),brand:text(p.brand,'Brand / kompetitor',150,true),topic:one(p.topic,TOPICS,'Topik'),observation:text(p.observation,'Hasil observasi',5000,true),source_type:one(p.source_type,['Observasi lapangan','Wawancara','Laporan publik'],'Jenis sumber'),source_ref:ref,verification,amount_min:min,amount_max:max,amount_period:min===''?'':one(p.amount_period,['Harian','Bulanan','Program'],'Periode nominal'),created_by:existing?.created_by||user.user_id,created_at:existing?.created_at||stamp,updated_at:stamp};store.upsert('Market_Intelligence',row);audit(action,'Market_Intelligence',row.intel_id,'Observasi pasar dicatat');return row;
      }
      fail('Aksi tambahan tidak tersedia.','NOT_FOUND');
    }
    function read(action,p={}){
      if(action==='talent.meta')return{industries:INDUSTRIES,fields:FIELDS,statuses:STATUSES,verify:VERIFY,topics:TOPICS,dailyStatuses:DAILY_STATUSES,focus:FOCUS,domisili:[...new Set(people().map(r=>r.domisili))].sort(),provinsi:[...new Set(people().map(r=>r.provinsi))].sort(),marketAreas:[...new Set(dailyRows().map(r=>r.area))].sort(),supervisors:store.read('Users').filter(u=>u.role==='Supervisor'&&C().TRUE(u.aktif)&&(user.role!=='Supervisor'||u.user_id===user.user_id)).map(u=>({user_id:u.user_id,nama:u.nama,area:u.area}))};
      if(action==='talent.list')return listPeople(p);
      if(action==='talent.detail'){const spg=get(p.spg_id),exp=sorted(store.read('SPG_Experience').filter(e=>e.spg_id===spg.spg_id),'mulai').reverse();return{spg:publicSPG(spg),experiences:page(exp.map(publicExperience),p),links:store.read('SPG_NC_Links').filter(l=>l.spg_id===spg.spg_id)};}
      if(action==='talent.match')return matching(p);
      if(action==='talent.analytics')return aggregate(p);
      if(action==='market.list')return page(filteredMarket(p),p);
      if(action==='market.daily.list')return{...page(filteredDaily(p).map(dailyPublic),p),summary:dailySummary(p)};
      if(action==='market.daily.detail'){const row=getDaily(p.report_id);return{report:dailyPublic(row),history:store.read('Market_Daily_Log').filter(r=>r.report_id===row.report_id).slice().sort((a,b)=>Number(a.revision)-Number(b.revision))};}
      if(action==='talent.competitors'){const map=new Map(people().map(r=>[r.spg_id,r]));let rows=store.read('SPG_Experience').filter(e=>map.has(e.spg_id)&&C().TRUE(e.competitor));if(p.q){const q=String(p.q).toLowerCase();rows=rows.filter(r=>[r.brand,r.company,map.get(r.spg_id).nama].some(x=>String(x).toLowerCase().includes(q)));}if(p.industry_id)rows=rows.filter(r=>r.industry_id===p.industry_id);if(p.verification)rows=rows.filter(r=>r.verification===p.verification);return page(rows.sort((a,b)=>b.mulai.localeCompare(a.mulai)).map(r=>({...publicExperience(r),nama:map.get(r.spg_id).nama,domisili:map.get(r.spg_id).domisili})),p);}
      if(action==='talent.ai.history'){hr();return page(store.read('Talent_AI_Log').filter(r=>user.role==='Admin'||r.created_by===user.user_id).slice().reverse().map(r=>({insight_id:r.insight_id,created_at:r.created_at,focus:r.focus,model:r.model,result:JSON.parse(r.result_json)})),p);}
      fail('Halaman tambahan tidak tersedia.','NOT_FOUND');
    }
    return{read,mutate,authorize,get,publicSPG,aggregate};
  }
  function memoryStore(db){
    const ensure=t=>{if(db[t]===undefined||db[t]===null)db[t]=[];return db[t];};
    Object.keys(SCHEMA).forEach(ensure);
    const keys={...C().KEYS,...KEYS};
    return{
      read:ensure,
      append:(t,rows)=>ensure(t).push(...JSON.parse(JSON.stringify(rows))),
      upsert:(t,row)=>{const k=keys[t],key=r=>typeof k==='function'?k(r):r[k],rows=ensure(t),i=rows.findIndex(r=>key(r)===key(row));if(i<0)rows.push(JSON.parse(JSON.stringify(row)));else rows[i]=JSON.parse(JSON.stringify(row));},
      db
    };
  }
  function aiFacts(a){return{asof:a.asof,totalSPG:a.total,availableSPG:a.available,convertedSPG:a.converted,verifiedSPG:a.verified,profilesWithPhoto:a.withPhoto,completeProfiles:a.complete,industryCoverage:a.industries.map(i=>({id:i.id,label:i.label,total:i.count,available:i.available})),experienceBuckets:a.experience,competitorExperienceCounts:a.competitors,verifiedMarketObservations:a.marketVerified,marketTopics:a.marketTopics,compensationObservations:a.benchmarks,dailyReports:{total:a.daily.total,draft:a.daily.draft,submitted:a.daily.submitted,reviewed:a.daily.reviewed,correction:a.daily.correction,outletVisitsReported:a.daily.outletsVisited,coverageDay:a.daily.asof,totalActiveTL:a.daily.coverage.totalTL,reportedTL:a.daily.coverage.reportedTL,industryCounts:a.daily.industries},retention:a.retention,evidence:a.insights};}
  function validateAI(value,facts){if(!value||!Array.isArray(value.insights)||value.insights.length<1||value.insights.length>8)fail('Format respons AI belum sesuai. Coba kembali.','AI_RESPONSE');const ids=new Set(facts.evidence.map(r=>r.id));return{summary:text(value.summary,'Ringkasan AI',2000,true),insights:value.insights.map(r=>({title:text(r.title,'Judul insight',200,true),explanation:text(r.explanation,'Penjelasan',1800,true),recommendation:text(r.recommendation,'Rekomendasi',1200,true),evidence_ids:Array.isArray(r.evidence_ids)?r.evidence_ids.filter(id=>ids.has(id)).slice(0,8):[]}))};}
  return{INDUSTRIES,FIELDS,STATUSES,TOPICS,VERIFY,DAILY_STATUSES,SCHEMA,KEYS,WRITES,IMPORT_HEADERS,FOCUS,createEngine,memoryStore,parseList,normalizePhone,completeness,aiFacts,validateAI,fail};
})();
if(typeof globalThis!=='undefined')globalThis.TalentCore=TalentCore;
