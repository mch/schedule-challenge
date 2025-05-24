#!/bin/bash
# Script to build the server project

cd "$(dirname "$0")/server" || exit 1
npm run build

