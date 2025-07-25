/**
 * =============================================================================
 * DASHBOARD INTERACTIVO - Sistema de Inventario SCOMM
 * =============================================================================
 * 
 * PROPÓSITO:
 * Este módulo implementa la funcionalidad interactiva del panel de control,
 * mejorando la experiencia de usuario con:
 * - Actualización automática de datos en tiempo real
 * - Controles de usuario para gestión de refrescos
 * - Efectos visuales para mejor feedback
 * - Optimizaciones de rendimiento y experiencia
 * - Atajos de teclado para operaciones comunes
 * 
 * ESTRUCTURA:
 * 1. Gestión de tiempo y actualizaciones
 * 2. Controles de actualización automática
 * 3. Optimizaciones de rendimiento (visibilidad)
 * 4. Mejoras de UX (efectos visuales, atajos)
 * 5. Inicialización y configuración
 * 
 * DEPENDENCIAS:
 * - No requiere bibliotecas externas (vanilla JavaScript)
 * - Depende de elementos HTML específicos en la plantilla dashboard.html
 * - Compatible con navegadores modernos (ES6+)
 */

document.addEventListener('DOMContentLoaded', function() {
    /**
     * VARIABLES Y CONFIGURACIÓN GLOBAL
     * Elementos DOM y parámetros de configuración principales
     */
    const lastUpdateElement = document.getElementById('lastUpdate');  // Elemento que muestra la hora de última actualización
    const refreshInterval = 300000;  // Intervalo de actualización: 5 minutos (en milisegundos)
    let refreshTimer;  // Variable para almacenar el temporizador de actualización
    
    /**
     * FUNCIÓN: updateTimestamp
     * =============================================================================
     * PROPÓSITO:
     * Actualiza el indicador visual de la última actualización de datos 
     * con la fecha y hora actual en formato localizado.
     * 
     * FUNCIONAMIENTO:
     * - Obtiene la fecha y hora actual
     * - Formatea según configuración regional española (dd/mm/yyyy hh:mm:ss)
     * - Actualiza el elemento DOM correspondiente
     * 
     * UX CONSIDERATIONS:
     * - Proporciona feedback visual al usuario de cuán recientes son los datos
     * - Formato consistente con estándares regionales para mejor comprensión
     * - Verificación defensiva para evitar errores si no existe el elemento
     */
    function updateTimestamp() {
        if (lastUpdateElement) {  // Verificación defensiva
            const now = new Date();  // Obtiene fecha y hora actual
            
            // Configuración para formato español completo con segundos
            const options = {
                year: 'numeric',    // Año en formato de 4 dígitos
                month: '2-digit',   // Mes en formato de 2 dígitos
                day: '2-digit',     // Día en formato de 2 dígitos
                hour: '2-digit',    // Hora en formato de 2 dígitos
                minute: '2-digit',  // Minutos en formato de 2 dígitos
                second: '2-digit',  // Segundos en formato de 2 dígitos
                hour12: false       // Formato 24 horas (no AM/PM)
            };
            
            // Actualiza el texto del elemento con la fecha formateada
            lastUpdateElement.textContent = now.toLocaleString('es-ES', options);
        }
    }
    
    /**
     * FUNCIÓN: autoRefresh
     * =============================================================================
     * PROPÓSITO:
     * Recarga la página automáticamente para obtener datos actualizados,
     * con un efecto visual suave para indicar la actualización.
     * 
     * FUNCIONAMIENTO:
     * - Aplica efecto visual de "fade-out" reduciendo la opacidad
     * - Espera un breve periodo para que el efecto sea perceptible
     * - Recarga la página para obtener datos frescos
     * 
     * UX CONSIDERATIONS:
     * - El efecto visual previene confusión por recargas abruptas
     * - Transición visual para indicar proceso de actualización
     * - Delay breve para permitir que el usuario perciba la acción
     */
    function autoRefresh() {
        // Verificación defensiva y efecto visual previo a la recarga
        if (document.body) {
            document.body.style.opacity = '0.8';  // Efecto visual de "desvanecimiento"
            
            // Pequeña espera para que el efecto visual sea perceptible
            setTimeout(() => {
                location.reload();  // Recarga completa de la página
            }, 500);  // 500ms = 0.5 segundos, suficiente para notar el cambio
        }
    }
    
    /**
     * FUNCIÓN: startAutoRefresh
     * =============================================================================
     * PROPÓSITO:
     * Inicia el temporizador para la actualización automática periódica 
     * de la página según el intervalo configurado.
     * 
     * FUNCIONAMIENTO:
     * - Configura un temporizador recurrente mediante setInterval
     * - Ejecuta la función autoRefresh cada X minutos
     * 
     * TÉCNICA IMPLEMENTADA:
     * - Usa setInterval para ejecución periódica
     * - Almacena referencia al temporizador para poder detenerlo después
     * - Intervalo configurable centralmente (refreshInterval)
     */
    function startAutoRefresh() {
        // Inicia temporizador para ejecutar autoRefresh cada refreshInterval ms
        refreshTimer = setInterval(autoRefresh, refreshInterval);
    }
    
    /**
     * FUNCIÓN: stopAutoRefresh
     * =============================================================================
     * PROPÓSITO:
     * Detiene el temporizador de actualización automática, permitiendo
     * al usuario pausar las actualizaciones cuando sea necesario.
     * 
     * FUNCIONAMIENTO:
     * - Cancela el temporizador activo usando clearInterval
     * - Limpia la referencia para liberar recursos
     * 
     * DEFENSIVE PROGRAMMING:
     * - Verifica que exista un temporizador activo antes de intentar detenerlo
     * - Establece la variable en null para evitar referencias colgantes
     */
    function stopAutoRefresh() {
        if (refreshTimer) {  // Verificación defensiva
            clearInterval(refreshTimer);  // Detiene el temporizador
            refreshTimer = null;  // Limpia la referencia para liberar recursos
        }
    }
    
    /**
     * FUNCIÓN: addRefreshControls
     * =============================================================================
     * PROPÓSITO:
     * Implementa controles interactivos para que el usuario pueda gestionar
     * las actualizaciones automáticas (pausar/reanudar/forzar actualización).
     * 
     * FUNCIONAMIENTO:
     * - Crea dinámicamente elementos de interfaz para control de actualizaciones
     * - Inserta los controles en el encabezado de la página
     * - Configura eventos interactivos para cada botón
     * - Proporciona retroalimentación visual sobre el estado actual
     * 
     * IMPLEMENTACIÓN:
     * - Progressive enhancement: añade controles mediante JavaScript
     * - Singleton pattern: verifica que los controles no existan ya
     * - Estado toggle: alterna entre pausar/reanudar con un solo botón
     * - Feedback visual: cambio de ícono según estado y animación en actualización
     */
    function addRefreshControls() {
        // Busca el contenedor donde se insertarán los controles
        const pageHeader = document.querySelector('.page-header');
        
        // Verificación defensiva: solo crea controles si no existen ya
        if (pageHeader && !document.querySelector('.refresh-controls')) {
            // Creación dinámica del contenedor de controles
            const controlsDiv = document.createElement('div');
            controlsDiv.className = 'refresh-controls';
            
            // Estructura HTML de los controles con información y botones
            controlsDiv.innerHTML = `
                <div class="refresh-info">
                    <span>Actualización automática cada 5 minutos</span>
                    <button type="button" class="btn-refresh-toggle" title="Pausar/Reanudar actualización automática">
                        ⏸️
                    </button>
                    <button type="button" class="btn-refresh-now" title="Actualizar ahora">
                        🔄
                    </button>
                </div>
            `;
            
            // Inserta los controles en el DOM
            pageHeader.appendChild(controlsDiv);
            
            // Captura los botones para configurar interactividad
            const toggleBtn = controlsDiv.querySelector('.btn-refresh-toggle');  // Botón pausar/reanudar
            const refreshBtn = controlsDiv.querySelector('.btn-refresh-now');    // Botón actualizar ahora
            let isAutoRefreshEnabled = true;  // Estado inicial: actualización automática activada
            
            /**
             * EVENTO: ALTERNAR ACTUALIZACIÓN AUTOMÁTICA
             * =============================================================================
             * Configura comportamiento toggle para activar/desactivar actualizaciones
             * automáticas, con cambio de ícono y título según estado.
             */
            toggleBtn.addEventListener('click', function() {
                if (isAutoRefreshEnabled) {
                    // ESTADO: DESACTIVAR ACTUALIZACIONES
                    stopAutoRefresh();  // Detiene temporizador activo
                    this.textContent = '▶️';  // Cambia ícono a "reproducir"
                    this.title = 'Reanudar actualización automática';  // Actualiza tooltip
                    isAutoRefreshEnabled = false;  // Actualiza estado
                } else {
                    // ESTADO: REACTIVAR ACTUALIZACIONES
                    startAutoRefresh();  // Inicia nuevo temporizador
                    this.textContent = '⏸️';  // Cambia ícono a "pausar"
                    this.title = 'Pausar actualización automática';  // Actualiza tooltip
                    isAutoRefreshEnabled = true;  // Actualiza estado
                }
            });
            
            /**
             * EVENTO: ACTUALIZACIÓN MANUAL INMEDIATA
             * =============================================================================
             * Permite al usuario forzar una actualización inmediata con
             * retroalimentación visual (animación de giro).
             */
            refreshBtn.addEventListener('click', function() {
                this.style.animation = 'spin 0.5s linear';  // Animación de giro en botón
                
                // Pequeña espera para que la animación sea visible
                setTimeout(() => {
                    this.style.animation = '';  // Limpia la animación
                    location.reload();  // Recarga la página
                }, 500);  // 500ms para ver la animación completa
            });
        }
    }
    
    /**
     * FUNCIÓN: handleVisibilityChange
     * =============================================================================
     * PROPÓSITO:
     * Optimiza el rendimiento y uso de recursos mediante la gestión inteligente
     * de actualizaciones automáticas según la visibilidad de la página.
     * 
     * FUNCIONAMIENTO:
     * - Detecta cuando la página pasa a segundo plano (otra pestaña activa, minimizada)
     * - Pausa las actualizaciones cuando no son visibles para el usuario
     * - Reanuda automáticamente al volver a la página
     * - Actualiza la marca de tiempo al retomar visibilidad
     * 
     * BENEFICIOS:
     * - Ahorro de recursos del navegador y servidor
     * - Previene actualizaciones innecesarias en segundo plano
     * - Mejora experiencia mostrando datos frescos al volver
     * - Funcionalidad transparente para el usuario final
     * 
     * TECNOLOGÍA:
     * - Page Visibility API estándar (visibilitychange event)
     * - Compatible con navegadores modernos
     */
    function handleVisibilityChange() {
        // Configura un listener para el evento de cambio de visibilidad del documento
        document.addEventListener('visibilitychange', function() {
            if (document.hidden) {
                // CASO: Página en segundo plano (oculta)
                // Pausa actualización automática para ahorrar recursos
                stopAutoRefresh();
            } else {
                // CASO: Página visible nuevamente para el usuario
                // 1. Actualiza inmediatamente el indicador de tiempo
                updateTimestamp();
                // 2. Reanuda el ciclo de actualizaciones automáticas
                startAutoRefresh();
            }
        });
    }
    
    /**
     * FUNCIÓN: addKeyboardShortcuts
     * =============================================================================
     * PROPÓSITO:
     * Mejora la accesibilidad y eficiencia operativa del dashboard implementando
     * atajos de teclado para acciones frecuentes sin necesidad del ratón.
     * 
     * ATAJOS IMPLEMENTADOS:
     * - Ctrl+R o F5: Actualización manual inmediata del dashboard
     * 
     * FUNCIONAMIENTO:
     * La función captura eventos de teclado (keydown) a nivel de documento
     * y ejecuta acciones específicas cuando detecta combinaciones predefinidas,
     * previniendo el comportamiento predeterminado del navegador.
     * 
     * BENEFICIOS:
     * - Mejora la productividad para usuarios avanzados
     * - Proporciona accesibilidad alternativa
     * - Consistente con patrones estándar de UI (F5 para refrescar)
     * - Permite operaciones rápidas sin interrumpir el flujo de trabajo
     */
    function addKeyboardShortcuts() {
        // Configura un detector de eventos para capturar pulsaciones de teclas
        document.addEventListener('keydown', function(e) {
            // ATAJO: Ctrl+R o F5 - Actualización manual inmediata
            if ((e.ctrlKey && e.key === 'r') || e.key === 'F5') {
                // Previene la recarga completa estándar del navegador
                e.preventDefault();
                
                // Actualiza el indicador de tiempo de la última actualización
                updateTimestamp();
                
                // Pequeña espera para que el usuario perciba el cambio en el timestamp
                // antes de que la página se recargue completamente
                setTimeout(() => location.reload(), 100);
            }
        });
    }
    
    /**
     * FUNCIÓN: enhanceStatsCards
     * =============================================================================
     * PROPÓSITO:
     * Enriquece la experiencia de usuario mediante la adición de efectos visuales
     * interactivos a las tarjetas estadísticas, proporcionando feedback táctil
     * y mejorando la percepción de interactividad.
     * 
     * EFECTOS IMPLEMENTADOS:
     * - Elevación: Ligero movimiento hacia arriba al pasar el cursor
     * - Sombra: Intensificación de la sombra para sensación de profundidad
     * - Transiciones: Animaciones suaves para cambios de estado
     * 
     * TÉCNICAS UTILIZADAS:
     * - Manipulación dinámica de estilos CSS via JavaScript
     * - Eventos de interacción por ratón (mouseenter/mouseleave)
     * - Transformaciones CSS3 para movimiento y efectos visuales
     * - Delegación de eventos para manejo eficiente de múltiples elementos
     */
    function enhanceStatsCards() {
        // Selecciona todas las tarjetas estadísticas en el dashboard
        const statsCards = document.querySelectorAll('.stats-card');
        
        // Aplica efectos interactivos a cada tarjeta encontrada
        statsCards.forEach(card => {
            // EFECTO DE ENTRADA: Al posicionar el cursor sobre la tarjeta
            card.addEventListener('mouseenter', function() {
                // Efecto de elevación mediante transformación CSS
                this.style.transform = 'translateY(-2px)';
                
                // Efecto de sombra más pronunciada para sensación de profundidad
                this.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
            });
            
            // EFECTO DE SALIDA: Al retirar el cursor de la tarjeta
            card.addEventListener('mouseleave', function() {
                // Restaura posición original (sin elevación)
                this.style.transform = 'translateY(0)';
                
                // Restaura sombra original (definida en CSS)
                this.style.boxShadow = '';
            });
        });
    }
    
    /**
     * FUNCIÓN: enhanceQuickActions
     * =============================================================================
     * PROPÓSITO:
     * Mejora la experiencia de usuario durante la interacción con botones de acción
     * rápida, proporcionando indicadores visuales de estado durante la transición
     * entre páginas o ejecución de acciones.
     * 
     * FUNCIONAMIENTO:
     * - Detecta clics en botones de acción rápida
     * - Modifica visualmente el botón para indicar "en proceso"
     * - Añade icono de reloj de arena para comunicar estado de espera
     * - Reduce la opacidad para indicar estado no interactivo temporal
     * 
     * BENEFICIOS:
     * - Reduce la percepción de tiempo de espera del usuario
     * - Previene múltiples clics accidentales en el mismo botón
     * - Proporciona retroalimentación inmediata sobre la acción iniciada
     * - Mejora la accesibilidad comunicando estados de proceso
     */
    function enhanceQuickActions() {
        // Selecciona todos los botones en la sección de acciones rápidas
        const quickActionBtns = document.querySelectorAll('.quick-actions .btn');
        
        // Aplica comportamiento mejorado a cada botón
        quickActionBtns.forEach(btn => {
            // Configura detector de eventos para el clic
            btn.addEventListener('click', function(e) {
                // Verifica que sea un enlace válido con atributo href
                if (this.href) {
                    // Reduce opacidad para indicar estado "en proceso"
                    this.style.opacity = '0.7';
                    
                    // Añade icono de reloj de arena antes del texto original
                    // Usa trim() para eliminar espacios en blanco innecesarios
                    this.innerHTML = '⏳ ' + this.textContent.trim();
                    
                    // No cancela el evento para permitir la navegación normal
                    // El navegador continuará con la acción predeterminada (seguir el enlace)
                }
            });
        });
    }
    
    /**
     * INICIALIZACIÓN DEL DASHBOARD
     * =============================================================================
     * Esta sección ejecuta secuencialmente todas las funcionalidades
     * definidas para activar el dashboard interactivo completo.
     * 
     * SECUENCIA DE INICIALIZACIÓN:
     * 1. Configuración inicial: Actualiza marcador de tiempo
     * 2. Actualizaciones automáticas: Inicia el ciclo de refresco
     * 3. Interfaz de usuario: Añade controles interactivos
     * 4. Optimización: Configura gestión de visibilidad
     * 5. Accesibilidad: Habilita atajos de teclado
     * 6. UX enhancements: Activa efectos visuales y feedback
     * 7. Mantenimiento: Configura actualización periódica del timestamp
     */
    
    // 1. Establece timestamp inicial
    updateTimestamp();
    
    // 2. Inicia ciclo de actualización automática
    startAutoRefresh();
    
    // 3. Añade controles interactivos para manejo de actualizaciones
    addRefreshControls();
    
    // 4. Optimiza recursos con gestión de visibilidad
    handleVisibilityChange();
    
    // 5. Mejora accesibilidad con atajos de teclado
    addKeyboardShortcuts();
    
    // 6. Aplica efectos visuales a elementos UI
    enhanceStatsCards();
    enhanceQuickActions();
    
    // 7. Actualiza timestamp cada minuto para precisión del tiempo mostrado
    // sin necesidad de recargar la página completa
    setInterval(updateTimestamp, 60000);
});
