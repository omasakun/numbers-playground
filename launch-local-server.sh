#!/bin/sh
echo Open http://localhost:8137
echo
echo このウィンドウは閉じないでください。
echo
echo
python3 -m http.server 8137 >server.log 2>&1
