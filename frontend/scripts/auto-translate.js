#!/usr/bin/env node

/**
 * Auto-translation script for FortiFlow
 *
 * This script automatically replaces hardcoded French/English text
 * with i18n translation keys using react-i18next.
 *
 * Usage: node scripts/auto-translate.js
 */

const fs = require('fs');
const path = require('path');

// Translation mappings: { "hardcoded text": "namespace:key" }
const translationMap = {
  // Common
  "Loading...": "common:loading",
  "Cancel": "common:cancel",
  "Save": "common:save",
  "Delete": "common:delete",
  "Edit": "common:edit",
  "Logout": "common:logout",

  // Settings page (French)
  "Paramètres": "settings:title",
  "Gérez votre profil et vos préférences": "settings:subtitle",
  "Informations du Profil": "settings:profile.title",
  "Nom d'utilisateur": "settings:profile.username",
  "Adresse email": "settings:profile.email",
  "Nom complet (optionnel)": "settings:profile.fullName",
  "Email vérifié": "settings:profile.emailVerified",
  "Email non vérifié": "settings:profile.emailNotVerified",
  "Renvoyer l'email de vérification": "settings:profile.resendVerification",
  "Modifier le Profil": "settings:profile.updateButton",
  "Modification...": "settings:profile.updating",
  "Changer le mot de passe": "settings:password.title",
  "Mot de passe actuel": "settings:password.currentPassword",
  "Nouveau mot de passe": "settings:password.newPassword",
  "Confirmer le nouveau mot de passe": "settings:password.confirmPassword",
  "Modifier le mot de passe": "settings:password.changeButton",
  "Annuler": "common:cancel",
  "Abonnement": "settings:subscription.title",
  "Plan Gratuit": "settings:subscription.freePlan",
  "ACTIF": "settings:subscription.active",
  "Routines": "settings:subscription.routines",
  "Illimité": "settings:subscription.unlimited",
  "Passer au Premium": "settings:subscription.upgradeToPremium",
  "Zone de Danger": "settings:danger.title",
  "Supprimer le compte": "settings:danger.deleteAccount",

  // Settings success messages
  "Profil modifié avec succès": "settings:success.profileUpdated",
  "Mot de passe modifié avec succès": "settings:success.passwordChanged",
  "Email de vérification envoyé": "settings:success.verificationSent",

  // Settings errors
  "Le nom d'utilisateur et l'email sont requis": "settings:errors.usernameEmailRequired",
  "Le nouveau mot de passe doit contenir au moins 6 caractères": "settings:errors.passwordTooShort",
  "Les mots de passe ne correspondent pas": "settings:errors.passwordMismatch",

  // RoutinesList (French toast messages)
  "Routine supprimée avec succès": "routines:success.deleted",
  "Erreur lors de la suppression": "routines:errors.deleteFailed",
  "Routine exportée": "routines:success.exported",
  "Aucune routine à exporter": "routines:errors.noRoutinesToExport",
  "routine(s) exportée(s)": "routines:success.exported",
  "Routine partagée avec la communauté": "routines:success.shared",
  "Routine retirée de la communauté": "routines:success.unshared",
  "Erreur lors du partage": "routines:errors.shareFailed",
  "Erreur lors de l'importation": "routines:errors.importFailed",
  "routine(s) importée(s)": "routines:success.imported",
  "échouée(s)": "routines:errors.importFailed",

  // RoutinesList UI
  "My Routines": "routines:myRoutines",
  "routine(s) ready": "routines:routinesReady",
  "Search routines": "routines:searchPlaceholder",
  "No routines found": "routines:noResults",
  "Try adjusting your search terms": "routines:noResultsSubtitle",
  "Clear search": "routines:clearSearch",
  "No routines yet": "routines:noRoutines",
  "Create your first training routine": "routines:noRoutinesSubtitle",

  // Login
  "Mot de passe oublié ?": "auth:login.forgotPassword",
  "Username": "auth:login.username",
  "Password": "auth:login.password",
  "Login": "auth:login.loginButton",
  "Logging in...": "auth:login.loggingIn",
  "Don't have an account?": "auth:login.noAccount",
  "Register here": "auth:login.registerHere",

  // Statistics
  "Statistiques": "statistics:title",
  "Suivez votre progression et vos performances": "statistics:subtitle",
  "Erreur lors du chargement des statistiques": "statistics:errors.loadFailed",

  // Community
  "Erreur lors du chargement des routines communautaires": "community:errors.loadFailed",
  "Community": "community:title",

  // Sidebar
  "My Routines": "components:sidebar.myRoutines",
  "Community": "components:sidebar.community",
  "Statistics": "components:sidebar.statistics",
  "Billing": "components:sidebar.billing",
  "Settings": "components:sidebar.settings",
  "Free Plan": "components:sidebar.freePlan",
  "Premium": "components:sidebar.premium",
};

// Files to process
const filesToProcess = [
  'src/pages/Settings.tsx',
  'src/pages/RoutinesList.tsx',
  'src/pages/Login.tsx',
  'src/pages/Register.tsx',
  'src/pages/Statistics.tsx',
  'src/pages/Community.tsx',
  'src/pages/Billing.tsx',
  'src/components/Sidebar.tsx',
  'src/components/PaywallModal.tsx',
];

function addTranslationImport(content, namespace = 'common') {
  // Check if useTranslation is already imported
  if (content.includes('useTranslation')) {
    return content;
  }

  // Find the last import statement
  const importRegex = /import .+ from .+;/g;
  const imports = content.match(importRegex);

  if (imports && imports.length > 0) {
    const lastImport = imports[imports.length - 1];
    const translationImport = `import { useTranslation } from 'react-i18next';`;
    return content.replace(lastImport, `${lastImport}\n${translationImport}`);
  }

  return content;
}

function addTranslationHook(content) {
  // Check if translation hook is already added
  if (content.includes('const { t }') || content.includes('const {t}')) {
    return content;
  }

  // Find the component function declaration
  const functionMatch = content.match(/(export default function \w+\([^)]*\) \{)/);

  if (functionMatch) {
    const functionDecl = functionMatch[1];
    const hookDecl = `  const { t } = useTranslation();`;
    return content.replace(functionDecl, `${functionDecl}\n${hookDecl}\n`);
  }

  return content;
}

function replaceHardcodedText(content) {
  let modifiedContent = content;

  for (const [text, key] of Object.entries(translationMap)) {
    // Escape special regex characters
    const escapedText = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Replace in JSX text (between tags)
    const jsxTextRegex = new RegExp(`>(${escapedText})<`, 'g');
    modifiedContent = modifiedContent.replace(jsxTextRegex, `>{t('${key}')}<`);

    // Replace in string literals (single quotes)
    const singleQuoteRegex = new RegExp(`'${escapedText}'`, 'g');
    modifiedContent = modifiedContent.replace(singleQuoteRegex, `t('${key}')`);

    // Replace in string literals (double quotes)
    const doubleQuoteRegex = new RegExp(`"${escapedText}"`, 'g');
    modifiedContent = modifiedContent.replace(doubleQuoteRegex, `t('${key}')`);

    // Replace in template literals (backticks) - only standalone
    const backtickRegex = new RegExp(`\`${escapedText}\``, 'g');
    modifiedContent = modifiedContent.replace(backtickRegex, `t('${key}')`);
  }

  return modifiedContent;
}

function processFile(filePath) {
  const fullPath = path.join(__dirname, '..', filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return;
  }

  console.log(`📝 Processing: ${filePath}`);

  let content = fs.readFileSync(fullPath, 'utf8');

  // Step 1: Add import
  content = addTranslationImport(content);

  // Step 2: Add translation hook
  content = addTranslationHook(content);

  // Step 3: Replace hardcoded text
  content = replaceHardcodedText(content);

  // Write back to file
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`✅ Completed: ${filePath}`);
}

function main() {
  console.log('🚀 Starting auto-translation...\n');

  filesToProcess.forEach(file => {
    try {
      processFile(file);
    } catch (error) {
      console.error(`❌ Error processing ${file}:`, error.message);
    }
  });

  console.log('\n✨ Auto-translation complete!');
  console.log('\n⚠️  IMPORTANT: Please review all changes manually before committing.');
  console.log('Some replacements may need manual adjustment, especially:');
  console.log('  - Dynamic content with variables');
  console.log('  - Pluralization cases');
  console.log('  - Complex template literals');
}

main();
