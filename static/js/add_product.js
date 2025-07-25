/* 
=============================================================================
ADD_PRODUCT.JS - JAVASCRIPT PARA CREACIÓN DE PRODUCTOS
=============================================================================

PROPÓSITO:
Script dedicado para mejorar la experiencia de usuario en el formulario de
creación de productos. Implementa validaciones, auto-generación de SKU,
formateo automático y feedback visual en tiempo real.

CARACTERÍSTICAS PRINCIPALES:
- Generación automática de SKU basada en nombre y categoría
- Validación comprehensiva del formulario antes del envío
- Formateo automático de campos (precios, capitalización)
- Prevención de valores negativos en campos numéricos
- Feedback visual con alertas personalizadas
- Auto-limpieza de espacios en campos de texto

PATRONES JAVASCRIPT IMPLEMENTADOS:
- Event delegation con addEventListener
- DOM manipulation para feedback visual
- Form validation con preventDefault
- String manipulation para SKU generation
- Number formatting y validation
- CSS class manipulation para animaciones
- Timeout functions para UX temporal

INTEGRACIÓN CON HTML:
- Selecciona elementos por ID específicos del formulario
- Manipula clases CSS para estados visuales
- Inserta elementos DOM dinámicamente para alertas
- Previene submit del formulario en casos de error
=============================================================================
*/

// ADD PRODUCT PAGE JAVASCRIPT
// Script principal para la página de creación de productos del sistema de inventario

document.addEventListener('DOMContentLoaded', function() {
    /* 
    EVENT LISTENER PRINCIPAL - DOM CONTENT LOADED:
    
    PROPÓSITO:
    Asegura que todo el DOM esté completamente cargado antes de ejecutar el script.
    Previene errores de elementos no encontrados durante la carga de la página.
    
    TIMING:
    Se ejecuta después del parsing HTML pero antes de que terminen de cargar
    imágenes, stylesheets externos y otros recursos.
    
    VENTAJA SOBRE WINDOW.ONLOAD:
    No espera recursos externos, mejora tiempo de respuesta percibido.
    */
    
    // SELECCIÓN DE ELEMENTOS DOM CRÍTICOS
    const nameField = document.getElementById('name');
    const categoryField = document.getElementById('category');
    const skuField = document.getElementById('sku');
    
    /* 
    REFERENCIAS A ELEMENTOS DEL FORMULARIO:
    
    PATRÓN UTILIZADO:
    Obtener referencias una sola vez al inicio para optimizar rendimiento.
    Evita múltiples llamadas a getElementById en funciones repetitivas.
    
    ELEMENTOS OBJETIVO:
    - nameField: Input del nombre del producto (requerido para SKU)
    - categoryField: Input de categoría (usado para prefijo SKU)
    - skuField: Input del SKU (se auto-genera y también permite edición manual)
    
    ERROR HANDLING:
    Si algún elemento no existe, las funciones que los usen fallarán silenciosamente.
    En producción, considerar verificar que elements !== null.
    */
    
    // ===================================================================
    // SECCIÓN: GENERACIÓN AUTOMÁTICA DE SKU
    // ===================================================================
    
    function generateSKU() {
        /* 
        FUNCIÓN DE GENERACIÓN DE SKU AUTOMÁTICO:
        
        ALGORITMO IMPLEMENTADO:
        1. Tomar primeras 3 letras de categoría (o "PROD" por defecto)
        2. Agregar primeras 2 letras del nombre del producto
        3. Añadir número aleatorio de 3 dígitos con padding
        4. Formato final: CAT-NOM-123 o PROD-NOM-456
        
        EJEMPLOS DE OUTPUT:
        - Categoría: "Electrónicos", Nombre: "Mouse" → "ELE-MO-456"
        - Sin categoría, Nombre: "Teclado" → "PROD-TE-789"
        
        BENEFICIOS:
        - SKUs únicos y descriptivos automáticamente
        - Reduce errores humanos en asignación de códigos
        - Ahorra tiempo del usuario
        - Mantiene consistencia en nomenclatura
        */
        
        let sku = '';
        
        // PARTE 1: PREFIJO DE CATEGORÍA
        if (categoryField.value.trim()) {
            /* 
            CATEGORÍA DISPONIBLE:
            Extrae primeras 3 letras de la categoría ingresada.
            
            PROCESAMIENTO:
            1. .trim() elimina espacios al inicio y final
            2. .substring(0, 3) toma máximo 3 caracteres
            3. .toUpperCase() convierte a mayúsculas para consistencia
            
            EJEMPLO: "Electrónicos" → "ELE"
            */
            sku = categoryField.value.trim().substring(0, 3).toUpperCase();
        } else {
            /* 
            SIN CATEGORÍA:
            Usa "PROD" como prefijo genérico cuando no hay categoría.
            Mantiene formato consistente incluso sin categorización.
            */
            sku = 'PROD';
        }
        
        // PARTE 2: PREFIJO DE NOMBRE DE PRODUCTO
        if (nameField.value.trim()) {
            /* 
            NOMBRE DISPONIBLE:
            Agrega primeras 2 letras del nombre del producto.
            
            LÓGICA:
            Usa solo 2 letras para mantener SKU compacto pero descriptivo.
            Combinado con categoría proporciona identificación rápida.
            
            EJEMPLO: "Mouse Inalámbrico" → "MO"
            */
            sku += nameField.value.trim().substring(0, 2).toUpperCase();
        }
        
        // PARTE 3: NÚMERO ALEATORIO ÚNICO
        sku += '-' + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        
        /* 
        GENERACIÓN DE SUFIJO NUMÉRICO:
        
        DESGLOSE DEL CÓDIGO:
        1. Math.random() genera número decimal entre 0-1
        2. * 1000 convierte a rango 0-999.999...
        3. Math.floor() redondea hacia abajo (0-999)
        4. .toString() convierte número a string
        5. .padStart(3, '0') asegura 3 dígitos con ceros a la izquierda
        
        EJEMPLOS:
        - 45 → "045"
        - 678 → "678"
        - 7 → "007"
        
        RESULTADO FINAL:
        Sufijo consistente de 3 dígitos que reduce probabilidad de duplicados.
        */
        
        // ASIGNACIÓN AL CAMPO SKU
        skuField.value = sku;
        
        // FEEDBACK VISUAL TEMPORAL
        skuField.classList.add('sku-generated');
        setTimeout(() => {
            skuField.classList.remove('sku-generated');
        }, 1000);
        
        /* 
        ANIMACIÓN DE FEEDBACK:
        
        PROPÓSITO:
        Indicar visualmente al usuario que el SKU se generó automáticamente.
        
        IMPLEMENTACIÓN:
        1. Agrega clase CSS 'sku-generated' inmediatamente
        2. setTimeout remueve la clase después de 1 segundo
        3. CSS puede definir transiciones/animaciones para esta clase
        
        UX BENEFIT:
        Usuario recibe confirmación visual de que la acción fue exitosa.
        Diferencia entre SKU generado automáticamente vs ingresado manualmente.
        */
    }
    
    // EXPOSICIÓN GLOBAL DE LA FUNCIÓN
    window.generateSKU = generateSKU;
    
    /* 
    FUNCIÓN GLOBAL:
    
    RAZÓN:
    Permite que botones HTML puedan llamar la función directamente:
    <button onclick="generateSKU()">Generar SKU</button>
    
    PATRÓN:
    Función definida en closure local pero expuesta globalmente.
    Mantiene scope limpio pero permite acceso desde HTML.
    
    ALTERNATIVA MODERNA:
    En aplicaciones más complejas se usaría event delegation
    en lugar de onclick inline.
    */
    
    // ===================================================================
    // SECCIÓN: AUTO-GENERACIÓN INTELIGENTE DE SKU
    // ===================================================================
    
    function checkAutoGenerate() {
        /* 
        FUNCIÓN DE AUTO-GENERACIÓN INTELIGENTE:
        
        PROPÓSITO:
        Genera SKU automáticamente cuando el usuario ha ingresado suficiente
        información, pero solo si el campo SKU está vacío.
        
        LÓGICA DE ACTIVACIÓN:
        - Nombre tiene al menos 2 caracteres
        - Categoría tiene al menos 2 caracteres  
        - Campo SKU está vacío (no sobrescribir manual input)
        
        UX BEHAVIOR:
        Usuario no necesita hacer click en botón, el SKU aparece automáticamente
        mientras tipea, creando una experiencia fluida y moderna.
        */
        
        if (nameField.value.length >= 2 && categoryField.value.length >= 2) {
            /* 
            CONDICIÓN DE LONGITUD MÍNIMA:
            
            RAZONAMIENTO:
            - 2 caracteres es suficiente para generar prefijos útiles
            - Evita generar SKUs con información insuficiente
            - Previene activación prematura mientras usuario tipea
            
            EJEMPLO DE FLUJO:
            Usuario tipea "M" en nombre → no se activa
            Usuario tipea "Mo" en nombre y "El" en categoría → ¡se activa!
            */
            
            if (!skuField.value.trim()) {
                /* 
                VERIFICACIÓN DE CAMPO VACÍO:
                
                RESPETA INPUT MANUAL:
                Solo genera automáticamente si el usuario no ha ingresado
                un SKU personalizado. Evita sobrescribir trabajo del usuario.
                
                TRIM() USAGE:
                Considera espacios en blanco como "vacío" para mejor UX.
                */
                generateSKU();
            }
        }
    }
    
    // EVENT LISTENERS PARA AUTO-GENERACIÓN EN TIEMPO REAL
    nameField.addEventListener('input', checkAutoGenerate);
    categoryField.addEventListener('input', checkAutoGenerate);
    
    /* 
    EVENT LISTENERS PARA INPUT EN TIEMPO REAL:
    
    EVENTO 'INPUT':
    Se dispara cada vez que el contenido del campo cambia.
    Más responsivo que 'change' que requiere perder focus.
    
    EXPERIENCIA RESULTANTE:
    - Usuario tipea en nombre → verifica condiciones
    - Usuario tipea en categoría → verifica condiciones
    - SKU aparece automáticamente cuando ambos campos tienen suficiente info
    
    PERFORMANCE:
    Función checkAutoGenerate es liviana, segura para ejecutar en cada keystroke.
    */
    
    // ===================================================================
    // SECCIÓN: VALIDACIÓN COMPREHENSIVA DEL FORMULARIO
    // ===================================================================
    
    const form = document.querySelector('.add-product-form form');
    form.addEventListener('submit', function(e) {
        /* 
        VALIDACIÓN DEL FORMULARIO AL ENVÍO:
        
        ESTRATEGIA DE VALIDACIÓN:
        1. Interceptar evento submit antes de envío al servidor
        2. Ejecutar validaciones exhaustivas en frontend
        3. Prevenir envío si hay errores (preventDefault)
        4. Mostrar feedback específico y enfocar campo problemático
        5. Permitir envío solo si todos los datos son válidos
        
        BENEFICIOS:
        - Feedback inmediato sin roundtrip al servidor
        - Mejor experiencia de usuario
        - Reduce carga del servidor
        - Valida datos antes de procesamiento backend
        
        PATRÓN DE INTERCEPTACIÓN:
        e.preventDefault() detiene el comportamiento por defecto del submit.
        Solo se llama cuando se detectan errores.
        */
        
        // EXTRACCIÓN Y PROCESAMIENTO DE DATOS DEL FORMULARIO
        const name = nameField.value.trim();
        const price = parseFloat(document.getElementById('price').value);
        const quantity = parseInt(document.getElementById('quantity').value);
        const stockMin = parseInt(document.getElementById('stock_min').value);
        
        /* 
        PREPARACIÓN DE DATOS PARA VALIDACIÓN:
        
        name.trim(): Elimina espacios extra y obtiene string limpio
        parseFloat(): Convierte string a número decimal, NaN si inválido
        parseInt(): Convierte a número entero, NaN si inválido
        
        MANEJO DE CAMPOS VACÍOS:
        parseFloat('') = NaN
        parseInt('') = NaN
        Permite detectar campos no completados con isNaN()
        */
        
        // VALIDACIÓN 1: NOMBRE DEL PRODUCTO
        if (!name) {
            e.preventDefault();
            showValidationError('El nombre del producto es obligatorio');
            nameField.focus();
            return;
        }
        
        /* 
        VALIDACIÓN DE NOMBRE OBLIGATORIO:
        
        CONDICIÓN: !name
        Verifica si name es falsy: '', null, undefined, etc.
        .trim() anterior asegura que espacios solos no pasen validación.
        
        ACCIONES AL FALLAR:
        1. preventDefault(): Detiene envío del formulario
        2. showValidationError(): Muestra mensaje específico al usuario
        3. nameField.focus(): Coloca cursor en campo problemático
        4. return: Sale de función, no ejecuta validaciones posteriores
        
        UX PATTERN:
        Usuario recibe feedback inmediato sobre qué está mal y dónde.
        */
        
        if (name.length < 2) {
            e.preventDefault();
            showValidationError('El nombre debe tener al menos 2 caracteres');
            nameField.focus();
            return;
        }
        
        /* 
        VALIDACIÓN DE LONGITUD MÍNIMA:
        
        BUSINESS RULE:
        Nombre debe tener al menos 2 caracteres para ser válido.
        Previene productos con nombres muy cortos o poco descriptivos.
        
        IMPLEMENTACIÓN:
        Verifica .length después del .trim() aplicado anteriormente.
        Espacios ya fueron removidos, cuenta solo caracteres útiles.
        */
        
        // VALIDACIÓN 2: PRECIO VÁLIDO
        if (isNaN(price) || price < 0) {
            e.preventDefault();
            showValidationError('El precio debe ser un número válido mayor o igual a 0');
            document.getElementById('price').focus();
            return;
        }
        
        /* 
        VALIDACIÓN DE PRECIO:
        
        CONDICIONES VERIFICADAS:
        1. isNaN(price): Campo vacío o contiene texto no numérico
        2. price < 0: Números negativos no permitidos
        
        CASOS CUBIERTOS:
        - Campo vacío: parseFloat('') = NaN
        - Texto inválido: parseFloat('abc') = NaN  
        - Números negativos: -5 < 0 = true
        - Cero válido: 0 >= 0 = true (productos gratuitos permitidos)
        
        BUSINESS LOGIC:
        Precios negativos no tienen sentido en contexto de inventario.
        Cero es válido para muestras gratis o productos promocionales.
        */
        
        // VALIDACIÓN 3: CANTIDAD VÁLIDA
        if (isNaN(quantity) || quantity < 0) {
            e.preventDefault();
            showValidationError('La cantidad debe ser un número válido mayor o igual a 0');
            document.getElementById('quantity').focus();
            return;
        }
        
        /* 
        VALIDACIÓN DE CANTIDAD:
        
        MISMA LÓGICA QUE PRECIO:
        Debe ser número válido no negativo.
        
        INVENTARIO LOGIC:
        - Cero cantidad = producto sin stock inicial
        - Negativo = inconsistente con realidad física
        - parseInt asegura números enteros (no 5.5 productos)
        */
        
        // VALIDACIÓN 4: STOCK MÍNIMO VÁLIDO
        if (isNaN(stockMin) || stockMin < 0) {
            e.preventDefault();
            showValidationError('El stock mínimo debe ser un número válido mayor o igual a 0');
            document.getElementById('stock_min').focus();
            return;
        }
        
        /* 
        VALIDACIÓN DE STOCK MÍNIMO:
        
        PROPÓSITO:
        Stock mínimo define umbral para alertas de reposición.
        
        BUSINESS RULES:
        - Cero válido = no alertas de stock bajo
        - Negativo = ilógico para umbrales de alerta
        - Entero requerido para conteo de unidades
        */
        
        // CONFIRMACIÓN FINAL ANTES DEL ENVÍO
        if (!confirm(`¿Está seguro de agregar el producto "${name}"?`)) {
            e.preventDefault();
        }
        
        /* 
        CONFIRMACIÓN DE USUARIO:
        
        ÚLTIMO CHECKPOINT:
        Después de todas las validaciones técnicas, solicita confirmación
        explícita del usuario antes de crear el producto.
        
        IMPLEMENTACIÓN:
        - confirm() muestra dialog nativo del navegador
        - Incluye nombre del producto para contexto específico
        - Solo previene envío si usuario cancela
        
        UX BENEFIT:
        Previene creación accidental de productos.
        Da oportunidad de revisar datos una vez más.
        */
    });
    
    // ===================================================================
    // SECCIÓN: SISTEMA DE ALERTAS Y FEEDBACK VISUAL
    // ===================================================================
    
    function showValidationError(message) {
        /* 
        SISTEMA DE ALERTAS PERSONALIZADAS:
        
        PROPÓSITO:
        Mostrar mensajes de error de validación de forma visual y temporal.
        Alternativa más elegante que alert() nativo del navegador.
        
        CARACTERÍSTICAS:
        - Mensaje personalizable por tipo de error
        - Se inserta dinámicamente en el DOM
        - Auto-eliminación después de tiempo definido
        - Previene duplicación de alertas
        - Posicionamiento consistente en el formulario
        
        VENTAJAS SOBRE ALERT():
        - No bloquea la interfaz de usuario
        - Styling personalizable con CSS
        - Se integra visualmente con el diseño
        - Permite múltiples mensajes simultáneos (si se modifica)
        */
        
        // LIMPIEZA DE ALERTAS ANTERIORES
        const existingAlert = document.querySelector('.validation-alert');
        if (existingAlert) {
            existingAlert.remove();
        }
        
        /* 
        PREVENCIÓN DE DUPLICACIÓN:
        
        ESTRATEGIA:
        Busca alertas existentes y las elimina antes de crear nueva.
        Evita acumulación de mensajes cuando usuario comete múltiples errores.
        
        SELECTOR CSS:
        '.validation-alert' es clase específica para alertas de validación.
        Permite remover solo alertas de este tipo, no otros elementos.
        
        REMOVE():
        Elimina completamente el elemento del DOM.
        Más limpio que ocultarlo con display: none.
        */
        
        // CREACIÓN DE NUEVA ALERTA
        const alert = document.createElement('div');
        alert.className = 'validation-alert';
        alert.textContent = message;
        
        /* 
        CONSTRUCCIÓN DINÁMICA DE ELEMENTO:
        
        createElement('div'): Crea nuevo elemento div en memoria
        className: Asigna clase CSS para styling
        textContent: Inserta mensaje de error de forma segura (no HTML)
        
        SEGURIDAD:
        textContent previene inyección de HTML malicioso.
        Alternativa segura a innerHTML cuando solo se necesita texto.
        */
        
        // INSERCIÓN EN POSICIÓN ESTRATÉGICA
        const formContainer = document.querySelector('.add-product-form');
        formContainer.insertBefore(alert, formContainer.firstChild);
        
        /* 
        POSICIONAMIENTO DE ALERTA:
        
        ESTRATEGIA:
        Inserta al inicio del formulario para máxima visibilidad.
        Usuario ve inmediatamente el error sin necesidad de scroll.
        
        insertBefore():
        Método DOM que inserta elemento antes de referencia especificada.
        formContainer.firstChild = primer elemento hijo
        Resultado: alerta aparece al inicio del formulario.
        */
        
        // AUTO-ELIMINACIÓN TEMPORAL
        setTimeout(() => {
            if (alert.parentNode) {
                alert.remove();
            }
        }, 5000);
        
        /* 
        LIMPIEZA AUTOMÁTICA:
        
        TIMEOUT DE 5 SEGUNDOS:
        Balance entre dar tiempo suficiente para leer vs no cluttering UI.
        
        VERIFICACIÓN DE EXISTENCIA:
        alert.parentNode verifica si elemento sigue en DOM.
        Previene errores si fue removido manualmente antes del timeout.
        
        UX BENEFIT:
        Usuario no necesita cerrar manualmente, interfaz se limpia sola.
        */
    }
    
    // ===================================================================
    // SECCIÓN: FORMATEO AUTOMÁTICO Y MEJORAS DE UX
    // ===================================================================
    
    // FORMATEO AUTOMÁTICO DEL PRECIO
    const priceField = document.getElementById('price');
    priceField.addEventListener('blur', function() {
        const value = parseFloat(this.value);
        if (!isNaN(value)) {
            this.value = value.toFixed(2);
        }
    });
    
    /* 
    AUTO-FORMATEO DE PRECIO:
    
    EVENTO 'BLUR':
    Se dispara cuando el usuario deja el campo (pierde focus).
    Momento ideal para formatear sin interrumpir mientras tipea.
    
    FORMATEO A DOS DECIMALES:
    toFixed(2) convierte número a string con exactamente 2 decimales.
    
    EJEMPLOS:
    - Usuario tipea "15" → se convierte a "15.00"
    - Usuario tipea "15.5" → se convierte a "15.50"  
    - Usuario tipea "15.999" → se convierte a "16.00"
    
    VALIDACIÓN:
    !isNaN(value) verifica que conversión fue exitosa.
    Solo formatea valores numéricos válidos.
    
    UX BENEFIT:
    Consistencia visual en precios, profesionalismo del sistema.
    */
    
    // PREVENCIÓN DE NÚMEROS NEGATIVOS EN CAMPOS NUMÉRICOS
    const numericFields = ['quantity', 'price', 'stock_min'];
    numericFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        field.addEventListener('input', function() {
            if (this.value < 0) {
                this.value = 0;
            }
        });
    });
    
    /* 
    PROTECCIÓN CONTRA VALORES NEGATIVOS:
    
    ESTRATEGIA:
    Intercepta entrada del usuario en tiempo real y corrige valores negativos.
    Aplicado a todos los campos numéricos que no deberían ser negativos.
    
    CAMPOS PROTEGIDOS:
    - quantity: Cantidad de productos (no puede ser negativa físicamente)
    - price: Precio del producto (precios negativos no tienen sentido)
    - stock_min: Stock mínimo (umbrales negativos son ilógicos)
    
    EVENTO 'INPUT':
    Se dispara con cada cambio en el campo, incluyendo:
    - Typing manual
    - Paste de contenido
    - Cambio por spinner de input type="number"
    
    AUTO-CORRECCIÓN:
    Si valor es menor a 0, inmediatamente se establece en 0.
    Usuario ve la corrección en tiempo real.
    
    UX BENEFIT:
    Previene entrada de datos inválidos sin mostrar errores.
    Corrección silenciosa y no intrusiva.
    */
    
    // ===================================================================
    // SECCIÓN: FORMATEO AUTOMÁTICO DE TEXTO
    // ===================================================================
    
    // CAPITALIZACIÓN AUTOMÁTICA DE PRIMERA LETRA
    function capitalizeFirstLetter(element) {
        element.addEventListener('blur', function() {
            if (this.value) {
                this.value = this.value.charAt(0).toUpperCase() + this.value.slice(1);
            }
        });
    }
    
    /* 
    FUNCIÓN DE CAPITALIZACIÓN:
    
    PROPÓSITO:
    Aplica capitalización automática a campos de texto para consistencia.
    Mejora presentación profesional de datos de productos.
    
    ALGORITMO:
    1. Verifica que campo tenga contenido
    2. Toma primer carácter (.charAt(0))
    3. Lo convierte a mayúscula (.toUpperCase())
    4. Concatena con resto del string (.slice(1))
    
    EJEMPLO:
    "mouse inalámbrico" → "Mouse inalámbrico"
    
    EVENTO 'BLUR':
    Se ejecuta al perder focus, no interrumpe mientras usuario tipea.
    Permite entrada libre, formatea al finalizar.
    
    PATRÓN REUTILIZABLE:
    Función acepta elemento como parámetro, permite aplicar a múltiples campos.
    */
    
    // APLICACIÓN A CAMPOS ESPECÍFICOS
    capitalizeFirstLetter(nameField);
    capitalizeFirstLetter(categoryField);
    capitalizeFirstLetter(document.getElementById('provider'));
    
    /* 
    CAMPOS CON CAPITALIZACIÓN:
    
    SELECCIÓN ESTRATÉGICA:
    - name: Nombre del producto (ej: "Mouse" vs "mouse")
    - category: Categoría (ej: "Electrónicos" vs "electrónicos") 
    - provider: Proveedor (ej: "Samsung" vs "samsung")
    
    CAMPOS EXCLUIDOS:
    - SKU: Códigos suelen ser en mayúsculas o formato específico
    - Campos numéricos: No requieren capitalización
    
    CONSISTENCIA:
    Todos los campos de texto descriptivo siguen misma regla.
    Base de datos mantendrá formato profesional uniforme.
    */
    
    // LIMPIEZA DE ESPACIOS EXTRA EN CAMPOS DE TEXTO
    const textFields = ['name', 'category', 'provider', 'sku'];
    textFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        field.addEventListener('blur', function() {
            this.value = this.value.trim();
        });
    });
    
    /* 
    LIMPIEZA AUTOMÁTICA DE ESPACIOS:
    
    PROBLEMA COMÚN:
    Usuarios accidentally agregan espacios al inicio/final de campos.
    Puede causar problemas en búsquedas y duplicados en base de datos.
    
    SOLUCIÓN:
    .trim() remueve espacios en blanco al inicio y final automáticamente.
    
    CAMPOS PROTEGIDOS:
    Todos los campos de texto que van a base de datos.
    
    TIMING:
    Se ejecuta en 'blur' para no interferir con typing normal.
    
    EJEMPLOS:
    - "  Mouse Logitech  " → "Mouse Logitech"
    - "Electrónicos " → "Electrónicos"
    
    DATA QUALITY:
    Mejora calidad de datos en base de datos.
    Previene búsquedas fallidas por espacios extra.
    */
    
});

/* 
=============================================================================
RESUMEN TÉCNICO - ADD_PRODUCT.JS:
=============================================================================

PROPÓSITO:
Script integral para optimizar la experiencia de usuario en la creación de
productos. Implementa validaciones exhaustivas, generación automática de SKU,
formateo inteligente y feedback visual en tiempo real.

FUNCIONALIDADES IMPLEMENTADAS:

1. GENERACIÓN AUTOMÁTICA DE SKU:
   - Algoritmo basado en categoría + nombre + número aleatorio
   - Auto-generación inteligente mientras usuario tipea
   - Respeta SKU manual si usuario lo ingresa
   - Feedback visual cuando se genera automáticamente

2. VALIDACIÓN COMPREHENSIVA:
   - Validación de campos obligatorios (nombre)
   - Verificación de longitud mínima de texto
   - Validación de tipos de datos numéricos
   - Prevención de valores negativos ilógicos
   - Confirmación final antes de envío

3. SISTEMA DE ALERTAS PERSONALIZADAS:
   - Mensajes de error específicos y contextuales
   - Inserción dinámica en DOM
   - Auto-eliminación temporal
   - Focus automático en campo problemático

4. FORMATEO AUTOMÁTICO:
   - Precios a dos decimales al perder focus
   - Capitalización de primera letra en campos de texto
   - Limpieza automática de espacios extra
   - Corrección en tiempo real de valores negativos

5. MEJORAS DE UX:
   - Validación sin envío al servidor
   - Feedback inmediato para errores
   - Generación automática de códigos
   - Formateo profesional de datos

PATRONES JAVASCRIPT UTILIZADOS:

- EVENT DRIVEN PROGRAMMING:
  addEventListener para múltiples tipos de eventos
  
- DOM MANIPULATION:
  createElement, insertBefore, remove para alertas dinámicas
  
- FORM VALIDATION:
  preventDefault para interceptar envío
  
- STRING MANIPULATION:
  substring, trim, charAt, slice para procesamiento de texto
  
- NUMBER PROCESSING:
  parseFloat, parseInt, toFixed para manejo numérico
  
- TEMPORAL FUNCTIONS:
  setTimeout para auto-limpieza de elementos
  
- FUNCTIONAL PROGRAMMING:
  forEach para aplicar operaciones a múltiples elementos

INTEGRACIÓN CON SISTEMA:

- HTML INTEGRATION:
  Selecciona elementos por ID específicos del formulario
  Manipula clases CSS para estados visuales
  
- CSS COORDINATION:
  Usa clases específicas (.validation-alert, .sku-generated)
  Permite styling personalizado de estados
  
- BACKEND COMMUNICATION:
  Valida datos antes de envío al servidor
  Reduce carga de validación en backend
  
- USER EXPERIENCE:
  Feedback inmediato y contextual
  Prevención de errores comunes
  Formateo automático profesional

CASOS DE USO PRINCIPALES:
- Creación rápida de productos con mínimo esfuerzo manual
- Prevención de errores de entrada de datos
- Generación automática de códigos únicos
- Formateo consistente de información de productos
- Validación exhaustiva antes de persistir en base de datos

BENEFICIOS PARA EL NEGOCIO:
- Reduce tiempo de entrada de productos
- Mejora calidad de datos en inventario
- Previene errores costosos de duplicación
- Estandariza formato de información
- Mejora experiencia del usuario administrador

CONSIDERACIONES DE PERFORMANCE:
- Event listeners eficientes sin memory leaks
- Validaciones livianas que no bloquean UI
- Manipulación DOM mínima y optimizada
- Funciones puras reutilizables
=============================================================================
*/
