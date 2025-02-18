import { useState, useMemo, useEffect } from 'react'

type Theme = 'light' | 'dark'

export const useHandleTheme = () => {

  const defaulValue = useMemo(() => {
    // Intenta obtener el tema del local storage
    const storedTheme = localStorage.getItem('theme') as Theme | null
    
    if (storedTheme === 'dark' || storedTheme === 'light') return storedTheme

    // Si no hay un tema almacenado, se extrae  una posible configuración de tema del sistema
    const actualSistemTheme = window.matchMedia('prefers-color-scheme: dark').matches ? 'dark' : 'light'
    return actualSistemTheme

  }, [])
  const [theme, setTheme] = useState<Theme>(defaulValue)

  useEffect(() => {
    if (theme === 'dark') {
      document.querySelector('html').classList.add('dark')

    } else {
      document.querySelector('html').classList.remove('dark')
    }
    localStorage.setItem('theme', theme)
  }, [theme])
  const handleChangeTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }

  return { theme, onChangeTheme: handleChangeTheme }
}
