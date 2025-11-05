# GitHub Actions Secrets Configuration

This document provides the exact secrets you need to configure in GitHub for automated CI/CD deployment (Phase 2).

## 📍 Where to Configure

Go to: **GitHub Repository → Settings → Secrets and variables → Actions → New repository secret**

URL: `https://github.com/YOUR_USERNAME/ftn-grind/settings/secrets/actions`

---

## 🔑 Required Secrets

### 1. `VPS_HOST`

**Value:**
```
72.61.166.22
```

**Description:** IP address of your VPS server

---

### 2. `VPS_USER`

**Value:**
```
root
```

**Description:** SSH user for VPS access

---

### 3. `VPS_SSH_KEY`

**Value:** (Copy the ENTIRE private key below, including BEGIN/END lines)

```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
QyNTUxOQAAACBiwY1clNs9xC3EFO01oCeZ51MPLeakLaG6S6Xgwv0mAwAAAKCDqoHRg6qB
0QAAAAtzc2gtZWQyNTUxOQAAACBiwY1clNs9xC3EFO01oCeZ51MPLeakLaG6S6Xgwv0mAw
AAAEB6gpObfSzHFlHNg0v+NUti1PciRLQCF6lepWcbr+/m42LBjVyU2z3ELcQU7TWgJ5nn
Uw8t5qQtobpLpeDC/SYDAAAAGGdpdGh1Yi1hY3Rpb25zLWZvcnRpZmxvdwECAwQF
-----END OPENSSH PRIVATE KEY-----
```

**Description:** Private SSH key for GitHub Actions to access VPS

**⚠️ IMPORTANT:**
- Copy the **entire** key including the `-----BEGIN OPENSSH PRIVATE KEY-----` and `-----END OPENSSH PRIVATE KEY-----` lines
- Do NOT add any extra spaces or newlines
- Keep this secret safe - never commit it to Git!

---

### 4. `VPS_DEV_PATH`

**Value:**
```
/opt/fortiflow/dev
```

**Description:** Path to the development environment on VPS

---

### 5. `VPS_PROD_PATH`

**Value:**
```
/opt/fortiflow/prod
```

**Description:** Path to the production environment on VPS

---

## ✅ Verification

After adding all secrets, you should see 5 secrets configured:

- `VPS_HOST`
- `VPS_USER`
- `VPS_SSH_KEY`
- `VPS_DEV_PATH`
- `VPS_PROD_PATH`

---

## 🧪 Testing SSH Connection

To verify the SSH key works from your local machine (optional):

```bash
# Save the private key to a temporary file
cat > /tmp/github_actions_key << 'EOF'
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
QyNTUxOQAAACBiwY1clNs9xC3EFO01oCeZ51MPLeakLaG6S6Xgwv0mAwAAAKCDqoHRg6qB
0QAAAAtzc2gtZWQyNTUxOQAAACBiwY1clNs9xC3EFO01oCeZ51MPLeakLaG6S6Xgwv0mAw
AAAEB6gpObfSzHFlHNg0v+NUti1PciRLQCF6lepWcbr+/m42LBjVyU2z3ELcQU7TWgJ5nn
Uw8t5qQtobpLpeDC/SYDAAAAGGdpdGh1Yi1hY3Rpb25zLWZvcnRpZmxvdwECAwQF
-----END OPENSSH PRIVATE KEY-----
EOF

# Set proper permissions
chmod 600 /tmp/github_actions_key

# Test SSH connection
ssh -i /tmp/github_actions_key root@72.61.166.22 "echo 'SSH connection successful!'"

# Clean up
rm /tmp/github_actions_key
```

If you see "SSH connection successful!", the key is configured correctly!

---

## 🔒 Security Best Practices

1. **Never commit secrets to Git**: The private key must ONLY exist in:
   - GitHub Secrets (encrypted)
   - VPS server (`~/.ssh/github_actions_fortiflow`)

2. **Dedicated key**: This key is ONLY for GitHub Actions, separate from your personal SSH keys

3. **Key rotation**: If compromised, generate a new key:
   ```bash
   ssh root@72.61.166.22
   ssh-keygen -t ed25519 -C 'github-actions-fortiflow' -f ~/.ssh/github_actions_fortiflow
   cat ~/.ssh/github_actions_fortiflow.pub >> ~/.ssh/authorized_keys
   # Update GitHub Secret VPS_SSH_KEY with new private key
   ```

4. **Minimal permissions**: The key only has access to `root@72.61.166.22`, nothing else

---

## 📋 Quick Copy-Paste Checklist

Use this checklist when configuring secrets:

- [ ] Navigate to GitHub → Settings → Secrets → Actions
- [ ] Create `VPS_HOST` = `72.61.166.22`
- [ ] Create `VPS_USER` = `root`
- [ ] Create `VPS_SSH_KEY` = (paste entire private key from above)
- [ ] Create `VPS_DEV_PATH` = `/opt/fortiflow/dev`
- [ ] Create `VPS_PROD_PATH` = `/opt/fortiflow/prod`
- [ ] Verify 5 secrets are listed
- [ ] Test SSH connection (optional)

---

## 🚀 Next Steps

Once these secrets are configured, you're ready for **Phase 2: CI/CD Pipeline**!

The GitHub Actions workflows will use these secrets to:
- ✅ Run automated tests on every push
- ✅ Deploy to dev environment automatically
- ✅ Deploy to prod with manual approval
- ✅ Auto-publish releases

See [../WORKFLOW_IMPROVEMENTS_PHASE2.md](../WORKFLOW_IMPROVEMENTS_PHASE2.md) for Phase 2 implementation.

---

## ❓ Troubleshooting

### Error: "Permission denied (publickey)"

**Cause:** SSH key not properly configured

**Fix:**
1. Verify the private key in GitHub Secret includes BEGIN/END lines
2. Check that public key was added to `~/.ssh/authorized_keys` on VPS:
   ```bash
   ssh root@72.61.166.22 "cat ~/.ssh/authorized_keys | grep github-actions-fortiflow"
   ```

### Error: "Host key verification failed"

**Cause:** VPS host key not in known_hosts

**Fix:** GitHub Actions workflows should include `StrictHostKeyChecking=no` for first connection:
```yaml
- name: Deploy to VPS
  run: |
    ssh -o StrictHostKeyChecking=no -i $SSH_KEY root@$VPS_HOST "cd /opt/fortiflow/prod && git pull"
```

### Error: "Could not resolve hostname"

**Cause:** `VPS_HOST` secret not configured or incorrect

**Fix:** Double-check the IP address `72.61.166.22` is correctly entered in GitHub Secrets

---

**Configuration complete! Ready for automated deployments! 🎉**
