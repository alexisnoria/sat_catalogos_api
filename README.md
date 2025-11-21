# SAT Catalogos API

Este proyecto es una API construida con Node.js y Express que automatiza la descarga, conversión y distribución de los catálogos del SAT (Servicio de Administración Tributaria) para la facturación electrónica (CFDI 4.0).

## 🚀 Propósito

El objetivo principal es solucionar la problemática de mantener actualizados los catálogos del SAT en los sistemas de facturación. En lugar de descargar y procesar manualmente los archivos de Excel publicados por el SAT, este sistema:

1.  **Descarga automáticamente** el archivo más reciente desde el portal del SAT.
2.  **Convierte** las hojas de cálculo a formato JSON.
3.  **Expone** la información a través de una API REST fácil de consumir.

## 🛠 Funcionalidades

-   **Automatización**: Un cron job se ejecuta diariamente a las 00:00 (hora CDMX) para buscar actualizaciones en el sitio del SAT.
-   **Conversión**: Transforma el archivo `catCFDI_V_4_*.xls` en múltiples archivos JSON, uno por cada catálogo (hoja del Excel).
-   **API REST**: Endpoints para consultar la información procesada.

## 📦 Instalación y Uso

1.  Instalar dependencias:
    ```bash
    npm install
    ```

2.  Iniciar el servidor:
    ```bash
    node index.js
    ```
    El servidor iniciará en el puerto 3000 y activará el planificador de tareas.

## 🔌 Endpoints

### `GET /`
Verifica que la API esté funcionando.

### `GET /formas_pago`
Devuelve el catálogo de "Formas de Pago" más reciente disponible en el sistema.

## 📂 Estructura del Proyecto

-   `index.js`: Punto de entrada de la API.
-   `conversion.js`: Lógica de descarga y conversión de Excel a JSON.
-   `input/`: Almacena los archivos `.xls` descargados del SAT.
-   `output/`: Almacena los archivos `.json` generados, organizados por fecha.
