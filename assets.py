#!/usr/bin/env python
import json
import os
import sys

def build(json_path, src_dirs):
    assets = {}
    for src_dir in src_dirs:
        for parent, dirs, files in os.walk(src_dir):
            for f in files:
                if f and f[0] == '.':
                    continue
                path = os.path.join(parent, f)
                assets[path] = os.path.getsize(path)
    with open(json_path, 'w') as f:
        json.dump(assets, f)

if __name__ == '__main__':
    build(sys.argv[1], [sys.argv[2]])
