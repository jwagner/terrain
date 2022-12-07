#!/bin/sh
set -e
python build.py release
cp build/main.js build/main_concat.js
npx uglify-js build/main_concat.js > build/main.js
rm build/main_concat.js
rsync -vrt --copy-links --include gfx/maui-diff.png --include gfx/waternormals3.png --exclude "gfx/*" build/* x.29a.ch:/var/www/29a.ch/sandbox/2012/terrain/
python build.py
