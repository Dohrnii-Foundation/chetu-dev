#!/bin/bash

# This script is used to start the application
cd /var/app/current
pm2 start index.js
