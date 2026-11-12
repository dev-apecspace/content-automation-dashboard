#!/bin/bash
# Download Be Vietnam Pro variable font for self-hosting
set -e
cd /home/z/my-project
mkdir -p public/fonts
UA="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

curl -s --max-time 30 -A "$UA" "https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@100..900&display=swap" -o /tmp/bvp.css
echo "--- css fetched: $(wc -c < /tmp/bvp.css) bytes"
grep -c "@font-face" /tmp/bvp.css

# extract woff2 urls
grep -oE "https://fonts.gstatic.com/[^)]+\.woff2" /tmp/bvp.css | sort -u > /tmp/font_urls.txt
cat /tmp/font_urls.txt
i=0
while read -r url; do
  i=$((i+1))
  # name files by subset block they appear in
  curl -s --max-time 60 "$url" -o "/tmp/bvp_$i.woff2"
  echo "downloaded $i: $(wc -c < /tmp/bvp_$i.woff2) bytes"
done < /tmp/font_urls.txt
