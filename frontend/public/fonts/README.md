# Local Fonts

本目录用于存放前端本地字体文件，避免构建阶段依赖外网字体服务。

## 当前文件

- `GeistLatin-Regular.woff2`
- `GeistLatinExt-Regular.woff2`
- `GeistMonoLatin-Regular.woff2`
- `GeistMonoLatinExt-Regular.woff2`

## 命名规范

- 格式：`<Family><Subset>-<Weight>.woff2`
- 示例：`InterLatin-400.woff2`、`ArchivoLatin-600.woff2`

## 替换建议

后续拿到 Inter / Space Grotesk / Archivo 字体文件后，直接替换 `layout.tsx` 中对应 `src.path` 即可，无需改动主题变量。
