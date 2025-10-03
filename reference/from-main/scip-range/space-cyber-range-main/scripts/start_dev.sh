#!/bin/bash

# Switch to dev branch
echo "Switching to dev branch..."
git checkout dev || exit 1

# Pull the latest changes from dev
echo "Pulling latest changes from dev..."
git pull origin dev || exit 1

# Ask if user wants to merge main into dev
read -p "Do you want to merge main into dev? (y/n): " merge_choice
if [[ "$merge_choice" == "y" || "$merge_choice" == "Y" ]]; then
    echo "Merging main into dev..."
    git merge main || exit 1
    echo "Successfully merged main into dev!"
else
    echo "Skipped merging main into dev."
fi

echo "Development branch is up to date and ready to work!"
