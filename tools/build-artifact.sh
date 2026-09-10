#!/usr/bin/env bash
set -euo pipefail
PROJ="/c/Users/aylen/Desktop/rodrigo-ocampo-portfolio"
OUT="/c/Users/aylen/AppData/Local/Temp/claude/C--Users-aylen--claude/b615ae05-4cf2-48ad-b922-94d9d6fb0440/scratchpad/rodrigo-ocampo-artifact.html"

mkdir -p "$(dirname "$OUT")"

# 1. Extract body inner content
awk '/<body>/{flag=1; next} /<\/body>/{flag=0} flag' "$PROJ/index.html" > /tmp/body.html

# 2. Strip the script tags at the end (we'll add our own)
sed -i '/<script defer src="lib\/gsap.min.js">/,/<script defer src="main.js/d' /tmp/body.html
sed -i '/<\/script>/d' /tmp/body.html 2>/dev/null || true

# 3. Inline each image as base64 data URI
for name in hero-rodrigo hero-camino origen-mate travel-playa travel-verano; do
  b64=$(base64 -w0 "$PROJ/assets/img/${name}.jpg")
  sed -i "s@assets/img/${name}.jpg@data:image/jpeg;base64,${b64}@g" /tmp/body.html
done

# 4. Remove data-reveal-mask on hero figure? keep. Remove favicon references (none in body).

echo "Body extracted + images inlined: $(wc -l < /tmp/body.html) lines"
wc -c /tmp/body.html
