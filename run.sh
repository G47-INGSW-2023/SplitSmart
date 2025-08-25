#!/bin/bash 

cd ./backend
cargo run &

cd ../frontend
npm run dev