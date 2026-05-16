#!/usr/bin/env bash
#
# Downloads the user-provided ibb.co cover artwork for every cohort startup,
# converts each PNG to a quality-80 progressive JPEG capped at 1024×1024, and
# drops the result into web/public/covers/<startup-id>.jpg.
#
# Run once on the VM (or any host with ImageMagick + curl). Re-running is
# safe — existing files are overwritten.
#
# Required tools:
#   - curl
#   - magick (ImageMagick 7) OR convert (ImageMagick 6)
#       apt:  sudo apt-get install -y imagemagick
#       apk:  apk add --no-cache imagemagick
#       brew: brew install imagemagick

set -euo pipefail

cd "$(dirname "$0")/.."
TARGET="web/public/covers"
mkdir -p "$TARGET"

if command -v magick >/dev/null 2>&1; then
  IM="magick"
elif command -v convert >/dev/null 2>&1; then
  IM="convert"
else
  echo "❌ ImageMagick not found. Install it first (apt install imagemagick / brew install imagemagick)." >&2
  exit 1
fi

# id  →  source URL
COVERS=(
  "S-artrise|https://i.ibb.co/TsjpgRT/123.png"
  "S-shelfly|https://i.ibb.co/FqnbsfC2/124.png"
  "S-ailab|https://i.ibb.co/pvvp4jVb/125.png"
  "S-albion|https://i.ibb.co/BHgyPM79/126.png"
  "S-bte|https://i.ibb.co/hxmNDSfv/127.png"
  "S-calenmind|https://i.ibb.co/xtC0Jmsd/128.png"
  "S-invalerts|https://i.ibb.co/jkgRXxhh/129.png"
  "S-stylify|https://i.ibb.co/d0Mf3S2d/130.png"
  "S-clutchup|https://i.ibb.co/hR34kjm8/131.png"
  "S-arb|https://i.ibb.co/4CHvcvx/132.png"
  "S-creators|https://i.ibb.co/gL81Mxtz/133.png"
  "S-ztbrowser|https://i.ibb.co/ksJZhyxd/134.png"
  "S-tglearn|https://i.ibb.co/xqKH7jN6/135.png"
  "S-p2pedit|https://i.ibb.co/Mx9cbTFV/136.png"
  "S-tonloans|https://i.ibb.co/H3wgss5/137.png"
  "S-fridgefriend|https://i.ibb.co/1JKwbXch/138.png"
)

UA="Mozilla/5.0 (X11; Linux x86_64) Gecko/20100101 Firefox/124.0"

for row in "${COVERS[@]}"; do
  id="${row%%|*}"
  url="${row#*|}"
  tmp="$(mktemp --suffix=.png)"
  out="$TARGET/$id.jpg"
  printf '→ %-20s %s\n' "$id" "$url"
  curl -fsSL -A "$UA" -H 'Referer: https://ibb.co/' "$url" -o "$tmp"
  $IM "$tmp" -strip -interlace Plane -quality 80 -resize '1024x1024>' "$out"
  rm -f "$tmp"
  bytes=$(stat -c%s "$out" 2>/dev/null || stat -f%z "$out")
  printf '  ✓ %s (%s KB)\n' "$out" "$((bytes / 1024))"
done

echo "Done. All covers in $TARGET."
