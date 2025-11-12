# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).
# ai-prompt-vault

## Deployment

This project is intended to be deployed to a static hosting provider that supports Create React App builds. If your repository is connected to Vercel via the Vercel dashboard (Git integration), you don't need any extra GitHub Actions for basic deploys — Vercel will build PR previews and production deployments automatically.

Recommended workflow (what we use):

- Keep Vercel's Git integration enabled for branch/PR previews and production builds.
- Use the existing GitHub Actions CI (`.github/workflows/ci.yml`) to run tests on PRs and pushes. Protect the `main` branch so merges require passing CI.
- If you want GitHub Actions to *trigger* production deploys instead of Vercel's auto-deploy, add a deploy workflow and set the repository secrets `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID` (not required for normal Vercel Git integration).

To test locally:

1. Start the dev server:
```bash
npm install
npm start
```

2. To emulate serverless functions (such as `api/variations.ts`) and the full Vercel routing, you can use the Vercel CLI:
```bash
npm install -g vercel
vercel dev
```

If you'd like, I can add a short PR template or a contributing note that outlines adding Vercel environment variables (e.g., `OPENAI_API_KEY`) for deploy-time features.
