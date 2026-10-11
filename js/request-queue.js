// Limit pressure from one browser, including profile photos and route requests.
const MAX_ACTIVE=3,queue=[];let active=0;
function pump(){while(active<MAX_ACTIVE&&queue.length){const job=queue.shift();if(job.signal?.aborted){job.reject(new DOMException('Permintaan dibatalkan.','AbortError'));continue;}active++;Promise.resolve().then(job.task).then(job.resolve,job.reject).finally(()=>{active--;pump();});}}
export function network(task,signal){return new Promise((resolve,reject)=>{queue.push({task,signal,resolve,reject});pump();});}
