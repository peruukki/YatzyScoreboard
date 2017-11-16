#!/usr/bin/env bash

git checkout gh-pages
git fetch origin && git reset --hard origin/gh-pages
git merge master
git push origin gh-pages
