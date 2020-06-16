#!/bin/sh

rm -rf /tmp/authgear-sdk-js-website
git clone git@github.com:authgear/authgear-sdk-js.git --branch gh-pages /tmp/authgear-sdk-js-website
cp -R ./website/build/. /tmp/authgear-sdk-js-website

cd /tmp/authgear-sdk-js-website

git add .
git commit --allow-empty -m "Deploy documentation"
git push origin gh-pages:gh-pages
