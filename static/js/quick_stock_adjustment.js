/**
 * =============================================================================
 * AJUSTE RÁPIDO DE INVENTARIO - Sistema de Inventario SCOMM
 * =============================================================================
 * 
 * PROPÓSITO:
 * Este módulo implementa la funcionalidad interactiva para realizar ajustes
 * rápidos de inventario (incrementos o decrementos), permitiendo:
 * - Validación de entrada en tiempo real
 * - Restricciones inteligentes según el tipo de operación
 * - Retroalimentación visual inmediata para el usuario
 * - Confirmación de acciones críticas para prevenir errores
 * 
 * ESTRUCTURA:
 * 1. Inicialización y captura de elementos DOM
 * 2. Gestión de cambios en tipo de ajuste
 * 3. Validación de cantidades según operación
 * 4. Validación del formulario antes de envío
 * 5. Sistema de notificaciones temporales
 * 
 * DEPENDENCIAS:
 * - No requiere bibliotecas externas (vanilla JavaScript)
 * - Espera estructura HTML específica con campos para tipo de ajuste y cantidad
 * - Requiere atributo data-current-stock en el HTML
 */

document.addEventListener('DOMContentLoaded', function() {
    /**
     * VARIABLES Y ELEMENTOS DOM PRINCIPALES
     * =============================================================================
     * Captura de los elementos interactivos necesarios para la funcionalidad
     * y obtención del stock actual desde el atributo data en el HTML
     */
    const adjustmentTypeSelect = document.getElementById('adjustment_type');  // Selector de tipo (agregar/reducir)
    const quantityInput = document.getElementById('quantity');                // Campo de cantidad a ajustar
    const currentStock = parseInt(document.querySelector('[data-current-stock]').dataset.currentStock); // Stock actual
    
    /**
     * EVENTO: CAMBIO DE TIPO DE AJUSTE
     * =============================================================================
     * PROPÓSITO:
     * Adapta dinámicamente la interfaz y restricciones del campo de cantidad
     * según el tipo de operación seleccionada (agregar o reducir stock).
     * 
     * LÓGICA IMPLEMENTADA:
     * - Para REDUCCIÓN: Limita la cantidad máxima al stock disponible
     * - Para INCREMENTO: No establece límite superior
     * - Para ESTADO INICIAL: Guía al usuario para seleccionar un tipo
     * 
     * CARACTERÍSTICAS VISUALES:
     * - Cambio de color según operación (verde para añadir, rojo para reducir)
     * - Texto de ayuda contextual en el placeholder
     * - Restricciones automáticas de valores excesivos
     */
    adjustmentTypeSelect.addEventListener('change', function() {
        // Obtiene el tipo de ajuste seleccionado
        const selectedType = this.value;
        
        // Elimina clases de estilo previas para evitar combinaciones incorrectas
        quantityInput.classList.remove('quantity-input-add', 'quantity-input-subtract');
        
        // CASO: REDUCCIÓN DE INVENTARIO
        if (selectedType === 'subtract') {
            // Establece límite máximo (no puede reducir más del stock existente)
            quantityInput.max = currentStock;
            
            // Texto de ayuda indicando el límite disponible
            quantityInput.placeholder = 'Máximo: ' + currentStock + ' unidades';
            
            // Aplica clase para estilo visual de reducción (típicamente rojo)
            quantityInput.classList.add('quantity-input-subtract');
            
            // Validación defensiva: Si el valor actual supera el máximo, lo ajusta
            if (parseInt(quantityInput.value) > currentStock) {
                quantityInput.value = currentStock;
            }
        } 
        // CASO: INCREMENTO DE INVENTARIO
        else if (selectedType === 'add') {
            // Elimina restricción de máximo (puede agregar cualquier cantidad)
            quantityInput.removeAttribute('max');
            
            // Texto de ayuda para incremento
            quantityInput.placeholder = 'Cantidad a agregar';
            
            // Aplica clase para estilo visual de adición (típicamente verde)
            quantityInput.classList.add('quantity-input-add');
        } 
        // CASO: ESTADO INICIAL/NINGUNA SELECCIÓN
        else {
            // Elimina restricciones
            quantityInput.removeAttribute('max');
            
            // Texto guía para el usuario
            quantityInput.placeholder = 'Seleccione primero el tipo de ajuste';
        }
    });
    
    /**
     * EVENTO: VALIDACIÓN EN TIEMPO REAL DE CANTIDAD
     * =============================================================================
     * PROPÓSITO:
     * Implementa validación instantánea mientras el usuario escribe para evitar
     * valores no permitidos, específicamente en operaciones de reducción de stock.
     * 
     * FUNCIONAMIENTO:
     * - Monitorea cambios en el campo de cantidad en tiempo real
     * - Verifica si la cantidad excede el stock disponible (para reducciones)
     * - Corrige automáticamente valores excesivos
     * - Proporciona feedback visual inmediato mediante advertencia
     * 
     * UX CONSIDERATIONS:
     * - Corrección automática sin requerir envío del formulario
     * - Retroalimentación inmediata cuando se intenta un valor no permitido
     * - Prevención proactiva de errores antes de la confirmación
     */
    quantityInput.addEventListener('input', function() {
        // Obtiene el tipo de operación actual
        const selectedType = adjustmentTypeSelect.value;
        
        // Convierte el valor ingresado a número entero
        const enteredValue = parseInt(this.value);
        
        // Valida específicamente para operaciones de reducción
        if (selectedType === 'subtract' && enteredValue > currentStock) {
            // Ajusta automáticamente al máximo permitido
            this.value = currentStock;
            
            // Notifica al usuario sobre la corrección y el motivo
            showTemporaryWarning('No puede reducir más stock del disponible');
        }
    });
    
    /**
     * EVENTO: VALIDACIÓN FINAL DEL FORMULARIO
     * =============================================================================
     * PROPÓSITO:
     * Implementa una capa final de validación antes del envío del formulario
     * para garantizar que todos los datos sean correctos y confirmados por el usuario.
     * 
     * VALIDACIONES REALIZADAS:
     * 1. Tipo de ajuste: Debe estar seleccionado (add/subtract)
     * 2. Cantidad: Debe ser un número positivo
     * 3. Motivo: Campo obligatorio para auditoría y trazabilidad
     * 
     * CARACTERÍSTICAS DE UX:
     * - Enfoque automático en el campo con error para corrección rápida
     * - Mensajes específicos según el tipo de error detectado
     * - Confirmación final con resumen de la operación
     * - Prevención de acciones accidentales mediante diálogo de confirmación
     */
    document.querySelector('.adjustment-form-container form').addEventListener('submit', function(e) {
        // Captura de todos los valores del formulario
        const adjustmentType = adjustmentTypeSelect.value;
        const quantity = parseInt(quantityInput.value);
        const reason = document.getElementById('reason').value.trim();
        
        // VALIDACIÓN 1: TIPO DE AJUSTE
        // Verifica que se haya seleccionado un tipo de operación
        if (!adjustmentType) {
            e.preventDefault(); // Detiene el envío del formulario
            showTemporaryWarning('Debe seleccionar un tipo de ajuste');
            adjustmentTypeSelect.focus(); // Coloca el cursor en el campo a corregir
            return;
        }
        
        // VALIDACIÓN 2: CANTIDAD
        // Verifica que la cantidad sea un número válido y positivo
        if (!quantity || quantity <= 0) {
            e.preventDefault();
            showTemporaryWarning('Debe ingresar una cantidad válida');
            quantityInput.focus();
            return;
        }
        
        // VALIDACIÓN 3: MOTIVO
        // Verifica que se haya especificado un motivo para el ajuste
        if (!reason) {
            e.preventDefault();
            showTemporaryWarning('Debe especificar el motivo del ajuste');
            document.getElementById('reason').focus();
            return;
        }
        
        // CONFIRMACIÓN FINAL
        // Solicita confirmación explícita del usuario antes de proceder
        // Personaliza el mensaje según el tipo de operación
        const actionText = adjustmentType === 'add' ? 'agregar' : 'reducir';
        const confirmMessage = `¿Está seguro de ${actionText} ${quantity} unidades?\n\nMotivo: ${reason}`;
        
        // Si el usuario cancela la confirmación, detiene el envío
        if (!confirm(confirmMessage)) {
            e.preventDefault();
        }
    });
    
    /**
     * FUNCIÓN: showTemporaryWarning
     * =============================================================================
     * PROPÓSITO:
     * Crea y muestra notificaciones temporales tipo "toast" para proporcionar
     * feedback visual inmediato al usuario sobre errores o advertencias.
     * 
     * CARACTERÍSTICAS:
     * - Notificaciones no bloqueantes (permiten seguir interactuando)
     * - Auto-desaparición después de un tiempo determinado
     * - Animaciones suaves de entrada y salida
     * - Prevención de múltiples advertencias simultáneas
     * - Posicionamiento fijo en la pantalla para visibilidad
     * 
     * PARÁMETROS:
     * - message: El texto a mostrar en la advertencia
     * 
     * TÉCNICAS APLICADAS:
     * - DOM dinámico: Creación y eliminación programática de elementos
     * - CSS-in-JS: Estilos aplicados directamente para independencia
     * - Animaciones CSS: Transiciones suaves con keyframes
     * - Temporizadores: Auto-gestión del ciclo de vida del componente
     */
    function showTemporaryWarning(message) {
        // PASO 1: LIMPIEZA PREVIA
        // Elimina advertencias existentes para evitar acumulación
        const existingWarning = document.querySelector('.temporary-warning');
        if (existingWarning) {
            existingWarning.remove();
        }
        
        // PASO 2: CREACIÓN DEL ELEMENTO
        // Crea un nuevo elemento DIV para la advertencia
        const warning = document.createElement('div');
        warning.className = 'temporary-warning';
        
        // Aplica estilos directamente (CSS-in-JS) para independencia del CSS externo
        warning.style.cssText = `
            position: fixed;           /* Posicionamiento fijo en la ventana */
            top: 20px;                 /* Distancia desde arriba */
            right: 20px;               /* Distancia desde la derecha */
            background: #e74c3c;       /* Color rojo para advertencias */
            color: white;              /* Texto blanco para contraste */
            padding: 1rem;             /* Espaciado interno */
            border-radius: 4px;        /* Bordes redondeados */
            box-shadow: 0 4px 12px rgba(0,0,0,0.3); /* Sombra para elevación visual */
            z-index: 1000;             /* Asegura que esté por encima de otros elementos */
            font-weight: 500;          /* Peso de fuente semi-negrita */
            animation: slideIn 0.3s ease; /* Animación de entrada */
        `;
        
        // Establece el mensaje recibido como contenido
        warning.textContent = message;
        
        // PASO 3: INTEGRACIÓN EN EL DOM
        // Añade el elemento al final del body
        document.body.appendChild(warning);
        
        // PASO 4: GESTIÓN DE CICLO DE VIDA
        // Configura la eliminación automática después de 3 segundos
        setTimeout(() => {
            // Verifica que el elemento aún exista en el DOM
            if (warning.parentNode) {
                // Aplica animación de salida antes de eliminar
                warning.style.animation = 'slideOut 0.3s ease';
                
                // Espera a que termine la animación antes de eliminar
                setTimeout(() => {
                    // Verificación adicional de seguridad
                    if (warning.parentNode) {
                        warning.remove();
                    }
                }, 300); // Duración de la animación de salida
            }
        }, 3000); // Duración total de visualización (3 segundos)
    }
    
    /**
     * ANIMACIONES CSS PARA ADVERTENCIAS
     * =============================================================================
     * PROPÓSITO:
     * Define animaciones CSS utilizadas por el sistema de advertencias temporales,
     * añadiéndolas dinámicamente al documento solo si no existen previamente.
     * 
     * TÉCNICA IMPLEMENTADA:
     * - Inyección dinámica de CSS: Añade estilos sin necesidad de archivo externo
     * - Verificación de existencia: Evita duplicados si ya se han añadido
     * - Singleton pattern: Asegura una sola instancia mediante ID único
     * 
     * ANIMACIONES DEFINIDAS:
     * - slideIn: Movimiento desde fuera de la pantalla hacia su posición final
     * - slideOut: Desaparición deslizándose fuera de la pantalla
     */
    if (!document.getElementById('warning-animations')) {
        // Crea un elemento <style> para insertar CSS
        const style = document.createElement('style');
        
        // Asigna ID único para poder verificar su existencia
        style.id = 'warning-animations';
        
        // Define las animaciones CSS con keyframes
        style.textContent = `
            /* Animación de entrada: deslizamiento desde la derecha */
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; } /* Posición inicial fuera de pantalla */
                to { transform: translateX(0); opacity: 1; }      /* Posición final visible */
            }
            
            /* Animación de salida: deslizamiento hacia la derecha */
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }    /* Posición inicial visible */
                to { transform: translateX(100%); opacity: 0; }   /* Posición final fuera de pantalla */
            }
        `;
        
        // Inserta el estilo en el <head> del documento
        document.head.appendChild(style);
    }
});
