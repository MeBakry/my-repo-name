# How to get a shareable link for the sales presentation

External people can view **SALES_PRESENTATION.html** via a public URL. Here are two simple ways using Netlify.

---

## Option 1: Netlify Drop (no account required, ~2 minutes)

1. **Zip the folder**  
   Zip the `04_Launch` folder (so the zip contains `SALES_PRESENTATION.html`, `index.html`, etc.).

2. **Drop it on Netlify**  
   Go to **[app.netlify.com/drop](https://app.netlify.com/drop)** and drag the zip file onto the page.

3. **Get your link**  
   Netlify will deploy it and show a URL like `https://random-name-12345.netlify.app`.  
   Your presentation will be at:  
   **`https://random-name-12345.netlify.app/SALES_PRESENTATION.html`**

4. **Share that link** with anyone. No login needed to view.

- Deploys are temporary on the free tier if you don’t log in; for a permanent link, use Option 2 or sign in and claim the site.

---

## Option 2: Netlify from Git (permanent, auto-updates)

1. **Push your repo**  
   Make sure `04_Launch` (including `SALES_PRESENTATION.html`) is in your Git repo and pushed to GitHub/GitLab/Bitbucket.

2. **Connect the repo to Netlify**  
   - Sign in at **[app.netlify.com](https://app.netlify.com)**  
   - **Add new site** → **Import an existing project** → choose your Git provider and the `pharma` repo  
   - **Build settings:**  
     - **Publish directory:** `04_Launch`  
     - Leave build command empty (static site)  
   - Deploy.

3. **Your shareable link**  
   Netlify will give you a URL like `https://your-site-name.netlify.app`.  
   Send people to:  
   **`https://your-site-name.netlify.app/SALES_PRESENTATION.html`**

4. **Optional: presentation as homepage**  
   If you want `https://your-site-name.netlify.app` to open the sales presentation directly:  
   - In the repo, add a file `04_Launch/index.html` that redirects to the presentation, e.g. a minimal HTML file with:  
     `<meta http-equiv="refresh" content="0;url=SALES_PRESENTATION.html">`  
   - Or rename `SALES_PRESENTATION.html` to `index.html` in `04_Launch` (and keep a copy with the original name if you like).

Every push to the branch you connected will update the site automatically.

---

## Summary

| Method            | Best for              | Shareable URL                                      |
|------------------|------------------------|----------------------------------------------------|
| **Netlify Drop**  | Quick one-off share    | `https://xxx.netlify.app/SALES_PRESENTATION.html`  |
| **Netlify + Git** | Permanent, auto-update | `https://your-site.netlify.app/SALES_PRESENTATION.html` |

Both options serve the file over HTTPS so it’s safe to open in a browser and easy to share by email or chat.
