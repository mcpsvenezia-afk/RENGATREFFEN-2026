# 🧬 SKILL: GITHUB_DEPLOYMENT_PROTOCOL_v1
Goal: Ensure absolute synchronization between Local, GitHub, and Vercel Live Environment.

## 🚩 Context
In projects where **Vercel is linked to a GitHub Repository**, a simple `vercel deploy` command creates a preview/alias, but does NOT update the main Production URL. To update the Production site, code MUST be pushed to the `main` branch.

## 🛠️ Mandatory Workflow

1.  **Check Remote Status:**
    Before any deployment attempt, always check:
    ```powershell
    git remote -v
    ```

2.  **Add Untracked Files:**
    New plugins, schemas, or migrations are often created by AI but not tracked. Always run:
    ```powershell
    git add .
    ```

3.  **Semantic Commits:**
    Use descriptive messages to track changes in the Vercel Dashboard:
    ```powershell
    git commit -m "🧬 FIX: Description of changes"
    ```

4.  **Production Push:**
    The ONLY way to update the official link (e.g., rengatreffen-2026.vercel.app) is:
    ```powershell
    git push origin main
    ```

## ⚠️ Critical Warnings
- **Cache Loop:** If the user sees old code after a push, append a query parameter (e.g., `?v=2`) to the URL to bypass browser cache.
- **Ignored Files:** Check `.gitignore` to ensure crucial public assets (like `favicon.png`) are not being ignored.
- **CLI vs Git:** Never use `vercel --prod` if GitHub integration is active, as it creates a "Shadow Deployment" that complicates version tracking.

---
*Created on 25/01/2026 to ensure 100% reliability in Renga Treffen deployments.*
