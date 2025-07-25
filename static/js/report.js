/**
 * =============================================================================
 * SISTEMA DE REPORTES Y VISUALIZACIÓN - Sistema de Inventario SCOMM
 * =============================================================================
 * 
 * PROPÓSITO:
 * Este módulo implementa la visualización de datos a través de gráficos interactivos
 * para proporcionar análisis visual del inventario, incluyendo:
 * - Distribución de productos por categorías
 * - Estado del inventario y niveles de stock
 * - Tendencias de movimientos a lo largo del tiempo
 * - Productos con mayor actividad
 * - Adaptación visual según tema claro/oscuro
 * 
 * DEPENDENCIAS:
 * - Chart.js: Biblioteca para renderización de gráficos
 * - Variables CSS: Para adaptación a tema claro/oscuro
 * - Datos JSON del servidor: Transmitidos a través de la plantilla
 * 
 * ESTRUCTURA:
 * 1. Configuración e inicialización de gráficos
 * 2. Funciones de adaptación de tema visual
 * 3. Funciones específicas para cada tipo de gráfico
 * 4. Observadores para cambios de tema
 * 
 * NOTA TÉCNICA:
 * Este módulo utiliza Chart.js para renderizar visualizaciones de datos avanzadas
 * y se integra con el sistema de temas para una experiencia visual coherente.
 */

document.addEventListener('DOMContentLoaded', function() {
    /**
     * CONFIGURACIÓN GLOBAL DE GRÁFICOS
     * =============================================================================
     * Establece parámetros visuales comunes para todos los gráficos
     * creando una experiencia visual coherente y profesional
     */
    Chart.defaults.font.family = 'Arial, sans-serif'; // Tipografía consistente
    Chart.defaults.font.size = 12;                    // Tamaño de texto legible
    
    /**
     * FUNCIÓN: initializeChartsWithData
     * =============================================================================
     * PROPÓSITO:
     * Inicializa todos los gráficos del panel de reportes con datos proporcionados 
     * por el servidor, verificando la disponibilidad de cada conjunto de datos antes
     * de intentar crear el gráfico correspondiente.
     * 
     * PARÁMETROS:
     * - serverData: Objeto JSON con conjuntos de datos para diferentes visualizaciones
     *   * categories: Distribución de productos por categoría
     *   * stockDistribution: Estado del inventario por nivel de stock
     *   * movementTrends: Datos de tendencias de movimientos a lo largo del tiempo
     *   * mostMovedProducts: Productos con mayor frecuencia de movimientos
     * 
     * FUNCIONAMIENTO:
     * Verifica cada conjunto de datos independientemente y crea solo los gráficos
     * para los que existen datos, proporcionando resistencia a errores y flexibilidad
     * en caso de datos parciales o incompletos.
     * 
     * EXPOSICIÓN GLOBAL:
     * Esta función se expone globalmente como window.initializeChartsWithData para
     * permitir su invocación desde scripts incluidos en la plantilla.
     */
    window.initializeChartsWithData = function(serverData) {
        // Gráfico 1: Distribución por categorías (gráfico tipo donut)
        if (serverData.categories) {
            createCategoryChart(serverData.categories);
        }
        
        // Gráfico 2: Distribución de niveles de stock (gráfico tipo pie)
        if (serverData.stockDistribution) {
            createStockDistributionChart(serverData.stockDistribution);
        }
        
        // Gráfico 3: Tendencias de movimientos en el tiempo (gráfico de línea)
        if (serverData.movementTrends) {
            createMovementTrendsChart(serverData.movementTrends);
        }
        
        // Gráfico 4: Productos más movidos (gráfico de barras)
        if (serverData.mostMovedProducts) {
            createMostMovedChart(serverData.mostMovedProducts);
        }
    };
    
    /**
     * FUNCIÓN: autoInitializeCharts
     * =============================================================================
     * PROPÓSITO:
     * Proporciona un mecanismo de inicialización automática de gráficos cuando los
     * datos ya están disponibles en la página, a través de una variable global
     * inyectada desde el servidor mediante la plantilla.
     * 
     * FUNCIONAMIENTO:
     * - Verifica si existe la variable global window.reportData
     * - Si existe, utiliza esos datos para inicializar los gráficos
     * - Actúa como puente entre datos incrustados en la plantilla y la inicialización
     * 
     * PATRÓN DE DISEÑO:
     * Implementa un patrón de inicialización automática que permite que la página
     * funcione sin necesidad de código adicional en la plantilla, mejorando la
     * separación de responsabilidades entre backend y frontend.
     */
    window.autoInitializeCharts = function() {
        // Verifica existencia de datos proporcionados por la plantilla
        if (typeof window.reportData !== 'undefined' && window.reportData) {
            // Utiliza la función principal de inicialización
            window.initializeChartsWithData(window.reportData);
        }
    };
    
    /**
     * AUTO-INICIALIZACIÓN DIFERIDA
     * =============================================================================
     * Inicia la auto-inicialización con un pequeño retraso para asegurar que
     * todos los elementos DOM y variables globales estén completamente cargados.
     * El retraso de 100ms es suficiente para la mayoría de casos sin ser perceptible.
     */
    setTimeout(window.autoInitializeCharts, 100);
    
    /**
     * FUNCIÓN: getThemeColors
     * =============================================================================
     * PROPÓSITO:
     * Determina la paleta de colores adecuada según el tema actual (claro/oscuro)
     * para mantener coherencia visual y legibilidad en todos los componentes.
     * 
     * FUNCIONAMIENTO:
     * - Detecta el tema actual mediante el atributo data-theme en el documento
     * - Retorna un objeto con colores específicos para diferentes elementos
     * 
     * RETORNO:
     * Objeto con propiedades de color para:
     * - text: Color del texto principal
     * - grid: Color de líneas de cuadrícula
     * - background: Color de fondo para elementos
     * 
     * IMPLEMENTACIÓN:
     * Facilita la coherencia visual entre componentes DOM y gráficos Chart.js
     * según el tema activo, mejorando la experiencia de usuario.
     */
    function getThemeColors() {
        // Detecta si el tema actual es oscuro o claro
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        
        // Retorna objeto con paletas de colores específicas según tema
        return {
            text: isDark ? '#e0e0e0' : '#333',         // Color de texto principal
            grid: isDark ? '#444' : '#ddd',            // Color de líneas de cuadrícula
            background: isDark ? '#2d3748' : '#ffffff' // Color de fondo
        };
    }
    
    /**
     * FUNCIÓN: updateChartColors
     * =============================================================================
     * PROPÓSITO:
     * Actualiza la configuración de colores de todos los gráficos existentes
     * para adaptarse al tema visual actual (claro/oscuro) manteniendo coherencia
     * y legibilidad en todas las visualizaciones.
     * 
     * FUNCIONAMIENTO:
     * - Obtiene la paleta de colores actual
     * - Actualiza la configuración global de Chart.js
     * - Recorre todas las instancias de gráficos y actualiza sus configuraciones
     * - Aplica cambios de forma retroactiva a gráficos ya renderizados
     * 
     * BENEFICIOS:
     * - Mejora accesibilidad al mantener contraste adecuado
     * - Proporciona experiencia visual coherente con el resto de la aplicación
     * - Actualiza los gráficos sin necesidad de recrearlos o recargar datos
     */
    function updateChartColors() {
        // Obtiene la paleta de colores según el tema actual
        const colors = getThemeColors();
        
        // PASO 1: ACTUALIZA CONFIGURACIÓN GLOBAL
        // Establece colores base para todos los gráficos nuevos
        Chart.defaults.color = colors.text;             // Color de texto general
        Chart.defaults.borderColor = colors.grid;       // Borde de elementos
        Chart.defaults.plugins.legend.labels.color = colors.text; // Leyendas
        
        // PASO 2: ACTUALIZA GRÁFICOS EXISTENTES
        // Recorre todas las instancias activas de Chart.js
        Object.values(Chart.instances).forEach(function(chart) {
            // Verifica si el gráfico tiene escalas (la mayoría excepto pie/donut)
            if (chart.options.scales) {
                // Actualiza eje X si existe
                if (chart.options.scales.x) {
                    // Crea objetos de configuración si no existen
                    chart.options.scales.x.ticks = chart.options.scales.x.ticks || {};
                    chart.options.scales.x.grid = chart.options.scales.x.grid || {};
                    
                    // Actualiza colores del eje X
                    chart.options.scales.x.ticks.color = colors.text; // Texto del eje
                    chart.options.scales.x.grid.color = colors.grid;  // Líneas de cuadrícula
                }
                
                // Actualiza eje Y si existe
                if (chart.options.scales.y) {
                    // Crea objetos de configuración si no existen
                    chart.options.scales.y.ticks = chart.options.scales.y.ticks || {};
                    chart.options.scales.y.grid = chart.options.scales.y.grid || {};
                    
                    // Actualiza colores del eje Y
                    chart.options.scales.y.ticks.color = colors.text; // Texto del eje
                    chart.options.scales.y.grid.color = colors.grid;  // Líneas de cuadrícula
                }
            }
            
            // Aplica los cambios actualizando el gráfico
            chart.update();
        });
    }
    
    /**
     * FUNCIÓN: applyDynamicStyles
     * =============================================================================
     * PROPÓSITO:
     * Adapta dinámicamente los elementos HTML de la página de reportes para que
     * respondan correctamente a cambios de tema (claro/oscuro), reemplazando
     * estilos estáticos por variables CSS dinámicas.
     * 
     * TÉCNICAS APLICADAS:
     * - Selección basada en atributos: Encuentra elementos con estilos específicos
     * - Manipulación de strings: Reemplaza valores RGB/HEX por variables CSS
     * - Modificación dinámica de estilos: Actualiza inline styles en tiempo real
     * - Adición de clases CSS: Permite estilos condicionales vía CSS
     * 
     * ELEMENTOS ADAPTADOS:
     * - Contenedores de gráficos con fondos blancos
     * - Tablas con filas alternas coloreadas
     * - Textos con colores específicos
     * - Bordes y separadores
     * 
     * BENEFICIO PARA MANTENIMIENTO:
     * Permite migrar progresivamente de estilos hardcodeados a un sistema
     * basado en variables CSS sin necesidad de reescribir el HTML existente.
     */
    function applyDynamicStyles() {
        // PASO 1: ADAPTAR FONDOS BLANCOS
        // Selecciona elementos div con fondo blanco definido inline
        const whiteBackgrounds = document.querySelectorAll('div[style*="background: white"], div[style*="background:white"]');
        
        // Convierte cada elemento a un sistema basado en variables CSS
        whiteBackgrounds.forEach(function(element) {
            // Añade clase para estilos adicionales vía CSS externo
            element.classList.add('report-card');
            
            // Actualiza estilos inline para usar variables CSS
            let style = element.getAttribute('style');
            if (style) {
                // Reemplaza color de fondo estático
                style = style.replace(/background:\s*white/gi, 'background: var(--card-bg)');
                
                // Reemplaza sombra estática
                style = style.replace(/box-shadow:\s*0 2px 4px rgba\(0,0,0,0\.1\)/gi, 
                                      'box-shadow: 0 2px 4px var(--shadow)');
                
                // Aplica los nuevos estilos
                element.setAttribute('style', style);
            }
        });
        
        // PASO 2: ADAPTAR FONDOS GRISES (CABECERAS DE TABLA)
        // Selecciona elementos de tabla con fondos gris claro
        const grayBackgrounds = document.querySelectorAll('tr[style*="background: #f8f9fa"], th[style*="background: #f8f9fa"]');
        
        // Actualiza cada elemento para usar variables CSS
        grayBackgrounds.forEach(function(element) {
            let style = element.getAttribute('style');
            if (style) {
                // Reemplaza color gris por variable CSS
                style = style.replace(/background:\s*#f8f9fa/gi, 'background: var(--table-header-bg)');
                element.setAttribute('style', style);
            }
        });
        
        // PASO 3: ADAPTAR COLORES DE TEXTO Y BORDES
        // Selecciona elementos de texto comunes
        const textElements = document.querySelectorAll('td, th, h3, p');
        
        // Actualiza cada elemento de texto según sus atributos
        textElements.forEach(function(element) {
            let style = element.getAttribute('style') || '';
            
            // Adapta colores de texto gris
            if (style.includes('color: #666')) {
                style = style.replace(/color:\s*#666/gi, 'color: var(--text-color); opacity: 0.7');
            }
            
            // Adapta bordes de tabla
            if (style.includes('border-bottom: 1px solid #ddd')) {
                style = style.replace(/border-bottom:\s*1px solid #ddd/gi, 
                                     'border-bottom: 1px solid var(--border-color)');
            }
            
            // Aplica estilos actualizados si hubo cambios
            if (style) {
                element.setAttribute('style', style);
            }
        });
        
        // PASO 4: ADAPTAR CONTENEDORES DE GRÁFICOS
        // Selecciona todos los elementos canvas (gráficos)
        const canvas = document.querySelectorAll('canvas');
        
        // Para cada gráfico, configura su contenedor
        canvas.forEach(function(canvasElement) {
            // Busca el contenedor padre con clase específica
            const parent = canvasElement.closest('.chart-container');
            
            // Si existe, aplica estilos dinámicos
            if (parent) {
                parent.style.background = 'var(--card-bg)';
                parent.style.boxShadow = '0 2px 4px var(--shadow)';
            }
        });
    }
    
    /**
     * INICIALIZACIÓN Y CONFIGURACIÓN DE TEMA
     * =============================================================================
     * Aplica estilos dinámicos y configuración de colores inicial,
     * y configura la detección automática de cambios de tema.
     */
    
    // Aplicación inicial de estilos
    applyDynamicStyles();  // Adapta elementos HTML estáticos
    updateChartColors();   // Configura colores de los gráficos
    
    /**
     * OBSERVADOR DE CAMBIOS DE TEMA
     * =============================================================================
     * PROPÓSITO:
     * Detecta cambios en el tema de la aplicación (claro/oscuro) y actualiza
     * automáticamente los gráficos para mantener coherencia visual.
     * 
     * IMPLEMENTACIÓN:
     * Utiliza la API MutationObserver para vigilar cambios en el atributo
     * data-theme del elemento root (documentElement) y desencadena la
     * actualización de colores cuando se detecta un cambio.
     */
    const observer = new MutationObserver(function(mutations) {
        // Procesa cada mutación detectada
        mutations.forEach(function(mutation) {
            // Verifica que sea un cambio en atributo y específicamente en data-theme
            if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
                // Actualiza colores de los gráficos según el nuevo tema
                updateChartColors();
            }
        });
    });
    
    // Configura el observador para vigilar solo el atributo data-theme
    observer.observe(document.documentElement, {
        attributes: true,                    // Observar cambios de atributos
        attributeFilter: ['data-theme']      // Sólo el atributo data-theme
    });
});

/**
 * FUNCIÓN: createCategoryChart
 * =============================================================================
 * PROPÓSITO:
 * Crea y renderiza un gráfico circular tipo "donut" que visualiza la distribución
 * de productos por categoría, permitiendo identificar rápidamente qué categorías
 * tienen mayor representación en el inventario.
 * 
 * PARÁMETROS:
 * - categories: Array de objetos con estructura {category: string, product_count: number}
 *   donde cada objeto representa una categoría y su cantidad de productos asociados
 * 
 * VISUALIZACIÓN:
 * - Tipo: Gráfico circular con agujero central (donut chart)
 * - Colores: Paleta predefinida para distinguir categorías
 * - Leyenda: Posicionada en la parte inferior con etiquetas estilizadas
 * - Tooltips: Información detallada al pasar el cursor
 * 
 * CARACTERÍSTICAS:
 * - Validación defensiva de datos para prevenir errores
 * - Adaptación responsiva al tamaño del contenedor
 * - Personalización de tooltips para mejorar comprensión
 * - Configuración visual optimizada para legibilidad
 */
function createCategoryChart(categories) {
    // Validación defensiva: verifica que existan datos
    if (!categories || categories.length === 0) return;
    
    // Obtiene el elemento canvas donde se renderizará el gráfico
    const ctx = document.getElementById('categoryChart');
    
    // Validación defensiva: verifica que exista el elemento en el DOM
    if (!ctx) return;
    
    // PREPARACIÓN DE DATOS
    // Extrae etiquetas (nombres de categorías) y valores (cantidades)
    const labels = categories.map(cat => cat.category);         // Nombres de categorías
    const data = categories.map(cat => cat.product_count);      // Cantidad de productos por categoría
    
    // CREACIÓN DEL GRÁFICO
    new Chart(ctx.getContext('2d'), {
        // CONFIGURACIÓN BÁSICA
        type: 'doughnut',  // Tipo de gráfico: circular con agujero (donut)
        
        // DATOS DEL GRÁFICO
        data: {
            labels: labels,  // Nombres de categorías como etiquetas
            datasets: [{
                data: data,  // Cantidad de productos como valores
                
                // Paleta de colores para segmentos (10 colores distintos)
                backgroundColor: [
                    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
                    '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF6384'
                ],
                borderWidth: 2,        // Grosor del borde de los segmentos
                borderColor: '#fff'    // Color del borde (blanco)
            }]
        },
        
        // OPCIONES DE CONFIGURACIÓN
        options: {
            responsive: true,           // Se adapta al tamaño del contenedor
            maintainAspectRatio: false, // Permite ajuste libre de dimensiones
            
            // CONFIGURACIÓN DE PLUGINS
            plugins: {
                // Configuración de la leyenda
                legend: {
                    position: 'bottom',    // Posición: debajo del gráfico
                    labels: {
                        padding: 15,         // Espacio entre etiquetas
                        usePointStyle: true  // Usa puntos en lugar de rectángulos
                    }
                },
                
                // Configuración de tooltips (información al pasar cursor)
                tooltip: {
                    callbacks: {
                        // Personaliza el texto mostrado
                        label: function(context) {
                            return context.label + ': ' + context.parsed + ' productos';
                        }
                    }
                }
            }
        }
    });
}

/**
 * FUNCIÓN: createStockDistributionChart
 * =============================================================================
 * PROPÓSITO:
 * Crea y renderiza un gráfico circular que visualiza la distribución del inventario
 * según niveles de stock (crítico, bajo, normal, alto), permitiendo identificar
 * rápidamente el estado general del inventario y posibles alertas.
 * 
 * PARÁMETROS:
 * - stockDistribution: Array de objetos con estructura {stock_level: string, product_count: number}
 *   donde cada objeto representa un nivel de stock y su cantidad de productos asociados
 * 
 * VISUALIZACIÓN:
 * - Tipo: Gráfico circular completo (pie chart)
 * - Colores: Paleta semántica según niveles de stock:
 *   * Rojo: Nivel crítico - Requiere atención inmediata
 *   * Amarillo: Nivel bajo - Requiere monitoreo
 *   * Verde: Nivel normal - Estado óptimo
 *   * Azul: Nivel alto - Posible sobrestock
 * 
 * CARACTERÍSTICAS:
 * - Validación defensiva de datos para prevenir errores
 * - Códigos de color con significado semántico para interpretación intuitiva
 * - Tooltips descriptivos para información detallada
 */
function createStockDistributionChart(stockDistribution) {
    // Validación defensiva: verifica que exista el elemento en el DOM
    const ctx = document.getElementById('stockDistributionChart');
    if (!ctx) return;
    
    // PREPARACIÓN DE DATOS
    // Extrae etiquetas (niveles de stock) y valores (cantidades)
    const labels = stockDistribution.map(item => item.stock_level);  // Niveles de stock
    const data = stockDistribution.map(item => item.product_count);  // Cantidades por nivel
    
    // CREACIÓN DEL GRÁFICO
    new Chart(ctx.getContext('2d'), {
        // CONFIGURACIÓN BÁSICA
        type: 'pie',  // Tipo de gráfico: circular completo
        
        // DATOS DEL GRÁFICO
        data: {
            labels: labels,  // Niveles de stock como etiquetas
            datasets: [{
                data: data,  // Cantidad de productos como valores
                
                // Colores semánticos según nivel de stock
                backgroundColor: [
                    '#dc3545',  // Rojo - Crítico
                    '#ffc107',  // Amarillo - Bajo
                    '#28a745',  // Verde - Normal
                    '#17a2b8'   // Azul - Alto
                ],
                borderWidth: 2,        // Grosor del borde de los segmentos
                borderColor: '#fff'    // Color del borde (blanco)
            }]
        },
        
        // OPCIONES DE CONFIGURACIÓN
        options: {
            responsive: true,           // Se adapta al tamaño del contenedor
            maintainAspectRatio: false, // Permite ajuste libre de dimensiones
            
            // CONFIGURACIÓN DE PLUGINS
            plugins: {
                // Configuración de la leyenda
                legend: {
                    position: 'bottom',    // Posición: debajo del gráfico
                    labels: {
                        padding: 15,         // Espacio entre etiquetas
                        usePointStyle: true  // Usa puntos en lugar de rectángulos
                    }
                },
                
                // Configuración de tooltips (información al pasar cursor)
                tooltip: {
                    callbacks: {
                        // Personaliza el texto mostrado
                        label: function(context) {
                            return context.label + ': ' + context.parsed + ' productos';
                        }
                    }
                }
            }
        }
    });
}

/**
 * FUNCIÓN: createMovementTrendsChart
 * =============================================================================
 * PROPÓSITO:
 * Crea y renderiza un gráfico de líneas que visualiza la evolución temporal
 * de movimientos de inventario (entradas y salidas), permitiendo identificar
 * tendencias, patrones estacionales y correlaciones entre ambos tipos de movimiento.
 * 
 * PARÁMETROS:
 * - movementTrends: Array de objetos con estructura:
 *   {date: string, total_entries: number, total_exits: number}
 *   donde cada objeto representa un período de tiempo y sus movimientos asociados
 * 
 * VISUALIZACIÓN:
 * - Tipo: Gráfico de líneas con múltiples series temporales
 * - Series:
 *   * Línea verde: Entradas de inventario (ingresos)
 *   * Línea roja: Salidas de inventario (egresos)
 * - Ejes:
 *   * Eje X: Escala temporal (fechas)
 *   * Eje Y: Cantidad de movimientos
 * 
 * CARACTERÍSTICAS:
 * - Validación defensiva de datos para prevenir errores
 * - Múltiples series para comparación visual directa
 * - Tooltips interactivos que muestran ambos valores en el mismo punto temporal
 * - Curvas suavizadas para mejor visualización de tendencias
 * - Interacción optimizada para exploración de datos
 */
function createMovementTrendsChart(movementTrends) {
    // Validación defensiva: verifica que existan datos
    if (!movementTrends || movementTrends.length === 0) return;
    
    // Validación defensiva: verifica que exista el elemento en el DOM
    const ctx = document.getElementById('movementTrendsChart');
    if (!ctx) return;
    
    // PREPARACIÓN DE DATOS
    // Extrae fechas y valores para cada serie
    const labels = movementTrends.map(trend => trend.date);              // Fechas para eje X
    const entriesData = movementTrends.map(trend => trend.total_entries || 0); // Entradas (con fallback a 0)
    const exitsData = movementTrends.map(trend => trend.total_exits || 0);     // Salidas (con fallback a 0)
    
    // CREACIÓN DEL GRÁFICO
    new Chart(ctx.getContext('2d'), {
        // CONFIGURACIÓN BÁSICA
        type: 'line',  // Tipo de gráfico: líneas para series temporales
        
        // DATOS DEL GRÁFICO
        data: {
            labels: labels,  // Fechas como etiquetas de eje X
            datasets: [
                // Serie 1: Entradas
                {
                    label: 'Entradas',                         // Nombre de la serie
                    data: entriesData,                         // Valores de entradas
                    borderColor: '#28a745',                    // Color de línea (verde)
                    backgroundColor: 'rgba(40, 167, 69, 0.1)', // Color de área (verde transparente)
                    fill: false,                              // No rellena área bajo la curva
                    tension: 0.4                               // Suavizado de curva (0=recta, 1=muy curva)
                }, 
                // Serie 2: Salidas
                {
                    label: 'Salidas',                          // Nombre de la serie
                    data: exitsData,                           // Valores de salidas
                    borderColor: '#dc3545',                    // Color de línea (rojo)
                    backgroundColor: 'rgba(220, 53, 69, 0.1)', // Color de área (rojo transparente)
                    fill: false,                              // No rellena área bajo la curva
                    tension: 0.4                               // Suavizado de curva
                }
            ]
        },
        
        // OPCIONES DE CONFIGURACIÓN
        options: {
            responsive: true,           // Se adapta al tamaño del contenedor
            maintainAspectRatio: false, // Permite ajuste libre de dimensiones
            
            // CONFIGURACIÓN DE PLUGINS
            plugins: {
                // Configuración de la leyenda
                legend: {
                    position: 'top'  // Posición: encima del gráfico
                },
                
                // Configuración de tooltips
                tooltip: {
                    mode: 'index',      // Muestra todas las series para el mismo punto X
                    intersect: false    // No requiere posición exacta sobre el punto
                }
            },
            
            // CONFIGURACIÓN DE EJES
            scales: {
                // Eje X (horizontal - tiempo)
                x: {
                    display: true,     // Muestra el eje
                    title: {
                        display: true, // Muestra título del eje
                        text: 'Fecha'  // Etiqueta del eje
                    }
                },
                
                // Eje Y (vertical - cantidades)
                y: {
                    display: true,      // Muestra el eje
                    title: {
                        display: true,  // Muestra título del eje
                        text: 'Cantidad' // Etiqueta del eje
                    },
                    beginAtZero: true   // La escala comienza en 0
                }
            },
            
            // CONFIGURACIÓN DE INTERACCIÓN
            interaction: {
                mode: 'nearest',  // Selecciona el punto más cercano al cursor
                axis: 'x',        // Considerando solo el eje X (mismo punto temporal)
                intersect: false   // No requiere estar exactamente sobre el punto
            }
        }
    });
}

/**
 * FUNCIÓN: createMostMovedChart
 * =============================================================================
 * PROPÓSITO:
 * Crea y renderiza un gráfico de barras que visualiza los productos con mayor
 * número de movimientos (entradas + salidas), permitiendo identificar rápidamente
 * qué productos tienen mayor actividad en el inventario.
 * 
 * PARÁMETROS:
 * - mostMovedProducts: Array de objetos con estructura:
 *   {product_name: string, movement_count: number}
 *   donde cada objeto representa un producto y su número total de movimientos
 * 
 * VISUALIZACIÓN:
 * - Tipo: Gráfico de barras vertical
 * - Eje X: Nombres de productos (truncados para legibilidad)
 * - Eje Y: Número de movimientos totales
 * - Barras: Colores variados para diferenciar cada producto
 * 
 * CARACTERÍSTICAS ESPECIALES:
 * - Truncamiento inteligente de nombres largos con elipsis
 * - Tooltips que muestran el nombre completo del producto
 * - Validación defensiva de datos para prevenir errores
 * - Colores distintos para cada barra para mejor diferenciación visual
 */
function createMostMovedChart(mostMovedProducts) {
    // Validación defensiva: verifica que existan datos
    if (!mostMovedProducts || mostMovedProducts.length === 0) return;
    
    // Validación defensiva: verifica que exista el elemento en el DOM
    const ctx = document.getElementById('mostMovedChart');
    if (!ctx) return;
    
    // PREPARACIÓN DE DATOS
    // Crea etiquetas truncadas para mejor visualización en eje X
    const labels = mostMovedProducts.map(product => {
        const name = product.product_name;
        // Trunca nombres largos y añade elipsis para mejorar legibilidad
        return name.length > 15 ? name.substring(0, 15) + '...' : name;
    });
    
    // Extrae valores de movimientos y nombres completos
    const data = mostMovedProducts.map(product => product.movement_count); // Conteo de movimientos
    const fullNames = mostMovedProducts.map(product => product.product_name); // Nombres completos para tooltips
    
    // CREACIÓN DEL GRÁFICO
    new Chart(ctx.getContext('2d'), {
        // CONFIGURACIÓN BÁSICA
        type: 'bar',  // Tipo de gráfico: barras verticales
        
        // DATOS DEL GRÁFICO
        data: {
            labels: labels,  // Etiquetas truncadas para eje X
            datasets: [{
                label: 'Número de Movimientos',  // Título de la serie
                data: data,                     // Valores de movimientos
                
                // Paleta de colores variada para barras
                backgroundColor: [
                    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
                    '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF6384'
                ],
                borderWidth: 1,        // Grosor del borde de las barras
                borderColor: '#fff'    // Color del borde de las barras
            }]
        },
        
        // OPCIONES DE CONFIGURACIÓN
        options: {
            responsive: true,           // Se adapta al tamaño del contenedor
            maintainAspectRatio: false, // Permite ajuste libre de dimensiones
            
            // CONFIGURACIÓN DE PLUGINS
            plugins: {
                // Oculta la leyenda (redundante en este caso)
                legend: {
                    display: false
                },
                
                // Configuración de tooltips avanzados
                tooltip: {
                    callbacks: {
                        // Muestra nombre completo del producto como título
                        title: function(context) {
                            return fullNames[context[0].dataIndex];
                        },
                        // Muestra conteo de movimientos como etiqueta
                        label: function(context) {
                            return 'Movimientos: ' + context.parsed.y;
                        }
                    }
                }
            },
            
            // CONFIGURACIÓN DE EJES
            scales: {
                // Eje X (horizontal - productos)
                x: {
                    display: true,       // Muestra el eje
                    title: {
                        display: true,   // Muestra título del eje
                        text: 'Productos' // Etiqueta del eje
                    }
                },
                
                // Eje Y (vertical - cantidad de movimientos)
                y: {
                    display: true,       // Muestra el eje
                    title: {
                        display: true,   // Muestra título del eje
                        text: 'Movimientos' // Etiqueta del eje
                    },
                    beginAtZero: true    // La escala comienza en 0
                }
            }
        }
    });
}
