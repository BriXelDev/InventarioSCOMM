# 📦 Sistema de Inventario SCOMM
*Sistema completo de gestión de inventario con autenticación por roles*

## 🚀 Inicio Rápido

### Instalación Local Rápida
```bash
# 1. Clona o descarga el proyecto
# 2. Abre una terminal en la carpeta del proyecto
# 3. Instala las dependencias
pip install -r requirements.txt

# 4. Ejecuta la aplicación
python app.py

# 5. Abre tu navegador en: http://127.0.0.1:5000
```

## 👥 Usuarios de Prueba
Una vez que la aplicación esté funcionando, puedes iniciar sesión con:
- **Administrador**: `admin` / `admin123` (acceso completo)
- **Editor**: `editor` / `editor123` (puede editar productos)
- **Visualizador**: `viewer` / `viewer123` (solo lectura)

**Estos son solo usuarios de prueba, puedes cambiarlos si así lo deseas**

---

## ✨ Características del Sistema

### 🔐 Autenticación y Roles
- **Administrador**: Gestión completa (productos, usuarios, reportes)
- **Editor**: Manejo de inventario (agregar/editar productos, ajustes de stock)
- **Visualizador**: Solo consulta (ver productos y reportes)

### 📊 Funcionalidades Principales
1. **Gestión de Productos**: CRUD completo con validaciones
2. **Control de Stock**: Ajustes rápidos con registro automático
3. **Historial Completo**: Auditoría de todos los movimientos
4. **Reportes Avanzados**: Estadísticas, gráficos y análisis
5. **Búsqueda y Filtros**: Localización rápida de información
6. **Exportación**: Descarga en CSV para Excel
7. **Gestión de Usuarios**: Control de accesos y permisos

### 🎨 Interfaz Moderna
- Diseño responsivo para móviles y escritorio
- Notificaciones en tiempo real
- Gráficos interactivos con Chart.js
- Tema oscuro/claro automático

---

## 🛠️ Instalación Local Detallada

### Requisitos Previos
- **Python 3.8 o superior** ([Descargar aquí](https://python.org/downloads/))
- **Git** (opcional, [Descargar aquí](https://git-scm.com/downloads))

### Paso a Paso

#### 1. Obtener el Código
```bash
# Opción A: Clonar con Git
git clone <url-del-repositorio>
cd "Inventario scomm"

# Opción B: Descargar ZIP y extraer
# Navegar a la carpeta extraída
```

#### 2. Instalar Dependencias
```bash
# Verificar que Python está instalado
python --version

# Instalar las librerías necesarias
pip install -r requirements.txt
```

#### 3. Configurar la Aplicación
```bash
# (Opcional) Crear archivo .env para personalizar configuración
```

#### 4. Ejecutar la Aplicación
```bash
# Iniciar el servidor de desarrollo
python app.py

# Verás un mensaje como:
# "Iniciando Sistema de Inventario SCOMM..."
# "Accede a la aplicación en: http://127.0.0.1:5000"
```

#### 5. Acceder al Sistema
1. Abre tu navegador web
2. Ve a: `http://127.0.0.1:5000`
3. Inicia sesión con cualquier usuario de prueba
4. ¡Comienza a usar el sistema!

---

## ☁️ Despliegue en la nube

Este sistema ya está listo para poder escalar en la nube, puedes usar el proveedor de tu preferencia siempre y cuando uses bases de datos PostgreSQL o MySQL.
Ya incluye archivos Dockerfile y docker-compose por defecto.
Solo configura las variables de entorno según tus necesidades.

---

## 🔧 Configuración Avanzada

### Variables de Entorno Importantes
```bash
# Configuración básica
FLASK_ENV=production          # Modo de la aplicación
SECRET_KEY=clave_muy_segura   # Para sesiones seguras

# Base de datos (opcional)
DB_TYPE=sqlite               # sqlite, postgresql, mysql
DATABASE_PATH=data/inventory.db

# Para PostgreSQL/MySQL
DB_HOST=localhost
DB_PORT=5432
DB_USER=usuario
DB_PASSWORD=contraseña
DB_NAME=nombre_db
```

### Personalización
1. **Colores**: Edita `static/css/style.css`
2. **Funcionalidades**: Modifica `app.py`

---

## 📊 Estructura del Proyecto
```
Inventario scomm/
├── 📄 app.py                    # Aplicación principal Flask
├── 📄 database.py               # Configuración de base de datos
├── 📄 config.py                 # Configuraciones por entorno
├── 📄 wsgi.py                   # Punto de entrada para producción
├── 📄 requirements.txt          # Dependencias Python
├── 📄 Dockerfile                # Para despliegue con Docker
├── 📄 docker-compose.yml        # Orquestación de contenedores
├── 📁 data/
│   └── 📄 inventory.db          # Base de datos SQLite
├── 📁 templates/                # Plantillas HTML
│   ├── layout.html             # Plantilla base
│   ├── login.html              # Página de inicio de sesión
│   ├── index.html              # Lista de productos
│   ├── dashboard.html          # Panel principal
│   └── ...                     # Otras páginas
├── 📁 static/                   # Archivos estáticos
│   ├── css/                    # Estilos CSS
│   └── js/                     # JavaScript
└── 📁 scripts/                  # Scripts de despliegue
```

---

## 🔍 URLs del Sistema
| Ruta | Función | Permisos |
|------|---------|----------|
| `/login` | Iniciar sesión | Público |
| `/` | Lista de productos | Todos los usuarios |
| `/dashboard` | Panel principal | Todos los usuarios |
| `/add` | Agregar producto | Editor/Admin |
| `/edit_product/<id>` | Editar producto | Editor/Admin |
| `/quick_stock_adjustment/<id>` | Ajuste rápido | Editor/Admin |
| `/inventory_movements` | Historial | Todos los usuarios |
| `/reports` | Reportes | Todos los usuarios |
| `/manage_users` | Gestión usuarios | Solo Admin |
| `/export_csv` | Exportar CSV | Todos los usuarios |

---

## 🛡️ Seguridad y Mejores Prácticas

### Seguridad Implementada
- ✅ Contraseñas hasheadas con SHA-256
- ✅ Sesiones seguras con Flask
- ✅ Validación de roles en cada endpoint
- ✅ Protección contra SQL injection
- ✅ CSRF protection configurado
- ✅ Configuración HTTPS para producción

### Recomendaciones de Producción
1. **Cambia las contraseñas por defecto** inmediatamente
2. **Usa HTTPS** siempre (los proveedores cloud lo incluyen)
3. **Respaldos regulares** de la base de datos
4. **Monitorea los logs** regularmente
5. **Actualiza dependencias** periódicamente

---

## 🆘 Solución de Problemas

### Errores Comunes

#### "ModuleNotFoundError"
```bash
# Solución: Instalar dependencias
pip install -r requirements.txt
``` 


## 🚀 Próximos Pasos

### Una Vez que tu Sistema Esté Funcionando:
1. **Personaliza los datos**: Agrega tus productos reales
2. **Crea usuarios para tu equipo**: Con los roles apropiados
3. **Configura respaldos automáticos**: Según tu plataforma
4. **Entrena a tu equipo**: En el uso del sistema
5. **Monitorea el rendimiento**: Especialmente si crece el uso

### Posibles Mejoras Futuras:
- 📱 Aplicación móvil nativa
- 🔔 Notificaciones por email/SMS
- 📊 Más tipos de reportes
- 🏷️ Sistema de códigos de barras
- 🔄 Sincronización con otros sistemas
- 🌐 Múltiples ubicaciones/almacenes

### Documentación Adicional
- 🐍 [Documentación de Flask](https://flask.palletsprojects.com/)
- 🐳 [Docker Getting Started](https://docs.docker.com/get-started/)

---


### ⭐ ¿Te Gusta el Proyecto?
Si este sistema te ha sido útil:
- ⭐ Dale una estrella en GitHub
- 🐛 Reporta bugs si encuentras alguno
- 💡 Sugiere nuevas funcionalidades
- 🤝 Contribuye con mejoras

**¡Gracias por usar el Sistema de Inventario SCOMM!** 🚀
1. Paginación para listas grandes
2. Filtros y búsqueda
3. Exportación de reportes
4. Registro de actividades
5. API REST para integración externa
6. Notificaciones por email para stock bajo
7. Códigos de barras/QR
8. Múltiples ubicaciones/almacenes
