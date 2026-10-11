#!/usr/bin/env python3
"""Apply add-on 2.1 to verified V1 or add-on 2.0 sources; preserve other files."""
import argparse
import hashlib
import json
import shutil
from pathlib import Path

def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--target',required=True,help='Existing V1 project folder')
    parser.add_argument('--source',default=str(Path(__file__).resolve().parent.parent),help='Extracted add-on project folder')
    args=parser.parse_args();target=Path(args.target).resolve();source=Path(args.source).resolve()
    if target==source or not (target/'index.html').is_file():
        parser.error('Target must be a different existing V1 project with index.html.')
    manifest=json.loads((source/'docs/V1_COMPATIBILITY.json').read_text())
    previous_path=source/'docs/ADDON_20_COMPATIBILITY.json'
    previous=json.loads(previous_path.read_text())['sha256'] if previous_path.exists() else {}
    changed=[path for path,info in manifest.items() if info['changed']]
    additions=[p.relative_to(source) for p in source.rglob('*') if p.is_file() and str(p.relative_to(source)) not in manifest]
    additions=[p for p in additions if not any(x.startswith('.') for x in p.parts)]
    errors=[]
    for rel in changed:
        path=target/rel;info=manifest[rel]
        if not path.is_file() or digest(path) not in [info['baseline_sha256'],info['addon_sha256']]:
            errors.append(rel+' differs from original V1: integrate its hook manually using docs/V1_INTEGRATION.diff.')
    for rel in additions:
        path=target/rel
        if path.exists() and (not path.is_file() or digest(path) not in [digest(source/rel),previous.get(str(rel))]):
            errors.append(str(rel)+' has custom content: integrate its update manually using docs/ADDON_20_INTEGRATION.diff.')
    if errors:
        raise SystemExit('No files changed.\n'+'\n'.join(errors))
    updates=[rel for rel in [*(Path(p) for p in changed),*additions] if not (target/rel).is_file() or digest(target/rel)!=digest(source/rel)]
    backup=target.parent/(target.name+'-before-talent-addon-2.1')
    if updates and not backup.exists():
        backup.mkdir()
        for rel in updates:
            if (target/rel).is_file():
                out=backup/rel;out.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(target/rel,out)
    for rel in updates:
        out=target/rel;out.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(source/rel,out)
    print('Add-on applied. js/config.js and all other V1 files were preserved.')
    print('Backup of files being updated: '+str(backup))
    print('Update the Apps Script files and run setupTalentAddon as described in docs/TALENT_ADDON_GUIDE.md.')

if __name__=='__main__':
    main()
