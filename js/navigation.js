// One primary destination per workflow; existing deep links remain available as tabs.
export const ROLE_LABEL={Admin:'Admin',HR:'HR',Supervisor:'TL',Viewer:'Client',NC:'NC'};
export const GROUPS=[
  {id:'dashboard',label:'Beranda',icon:'dashboard',tabs:[]},
  {id:'talent',label:'Database SPG',icon:'users',tabs:[]},
  {id:'onboarding',label:'Onboarding',icon:'check',tabs:[['onboarding','Tahapan'],['readiness','Kesiapan 30/60/90 hari']]},
  {id:'team',label:'Tim NC',icon:'users',tabs:[]},
  {id:'requests',label:'Izin & Cuti',icon:'calendar',tabs:[]},
  {id:'market',label:'Competitor & Market',icon:'trend',tabs:[]},
  {id:'early-warning',label:'Retensi & Follow-up',icon:'warning',tabs:[['early-warning','Risiko'],['signals','Input sinyal'],['conversations','Percakapan'],['plans','Action plan'],['reminders','Tindak lanjut']]},
  {id:'reports',label:'Laporan & Insight',icon:'report',tabs:[['reports','Laporan bulanan'],['retention','Papan retensi'],['attrition','Resign'],['talent-insights','Analytics & AI']]},
  {id:'users',label:'Administrasi',icon:'settings',tabs:[['users','Akun & akses'],['settings','Pengaturan'],['audit','Audit log']]}
];
const SELF=[{id:'self-home',label:'Beranda Saya',icon:'dashboard',tabs:[]},{id:'self-training',label:'Onboarding Saya',icon:'check',tabs:[]},{id:'self-requests',label:'Pengajuan Saya',icon:'calendar',tabs:[]},{id:'self-tasks',label:'Tugas Saya',icon:'plan',tabs:[]}];
export function navFor(role){if(role==='NC')return SELF;return GROUPS.filter(g=>g.id!=='users'||role==='Admin').filter(g=>role!=='Viewer'||['dashboard','team','market','reports'].includes(g.id));}
export function groupFor(route,role){if(route==='nc')return role==='Viewer'?'team':'early-warning';return navFor(role).find(g=>g.id===route||g.tabs.some(t=>t[0]===route))?.id||route;}
export function routeAllowed(route,role){if(route==='nc')return role!=='NC';return navFor(role).some(g=>g.id===route||g.tabs.some(t=>t[0]===route&&!(role==='Viewer'&&t[0]==='signals')));}
export const defaultRoute=role=>role==='NC'?'self-home':'dashboard';
export function tabsFor(route,role){return navFor(role).find(g=>g.id===groupFor(route,role))?.tabs.filter(t=>role!=='Viewer'||t[0]!=='signals')||[];}
