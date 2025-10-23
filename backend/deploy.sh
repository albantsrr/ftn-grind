#!/bin/bash
# Script de déploiement du backend FortiFlow sur le VPS
# Usage: ./deploy.sh

set -e  # Exit on error

VPS_IP="72.61.166.22"
VPS_USER="root"
VPS_PATH="/opt/fortiflow/backend"

echo "🚀 Déploiement du backend FortiFlow vers le VPS..."

# 1. Sync les fichiers
echo "📦 Synchronisation des fichiers..."
rsync -avz --exclude='venv' \
           --exclude='__pycache__' \
           --exclude='*.pyc' \
           --exclude='fortiflow.db' \
           --exclude='tests' \
           --exclude='.env' \
           ./ ${VPS_USER}@${VPS_IP}:${VPS_PATH}/

# 2. Rebuild et redémarrer les containers
echo "🔄 Redémarrage des services Docker..."
ssh ${VPS_USER}@${VPS_IP} "cd ${VPS_PATH} && docker compose down && docker compose up -d --build"

# 3. Attendre que le backend soit prêt
echo "⏳ Attente du démarrage de l'API..."
sleep 5

# 4. Test de santé
echo "🏥 Test de santé de l'API..."
if curl -s http://${VPS_IP}/health | grep -q "healthy"; then
    echo "✅ Déploiement réussi ! API disponible sur http://${VPS_IP}"
    echo "📚 Documentation: http://${VPS_IP}/docs"
else
    echo "❌ Échec du test de santé"
    exit 1
fi

# 5. Afficher les logs
echo ""
echo "📋 Derniers logs du backend:"
ssh ${VPS_USER}@${VPS_IP} "cd ${VPS_PATH} && docker compose logs --tail=10 backend"
