/* eslint-disable no-console */
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import React from 'react';
import { renderToString } from 'react-dom/server';
import App from '../App';

// Resolve current directory in ESM context
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type RouteConfig = {
  name: string;
  outFile: string;
};

const routes: RouteConfig[] = [
  { name: 'home', outFile: 'index.html' },
  { name: 'products', outFile: 'products/index.html' },
];

const templatePath = path.resolve(__dirname, '../dist/index.html');

async function renderApp() {
  return renderToString(
    <React.StrictMode>
      <App>
    </React.StrictMode>
  );
}

async function injectMarkup(template: string, markup: string) {
  const placeholder = '<div id="root"></div>';
  if (!template.includes(placeholder)) {
    throw new Error('Root placeholder not found in built index.html');
  }
  return template.replace(placeholder, `<div id="root">${markup}</div>`);
}

async function prerender() {
  const template = await fs.readFile(templatePath, 'utf-8');
  const markup = await renderApp();

  await Promise.all(
    routes.map(async (route) => {
      const outputPath = path.resolve(__dirname, '../dist', route.outFile);
      const html = await injectMarkup(template, markup);

      await fs.mkdir(path.dirname(outputPath), { recursive: true });
      await fs.writeFile(outputPath, html, 'utf-8');
      console.log(`✓ Pre-rendered ${route.name} -> ${route.outFile}`);
    })
  );
}

prerender().catch((err) => {
  console.error('Pre-rendering failed:', err);
  process.exit(1);
});

