#!/usr/bin/env bash
# Convierte las .otf del cliente a woff2 (subset latín + puntuación tipográfica).
# Uso: scripts/preparar-fuentes.sh "<carpeta TIPOGRAFÍAS>"
# Requiere pyftsubset (fonttools + brotli): pip install fonttools brotli
set -euo pipefail
ORIGEN="${1:?Uso: preparar-fuentes.sh \"<carpeta TIPOGRAFÍAS>\"}"
DESTINO="$(cd "$(dirname "$0")/.." && pwd)/public/fonts"
UNICODES="U+0020-007E,U+00A0-00FF,U+2013,U+2014,U+2018,U+2019,U+201C,U+201D,U+2022,U+2026,U+20AC"

conv() {
  pyftsubset "$ORIGEN/$1" --unicodes="$UNICODES" --flavor=woff2 --layout-features='*' --output-file="$DESTINO/$2"
  echo "ok  $2"
}

conv "Almarose-Thin-iF664dbe5708d99.otf"     almarose-thin.woff2
conv "Almarose-Semibold-iF664dbe56f2afe.otf" almarose-semibold.woff2
conv "Techno_Nue-Thin-iF66cd8474a8764.otf"   technonue-thin.woff2
conv "Techno_Nue-Regular-iF66cd847495173.otf" technonue-regular.woff2
