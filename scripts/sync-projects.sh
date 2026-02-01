#!/bin/bash
# Sync project files to public folders
# Run this after adding new images or documents

PROJECTS_DIR="projects"
PUBLIC_IMAGES="public/images"
PUBLIC_DOWNLOADS="public/downloads"

# Get all project slugs
for project_dir in $PROJECTS_DIR/*/; do
    slug=$(basename "$project_dir")
    echo "Syncing project: $slug"

    # Sync images from pics/ to public/images/
    if [ -d "$project_dir/pics" ]; then
        mkdir -p "$PUBLIC_IMAGES/$slug"

        # Sync modules
        if [ -d "$project_dir/pics/modules" ]; then
            mkdir -p "$PUBLIC_IMAGES/$slug/modules"
            cp -u "$project_dir/pics/modules/"*.{png,jpg,jpeg,webp} "$PUBLIC_IMAGES/$slug/modules/" 2>/dev/null
            echo "  - Synced modules images"
        fi

        # Sync build photos
        if [ -d "$project_dir/pics/build" ]; then
            mkdir -p "$PUBLIC_IMAGES/$slug/build"
            cp -u "$project_dir/pics/build/"*.{png,jpg,jpeg,webp} "$PUBLIC_IMAGES/$slug/build/" 2>/dev/null
            echo "  - Synced build images"
        fi
    fi

    # Sync downloads (md and pdf files)
    mkdir -p "$PUBLIC_DOWNLOADS/$slug"

    # Copy markdown files (except README)
    for file in "$project_dir"/*.md; do
        filename=$(basename "$file")
        if [ "$filename" != "README.md" ]; then
            cp -u "$file" "$PUBLIC_DOWNLOADS/$slug/"
            echo "  - Synced $filename"
        fi
    done

    # Copy PDF files
    for file in "$project_dir"/*.pdf; do
        if [ -f "$file" ]; then
            cp -u "$file" "$PUBLIC_DOWNLOADS/$slug/"
            echo "  - Synced $(basename "$file")"
        fi
    done

    echo ""
done

echo "Sync complete!"
