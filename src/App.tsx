import React, { useEffect } from "react";
import { useMagicSearchParams } from "../src/hooks/useMagicSearchParams";
import { paramsUsers } from "../src/constants/defaulParamsPage";
import { DarkSvg } from "./components/ui/svg/DarkSvg";
import { LightSvg } from "./components/ui/svg/LightSvg";
import { useHandleTheme } from "./hooks/useHandleTheme";

import { debounce } from 'es-toolkit'

export default function App() {

  const { theme, onChangeTheme } = useHandleTheme();
  /**
   * Inicializa el hook con los parámetros obligatorios y opcionales definidos en paramsUsers.
   * - defaultParams: Establece los parámetros obligatorios por defecto al cargar el componente.
   * - forceParams: Fuerza el valor de page_size a 10, evitando que el usuario lo modifique.
   * - omitParamsByValues: Omite valores como 'all' y 'default' de la URL.
   */
  const { searchParams, getParams, updateParams, clearParams , getParam, onChange } =
    useMagicSearchParams({
      ...paramsUsers,
      defaultParams: paramsUsers.mandatory,
      forceParams: { page_size: 10 },
      arraySerialization: "csv", // tags=tag1,tag2,tag3
      omitParamsByValues: ["all", "default"], // cuando se envíe 'all' o 'default' en la URL, se omitirán
    });

  /**
   * Obtiene los parámetros actuales de la URL, convirtiéndolos a sus tipos originales.
   * - page: número de página actual.
   * - search: término de búsqueda.
   * - order: criterio de ordenamiento.
   * - only_is_active: filtro para mostrar solo usuarios activos.
   * - tags: array de etiquetas seleccionadas.
   */
  const { page, search, order, only_is_active, tags } = getParams({
    convert: true,
  });
  // En casos donde se requiera realizar una serie de acciones ascronicas o sincronicas al cambiar un parámetro
  useEffect(() => {
    const sub1 = 'search'
    // const sub2 = 'tags'
    function fetchData() {
      // puede ser una llamada a una API o cualquier otra operación asíncrona 
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve('some data')
        }, 2000)
      })

    }
    function showData(data) {
      console.log('showData', data)
    }
    function message() {

      console.log('message')
      alert(`cambio del parámetro ${sub1} detectado`)
    }
 
    onChange(sub1, [
      async () => {
        const data = await fetchData();
        showData(data)
      },
      message
    ])
    // onChange(sub2, [])

  }, [onChange])
 
  
  const { tags: tagsWithoutConvert } = getParams({ convert: true });

  const tagsArray = getParam("tags", { convert: false });
  console.log(tagsArray); // react,node,javascript
  /**
   * Maneja el cambio en el campo de búsqueda.
   * - Actualiza el parámetro 'search' y reinicia a la página 1.
   */
  const TIEMPO_RETRASO = 500;
 
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const searchTerm = e.target.value.trim();
    updateParams({ newParams: { search: searchTerm, page: 1 } });
  }
  const searchDebounce = debounce(handleSearchChange, TIEMPO_RETRASO)


 
  /**
   * Maneja el cambio en el select de ordenamiento.
   * - Actualiza el parámetro 'order' manteniendo otros parámetros intactos.
   */
  const handleOrderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOrder = e.target.value;
    updateParams({ newParams: { order: selectedOrder } });
  };

  /**
   * handleTagToggle
   * PARAMETROS DE ENTRADA:
   * caso 1 (array de tags): [1,2,3,4] resultado: tags=1,2,3,4, en caso se pase otro array de tags con valores repetidos se mantienen los valores únicos
   * Útil para aplicar un conjunto de tags a la vez
   *
   * caso 2 (un solo tag): 1 resultado: tags=1, en caso se pase un tag ya existente se elimina de la lista de tags
   * Útil para un toggle de tags presionando botón por botón
   */
  const availableTags = ["react", "node", "typescript", "javascript"];
  const handleTagToggle = (tag: string[] | string) => {
    const tagsFiltered = [...tags];
    if (tagsFiltered.includes(tag)) {
      const index = tagsFiltered.indexOf(tag);
      tagsFiltered.splice(index, 1);
    } else {
      tagsFiltered.push(tag);
    }
    updateParams({ newParams: { tags: [...tagsFiltered] } });
  };
  console.log({ searchTags: searchParams.getAll("tags") }); // tags=react,node,javascript
  /**
   * Reinicia todos los parámetros a sus valores por defecto.
   */

  const handleClear = () => {
    // Los valores de los parámetros mandatorios que fuerón modificados se mantienen, caso contrario se reestablecen a los valores por defecto
    clearParams({ keepMandatoryParams: false });
  };

  const converStringBoolean = (value: string | boolean) => {
    // Dado que desde la url se obtiene un string, se convierte a booleano (asegurara el cambio caso se haya elegio en getParams convert: false)
    if (typeof value === "boolean") return !value;
    if (value === "true") {
      return true;
    } else if (value === "false") {
      return false;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-6  bg-gradient-to-r dark:from-blue-700 dark:via-blue-800 dark:to-blue-900 dark:text-white ">
       <LightSvg width={24} height={24} />
      <div className="absolute top-0 right-0 p-4">
        <button
          className="p-4 bg-slate-200 rounded-sm hover:bg-slate-300"
          onClick={onChangeTheme}
        >
          {theme === "light" ? (
            <LightSvg width={24} height={24} />
          ) : (
            <DarkSvg width={24} height={24} />
          )}
        </button>
      </div>
      <div className="w-full max-w-4xl bg-white shadow-lg rounded-lg p-8 mb-6 dark:bg-transparent relative overflow-hidden z-50">
        {theme === "dark" && (
          <div className="absolute top-0 left-0 right-0 bottom-0 filter blur-2xl hover:blur-3xl bg-black opacity-40 -z-10 "></div>
        )}
        <h1 className="text-3xl font-bold mb-6 text-center">
          Gestión de Usuarios
        </h1>

        {/* Sección de Búsqueda */}
        <div className="mb-6">
          <label
            htmlFor="search"
            className="block text-sm font-medium text-gray-700 mb-1 dark:text-white"
          >
            Búscar Usuarios:
          </label>
          <input
            type="text"
            id="search"
            onChange={searchDebounce}
            placeholder="Ingresa el nombre o apellido..."
            className="w-full border border-gray-300 rounded-md p-3 focus:ring-blue-500 focus:border-blue-500"
            /* Nota: normalmente se utilizará un debounce por lo que este input debería ser no controlado (defaultValue) */
            defaultValue={search}
          />
        </div>

        {/* Sección de Ordenamiento */}
        <div className="mb-6">
          <label
            htmlFor="order"
            className="block text-sm font-medium text-gray-700 mb-1 dark:text-white"
          >
            Ordenar Por:
          </label>
          <select
            id="order"
            value={order}
            onChange={handleOrderChange}
            defaultValue={order}
            className="w-full border border-gray-300 rounded-md p-3 focus:ring-blue-500 focus:border-blue-500 dark:text-white "
          >
            <option value="all" className="dark:bg-sky-950">Ninguno(all)</option>
            <option value="asc" className="dark:bg-sky-950">Ascendente(asc)</option>
            <option value="desc" className="dark:bg-sky-950">Descendente(desc)</option>
          </select>
        </div>

        <div className="mb-6">
          <label
            htmlFor="only_is_active"
            className="flex items-center space-x-2 cursor-pointer"
          >
            <input
              type="checkbox"
              id="only_is_active"
              onChange={() =>
                updateParams({
                  newParams: {
                    only_is_active: converStringBoolean(only_is_active),
                  },
                })
              }
              checked={converStringBoolean(only_is_active)}
              className="text-blue-500 rounded"
            />
            <span className="text-sm text-gray-700 dark:text-white">
              Mostrar solo usuarios activos
            </span>
          </label>
        </div>

        {/* Botones de Tags */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Selecciona Tags:</h3>
          <div className="flex flex-wrap gap-2">
            {availableTags.map((tag) => {
              const isActive = Array.isArray(tags) && tags.includes(tag);
              return (
                <button
                  key={tag}
                  onClick={() => handleTagToggle(tag)}
                  className={`px-4 py-2 rounded-md border ${
                    isActive
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sección de Parámetros Actuales */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Parámetros Actuales:</h3>
          <div className="bg-gray-50 p-5 rounded-md shadow-inner dark:bg-zinc-900">
            <p>
              <strong>Página:</strong> {page}
            </p>
            <p>
              <strong>Tamaño de Página:</strong> {10}
            </p>
            <p>
              <strong>Solo Activos:</strong>{" "}
              {converStringBoolean(only_is_active) ? "Sí" : "No"}
            </p>
            <p>
              <strong>Tags:</strong> {JSON.stringify(tags)}
            </p>
            <hr className="mt-2" />
            <small className="bg-yellow-300 rounded-sm p-0.5 dark:bg-cyan-600">
              Nota: Asi se deberían de enviarse al backend
            </small>
            <p>
              <strong>Tags sin convertir:</strong>{" "}
              {JSON.stringify(tagsWithoutConvert)}
            </p>
            <p>
              <strong>Orden:</strong> {order || "Ninguno"}
            </p>
            <p>
              <strong>Búsqueda:</strong> {search || "Ninguno"}
            </p>
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="flex space-x-4 justify-center">
          <button
            onClick={() => updateParams({ newParams: { page: page + 1 } })}
            className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition duration-200"
          >
            Siguiente Página
          </button>
          <button
            onClick={handleClear}
            className="bg-red-600 text-white px-6 py-3 rounded-md hover:bg-red-700 transition duration-200"
          >
            Limpiar Filtros
          </button>
        </div>
        <div className="mt-6 bg-gray-50 p-5 rounded-md shadow-inner">
          <p className="text-sm text-gray-600">
            Intenta refrescar la página y observa cómo los parámetros se
            mantienen o se limpian según las acciones realizadas.
          </p>
        </div>
      </div>

      {/* Segunda Sección de Prueba */}
      <div className="w-full max-w-4xl bg-white shadow-lg rounded-lg p-8 dark:bg-zinc-800">
        <h2 className="text-2xl font-semibold mb-6">Formulario de Prueba</h2>

        <form className="space-y-6">
          <div>
            <label
              htmlFor="testInput"
              className="block text-sm font-medium text-gray-700 mb-1 dark:text-white"
            >
              Parámetro de Prueba:
            </label>
            <input
              type="text"
              id="testInput"
              placeholder="Ingresa un valor de prueba..."
              className="w-full border border-gray-300 rounded-md p-3 focus:ring-green-500 focus:border-green-500"
            />
          </div>
          <button
            type="submit"
            className="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 transition duration-200"
          >
            Enviar Prueba
          </button>
        </form>
      </div>
    </div>
  );
}
