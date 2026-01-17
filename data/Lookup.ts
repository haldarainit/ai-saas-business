interface FileCode {
    code: string;
}

interface DefaultFiles {
    [key: string]: FileCode;
}

interface Dependencies {
    [key: string]: string;
}

interface LookupData {
    INPUT_PLACEHOLDER: string;
    DEFAULT_FILE: DefaultFiles;
    DEPENDANCY: Dependencies;
}

const Lookup: LookupData = {
    INPUT_PLACEHOLDER: "Tell me what changes you'd like...",
    DEFAULT_FILE: {
        "/App.js": {
            code: `export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-8">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-gray-800 mb-4">Welcome!</h1>
        <p className="text-xl text-gray-600">Your AI-powered landing page will appear here.</p>
      </div>
    </div>
  );
}`,
        },
        "/index.js": {
            code: `import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./styles.css";

import App from "./App";

const root = createRoot(document.getElementById("root"));
root.render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);`,
        },
        "/styles.css": {
            code: `body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

* {
  box-sizing: border-box;
}`,
        },
        "/public/index.html": {
            code: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#000000" />
    <meta name="description" content="AI-generated landing page" />
    <title>AI Landing Page</title>
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
  </body>
</html>`,
        },
        "/package.json": {
            code: `{
  "name": "ai-landing-page",
  "version": "1.0.0",
  "description": "AI-generated landing page",
  "main": "index.js",
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "react-scripts": "5.0.1",
    "lucide-react": "latest"
  },
  "eslintConfig": {
    "extends": ["react-app"]
  },
  "browserslist": {
    "production": [">0.2%", "not dead", "not op_mini all"],
    "development": ["last 1 chrome version", "last 1 firefox version", "last 1 safari version"]
  }
}`,
        }
    },
    DEPENDANCY: {
        "lucide-react": "latest",
        "react": "^18.2.0",
        "react-dom": "^18.2.0",
        "react-router-dom": "^6.20.0"
    },
};

export default Lookup;
export type { LookupData, DefaultFiles, FileCode, Dependencies };
