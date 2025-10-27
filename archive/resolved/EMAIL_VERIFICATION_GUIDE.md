# 📧 Système de Vérification d'Email et Réinitialisation de Mot de Passe

## Vue d'ensemble

FortiFlow intègre maintenant un système complet de gestion des emails :
- **Vérification d'email** lors de l'inscription
- **Réinitialisation de mot de passe** via email
- **Tokens sécurisés** avec expiration (24h)

---

## 🎯 Fonctionnalités

### 1. Vérification d'Email

**Flow utilisateur :**
1. L'utilisateur s'inscrit avec un email
2. Un email de vérification est automatiquement envoyé
3. L'utilisateur clique sur le lien dans l'email
4. Le compte est vérifié

**Endpoints backend :**
- `POST /api/auth/register` - Envoie automatiquement l'email de vérification
- `POST /api/auth/verify-email` - Vérifie le token
- `POST /api/auth/resend-verification` - Renvoie l'email (nécessite authentification)

**Pages frontend :**
- `/verify-email?token=xxx` - Page de vérification

### 2. Réinitialisation de Mot de Passe

**Flow utilisateur :**
1. L'utilisateur clique sur "Mot de passe oublié ?" sur la page de login
2. Il entre son email
3. Il reçoit un email avec un lien de réinitialisation
4. Il clique sur le lien et entre un nouveau mot de passe
5. Il peut se connecter avec le nouveau mot de passe

**Endpoints backend :**
- `POST /api/auth/forgot-password` - Envoie l'email de réinitialisation
- `POST /api/auth/reset-password` - Réinitialise le mot de passe avec le token

**Pages frontend :**
- `/forgot-password` - Demande de réinitialisation
- `/reset-password?token=xxx` - Formulaire de nouveau mot de passe

---

## 🗄️ Schéma de Base de Données

**Nouveaux champs dans `users` table :**

```sql
is_verified BOOLEAN DEFAULT 0           -- Statut de vérification d'email
verification_token TEXT                  -- Token pour vérifier l'email
reset_token TEXT                         -- Token pour réinitialiser le mot de passe
reset_token_expires DATETIME             -- Expiration du token de réinitialisation
```

**Migration :**
```bash
cd backend
python migrate_add_email_verification.py
```

---

## 🔧 Configuration

### Mode Développement (Actuel)

Les emails sont **loggés dans la console** au lieu d'être envoyés. Vous verrez :

```
================================================================================
📧 EMAIL VERIFICATION
================================================================================
To: user@example.com
Subject: Verify your FortiFlow account
--------------------------------------------------------------------------------
Hello username,

Welcome to FortiFlow! Please verify your email address by clicking the link below:

🔗 http://localhost:5173/verify-email?token=xxx

This link will expire in 24 hours.
================================================================================
```

### Mode Production (Future)

Pour activer l'envoi réel d'emails, modifiez `backend/email_utils.py` :

**Options recommandées :**
1. **SendGrid** - Simple et fiable
2. **AWS SES** - Scalable et économique
3. **Mailgun** - Bon pour les développeurs
4. **SMTP Gmail** - Simple mais limité

**Exemple avec SendGrid :**

```python
import os
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

SENDGRID_API_KEY = os.getenv('SENDGRID_API_KEY')
FROM_EMAIL = 'noreply@fortiflow.com'

def send_verification_email(email: str, username: str, token: str) -> bool:
    verification_url = f"https://fortiflow.com/verify-email?token={token}"

    message = Mail(
        from_email=FROM_EMAIL,
        to_emails=email,
        subject='Verify your FortiFlow account',
        html_content=f'''
        <h2>Welcome to FortiFlow, {username}!</h2>
        <p>Please verify your email address:</p>
        <a href="{verification_url}">Verify Email</a>
        <p>This link expires in 24 hours.</p>
        '''
    )

    try:
        sg = SendGridAPIClient(SENDGRID_API_KEY)
        sg.send(message)
        return True
    except Exception as e:
        print(f"Error sending email: {e}")
        return False
```

---

## 🧪 Tests

### Tester la Vérification d'Email

1. Inscrivez un nouvel utilisateur :
```bash
POST http://localhost:3000/api/auth/register
{
  "email": "test@example.com",
  "username": "testuser",
  "password": "password123"
}
```

2. Vérifiez la console backend pour le lien de vérification

3. Copiez le token et testez :
```bash
POST http://localhost:3000/api/auth/verify-email
{
  "token": "xxx"
}
```

### Tester la Réinitialisation de Mot de Passe

1. Demandez une réinitialisation :
```bash
POST http://localhost:3000/api/auth/forgot-password
{
  "email": "test@example.com"
}
```

2. Vérifiez la console backend pour le lien

3. Copiez le token et réinitialisez :
```bash
POST http://localhost:3000/api/auth/reset-password
{
  "token": "xxx",
  "new_password": "newpassword123"
}
```

---

## 🔐 Sécurité

### Bonnes Pratiques Implémentées

✅ **Tokens sécurisés** - Générés avec `secrets.token_urlsafe(32)`
✅ **Expiration** - 24h pour tous les tokens
✅ **Protection contre l'énumération** - Même message que l'email existe ou non
✅ **Tokens à usage unique** - Supprimés après utilisation
✅ **HTTPS recommandé** - Pour les liens de production

### Améliorations Futures

- [ ] Rate limiting sur les endpoints d'email
- [ ] CAPTCHA sur forgot-password
- [ ] Notification de changement de mot de passe
- [ ] Historique des tentatives de connexion
- [ ] 2FA (Two-Factor Authentication)

---

## 📱 Interface Utilisateur

### Pages Créées

1. **ForgotPassword** (`/forgot-password`)
   - Formulaire simple avec email
   - Design cohérent avec le reste de l'app
   - Toast notifications
   - Confirmation après envoi

2. **ResetPassword** (`/reset-password?token=xxx`)
   - Validation de mot de passe
   - Indicateur de force du mot de passe
   - Toggle show/hide password
   - Redirection auto après succès

3. **VerifyEmail** (`/verify-email?token=xxx`)
   - Vérification automatique au chargement
   - États : loading, success, error
   - Boutons d'action contextuelle

### Design

- Palette indigo-purple cohérente
- Support dark mode complet
- Animations fluides
- Responsive mobile-first

---

## 🚀 Déploiement

### Checklist avant Production

- [ ] Configurer un service d'email (SendGrid, AWS SES, etc.)
- [ ] Mettre à jour les URLs dans `email_utils.py` (localhost → production)
- [ ] Ajouter les variables d'environnement pour les clés API
- [ ] Tester l'envoi réel d'emails
- [ ] Configurer le SPF/DKIM pour éviter le spam
- [ ] Monitorer les taux de délivrabilité

### Variables d'Environnement

```env
# Email Configuration
EMAIL_SERVICE=sendgrid  # ou ses, mailgun, smtp
SENDGRID_API_KEY=your_api_key_here
FROM_EMAIL=noreply@fortiflow.com
FRONTEND_URL=https://fortiflow.com
```

---

## 📞 Support

Si vous avez des questions sur l'implémentation ou besoin d'aide pour configurer un service d'email en production, consultez :

- [SendGrid Documentation](https://docs.sendgrid.com/)
- [AWS SES Documentation](https://docs.aws.amazon.com/ses/)
- [Mailgun Documentation](https://documentation.mailgun.com/)

---

**Date de création** : 2025-01-XX
**Version** : 1.0.0
**Auteur** : FortiFlow Team
