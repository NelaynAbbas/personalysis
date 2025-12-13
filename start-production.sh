#!/bin/bash
# Production startup script for PersonalysisPro platform
export NODE_ENV=production
echo "Starting PersonalysisPro in PRODUCTION mode..."
tsx server/index.ts