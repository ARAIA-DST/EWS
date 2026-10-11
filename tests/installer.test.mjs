import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,cpSync,readFileSync,writeFileSync,existsSync,readdirSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
const source=fileURLToPath(new URL('../',import.meta.url));
function setup(){const base=mkdtempSync(join(tmpdir(),'ncubator-install-')),target=join(base,'project');cpSync(source,target,{recursive:true});return{base,target};}
function run(target,partial){return spawnSync('python3',[join(source,'scripts/apply-ncubator-update.py'),'--target',target,...(partial?['--source',partial]:[])],{encoding:'utf8'});}
test('installer preserves custom API URL/configuration, keeps backup and becomes idempotent',()=>{
  const {base,target}=setup();try{
    const path=join(target,'js/config.js'),custom=readFileSync(path,'utf8').replace("API_URL: ''","API_URL: 'https://script.google.com/macros/s/EXISTING_APP/exec'").replace("VERSION: '3.0.0'","VERSION: '2.1.1'").replace('TIMEOUT_MS: 25000','TIMEOUT_MS: 27000');writeFileSync(path,custom);
    const result=run(target);assert.equal(result.status,0,result.stderr);const config=readFileSync(path,'utf8');assert.ok(config.includes('/EXISTING_APP/exec'));assert.ok(config.includes('TIMEOUT_MS: 27000'));assert.ok(config.includes("VERSION: '3.0.0'"));const backup=readdirSync(base).find(n=>n.startsWith('project-before-ncubator-'));assert.ok(backup);assert.equal(readFileSync(join(base,backup,'js/config.js'),'utf8'),custom);
    const again=run(target);assert.equal(again.status,0);assert.ok(again.stdout.includes('already current'));assert.equal(readdirSync(base).filter(n=>n.startsWith('project-before-ncubator-')).length,1);
  }finally{rmSync(base,{recursive:true,force:true});}
});
test('installer rejects custom source before writing any files or creating a backup',()=>{
  const {base,target}=setup();try{
    const css=join(target,'css/styles.css'),before=readFileSync(css,'utf8')+'\n/* customer customization */\n';writeFileSync(css,before);const config=join(target,'js/config.js'),configBefore=readFileSync(config,'utf8').replace("VERSION: '3.0.0'","VERSION: '2.1.1'");writeFileSync(config,configBefore);
    const result=run(target);assert.notEqual(result.status,0);assert.match(result.stderr,/No files changed/);assert.equal(readFileSync(css,'utf8'),before);assert.equal(readFileSync(config,'utf8'),configBefore);assert.equal(readdirSync(base).length,1);
  }finally{rmSync(base,{recursive:true,force:true});}
});
test('a partial package rejects missing or stale runtime files before changing configuration',()=>{
  const {base,target}=setup();try{
    const partial=join(base,'partial');mkdirSync(join(partial,'docs'),{recursive:true});mkdirSync(join(partial,'js'));
    cpSync(join(source,'docs/NCUBATOR_COMPATIBILITY.json'),join(partial,'docs/NCUBATOR_COMPATIBILITY.json'));cpSync(join(source,'js/config.js'),join(partial,'js/config.js'));
    const css=join(target,'css/styles.css'),before=readFileSync(css,'utf8')+'\n/* prior or customized runtime */\n';writeFileSync(css,before);rmSync(join(target,'apps-script/TalentAdmin.gs'));
    const config=join(target,'js/config.js'),configBefore=readFileSync(config,'utf8').replace("VERSION: '3.0.0'","VERSION: '2.1.1'");writeFileSync(config,configBefore);
    const result=run(target,partial);assert.notEqual(result.status,0);assert.match(result.stderr,/No files changed/);assert.match(result.stderr,/css\/styles\.css/);assert.match(result.stderr,/apps-script\/TalentAdmin\.gs/);assert.match(result.stderr,/NCUBATOR_Full_Package_v3\.zip/);assert.equal(readFileSync(config,'utf8'),configBefore);assert.equal(readFileSync(css,'utf8'),before);assert.equal(existsSync(join(target,'apps-script/TalentAdmin.gs')),false);assert.equal(readdirSync(base).filter(n=>n.includes('before-ncubator')).length,0);
  }finally{rmSync(base,{recursive:true,force:true});}
});
