# WordPress Deployment Guide

## Option 1: Embed as iFrame (Recommended)

1. Deploy to Vercel first (see DEPLOYMENT.md)
2. In WordPress, create a new page
3. Add a Custom HTML block with this code:

```html
<iframe
  src="https://your-vercel-url.vercel.app"
  width="100%"
  height="800px"
  frameborder="0"
  style="border: none; min-height: 800px;">
</iframe>
```

4. Adjust height as needed for your content

## Option 2: Upload Static Files

1. Build the project locally:
   ```bash
   npm install
   npm run build
   ```

2. Upload the `dist` folder contents to your WordPress site:
   - Via FTP: Upload to `/wp-content/uploads/quiz/`
   - Via WordPress Media Library: Upload individual files

3. Create a page and add this Custom HTML block:
   ```html
   <script type="module" crossorigin src="/wp-content/uploads/quiz/assets/index-[hash].js"></script>
   <link rel="stylesheet" href="/wp-content/uploads/quiz/assets/index-[hash].css">
   <div id="root"></div>
   ```

   Replace `[hash]` with actual filenames from dist/assets/

## Option 3: Using a Plugin

1. Install "Simple Custom CSS and JS" plugin
2. Add the built files to your WordPress uploads
3. Use the plugin to inject the necessary script and style tags

## Important Notes

- The Supabase credentials are hardcoded in the build, so no environment variables are needed
- Make sure your WordPress theme allows Custom HTML blocks
- Test the quiz after deployment to ensure database connectivity works
- For custom domains, update the Supabase allowed origins in your Supabase dashboard
