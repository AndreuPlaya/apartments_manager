#!/usr/bin/env bash

# Converts all BSON collections from mongo_backup to readable JSON files
# Output goes to mongo_backup/json/

BACKUP_DIR="$(dirname "$0")/../mongo_backup/IXAGrupDB"
OUTPUT_DIR="$(dirname "$0")/../mongo_backup/json"

mkdir -p "$OUTPUT_DIR"

for bson_file in "$BACKUP_DIR"/*.bson; do
  collection=$(basename "$bson_file" .bson)
  output="$OUTPUT_DIR/$collection.json"
  bsondump --outFile="$output" "$bson_file"
  echo "✓ $collection → $output"
done

echo ""
echo "Done. JSON files in: $OUTPUT_DIR"
