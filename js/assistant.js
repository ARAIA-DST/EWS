import '../shared/assistant-core.js';
import * as api from './api.js';
import {esc} from './ui.js';
const A=globalThis.NCubatorAssistant,cache=new Map(),flights=new Map();let owner='',statusFlight=null,active=null;
function sessionOwner(){const s=api.getSession(),key=s?.token||'';if(owner!==key){cache.clear();flights.clear();statusFlight=null;owner=key;}return key;}
export function clear(){if(active)clearTimeout(active.timer);active=null;cache.clear();flights.clear();statusFlight=null;owner='';}
function live(item){return active===item&&item.panel.isConnected&&!item.signal?.aborted&&sessionOwner()===item.owner;}
function status(){if(!statusFlight){const pending=api.request('assistant.status',{}).catch(e=>{if(statusFlight===pending)statusFlight=null;throw e;});statusFlight=pending;}return statusFlight;}
function content(item,result,notice=''){
  if(!live(item))return;item.result=result;
  const body=item.panel.querySelector('.assistant-body');
  body.innerHTML=`<div class="assistant-context"><span>${esc(result.module)}</span><span class="assistant-source">${result.generated?'GPT Insight':'Analisis otomatis'}</span></div>${result.summary?`<p class="assistant-summary">${esc(result.summary)}</p>`:''}${result.insights.map(i=>`<article class="assistant-card"><span class="assistant-priority ${esc(i.priority||'normal')}">${i.priority==='high'?'Prioritas tinggi':i.priority==='attention'?'Perlu perhatian':'Rekomendasi'}</span><h3>${esc(i.title)}</h3><p>${esc(i.explanation)}</p><p class="assistant-recommendation">${esc(i.recommendation)}</p></article>`).join('')}<p class="assistant-basis">${esc(result.scope)} · ${esc(result.basis)}</p><p class="assistant-notice">Saran untuk ditinjau; perubahan data tetap melalui alur yang tersedia.</p><div class="assistant-status" aria-live="polite">${esc(notice)}</div>`;
}
function message(item,text,retry=false){if(!live(item))return;const el=item.panel.querySelector('.assistant-status');if(el)el.innerHTML=esc(text)+(retry?'<br><button class="assistant-retry" type="button">Coba GPT lagi</button>':'');}
export function begin(ctx,context,{signal,target}={}){
  const panel=target||document.getElementById('assistant-panel');if(!panel)return;
  const item={ctx,context,signal,panel,owner:sessionOwner(),result:null,key:''};active=item;
  panel.hidden=false;panel.className='assistant-panel';panel.setAttribute('aria-label','AI Assistant');
  panel.innerHTML=`<header class="assistant-header"><span class="assistant-symbol" aria-hidden="true">✦</span><div><h2>AI Assistant</h2><p>Smart Recommendation</p></div><button type="button" class="assistant-toggle" aria-label="Perkecil AI Assistant" aria-expanded="true">−</button></header><div class="assistant-body"><div class="assistant-context"><span>${esc(A.MODULES[context.route]||'Modul')}</span></div><p class="assistant-status" role="status">Menyiapkan insight sesuai modul…</p></div>`;
  panel.querySelector('.assistant-toggle').addEventListener('click',()=>{const closed=panel.classList.toggle('collapsed');panel.querySelector('.assistant-body').hidden=closed;const btn=panel.querySelector('.assistant-toggle');btn.textContent=closed?'+':'−';btn.setAttribute('aria-expanded',String(!closed));btn.setAttribute('aria-label',closed?'Buka AI Assistant':'Perkecil AI Assistant');});
  panel.onclick=e=>{if(e.target.closest('.assistant-retry')&&live(item))generate(item);};
  signal?.addEventListener('abort',()=>clearTimeout(item.timer),{once:true});
  return item;
}
export function unavailable(item){message(item,'Data modul belum tersedia. Muat ulang modul untuk mendapatkan insight.');}
export function update(item,data,context=item?.context){
  if(!item||!live(item))return;item.context=context;const c=A.source(item.ctx.user.role,context.route,context.id,context.params),local=A.build(c,data,item.ctx.user.role);item.local=local;item.source=c;
  item.key=JSON.stringify([c,A.facts(local)]);content(item,local);clearTimeout(item.timer);item.timer=setTimeout(()=>generate(item),500);
}
async function generate(item,attempt=0){
  if(!live(item)||!item.local)return;const key=item.key,previous=cache.get(key);
  if(previous&&Date.now()-previous.at<600000){content(item,previous.result);return;}
  message(item,'Menyiapkan insight GPT…');
  try{
    const configured=await status();if(!live(item)||item.key!==key)return;
    if(!configured.enabled){message(item,item.ctx.demo?'Mode demo · insight berdasarkan data contoh.':'Insight berdasarkan data modul. GPT belum diaktifkan oleh Admin.');return;}
    const {route,id,params}=item.source;let promise=flights.get(key);
    if(!promise){promise=api.request('assistant.generate',{route,id,filters:params},{write:true,signal:item.signal}).finally(()=>{if(flights.get(key)===promise)flights.delete(key);});flights.set(key,promise);}
    const result=await promise;if(!live(item)||item.key!==key)return;cache.set(key,{at:Date.now(),result});if(cache.size>60)cache.delete(cache.keys().next().value);content(item,result);
  }catch(e){if(!live(item)||item.key!==key||e.name==='AbortError')return;if(['BUSY','AI_RATE_LIMIT'].includes(e.code)&&attempt<3){message(item,'GPT sedang memproses. Analisis otomatis tetap tersedia.');clearTimeout(item.timer);item.timer=setTimeout(()=>generate(item,attempt+1),e.code==='AI_RATE_LIMIT'?16000:2000*(attempt+1));return;}message(item,'Analisis otomatis tetap tersedia. '+(e.code==='AUTH'?'Sesi berubah; masuk kembali.':e.message),!['AUTH','AI_NOT_CONFIGURED'].includes(e.code));}
}
