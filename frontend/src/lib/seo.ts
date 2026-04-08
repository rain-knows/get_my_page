export interface OpenGraphMeta {
  title: string;
  description: string;
  url: string;
}

export function buildOpenGraph(meta: OpenGraphMeta) {
  return {
    title: meta.title,
    description: meta.description,
    url: meta.url,
    type: "article",
  };
}
