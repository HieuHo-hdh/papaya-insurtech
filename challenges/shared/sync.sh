#!/bin/bash
set -e
DIR="$(cd "$(dirname "$0")" && pwd)"
cp "$DIR/types.ts" "$DIR/../be/src/shared/types.ts"
cp "$DIR/schemas.ts" "$DIR/../be/src/shared/schemas.ts"
cp "$DIR/types.ts" "$DIR/../fe/shared/types.ts"
cp "$DIR/schemas.ts" "$DIR/../fe/shared/schemas.ts"
echo "Synced shared types to be/src/shared/ and fe/shared/"
