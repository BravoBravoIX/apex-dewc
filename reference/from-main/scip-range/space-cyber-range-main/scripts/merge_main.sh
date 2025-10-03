#!/bin/bash

# Switch to main branch
echo "Switching to main branch..."
git checkout main || exit 1

# Merge dev into main
echo "Merging dev into main..."
git merge dev || exit 1

# Push the updated main branch
echo "Pushing updated main branch..."
git push origin main || exit 1

echo "Dev branch has been successfully merged into main!"
