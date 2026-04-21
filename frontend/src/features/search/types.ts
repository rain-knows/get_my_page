export interface SearchHit {
  id: number;
  title: string;
  summary: string;
  slug: string;
  coverUrl: string | null;
}

export interface SearchResponse {
  hits: SearchHit[];
  estimatedTotalHits: number;
  processingTimeMs: number;
  degraded: boolean;
}
