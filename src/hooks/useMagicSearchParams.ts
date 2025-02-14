import { useSearchParams } from 'react-router-dom'
import { useMemo, useEffect } from 'react'

// HOOK PERSONALIZADO CON TECNICAS AVANZADAS PARA MANEJAR LOS PARÁMETROS DE BÚSQUEDA DE CUALQUIER PAGINACIÓN

type CommonParams = {
  page?: number
  page_size?: number
}
/**
 * Mapea todas las propiedades de M (mandatory) como requeridas
 * y todas las de O (optional) como opcionales.
 */

type MergeParams<M, O> = {
  [K in keyof M]: M[K]
} & {
  [K in keyof O]?: O[K]
}
/**
 * Interfaz del objeto de configuración que recibe el hook
 */
interface UseMagicSearchParamsOptions<
  M extends Record<string, unknown>,
  O extends Record<string, unknown>
> {
  mandatory: M 
  optional?: O
  defaultParams?: Partial<MergeParams<M, O>>
  forceParams?: Partial<MergeParams<M, O> | Record<string, unknown>> // de esta forma se pueden enviar parámetros que se enviarán en la URL sin importar si se envían o no
  arraySerialization?: 'csv' | 'repeat' | 'brackets' // se elije la técnica de serialización de los arrays en la URL
  omitParamsByValues?: Array<'all' | 'default' | 'unknown' | 'none' | 'void '> 
}

/**
 * Hook genérico para manejar parámetros de búsqueda en la URL
 * @param mandatory - Parámetros obligatorios (por ej: page=1, page_size=10, etc.)
 * @param optional - Parámetros opcionales (por ej: order, search, etc.)
 * @param defaultParams - Parámetros por defecto que se enviarán en la URL al iniciar el componente o cuando se limpien los parámetros
 * @param forceParams - Parámetros que se enviarán en la URL sin importar si se envían o no
 * @param omitParamsByValues - Parámetros que se omitirán si tienen un valor específico (por ej: 'all', 'default', etc.)
 */
export const useMagicSearchParams = <
  M extends Record<string, unknown> & CommonParams,
  O extends Record<string, unknown>,
>({
  mandatory = {} as M,
  optional = {} as O,
  defaultParams = {} as MergeParams<M, O>,
  arraySerialization = 'csv',
  forceParams = {} as MergeParams<M, O>,
  omitParamsByValues = [] as Array<'all' | 'default' | 'unknown' | 'none' | 'void '>
}: UseMagicSearchParamsOptions<M, O>)=> {


  const [searchParams, setSearchParams] = useSearchParams() 


  const TOTAL_PARAMS_PAGE: MergeParams<M, O> = useMemo(() => {
    return { ...mandatory, ...optional };
  }, [mandatory, optional]);

  const PARAM_ORDER = useMemo(() => {
    return Array.from(Object.keys(TOTAL_PARAMS_PAGE))
  }, [TOTAL_PARAMS_PAGE])

  // Obtenemos los keys que son arrays según TOTAL_PARAMS_PAGE ya que estos requieren un tratamiento especial en la URL debido al modo de serialización
  const ARRAY_KEYS = useMemo(() => {
    return Object.keys(TOTAL_PARAMS_PAGE).filter(
      (key) => Array.isArray(TOTAL_PARAMS_PAGE[key])
    );
  }, [TOTAL_PARAMS_PAGE])

  const appendArrayValues = (
    finallyParams: Record<string, unknown>,
    newParams: Record<string, string | string[] | unknown>
  ): Record<string, unknown> => {
    // Clonamos los params finales
    const updatedParams = { ...finallyParams };
  

    if (ARRAY_KEYS.length === 0) return updatedParams;
  
    ARRAY_KEYS.forEach((key) => {
      // Usamos los valores actuales directamente desde searchParams (source of truth)
      // Esto evita depender de finallyParams en el cual se han omitido los arrays
      let currentValues = []; 
      switch (arraySerialization) {
        case 'csv': {
          const raw = searchParams.get(key) || '';
          // Para csv se espera "value1,value2,..." (sin prefijo)
          currentValues = raw.split(',')
            .map((v) => v.trim())
            .filter(Boolean) as Array<string>
          break;
        }
        case 'repeat': {
          // Para repeat se obtienen todas las ocurrencias de key
          const urlParams = searchParams.getAll(key) as Array<string>
          currentValues = urlParams.length > 0 ? urlParams : []
          
          console.log({REPEAT: currentValues})
          break;
        }
        case 'brackets': {
           // Construye URLSearchParams a partir de los parámetros actuales (para garantizar que no se tomen valores serializados previamente)
            const urlParams = searchParams.getAll(`${key}[]`) as Array<string>
            currentValues = urlParams.length > 0 ? urlParams : []
            console.log({BRACKETS: urlParams})
        
    
            break;
        }
        default: {
          // Modo por defecto funciona como csv
          const raw = searchParams.get(key) ?? '';
          currentValues = raw.split(',')
            .map((v) => v.trim())
            .filter(Boolean);
          }
        break; 
      }

      // Actualizamos los valores de los arrays con los nuevos
    
      if (newParams[key] !== undefined) {
        const incoming = newParams[key];
        let combined: string[] = []
        if (typeof incoming === 'string') {
          // Si es un string, se hace toggle (agregar/eliminar)
      
          combined = currentValues.includes(incoming)
            ? currentValues.filter((v) => v !== incoming)
            : [...currentValues, incoming];
          console.log({currentValues})
            console.log({incoming})
          console.log({CONBINED_STRING: combined})
        } else if (Array.isArray(incoming)) {
          // si se pasa un array los valores repetidos se fusionan en un solo valor
          combined = Array.from(new Set([ ...incoming]));
          console.log({incoming})
          console.log({combined})
        } else {
       
          combined = currentValues;
        }

        updatedParams[key] = combined

      }
    });
    console.log({updatedParams})
    return updatedParams
  };

  const transformParamsToURLSearch = (params: Record<string, unknown>): URLSearchParams => {
    console.log({PARAMS_RECIBIDOS_TRANSFORM: params})

    const newParam: URLSearchParams = new URLSearchParams()

    const paramsKeys = Object.keys(params)

    for (const key of paramsKeys) {
      if (Array.isArray(TOTAL_PARAMS_PAGE[key])) {
        const arrayValue = params[key] as unknown[]
        console.log({arrayValue})
        switch (arraySerialization) {
          case 'csv': {
            const csvValue = arrayValue.join(',')
            newParam.set(key, csvValue) // set asegura que se reemplace el valor anterior
            break
          } case 'repeat': {
      
            for (const item of arrayValue) {
              console.log({item})
              // append agrega un nuevo valor a la clave, en lugar de reemplazarlo
              newParam.append(key, item as string)
   
            }
            break
          } case 'brackets': {
            for (const item of arrayValue) {
              newParam.append(`${key}[]`, item as string)
            }
            break
          } default: {
            // Modo por defecto funciona como csv
            const csvValue = arrayValue.join(',')
            newParam.set(key, csvValue)
          }
        }
      } else {
        newParam.set(key, params[key] as string)
      }
    }
    console.log({FINAL: newParam.toString()})
    return newParam
  }
  const hasForcedParamsValues = ({ paramsForced, compareParams }) => {

    // Itera sobre los parámetros forzados y verifica que existan en la URL y coincidan sus valores
    const allParamsMatch = Object.entries(paramsForced).every(
      ([key, value]) => compareParams[key] === value
    );

    return allParamsMatch;
  };
  
  useEffect(() => {

    const keysDefaultParams: string[] = Object.keys(defaultParams)
    const keysForceParams: string[] = Object.keys(forceParams)
    if(keysDefaultParams.length === 0 && keysForceParams.length === 0) return
  

    function handleStartingParams() {

      const defaultParamsString  = transformParamsToURLSearch(defaultParams).toString()
      const paramsUrl = getParams()
      const paramsUrlString = transformParamsToURLSearch(paramsUrl).toString()
      const forceParamsString = transformParamsToURLSearch(forceParams).toString()

      console.log({defaultParamsString})

      const isForcedParams: boolean = hasForcedParamsValues({ paramsForced: forceParams, compareParams: paramsUrl })

      if (!isForcedParams) {

        // En este caso los parámetros forzados tienen prioridad sobre los parámetros por defecto y los parámetros de la URL actual (que pudierón ser modificados por el usuario ej: page_size=1000)

        updateParams({ newParams: {
          ...defaultParams,
          ...forceParams
        }})
        return
      }
      // De esta forma se validará que los parámetros forzados claves y valores estén en la URL actual 
      const isIncludesForcedParams = hasForcedParamsValues({ paramsForced: forceParamsString, compareParams: defaultParams })

      if (keysDefaultParams.length > 0 && isIncludesForcedParams) {
        if (defaultParamsString === paramsUrlString) return // los parámetros son los mismos, no se actualizan
        updateParams({ newParams: defaultParams })
      }

    }
    handleStartingParams()

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /**
   * Convierte un valor de string a su tipo original (number, boolean, array) según TOTAL_PARAMS_PAGE
   * @param value - Cadena obtenida de la URL
   * @param key - Clave del parámetro
   */
  const convertOriginalType = (value: string, key: string) => {
    // dado que los parametros de una url se reciben como string, se convierten a su tipo original
    if (typeof TOTAL_PARAMS_PAGE[key] === 'number') {
      return parseInt(value)
    } else if (typeof TOTAL_PARAMS_PAGE[key] === 'boolean') {
      return value === 'true'
    } else if (Array.isArray(TOTAL_PARAMS_PAGE[key])) {
      // El resultado será un array valido representado en la URL ej: tags=tag1,tag2,tag3 a ['tag1', 'tag2', 'tag3'], útil para conbinar los valores de los arrays con los nuevos
 
      if (arraySerialization === 'csv') {
        return searchParams.getAll(key).join('').split(',')
      } else if (arraySerialization === 'repeat') {
    
        console.log({SEARCH_PARAMS: searchParams.getAll(key)})
        return searchParams.getAll(key)
      } else if (arraySerialization === 'brackets') {
        return searchParams.getAll(`${key}[]`)
      }
     
     
    }
    // Nota: no se convierten las fechas ya qué es mejor manejarlas directamente en el componente que las recibe
    return value
  }
  
    /**
   * Obtiene los parámetros actuales desde la URL y los convierte a su tipo original si se desea
   * @param convert - Si true, convierte de string hacia el tipo inferido (number, boolean, ...)
   */
    const getStringUrl = (key: string, paramsUrl: Record<string, unknown>) => {
      const isKeyArray = Array.isArray(TOTAL_PARAMS_PAGE[key])
      if (isKeyArray) {

        if (arraySerialization === 'brackets') {

          const arrayUrl = searchParams.getAll(`${key}[]`)
          const encodedQueryArray = transformParamsToURLSearch({ [key]: arrayUrl }).toString()
          // de esta forma se decodifica el array de la URL a su forma original ej: tags[]=tag1&tags[]=tag2&tags[]=tag3
          const unencodeQuery = decodeURIComponent(encodedQueryArray)
          return unencodeQuery
        } else if (arraySerialization === 'csv') {
          const arrayValue = searchParams.getAll(key)
          const encodedQueryArray = transformParamsToURLSearch({ [key]: arrayValue }).toString()
          const unencodeQuery = decodeURIComponent(encodedQueryArray)
          return unencodeQuery
        }
        const arrayValue = searchParams.getAll(key)
        const stringResult = transformParamsToURLSearch({ [key]: arrayValue }).toString()
        return stringResult
      } else {
   
        return paramsUrl[key] as string
      }
     }
     const getParamsObj = (searchParams: URLSearchParams): Record<string, string | string[]> => {
      const paramsObj: Record<string, string | string[]> = {};
      for (const [key, value] of searchParams.entries()) {
        if (key.endsWith('[]')) {
          const bareKey = key.replace('[]', '');
          if (paramsObj[bareKey]) {
            (paramsObj[bareKey] as string[]).push(value);
          } else {
            paramsObj[bareKey] = [value];
          }
        } else {
          // Si la key ya existe, se trata de un parámetro repetido
          if (paramsObj[key]) {
            if (Array.isArray(paramsObj[key])) {
              (paramsObj[key] as string[]).push(value);
            } else {
              paramsObj[key] = [paramsObj[key] as string, value];
            }
          } else {
            paramsObj[key] = value;
          }
        }
      }
      return paramsObj;
     }
  
    const getParams = ({ convert = true } = {}): MergeParams<M, O> => {
      // se extraen todos los parametros de la URL y se convierten en un objeto
      const paramsUrl = arraySerialization === 'brackets' ? getParamsObj(searchParams) : Object.fromEntries(searchParams.entries())

      console.log({ PARAMS_URL_GET: paramsUrl })

      const params = Object.keys(paramsUrl).reduce((acc, key) => {
        if (Object.hasOwn(TOTAL_PARAMS_PAGE, key)) {
          const realKey = arraySerialization === 'brackets' ? key.replace('[]', '') : key
          
          acc[realKey] = convert === true
            ? convertOriginalType(paramsUrl[key] as string, key)
            :  getStringUrl(key, paramsUrl)
        }
        return acc
      }, {})
  
      return params as MergeParams<M, O>
    }
  
  type OptionalParamsFiltered = Partial<O>

  const calculateOmittedParameters = (newParams: Record<string, unknown | unknown[]>, keepParams: Record<string, boolean>) => {
    // Se calculan los parametros omitidos, es decir, los parametros que no se han enviado en la petición
    const params = getParams()
    // Nota: será necesario omitir los parámetros que son arrays porque la idea no es reemplazarlos sino agregarlos o eliminar algunos valores
    const newParamsWithoutArray = Object.entries(newParams).filter(([key,]) => !Array.isArray(TOTAL_PARAMS_PAGE[key]))
    const result = Object.assign({
      ...params,
      ...Object.fromEntries(newParamsWithoutArray),
      ...forceParams // los parámetros forzados siempre se enviarán y mantendrán su valor
    })
    const paramsFiltered: OptionalParamsFiltered = Object.keys(result).reduce((acc, key) => {
      // por defecto no se omiten ningún parametros a menos que se especifique en el objeto keepParams
      if (Object.hasOwn(keepParams, key) && keepParams[key] === false) {
        return acc
      // Nota: El array de parámetros omitidos por valores ej: ['all', 'default'] se omiten ya que suele ser un valor por defecto que no se desea enviar
      } else if (!!result[key] !== false && !omitParamsByValues.includes(result[key])) {
        acc[key] = result[key]
      }

      return acc
    }, {})

    return {
      ...mandatory,
      ...paramsFiltered
    } 
  }

  const sortParameters = (paramsFiltered) => {
    // se ordenan los parametros de acuerdo a la estructura para que persista con cada cambio de la URL, ej: localhost:3000/?page=1&page_size=10
    // Nota: Esto mejora visiblemente la experiencia de usuario
    const orderedParams = PARAM_ORDER.reduce((acc, key) => {
      if (Object.hasOwn(paramsFiltered, key)) {
        acc[key] = paramsFiltered[key]
      }

      return acc
    }, {})
    return orderedParams
  }

  const mandatoryParameters = () => {

    // Nota: en caso haya arrays en la url se convierten a su forma original ej: tags=['tag1', 'tag2'] caso contrario se extraen los parametros sin convertir para optimizar el rendimiento
    const isNecessaryConvert: boolean = ARRAY_KEYS.length > 0 ? true : false
    const totalParametros: Record<string, unknown>  = getParams({ convert: isNecessaryConvert })

    const paramsUrlFound: Record<string, boolean> = Object.keys(totalParametros).reduce(
      (acc, key) => {
        if (Object.hasOwn(mandatory, key)) {
          acc[key] = totalParametros[key]
        }
        return acc
      },
      {}
    )
    console.log({paramsUrlFound})
    return paramsUrlFound
  }

  const clearParams = ({ keepMandatoryParams = true } = {}): void => {
    // por defecto no se limpian los parámetros obligatorios de la paginación ya que se perdería la paginación actual

 
    const paramsTransformed = transformParamsToURLSearch(
      {
        ...mandatory,
         // en caso se encuentren parametros en la URL reemplazarán los parámetros mandatorios por defecto
         ...(keepMandatoryParams && {
          ...mandatoryParameters()
        }),
        ...forceParams // los parámetros forzados siempre se enviarán y mantendrán su valor
      }
    )
    setSearchParams(paramsTransformed) 
  }

  // Nota: asi la función limpiara los parametros en vez de seguir si se llamada por ej: actualizarParametros() o actualizarParametros({}) como lo hace un useState (setEstado())
  // transformar las claves a booleanos
  type KeepParamsTransformedValuesBoolean = Partial<Record<keyof typeof TOTAL_PARAMS_PAGE, boolean>>
  type NewParams = Partial<typeof TOTAL_PARAMS_PAGE> 
  type KeepParams = KeepParamsTransformedValuesBoolean
  const updateParams = ({ newParams = {} as NewParams, keepParams = {} as KeepParams } = {}) => {
    // se recibe como parametro un objeto por ej: { filtro: 'nuevoFiltro', categoria: 'nuevaCategoria' }

    if (
      Object.keys(newParams).length === 0 &&
      Object.keys(keepParams).length === 0
    ) {
      clearParams()
      return
    }

    const finallyParamters = calculateOmittedParameters(newParams, keepParams)
    console.log({finallyParamters})
    const convertedArrayValues = appendArrayValues(finallyParamters, newParams)

    const paramsSorted = sortParameters(convertedArrayValues)
    console.log({paramsSorted})


    setSearchParams(transformParamsToURLSearch(paramsSorted))

  }
  return {
    searchParams,
    updateParams,
    clearParams,
    getParams
  }
}
