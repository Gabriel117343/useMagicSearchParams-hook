import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import {
  MemoryRouter as TestMemoryRouter,
  Route,
  Routes
} from 'react-router-dom'
import { useMagicSearchParams } from '../hooks/useMagicSearchParams'
import { paramsUsers } from '../constants/defaulParamsPage'

// Componente Wrapper para proporcionar el contexto del Router
function Wrapper({ children, initialEntries = ['/'] }: { children: React.ReactNode, initialEntries?: string[] }) {
  return (
    <TestMemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/" element={children} />
      </Routes>
    </TestMemoryRouter>
  )
}

describe('useMagicSearchParams Hook', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('Debe retornar los parámetros obligatorios al inicio (getParams)', () => {
    const { result } = renderHook(
      () =>
        useMagicSearchParams({
          ...paramsUsers,
          forceParams: { page_size: 10 },
        }),
      { wrapper: Wrapper }
    )

    const { page, page_size } = result.current.getParams({ convert: true })
    expect(page).toBe(1)
    expect(page_size).toBe(10)
  })

  it('Debe actualizar parámetros (updateParams) y reflejarlos en getParams', () => {
    const { result } = renderHook(
      () =>
        useMagicSearchParams({
          ...paramsUsers,
          defaultParams: paramsUsers.mandatory,
        }),
      { wrapper: Wrapper }
    )

    act(() => {
      result.current.updateParams({ newParams: { page: 2, search: 'test' } })
    })

    const { page, search } = result.current.getParams({ convert: true })
    expect(page).toBe(2)
    expect(search).toBe('test')
  })

  it('Debe forzar un parámetro (forceParams) y no permitir su cambio manual', () => {
    const { result } = renderHook(
      () =>
        useMagicSearchParams({
          ...paramsUsers,
          forceParams: { page_size: 5 },
        }),
      { wrapper: Wrapper }
    )

    // Intentar cambiar page_size manualmente
    act(() => {
      result.current.updateParams({ newParams: { page_size: 99 } })
    })

    const { page_size } = result.current.getParams({ convert: true })
    // Debe prevalecer 5
    expect(page_size).toBe(5)
  })

  it('Debe omitir valores indicados (omitParamsByValues)', () => {
    const { result } = renderHook(
      () =>
        useMagicSearchParams({
          ...paramsUsers,
          omitParamsByValues: ['all', 'default'],
        }),
      { wrapper: Wrapper }
    )

    act(() => {
      result.current.updateParams({ newParams: { order: 'all', page: 3 } })
    })

    const { page, order } = result.current.getParams({ convert: true })
    // 'all' se omite
    expect(page).toBe(3)
    expect(order).toBe(undefined) // 'all' se omite por lo que no debe existir
  })

  it('clearParams debe reiniciar a valores por defecto (manteniendo obligatorios)', () => {
    const { result } = renderHook(
      () =>
        useMagicSearchParams({
          ...paramsUsers,
          defaultParams: paramsUsers.mandatory,
        }),
      { wrapper: Wrapper }
    )

    act(() => {
      result.current.updateParams({ newParams: { page: 8, order: 'asc' } })
    })

    const { page, order } = result.current.getParams({ convert: true })
    expect(page).toBe(8)
    expect(order).toBe('asc')

    act(() => {
      result.current.clearParams()
    })

    const newParams = result.current.getParams({ convert: true })
    expect(newParams.page).toBe(8)  // mandatory de paramsUsers
    expect(newParams.order).toBe(undefined) // optional ya no debe existir en la URL
  })
  it('Debe preservar parámetros existentes no actualizados al actualizar otros parámetros', () => {
    const { result } = renderHook(
      () =>
        useMagicSearchParams({
          ...paramsUsers,
          defaultParams: paramsUsers.mandatory,
        }),
      { wrapper: Wrapper }
    )

    act(() => {
      result.current.updateParams({ newParams: { search: 'newSearch' } })
    })

    const { page, page_size, search, order } = result.current.getParams({ convert: true })
    expect(page).toBe(1) // default mandatory
    expect(page_size).toBe(10) // default mandatory
    expect(search).toBe('newSearch') // updated
    expect(order).toBe(undefined) // unchanged optional
  })
  it('Debe mantener los parámetros forzados después de múltiples actualizaciones', () => {
    const { result } = renderHook(
      () =>
        useMagicSearchParams({
          ...paramsUsers,
          forceParams: { page_size: 10 },
          omitParamsByValues: ['all', 'default'],
        }),
      { wrapper: Wrapper }
    )

    act(() => {
      result.current.updateParams({ newParams: { page: 2, search: 'test' } })
    })

    const { page, page_size, search } = result.current.getParams({ convert: true })
    expect(page).toBe(2)
    expect(page_size).toBe(10) // forced
    expect(search).toBe('test')

    act(() => {
      result.current.updateParams({ newParams: { page: 3, search: 'anotherTest' } })
    })

    const updatedParams = result.current.getParams({ convert: true })
    expect(updatedParams.page).toBe(3)
    expect(updatedParams.page_size).toBe(10) // still forced
    expect(updatedParams.search).toBe('anotherTest')
  })

  // Sección de pruebas para la serialización de arrays
  
  it('Debe agregar y eliminar un tag individual en modo repeat', () => {
    const { result } = renderHook(
      () =>
        useMagicSearchParams({
          ...paramsUsers,
          defaultParams: paramsUsers.mandatory,
          arraySerialization: 'repeat',
        }),
      { wrapper: Wrapper }
    );
  
    // Se espera que los tags iniciales sean únicos: ['uno', 'dos', 'tres']
    const initialParams = result.current.getParams({ convert: true });
    expect(initialParams.tags).toEqual(['uno', 'dos', 'tres']);
  
    // Agrega un tag 'nuevo'
    act(() => {
      result.current.updateParams({ newParams: { tags: 'nuevo' } });
    });
    let updatedParams = result.current.getParams({ convert: true });
    expect(updatedParams.tags).toEqual(['uno', 'dos', 'tres', 'nuevo']);
  
    // Al volver a enviar el mismo tag 'nuevo', éste se elimina (toggle)
    act(() => {
      result.current.updateParams({ newParams: { tags: 'nuevo' } });
    });
    updatedParams = result.current.getParams({ convert: true });
    expect(updatedParams.tags).toEqual(['uno', 'dos', 'tres']);
  });
  
  it('Debe combinar arrays de tags sin duplicados en modo repeat', () => {
    const { result } = renderHook(
      () =>
        useMagicSearchParams({
          ...paramsUsers,
          defaultParams: paramsUsers.mandatory,
          arraySerialization: 'repeat',
        }),
      { wrapper: Wrapper }
    );
  
    // Verifica el estado inicial de los tags
    const initialParams = result.current.getParams({ convert: true });
    expect(initialParams.tags).toEqual(['uno', 'dos', 'tres']);
  
    // Actualiza enviando un array que incluye valores ya existentes y nuevos
    act(() => {
      result.current.updateParams({ newParams: { tags: ['react', 'dos', 'nuevo'] } });
    });
    const updatedParams = result.current.getParams({ convert: true });
    // Se espera la unión de ambos arrays sin duplicados
    expect(updatedParams.tags).toEqual(['uno', 'dos', 'tres', 'react', 'nuevo']);
  });
})