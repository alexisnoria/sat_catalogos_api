# SAT Catalogos API

Este proyecto es una API construida con Node.js y Express que automatiza la descarga, conversión y distribución de los catálogos del SAT (Servicio de Administración Tributaria) para la facturación electrónica (CFDI 4.0).

## 🚀 Propósito

El objetivo principal es solucionar la problemática de mantener actualizados los catálogos del SAT en los sistemas de facturación. En lugar de descargar y procesar manualmente los archivos de Excel publicados por el SAT, este sistema:

1.  **Descarga automáticamente** el archivo más reciente desde el portal del SAT.
2.  **Convierte** las hojas de cálculo a formato JSON.
3.  **Expone** la información a través de una API REST fácil de consumir.

## 🛠 Funcionalidades

-   **Automatización**: Un cron job se ejecuta diariamente a las 00:00 (hora CDMX) para buscar actualizaciones en el sitio del SAT.
-   **Inicialización Inteligente**: Si no hay datos locales al iniciar, el sistema realiza una descarga y conversión inicial automáticamente.
-   **Conversión**: Transforma el archivo `catCFDI_V_4_*.xls` en múltiples archivos JSON, uno por cada catálogo (hoja del Excel).
-   **API REST Dinámica**: Un único endpoint flexible para consultar cualquier catálogo disponible.

## 📦 Instalación y Uso

1.  Instalar dependencias:
    ```bash
    npm install
    ```

2.  Iniciar el servidor:
    ```bash
    node index.js
    ```
    El servidor iniciará en el puerto 3000. Si es la primera vez que se ejecuta, tomará unos momentos para descargar y procesar los catálogos del SAT.

## 🔌 Endpoints

### `GET /`
Verifica que la API esté funcionando y devuelve un mensaje de estado.

### `GET /:catalogo`
Devuelve el contenido del catálogo especificado en formato JSON. El parámetro `:catalogo` debe coincidir con el nombre de la hoja en el archivo Excel del SAT (generalmente comienzan con `c_`).

**Ejemplos de uso:**

-   Obtener Formas de Pago:
    `GET /c_FormaPago`
    
-   Obtener Monedas:
    `GET /c_Moneda`

-   Obtener Códigos Postales:
    `GET /c_CodigoPostal`

-   Obtener Regímenes Fiscales:
    `GET /c_RegimenFiscal`

## 📂 Estructura del Proyecto

-   `index.js`: Punto de entrada de la API y definición de endpoints.
-   `conversion.js`: Lógica de descarga, programación (cron) y conversión de Excel a JSON.
-   `utils.js`: Funciones de utilidad para la lectura y recuperación de los datos procesados.
-   `input/`: Almacena los archivos `.xls` descargados del SAT.
-   `output/`: Almacena los archivos `.json` generados, organizados por fecha.
