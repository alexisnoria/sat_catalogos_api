import pandas as pd
import os
import requests
from datetime import datetime, timedelta

def download_catalog_file():
    """
    Descarga el archivo de catálogos CFDI más reciente desde el sitio del SAT.
    Retorna el nombre del archivo descargado.
    """
    # URL base del SAT para los catálogos
    base_url = "http://omawww.sat.gob.mx/tramitesyservicios/Paginas/documentos/"
    
    # Configurar fecha actual en CDMX (UTC-6)
    # Mexico City no tiene horario de verano, siempre es UTC-6
    utc_now = datetime.utcnow()
    cdmx_now = utc_now - timedelta(hours=6)
    
    # Crear directorio input si no existe
    input_dir = "input"
    if not os.path.exists(input_dir):
        os.makedirs(input_dir)
        print(f"Directorio creado: {input_dir}")

    # El usuario solicita "dia vencido", así que empezamos buscando desde ayer
    start_date = cdmx_now - timedelta(days=1)
    
    print(f"Buscando catálogos a partir de fecha (CDMX - 1 día): {start_date.strftime('%Y-%m-%d')}")
    
    # Intentar buscar hacia atrás desde la fecha de inicio (hasta 30 días)
    for days_back in range(0, 31):
        current_search_date = start_date - timedelta(days=days_back)
        date_str = current_search_date.strftime('%Y%m%d')
        filename = f"catCFDI_V_4_{date_str}.xls"
        file_path = os.path.join(input_dir, filename)
        url = base_url + filename
        
        # Verificar si ya lo tenemos descargado
        if os.path.exists(file_path):
            print(f"Archivo ya existe localmente: {file_path}")
            return file_path

        print(f"Intentando descargar: {url}")
        
        try:
            response = requests.get(url, timeout=30)
            response.raise_for_status()
            
            # Guardar el archivo en la carpeta input
            with open(file_path, 'wb') as f:
                f.write(response.content)
            
            print(f"Archivo descargado exitosamente: {file_path}")
            return file_path
            
        except requests.exceptions.RequestException:
            continue
            
    raise Exception("No se pudo descargar el archivo de catálogos del SAT. Verifica la conexión o la disponibilidad del sitio.")

def clean_column_name(col_name):
    import unicodedata
    col_name = col_name.strip().lower().replace(" ", "_")
    col_name = ''.join((c for c in unicodedata.normalize('NFD', col_name) if unicodedata.category(c) != 'Mn'))
    return col_name

def main():
    # Descargar el archivo de catálogos más reciente del SAT
    catalog_filename = download_catalog_file()
    
    #conocer numero de hojas
    xls = pd.ExcelFile(catalog_filename)
    
    for sheet in xls.sheet_names:
        print(f"Procesando hoja: {sheet}")
        
        
        #verificar si ya existe el archivo json
        if os.path.exists(f"{sheet}.json"):
            continue

        #leer todo el archivo
        df = pd.read_excel(catalog_filename, sheet_name=sheet)
        
        try:
            #identificar renglon donde inicia la tabla buscar el renglon con valor igual al nombre de la hoja en la primera columna
            sheet_replaced=sheet.replace("_Parte_1","")
            sheet_replaced=sheet_replaced.replace("_Parte_2","")
            #minusuclas
            sheet_replaced=sheet_replaced.lower()
            start_row = df[df.iloc[:,0].str.lower() == sheet_replaced].index[0]+1
        except IndexError:
            print(f"No se encontro la tabla para la hoja: {sheet}, se omite la conversion.")
            continue
        
        if "Parte_1" in sheet or "Parte_2" in sheet:
            
            #leer las primeras 6 columnas 
            
            
            df = pd.read_excel(catalog_filename, sheet_name=sheet, header=start_row, usecols="A:G")
            
            encabezados = df.columns.tolist()
            
            start_row +=1
            

        #leer primer hoja desde el renglon 6 (ignorar las primeras 5 filas)
        df = pd.read_excel(catalog_filename, sheet_name=sheet, header=start_row)

        
        if "Parte_1" in sheet or "Parte_2" in sheet:
            #asignar los encabezados correctos solo a las 7 primeras columnas
            cols = df.columns.tolist()
            cols[:7] = encabezados
            df.columns = cols

       

        #nombra las columnas por espacios en guines bajos y minusculas y quitando acentos o caracteres especiales
        df.columns = [clean_column_name(col) for col in df.columns]
        
    
            
        #convierte los NaN a None
        df = df.where(pd.notnull(df), None)
        

        #guardar en json sin indice
        df.to_json(f"output/{sheet}.json", orient="records", indent=4, force_ascii=False)
        

main()