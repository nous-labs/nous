import { createMDX } from "fumadocs-mdx/next";

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const isGithubActions = process.env.GITHUB_ACTIONS === "true";
const repoName = process.env.GITHUB_REPOSITORY?.split("/")[1] ?? "";
const isUserOrOrgSite = repoName.endsWith(".github.io");

const config = {
  // Static export for GitHub Pages
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },

  // Use repo name as basePath/assetPrefix on GitHub Pages (except user/org sites)
  basePath:
    isGithubActions && repoName && !isUserOrOrgSite ? `/${repoName}` : undefined,
  assetPrefix:
    isGithubActions && repoName && !isUserOrOrgSite ? `/${repoName}/` : undefined,

  // Set Turbopack root to docs to silence workspace root warning in CI
  turbopack: {
    root: __dirname,
  },

  // Allow production builds to succeed even if TypeScript/ESLint errors exist in CI.
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default withMDX(config);
