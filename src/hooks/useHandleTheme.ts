import { useState, useMemo, useEffect } from 'react'

type Theme = 'light' | 'dark'

export const useHandleTheme = () => {

  const defaulValue = useMemo(() => {
    // Se extrae  una posible configuración de tema del sistema
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
  }, [theme])
  const onChangeTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }

  return { theme, onChangeTheme }
}
