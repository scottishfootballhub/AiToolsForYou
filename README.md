# ⚡ LOADOUT

**Every AI tool is loot. Gear up.**

LOADOUT is a static directory of **500+ AI tools**, presented like game gear — each tool is an *item* with a **rarity tier** (Common → Legendary), a rating, save counts, and a pricing pill. Browse by category or rarity, search by task, and "equip" tools to build your personal loadout.

It's a fully static site (HTML/CSS/vanilla JS, no build step, no dependencies), so it deploys to GitHub Pages, Netlify, Vercel, or any static host as-is.

---

## 🚀 Deploy to GitHub Pages (2 minutes)

1. Create a new repository on GitHub (e.g. `loadout`).
2. Upload every file in this folder to the repo root (drag-and-drop works, or use git — see below).
3. In the repo, go to **Settings → Pages**.
4. Under **Build and deployment → Source**, choose **Deploy from a branch**.
5. Pick branch **`main`** and folder **`/ (root)`**, then **Save**.
6. Wait ~1 minute. Your site goes live at `https://<your-username>.github.io/<repo-name>/`.

### Or via the command line

```bash
git init
git add .
git commit -m "Initial commit: LOADOUT"
git branch -M main
git remote add origin https://github.com/<your-username>/<repo-name>.git
git push -u origin main
```

Then enable Pages as in steps 3–6 above.

---

## 📁 Files

| File | Purpose |
|------|---------|
| `index.html` | Page markup and structure |
| `styles.css` | All styling (dark game-loot theme) |
| `app.js` | Search, filtering, sorting, saved state, tool drawer |
| `data.js` | The 500-tool dataset (`window.LOADOUT_DATA`) |
| `logo.svg` | Brand logo / favicon |
| `.nojekyll` | Tells GitHub Pages to serve files as-is |

---

## ✏️ Customizing

- **Add or edit tools:** open `data.js` and edit the `tools` array. Each entry has
  `name`, `category`, `rarity`, `blurb`, `rating`, `saves`, `upvotes`, `pricing`, `daysAgo`, `icon`, `url`, `rank`.
- **Rebrand:** change the name in `index.html` (search for `LOAD`) and the colors at the top of `styles.css` (`:root` variables).
- **Swap the logo:** replace `logo.svg`.
- **Rarity colors:** edit the `--r-*` variables in `styles.css`.

---

## ⚠️ Notes

This is a **demo directory** built for illustration. Tool names, logos, and trademarks belong to their respective owners, and the ratings / save counts are illustrative placeholder stats, not official figures. The "Visit tool" buttons link to a web search for each tool. Replace `url` values in `data.js` with official links before using this commercially.
