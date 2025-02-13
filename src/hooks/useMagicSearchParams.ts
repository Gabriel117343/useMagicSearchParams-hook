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

  const appendArrayValues = (
    finallyParams: Record<string, unknown>,
    newParams: Record<string, string | string[] | unknown>
  ): Record<string, unknown> => {
    // Clonamos los params finales
    const updatedParams = { ...finallyParams };
  
    // Obtenemos los keys que son arrays según TOTAL_PARAMS_PAGE
    const arrayKeys = Object.keys(TOTAL_PARAMS_PAGE).filter(
      (key) => Array.isArray(TOTAL_PARAMS_PAGE[key])
    );
    if (arrayKeys.length === 0) return updatedParams;
  
    arrayKeys.forEach((key) => {
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
          currentValues = new URLSearchParams(urlParams.join('')).getAll(key) as Array<string>
          break;
        }
        case 'brackets': {
           // Construye URLSearchParams a partir de los parámetros actuales (para garantizar que no se tomen valores serializados previamente)
            const urlParams = searchParams.getAll(key) as Array<string>
            console.log({BRACKETS: urlParams})
            currentValues = new URLSearchParams(urlParams.join('')).getAll(`${key}[]`) as Array<string>
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
  
      // Si newParams trae un valor para la key (ya sea string o array), hacemos toggle/merge

      if (newParams[key] !== undefined) {
        const incoming = newParams[key];
        let combined: string[];
        if (typeof incoming === 'string') {
          combined = currentValues.includes(incoming)
            ? currentValues.filter((v) => v !== incoming)
            : [...currentValues, incoming];
        } else if (Array.isArray(incoming)) {

          combined = Array.from(new Set([...currentValues, ...incoming]));
        } else {
          combined = currentValues;
        }
  
        // Serializamos utilizando la función auxiliar y removemos el último "&"
        const serialized = transformToArraySerialization({
          serialization: arraySerialization,
          key,
          value: combined,
        }).replace(/&$/, '');
        // Guardamos el resultado en los params actualizados bajo la key original
        updatedParams[key] = serialized;
      }
    });
  
    // Para todas las claves que no son arrays se actualiza normalmente
    Object.keys(newParams).forEach((key) => {
      if (!Array.isArray(TOTAL_PARAMS_PAGE[key])) {
        updatedParams[key] = newParams[key];
      }
    });
  
    return updatedParams;
  };
  type ParamString = `${string}=${string}&`
  type ParamsCsv = `${string}=${string},${string},${string}&`
  type ParamsRepeat = `${string}=${string}&${string}=${string}&${string}=${string}&`
  type ParamsBrackets = `${string}[]=${string}&`

  const transformToArraySerialization = ({serialization = 'csv', key, value}) => {
    console.log({VALUE_RECIBIDO: value})
    switch (serialization) {
      case 'csv':
        // Ejemplo CSV: tags=tag1,tag2,tag3
        return `${value.join(',')}&` as ParamsCsv
      case 'repeat':
        // Ejemplo Repeat: tags=tag1&tags=tag2&tags=tag3
        return value.map(item => `${key}=${item}&`).join('') as ParamsRepeat
      case 'brackets':
        // Ejemplo Brackets: tags[]=tag1&tags[]=tag2&tags[]=tag3
        return value.map(item => `${key}[]=${item}&`).join('') as ParamsBrackets
      default:
        return `${value.join(',')}&`;
    }
  }
 
  const transformParamsToString = (params: Record<string, unknown>) => {
    
    return Object.entries(params).reduce((acc, [key, value]) => {

      let newParam: string = ''
      if (Array.isArray(TOTAL_PARAMS_PAGE[key]) ) {
        const arrayValue = value as unknown[] // o, si se sabe que es string[], usar: as string[]

        newParam = transformToArraySerialization({serialization: arraySerialization, key, value: arrayValue})
       
      } else {
         newParam = `${key}=${value}&` as ParamString
    
      }
     
      return acc.concat(newParam)
    }, '').slice(0, -1)
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

      const defaultParamsString  = transformParamsToString(defaultParams)
      const paramsUrl = getParams()
      const paramsUrlString = transformParamsToString(paramsUrl)
      const forceParamsString = transformParamsToString(forceParams)

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
    } else if (Array.isArray(TOTAL_PARAMS_PAGE[key])) { // en caso se pase un array como parámetro, esta tecnica se representa como un string separado por comas ej: /?parametro=valor1,valor2,valor3
      return searchParams.getAll(key)
     
    }
    // Nota: no se convierten las fechas ya qué es mejor manejarlas directamente en el componente que las recibe
    return value
  }
    /**
   * Obtiene los parámetros actuales desde la URL y los convierte a su tipo original si se desea
   * @param convert - Si true, convierte de string hacia el tipo inferido (number, boolean, ...)
   */
    const getParams = ({ convert = true } = {}): MergeParams<M, O> => {
      // se extraen todos los parametros de la URL y se convierten en un objeto
      const paramsUrl = Object.fromEntries(searchParams.entries())
  
      const params = Object.keys(paramsUrl).reduce((acc, key) => {
        if (Object.hasOwn(TOTAL_PARAMS_PAGE, key)) {
          acc[key] = convert
            ? convertOriginalType(paramsUrl[key], key)
            : paramsUrl[key]
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
    const newParamsWithoutArray = Object.keys(newParams).filter((key) => !Array.isArray(TOTAL_PARAMS_PAGE[key]))
    const result = Object.assign({
      ...params,
      ...newParamsWithoutArray,
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
    const totalParametros = getParams({ convert: false })
    const paramsUrlFound = Object.keys(totalParametros).reduce(
      (acc, key) => {
        if (Object.hasOwn(mandatory, key)) {
          acc[key] = totalParametros[key]
        }
        return acc
      },
      {}
    )
    return paramsUrlFound
  }

  const clearParams = ({ keepMandatoryParams = true } = {}): void => {
    // por defecto no se limpian los parámetros obligatorios de la paginación ya que se perdería la paginación actual
    const paramsTransformed = transformParamsToString({
      ...mandatory,
       // en caso se encuentren parametros en la URL reemplazarán los parámetros mandatorios por defecto
       ...(keepMandatoryParams && {
        ...mandatoryParameters()
      }),
      ...forceParams // los parámetros forzados siempre se enviarán y mantendrán su valor
    })
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
    const paramsSorted = new URLSearchParams(sortParameters(convertedArrayValues))

    setSearchParams(paramsSorted)

  }
  return {
    searchParams,
    updateParams,
    clearParams,
    getParams
  }
}
