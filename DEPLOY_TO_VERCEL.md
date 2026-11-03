# 🚀 How to Deploy Fruit Catcher to Vercel (Complete Step-by-Step Guide)

Because this game is built with **Pure Vanilla HTML5, CSS3, and JavaScript**, deploying it on **Vercel** is extremely simple and 100% free.

You have **two easy ways** to deploy:
- **Method 1 (Recommended):** Deploy directly from GitHub to Vercel Dashboard (Zero build step needed).
- **Method 2:** Deploy using the `dist/` folder.
- **Method 3:** Instant deploy using the Vercel CLI (`npx vercel`).

---

## 🌟 Method 1: Deploy via GitHub & Vercel Dashboard (Easiest & Best for Viva)

### Step 1: Push your project to GitHub
1. Open your terminal or Command Prompt in `D:\arcade game`.
2. Initialize git and commit:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of Fruit Catcher arcade game"
   ```
3. Create a new repository on [GitHub](https://github.com) named `fruit-catcher-game`.
4. Push your code:
   ```bash
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/fruit-catcher-game.git
   git push -u origin main
   ```

### Step 2: Import into Vercel
1. Log in to [vercel.com](https://vercel.com) (sign in with your GitHub account).
2. Click the **"Add New..."** button and select **"Project"**.
3. Under **Import Git Repository**, find your `fruit-catcher-game` repository and click **"Import"**.

### Step 3: Configure Project Settings on Vercel
Vercel will show the configuration screen:
- **Framework Preset:** Select **"Other"**.
- **Root Directory:** Leave as `./` (default).
- **Build and Output Settings:**
  - If deploying root: Leave **Build Command** empty and **Output Directory** empty.
  - If deploying from `dist`: Toggle **Output Directory** to **OVERRIDE** and enter `dist`.
- Click **"Deploy"**! 🚀

Within **10 to 15 seconds**, Vercel will give you a live production link:
👉 `https://fruit-catcher-arcade.vercel.app`

---

## 📁 Method 2: Deploying Using the `dist/` Folder

A clean production `dist/` folder has already been created for you containing:
```text
dist/
├── index.html
├── style.css
└── script.js
```

### To configure Vercel to serve only `dist/`:
In your `vercel.json` file or in the Vercel Dashboard:
- Set **Output Directory** to: `dist`
- Vercel will serve `dist/index.html` as the website root.

Whenever you update your code, you can update `dist/` by running:
```powershell
Copy-Item "index.html", "style.css", "script.js" -Destination "dist" -Force
```

---

## ⚡ Method 3: Instant CLI Deployment (Without GitHub)

If you have Node.js and npm installed on your computer:
1. Open PowerShell or Terminal in `D:\arcade game`.
2. Run:
   ```bash
   npx vercel
   ```
3. Follow the quick prompts:
   - *Set up and deploy?* Type **`y`** (Yes)
   - *Which scope?* Press Enter (your account)
   - *Link to existing project?* Type **`n`** (No)
   - *What’s your project’s name?* Press Enter (defaults to `arcade-game` or `fruit-catcher`)
   - *In which directory is your code located?* Press Enter (`./`)
4. Vercel will immediately deploy and output your live URL!

---

## 🛠️ Vercel Configuration File (`vercel.json`)
The included `vercel.json` provides:
- **Clean URLs:** Routes requests cleanly without trailing slashes.
- **Security Headers:** Sets `X-Frame-Options`, `X-Content-Type-Options`, and `X-XSS-Protection`.
- **Cache Optimization:** Automatically caches static JS and CSS files for fast loading.
