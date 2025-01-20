import React from 'react'
import { useMagicSearchParams } from '../src/hooks/useMagicSearchParams'
import { paramsUsers } from '../src/constants/defaulParamsPage'

export default function App () {
  /**
   * Inicializa el hook con los parámetros obligatorios y opcionales definidos en paramsUsers.
   * - defaultParams: Establece los parámetros obligatorios por defecto al cargar el componente.
   * - forceParams: Fuerza el valor de page_size a 10, evitando que el usuario lo modifique.
   * - omitParamsByValues: Omite valores como 'all' y 'default' de la URL.
   */
  const { getParams, updateParams, clearParams } = useMagicSearchParams({
    ...paramsUsers,
    defaultParams: paramsUsers.mandatory,
    forceParams: { page_size: 10 },
    omitParamsByValues: ['all', 'default'] // cuando se envíe 'all' o 'default' en la URL, se omitirán
  })

  /**
   * Obtiene los parámetros actuales de la URL, convirtiéndolos a sus tipos originales.
   * - page: número de página actual.
   * - search: término de búsqueda.
   * - order: criterio de ordenamiento.
   * - only_is_active: filtro para mostrar solo usuarios activos.
   */
  const { page, search, order, only_is_active } = getParams({ convert: true })

  /**
   * Maneja el cambio en el campo de búsqueda.
   * - Actualiza el parámetro 'search' y reinicia a la página 1.
   */
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const searchTerm = e.target.value.trim()
    updateParams({ newParams: { search: searchTerm, page: 1 } })
  }

  /**
   * Maneja el cambio en el select de ordenamiento.
   * - Actualiza el parámetro 'order' manteniendo otros parámetros intactos.
   */
  const handleOrderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOrder = e.target.value
    updateParams({ newParams: { order: selectedOrder } })
  }

  /**
   * Reinicia todos los parámetros a sus valores por defecto.
   */
  const handleClear = () => {
    clearParams()
  }

  return (
    <div className='min-h-screen bg-gray-100 flex flex-col items-center p-6'>
      <div className='w-full max-w-4xl bg-white shadow-lg rounded-lg p-8 mb-6'>
        <h1 className='text-3xl font-bold mb-6 text-center'>Gestión de Usuarios</h1>

        {/* Sección de Búsqueda */}
        <div className='mb-6'>
          <label htmlFor='search' className='block text-sm font-medium text-gray-700 mb-1'>
            Buscar Usuarios:
          </label>
          <input
            type='text'
            id='search'
            value={search}
            onChange={handleSearchChange}
            placeholder='Ingresa el nombre o apellido...'
            className='w-full border border-gray-300 rounded-md p-3 focus:ring-blue-500 focus:border-blue-500'
          />
        </div>

        {/* Sección de Ordenamiento */}
        <div className='mb-6'>
          <label htmlFor='order' className='block text-sm font-medium text-gray-700 mb-1'>
            Ordenar Por:
          </label>
          <select
            id='order'
            value={order}
            onChange={handleOrderChange}
            className='w-full border border-gray-300 rounded-md p-3 focus:ring-blue-500 focus:border-blue-500'
          >
            <option value='all'>Ninguno(all)</option>
            <option value='asc'>Ascendente(asc)</option>
            <option value='desc'>Descendente(desc)</option>
          </select>
        </div>

        {/* Sección de Parámetros Actuales */}
        <div className='mb-6'>
          <h3 className='text-lg font-semibold mb-3'>Parámetros Actuales:</h3>
          <div className='bg-gray-50 p-5 rounded-md shadow-inner'>
            <p><strong>Página:</strong> {page}</p>
            <p><strong>Tamaño de Página:</strong> {10}</p>
            <p><strong>Solo Activos:</strong> {only_is_active ? 'Sí' : 'No'}</p>
            <p><strong>Orden:</strong> {order || 'Ninguno'}</p>
            <p><strong>Búsqueda:</strong> {search || 'Ninguno'}</p>
          </div>
        </div>

        {/* Botones de Acción */}
        <div className='flex space-x-4 justify-center'>
          <button
            onClick={() => updateParams({ newParams: { page: page + 1 } })}
            className='bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition duration-200'
          >
            Siguiente Página
          </button>
          <button
            onClick={handleClear}
            className='bg-red-600 text-white px-6 py-3 rounded-md hover:bg-red-700 transition duration-200'
          >
            Limpiar Filtros
          </button>
        </div>
        <div className='mt-6 bg-gray-50 p-5 rounded-md shadow-inner'>
          <p className='text-sm text-gray-600'>
            Intenta refrescar la página y observa cómo los parámetros se mantienen o se limpian según las acciones realizadas.
          </p>
        </div>
      </div>

      {/* Segunda Sección de Prueba */}
      <div className='w-full max-w-4xl bg-white shadow-lg rounded-lg p-8'>
        <h2 className='text-2xl font-semibold mb-6'>Formulario de Prueba</h2>

        <form className='space-y-6'>
          <div>
            <label htmlFor='testInput' className='block text-sm font-medium text-gray-700 mb-1'>
              Parámetro de Prueba:
            </label>
            <input
              type='text'
              id='testInput'
              placeholder='Ingresa un valor de prueba...'
              className='w-full border border-gray-300 rounded-md p-3 focus:ring-green-500 focus:border-green-500'
            />
          </div>
          <button
            type='submit'
            className='bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 transition duration-200'
          >
            Enviar Prueba
          </button>
        </form>


      </div>
    </div>
  )
}