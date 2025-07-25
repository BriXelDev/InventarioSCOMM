# Importaciones necesarias para el manejo de la base de datos
import sqlite3  # SQLite: Base de datos ligera embebida, no requiere servidor separado
import os       # Para operaciones del sistema operativo (crear directorios)
import hashlib  # Para crear hashes seguros de contraseñas (SHA-256)

# Gestionamos las dependencias opcionales para compatibilidad
try:
    import importlib.util  # Para comprobar si módulos opcionales están disponibles
    has_importlib = True
except ImportError:
    has_importlib = False

try:
    from dotenv import load_dotenv  # Para cargar variables de entorno desde .env
    # Cargar variables de entorno desde el archivo .env si existe
    load_dotenv()
    has_dotenv = True
except ImportError:
    has_dotenv = False
    print("AVISO: python-dotenv no está instalado. Usando configuración predeterminada en database.py")

# Definir la ruta de la base de datos según la configuración
# Primero vemos si es modo local o cloud
try:
    # Esto permite cambiar la ubicación de la BD basado en el entorno
    flask_env = os.environ.get('FLASK_ENV', 'development')
    if flask_env == 'production' and has_dotenv:
        # En producción, usa variables de entorno
        db_type = os.environ.get('DB_TYPE', 'sqlite').lower()
        if db_type == 'sqlite':
            DB_NAME = os.environ.get('DATABASE_PATH', 'data/inventory.db')
        else:
            # Para PostgreSQL o MySQL, DB_NAME almacena la URI de conexión completa
            DB_NAME = None  # Se configurará completamente en la conexión
    else:
        # En desarrollo o pruebas, usa la ubicación predeterminada
        DB_NAME = "data/inventory.db"
except Exception:
    # Configuración de emergencia si hay algún error
    DB_NAME = "data/inventory.db"
    print("Usando configuración de base de datos predeterminada: data/inventory.db")

def hash_password(password):
    """
    Función para convertir contraseñas en texto plano a hash SHA-256
    
    ¿Por qué usar hash?
    - Nunca almacenamos contraseñas en texto plano por seguridad
    - SHA-256 es un algoritmo criptográfico que convierte cualquier texto
      en una cadena de 64 caracteres hexadecimales
    - Es unidireccional: puedes generar el hash, pero no recuperar la contraseña original
    
    Args:
        password (str): Contraseña en texto plano
        
    Returns:
        str: Hash SHA-256 de la contraseña en formato hexadecimal
    """
    return hashlib.sha256(password.encode()).hexdigest()

# Función para obtener una conexión a la base de datos
def get_db_connection():
    """
    Crea una conexión a la base de datos según la configuración del entorno.
    Soporta SQLite (desarrollo/local) y PostgreSQL/MySQL (producción/nube)
    
    Esta función incluye manejo de errores para garantizar que siempre
    retorne una conexión funcional, incluso en caso de fallas.
    
    Returns:
        connection: Objeto de conexión a la base de datos
        is_sqlite: Boolean indicando si es conexión SQLite
    """
    try:
        # Verificar primero si estamos en modo producción y con todas las dependencias
        if os.environ.get('FLASK_ENV') == 'production' and has_dotenv and has_importlib:
            db_type = os.environ.get('DB_TYPE', 'sqlite').lower()
            
            # Conexión a PostgreSQL si está configurada y disponible
            if db_type == 'postgresql':
                try:
                    # Verificar que psycopg2 está disponible
                    if importlib.util.find_spec("psycopg2") is not None:
                        import psycopg2
                        conn = psycopg2.connect(
                            host=os.environ.get('DB_HOST', 'localhost'),
                            port=os.environ.get('DB_PORT', '5432'),
                            user=os.environ.get('DB_USER', 'postgres'),
                            password=os.environ.get('DB_PASSWORD', ''),
                            dbname=os.environ.get('DB_NAME', 'inventory')
                        )
                        return conn, False
                except (ImportError, Exception) as e:
                    print(f"Error al conectar a PostgreSQL: {str(e)}. Usando SQLite como fallback.")
            
            # Conexión a MySQL si está configurada y disponible
            elif db_type == 'mysql':
                try:
                    # Verificar que pymysql está disponible
                    if importlib.util.find_spec("pymysql") is not None:
                        import pymysql
                        conn = pymysql.connect(
                            host=os.environ.get('DB_HOST', 'localhost'),
                            port=int(os.environ.get('DB_PORT', '3306')),
                            user=os.environ.get('DB_USER', 'root'),
                            password=os.environ.get('DB_PASSWORD', ''),
                            database=os.environ.get('DB_NAME', 'inventory')
                        )
                        return conn, False
                except (ImportError, Exception) as e:
                    print(f"Error al conectar a MySQL: {str(e)}. Usando SQLite como fallback.")
        
        # Si llegamos aquí, usamos SQLite (el modo predeterminado y más seguro)
        # Asegurar que el directorio existe
        os.makedirs(os.path.dirname(DB_NAME), exist_ok=True)
        conn = sqlite3.connect(DB_NAME)
        return conn, True
        
    except Exception as e:
        # En caso de cualquier error, usamos SQLite como último recurso
        print(f"Error al establecer conexión a la base de datos: {str(e)}")
        print("Usando conexión SQLite de emergencia")
        
        try:
            # Intentar crear el directorio data si no existe
            if not os.path.exists('data'):
                os.makedirs('data')
            
            conn = sqlite3.connect("data/inventory.db")
            return conn, True
        except Exception as final_error:
            # Si incluso esto falla, es un error terminal
            raise RuntimeError(f"Error crítico de base de datos: {str(final_error)}")

def init_db(): 
    """
    Función principal para inicializar la base de datos
    
    Esta función ha sido modificada para soportar diferentes motores de base de datos:
    - SQLite (desarrollo local): Crea un archivo en disco
    - PostgreSQL/MySQL (entorno de producción): Conecta a servidor de BD existente
    
    La estructura de tablas es adaptada según el motor de base de datos.
    
    Esta función se ejecuta al inicio de la aplicación y se encarga de:
    1. Crear el directorio 'data' si no existe
    2. Crear las tablas necesarias si no existen
    3. Aplicar migraciones (cambios en la estructura de la BD)
    4. Insertar datos de prueba si es la primera vez
    
    SQLite es "schema-flexible": podemos modificar la estructura sobre la marcha
    """
    # Crear directorio 'data' si no existe
    # exist_ok=True evita error si el directorio ya existe
    os.makedirs("data", exist_ok=True)

    # Establecer conexión con la base de datos SQLite
    # Si el archivo no existe, SQLite lo crea automáticamente
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()  # Cursor: objeto para ejecutar comandos SQL

    # Crear tabla 'products' si no existe
    # CREATE TABLE IF NOT EXISTS: solo crea la tabla si no existe previamente
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,  -- Clave primaria que se incrementa automáticamente
        name TEXT NOT NULL,                    -- Nombre del producto (obligatorio)
        sku TEXT,                             -- Stock Keeping Unit (código único opcional)
        category TEXT,                        -- Categoría del producto
        quantity INTEGER DEFAULT 0,           -- Cantidad en inventario (por defecto 0)
        price REAL DEFAULT 0.0,              -- Precio del producto (número decimal)
        provider TEXT,                        -- Proveedor del producto
        stock_min INTEGER DEFAULT 0,          -- Cantidad mínima antes de considerar "stock bajo"
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP  -- Fecha de creación automática
    )
                   """)
    
    # MIGRACIÓN: Agregar columna SKU si no existe
    # Las migraciones permiten actualizar la estructura de BD sin perder datos
    try:
        # ALTER TABLE: comando SQL para modificar estructura de tabla existente
        cursor.execute("ALTER TABLE products ADD COLUMN sku TEXT")
        print("Columna SKU agregada a la tabla products")
    except sqlite3.OperationalError as e:
        # Manejar el caso donde la columna ya existe
        if "duplicate column name" in str(e).lower():
            # La columna ya existe, no hacer nada
            pass
        else:
            # Otro tipo de error, mostrar información
            print(f"Error al agregar columna SKU: {e}")
    
    # Crear índice único para SKU
    # ÍNDICE: estructura que acelera las búsquedas en la base de datos
    # ÚNICO: no permite valores duplicados
    # WHERE sku IS NOT NULL: solo aplica a registros que tienen SKU
    try:
        cursor.execute("CREATE UNIQUE INDEX idx_sku_unique ON products(sku) WHERE sku IS NOT NULL")
        print("Índice único creado para SKU")
    except sqlite3.OperationalError:
        # El índice ya existe, ignorar error
        pass
    
    # Crear tabla de usuarios para autenticación y autorización
    cursor.execute("""
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,     -- ID único para cada usuario
    username TEXT UNIQUE NOT NULL,            -- Nombre de usuario (único y obligatorio)
    password_hash TEXT NOT NULL,              -- Hash de la contraseña (nunca texto plano)
    role TEXT NOT NULL CHECK(role IN ('admin', 'editor', 'viewer'))  -- Rol con validación
    -- CHECK: constraint que valida que el rol sea uno de los valores permitidos
    -- admin: control total, editor: puede modificar inventario, viewer: solo lectura
);
""")

    # Crear tabla para registrar movimientos de inventario
    # Esta tabla funciona como un "log" o historial de todos los cambios
    cursor.execute("""
CREATE TABLE IF NOT EXISTS inventory_movements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,     -- ID único del movimiento
    product_id INTEGER NOT NULL,              -- ID del producto afectado
    product_name TEXT NOT NULL,               -- Nombre del producto (para historiales)
    movement_type TEXT NOT NULL CHECK(movement_type IN ('entrada', 'salida', 'ajuste', 'creacion', 'eliminacion')),
    -- Tipos de movimiento:
    -- 'entrada': se agregó stock, 'salida': se redujo stock
    -- 'ajuste': corrección manual, 'creacion': nuevo producto, 'eliminacion': producto eliminado
    quantity_before INTEGER NOT NULL,         -- Cantidad antes del movimiento
    quantity_after INTEGER NOT NULL,          -- Cantidad después del movimiento
    quantity_change INTEGER NOT NULL,         -- Diferencia (quantity_after - quantity_before)
    reason TEXT,                              -- Razón del movimiento (opcional)
    user_id INTEGER NOT NULL,                 -- ID del usuario que hizo el cambio
    username TEXT NOT NULL,                   -- Nombre del usuario (para historiales)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- Momento exacto del movimiento
    FOREIGN KEY (product_id) REFERENCES products(id),  -- Relación con tabla products
    FOREIGN KEY (user_id) REFERENCES users(id)         -- Relación con tabla users
    -- FOREIGN KEY: garantiza que product_id y user_id existan en sus tablas respectivas
);
""")

    # Insertar usuarios de prueba solo si la tabla está vacía
    # Esto permite tener usuarios predeterminados para probar la aplicación
    cursor.execute("SELECT COUNT(*) FROM users")
    user_count = cursor.fetchone()[0]  # fetchone() devuelve tupla, [0] toma el primer valor
    
    if user_count == 0:
        # Solo crear usuarios si no existen (primera vez que se ejecuta)
        print("Creando usuarios de prueba...")
        
        # Lista de tuplas con datos de usuarios de prueba
        # Cada tupla: (username, password_hash, role)
        test_users = [
            ('admin', hash_password('admin123'), 'admin'),      # Administrador completo
            ('editor', hash_password('editor123'), 'editor'),   # Puede editar inventario
            ('viewer', hash_password('viewer123'), 'viewer')    # Solo puede ver
        ]
        
        # executemany: ejecuta la misma consulta con múltiples conjuntos de datos
        # Más eficiente que hacer múltiples execute() individuales
        cursor.executemany(
            "INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)",
            test_users
        )
        
        print("Usuarios de prueba creados:")
        print("- admin / admin123 (Administrador)")
        print("- editor / editor123 (Editor)")
        print("- viewer / viewer123 (Visualizador)")

    # Confirmar todos los cambios en la base de datos
    # commit(): hace permanentes todas las operaciones pendientes
    conn.commit()
    
    # Cerrar la conexión para liberar recursos
    # Importante: siempre cerrar conexiones cuando termines
    conn.close()