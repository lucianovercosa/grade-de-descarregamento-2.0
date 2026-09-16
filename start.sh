#!/bin/bash
node server.js &
SERVER_PID=$!
sleep 2
npm run dev
kill $SERVER_PID
