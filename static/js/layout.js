/**
 * =============================================================================
 * LAYOUT GLOBAL - Sistema de Inventario SCOMM
 * =============================================================================
 * 
 * PROPÓSITO:
 * Este módulo implementa funcionalidades globales compartidas por todas las páginas
 * del sistema, incluyendo:
 * - Sistema de alertas dinámicas con animaciones
 * - Gestión de sesiones con seguridad mejorada
 * - Mejoras de navegación y experiencia de usuario
 * - Atajos de teclado para navegación rápida
 * - Características de accesibilidad
 * 
 * ESTRUCTURA:
 * 1. Sistema de alertas (mostrar/ocultar notificaciones)
 * 2. Gestor de sesiones (seguridad y timeout)
 * 3. Mejoras de navegación (indicadores de carga, resaltado)
 * 4. Atajos de teclado globales
 * 5. Funciones de accesibilidad
 * 
 * DEPENDENCIAS:
 * - No requiere bibliotecas externas (vanilla JavaScript)
 * - Espera estructura HTML específica de las plantillas
 * - Compatible con navegadores modernos (ES6+)
 */

document.addEventListener('DOMContentLoaded', function() {
    
    /**
     * FUNCIÓN: initAlertSystem
     * =============================================================================
     * PROPÓSITO:
     * Inicializa un sistema avanzado de notificaciones para toda la aplicación,
     * con animaciones fluidas, prevención de duplicados y controles interactivos.
     * 
     * FUNCIONAMIENTO:
     * - Detecta y procesa alertas existentes en el HTML inicial
     * - Elimina automáticamente notificaciones duplicadas
     * - Añade botones de cierre si no existen
     * - Configura el ocultamiento automático con temporizadores
     * - Implementa temporizadores progresivos para múltiples alertas
     * 
     * BENEFICIOS:
     * - UX mejorada con animaciones suaves
     * - Prevención de sobrecarga visual por duplicados
     * - Feedback interactivo para el usuario
     * - Limpieza automática de la interfaz
     */
    function initAlertSystem() {
        // Selecciona todas las alertas presentes en el DOM al cargar la página
        const alerts = document.querySelectorAll('.alert');
        
        // Usa un Set para almacenar mensajes y prevenir duplicados eficientemente
        // Los Sets de ES6 solo almacenan valores únicos, ideal para esta tarea
        const alertMessages = new Set(); 
        
        // Procesa cada alerta encontrada en el DOM
        alerts.forEach((alert, index) => {
            // Extrae el texto de la alerta eliminando espacios innecesarios
            const alertText = alert.textContent.trim();
            
            // PASO 1: GESTIÓN DE DUPLICADOS
            // Verifica si este mensaje ya existe en nuestra colección
            if (alertMessages.has(alertText)) {
                // Si es duplicado, elimina este elemento del DOM
                alert.remove();
                return; // Sale de esta iteración del bucle
            }
            // Registra este mensaje para detectar futuros duplicados
            alertMessages.add(alertText);
            
            // PASO 2: AÑADIR BOTONES DE CIERRE
            // Comprueba si ya existe un botón de cierre en esta alerta
            if (!alert.querySelector('.alert-close')) {
                // Crea un nuevo botón de cierre si no existe
                const closeBtn = document.createElement('button');
                closeBtn.className = 'alert-close';
                closeBtn.innerHTML = '×'; // Usa el símbolo × como icono de cierre
                closeBtn.setAttribute('aria-label', 'Cerrar alerta'); // Mejora de accesibilidad
                alert.appendChild(closeBtn);
                
                // Configura el evento de clic para cerrar la alerta
                closeBtn.addEventListener('click', function() {
                    hideAlert(alert); // Anima y oculta la alerta
                    alertMessages.delete(alertText); // Elimina del registro de mensajes
                });
            }
            
            // PASO 3: AUTO-OCULTAMIENTO CON TIMING PROGRESIVO
            // Calcula un retraso progresivo para múltiples alertas (efecto cascada)
            // Base: 5 segundos + 0.5 segundos adicionales por cada alerta previa
            const hideDelay = 5000 + (index * 500);
            
            // Configura el temporizador para ocultar automáticamente
            setTimeout(() => {
                hideAlert(alert); // Anima y oculta la alerta
                alertMessages.delete(alertText); // Elimina del registro de mensajes
            }, hideDelay);
        });
    }
    
    /**
     * FUNCIÓN: hideAlert
     * =============================================================================
     * PROPÓSITO:
     * Oculta una alerta con animaciones suaves para mejorar la experiencia visual,
     * en lugar de hacer desaparecer el elemento abruptamente.
     * 
     * ANIMACIONES APLICADAS:
     * - Desvanecimiento (fade-out): reducción gradual de opacidad
     * - Elevación: movimiento sutil hacia arriba
     * - Ocultamiento final: eliminación del flujo del documento
     * 
     * PARÁMETROS:
     * - alert: El elemento DOM de la alerta que se debe ocultar
     */
    function hideAlert(alert) {
        // Verificación defensiva: comprueba que la alerta existe y no está ya oculta
        if (alert && alert.style.display !== 'none') {
            // Configura transición CSS para animación suave
            // Duración: 0.3 segundos con aceleración/desaceleración
            alert.style.transition = 'all 0.3s ease';
            
            // Inicia la animación de desvanecimiento
            alert.style.opacity = '0'; // Transparencia completa
            
            // Añade movimiento sutil hacia arriba durante el desvanecimiento
            alert.style.transform = 'translateY(-10px)';
            
            // Después de completar la animación, oculta completamente el elemento
            setTimeout(() => {
                alert.style.display = 'none'; // Elimina del flujo del documento
            }, 300); // Coincide con la duración de la transición
        }
    }
    
    /**
     * FUNCIÓN: showAlert
     * =============================================================================
     * PROPÓSITO:
     * Crea y muestra alertas dinámicamente desde cualquier parte del código,
     * con prevención de duplicados, tipos personalizables y animaciones.
     * 
     * PARÁMETROS:
     * - message: El texto a mostrar en la alerta
     * - type: El tipo de alerta (info, success, warning, error)
     * - duration: Duración en milisegundos antes de auto-ocultar (0 para persistente)
     * 
     * TIPOS DE ALERTAS:
     * - info (predeterminado): Información general, color azul
     * - success: Operación exitosa, color verde
     * - warning: Advertencia o precaución, color amarillo
     * - error: Error o problema crítico, color rojo
     * 
     * FUNCIONALIDADES:
     * - Prevención de duplicados: Evita múltiples alertas con el mismo mensaje
     * - Animación de entrada: Efecto suave al aparecer
     * - Cierre manual: Botón para descartar
     * - Cierre automático: Temporizado según duración especificada
     * 
     * RETORNO:
     * - El elemento DOM de la alerta creada (para posible manipulación posterior)
     */
    function showAlert(message, type = 'info', duration = 5000) {
        // PASO 1: PREVENCIÓN DE DUPLICADOS
        // Comprueba si ya existe una alerta con el mismo mensaje
        const existingAlerts = document.querySelectorAll('.alert');
        for (let alert of existingAlerts) {
            // Usa includes en lugar de === para ser más flexible en la detección
            if (alert.textContent.includes(message)) {
                return alert; // Retorna la alerta existente sin crear duplicado
            }
        }
        
        // PASO 2: CREACIÓN DE LA ALERTA
        // Determina el contenedor donde insertar la alerta (preferiblemente content-wrapper o body)
        const alertContainer = document.querySelector('.content-wrapper') || document.body;
        
        // Crea el elemento DIV para la alerta
        const alertDiv = document.createElement('div');
        
        // Configura clase según el tipo (info, success, warning, error)
        alertDiv.className = `alert alert-${type}`;
        
        // Aplica estilos iniciales para posicionamiento y animación
        alertDiv.style.position = 'relative';     // Para posicionamiento correcto
        alertDiv.style.margin = '1rem 0';         // Espacio vertical
        alertDiv.style.opacity = '0';             // Invisible inicialmente para animación
        alertDiv.style.transform = 'translateY(-10px)'; // Posición inicial elevada para animación
        alertDiv.style.transition = 'all 0.3s ease';    // Configuración de animación suave
        
        // Genera el contenido HTML con el mensaje y botón de cierre
        alertDiv.innerHTML = `
            ${message}
            <button class="alert-close" aria-label="Cerrar alerta">×</button>
        `;
        
        // PASO 3: INSERCIÓN Y ANIMACIÓN
        // Inserta al inicio del contenedor para que sea lo primero visible
        alertContainer.insertBefore(alertDiv, alertContainer.firstChild);
        
        // Anima la entrada con un pequeño retraso para asegurar transición fluida
        // El timeout de 100ms permite que el navegador procese los estilos iniciales
        setTimeout(() => {
            alertDiv.style.opacity = '1';           // Hace visible la alerta
            alertDiv.style.transform = 'translateY(0)'; // Mueve a posición final
        }, 100);
        
        // PASO 4: CONFIGURACIÓN DE INTERACTIVIDAD
        // Añade funcionalidad al botón de cierre
        const closeBtn = alertDiv.querySelector('.alert-close');
        closeBtn.addEventListener('click', () => hideAlert(alertDiv));
        
        // PASO 5: AUTO-OCULTAMIENTO (si duration > 0)
        // Un valor de duration=0 crea una alerta persistente
        if (duration > 0) {
            setTimeout(() => hideAlert(alertDiv), duration);
        }
        
        // Retorna la referencia al elemento para posible manipulación posterior
        return alertDiv;
    }
    
    /**
     * FUNCIÓN: initSessionManager
     * =============================================================================
     * PROPÓSITO:
     * Implementa un sistema avanzado de gestión de sesiones para mejorar la
     * seguridad de la aplicación mediante:
     * 
     * CARACTERÍSTICAS DE SEGURIDAD:
     * - Detección de inactividad: Cierre automático tras periodo sin actividad
     * - Monitoreo de visibilidad: Control de cambios entre pestañas/ventanas
     * - Cierre proactivo: Limpieza de sesión al cerrar/actualizar navegador
     * - Persistencia selectiva: Almacenamiento de estado para validaciones
     * 
     * MÉTODOS DE PROTECCIÓN:
     * - Temporizador de inactividad: 30 minutos sin interacción = cierre sesión
     * - API Visibility: Detección de cambio a otra pestaña o aplicación
     * - beforeunload: Cierre seguro al salir o refrescar página
     * - SendBeacon API: Envío asíncrono garantizado de petición de cierre
     * 
     * NOTA IMPORTANTE:
     * La función solo se ejecuta cuando hay una sesión activa (usuario logueado)
     * verificando la existencia de sessionData.userId
     */
    function initSessionManager() {
        // VERIFICACIÓN PREVIA: Solo ejecutar si hay un usuario con sesión activa
        // Comprueba la existencia del objeto global sessionData y un userId válido
        if (typeof sessionData !== 'undefined' && sessionData.userId) {
            // Variables para el control de estado de la sesión
            let inactivityTimer;      // Temporizador para detectar inactividad
            let warningShown = false; // Control para evitar múltiples advertencias
            
            /**
             * FUNCIÓN INTERNA: resetInactivityTimer
             * =============================================================================
             * Reinicia el temporizador de inactividad cada vez que el usuario
             * realiza alguna acción. Si el tiempo expira, cierra la sesión automáticamente.
             * 
             * FUNCIONAMIENTO:
             * 1. Cancela cualquier temporizador existente
             * 2. Restablece el estado de advertencias
             * 3. Inicia nuevo temporizador de 30 minutos
             * 4. Ejecuta cierre de sesión si expira el tiempo
             */
            function resetInactivityTimer() {
                // Cancela temporizador anterior (si existe)
                clearTimeout(inactivityTimer);
                
                // Restablece el indicador de advertencia
                warningShown = false;
                
                // Establece nuevo temporizador (30 minutos)
                inactivityTimer = setTimeout(() => {
                    // Verificación para evitar cierres múltiples
                    if (!warningShown) {
                        // Marca advertencia como mostrada
                        warningShown = true;
                        
                        // Redirige silenciosamente a la ruta de logout
                        window.location.href = '/logout';
                    }
                }, 30 * 60 * 1000); // 30 minutos en milisegundos
            }
            
            // MONITOREO DE ACTIVIDAD DEL USUARIO
            // Define eventos que se consideran "actividad del usuario"
            const activityEvents = [
                'mousedown',  // Presión de botón del ratón
                'mousemove',  // Movimiento del ratón
                'keypress',   // Pulsación de tecla
                'scroll',     // Desplazamiento en la página
                'touchstart', // Inicio de toque (dispositivos táctiles)
                'click'       // Clic completo
            ];
            
            // Configura listeners para cada tipo de evento de actividad
            activityEvents.forEach(event => {
                // El tercer parámetro "true" permite captura en fase de captura
                // garantizando que detectemos los eventos aunque se detengan en elementos hijos
                document.addEventListener(event, resetInactivityTimer, true);
            });
            
            // Inicia el temporizador al cargar la página
            resetInactivityTimer();
            
            // CIERRE SEGURO AL SALIR/RECARGAR
            // El evento beforeunload se dispara antes de cerrar/recargar la página
            window.addEventListener('beforeunload', function(e) {
                // Implementa cierre de sesión proactivo en salida
                
                // MÉTODO MODERNO: SendBeacon API (preferido)
                // Garantiza envío incluso durante cierre de página
                if (navigator.sendBeacon) {
                    navigator.sendBeacon('/logout');
                } else {
                    // MÉTODO ALTERNATIVO: Fetch API con keepalive
                    // Para navegadores que no soportan SendBeacon
                    fetch('/logout', {
                        method: 'POST',
                        keepalive: true,        // Mantiene solicitud activa durante cierre
                        credentials: 'same-origin' // Incluye cookies de sesión
                    }).catch(() => {
                        // Ignora errores silenciosamente
                        // En cierre de sesión es aceptable fallar silenciosamente
                    });
                }
            });
            
            // MONITOREO DE VISIBILIDAD DE PÁGINA
            // Detecta cuando la página pasa a segundo plano o vuelve al primer plano
            document.addEventListener('visibilitychange', function() {
                // CASO: La página pasa a segundo plano (otra pestaña activa, minimizada)
                if (document.visibilityState === 'hidden') {
                    // Almacena momento exacto en que la página se ocultó
                    // Usa sessionStorage para persistir entre cambios de visibilidad
                    sessionStorage.setItem('lastActiveTime', Date.now().toString());
                } 
                // CASO: La página vuelve a ser visible
                else if (document.visibilityState === 'visible') {
                    // Recupera el momento en que la página se ocultó
                    const lastActive = sessionStorage.getItem('lastActiveTime');
                    
                    // Solo procede si existe registro de tiempo anterior
                    if (lastActive) {
                        // Calcula tiempo transcurrido mientras la página estaba oculta
                        const timeDiff = Date.now() - parseInt(lastActive);
                        
                        // Si estuvo inactivo más de 30 minutos, cierre de sesión
                        // Coincide con el límite del temporizador de inactividad
                        if (timeDiff > 30 * 60 * 1000) {
                            // Notifica al usuario sobre el cierre de sesión
                            showAlert('Sesión cerrada por inactividad prolongada', 'warning', 3000);
                            
                            // Espera 3 segundos para que lea el mensaje y cierra sesión
                            setTimeout(() => {
                                window.location.href = '/logout';
                            }, 3000);
                        }
                    }
                }
            });
            
            // Nota: El código duplicado del evento visibilitychange ha sido eliminado
            // en esta documentación. El código original tenía una repetición del mismo listener.
        }
    }
    
    /**
     * FUNCIÓN: initNavigationEnhancements
     * =============================================================================
     * PROPÓSITO:
     * Mejora la experiencia de navegación del usuario mediante indicadores visuales
     * y feedback interactivo durante la navegación entre páginas.
     * 
     * CARACTERÍSTICAS IMPLEMENTADAS:
     * - Indicadores de carga: Muestra feedback visual durante transiciones de página
     * - Resaltado de página actual: Marca visualmente la ubicación actual
     * - Feedback instantáneo: Respuesta visual inmediata a acciones de navegación
     * 
     * BENEFICIOS:
     * - Reduce la percepción de espera durante la carga de páginas
     * - Mejora la orientación del usuario dentro de la aplicación
     * - Previene clics repetidos durante navegación
     * - Proporciona contexto visual sobre la ubicación actual
     */
    function initNavigationEnhancements() {
        // PASO 1: SELECCIÓN DE ELEMENTOS NAVEGABLES
        // Selecciona todos los enlaces de navegación y botones con comportamiento de enlace
        const navLinks = document.querySelectorAll('.nav-link, .btn-link');
        
        // PASO 2: INDICADORES DE CARGA
        // Añade estados visuales de carga durante transiciones de página
        navLinks.forEach(link => {
            // Configura detector de eventos para el clic
            link.addEventListener('click', function(e) {
                // Solo procesa enlaces reales que navegan a otras páginas
                // Excluye enlaces con anclas (#) que solo navegan dentro de la misma página
                if (this.href && !this.href.includes('#')) {
                    // Reduce opacidad para indicar estado "en transición"
                    this.style.opacity = '0.7';
                    
                    // Guarda el texto original para preservar contenido
                    const originalText = this.textContent;
                    
                    // Añade icono de reloj de arena para indicar carga en proceso
                    this.innerHTML = '⏳ ' + originalText;
                    
                    // No cancela navegación - deja que el navegador siga normalmente
                }
            });
        });
        
        // PASO 3: RESALTADO DE PÁGINA ACTUAL
        // Detecta y marca visualmente la página actual en el menú de navegación
        // para proporcionar contexto de ubicación al usuario
        
        // Obtiene la ruta actual sin parámetros de consulta
        const currentPath = window.location.pathname;
        
        // Recorre todos los enlaces buscando coincidencia con la ruta actual
        navLinks.forEach(link => {
            // Verifica si el enlace tiene href y coincide exactamente con la ruta actual
            if (link.href && link.getAttribute('href') === currentPath) {
                // Añade clase 'active' para aplicar estilos visuales distintivos
                link.classList.add('active');
                
                // Nota: Los estilos específicos para '.active' deben estar definidos en CSS
            }
        });
    }
    
    /**
     * FUNCIÓN: initKeyboardShortcuts
     * =============================================================================
     * PROPÓSITO:
     * Implementa atajos de teclado globales para mejorar la accesibilidad y
     * productividad en toda la aplicación, permitiendo navegación rápida
     * sin necesidad de usar el ratón.
     * 
     * ATAJOS IMPLEMENTADOS:
     * - Alt + H: Ir al Dashboard (página principal)
     * - Alt + I: Ir al Inventario
     * - Alt + A: Ir a Añadir Producto
     * - Alt + R: Ir a Reportes
     * - Escape: Cerrar alertas y modales activos
     * 
     * BENEFICIOS:
     * - Mejora la productividad de usuarios avanzados
     * - Proporciona accesibilidad alternativa
     * - Facilita la navegación rápida entre secciones frecuentes
     * - Consistente con estándares de interfaz modernos
     * 
     * NOTA DE ACCESIBILIDAD:
     * La combinación Alt+tecla es ampliamente compatible y no interfiere
     * con las funciones nativas del navegador ni lectores de pantalla
     */
    function initKeyboardShortcuts() {
        // Configura un detector de eventos a nivel de documento para capturar teclas
        document.addEventListener('keydown', function(e) {
            // ATAJO 1: Alt + H - Navegación rápida al Dashboard
            if (e.altKey && e.key === 'h') {
                // Previene comportamiento predeterminado del navegador (si existe)
                e.preventDefault();
                
                // Navega a la página principal del dashboard
                window.location.href = '/dashboard';
            }
            
            // ATAJO 2: Alt + I - Navegación rápida al Inventario
            if (e.altKey && e.key === 'i') {
                e.preventDefault();
                
                // Navega a la página raíz (inventario)
                window.location.href = '/';
            }
            
            // ATAJO 3: Alt + A - Navegación rápida a Añadir Producto
            if (e.altKey && e.key === 'a') {
                e.preventDefault();
                
                // Navega a la página de añadir producto
                window.location.href = '/add';
            }
            
            // ATAJO 4: Alt + R - Navegación rápida a Reportes
            if (e.altKey && e.key === 'r') {
                e.preventDefault();
                
                // Navega a la página de reportes
                window.location.href = '/reports';
            }
            
            // ATAJO 5: Escape - Cierre de elementos interactivos
            if (e.key === 'Escape') {
                // Busca todas las alertas actualmente visibles
                const alerts = document.querySelectorAll('.alert');
                
                // Cierra cada alerta usando la función de animación
                alerts.forEach(alert => hideAlert(alert));
                
                // Nota: Se podría extender para cerrar modales u otros elementos
                // interactivos aquí si fuese necesario en el futuro
            }
        });
    }
    
    /**
     * FUNCIÓN: initAccessibilityFeatures
     * =============================================================================
     * PROPÓSITO:
     * Implementa mejoras de accesibilidad para que la aplicación sea más utilizable
     * para personas con discapacidades y cumpla con estándares WCAG.
     * 
     * CARACTERÍSTICAS IMPLEMENTADAS:
     * - Etiquetas ARIA: Mejora la compatibilidad con lectores de pantalla
     * - Indicadores de foco: Realza visualmente el elemento activo
     * - Mejoras de navegación por teclado: Facilita uso sin ratón
     * 
     * BENEFICIOS:
     * - Aumenta la accesibilidad para usuarios con discapacidades visuales
     * - Mejora la compatibilidad con tecnologías de asistencia
     * - Facilita la navegación mediante teclado
     * - Proporciona feedback visual claro durante la interacción
     * 
     * CONFORMIDAD:
     * Implementa buenas prácticas según las Web Content Accessibility
     * Guidelines (WCAG) para mejorar la experiencia de todos los usuarios.
     */
    function initAccessibilityFeatures() {
        // PASO 1: AÑADIR ETIQUETAS ARIA
        // Busca todos los botones que no tengan etiqueta ARIA definida
        const buttons = document.querySelectorAll('button:not([aria-label])');
        
        // Para cada botón sin etiqueta ARIA, añade una basada en su texto
        buttons.forEach(btn => {
            // Solo añade etiqueta si el botón tiene texto y no tiene ya una etiqueta
            if (!btn.getAttribute('aria-label') && btn.textContent.trim()) {
                // Usa el texto del botón como etiqueta ARIA para lectores de pantalla
                btn.setAttribute('aria-label', btn.textContent.trim());
            }
        });
        
        // PASO 2: MEJORAR INDICADORES DE FOCO
        // Selecciona todos los elementos interactivos que pueden recibir foco
        const focusableElements = document.querySelectorAll('a, button, input, select, textarea');
        
        // Aplica indicadores visuales mejorados para cada elemento
        focusableElements.forEach(element => {
            // Al recibir foco, añade un borde visual destacado
            element.addEventListener('focus', function() {
                // Borde azul de 2px, estilo sólido para alta visibilidad
                this.style.outline = '2px solid #3498db';
                
                // Separación para evitar solapar con el contenido
                this.style.outlineOffset = '2px';
            });
            
            // Al perder el foco, elimina los estilos visuales
            element.addEventListener('blur', function() {
                this.style.outline = '';
                this.style.outlineOffset = '';
            });
        });
    }
    
    /**
     * INICIALIZACIÓN DEL SISTEMA
     * =============================================================================
     * Esta sección ejecuta secuencialmente todas las funcionalidades definidas,
     * activando los diversos sistemas que componen la interfaz global.
     * 
     * SECUENCIA DE INICIALIZACIÓN:
     * 1. Sistema de alertas: Notificaciones y mensajes
     * 2. Gestor de sesiones: Seguridad y control de inactividad
     * 3. Mejoras de navegación: Feedback visual durante transiciones
     * 4. Atajos de teclado: Navegación rápida por teclas
     * 5. Accesibilidad: Mejoras para usuarios con discapacidades
     * 
     * EXPOSICIÓN GLOBAL:
     * Las funciones de alerta se exponen globalmente para permitir
     * su uso desde cualquier parte de la aplicación o consola.
     */
    
    // Inicialización secuencial de todos los módulos
    initAlertSystem();
    initSessionManager();
    initNavigationEnhancements();
    initKeyboardShortcuts();
    initAccessibilityFeatures();
    
    // Expone funciones de utilidad globalmente para uso en otros scripts
    window.showAlert = showAlert;
    window.hideAlert = hideAlert;
});
