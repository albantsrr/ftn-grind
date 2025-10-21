# FortiFlow Download Page

This directory contains the GitHub Pages site for FortiFlow downloads.

## Accessing the page

Once GitHub Pages is configured, the site will be available at:
```
https://<your-username>.github.io/ftn-grind/
```

## Updating the download page

To update the download page for a new release:

1. Edit `index.html`
2. Update the version number in the download link (line ~119)
3. Update the displayed version number (line ~127)
4. Commit and push:
   ```bash
   git add docs/index.html
   git commit -m "docs: update download page for vX.X.X"
   git push
   ```

The page will be automatically updated within 1-2 minutes.

## Customization

The page is a single HTML file with embedded CSS and minimal JavaScript. You can customize:
- Colors and gradients in the `<style>` section
- Features list in the `.features` section
- Download buttons and links
- Platform detection logic in the `<script>` section
