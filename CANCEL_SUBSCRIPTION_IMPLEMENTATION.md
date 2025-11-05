# Implémentation de l'Annulation d'Abonnement

## Vue d'ensemble

Cette fonctionnalité permet aux utilisateurs Premium d'annuler leur abonnement directement depuis l'interface FortiFlow, sans avoir à passer par le portail Stripe.

## Fonctionnalités implémentées

### 1. Backend - Endpoint d'annulation

**Fichier**: `backend/routers/subscriptions.py`

Ajout d'un nouvel endpoint POST `/api/subscriptions/cancel`:
- Annule l'abonnement Stripe à la fin de la période de facturation
- Met à jour le flag `cancel_at_period_end` dans la base de données
- Renvoie la date de fin de période
- Gère les erreurs Stripe et les cas limites (pas d'abonnement actif, etc.)

**Comportement**:
- L'abonnement reste actif jusqu'à la fin de la période payée
- L'utilisateur conserve l'accès Premium jusqu'à la date d'expiration
- Aucun remboursement automatique (facturation déjà effectuée)
- Peut être réactivé via le portail Stripe avant la fin de période

### 2. Frontend - Fonction API

**Fichier**: `frontend/src/services/api.ts`

Ajout de la fonction `cancelSubscription()`:
```typescript
async cancelSubscription(): Promise<{ success: boolean; message: string; period_end: string }>
```

### 3. Interface utilisateur - Page Billing

**Fichier**: `frontend/src/pages/Billing.tsx`

#### Modifications:
1. **Nouveaux états**:
   - `canceling`: État de chargement pendant l'annulation
   - `showCancelModal`: Affichage de la modal de confirmation

2. **Bouton d'annulation**:
   - Bouton rouge "Cancel Subscription" visible uniquement si:
     - L'utilisateur est Premium
     - L'abonnement est actif
     - L'annulation n'a pas déjà été demandée (`cancel_at_period_end === false`)
   - Ouvre une modal de confirmation

3. **Modal de confirmation**:
   - Titre clair: "Cancel Subscription?"
   - Explication du processus:
     - Conservation de l'accès Premium jusqu'à la date de fin
     - Rétrogradation au plan Free après
     - Possibilité de réactivation
     - Aucune charge après annulation
   - Deux boutons:
     - "Keep Premium" (gris) - Ferme la modal
     - "Yes, Cancel" (rouge) - Confirme l'annulation

4. **Affichage de l'état**:
   - Avertissement visible si `cancel_at_period_end === true`:
     ```
     ⚠️ Your subscription will be canceled at the end of the billing period.
     ```
   - Texte d'aide mis à jour sous les boutons

## Flux utilisateur

### Scénario 1: Annulation réussie
1. L'utilisateur clique sur "Cancel Subscription"
2. Une modal de confirmation s'affiche
3. L'utilisateur clique sur "Yes, Cancel"
4. Requête API envoyée au backend
5. Backend annule l'abonnement Stripe (cancel_at_period_end=true)
6. Message de succès affiché: "Subscription will be canceled at the end of the billing period"
7. L'interface se met à jour pour afficher l'avertissement
8. Le bouton "Cancel Subscription" disparaît (déjà annulé)

### Scénario 2: Changement d'avis
1. L'utilisateur clique sur "Cancel Subscription"
2. La modal s'affiche
3. L'utilisateur clique sur "Keep Premium"
4. La modal se ferme, rien n'est modifié

### Scénario 3: Réactivation (via Stripe Portal)
1. L'utilisateur a déjà annulé son abonnement
2. Il clique sur "Manage Subscription" → redirigé vers Stripe Portal
3. Dans le portail, il peut "Reactivate subscription"
4. Le webhook Stripe met à jour `cancel_at_period_end = false`
5. À son retour sur FortiFlow, le bouton "Cancel Subscription" réapparaît

## Webhooks Stripe concernés

Les webhooks existants gèrent automatiquement les événements:

1. **`customer.subscription.updated`**:
   - Met à jour `cancel_at_period_end` si modifié dans Stripe
   - Synchronise le statut de l'abonnement

2. **`customer.subscription.deleted`**:
   - Déclenché à la fin de la période si annulation confirmée
   - Rétrograde l'utilisateur au plan Free
   - Met le statut à "canceled"

## Tests à effectuer

### Tests manuels recommandés:

1. **Test de base**:
   - ✅ Utilisateur Premium peut voir le bouton "Cancel Subscription"
   - ✅ Clic ouvre la modal de confirmation
   - ✅ La modal affiche les bonnes informations (date de fin)
   - ✅ "Keep Premium" ferme la modal sans action
   - ✅ "Yes, Cancel" déclenche l'annulation

2. **Test de la confirmation d'annulation**:
   - ✅ Message de succès affiché après annulation
   - ✅ Avertissement visible: "subscription will be canceled at the end..."
   - ✅ Bouton "Cancel Subscription" disparaît
   - ✅ Date de fin affichée correctement

3. **Test des cas limites**:
   - ✅ Utilisateur Free ne voit pas le bouton
   - ✅ Abonnement déjà annulé ne montre pas le bouton
   - ✅ Gestion d'erreur si annulation échoue

4. **Test de réactivation** (via Stripe Portal):
   - Annuler un abonnement
   - Ouvrir le portail Stripe
   - Réactiver l'abonnement
   - Vérifier que le bouton "Cancel" réapparaît

### Tests en environnement de test Stripe:

```bash
# Carte de test Stripe
4242 4242 4242 4242
Expiration: n'importe quelle date future
CVC: n'importe quel code à 3 chiffres
```

## Commandes de déploiement

### Backend:
```bash
cd backend
./scripts/deploy-backend.sh
```

### Frontend (si build Tauri):
```bash
cd frontend
npm run build
npm run tauri:build
```

## Notes importantes

- **Pas de remboursement automatique**: L'annulation se fait à la fin de la période, l'utilisateur garde l'accès jusqu'à expiration
- **Reversible**: L'utilisateur peut réactiver via le portail Stripe avant la date d'expiration
- **Synchronisation webhook**: Les changements dans Stripe sont automatiquement synchronisés via les webhooks
- **Grace period**: L'utilisateur Premium garde tous ses avantages jusqu'à la fin de la période payée

## Améliorations futures possibles

1. **Feedback utilisateur**: Ajouter un formulaire de feedback lors de l'annulation
2. **Offres de rétention**: Proposer un mois gratuit ou une réduction pour éviter l'annulation
3. **Email de confirmation**: Envoyer un email récapitulatif après annulation
4. **Rappel avant expiration**: Email automatique 3 jours avant la fin de période
5. **Statistiques d'annulation**: Tracker les raisons d'annulation pour améliorer le service
