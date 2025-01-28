export const paramsUsers = {
  mandatory: {
    page: 1,
    page_size: 10 as const, // Forzar el tamaño de página a 10
    only_is_active: false
  },
  optional: {
    order: '',
    search: ''

  }
}