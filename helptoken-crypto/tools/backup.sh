#!/bin/bash
echo "💾 Creating HelpToken backup..."

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="backups/backup_$TIMESTAMP"

mkdir -p "$BACKUP_DIR"

# Backup configuration files
echo "📋 Backing up configuration..."
cp frontend/.env.local "$BACKUP_DIR/" 2>/dev/null || echo "No frontend .env.local found"
cp backend/.env "$BACKUP_DIR/" 2>/dev/null || echo "No backend .env found"

# Backup municipal configurations
if [ -d "municipal-configs" ]; then
    cp -r municipal-configs "$BACKUP_DIR/"
    echo "✅ Municipal configs backed up"
fi

# Backup reports
if [ -d "reports" ]; then
    cp -r reports "$BACKUP_DIR/"
    echo "✅ Reports backed up"
fi

# Backup database (if using local PostgreSQL)
if command -v pg_dump &> /dev/null; then
    echo "🗄️ Backing up database..."
    pg_dump helptoken > "$BACKUP_DIR/database.sql" 2>/dev/null || echo "Database backup skipped"
fi

# Create backup info
cat > "$BACKUP_DIR/backup_info.txt" << EOF
HelpToken Backup Information
Created: $(date)
Version: 1.0.0
Included:
- Configuration files
- Municipal configurations
- Reports
- Database (if available)
EOF

echo "✅ Backup created in $BACKUP_DIR"
echo "📦 Backup size: $(du -sh $BACKUP_DIR | cut -f1)"
