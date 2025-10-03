#!/bin/bash

# Stage all changes
echo "Staging changes..."
git add -A || exit 1

# Commit changes with a message
read -p "Enter commit message: " commit_message
if [ -z "$commit_message" ]; then
    echo "Commit message cannot be empty. Exiting."
    exit 1
fi
git commit -m "$commit_message" || exit 1

# Push changes to dev
echo "Pushing changes to dev..."
git push origin dev || exit 1

echo "Development branch is up to date and changes are pushed!"
