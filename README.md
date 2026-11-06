# Aira, The Pilates House: sitio web

Sitio estático (Astro) de Aira. El texto editable vive en `src/datos/`.

```bash
npm install          # una vez
npm run dev          # vista previa en http://localhost:4321
npm run build        # compila a dist/
npm test             # valida datos, fotos, fuentes y páginas
npm run foto -- "<archivo>" <nombre>   # prepara una foto para el sitio
```

El sitio se publica solo en GitHub Pages cuando un cambio pasa la revisión (`.github/workflows/`).
La dirección se define con las variables `PUBLIC_SITE` y `PUBLIC_BASE` del repositorio.

La documentación y el asistente de la dueña viven en su computador y no se suben a este repositorio.
