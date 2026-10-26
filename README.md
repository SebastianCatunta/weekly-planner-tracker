# Weekly Planner Tracker

Herramienta educativa para planificar la semana: una cuadrícula de 7 días por 24 horas donde se registran actividades con su horario. La especificación de la primera funcionalidad está en [specs/001-weeklyPlannerTracker-mvp/spec.md](specs/001-weeklyPlannerTracker-mvp/spec.md), y las reglas del proyecto en [docs/constitution.md](docs/constitution.md).

## Estructura

```
weekly-planner-tracker/
├── docs/constitution.md
├── specs/001-weeklyPlannerTracker-mvp/   # spec, plan y tareas
├── server/                               # Express + MongoDB (API y lógica en src/core/)
└── client/                               # React + Vite (interfaz)
```

## Dependencias

Cada dependencia está justificada según la constitución y la sección 8 del plan.

| Paquete | Dónde | Justificación |
|---|---|---|
| `express` | server | Definido por la constitución. Se añade en la tarea T-20. |
| `mongodb` | server | Driver oficial de MongoDB, sin ODM: las reglas viven en `core`, así que un esquema del ODM las duplicaría. Se añade en la tarea T-12. |
| `react`, `react-dom` | client | Definido por la constitución. |
| `vite`, `@vitejs/plugin-react` | client (desarrollo) | Compila y sirve el cliente en desarrollo. Create React App está descontinuado y configurar webpack a mano es complejidad innecesaria. |

No se usan otras librerías: los tests son `node --test` y la configuración de entorno se carga de forma nativa.

## Requisitos

- Node.js 20 o superior.
- MongoDB accesible desde el servidor (local o remoto).

## Configuración del servidor

1. Copia `server/.env.example` a `server/.env`.
2. Escribe en `MONGODB_URI` la dirección de tu MongoDB.

El archivo `.env` real no se sube al repositorio (está en `.gitignore`). No pongas contraseñas ni direcciones con credenciales en `.env.example`.

## Cómo arrancar

Servidor (escucha en el puerto 3001, o el de la variable `PORT`):

```bash
cd server
npm install
npm start
```

Si MongoDB está apagado, el servidor arranca igual y responde 503 `DB_UNAVAILABLE` hasta que vuelva a estar disponible.

Cliente:

```bash
cd client
npm install
npm run dev
```

En desarrollo, el cliente reenvía las peticiones `/api` al servidor en el puerto 3001 (ver `client/vite.config.js`).

### Sin el servidor de desarrollo de Vite

Compila el cliente y deja que el servidor lo entregue desde su propia dirección:

```bash
cd client
npm install
npm run build

cd ../server
npm start
```

Abre `http://localhost:3001` (o el puerto de `PORT`). Si `client/dist/` no existe, el servidor solo ofrece la API.

## Tests

Los tests del servidor (lógica de negocio en `server/tests/core/`, servicio, repositorio y API) se ejecutan con `npm test` dentro de `server/`. Los que usan MongoDB real se omiten si `MONGODB_URI` no está definida; para correrlos todos: `node --env-file=.env --test`. Usan una base temporal que se borra al terminar.

Los tests del cliente (mensajes, cliente de la API, estado, componentes renderizados a HTML y geometría de la cuadrícula) se ejecutan con `npm test` dentro de `client/`. No añaden librerías: usan `node --test` y el propio Vite para cargar los componentes.
