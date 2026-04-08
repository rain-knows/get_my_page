export interface MdxCompileResult {
  code: string;
}

export async function compileMdx(source: string): Promise<MdxCompileResult> {
  // Placeholder for future MDX compiler integration.
  return { code: source };
}
