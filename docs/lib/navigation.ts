import type { PageTreeTransformer } from "fumadocs-core/source";
import type { Folder, Item, Node, Root } from "fumadocs-core/page-tree";
import { createElement } from "react";
import { icons } from "lucide-react";

type PackageSection = {
  title: string;
  slugs: string[];
  icon?: string;
  description?: string;
  defaultOpen?: boolean;
};

type PackageConfig = {
  id: "sdk" | "core" | "react" | "cli";
  title: string;
  description?: string;
  icon: string;
  indexSlug: string;
  defaultOpen?: boolean;
  sections: PackageSection[];
  consumeOnly?: string[];
};

const PACKAGE_GROUPS: PackageConfig[] = [
  {
    id: "sdk",
    title: "@nouslabs/sdk",
    description: "Primary SDK docs, quick starts, and reference material.",
    icon: "Package",
    indexSlug: "sdk/index",
    defaultOpen: true,
    sections: [
      {
        title: "Start here",
        icon: "Compass",
        slugs: ["index", "sdk/index", "sdk/installation"],
      },
      {
        title: "Clients",
        icon: "none",
        slugs: ["sdk/clients", "api-clients"],
      },
      {
        title: "Wallet & signing",
        icon: "none",
        slugs: ["sdk/wallet", "sdk/transactions", "smart-contracts"],
      },
      {
        title: "Utilities",
        icon: "none",
        slugs: ["sdk/utilities", "utilities", "easy-contracts"],
      },
      {
        title: "Resources",
        icon: "none",
        slugs: ["examples", "contributing", "donations", "changelog", "sdk/changelog"],
      },
    ],
  },
  {
    id: "core",
    title: "@nouslabs/core",
    description: "Low-level primitives, validation, and cryptography helpers.",
    icon: "Cpu",
    indexSlug: "core/index",
    sections: [
      {
        title: "Foundations",
        icon: "none",
        slugs: [
          "core/index",
          "core/authentication",
          "core/identity",
          "core/encoding",
          "core/validation",
          "architecture",
        ],
      },
      {
        title: "Changelog",
        icon: "none",
        slugs: ["core/changelog"],
      },
    ],
  },
  {
    id: "react",
    title: "@nouslabs/react",
    description: "React Query hooks and integration patterns for React apps.",
    icon: "Component",
    indexSlug: "react/index",
    sections: [
      {
        title: "React Query",
        icon: "Activity",
        slugs: [
          "react/index",
          "react/query/index",
          "react/query/hooks",
          "react/query/contracts",
        ],
        defaultOpen: true,
      },
      {
        title: "Changelog",
        icon: "Clock",
        slugs: ["react/changelog"],
      },
    ],
  },
  {
    id: "cli",
    title: "@nouslabs/cli",
    description: "Command-line workflows for accounts and transactions.",
    icon: "Command",
    indexSlug: "cli/index",
    sections: [
      {
        title: "Overview",
        icon: "PlayCircle",
        slugs: ["cli/index", "cli/getting-started"],
      },
      {
        title: "Monitoring",
        icon: "Activity",
        slugs: ["cli/monitoring"],
      },
      {
        title: "Scaffolding",
        icon: "Rocket",
        slugs: ["cli/scaffold"],
      },
      {
        title: "Accounts",
        icon: "Users",
        slugs: ["cli/accounts"],
      },
      {
        title: "Transactions",
        icon: "ArrowLeftRight",
        slugs: ["cli/transactions", "cli/commands"],
      },
      {
        title: "Configuration & security",
        icon: "ShieldCheck",
        slugs: ["cli/configuration", "cli/security"],
      },
      {
        title: "Changelog",
        icon: "Clock",
        slugs: ["cli/changelog"],
      },
    ],
  },
];

const ICON_MAP: Record<string, string> = {
  // Root pages
  index: "Home",
  architecture: "GitBranch",
  changelog: "Clock",
  "sdk/changelog": "Clock",
  "core/changelog": "Clock",
  "react/changelog": "Clock",
  "cli/changelog": "Clock",
  contributing: "Heart",
  donations: "DollarSign",
  examples: "Code2",

  // Getting Started
  "getting-started": "BookOpen",
  "getting-started/installation": "Download",
  "getting-started/nextjs-scaffold": "Rocket",

  // SDK
  "sdk/index": "Package",
  "sdk/installation": "Download",
  "sdk/clients": "Globe",
  "sdk/wallet": "Wallet",
  "sdk/transactions": "ArrowLeftRight",
  "sdk/utilities": "Wrench",

  // Core
  core: "Layers",
  "core/index": "Cpu",
  "core/authentication": "Key",
  "core/identity": "Fingerprint",
  "core/encoding": "Braces",
  "core/validation": "ShieldCheck",

  // React
  "react/index": "Component",
  "react/query/index": "RefreshCw",
  "react/query/hooks": "Hook",
  "react/query/contracts": "FolderKanban",

  // CLI
  "cli/index": "TerminalSquare",
  "cli/getting-started": "Command",
  "cli/monitoring": "Activity",
  "cli/scaffold": "Rocket",
  "cli/accounts": "Users",
  "cli/transactions": "ArrowLeftRight",
  "cli/commands": "ListChecks",
  "cli/configuration": "Settings",
  "cli/security": "ShieldCheck",

  // API Reference
  "api-clients": "Plug",
  "smart-contracts": "ScrollText",
  "easy-contracts": "Sparkles",
  utilities: "Wrench",

  // Guides
  guides: "Map",
  "guides/index": "Map",
  "guides/real-world-playbooks": "BookMarked",
  "guides/smart-contract-lifecycle": "Workflow",
  "guides/wallet-integration": "Wallet",

  // Integrations
  integrations: "Puzzle",
  "integrations/index": "NotebookPen",
  "integrations/react-simple": "Component",
  "integrations/react-query": "RefreshCw",
  "integrations/react-query-contracts": "GitMerge",
  "integrations/nextjs-walletconnect": "Link",
};

export const navigationTransformer: PageTreeTransformer = {
  root(root) {
    transformRoot(root);
    if (root.fallback) {
      transformRoot(root.fallback);
    }
    return root;
  },
};

function transformRoot(root: Root) {
  const slugMap = new Map<string, Node>();
  collectNodes(root.children, slugMap);

  applyIconHints(slugMap);

  const assignedNodes = new Set<Node>();

  const pickNode = (slug: string): Node | undefined => {
    const node = slugMap.get(slug);
    if (!node || assignedNodes.has(node)) return undefined;

    assignedNodes.add(node);

    return node;
  };

  const packageFolders: Folder[] = [];

  for (const pkg of PACKAGE_GROUPS) {
    const folder: Folder = {
      type: "folder",
      name: pkg.title,
      description: pkg.description,
      icon: iconForName(pkg.icon),
      defaultOpen: pkg.defaultOpen ?? false,
      root: true,
      children: [],
    };

    const indexNode = pickNode(pkg.indexSlug);
    if (indexNode && indexNode.type === "page") {
      folder.index = indexNode;
    }

    for (const section of pkg.sections) {
      const nodes = section.slugs
        .map((slug) => pickNode(slug))
        .filter((node): node is Node => Boolean(node));

      if (!nodes.length) continue;

      const hasMultipleEntries =
        nodes.length > 1 ||
        nodes.some(
          (node) => node.type === "folder" && node.children.length > 1,
        );

      if (section.title && hasMultipleEntries) {
        folder.children.push({
          type: "separator",
          name: section.title,
          icon: iconForName(section.icon ?? pkg.icon),
        } as Node);
      }

      for (const node of nodes) {
        if (node.type === "folder") {
          if (section.icon) {
            node.icon = iconForName(section.icon);
          }
          if (section.defaultOpen !== undefined) {
            node.defaultOpen = section.defaultOpen;
          }
        } else if (section.icon && !node.icon) {
          node.icon = iconForName(section.icon);
        }

        folder.children.push(node);
      }
    }

    if (pkg.consumeOnly) {
      for (const slug of pkg.consumeOnly) {
        pickNode(slug);
      }
    }

    packageFolders.push(folder);
  }

  root.children = packageFolders;
}

function applyIconHints(slugMap: Map<string, Node>) {
  for (const [slug, node] of slugMap) {
    const icon = ICON_MAP[slug];
    if (!icon) continue;
    if (node.type === "page" || node.type === "folder") {
      (node as Item | Folder).icon = iconForName(icon);
    }
  }
}

function collectNodes(nodes: Node[], map: Map<string, Node>) {
  for (const node of nodes) {
    if (node.type === "folder") {
      const folderSlug = getFolderSlug(node);
      if (folderSlug && !map.has(folderSlug)) {
        map.set(folderSlug, node);
      }

      if (node.index) {
        const indexSlug = getPageSlug(node.index);
        if (indexSlug && !map.has(indexSlug)) {
          map.set(indexSlug, node.index);
        }
      }

      collectNodes(node.children, map);
      continue;
    }

    if (node.type === "page") {
      const slug = getPageSlug(node);
      if (slug && !map.has(slug)) {
        map.set(slug, node);
      }
    }
  }
}

function getFolderSlug(folder: Folder): string | null {
  if (folder.$ref?.metaFile) {
    return normalizeDocPath(folder.$ref.metaFile);
  }

  if (folder.index?.$ref?.file) {
    const slug = normalizeDocPath(folder.index.$ref.file);
    return slug.replace(/\/index$/, "") || slug;
  }

  return null;
}

function getPageSlug(item: Item): string | null {
  if (item.$ref?.file) {
    return normalizeDocPath(item.$ref.file);
  }

  return slugFromUrl(item.url);
}

function normalizeDocPath(path: string): string {
  let normalized = path.replace(/\\/g, "/");
  normalized = normalized.replace(/^content\/docs\//, "");
  normalized = normalized.replace(/\.(md|mdx|json)$/i, "");
  normalized = normalized.replace(/\/meta$/, "");
  return normalized;
}

function slugFromUrl(url: string | undefined): string | null {
  if (!url) return null;
  return url.replace(/^\/+/, "").replace(/^docs\//, "");
}

function iconForName(name?: string) {
  if (!name) return undefined;
  const Icon = icons[name as keyof typeof icons];
  if (!Icon) return undefined;
  return createElement(Icon, { "aria-hidden": true });
}
