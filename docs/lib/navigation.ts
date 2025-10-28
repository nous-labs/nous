import type { PageTreeTransformer } from "fumadocs-core/source";
import type { Folder, Item, Node, Root } from "fumadocs-core/page-tree";
import { createElement } from "react";
import { icons } from "lucide-react";

type CategorySection = {
  type: "category";
  title: string;
  icon: string;
  description?: string;
  defaultOpen?: boolean;
  entries: string[];
};

type ExistingFolderSection = {
  type: "folder";
  slug: string;
  title?: string;
  icon?: string;
  description?: string;
  defaultOpen?: boolean;
};

type SectionConfig = CategorySection | ExistingFolderSection;

const SECTION_CONFIG: SectionConfig[] = [
  {
    type: "category",
    title: "Getting Started",
    icon: "Rocket",
    description: "Installation and basic setup",
    defaultOpen: true,
    entries: ["index"],
  },
  {
    type: "folder",
    slug: "getting-started",
    icon: "BookOpen",
    defaultOpen: false,
  },
  {
    type: "folder",
    slug: "core",
    icon: "Layers",
    defaultOpen: false,
  },
  {
    type: "category",
    title: "Reference",
    icon: "FileCode",
    description: "API documentation and utilities",
    defaultOpen: false,
    entries: [
      "api-clients",
      "smart-contracts",
      "easy-contracts",
      "utilities",
      "architecture",
    ],
  },
  {
    type: "folder",
    slug: "guides",
    title: "Guides",
    icon: "Map",
    description: "Advanced guides and patterns",
    defaultOpen: false,
  },
  {
    type: "folder",
    slug: "integrations",
    title: "Integrations",
    icon: "Puzzle",
    description: "Framework integrations",
    defaultOpen: false,
  },
  {
    type: "category",
    title: "More",
    icon: "MoreHorizontal",
    entries: ["examples", "contributing", "donations", "changelog"],
  },
];

const ICON_MAP: Record<string, string> = {
  // Root pages
  index: "Home",
  architecture: "GitBranch",
  changelog: "Clock",
  contributing: "Heart",
  donations: "DollarSign",
  examples: "Code2",

  // Getting Started folder
  "getting-started": "BookOpen",
  "getting-started/installation": "Download",

  // Core folder
  core: "Layers",
  "core/authentication": "Key",

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
  "integrations/index": "Puzzle",
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

  // Apply icons to all nodes
  for (const [slug, node] of slugMap) {
    const icon = ICON_MAP[slug];
    if (icon) {
      (node as Item | Folder).icon = iconForName(icon);
    }
  }

  const rootChildSet = new Set(root.children);
  const assignedNodes = new Set<Node>();
  const usedRootChildren = new Set<Node>();

  const pickNode = (slug: string): Node | undefined => {
    const node = slugMap.get(slug);
    if (!node || assignedNodes.has(node)) return undefined;

    assignedNodes.add(node);
    if (rootChildSet.has(node)) {
      usedRootChildren.add(node);
    }

    return node;
  };

  const structuredChildren: Node[] = [];

  for (const section of SECTION_CONFIG) {
    if (section.type === "category") {
      const children = section.entries
        .map((slug) => pickNode(slug))
        .filter((node): node is Node => Boolean(node));

      if (!children.length) continue;

      const categoryFolder: Folder = {
        type: "folder",
        name: section.title,
        description: section.description,
        icon: iconForName(section.icon),
        defaultOpen: section.defaultOpen ?? false,
        children,
      };

      structuredChildren.push(categoryFolder);
      continue;
    }

    const folderNode = pickNode(section.slug);
    if (!folderNode || folderNode.type !== "folder") continue;

    if (section.title) folderNode.name = section.title;
    if (section.description) folderNode.description = section.description;
    if (section.icon) folderNode.icon = iconForName(section.icon);
    if (section.defaultOpen !== undefined) {
      folderNode.defaultOpen = section.defaultOpen;
    }

    structuredChildren.push(folderNode);
  }

  // Add any leftover nodes at the end
  const leftovers = root.children.filter(
    (child) => !usedRootChildren.has(child),
  );
  root.children = [...structuredChildren, ...leftovers];
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
