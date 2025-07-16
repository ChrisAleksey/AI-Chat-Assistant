# AI Chat Assistant con API OpenAI Compatible

Una aplicación de chat con IA construida con React que utiliza la API de Puter para interactuar con modelos de IA como Claude, y expone una API compatible con OpenAI para usar en otros proyectos.

## Características

- 🤖 Chat con IA usando modelos Claude y otros
- 💬 Múltiples conversaciones simultáneas
- 🎨 Interfaz moderna con Material-UI
- 📱 Diseño responsivo
- 🔐 Autenticación con Puter
- ⚡ Streaming de respuestas en tiempo real
- 🔌 **API OpenAI Compatible** - Endpoint `/v1/chat/completions`
- 🌐 **Servidor Express** integrado para API externa

## Correcciones Implementadas

Este proyecto ha sido corregido para resolver los siguientes errores:

### ✅ Error de CustomElementRegistry
- **Problema**: `the name "puter-dialog" has already been used with this registry`
- **Solución**: Implementado hook personalizado `usePuterScript` que evita la carga duplicada del script de Puter

### ✅ Error de Script genérico
- **Problema**: `Uncaught runtime errors: Script error`
- **Solución**: 
  - Agregado Error Boundary para capturar errores de React
  - Implementado manejo global de errores
  - Deshabilitado StrictMode temporalmente para evitar conflictos con React 19
  - Corregidos warnings de ESLint sobre funciones en loops

### ✅ Error 401 de autenticación
- **Problema**: `Failed to load resource: the server responded with a status of 401`
- **Solución**: 
  - Agregado componente AuthStatus para mostrar estado de autenticación
  - Implementado manejo de errores específicos para autenticación
  - Agregadas verificaciones de disponibilidad de Puter antes de hacer llamadas

## Instalación y Uso

1. **Instalar dependencias**:
   ```bash
   npm install --legacy-peer-deps
   ```

2. **Ejecutar en modo desarrollo (React + Express)**:
   ```bash
   npm start
   ```
   Esto iniciará:
   - Frontend React en http://localhost:3000
   - API Server Express en http://localhost:3001

3. **Construir para producción**:
   ```bash
   npm run build
   ```

## Uso de la API OpenAI Compatible

### 1. Autenticación Requerida
Primero debes autenticarte usando la interfaz web:
1. Ve a http://localhost:3000
2. Haz clic en "Sign In" para autenticarte con Puter
3. Una vez autenticado, el token se compartirá automáticamente con el servidor

### 2. Usar la API desde otros proyectos

```javascript
// Ejemplo con cliente OpenAI
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: 'dummy-key', // No se requiere key real
  baseURL: 'http://localhost:3001/v1'
});

const completion = await openai.chat.completions.create({
  model: 'gpt-3.5-turbo',
  messages: [
    { role: 'user', content: 'Hello, how are you?' }
  ],
  stream: true
});

for await (const chunk of completion) {
  console.log(chunk.choices[0]?.delta?.content || '');
}
```

```bash
# Ejemplo con curl
curl -X POST http://localhost:3001/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [
      {"role": "user", "content": "Hello!"}
    ],
    "stream": false
  }'
```

## Endpoints API

### `POST /v1/chat/completions`
Endpoint principal compatible con OpenAI.

**Parámetros:**
- `model`: "gpt-3.5-turbo" o "gpt-4" (ambos usan claude-3-5-sonnet)
- `messages`: Array de mensajes del chat
- `stream`: boolean para activar streaming
- `max_tokens`: número máximo de tokens (opcional)
- `temperature`: temperatura del modelo (opcional)

### `GET /v1/models`
Lista los modelos disponibles.

### `GET /health`
Health check del servidor.

## Autenticación con Puter

Para usar la aplicación, necesitas:

1. Tener una cuenta en [Puter](https://puter.com)
2. Hacer clic en "Sign In" cuando aparezca el mensaje de autenticación
3. Autorizar la aplicación para usar la API de Puter

## Estructura del Proyecto

```
src/
├── components/          # Componentes reutilizables
│   ├── AuthStatus.js   # Estado de autenticación
│   ├── ErrorBoundary.js # Manejo de errores
│   ├── LoadingFallback.js # Pantalla de carga
│   └── ...
├── hooks/              # Hooks personalizados
│   └── usePuterScript.js # Carga segura del script de Puter
├── pages/              # Páginas principales
│   └── ChatPage.js     # Página principal del chat
├── utils/              # Utilidades
│   └── errorHandler.js # Manejo de errores
└── ...
```

## Tecnologías Utilizadas

- React 19
- Material-UI (MUI)
- Framer Motion
- Puter API
- Emotion (CSS-in-JS)

## Solución de Problemas

### Si sigues viendo errores:

1. **Limpia la caché del navegador**:
   - Ctrl+Shift+R (Windows/Linux)
   - Cmd+Shift+R (Mac)

2. **Reinicia el servidor de desarrollo**:
   ```bash
   npm start
   ```

3. **Verifica la consola del navegador** para mensajes de error específicos

4. **Asegúrate de estar autenticado en Puter** antes de enviar mensajes

## Contribuir

Si encuentras algún error o quieres contribuir:

1. Fork el proyecto
2. Crea una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abre un Pull Request
>This React version evolved from an [original HTML/CSS implementation](https://github.com/usualdork/EndlessClaude). <br>
Because using vanilla HTML/CSS/JS is like saying "I use Windows" when you could say "I use Arch BTW" 😉 <br>
![image](https://github.com/user-attachments/assets/bc15e912-346b-4bec-8641-8c19802c93f1)


A modern, React-based AI chat interface that leverages the power of Puter.js API for free, unlimited AI interactions. Experience the next generation of web-based AI chat interfaces. 

🌐 Live Demo: https://guify.ct.ws

  ![image](https://github.com/user-attachments/assets/a46b0c45-4394-44b2-ac50-a43021f8647e)


## ✨ Features
- 🎭 Multiple chat support with conversation management
- 🎨 Sleek, modern UI with cyberpunk-inspired design
- 📱 Fully responsive design for all devices
- ⚡ Real-time streaming responses
- 🔄 Chat history management
- 🎛️ Model selection (Claude and ChatGPT)
- ⌨️ Customizable enter key behavior
- 🌓 Dark mode optimized
- 🔄 Real-time chat updates

## 🚀 React vs HTML+CSS+JS: Evolution of a Developer
Choosing React over traditional HTML+CSS+JS is a statement of embracing modern development practices. Here's why:
<div align="center">

| Feature               | Old HTML/CSS/JS          | React Implementation     |
|-----------------------|--------------------------|--------------------------|
| Component Reuse       | Copy-paste chaos         | DRY Component System     |
| State Management      | Global variables         | Hooks Context API        |
| Styling               | CSS spaghetti            | Material-UI + Emotion    |
| DOM Updates           | Manual manipulation      | Virtual DOM Magic        |
| Code Organization     | Separate files           | Co-located Components    |
| Build Process         | Script tags              | Modern toolchain (Vite)  |
</div>

## 🤖 Puter API Integration
This project leverages [Puter's Free OpenAI and Claude API](https://developer.puter.com/tutorials/free-unlimited-openai-api/) to provide:

- 🆓 Free access to GPT-4o and Claude 3.5 Sonnet
- 🔑 No API keys required
- ⚡ Real-time streaming
- 🌐 Global CDN caching

## 🛠️ Tech Stack
- Frontend: React 18 + Material-UI 5
- State Management: React Hooks
- Styling: Emotion CSS-in-JS
- Animation: Framer Motion
- AI Integration: Puter.js SDK

## 📦 Installation
1. Clone the repo
```bash
git clone https://github.com/usualdork/AI-Chat-Assistant.git
```
2. Install dependencies
```bash
npm install
```
3. Start development server
```bash
npm start
```

## 🌐 Deployment
The project is configured for zero-config deployment to:
- Vercel
- Netlify
- GitHub Pages
```bash
npm run build && npm run preview
```

## 🎯 Key Improvements Over Traditional Approach
1. State Management
- Old: Complex JavaScript event listeners and manual state tracking
- New: React's useState and useEffect hooks for clean state management
2. Component Architecture
- Old: Monolithic HTML files with repeated code
- New: Reusable React components with clear separation of concerns
3. Styling Approach
- Old: Global CSS with potential conflicts
- New: Scoped CSS-in-JS with Emotion and MUI's styling system

## 🤝 Contributing
1. Fork the Project
2. Create your Feature Branch `(git checkout -b feature/AmazingFeature)`
3. Commit your Changes `(git commit -m 'Add some AmazingFeature')`
4. Push to the Branch `(git push origin feature/AmazingFeature)`
5. Open a Pull Request

## 📝 License
This project is licensed under the MIT License - see the LICENSE file for details.

## Crafted with ❤️ by
`@usualdork` <br>
[![GitHub Profile](https://img.shields.io/badge/GitHub-Profile-black?style=flat&logo=github)](https://github.com/usualdork)

*⭐️ If you found this project interesting, please consider giving it a star!*

