# Logo Generation & Transparency Guide

This document explains the process used to create the **Flight Points** branding, the transition from Generated Images to SVG, and tips for achieving perfect transparency.

## 1. Prompt History

Here are the exact prompts used during the development of the logo:

### Initial Logo (White Background)
> "A minimalist, elegant, fancy signature logo for an airport named 'Flight Points'. The design should feature a stylized airplane wing outline that merges with elegant, flowing cursive script for the name 'Flight Points'. Use a clean premium coral color (#ff385c) on a white background. Modern, sleek, high-end branding, vector style."

### Transparent Attempt (The "Checkerboard" Trap)
> "An ultra-minimalist, high-end signature logo. The words 'Flight Points' written in a beautiful, flowing, elegant cursive script. Above the text is a subtle, single-line stylized outline of an airplane in flight. Color is a premium vibrant coral (#ff385c). THE BACKGROUND MUST BE COMPLETELY TRANSPARENT (NO WHITE, NO CHECKERBOARD). Professional vector-style branding, clean lines, high resolution."

## 2. Image vs. SVG: The Transparency Battle

### Raster Images (PNG/WebP)
The AI image generator creates **pixels**. While modern formats support an "Alpha Channel" (true transparency), AI models often suffer from two issues:
1. **Baked-in Checkerboard**: The AI "hallucinates" the grey-and-white checkerboard pattern that it sees in design software, actually *painting* those squares into the image.
2. **Fuzzy Edges**: Scaling a smaller image (e.g., 512px) to a large header (250px high) can result in blurriness or compression artifacts.

### SVG (Scalable Vector Graphics)
We eventually switched to a **Code-based SVG** for the header.
- **Why**: SVGs are instructions (`draw a line from A to B`), not pixels.
- **Transparency**: There is no "background" unless explicitly coded, so it is 100% transparent by default.
- **Scalability**: It remains perfectly sharp even at 10x the size.
- **Styling**: We can use CSS variables like `var(--accent-primary)` so the logo matches the site's colors perfectly.

## 3. Tips for Mastering the Image Generator

If you want to use the image generator to get a transparent logo next time, follow these best practices:

### The "Clean Edge" Framework
- **Ask for Isolation**: Use phrases like `"Isolated on a true alpha transparent background"` or `"Object on a transparent layer"`.
- **Negative Prompts (Mental)**: In your description, explicitly forbid backgrounds: `"No background, no scenery, no shadows, no floor"`.
- **Format Matters**: Ensure you are saving as a format that supports transparency (PNG or WebP).

### How to Detect "Fake" Transparency
If you generate a logo and see a checkerboard:
1. **The Browser Test**: Open the image in a new browser tab. If the background is white/grey but doesn't change when you dark-mode your browser, it's likely "fake" transparency.
2. **The "Alpha" Check**: On macOS, open the image in **Preview**, press `Cmd + I` (Show Inspector). Look for **"Has Alpha: Yes"**. If it says "No", the background is solid.

### The Hybrid Approach
The best professional results usually involve:
1. Generating a high-contrast logo on a **Solid White** background.
2. Using a tool (like Remove.bg or Photoshop) to strip the white.
3. Or, converting the image to SVG (tracing) for the ultimate clean finish.

---

**Current Solution**: The site now uses a hybrid **Inline SVG** (found in `App.tsx`) combined with the **Great Vibes** Google Font to give you the perfect high-end signature look with 0% artifacts and 100% transparency.
