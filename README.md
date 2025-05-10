# Club Canino Dos Huellitas

Sitio web para Club Canino Dos Huellitas, una guardería, colegio y hotel canino ubicado en Bogotá, Colombia.

## Tecnologías

- [Astro](https://astro.build) - Framework web moderno
- [React](https://reactjs.org) - Biblioteca para interfaces de usuario
- [Tailwind CSS](https://tailwindcss.com) - Framework CSS utilitario
- [Supabase](https://supabase.io) - Backend como servicio (para fase futura)

## Desarrollo local

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Construir para producción
npm run build

# Previsualizar versión de producción
npm run preview
```

## Despliegue en Netlify

Este proyecto está configurado para desplegarse automáticamente en Netlify. Hay dos formas de hacerlo:

### 1. Despliegue a través de GitHub

1. Sube tu código a un repositorio de GitHub.
2. Inicia sesión en [Netlify](https://app.netlify.com/).
3. Haz clic en "New site from Git".
4. Selecciona GitHub como proveedor de Git.
5. Selecciona tu repositorio.
6. En la configuración de compilación:
   - Build command: `npm run build`
   - Publish directory: `dist`
7. Haz clic en "Deploy site".

### 2. Despliegue manual a través de la CLI de Netlify

1. Instala la CLI de Netlify:
   ```bash
   npm install -g netlify-cli
   ```

2. Construye tu sitio:
   ```bash
   npm run build
   ```

3. Despliega en Netlify:
   ```bash
   netlify deploy
   ```

4. Para despliegue en producción:
   ```bash
   netlify deploy --prod
   ```

## Estructura del proyecto

```
/
├── public/            # Activos estáticos
│   ├── images/        # Imágenes
│   ├── favicon.ico    # Favicon
│   └── robots.txt     # Archivo robots.txt
├── src/
│   ├── components/    # Componentes React
│   ├── layouts/       # Layouts de Astro
│   ├── pages/         # Páginas del sitio
│   ├── styles/        # Estilos CSS
│   └── utils/         # Utilidades y funciones
├── astro.config.mjs   # Configuración de Astro
├── tailwind.config.js # Configuración de Tailwind CSS
└── netlify.toml       # Configuración para Netlify
```

## SEO

El sitio está optimizado para motores de búsqueda con:

- Metaetiquetas optimizadas
- Datos estructurados (Schema.org)
- Sitemap automático
- URLs canónicas
- Optimización para redes sociales (Open Graph y Twitter Cards)

## Funcionalidades principales

- Navegación responsive
- Página de inicio con carrusel
- Sección de servicios
- Galería de instalaciones
- Testimonios de clientes
- Preguntas frecuentes
- Formulario de contacto
- SEO optimizado

## Próxima fase

- Integración con Supabase para:
  - Sistema de administración
  - Portal para clientes
  - Actividades y seguimiento de perros
  - Newsletter