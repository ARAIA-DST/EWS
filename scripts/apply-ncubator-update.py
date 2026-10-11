#!/usr/bin/env python3
"""Upgrade recognized Araia sources to NCUBATOR 3.0 without replacing API_URL."""
import argparse
import hashlib
import json
import re
import shutil
from datetime import datetime,timezone
from pathlib import Path

def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--target',required=True,help='Existing Araia/NCUBATOR project folder')
    parser.add_argument('--source',default=str(Path(__file__).resolve().parent.parent))
    args=parser.parse_args();target=Path(args.target).resolve();source=Path(args.source).resolve()
    if target==source or not (target/'index.html').is_file():parser.error('Target must be a different existing application folder.')
    manifest=json.loads((source/'docs/NCUBATOR_COMPATIBILITY.json').read_text())
    errors=[];updates=[]
    # A change-only archive needs every omitted runtime file already at this release.
    # Otherwise an older project could appear to upgrade while essential code is missing.
    for rel,expected in manifest.get('required_runtime_sha256',{}).items():
        src=source/rel;dest=target/rel
        if not src.is_file() and (not dest.is_file() or (rel!='js/config.js' and digest(dest)!=expected)):
            errors.append(rel+' is missing or differs from this release; use NCUBATOR_Full_Package_v3.zip.')
    for rel,known in manifest['recognized_sha256'].items():
        src=source/rel;dest=target/rel
        if not src.is_file():continue
        if dest.exists() and (not dest.is_file() or (rel!='js/config.js' and digest(dest) not in known+[digest(src)])):
            errors.append(rel+' has custom changes; merge it against docs/NCUBATOR_UPGRADE.diff.')
        elif not dest.is_file() or digest(dest)!=digest(src):updates.append(rel)
    # Documentation is replaced only when it is a known baseline or an absent file.
    for rel in manifest['new_files']:
        src=source/rel;dest=target/rel
        if not src.is_file():continue
        if dest.exists() and (not dest.is_file() or digest(dest)!=digest(src)):
            errors.append(rel+' already exists with different content; review before updating.')
        elif not dest.exists():updates.append(rel)
    if errors:raise SystemExit('No files changed.\n'+'\n'.join(errors))
    configured=None;config=target/'js/config.js'
    if config.is_file():
        configured,count=re.subn(r"(VERSION\s*:\s*)['\"][^'\"]+['\"]",r"\g<1>'3.0.0'",config.read_text(),count=1)
        if count!=1:raise SystemExit('No files changed. Update VERSION manually in the custom js/config.js before integration.')
        if configured==config.read_text():updates=[rel for rel in updates if rel!='js/config.js']
    if not updates:print('NCUBATOR files are already current.');return
    backup=target.parent/(target.name+'-before-ncubator-'+datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S%fZ'))
    shutil.copytree(target,backup,ignore=shutil.ignore_patterns('.git','node_modules','__pycache__'))
    for rel in dict.fromkeys(updates):
        out=target/rel;out.parent.mkdir(parents=True,exist_ok=True)
        if rel=='js/config.js' and configured is not None:out.write_text(configured)
        else:shutil.copy2(source/rel,out)
    print('NCUBATOR source applied; existing API_URL and public configuration preserved.')
    print('Backup: '+str(backup))
    print('Update Apps Script, run setupNCUBATOR, deploy a new Web App version, then update GitHub Pages. See docs/NCUBATOR_UPGRADE.md.')

if __name__=='__main__':main()
