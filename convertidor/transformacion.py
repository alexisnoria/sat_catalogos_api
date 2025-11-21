import pandas as pd
import os

def clean_column_name(col_name):
    import unicodedata
    col_name = col_name.strip().lower().replace(" ", "_")
    col_name = ''.join((c for c in unicodedata.normalize('NFD', col_name) if unicodedata.category(c) != 'Mn'))
    return col_name

def main():

    #conocer numero de hojas
    xls = pd.ExcelFile("catCFDI_V_4_20251110.xls")
    
    for sheet in xls.sheet_names:
        print(f"Procesando hoja: {sheet}")
        
        
        #verificar si ya existe el archivo json
        if os.path.exists(f"{sheet}.json"):
            continue

        #leer todo el archivo
        df = pd.read_excel("catCFDI_V_4_20251110.xls", sheet_name=sheet)
        
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
            
            
            df = pd.read_excel("catCFDI_V_4_20251110.xls", sheet_name=sheet, header=start_row, usecols="A:G")
            
            encabezados = df.columns.tolist()
            
            start_row +=1
            

        #leer primer hoja desde el renglon 6 (ignorar las primeras 5 filas)
        df = pd.read_excel("catCFDI_V_4_20251110.xls", sheet_name=sheet, header=start_row)

        
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
        df.to_json(f"{sheet}.json", orient="records", indent=4, force_ascii=False)
        

main()