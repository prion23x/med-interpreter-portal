#!/bin/bash

LINKS_FILE="links.txt"

if [ ! -f "$LINKS_FILE" ]; then
    echo "Error: $LINKS_FILE not found."
    exit 1
fi

while IFS= read -r url; do
    if [ -n "$url" ]; then
        xdg-open "$url" >/dev/null 2>&1 &
        sleep 0.3    # Small delay to avoid overwhelming the browser
    fi
done < "$LINKS_FILE"

echo "All links have been opened."