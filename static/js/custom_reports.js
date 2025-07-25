/**
 * =============================================================================
 * CUSTOM REPORTS MODULE - Gestión Avanzada de Reportes Personalizados
 * =============================================================================
 * 
 * PROPÓSITO:
 * Este módulo implementa toda la lógica de interfaz para la generación
 * de reportes personalizados, incluyendo:
 * - Formulario adaptativo que cambia según el tipo de reporte
 * - Validación contextual con feedback visual
 * - Persistencia de preferencias del usuario con localStorage
 * - Optimización de UX para mejorar interacción con formularios complejos
 * 
 * ESTRUCTURA:
 * 1. Inicialización y configuración base
 * 2. Funciones de manipulación de UI y adaptación de formulario
 * 3. Sistema de validación y feedback
 * 4. Persistencia de estado con localStorage
 * 5. Mejoras de experiencia de usuario
 * 
 * INTEGRACIÓN:
 * Este script se conecta con el backend Flask a través de
 * formularios HTML generados con Jinja2 templates.
 * 
 * DEPENDENCIAS:
 * - No requiere bibliotecas externas (vanilla JavaScript)
 * - Compatible con navegadores modernos (ES6+)
 * - Requiere estructura HTML específica con clases designadas
 */

// Inicialización al completar la carga del DOM
document.addEventListener('DOMContentLoaded', function() {
    // Captura de elementos clave del DOM para manipulación
    const reportTypeSelect = document.getElementById('report_type'); // Selector de tipo de reporte
    const reportForm = document.querySelector('.report-form');       // Formulario completo
    
    /**
     * FUNCIÓN: updateFormFields
     * =============================================================================
     * PROPÓSITO:
     * Actualiza dinámicamente la interfaz del formulario según el tipo de reporte
     * seleccionado, mostrando/ocultando campos relevantes y configurando validaciones.
     * 
     * FLUJO DE EJECUCIÓN:
     * 1. Captura el tipo de reporte seleccionado
     * 2. Oculta todos los campos opcionales (fecha, stock)
     * 3. Muestra solo los campos relevantes para el tipo seleccionado
     * 4. Configura validaciones específicas según contexto
     * 5. Actualiza texto del botón de envío para reflejar la acción
     */
    function updateFormFields() {
        const reportType = reportTypeSelect.value;     // Tipo de reporte actualmente seleccionado
        const dateFields = document.querySelectorAll('.date-fields'); // Campos relacionados con fechas
        const stockFields = document.querySelectorAll('.stock-fields'); // Campos de niveles de stock
        
        // FASE 1: OCULTAMIENTO - Primero ocultamos todos los campos opcionales
        dateFields.forEach(field => {
            field.style.display = 'none';  // Oculta visualmente el campo
            
            // También eliminamos validaciones para evitar errores en campos invisibles
            const inputs = field.querySelectorAll('input, select');
            inputs.forEach(input => {
                // Solo quita required si NO estamos en un reporte de movimientos
                if (reportType !== 'movements_by_period') {
                    input.removeAttribute('required');  // Elimina validación HTML5
                }
            });
        });
        
        // Similar al tratamiento de dateFields, también ocultamos campos de stock
        stockFields.forEach(field => {
            field.style.display = 'none'; // Oculta visualmente
            
            // Gestión de validación para campos de stock
            const inputs = field.querySelectorAll('input, select');
            inputs.forEach(input => {
                // Solo quita required si NO estamos en reporte de inventario general
                if (reportType !== 'inventory_general') {
                    input.removeAttribute('required'); // Elimina validación HTML5
                }
            });
        });
        
        // FASE 2: VISUALIZACIÓN SELECTIVA - Mostrar solo campos relevantes según tipo
        
        // Para reportes de movimientos, necesitamos campos de fecha
        if (reportType === 'movements_by_period') {
            dateFields.forEach(field => {
                field.style.display = 'block'; // Muestra visualmente
                
                // Mejora UX: Agrega tooltip informativo a los campos de fecha
                const inputs = field.querySelectorAll('input');
                inputs.forEach(input => {
                    input.setAttribute('title', 'Recomendado para filtrar por período específico');
                });
            });
            
            // FASE 3: VALORES INTELIGENTES POR DEFECTO
            // Para mejorar UX, configuramos automáticamente último mes como rango
            const dateFrom = document.getElementById('date_from');
            const dateTo = document.getElementById('date_to');
            
            // Solo establece fecha inicial si el campo está vacío (respeta selecciones del usuario)
            if (!dateFrom.value) {
                // Calcula "un mes atrás" desde hoy
                const lastMonth = new Date();
                lastMonth.setMonth(lastMonth.getMonth() - 1);
                // Convierte a formato YYYY-MM-DD para input[type="date"]
                dateFrom.value = lastMonth.toISOString().split('T')[0];
            }
            
            // Solo establece fecha final si el campo está vacío
            if (!dateTo.value) {
                // Usa fecha actual como límite superior
                const today = new Date();
                dateTo.value = today.toISOString().split('T')[0];
            }
        }
        
        // Para reportes de inventario general, necesitamos campos de nivel de stock
        if (reportType === 'inventory_general') {
            stockFields.forEach(field => {
                field.style.display = 'block'; // Muestra campos de stock
            });
        }
        
        // FASE 4: ACTUALIZACIÓN DE INTERFAZ RELACIONADA
        // Actualiza el texto del botón para reflejar la acción específica
        updateSubmitButton(reportType);
    } // Fin de updateFormFields()
    
    /**
     * FUNCIÓN: updateSubmitButton
     * =============================================================================
     * PROPÓSITO:
     * Actualiza el texto del botón de envío para reflejar el tipo de reporte
     * seleccionado, mejorando la claridad sobre qué acción se realizará.
     * 
     * PARÁMETROS:
     * @param {string} reportType - El tipo de reporte seleccionado
     * 
     * NOTAS TÉCNICAS:
     * - Maneja tanto botones con solo texto como botones con ícono
     * - Preserva la estructura de iconos al cambiar el texto
     * - Utiliza texto genérico como fallback si no hay tipo especificado
     */
    function updateSubmitButton(reportType) {
        // Encuentra el botón principal de envío
        const submitBtn = document.querySelector('.btn-primary');
        
        // Estrategia inteligente para encontrar el nodo de texto:
        // 1. Busca un span que no sea el ícono, o
        // 2. Usa el último hijo (que probablemente sea el nodo de texto)
        const btnText = submitBtn.querySelector('span:not(.btn-icon)') || submitBtn.lastChild;
        
        // Mapeo de tipos de reporte a textos específicos y descriptivos
        const reportTexts = {
            'inventory_general': 'Generar Inventario General',
            'inventory_by_category': 'Generar por Categoría',
            'low_stock': 'Generar Stock Bajo',
            'movements_by_period': 'Generar Movimientos',
            'value_by_provider': 'Generar por Proveedor'
        };
        
        // Si hay un tipo de reporte válido y tenemos texto específico para él
        if (reportType && reportTexts[reportType]) {
            // Técnica 1: Si el elemento es un nodo de texto puro
            if (btnText.nodeType === Node.TEXT_NODE) {
                btnText.textContent = reportTexts[reportType];
            } 
            // Técnica 2: Si es un elemento HTML, reconstruimos con ícono
            else {
                submitBtn.innerHTML = '<span class="btn-icon">📊</span>' + reportTexts[reportType];
            }
        } 
        // Fallback: Si no hay tipo o no está en nuestro mapeo
        else {
            if (btnText.nodeType === Node.TEXT_NODE) {
                btnText.textContent = 'Generar Reporte';
            } else {
                submitBtn.innerHTML = '<span class="btn-icon">📊</span>Generar Reporte';
            }
        }
    }
    
    /**
     * EXPOSICIÓN GLOBAL Y BOOTSTRAPPING
     * =============================================================================
     * Hacemos la función updateFormFields accesible globalmente para permitir
     * llamadas desde atributos HTML como onchange="updateFormFields()" y 
     * ejecutamos la configuración inicial para establecer el estado correcto.
     */
    
    // Exponer la función al scope global para eventos HTML
    window.updateFormFields = updateFormFields;
    
    // Inicialización inmediata para configurar campos según valores iniciales
    updateFormFields();
    
    /**
     * SISTEMA DE VALIDACIÓN DEL FORMULARIO
     * =============================================================================
     * Implementa validaciones dinámicas según el contexto del formulario,
     * interceptando el evento submit para realizar comprobaciones personalizadas
     * antes de permitir el envío al servidor.
     * 
     * CARACTERÍSTICAS:
     * - Validación básica de campos obligatorios
     * - Validaciones específicas según tipo de reporte
     * - Mensajes de error contextualmente relevantes
     * - Feedback visual con indicadores de carga
     */
    reportForm.addEventListener('submit', function(e) {
        const reportType = reportTypeSelect.value;
        
        // Validación fundamental: asegurar que hay un tipo de reporte seleccionado
        if (!reportType) {
            e.preventDefault();  // Detiene el envío del formulario
            showValidationError('Por favor selecciona un tipo de reporte');
            reportTypeSelect.focus();  // Posiciona cursor en el campo problemático
            return;  // Salida temprana para evitar procesamiento adicional
        }
        
        // Validaciones específicas según el tipo de reporte seleccionado
        if (reportType === 'movements_by_period') {
            const dateFrom = document.getElementById('date_from').value;
            const dateTo = document.getElementById('date_to').value;
            
            // Validación lógica: la fecha inicial debe ser anterior a la final
            if (dateFrom && dateTo && new Date(dateFrom) > new Date(dateTo)) {
                e.preventDefault();
                showValidationError('La fecha "Desde" no puede ser posterior a la fecha "Hasta"');
                document.getElementById('date_from').focus();
                return;
            }
            
            // Validación de UX: advertir sobre posible sobrecarga con rangos muy amplios
            if (dateFrom && dateTo) {
                // Cálculo de diferencia en días entre fechas
                const diffTime = Math.abs(new Date(dateTo) - new Date(dateFrom));
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                // Si el rango es mayor a un año, mostrar advertencia
                if (diffDays > 365) {
                    // Confirmación: da al usuario opción de continuar o cancelar
                    if (!confirm('El rango de fechas es muy amplio (más de 1 año). Esto puede generar un reporte muy extenso. ¿Deseas continuar?')) {
                        e.preventDefault();
                        return;
                    }
                }
            }
        }
        
        // Si todas las validaciones pasan, mostrar indicador de procesamiento
        showLoadingIndicator();
    });
    
    /**
     * FUNCIÓN: showValidationError
     * =============================================================================
     * PROPÓSITO:
     * Muestra mensajes de error de validación de forma visualmente atractiva
     * y con buenas prácticas de UX.
     * 
     * PARÁMETROS:
     * @param {string} message - El mensaje de error a mostrar
     * 
     * CARACTERÍSTICAS:
     * - Evita múltiples alertas simultáneas (singleton pattern)
     * - Auto-eliminación después de 8 segundos
     * - Scroll automático para asegurar visibilidad
     * - Opción de cierre manual
     * - Diseño consistente con sistema visual
     */
    function showValidationError(message) {
        // Singleton pattern: elimina alertas previas para evitar acumulación
        const existingAlert = document.querySelector('.validation-alert');
        if (existingAlert) {
            existingAlert.remove();
        }
        
        // Crear elemento de alerta con estructura semántica
        const alert = document.createElement('div');
        alert.className = 'validation-alert';
        alert.innerHTML = `
            <span class="alert-icon">⚠️</span>
            <span class="alert-message">${message}</span>
            <button type="button" class="alert-close" onclick="this.parentElement.remove()">×</button>
        `;
        
        // Inserción estratégica: al inicio del contenedor para máxima visibilidad
        const container = document.querySelector('.report-container');
        container.insertBefore(alert, container.firstChild);
        
        // UX enhancement: desplazamiento automático para asegurar visibilidad
        alert.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Auto-limpieza: eliminar mensaje después de tiempo suficiente para leerlo
        setTimeout(() => {
            // Verificación de seguridad: asegura que el elemento aún existe
            if (alert.parentNode) {
                alert.remove();
            }
        }, 8000);  // 8 segundos: tiempo suficiente para leer sin ser intrusivo
    }
    
    /**
     * FUNCIÓN: showLoadingIndicator
     * =============================================================================
     * PROPÓSITO:
     * Proporciona feedback visual mientras se procesa la generación del reporte,
     * previniendo múltiples envíos y mejorando la percepción de respuesta.
     * 
     * CARACTERÍSTICAS:
     * - Deshabilita el botón para prevenir dobles envíos
     * - Cambia texto e ícono para indicar procesamiento
     * - Timeout de seguridad para evitar botón bloqueado permanentemente
     * - Preserva estado original para restauración posterior
     */
    function showLoadingIndicator() {
        const submitBtn = document.querySelector('.btn-primary');
        const originalText = submitBtn.innerHTML;  // Guarda estado para restauración
        
        // Configuración visual y funcional de estado "procesando"
        submitBtn.disabled = true;  // Previene múltiples clics
        submitBtn.innerHTML = '<span class="btn-icon">⏳</span>Generando reporte...';
        submitBtn.classList.add('loading');  // Hook para estilos CSS adicionales
        
        // Mecanismo de seguridad: restaura botón automáticamente si toma demasiado tiempo
        setTimeout(() => {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
            submitBtn.classList.remove('loading');
        }, 10000);  // 10 segundos: tiempo razonable para generación de reportes
    }
    
    /**
     * MEJORAS DE EXPERIENCIA DE USUARIO PARA FILTROS
     * =============================================================================
     * Implementa mejoras visuales y funcionales para facilitar la interacción
     * con los elementos de filtrado, especialmente en formularios complejos.
     */
    
    // Captura elementos de selección principales
    const categorySelect = document.getElementById('category');
    const providerSelect = document.getElementById('provider');
    
    /**
     * FUNCIÓN: setupSearchableSelect
     * =============================================================================
     * PROPÓSITO:
     * Mejora la usabilidad de elementos select añadiendo estados visuales
     * y comportamientos mejorados para facilitar la interacción.
     * 
     * PARÁMETROS:
     * @param {HTMLElement} selectElement - El elemento select a mejorar
     * 
     * MEJORAS IMPLEMENTADAS:
     * - Indicación visual de foco para mejor accesibilidad
     * - Estados visuales diferenciados (normal/enfocado)
     * - Diseño consistente con guía de estilos del sistema
     */
    function setupSearchableSelect(selectElement) {
        // Verificación defensiva: solo procede si elemento existe
        if (!selectElement) return;
        
        // Al recibir foco (por clic o navegación con teclado)
        selectElement.addEventListener('focus', function() {
            this.classList.add('focused');  // Añade clase para estilos CSS
        });
        
        // Al perder foco (cambio a otro elemento)
        selectElement.addEventListener('blur', function() {
            this.classList.remove('focused');  // Elimina clase CSS
        });
    }
    
    // Aplicar mejoras a los elementos select principales
    setupSearchableSelect(categorySelect);
    setupSearchableSelect(providerSelect);
    
    /**
     * SISTEMA DE PERSISTENCIA DE PREFERENCIAS
     * =============================================================================
     * Implementa guardado y recuperación automática de las selecciones del usuario
     * usando localStorage, mejorando la experiencia al recordar configuraciones
     * entre sesiones de navegación.
     */
    
    /**
     * FUNCIÓN: saveFilters
     * =============================================================================
     * PROPÓSITO:
     * Guarda el estado actual del formulario en localStorage para
     * persistencia entre sesiones del navegador.
     * 
     * TÉCNICA:
     * - Captura todos los valores actuales de campos relevantes
     * - Serializa a JSON para almacenamiento
     * - Usa optional chaining para prevenir errores con elementos ausentes
     * - Proporciona valores por defecto para evitar 'undefined'
     */
    function saveFilters() {
        // Crea objeto con todos los valores actuales del formulario
        const filters = {
            report_type: reportTypeSelect.value,
            category: categorySelect?.value || '',  // Optional chaining para seguridad
            provider: providerSelect?.value || '',  // Fallback a '' si el valor es undefined
            date_from: document.getElementById('date_from')?.value || '',
            date_to: document.getElementById('date_to')?.value || '',
            stock_level: document.getElementById('stock_level')?.value || ''
        };
        
        // Guarda en localStorage como string JSON
        localStorage.setItem('customReportFilters', JSON.stringify(filters));
    }
    
    /**
     * FUNCIÓN: loadSavedFilters
     * =============================================================================
     * PROPÓSITO:
     * Recupera filtros guardados previamente y los aplica al formulario,
     * respetando valores existentes que puedan venir del servidor.
     * 
     * CARACTERÍSTICAS:
     * - Manejo robusto de errores con try-catch
     * - Respeta jerarquía de valores (servidor > localStorage)
     * - Sincronización automática de UI después de cargar valores
     * - Degradación elegante si no hay datos guardados
     */
    function loadSavedFilters() {
        try {
            // Intenta recuperar datos guardados
            const savedFilters = localStorage.getItem('customReportFilters');
            
            if (savedFilters) {
                // Parsea string JSON a objeto JavaScript
                const filters = JSON.parse(savedFilters);
                
                // Aplicación condicional y respetuosa de valores existentes
                // Solo aplica si no hay valores actuales (prioridad a valores del servidor)
                if (!reportTypeSelect.value && filters.report_type) {
                    reportTypeSelect.value = filters.report_type;
                }
                if (categorySelect && !categorySelect.value && filters.category) {
                    categorySelect.value = filters.category;
                }
                if (providerSelect && !providerSelect.value && filters.provider) {
                    providerSelect.value = filters.provider;
                }
                
                // Sincroniza UI para reflejar los valores cargados
                updateFormFields();
            }
        } catch (e) {
            // Manejo seguro de errores: solo registra sin interrumpir funcionamiento
            console.log('No se pudieron cargar los filtros guardados');
        }
    }
    
    /**
     * CONFIGURACIÓN DE AUTO-GUARDADO
     * =============================================================================
     * Establece listeners para guardar automáticamente los cambios en los filtros
     * cuando el usuario interactúa con cualquier control del formulario.
     */
    
    // Configurar guardado automático para elementos select principales
    // usando iteración para código más limpio y mantenible
    [reportTypeSelect, categorySelect, providerSelect].forEach(element => {
        if (element) {  // Verificación defensiva: solo si elemento existe
            element.addEventListener('change', saveFilters);  // Guardar al cambiar valor
        }
    });
    
    // Configurar guardado automático para otros campos por ID
    // usando iteración para evitar repetición de código
    ['date_from', 'date_to', 'stock_level'].forEach(id => {
        const element = document.getElementById(id);
        if (element) {  // Verificación defensiva
            element.addEventListener('change', saveFilters);  // Guardar al cambiar valor
        }
    });
    
    // Inicialización: cargar filtros guardados al iniciar
    loadSavedFilters();  // Ejecuta inmediatamente al cargar página
    
    /**
     * FUNCIÓN: clearFilters
     * =============================================================================
     * PROPÓSITO:
     * Proporciona una forma rápida de resetear todos los filtros a su estado inicial,
     * limpiando tanto la UI como los datos guardados.
     * 
     * ACCIONES REALIZADAS:
     * 1. Limpia valores de todos los campos de formulario
     * 2. Elimina datos guardados en localStorage
     * 3. Actualiza la UI para reflejar estado limpio
     */
    function clearFilters() {
        // Resetear todos los campos del formulario a valores vacíos
        reportTypeSelect.value = '';
        if (categorySelect) categorySelect.value = '';  // Verificación defensiva
        if (providerSelect) providerSelect.value = '';  // Verificación defensiva
        document.getElementById('date_from').value = '';
        document.getElementById('date_to').value = '';
        document.getElementById('stock_level').value = '';
        
        // Eliminar datos persistidos
        localStorage.removeItem('customReportFilters');
        
        // Actualizar interfaz para reflejar estado limpio
        updateFormFields();  // Ocultar/mostrar campos según corresponda
    }
    
    /**
     * MEJORA DE UI: BOTÓN DE LIMPIEZA DINÁMICA
     * =============================================================================
     * Crea un botón para limpiar filtros si no existe ya en la interfaz.
     * Utiliza técnicas de progressive enhancement para añadir funcionalidad
     * sin requerir cambios en el HTML base.
     */
    
    // Verificar si existe contenedor para acciones y que no exista ya el botón
    const formActions = document.querySelector('.form-actions');
    if (formActions && !document.querySelector('.clear-filters-btn')) {
        // Crear botón de limpieza
        const clearBtn = document.createElement('button');
        clearBtn.type = 'button';  // Tipo button para que no envíe el formulario
        clearBtn.className = 'btn btn-secondary clear-filters-btn';  // Clases para estilo consistente
        clearBtn.innerHTML = '<span class="btn-icon">🗑️</span>Limpiar Filtros';  // Ícono + texto
        clearBtn.addEventListener('click', clearFilters);  // Conectar con función de limpieza
        
        // Añadir botón al contenedor de acciones
        formActions.appendChild(clearBtn);  // Añade como último elemento
    }
    
    /**
     * FIN DEL MÓDULO PRINCIPAL
     * =============================================================================
     * Este cierre corresponde al event listener de DOMContentLoaded que
     * encapsula toda la funcionalidad de este archivo.
     */
});

/**
 * =============================================================================
 * RESUMEN TÉCNICO Y CONCEPTOS IMPLEMENTADOS
 * =============================================================================
 * 
 * PATRONES DE DISEÑO:
 * - Module Pattern: Todo encapsulado en función anónima para evitar variables globales
 * - Progressive Enhancement: Funcionalidad añadida sobre HTML básico
 * - Defensive Programming: Verificaciones contra valores nulos/indefinidos
 * - Event Delegation: Manejo eficiente de eventos en múltiples elementos
 * - Singleton Pattern: Evita duplicación de elementos (alertas, botones)
 * 
 * CARACTERÍSTICAS AVANZADAS:
 * - Adaptación dinámica de UI según contexto
 * - Validación personalizada con feedback visual
 * - Persistencia de estado con localStorage
 * - Manipulación DOM optimizada
 * - Gestión de fechas con API nativa Date
 * 
 * OPTIMIZACIONES DE UX:
 * - Feedback inmediato para acciones
 * - Estados visuales para interacciones
 * - Prevención de errores con validación preventiva
 * - Auto-rellenado inteligente de fechas
 * - Botón adaptativo según contexto
 * 
 * CONSIDERACIONES DE ACCESIBILIDAD:
 * - Mensajes de error descriptivos
 * - Focus management para navegación con teclado
 * - Estados visuales mejorados
 * - Tooltips informativos
 * 
 * CONCEPTOS DE SEGURIDAD:
 * - Validación en cliente como primera capa (complementa validación en servidor)
 * - Prevención de múltiples envíos accidentales
 * - Manejo seguro de excepciones
 * - Degradación elegante ante errores
 */
