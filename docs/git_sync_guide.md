# Git Sync Guide: Pushing to Multiple Remotes

This guide explains how to add a new remote repository and push your local branches to it. This is useful when you want to mirror your code across different platforms or move to a new repository.

## Quick Commands (For This Project)

If you have already added the remote, use these commands to push your current branches to the `ksdivesh` repository:

```bash
# Push main branch
git push ksdivesh main

# Push dev branch
git push ksdivesh dev

# Push all local branches at once
git push ksdivesh --all
```

---

## 1. Check Current Remotes
Before adding a new remote, check which ones are already configured:
```bash
git remote -v
```

## 2. Add a New Remote
To add a new remote, use the `git remote add` command followed by a short name (e.g., `ksdivesh`) and the repository URL.

**For this project:**
```bash
git remote add ksdivesh https://github.com/ksdivesh/sbexpress-fe
```

## 3. Push Branches to the New Remote
Once the remote is added, you can push your local branches.

**For this project:**
```bash
# Push the main branch
git push ksdivesh main

# Push the dev branch
git push ksdivesh dev
```

### Push All Local Branches
If you want to push all your local branches at once:
```bash
git push ksdivesh --all
```

### Push Tags
If you have tags that you want to sync:
```bash
git push ksdivesh --tags
```

## 4. Verify the Sync
List the remotes again to confirm the new one is listed correctly:
```bash
git remote -v
```
You can also check the status of your branches relative to the new remote:
```bash
git branch -a
```

---
*Note: If you want to make the new remote your default for pushing and pulling, you can use `git push -u ksdivesh <branch-name>` once.*
