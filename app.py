# Importaciones necesarias para la aplicación Flask
from flask import Flask, render_template, request, redirect, session, flash, url_for, Response
# Flask: framework web de Python
# render_template: renderiza plantillas HTML con datos dinámicos (usa Jinja2)
# request: accede a datos de peticiones HTTP (formularios, parámetros URL)
# redirect: redirige a otras páginas
# session: maneja sesiones de usuario (datos que persisten entre páginas)
# flash: mensajes temporales que se muestran una vez (ej: "Usuario creado")
# url_for: genera URLs de manera segura usando nombres de funciones
# Response: crear respuestas HTTP personalizadas

import os
import csv         # Para exportar datos en formato CSV
import io          # Para operaciones de entrada/salida en memoria
import hashlib     # Para hashear contraseñas
import sqlite3     # Para interactuar directamente con la base de datos SQLite
from functools import wraps  # Para crear decoradores (funciones que modifican otras funciones)
from datetime import datetime, timedelta  # Para manejar fechas y tiempos

# Gestión de dependencias opcionales con manejo de errores
try:
    from dotenv import load_dotenv  # Para cargar variables de entorno
    load_dotenv()  # Cargar variables de entorno desde .env
    dotenv_loaded = True
except ImportError:
    print("AVISO: python-dotenv no está instalado. Usando configuración predeterminada.")
    dotenv_loaded = False

# Importar configuración y funciones de base de datos
try:
    from config import config
    config_loaded = True
    print("Usando configuración cloud desde config.py")
except ImportError:
    try:
        from config_local import config
        config_loaded = True
        print("Usando configuración local desde config_local.py")
    except ImportError:
        print("AVISO: Módulo de configuración no encontrado. Usando configuración predeterminada interna.")
        config_loaded = False

# Importar funciones de database.py con compatibilidad hacia atrás
try:
    from database import init_db, get_db_connection, DB_NAME
except ImportError:
    from database import init_db, DB_NAME
    # Definir get_db_connection para compatibilidad si no existe
    def get_db_connection():
        conn = sqlite3.connect(DB_NAME)
        return conn, True

# Crear la aplicación Flask
def create_app(config_name=None):
    """
    Crea y configura la aplicación Flask según el entorno
    
    Esta función es compatible con dos modos:
    1. Modo cloud/producción: Usa config.py y variables de entorno
    2. Modo local/desarrollo: Usa configuración básica si config.py no está disponible
    
    Args:
        config_name (str): Nombre del entorno ('development', 'production', 'testing')
        
    Returns:
        Flask app: Aplicación Flask configurada
    """
    # Flask es un "microframework": minimalista pero extensible
    app = Flask(__name__)
    
    # Configuración en modo cloud (si config.py está disponible)
    if config_loaded:
        # Determinar configuración según entorno
        if config_name is None:
            config_name = os.environ.get('FLASK_ENV', 'development')
        
        # Aplicar configuración desde la clase correspondiente
        app.config.from_object(config[config_name])
        config[config_name].init_app(app)
    
    # Configuración en modo local (configuración básica si config.py no está disponible)
    else:
        # Configuración básica para modo local
        app.secret_key = 'tu_clave_secreta_aqui'  # Cambiar por una clave más segura
        app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(hours=2)
        app.config['SESSION_COOKIE_HTTPONLY'] = True
        app.config['SESSION_COOKIE_SECURE'] = False
        app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
    
    # Inicializar la base de datos al arrancar la aplicación
    init_db()
    
    return app

# Crear la aplicación usando el entorno configurado
app = create_app()

# Función para registrar movimientos de inventario
def log_inventory_movement(product_id, product_name, movement_type, quantity_before, quantity_after, reason=None):
    """
    Registra todos los cambios en el inventario para auditoría
    
    Esta función crea un registro histórico de cada modificación:
    - Quién hizo el cambio (usuario)
    - Qué producto se modificó
    - Cuándo se hizo el cambio (timestamp automático)
    - Cuánto cambió la cantidad
    - Por qué se hizo el cambio (razón opcional)
    
    Args:
        product_id (int): ID del producto modificado
        product_name (str): Nombre del producto (para historiales legibles)
        movement_type (str): Tipo de movimiento ('entrada', 'salida', 'ajuste', etc.)
        quantity_before (int): Cantidad antes del cambio
        quantity_after (int): Cantidad después del cambio
        reason (str, optional): Motivo del cambio
    """
    # Verificar que hay un usuario logueado antes de registrar
    if 'user_id' not in session:
        return  # Si no hay sesión, no registrar el movimiento
    
    # Calcular la diferencia de cantidad (puede ser positiva o negativa)
    quantity_change = quantity_after - quantity_before
    
    # Conectar a la base de datos usando la función abstracta
    conn, is_sqlite = get_db_connection()
    cursor = conn.cursor()
    
    # Insertar registro de movimiento en la tabla inventory_movements
    # Los ? son placeholders para prevenir inyección SQL en SQLite
    # Para PostgreSQL/MySQL, los marcadores dependen del driver
    if is_sqlite:
        cursor.execute("""
            INSERT INTO inventory_movements 
            (product_id, product_name, movement_type, quantity_before, quantity_after, quantity_change, reason, user_id, username)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (product_id, product_name, movement_type, quantity_before, quantity_after, quantity_change, reason, session['user_id'], session['username']))
    else:
        # Para PostgreSQL/MySQL, usamos %s como marcador de posición
        cursor.execute("""
            INSERT INTO inventory_movements 
            (product_id, product_name, movement_type, quantity_before, quantity_after, quantity_change, reason, user_id, username)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (product_id, product_name, movement_type, quantity_before, quantity_after, quantity_change, reason, session['user_id'], session['username']))
    
    conn.commit()  # Confirmar cambios
    conn.close()   # Cerrar conexión

# Función para hashear contraseñas (duplicada de database.py por consistencia)
def hash_password(password):
    """
    Convierte contraseña en texto plano a hash SHA-256
    Ver explicación detallada en database.py
    """
    return hashlib.sha256(password.encode()).hexdigest()

# DECORADORES: Funciones que modifican el comportamiento de otras funciones
# Los decoradores son una característica avanzada de Python muy útil en Flask

# Decorador para verificar autenticación
def login_required(f):
    """
    Decorador que verifica si un usuario está logueado antes de acceder a una página
    
    ¿Qué es un decorador?
    - Es una función que toma otra función como parámetro
    - Modifica o extiende el comportamiento de esa función sin cambiar su código
    - Se usa con la sintaxis @decorador_name arriba de la función
    
    Ejemplo de uso:
    @login_required
    def mi_pagina():
        return "Solo usuarios logueados ven esto"
    
    Args:
        f (function): La función que se va a "decorar" (proteger)
        
    Returns:
        function: Nueva función que incluye la verificación de login
    """
    @wraps(f)  # Preserva metadata de la función original (nombre, docstring, etc.)
    def decorated_function(*args, **kwargs):
        # *args: argumentos posicionales, **kwargs: argumentos con nombre
        # Esto permite que el decorador funcione con cualquier función
        
        # Verificar si hay usuario logueado
        if 'user_id' not in session:
            # Si no está logueado, redirigir a la página de login
            return redirect(url_for('login'))
        
        # Verificar si la sesión ha expirado por tiempo
        if 'login_time' in session:
            # Convertir string ISO a objeto datetime
            login_time = datetime.fromisoformat(session['login_time'])
            # Calcular si han pasado más de 2 horas
            if datetime.now() - login_time > timedelta(hours=2):
                session.clear()  # Limpiar sesión expirada
                flash('Su sesión ha expirado. Por favor, inicie sesión nuevamente.', 'info')
                return redirect(url_for('login'))
        
        # Actualizar timestamp de última actividad (para inactividad)
        session['last_activity'] = datetime.now().isoformat()
        session.permanent = True  # Hacer la sesión persistente
        
        # Si todo está bien, ejecutar la función original
        return f(*args, **kwargs)
    
    return decorated_function  # Retornar la función modificada

# Decorador para verificar roles (autorización)
def role_required(required_role):
    """
    Decorador que verifica si un usuario tiene el rol necesario para acceder a una función
    
    Este es un decorador más complejo porque acepta parámetros:
    - Es una función que retorna un decorador
    - Permite especificar qué rol se necesita: 'admin', 'editor' o 'viewer'
    
    Jerarquía de roles:
    - admin: Acceso total (crear usuarios, eliminar, etc.)
    - editor: Puede modificar inventario pero no usuarios
    - viewer: Solo puede ver, no modificar nada
    
    Ejemplo de uso:
    @role_required('admin')
    def eliminar_usuario():
        return "Solo admins pueden eliminar usuarios"
        
    @role_required('editor')
    def agregar_producto():
        return "Editors y admins pueden agregar productos"
    
    Args:
        required_role (str): Rol mínimo requerido ('admin', 'editor', 'viewer')
        
    Returns:
        function: Decorador que verificará el rol del usuario
    """
    def decorator(f):
        """
        Este es el decorador real que se aplicará a la función
        """
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Primero verificar que esté logueado (misma lógica que login_required)
            if 'user_id' not in session:
                return redirect(url_for('login'))
            
            # Verificar expiración de sesión
            if 'login_time' in session:
                login_time = datetime.fromisoformat(session['login_time'])
                if datetime.now() - login_time > timedelta(hours=2):
                    session.clear()
                    flash('Su sesión ha expirado. Por favor, inicie sesión nuevamente.', 'info')
                    return redirect(url_for('login'))
            
            # Actualizar actividad
            session['last_activity'] = datetime.now().isoformat()
            session.permanent = True
            
            # Verificar permisos según el rol requerido
            user_role = session.get('role')
            
            if required_role == 'admin' and user_role != 'admin':
                # Solo administradores pueden acceder
                flash('Acceso denegado. Se requieren permisos de administrador.', 'error')
                return redirect(url_for('dashboard'))
            elif required_role == 'editor' and user_role not in ['admin', 'editor']:
                # Administradores y editores pueden acceder
                flash('Acceso denegado. Se requieren permisos de editor.', 'error')
                return redirect(url_for('dashboard'))
            # Si required_role es 'viewer', cualquier usuario logueado puede acceder
            
            # Si tiene permisos, ejecutar la función original
            return f(*args, **kwargs)
        return decorated_function
    return decorator  # Retornar el decorador

# RUTAS (ENDPOINTS): Funciones que responden a URLs específicas
# Flask usa el decorador @app.route() para asociar URLs con funciones

@app.route("/login", methods=["GET", "POST"])
def login():
    """
    Ruta de autenticación - maneja tanto mostrar el formulario como procesarlo
    
    ¿Qué significa methods=["GET", "POST"]?
    - GET: Mostrar la página de login (cuando usuario navega a /login)
    - POST: Procesar el formulario cuando usuario envía sus credenciales
    
    Flask determina automáticamente si es GET o POST y ejecuta el código correspondiente
    """
    if request.method == "POST":
        # Usuario envió el formulario de login - procesar credenciales
        
        # Obtener datos del formulario
        # request.form es un diccionario con los datos enviados desde el HTML
        username = request.form['username']  # Valor del input name="username"
        password = request.form['password']  # Valor del input name="password"
        
        # Hashear la contraseña para compararla con la BD
        password_hash = hash_password(password)
        
        # Buscar usuario en la base de datos
        conn = sqlite3.connect(DB_NAME)
        cursor = conn.cursor()
        
        # Consulta SQL con placeholder ? para seguridad (previene inyección SQL)
        cursor.execute("SELECT id, role, password_hash FROM users WHERE username = ?", (username,))
        user = cursor.fetchone()  # Obtener primera fila o None si no existe
        conn.close()
        
        # Verificar si usuario existe y contraseña es correcta
        if user and user[2] == password_hash:
            # Login exitoso - crear sesión
            session.permanent = True  # Hacer la sesión permanente pero con tiempo límite
            session['user_id'] = user[0]      # ID del usuario
            session['username'] = username     # Nombre del usuario
            session['role'] = user[1]         # Rol del usuario (admin/editor/viewer)
            session['login_time'] = datetime.now().isoformat()      # Momento del login
            session['last_activity'] = datetime.now().isoformat()   # Última actividad
            
            # flash(): mensaje temporal que se muestra en la siguiente página
            flash('Inicio de sesión exitoso!', 'success')
            
            # Redirigir al dashboard después del login
            return redirect(url_for('dashboard'))
        else:
            # Login fallido
            flash('Usuario o contraseña incorrectos', 'error')
    
    # Si es GET o si el login falló, mostrar el formulario
    # render_template() usa Jinja2 para renderizar HTML con datos dinámicos
    return render_template("login.html")

@app.route("/logout", methods=["GET", "POST"])
def logout():
    """
    Ruta para cerrar sesión
    
    Maneja dos tipos de logout:
    - GET: Usuario hace clic en "Cerrar sesión" (navegación normal)
    - POST: JavaScript del frontend (logout automático por inactividad)
    """
    session.clear()  # Eliminar todos los datos de la sesión
    
    # Solo mostrar mensaje para peticiones GET (navegación normal)
    if request.method == "GET":
        flash('Has cerrado sesión exitosamente', 'info')
        return redirect(url_for('login'))
    else:
        # Para peticiones POST (automáticas), solo retornar estado sin redirect
        # Código 204: "No Content" - operación exitosa sin contenido que mostrar
        return '', 204

@app.route("/clear-session", methods=["POST"])
def clear_session():
    """
    Endpoint específico para limpiar sesión cuando se cierra el navegador
    
    Este endpoint es llamado por JavaScript cuando detecta que el usuario
    está cerrando la pestaña o navegador (evento beforeunload)
    """
    session.clear()
    return '', 204  # Respuesta vacía con código 204

@app.route("/renew-session", methods=["POST"])
@login_required
def renew_session():
    """
    Endpoint para renovar la sesión cuando el usuario confirma actividad
    
    Llamado por JavaScript cuando se detecta que el usuario está activo
    después de un período de inactividad
    """
    session['last_activity'] = datetime.now().isoformat()
    session.permanent = True
    return '', 204

@app.route("/")  # Ruta raíz - página principal
@login_required  # Solo usuarios logueados pueden ver esta página
def home():
    """
    Página principal del inventario
    
    Esta función maneja la pantalla principal donde se muestran todos los productos.
    Incluye funcionalidad de búsqueda y estadísticas básicas.
    
    ¿Cómo funciona la búsqueda?
    - Los parámetros de URL (?search=algo) se obtienen con request.args
    - request.args.get('search', '') obtiene el parámetro 'search' o '' si no existe
    """
    # Obtener término de búsqueda de la URL (ej: /?search=laptop)
    search_query = request.args.get('search', '')
    
    # Conectar a la base de datos
    conn = sqlite3.connect(DB_NAME)
    # row_factory = sqlite3.Row hace que los resultados sean diccionarios
    # En lugar de tuplas: row['name'] en lugar de row[0]
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    if search_query:
        # Si hay búsqueda, filtrar productos
        # LIKE %término% busca el término en cualquier parte del texto
        # Se busca en nombre, categoría y proveedor
        cursor.execute("""
            SELECT * FROM products 
            WHERE name LIKE ? OR category LIKE ? OR provider LIKE ?
            ORDER BY created_at DESC
        """, (f'%{search_query}%', f'%{search_query}%', f'%{search_query}%'))
    else:
        # Sin búsqueda, mostrar todos los productos ordenados por fecha
        cursor.execute("SELECT * FROM products ORDER BY created_at DESC")
    
    productos = cursor.fetchall()  # Obtener todos los resultados
    
    # Calcular estadística adicional: productos con stock bajo
    # quantity < stock_min significa que el stock está por debajo del mínimo
    cursor.execute("SELECT COUNT(*) as low_stock_count FROM products WHERE quantity < stock_min")
    low_stock_count = cursor.fetchone()['low_stock_count']
    
    conn.close()
    
    # render_template() es donde entra Jinja2
    # Jinja2: Motor de plantillas que mezcla HTML con datos dinámicos
    # Los argumentos se convierten en variables disponibles en el template HTML
    return render_template("index.html", 
                         productos=productos,           # Lista de productos para mostrar
                         low_stock_count=low_stock_count,  # Número para badge de alerta
                         search_query=search_query)     # Para mantener el texto en el buscador

@app.route("/add", methods=["GET", "POST"])
@role_required('editor')  # Solo editores y administradores pueden agregar productos
def add_product():
    """
    Ruta para agregar nuevos productos al inventario
    
    Esta función maneja tanto mostrar el formulario como procesar los datos:
    - GET: Muestra formulario vacío para agregar producto
    - POST: Procesa datos del formulario y crea el producto
    
    Validaciones incluidas:
    - SKU único (si se proporciona)
    - Conversión de tipos de datos (int, float)
    - Manejo de errores con try/catch
    """
    if request.method == "POST":
        try:
            # Obtener y procesar datos del formulario
            name = request.form["name"]
            # SKU: convertir a mayúsculas y limpiar espacios, o None si está vacío
            sku = request.form["sku"].upper().strip() if request.form.get("sku") else None
            category = request.form["category"]
            quantity = int(request.form["quantity"])  # Conversión explícita a entero
            price = float(request.form["price"])      # Conversión explícita a decimal
            provider = request.form["provider"]
            stock_min = int(request.form["stock_min"])

            conn = sqlite3.connect(DB_NAME)
            cursor = conn.cursor()
            
            # Verificar unicidad del SKU si se proporcionó
            if sku:
                cursor.execute("SELECT id FROM products WHERE sku = ? AND sku IS NOT NULL", (sku,))
                existing_product = cursor.fetchone()
                if existing_product:
                    flash(f'Ya existe un producto con el SKU: {sku}', 'error')
                    conn.close()
                    return render_template("add_product.html")  # Volver al formulario
            
            # Insertar nuevo producto en la base de datos
            cursor.execute("""
                INSERT INTO products (name, sku, category, quantity, price, provider, stock_min)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (name, sku, category, quantity, price, provider, stock_min))
            
            # Obtener el ID del producto recién creado
            # lastrowid: ID autogenerado de la última inserción
            product_id = cursor.lastrowid
            conn.commit()
            conn.close()

            # Registrar movimiento de inventario (creación del producto)
            log_inventory_movement(product_id, name, 'creacion', 0, quantity, f'Producto creado con stock inicial de {quantity}')

            flash('Producto agregado exitosamente!', 'success')
            return redirect("/")  # Redirigir a la página principal
            
        except Exception as e:
            # Manejo de errores: conversiones fallidas, problemas de BD, etc.
            flash(f'Error al agregar el producto: {str(e)}', 'error')
            return render_template("add_product.html")  # Volver al formulario con error

    # GET request: mostrar formulario vacío
    return render_template("add_product.html")

@app.route("/manage_users")
@role_required('admin')  # Solo administradores pueden gestionar usuarios
def manage_users():
    """
    Página de gestión de usuarios del sistema
    
    Esta ruta muestra una lista de todos los usuarios registrados con sus roles.
    Permite a los administradores ver quién tiene acceso al sistema y con qué permisos.
    
    Returns:
        Template con lista de usuarios para mostrar en la interfaz
    """
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row  # Para acceder a columnas por nombre
    cursor = conn.cursor()
    
    # Obtener todos los usuarios ordenados alfabéticamente
    # No incluimos password_hash por seguridad
    cursor.execute("SELECT id, username, role FROM users ORDER BY username")
    users = cursor.fetchall()
    conn.close()
    
    return render_template("manage_users.html", users=users)

@app.route("/create_user", methods=["POST"])
@role_required('admin')  # Solo administradores pueden crear usuarios
def create_user():
    """
    Crear un nuevo usuario en el sistema
    
    Esta función procesa el formulario de creación de usuarios desde manage_users.html.
    Incluye validación de unicidad del nombre de usuario.
    
    Proceso:
    1. Obtener datos del formulario
    2. Hashear la contraseña para almacenamiento seguro
    3. Intentar insertar en la base de datos
    4. Manejar error si el username ya existe (constraint UNIQUE)
    """
    # Obtener datos del formulario
    username = request.form['username']
    password = request.form['password']
    role = request.form['role']
    
    # Hashear contraseña antes de almacenar (NUNCA guardar en texto plano)
    password_hash = hash_password(password)
    
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    
    try:
        # Intentar insertar nuevo usuario
        cursor.execute("INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)", 
                      (username, password_hash, role))
        conn.commit()
        flash(f'Usuario {username} creado exitosamente!', 'success')
    except sqlite3.IntegrityError:
        # Error de integridad: username ya existe (constraint UNIQUE)
        flash('El nombre de usuario ya existe', 'error')
    finally:
        # Siempre cerrar la conexión, sin importar si hubo error
        conn.close()
    
    # Redirigir de vuelta a la página de gestión de usuarios
    return redirect(url_for('manage_users'))

@app.route("/delete_user/<int:user_id>")
@role_required('admin')  # Solo administradores pueden eliminar usuarios
def delete_user(user_id):
    """
    Eliminar un usuario del sistema con validaciones de seguridad
    
    Esta función implementa múltiples capas de seguridad:
    1. No puedes eliminar tu propia cuenta (evita quedarse sin acceso)
    2. Los administradores no pueden eliminarse entre sí (evita sabotaje)
    3. No se puede eliminar el último usuario (evita sistema sin usuarios)
    
    Args:
        user_id (int): ID del usuario a eliminar (viene de la URL)
        
    Returns:
        Redirect a manage_users con mensaje de éxito o error
    """
    # VALIDACIÓN 1: No puedes eliminar tu propia cuenta
    if user_id == session.get('user_id'):
        flash('No puedes eliminar tu propia cuenta', 'error')
        return redirect(url_for('manage_users'))
    
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    
    # Verificar que el usuario existe y obtener su rol
    cursor.execute("SELECT role FROM users WHERE id = ?", (user_id,))
    user_to_delete = cursor.fetchone()
    
    if not user_to_delete:
        flash('Usuario no encontrado', 'error')
        conn.close()
        return redirect(url_for('manage_users'))
    
    # VALIDACIÓN 2: Evitar que los administradores se eliminen entre sí
    # Esto previene que un admin malicioso elimine a otros admins
    if user_to_delete[0] == 'admin':
        flash('No se puede eliminar a otro administrador por seguridad', 'error')
        conn.close()
        return redirect(url_for('manage_users'))
    
    # VALIDACIÓN 3: Verificar que no es el último usuario del sistema
    cursor.execute("SELECT COUNT(*) FROM users")
    total_users = cursor.fetchone()[0]
    
    if total_users <= 1:
        flash('No se puede eliminar el último usuario del sistema', 'error')
        conn.close()
        return redirect(url_for('manage_users'))
    
    # Si pasa todas las validaciones, proceder con la eliminación
    cursor.execute("DELETE FROM users WHERE id = ?", (user_id,))
    conn.commit()
    conn.close()
    
    flash('Usuario eliminado exitosamente', 'success')
    return redirect(url_for('manage_users'))

@app.route("/reports")
@login_required  # Cualquier usuario logueado puede ver reportes
def reports():
    """
    Página de reportes completos del inventario
    
    Esta función genera múltiples tipos de análisis:
    - Estadísticas generales del inventario
    - Productos con problemas (stock bajo, sin stock)
    - Análisis por categorías y proveedores
    - Tendencias de movimientos
    - Datos para gráficos (que usa Chart.js en el frontend)
    
    Las consultas SQL aquí son más avanzadas, usando:
    - Funciones agregadas (COUNT, SUM, AVG, MIN, MAX)
    - GROUP BY para agrupar datos
    - CASE WHEN para lógica condicional
    - Subconsultas y JOINs
    - Filtros por fechas
    """
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    # REPORTE 1: Productos con bajo stock (críticos)
    cursor.execute("SELECT * FROM products WHERE quantity < stock_min ORDER BY quantity ASC")
    low_stock = [dict(row) for row in cursor.fetchall()]
    
    # REPORTE 2: Estadísticas generales del inventario
    # Esta consulta calcula múltiples métricas en una sola pasada
    cursor.execute("""
        SELECT 
            COUNT(*) as total_products,           -- Total de productos únicos
            SUM(quantity) as total_items,         -- Total de unidades en inventario
            AVG(price) as avg_price,              -- Precio promedio
            MIN(price) as min_price,              -- Precio más bajo
            MAX(price) as max_price,              -- Precio más alto
            SUM(quantity * price) as total_value  -- Valor total del inventario
        FROM products
    """)
    stats = dict(cursor.fetchone())
    
    # REPORTE 3: Análisis por categoría
    # GROUP BY agrupa filas por categoría y calcula métricas para cada grupo
    cursor.execute("""
        SELECT 
            category, 
            COUNT(*) as product_count,                    -- Productos por categoría
            SUM(quantity) as total_items,                 -- Unidades por categoría
            AVG(price) as avg_price,                      -- Precio promedio por categoría
            SUM(quantity * price) as category_value       -- Valor total por categoría
        FROM products 
        WHERE category IS NOT NULL AND category != ''     -- Excluir categorías vacías
        GROUP BY category 
        ORDER BY product_count DESC                       -- Ordenar por cantidad de productos
    """)
    categories = [dict(row) for row in cursor.fetchall()]
    
    # REPORTE 4: Top 10 productos más valiosos
    # Calculamos valor = cantidad × precio
    cursor.execute("""
        SELECT 
            name, 
            category, 
            quantity, 
            price, 
            (quantity * price) as total_value
        FROM products 
        ORDER BY total_value DESC 
        LIMIT 10
    """)
    top_products = [dict(row) for row in cursor.fetchall()]
    
    # REPORTE 5: Productos sin stock (cantidad = 0)
    cursor.execute("SELECT * FROM products WHERE quantity = 0 ORDER BY name")
    no_stock = [dict(row) for row in cursor.fetchall()]
    
    # REPORTE 6: Productos agregados recientemente (últimos 30 días)
    # date() convierte timestamp a fecha, 'now' es la fecha actual
    cursor.execute("""
        SELECT * FROM products 
        WHERE date(created_at) >= date('now', '-30 days')
        ORDER BY created_at DESC
    """)
    recent_products = [dict(row) for row in cursor.fetchall()]
    
    # DATOS PARA GRÁFICOS (Chart.js en el frontend)
    
    # GRÁFICO 1: Tendencias de movimientos por día (últimos 30 días)
    # CASE WHEN es como un if/else en SQL
    cursor.execute("""
        SELECT 
            date(created_at) as date,
            COUNT(*) as movement_count,
            SUM(CASE WHEN movement_type = 'entrada' THEN quantity_change ELSE 0 END) as total_entries,
            SUM(CASE WHEN movement_type = 'salida' THEN ABS(quantity_change) ELSE 0 END) as total_exits
        FROM inventory_movements 
        WHERE date(created_at) >= date('now', '-30 days')
        GROUP BY date(created_at)
        ORDER BY date(created_at)
    """)
    movement_trends = [dict(row) for row in cursor.fetchall()]
    
    # GRÁFICO 2: Productos más movidos (mayor actividad)
    cursor.execute("""
        SELECT 
            product_name,
            COUNT(*) as movement_count,              -- Número de movimientos
            SUM(ABS(quantity_change)) as total_moved -- Total de unidades movidas
        FROM inventory_movements 
        GROUP BY product_name
        ORDER BY movement_count DESC
        LIMIT 10
    """)
    most_moved_products = [dict(row) for row in cursor.fetchall()]
    
    # GRÁFICO 3: Distribución de niveles de stock
    # CASE WHEN crea categorías basadas en condiciones
    cursor.execute("""
        SELECT 
            CASE 
                WHEN quantity = 0 THEN 'Sin stock'
                WHEN quantity < stock_min THEN 'Stock bajo'
                WHEN quantity >= stock_min AND quantity < stock_min * 2 THEN 'Stock normal'
                ELSE 'Stock alto'
            END as stock_level,
            COUNT(*) as product_count
        FROM products
        GROUP BY stock_level
    """)
    stock_distribution = [dict(row) for row in cursor.fetchall()]
    
    conn.close()
    
    # Pasar todos los datos al template para renderizar
    # Chart.js usará estos datos para crear gráficos interactivos
    return render_template("report.html", 
                         low_stock=low_stock, 
                         stats=stats, 
                         categories=categories,
                         top_products=top_products,
                         no_stock=no_stock,
                         recent_products=recent_products,
                         movement_trends=movement_trends,
                         most_moved_products=most_moved_products,
                         stock_distribution=stock_distribution)

@app.route("/edit_product/<int:product_id>", methods=["GET", "POST"])
@role_required('editor')  # Solo editores y administradores pueden editar
def edit_product(product_id):
    """
    Editar un producto existente
    
    Esta función maneja la edición de productos con seguimiento de cambios:
    - GET: Muestra formulario pre-llenado con datos actuales
    - POST: Procesa cambios y registra movimientos de inventario si cambia la cantidad
    
    Args:
        product_id (int): ID del producto a editar (viene de la URL)
        
    Características especiales:
    - Detecta cambios en cantidad y registra movimientos automáticamente
    - Preserva datos originales para comparación
    - Manejo de errores si el producto no existe
    """
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    
    if request.method == "POST":
        # Procesar formulario de edición
        name = request.form["name"]
        category = request.form["category"]
        quantity = int(request.form["quantity"])
        price = float(request.form["price"])
        provider = request.form["provider"]
        stock_min = int(request.form["stock_min"])
        
        # Obtener datos anteriores para comparación y auditoría
        cursor.execute("SELECT name, quantity FROM products WHERE id = ?", (product_id,))
        old_product = cursor.fetchone()
        old_quantity = old_product[1] if old_product else 0
        old_name = old_product[0] if old_product else name
        
        # Actualizar producto en la base de datos
        cursor.execute("""
            UPDATE products 
            SET name = ?, category = ?, quantity = ?, price = ?, provider = ?, stock_min = ?
            WHERE id = ?
        """, (name, category, quantity, price, provider, stock_min, product_id))
        conn.commit()
        conn.close()
        
        # Registrar movimiento de inventario si cambió la cantidad
        if quantity != old_quantity:
            if quantity > old_quantity:
                # Aumentó la cantidad - es una entrada
                movement_type = 'entrada'
                reason = f'Actualización de producto: entrada de {quantity - old_quantity} unidades'
            else:
                # Disminuyó la cantidad - es una salida
                movement_type = 'salida'
                reason = f'Actualización de producto: salida de {old_quantity - quantity} unidades'
            
            # Registrar el movimiento para auditoría
            log_inventory_movement(product_id, name, movement_type, old_quantity, quantity, reason)
        
        flash('Producto actualizado exitosamente!', 'success')
        return redirect(url_for('home'))
    
    # GET request: mostrar formulario con datos actuales
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM products WHERE id = ?", (product_id,))
    product = cursor.fetchone()
    conn.close()
    
    # Verificar que el producto existe
    if not product:
        flash('Producto no encontrado', 'error')
        return redirect(url_for('home'))
    
    # Renderizar formulario pre-llenado con datos actuales
    return render_template("edit_product.html", product=product)

@app.route("/delete_product/<int:product_id>")
@role_required('editor')  # Solo editores y administradores pueden eliminar
def delete_product(product_id):
    """
    Eliminar un producto del inventario
    
    Esta función elimina permanentemente un producto y registra el movimiento
    para mantener el historial de auditoría.
    
    Args:
        product_id (int): ID del producto a eliminar (viene de la URL)
        
    Proceso:
    1. Obtener información del producto antes de eliminarlo
    2. Eliminar de la base de datos
    3. Registrar movimiento de eliminación (cantidad final = 0)
    4. Redirigir con mensaje de confirmación
    """
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    
    # Obtener información del producto antes de eliminarlo
    # Necesitamos estos datos para el registro de movimiento
    cursor.execute("SELECT name, quantity FROM products WHERE id = ?", (product_id,))
    product = cursor.fetchone()
    
    if product:
        product_name, quantity = product
        
        # Eliminar producto de la base de datos
        cursor.execute("DELETE FROM products WHERE id = ?", (product_id,))
        conn.commit()
        
        # Registrar movimiento de eliminación para auditoría
        # La cantidad final es 0 porque el producto ya no existe
        log_inventory_movement(product_id, product_name, 'eliminacion', quantity, 0, 'Producto eliminado del inventario')
        
        flash('Producto eliminado exitosamente', 'success')
    else:
        # El producto no existe
        flash('Producto no encontrado', 'error')
    
    conn.close()
    return redirect(url_for('home'))

@app.route("/inventory_movements")
@login_required  # Cualquier usuario puede ver el historial
def inventory_movements():
    """
    Página de historial de movimientos de inventario con paginación y filtros
    
    Esta función maneja una tabla grande de datos usando técnicas avanzadas:
    - PAGINACIÓN: Divide resultados en páginas para mejor rendimiento
    - FILTROS: Permite buscar por producto, tipo de movimiento, fechas
    - CONSTRUCCIÓN DINÁMICA DE SQL: Query se construye según filtros aplicados
    
    ¿Por qué paginación?
    Si tienes miles de movimientos, cargar todos consume mucha memoria y es lento.
    La paginación carga solo 50 registros por página.
    
    Parámetros de URL esperados:
    - page: número de página (ej: ?page=2)
    - product: filtro por nombre de producto
    - movement_type: filtro por tipo ('entrada', 'salida', etc.)
    - date_from: fecha desde (YYYY-MM-DD)
    - date_to: fecha hasta (YYYY-MM-DD)
    """
    # Obtener parámetros de paginación y filtros de la URL
    page = request.args.get('page', 1, type=int)  # Página actual, por defecto 1
    per_page = 50  # Registros por página
    offset = (page - 1) * per_page  # Calcular posición de inicio
    
    # Obtener filtros de búsqueda
    product_filter = request.args.get('product', '')
    movement_type_filter = request.args.get('movement_type', '')
    date_from = request.args.get('date_from', '')
    date_to = request.args.get('date_to', '')
    
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    # CONSTRUCCIÓN DINÁMICA DE CONSULTA SQL
    # Empezamos con una query base y agregamos WHERE según filtros
    query = "SELECT * FROM inventory_movements WHERE 1=1"  # 1=1 siempre es true
    params = []  # Lista de parámetros para la consulta
    
    # Agregar filtros dinámicamente
    if product_filter:
        query += " AND product_name LIKE ?"
        params.append(f'%{product_filter}%')  # %texto% busca texto en cualquier posición
    
    if movement_type_filter:
        query += " AND movement_type = ?"
        params.append(movement_type_filter)
    
    if date_from:
        query += " AND date(created_at) >= ?"  # date() extrae solo la fecha
        params.append(date_from)
    
    if date_to:
        query += " AND date(created_at) <= ?"
        params.append(date_to)
    
    # CALCULAR TOTAL DE REGISTROS para la paginación
    # Reemplazamos SELECT * por SELECT COUNT(*) en la misma query
    count_query = query.replace("SELECT *", "SELECT COUNT(*)")
    cursor.execute(count_query, params)
    total_records = cursor.fetchone()[0]
    
    # OBTENER REGISTROS DE LA PÁGINA ACTUAL
    # LIMIT: máximo registros a devolver
    # OFFSET: cuántos registros saltar desde el inicio
    query += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
    params.extend([per_page, offset])
    
    cursor.execute(query, params)
    movements = cursor.fetchall()
    
    # CALCULAR INFORMACIÓN DE PAGINACIÓN
    total_pages = (total_records + per_page - 1) // per_page  # División con redondeo hacia arriba
    has_prev = page > 1                    # ¿Hay página anterior?
    has_next = page < total_pages          # ¿Hay página siguiente?
    
    conn.close()
    
    # Pasar todos los datos al template
    # El template usará esta información para mostrar:
    # - Los movimientos de la página actual
    # - Controles de paginación (anterior/siguiente)
    # - Información de filtros aplicados
    return render_template("inventory_movements.html", 
                         movements=movements,
                         page=page,
                         total_pages=total_pages,
                         has_prev=has_prev,
                         has_next=has_next,
                         total_records=total_records,
                         product_filter=product_filter,
                         movement_type_filter=movement_type_filter,
                         date_from=date_from,
                         date_to=date_to)

@app.route("/quick_stock_adjustment/<int:product_id>", methods=["GET", "POST"])
@role_required('editor')  # Solo editores y administradores
def quick_stock_adjustment(product_id):
    """
    Ajuste rápido de stock para un producto específico
    
    Esta función permite hacer ajustes rápidos sin editar todo el producto:
    - Agregar stock (entrada de mercancía)
    - Quitar stock (salida, daños, pérdidas)
    - Con razón obligatoria para auditoría
    
    Args:
        product_id (int): ID del producto a ajustar
        
    Casos de uso típicos:
    - Llega mercancía nueva → agregar stock
    - Se detecta producto dañado → quitar stock
    - Inventario físico revela diferencias → ajustar
    """
    if request.method == "POST":
        # Procesar ajuste de stock
        adjustment_type = request.form["adjustment_type"]  # 'add' o 'subtract'
        quantity = int(request.form["quantity"])           # Cantidad a ajustar
        reason = request.form["reason"]                    # Motivo del ajuste
        
        conn = sqlite3.connect(DB_NAME)
        cursor = conn.cursor()
        
        # Obtener información actual del producto
        cursor.execute("SELECT name, quantity FROM products WHERE id = ?", (product_id,))
        product = cursor.fetchone()
        
        if not product:
            flash('Producto no encontrado', 'error')
            return redirect(url_for('home'))
        
        product_name, current_quantity = product
        
        # Calcular nueva cantidad según el tipo de ajuste
        if adjustment_type == 'add':
            # Agregar stock
            new_quantity = current_quantity + quantity
            movement_type = 'entrada'
            reason = f'Ajuste de inventario: +{quantity} - {reason}'
        else:  # subtract
            # Quitar stock (no permitir cantidad negativa)
            new_quantity = max(0, current_quantity - quantity)
            movement_type = 'salida'
            reason = f'Ajuste de inventario: -{quantity} - {reason}'
        
        # Actualizar cantidad en la base de datos
        cursor.execute("UPDATE products SET quantity = ? WHERE id = ?", (new_quantity, product_id))
        conn.commit()
        conn.close()
        
        # Registrar movimiento para auditoría
        log_inventory_movement(product_id, product_name, movement_type, current_quantity, new_quantity, reason)
        
        flash('Ajuste de inventario realizado exitosamente', 'success')
        return redirect(url_for('home'))
    
    # GET request: mostrar formulario de ajuste
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM products WHERE id = ?", (product_id,))
    product = cursor.fetchone()
    conn.close()
    
    if not product:
        flash('Producto no encontrado', 'error')
        return redirect(url_for('home'))
    
    return render_template("quick_stock_adjustment.html", product=product)

@app.route("/dashboard")
@login_required  # Cualquier usuario puede ver el dashboard
def dashboard():
    """
    Panel de control principal del sistema
    
    El dashboard es la primera página que ven los usuarios después del login.
    Proporciona un resumen ejecutivo con las métricas más importantes:
    
    - Estadísticas rápidas del inventario
    - Actividad reciente (últimos movimientos)
    - Productos que requieren atención (stock bajo/crítico)
    - Actividad por usuario (últimos 7 días)
    
    Está diseñado para dar una vista panorámica del estado del inventario
    y permitir identificar problemas rápidamente.
    """
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    # MÉTRICAS PRINCIPALES del inventario
    # Esta consulta calcula todas las estadísticas clave en una sola pasada
    cursor.execute("""
        SELECT 
            COUNT(*) as total_products,                                    -- Total de productos únicos
            SUM(quantity) as total_items,                                  -- Total de unidades
            SUM(quantity * price) as total_value,                          -- Valor total del inventario
            COUNT(CASE WHEN quantity < stock_min THEN 1 END) as low_stock_count,    -- Productos con stock bajo
            COUNT(CASE WHEN quantity = 0 THEN 1 END) as out_of_stock_count          -- Productos sin stock
        FROM products
    """)
    dashboard_stats = cursor.fetchone()
    
    # ACTIVIDAD RECIENTE - últimos 10 movimientos
    # Permite ver qué ha pasado recientemente en el inventario
    cursor.execute("""
        SELECT * FROM inventory_movements 
        ORDER BY created_at DESC 
        LIMIT 10
    """)
    recent_movements = cursor.fetchall()
    
    # PRODUCTOS QUE NECESITAN ATENCIÓN
    # Solo productos con stock bajo o sin stock, con nivel de alerta
    cursor.execute("""
        SELECT *, 
               CASE 
                   WHEN quantity = 0 THEN 'critical'      -- Sin stock: crítico (rojo)
                   WHEN quantity < stock_min THEN 'warning'   -- Stock bajo: advertencia (amarillo)
                   ELSE 'normal'                          -- Stock normal: OK (verde)
               END as alert_level
        FROM products 
        WHERE quantity <= stock_min    -- Solo productos con problemas
        ORDER BY quantity ASC          -- Los más críticos primero
        LIMIT 10
    """)
    alert_products = cursor.fetchall()
    
    # ACTIVIDAD POR USUARIO (últimos 7 días)
    # Permite ver quién está usando el sistema activamente
    cursor.execute("""
        SELECT 
            username,
            COUNT(*) as movement_count,                    -- Número de movimientos
            SUM(ABS(quantity_change)) as total_quantity_moved  -- Total de unidades movidas
        FROM inventory_movements 
        WHERE date(created_at) >= date('now', '-7 days')   -- Solo últimos 7 días
        GROUP BY username
        ORDER BY movement_count DESC                       -- Los más activos primero
    """)
    user_activity = cursor.fetchall()
    
    conn.close()
    
    # Pasar todos los datos al template del dashboard
    # El template organizará esta información en widgets/cards visuales
    return render_template("dashboard.html", 
                         dashboard_stats=dashboard_stats,
                         recent_movements=recent_movements,
                         alert_products=alert_products,
                         user_activity=user_activity)

@app.route("/export_csv")
@login_required  # Cualquier usuario puede exportar
def export_csv():
    """
    Exportar inventario completo a archivo CSV
    
    CSV (Comma Separated Values) es un formato universal para datos tabulares.
    Puede abrirse en Excel, Google Sheets, o cualquier programa de hojas de cálculo.
    
    ¿Cómo funciona?
    1. Obtener todos los productos de la base de datos
    2. Crear archivo CSV en memoria (no en disco)
    3. Escribir encabezados y datos
    4. Devolver archivo como descarga
    
    Ventajas del CSV:
    - Compatible con todos los programas de hojas de cálculo
    - Formato ligero y rápido
    - Fácil de procesar por otros sistemas
    """
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    # Obtener todos los productos ordenados por nombre
    cursor.execute("SELECT * FROM products ORDER BY name")
    products = cursor.fetchall()
    conn.close()
    
    # Crear archivo CSV en memoria usando StringIO
    # StringIO permite trabajar con texto como si fuera un archivo
    output = io.StringIO()
    writer = csv.writer(output)  # Objeto para escribir CSV
    
    # Escribir fila de encabezados (nombres de columnas)
    writer.writerow(['ID', 'Nombre', 'Categoría', 'Cantidad', 'Precio', 'Proveedor', 'Stock Mínimo', 'Fecha de Creación'])
    
    # Escribir datos de cada producto
    for product in products:
        writer.writerow([
            product['id'],
            product['name'],
            product['category'],
            product['quantity'],
            product['price'],
            product['provider'],
            product['stock_min'],
            product['created_at']
        ])
    
    # Volver al inicio del archivo en memoria
    output.seek(0)
    
    # Crear respuesta HTTP con el archivo CSV
    # Response: clase de Flask para respuestas personalizadas
    return Response(
        output.getvalue(),                    # Contenido del archivo
        mimetype='text/csv',                  # Tipo de contenido
        headers={'Content-Disposition': 'attachment; filename=inventario.csv'}  # Forzar descarga
    )

@app.route("/custom_reports")
@login_required  # Cualquier usuario puede acceder a reportes personalizados
def custom_reports():
    """
    Página de reportes personalizados
    
    Esta función prepara la interfaz para que los usuarios puedan crear
    reportes a medida con diferentes filtros y tipos de análisis.
    
    Funcionalidad:
    - Obtiene listas de categorías y proveedores para filtros
    - Prepara formulario dinámico para selección de criterios
    - No genera datos hasta que el usuario envía el formulario
    """
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    # Obtener listas únicas para filtros dinámicos
    # DISTINCT elimina duplicados
    cursor.execute("SELECT DISTINCT category FROM products ORDER BY category")
    categories = [row['category'] for row in cursor.fetchall()]
    
    cursor.execute("SELECT DISTINCT provider FROM products ORDER BY provider")
    providers = [row['provider'] for row in cursor.fetchall()]
    
    conn.close()
    
    # Renderizar formulario con listas para dropdowns
    return render_template('custom_reports.html', 
                         categories=categories, 
                         providers=providers,
                         filters={})  # Sin filtros aplicados inicialmente

@app.route("/generate_custom_report", methods=["POST"])
@login_required
def generate_custom_report():
    """
    Generar reportes personalizados basados en criterios del usuario
    
    Esta es una de las funciones más complejas del sistema porque:
    1. Maneja múltiples tipos de reportes diferentes
    2. Construye consultas SQL dinámicamente según los filtros
    3. Proporciona mensajes contextuales cuando no hay resultados
    4. Mantiene el estado del formulario para facilitar ajustes
    
    Tipos de reportes disponibles:
    - inventory_by_category: Inventario agrupado por categoría
    - low_stock: Productos con stock bajo
    - movements_by_period: Movimientos en un período de tiempo
    - value_by_provider: Valor de inventario por proveedor
    - general: Reporte general con filtros múltiples
    """
    # Obtener todos los parámetros del formulario
    report_type = request.form['report_type']
    date_from = request.form.get('date_from', '')
    date_to = request.form.get('date_to', '')
    category = request.form.get('category', '')
    provider = request.form.get('provider', '')
    stock_level = request.form.get('stock_level', '')
    
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    # CONSTRUCCIÓN DINÁMICA DE CONSULTAS por tipo de reporte
    # Cada tipo tiene su propia lógica SQL optimizada
    
    if report_type == 'inventory_by_category':
        # Reporte: Inventario agrupado por categoría
        query = """
            SELECT category, 
                   COUNT(*) as total_products, 
                   SUM(quantity) as total_quantity, 
                   SUM(quantity * price) as total_value
            FROM products 
            WHERE 1=1
        """
        params = []
        
        if category:
            query += " AND category = ?"
            params.append(category)
            
        query += " GROUP BY category ORDER BY total_value DESC"
        
    elif report_type == 'low_stock':
        # Reporte: Productos con stock bajo
        query = """
            SELECT name, category, quantity, stock_min, provider, 
                   (stock_min - quantity) as deficit
            FROM products 
            WHERE quantity <= stock_min
        """
        params = []
        
        if category:
            query += " AND category = ?"
            params.append(category)
            
        query += " ORDER BY deficit DESC"
        
    elif report_type == 'movements_by_period':
        # Reporte: Movimientos de inventario en período específico
        # Usa JOINs para obtener información relacionada
        query = """
            SELECT im.*, p.name as product_name, p.category, u.username
            FROM inventory_movements im
            JOIN products p ON im.product_id = p.id      -- Relacionar con productos
            JOIN users u ON im.user_id = u.id            -- Relacionar con usuarios
            WHERE 1=1
        """
        params = []
        
        if date_from:
            query += " AND date(im.created_at) >= ?"
            params.append(date_from)
            
        if date_to:
            query += " AND date(im.created_at) <= ?"
            params.append(date_to)
            
        if category:
            query += " AND p.category = ?"
            params.append(category)
            
        query += " ORDER BY im.created_at DESC"
        
    elif report_type == 'value_by_provider':
        # Reporte: Valor de inventario agrupado por proveedor
        query = """
            SELECT provider, 
                   COUNT(*) as total_products, 
                   SUM(quantity) as total_quantity,
                   SUM(quantity * price) as total_value
            FROM products 
            WHERE 1=1
        """
        params = []
        
        if provider:
            query += " AND provider = ?"
            params.append(provider)
            
        query += " GROUP BY provider ORDER BY total_value DESC"
        
    else:
        # Reporte general de inventario con filtros múltiples
        query = """
            SELECT * FROM products 
            WHERE 1=1
        """
        params = []
        
        if category:
            query += " AND category = ?"
            params.append(category)
            
        if provider:
            query += " AND provider = ?"
            params.append(provider)
            
        if stock_level == 'low':
            query += " AND quantity <= stock_min"
        elif stock_level == 'high':
            query += " AND quantity > stock_min * 2"
            
        query += " ORDER BY name"
    
    # Ejecutar la consulta construida dinámicamente
    cursor.execute(query, params)
    results = cursor.fetchall()
    
    # MANEJO DE RESULTADOS VACÍOS con mensajes contextuales
    if not results:
        # Crear mensaje personalizado según el tipo de reporte y filtros aplicados
        if report_type == 'inventory_by_category':
            no_results_message = f"No se encontraron productos en la categoría '{category}'" if category else "No hay productos agrupados por categorías"
        elif report_type == 'low_stock':
            no_results_message = f"No hay productos con stock bajo en la categoría '{category}'" if category else "¡Excelente! No hay productos con stock bajo"
        elif report_type == 'movements_by_period':
            # Construir mensaje dinámico basado en filtros de fecha
            period_text = ""
            if date_from and date_to:
                period_text = f" entre {date_from} y {date_to}"
            elif date_from:
                period_text = f" desde {date_from}"
            elif date_to:
                period_text = f" hasta {date_to}"
            
            category_text = f" en la categoría '{category}'" if category else ""
            no_results_message = f"No se encontraron movimientos de inventario{period_text}{category_text}"
        elif report_type == 'value_by_provider':
            no_results_message = f"No se encontraron productos del proveedor '{provider}'" if provider else "No hay productos agrupados por proveedor"
        else:
            # Mensaje para reporte general con múltiples filtros
            filters_applied = []
            if category:
                filters_applied.append(f"categoría '{category}'")
            if provider:
                filters_applied.append(f"proveedor '{provider}'")
            if stock_level == 'low':
                filters_applied.append("stock bajo")
            elif stock_level == 'high':
                filters_applied.append("stock alto")
            
            if filters_applied:
                filters_text = " y ".join(filters_applied)
                no_results_message = f"No se encontraron productos con los filtros: {filters_text}"
            else:
                no_results_message = "No hay productos registrados en el inventario"
        
        flash(f'No se encontraron resultados. {no_results_message}', 'info')
    
    # Obtener listas actualizadas para mantener los dropdowns
    cursor.execute("SELECT DISTINCT category FROM products ORDER BY category")
    categories = [row['category'] for row in cursor.fetchall()]
    
    cursor.execute("SELECT DISTINCT provider FROM products ORDER BY provider")
    providers = [row['provider'] for row in cursor.fetchall()]
    
    conn.close()
    
    # Renderizar template con resultados y mantener estado del formulario
    return render_template('custom_reports.html', 
                         results=results, 
                         report_type=report_type,
                         categories=categories,
                         providers=providers,
                         filters={
                             'date_from': date_from,
                             'date_to': date_to,
                             'category': category,
                             'provider': provider,
                             'stock_level': stock_level
                         },
                         total_results=len(results) if results else 0)

@app.route("/export_custom_report", methods=["POST"])
@login_required
def export_custom_report():
    """
    Exportar reportes personalizados a archivo CSV
    
    Esta función toma los mismos parámetros que generate_custom_report
    pero en lugar de mostrar los resultados en pantalla, los exporta
    como archivo CSV descargable.
    
    Funcionalidad:
    1. Reutiliza la misma lógica de consultas que generate_custom_report
    2. Genera encabezados apropiados para cada tipo de reporte
    3. Crea nombre de archivo único con timestamp
    4. Convierte todos los valores a string para compatibilidad CSV
    
    Ventaja: Los usuarios pueden analizar los datos en Excel o otras herramientas
    """
    # Reutilizar la lógica del reporte personalizado
    # Obtener los mismos parámetros que en generate_custom_report
    report_type = request.form['report_type']
    date_from = request.form.get('date_from', '')
    date_to = request.form.get('date_to', '')
    category = request.form.get('category', '')
    provider = request.form.get('provider', '')
    stock_level = request.form.get('stock_level', '')
    
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    # REPETIR LA MISMA LÓGICA DE CONSULTAS pero definir encabezados para CSV
    # (código repetido para mantener la funcionalidad independiente)
    
    if report_type == 'inventory_by_category':
        query = """
            SELECT category, COUNT(*) as total_products, SUM(quantity) as total_quantity, 
                   SUM(quantity * price) as total_value
            FROM products 
            WHERE 1=1
        """
        params = []
        
        if category:
            query += " AND category = ?"
            params.append(category)
            
        query += " GROUP BY category ORDER BY total_value DESC"
        headers = ['Categoría', 'Total Productos', 'Total Cantidad', 'Valor Total']
        
    elif report_type == 'low_stock':
        query = """
            SELECT name, category, quantity, stock_min, provider, 
                   (stock_min - quantity) as deficit
            FROM products 
            WHERE quantity <= stock_min
        """
        params = []
        
        if category:
            query += " AND category = ?"
            params.append(category)
            
        query += " ORDER BY deficit DESC"
        headers = ['Producto', 'Categoría', 'Cantidad', 'Stock Mínimo', 'Proveedor', 'Déficit']
        
    elif report_type == 'movements_by_period':
        query = """
            SELECT im.created_at, p.name as product_name, p.category, im.movement_type,
                   im.quantity_change as quantity, im.reason, u.username
            FROM inventory_movements im
            JOIN products p ON im.product_id = p.id
            JOIN users u ON im.user_id = u.id
            WHERE 1=1
        """
        params = []
        
        if date_from:
            query += " AND date(im.created_at) >= ?"
            params.append(date_from)
            
        if date_to:
            query += " AND date(im.created_at) <= ?"
            params.append(date_to)
            
        if category:
            query += " AND p.category = ?"
            params.append(category)
            
        query += " ORDER BY im.created_at DESC"
        headers = ['Fecha', 'Producto', 'Categoría', 'Tipo', 'Cantidad', 'Motivo', 'Usuario']
        
    elif report_type == 'value_by_provider':
        query = """
            SELECT provider, COUNT(*) as total_products, SUM(quantity) as total_quantity,
                   SUM(quantity * price) as total_value
            FROM products 
            WHERE 1=1
        """
        params = []
        
        if provider:
            query += " AND provider = ?"
            params.append(provider)
            
        query += " GROUP BY provider ORDER BY total_value DESC"
        headers = ['Proveedor', 'Total Productos', 'Total Cantidad', 'Valor Total']
        
    else:
        # Reporte general con todos los campos principales
        query = """
            SELECT name, category, quantity, price, provider, stock_min, created_at
            FROM products 
            WHERE 1=1
        """
        params = []
        
        if category:
            query += " AND category = ?"
            params.append(category)
            
        if provider:
            query += " AND provider = ?"
            params.append(provider)
            
        if stock_level == 'low':
            query += " AND quantity <= stock_min"
        elif stock_level == 'high':
            query += " AND quantity > stock_min * 2"
            
        query += " ORDER BY name"
        headers = ['Producto', 'Categoría', 'Cantidad', 'Precio', 'Proveedor', 'Stock Mínimo', 'Fecha Creación']
    
    # Ejecutar consulta y obtener resultados
    cursor.execute(query, params)
    results = cursor.fetchall()
    conn.close()
    
    # GENERAR ARCHIVO CSV
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Escribir fila de encabezados
    writer.writerow(headers)
    
    # Escribir datos (convertir todo a string para evitar problemas de formato)
    for row in results:
        writer.writerow([str(value) for value in row])
    
    output.seek(0)
    
    # Crear nombre de archivo único con timestamp
    # Formato: reporte_tiporeporte_YYYYMMDD_HHMMSS.csv
    filename = f"reporte_{report_type}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    
    # Devolver archivo como descarga
    return Response(
        output.getvalue(),
        mimetype='text/csv',
        headers={'Content-Disposition': f'attachment; filename={filename}'}
    )

# PUNTO DE ENTRADA DEL PROGRAMA
if __name__ == "__main__":
    """
    Punto de entrada cuando se ejecuta el script directamente
    
    __name__ == "__main__" se ejecuta solo cuando:
    - Ejecutas: python app.py
    - NO se ejecuta cuando otro archivo hace: import app
    
    En producción:
    - No usar debug=True (es inseguro)
    - Usar gunicorn o uwsgi en lugar del servidor de desarrollo
    - Configurar host/port según necesidades (0.0.0.0 para acceso desde red)
    
    En desarrollo:
    ✅ Recarga automática cuando cambias código
    ✅ Muestra errores detallados en el navegador
    ✅ Habilita debugger interactivo
    
    El servidor se inicia en http://127.0.0.1:5000 por defecto en desarrollo
    """
    # Código de inicio del servidor muy simplificado para mayor compatibilidad
    print("Iniciando Sistema de Inventario SCOMM...")
    print("Accede a la aplicación en: http://127.0.0.1:5000")
    
    # La manera más simple y compatible posible de iniciar Flask
    app.run(debug=True)