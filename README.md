# BuddhaBoard

A modern support ticket management system built with React, Vite, and Supabase.

## Project Structure

The main application code is located in the `vite_frontend` directory, which contains a Vite-powered React application.

## Development

To run the development server:

```bash
cd vite_frontend
npm install
npm run dev
```

## Deployment

This project is configured for deployment on Vercel. The `vercel.json` file in the root directory handles the build configuration, pointing to the `vite_frontend` subdirectory.

### Deployment Configuration

- Build Command: `cd vite_frontend && npm install && npm run build`
- Output Directory: `vite_frontend/dist`
- Install Command: `cd vite_frontend && npm install`
- Framework Preset: Vite

## Environment Variables

Make sure to set up the following environment variables in your Vercel project:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```
