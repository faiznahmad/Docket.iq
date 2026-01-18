# Setup Instructions

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up your API key:**
   - Open `.env.local` in the root directory
   - Replace `your_api_key_here` with your actual Gemini API key
   - Get your API key from: https://aistudio.google.com/apikey
   
   Example `.env.local`:
   ```
   VITE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

## Important Notes

- **You MUST restart the dev server** after creating or modifying the `.env.local` file
- The API key must start with `VITE_` prefix to be accessible in the browser
- Never commit your `.env.local` file to git (it should be in `.gitignore`)

## Troubleshooting

### "VITE_API_KEY is not set" error
- Make sure `.env.local` exists in the root directory (same level as `package.json`)
- Make sure the file contains: `VITE_API_KEY=your_actual_key`
- Make sure you've restarted the dev server after creating/modifying the file
- Check that there are no extra spaces or quotes around the API key

### Blank page
- Check the browser console for errors
- Verify the API key is set correctly
- Make sure all dependencies are installed: `npm install`
