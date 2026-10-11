#!/usr/bin/env python3
"""Compatibility entry point: apply the NCUBATOR update."""
import runpy
from pathlib import Path
runpy.run_path(str(Path(__file__).with_name('apply-ncubator-update.py')),run_name='__main__')
