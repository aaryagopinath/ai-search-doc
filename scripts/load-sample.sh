#!/usr/bin/env bash
set -euo pipefail

# Example: load a text file as a document
FILE_PATH=${1:-"./SAMPLE.txt"}
DESC=${2:-"sample file"}

if [ ! -f "$FILE_PATH" ]; then
  echo "No file at $FILE_PATH"
  exit 1
fi

echo "Uploading $FILE_PATH..."
curl -F "file=@${FILE_PATH}" -F "description=${DESC}" http://localhost:8080/documents
