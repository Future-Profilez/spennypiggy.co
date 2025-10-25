#!/bin/bash

# Start Queue Worker for Email Processing
# This script should be run to ensure email jobs are processed

echo "Starting Laravel Queue Worker for Email Processing..."
echo "Press Ctrl+C to stop the worker"
echo "----------------------------------------"

# Change to the project directory
cd /Users/naveentehrpariya/Office/spennypiggy.co

# Start the queue worker
php artisan queue:work --verbose --tries=3 --timeout=90 --memory=512 --sleep=3 --max-jobs=1000 --max-time=3600

echo "Queue worker stopped."