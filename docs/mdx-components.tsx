import defaultMdxComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  // @ts-ignore weird error
  return {
    ...defaultMdxComponents,
    ...components,
  };
}
