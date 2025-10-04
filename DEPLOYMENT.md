# BrainTrain Quiz - Deployment Guide

## Quick Start: Deploy to Vercel (Recommended - 2 minutes)

### Option 1: Deploy via Vercel CLI
1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. From your project directory, run:
   ```bash
   vercel
   ```

3. Follow the prompts:
   - Set up and deploy: **Yes**
   - Which scope: Choose your account
   - Link to existing project: **No**
   - Project name: **braintrain-quiz** (or your choice)
   - Directory: **./** (just press Enter)
   - Override settings: **No**

4. Your quiz will be live! You'll get a URL like: `https://braintrain-quiz.vercel.app`

### Option 2: Deploy via Vercel Dashboard
1. Go to [vercel.com](https://vercel.com) and sign up/login
2. Click "Add New Project"
3. Import your Git repository (GitHub, GitLab, or Bitbucket)
4. Vercel auto-detects the Vite configuration
5. Click "Deploy"
6. Done! Your quiz is live

---

## Alternative: Deploy to Netlify

### Option 1: Netlify CLI
1. Install Netlify CLI:
   ```bash
   npm i -g netlify-cli
   ```

2. Build your project:
   ```bash
   npm run build
   ```

3. Deploy:
   ```bash
   netlify deploy --prod
   ```

4. Follow the prompts and your quiz will be live

### Option 2: Netlify Dashboard
1. Go to [netlify.com](https://netlify.com) and sign up/login
2. Drag and drop your `dist` folder to the deploy area
3. Or connect your Git repository for automatic deployments
4. Done!

---

## Embed in WordPress

Once deployed, add this to any WordPress page or post:

### Method 1: HTML Block
1. In WordPress editor, add a "Custom HTML" block
2. Paste this code (replace with your actual URL):
   ```html
   <iframe
     src="https://your-quiz-url.vercel.app"
     width="100%"
     height="900px"
     style="border:none; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);"
     title="BrainTrain Quiz">
   </iframe>
   ```

### Method 2: Shortcode (Advanced)
Add to your theme's `functions.php`:
```php
function braintrain_quiz_shortcode() {
    return '<iframe src="https://your-quiz-url.vercel.app" width="100%" height="900px" style="border:none; border-radius: 8px;" title="BrainTrain Quiz"></iframe>';
}
add_shortcode('braintrain_quiz', 'braintrain_quiz_shortcode');
```

Then use `[braintrain_quiz]` anywhere in WordPress.

---

## Making the iframe Responsive

For better mobile experience, add this CSS to your WordPress theme:

```css
.quiz-iframe-container {
    position: relative;
    width: 100%;
    padding-bottom: 56.25%; /* 16:9 ratio, adjust as needed */
    height: 0;
    overflow: hidden;
}

.quiz-iframe-container iframe {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border: none;
}
```

Then use:
```html
<div class="quiz-iframe-container">
    <iframe src="https://your-quiz-url.vercel.app" title="BrainTrain Quiz"></iframe>
</div>
```

---

## Future Enhancements Ready to Add

Your quiz is now set up to easily add:
- ✅ User accounts and authentication (Supabase)
- ✅ Progress tracking and saved results
- ✅ Leaderboards
- ✅ Advanced analytics
- ✅ Custom question sets
- ✅ API integrations
- ✅ Payment features

Just let me know what you'd like to add next!
