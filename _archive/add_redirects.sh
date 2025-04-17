#!/bin/bash
# add_redirects.sh
# Adds a redirect_from block after line 5 in each .markdown file in this folder, except 2022-01-05-100rust-43.markdown

SKIP_FILE="2022-01-05-100rust-43.markdown"

for file in *.markdown; do
  if [[ "$file" == "$SKIP_FILE" ]]; then
    echo "Skipping $file"
    continue
  fi

  # Check if redirect_from already exists
  if grep -q "^redirect_from:" "$file"; then
    echo "redirect_from already present in $file, skipping."
    continue
  fi

  name="${file%.markdown}"
  redirect_block="redirect_from:\n  - /post/$name"

  awk -v block="$redirect_block" 'NR==5{print; print block; next} {print}' "$file" > "$file.tmp" && mv "$file.tmp" "$file"
  echo "Added redirect_from to $file"
done
