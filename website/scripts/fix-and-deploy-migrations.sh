#!/bin/bash
# Script to fix failed migrations and deploy
# This handles the case where a migration failed and needs to be resolved

set -e

echo "Generating Prisma Client..."
npx prisma generate

echo "Checking for failed migrations..."

# Try to resolve the failed migration if it exists
if npx prisma migrate resolve --applied 20251229075535_add_usage_model 2>/dev/null; then
  echo "✓ Resolved failed migration"
else
  echo "⚠ Migration already resolved or not found, continuing..."
fi

# Deploy migrations
echo "Deploying migrations..."
npx prisma migrate deploy

echo "✓ Migrations completed successfully"

