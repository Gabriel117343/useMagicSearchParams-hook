# Documentación de `useMagicSearchParams` 🪄

## Índice 📑

1. [Introducción General](#introducción-general)  
   1.1 [Propósito del Hook](#propósito-del-hook)  
   1.2 [Contexto de Implementación](#contexto-de-implementación)
2. [Tipos de Parámetros que Acepta](#tipos-de-parámetros-que-acepta)  
   2.1 [mandatory (Obligatorios)](#mandatory-obligatorios)  
   2.2 [optional (Opcionales)](#optional-opcionales)  
   2.3 [defaultParams](#defaultparams)  
   2.4 [forceParams](#forceparams)  
   2.5 [omitParamsByValues](#omitparamsbyvalues)
   2.6 [arraySerialization](#arraySerialization)
3. [Recomendación de Uso con Archivo de Constantes](#recomendación-de-uso-con-archivo-de-constantes)
4. [Funciones Principales](#funciones-principales)  
   4.1 [getParams](#getparams)  
   4.2 [updateParams](#updateparams)  
   4.3 [clearParams](#clearparams)

5. [Características Clave y Beneficios](#características-clave-y-beneficios)
6. [Ejemplo de Uso & Explicaciones](#ejemplo-de-uso--explicaciones)
7. [Serialización de Arrays en la URL(nuevo)](#serialización-de-arrays-en-la-url)
8. [Buenas Prácticas y Consideraciones](#buenas-prácticas-y-consideraciones) ✅
9. [Pruebas Unitarias con Vitest](#Ejecución-de-pruebas)
10. [Conclusión](#conclusión) 🎯

---

# Introducción General

<img src="https://github.com/user-attachments/assets/1f437570-6f30-4c10-b27d-b876f5c557bd" alt="Captura de pantalla" width="800px" />

## Propósito del Hook 🎯

El **hook `useMagicSearchParams`** habilita un manejo **avanzado** y **centralizado** de parámetros en la URL.  
Permite definir y unificar lógica para filtrar, paginar o realizar cualquier otra operación que dependa de parámetros en la cadena de consulta (ej. `?page=1&page_size=10`).

**Antes (sin autocompletado ni tipado)**
En esta sección se ilustra rápidamente cómo cambiaba el manejo de parámetros antes de usar el hook y cómo se simplifica con `useMagicSearchParams`.

<details>
<summary>Antes (manejo manual de URLs)❌</summary>

```jsx
// filepath: /example/BeforeHook.tsx

export const BeforeHookExample = () => {
  const [searchParams, setSearchParams] = useSearchParams()

  // Extraer valores manualmente (sin tipado ni validación)
  const page = parseInt(searchParams.get('page') || '1', 10)
  const pageSize = parseInt(searchParams.get('page_size') || '10', 10)
  const search = searchParams.get('search') || ''

  const handleChangePage = (newPage: number) => {
    searchParams.set('page', newPage.toString())
    setSearchParams(searchParams)
  }

  return (
    <div>
      <p>Página: {page}</p>
      <p>page_size: {pageSize}</p>
      <p>search: {search}</p>
      {/* Botón para cambiar de página */}
      <button onClick={() => handleChangePage(page + 1)}>Siguiente página</button>
    </div>
  )
}
```

</details> 
<details> <summary>Después (con autocompletado y seguridad)✅</summary>

```jsx
// filepath: /example/AfterHook.tsx
import { useMagicSearchParams } from "@/hooks/useMagicSearchParams";
import { paramsUsers } from "@/constants/DefaultParamsPage";

export const AfterHookExample = () => {
  // contexto de Api externa...
  const { searchParams, getParams, updateParams } = useMagicSearchParams({
    ...paramsUsers,
    forceParams: { page_size: paramsUsers.mandatory.page_size }, // se limita a 10
    omitParamsByValues: ["all", "default"],
  });

  useEffect(() => {
    const paramsUser = getParams();

    async function loadUsers() {
      toast.loading("Cargando...", { id: "loading" });

      console.log({ paramsUser });
      const { success, message } = await getUsersContext(paramsUser);
      if (success) {
        toast.success(message ?? "Usuarios obtenidos", { id: "loading" });
        setLoading(false);
      } else {
        toast.error(message ?? "Error inesperado al obtener los usuarios", {
          id: "loading",
        });
      }
    }
    loadUsers();
  }, [searchParams]);

  // getParams devuelve datos convertidos y tipados con autocompletado
  const { page, page_size, search } = getParams({ convert: true });

  const handleNextPage = () => {
    const nextPage = { page: (page ?? 1) + 1 };
    updateParams({ newParams: nextpage }); // por defecto se mantienen los otros parámetros de consulta
  };

  return (
    <div>
      {/* Nota: normalmente el input será de tipo "no controlado" debido a que normalmente se utilizar una técnica de "debounce" para demorar la actualización */}
      <input
        defaultValue={search}
        placeholder="Buscar por..."
        onChange={handleSearchChange}
      />
      <p>Página actual: {page}</p>
      <p>Tamaño de página: {page_size}</p>
      <p>Búsqueda: {search}</p>
      <button onClick={handleNextPage}>Siguiente página</button>
    </div>
  );
};
```

</details>

#### Información Adicional 📋

1. **_Tipado Estricto_**

- Al definir “mandatory” y “optional” desde un archivo de constantes, TypeScript infiere las claves disponibles en la URL.

2. **_Control en la URL_**

- “forceParams” refuerza valores fijos (evitando sobrecargas innecesarias de la API).
  “omitParamsByValues” limpia parámetros como “all” o “default” que no aportan información real.

3. **_Reutilización en Distintas Vistas_**

- Cada vista puede tener su propio `mandatory` y `optional`.
  Se evita duplicar lógica de extracción y validación de parámetros.

4. **_Orden Uniforme en la URL_**

- **sortParameters** garantiza un orden predecible (primero “page”, luego “page_size”, etc.).

### Contexto de su Implementación

1. **Evita múltiples fuentes de la verdad**: Al separar la lógica en un hook único, no se repite código en cada archivo.
2. **Asegura un Estándar Común** Todos los parámetros (obligatorios u opcionales) se definen en un mismo lugar
3. **Controlar la URL**: Evita inyecciones de parámetros no deseados y mantiene un orden consistente (ej. `?page=1&page_size=10` en vez de ?`page_size=10&page=1`).

### Tipos de Parámetros Aceptados

1. **Mandatory**:(Obligatorios)

- Ejemplo típico: Paginación (page, page_size)
- Siempre deben existir en la URL para que la vista funcione.

2. **Optional**:(Opcionales)

- Ejemplo: Filtros de búsqueda (search, order).
- No afectan la ruta si no están presentes.

3. **DefaultParams**:(parámetros por defecto)

- Se establecen automáticamente al cargar un componente.
- Útiles para `filtros por defecto` o configuraciones iniciales.
- A diferencia de los parámetros agregados en enlaces ej: `sistema/lista?page=1&page_size=10`, estos se cargan según el componente (página) que se este visitando, asegurando que la página visitada siempre tenga parámetros por defecto, aunque el usuario los elimine, esto asegura que las llamadas a una **API** que útiliza los párametros de la URL devuelva los datos correctos.

4. **ForceParams**:(Parámetros forzados)

- Fuerzan valores que no se pueden sobrescribir (ej: page_size=10).
- Garantizan una máxima seguridad, mientras que mejoran la experiencia del usuario (evitar page_size=1000)

5. **OmitParamsByValues**:(Parámetros omitidos por Valores)

- Lista de valores que, si se detectan, se omiten de la **URL** (ej. 'all', 'default')
- Simplifica URLS, omitiendo parámetros que no aportan información real
- Reserva espacio para otros parámetros de consulta por la limitación de los mismos en la url _Dependiendo del Navegador que se utilize._

6. **arraySerialization**:(Serialización de Arrays)

- Permite Serializar arrays en la **URL** con 3 distintos métodos (csv, repeat, brackets)
- Posibilidad de actualizarlos a través de 2 metodos, toggle (agregar, eliminar) y pasando un array de valores ej tags: ['nuevo1', 'nuevo2']
- Es accesible a través del metodo `getParams` para obtener sus valores de tipo string ej:`tags=uno,dos,tres` o convertido a su tipo original ej: `tags: ['uno', 'dos','tres']`

## Recomendación de uso de un Archivo de Constantes📁

- Definir los parámetros obligatorios y opcionales en un único archivo (ej. defaultParamsPage.ts)
- **Beneficios**:
  - **_Mayor consistencia_**: Todo queda centralizado, lo que significa tener una única fuente de la verdad de los párametros de cada página.
  - **_Tipado seguro_**: Garantiza autocompletado y reduce errores de escritures

> [!NOTE]
> De esta forma Typescript Podrá inferir los tipos de los párametros de consulta y sus valores por defecto a manejar.

```typescript
export const paramsCrimesDashboard = {
  mandatory: {
    days: 7,
  },
  optional: {},
};
export const paramsUsers = {
  mandatory: {
    page: 1,
    page_size: 10 as const,
    only_is_active: false,
  },
  optional: {
    order: "",
    search: "",
  },
};
```

## Funciones Principales ⚙️

### 1. getParams

Obtiene los parámetros tipados y opcionalmente convertidos desde la URL.  
Útil para recuperar “page”, “order”, “search”, etc., sin lidiar con valores nulos o tipos incorrectos.

> [!NOTE]
> Por defecto el hook `useSearchParams` de **react-router-dom** devuelve los parámetros en `string`, haunque los hayamos definido con otro tipo ej: `number`, esto lo soluciona el metodo `getParams` gracias a que guarda una referencia de su tipo original.

<details>
<summary>Ejemplo de uso</summary>

```typescript
// Obteniendo valores convertidos
const { page, search } = getParams({ convert: true });

// Ejemplo: mostrar parámetros en consola
console.log("Página actual:", page); // number
console.log("Búsqueda:", search); // string | undefined
```

</details>

### 2. updateParams

Modifica de forma controlada los parámetros en la URL, respetando valores obligatorios;
puedes reiniciar un valor sin perder el resto (ej. setear `page=1` y mantener `search`).

<details> 
<summary>Ejemplo de uso</summary>

```typescript
// Cambiar de página y conservar orden actual
updateParams({
  newParams: { page: 2 },
  keepParams: { order: true },
});

// Establecer un nuevo filtro y reiniciar la página
updateParams({ newParams: { page: 1, search: "John" } });
```

</details>

### 3. clearParams

Reinicia los parámetros de la URL, manteniendo (o no) los obligatorios.
Permite “limpiar” los filtros y volver al estado inicial.

<details> <summary>Ejemplo de uso</summary>

```typescript
// Limpia todo y conserva obligatorios
clearParams();

// Limpia incluso los obligatorios
clearParams({ keepMandatoryParams: false });
```

</details>

### Ejemplo de Uso & Explicaciones 🖥️💡

En el siguiente ejemplo, se combinan:

**mandatory**: Necesarios para la paginación.
**optional**: Parámetros de búsqueda y orden.
**forceParams**: Parámetros que no deben cambiar (p. ej. “page_size=1”).
**omitParamsByValues**: Se omiten valores como “all” o “default”.

```jsx
// filepath: /c:/.../FilterUsers.tsx
import { useMagicSearchParams } from "@/hooks/UseMagicSearchParams";
import { paramsUsers } from "@constants/DefaultParamsPage";

export const FilterUsers = (props) => {
  const { searchParams, updateParams, clearParams, getParams } =
    useMagicSearchParams({
      ...paramsUsers,
      defaultParams: paramsUsers.mandatory,
      forceParams: { page_size: 1 },
      omitParamsByValues: ["all", "default"],
    });

  // Recuperar parámetros convertidos a sus tipos originales
  const { page, search, order } = getParams({ convert: true });

  // Actualizar: setear página = 1 y cambiar búsqueda
  const handleChangeSearch = (evt) => {
    updateParams({ newParams: { page: 1, search: evt.target.value } });
  };

  // Limpiar todo y conservar mandatorios por defecto
  const handleReset = () => {
    clearParams();
  };

  // ...
};
```

**En este componente:**

**_paramsUsers_** define los objetos “mandatory” y “optional”.
**_forceParams_** evita que “page*size” sea modificado por el usuario.
\*\*\_omitParamsByValues*** descarta valores que no aporten datos reales (“all”, “default”).
**_getParams_** devuelve valores tipados (números, booleanos, strings, etc.).
**_updateParams_** y **_clearParams_\*\* simplifican los flujos de actualización en la URL.

## 7 Serialización de Arrays en la URL 🚀

El hook `useMagicSearchParams` ahora permite gestionar parámetros de tipo array de forma **avanzada** y **flexible**, enviándolos de forma óptima al backend según el formato requerido. Esto se logra mediante la opción `arraySerialization`, que admite tres técnicas:

### Métodos de Serialización 🔄

- **csv**:  
  Serializa el array en una única cadena separada por comas.  
  **Ejemplo:**  
  `tags=tag1,tag2,tag3`  
  _Ideal cuando el backend espera un solo string._

- **repeat**:  
  Envía cada elemento del array como un parámetro separado.  
  **Ejemplo:**  
  `tags=tag1&tags=tag2&tags=tag3`  
  _Perfecto para APIs que manejan múltiples entradas con la misma clave._

- **brackets**:  
  Utiliza la notación con corchetes en la clave para cada elemento.  
  **Ejemplo:**  
  `tags[]=tag1&tags[]=tag2&tags[]=tag3`  
  _Útil para frameworks que esperan este formato (ej. PHP)._

> [!TIP]
> Al extraer los valores de `tags` con `getParams({ convert: true })` obtendrás:
>
> - **String** si no se especifica conversión (ej:csv): `"tags=tag1,tag2,tag3"`
> - **Array** si se convierte: `tags=['tag1', 'tag2', 'tag3']`  
>   _Esto mejora la consistencia y tipado en tu aplicación._

### Ventajas y Beneficios 🌟

- **Flexibilidad de Envío**:  
  Elige el método que mejor se adapte a las necesidades del backend.  
  ✅ _Mayor compatibilidad con distintos sistemas._

- **Normalización Automática**:  
  Las claves que llegan en formato `tags[]` se normalizan a `tags` para facilitar su manejo.  
  ✅ _Más fácil iterar y convertir a tipos originales._

- **Control Total de la URL**:  
  El hook gestiona la reescritura de la URL de forma consistente, reduciendo errores y manteniendo la legibilidad.  
  🔒 _Mejora la seguridad y el control de los parámetros._

### Ejemplos de Uso en Código 👨‍💻

```jsx
import { useMagicSearchParams } from "../src/hooks/useMagicSearchParams";
import { paramsUsers } from "../src/constants/defaulParamsPage";

export default function App() {
  const { searchParams, getParams, updateParams, clearParams } = useMagicSearchParams({
    ...paramsUsers,
    defaultParams: paramsUsers.mandatory,
    arraySerialization: 'repeat', // Puedes cambiar a 'csv' o 'brackets' según prefieras.
    omitParamsByValues: ["all", "default"],
  });

  // Obtener parámetros convertidos (por ejemplo, tags se obtiene como array)
  const { tags, page } = getParams({ convert: true });

 const availableTags = ['react', 'node', 'typescript', 'javascript']

  // Ejemplo: Actualizar el array de tags con toggle
  const handleTagToggle = (newTag: string) => {
    // si ya existe se elimina, sino se agrega
    updateParams({ newParams: { tags: newTag } });
  };
  // pasar un array de tags, útil para agregar múltiples filtros a la vez
  const handleTagToggleArray = (newTags: string[]) => {
    // el hook se encarga de que no existán valores repetidos en el array haciendo
    // merge con los anteriores
    updateParams({ newParams: { tags: [...tags, ..newTags] } });
  };
  return (
    <div>
      <div>
        <h3 className='text-lg font-semibold mb-3'>Selecciona Tags:</h3>
          {availableTags.map(tag => {
            const isActive = Array.isArray(tags) && tags.includes(tag)
            return (
              <button
                key={tag}
                onClick={() => handleTagToggle(tag)}
                className={`px-4 py-2 rounded-md border ${
                  isActive ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
                }`}
              >
                {tag}
              </button>
            )
          })}
      </div>
      <p>Tags actuales: {JSON.stringify(tags)}</p>
      {/* Resto del componente */}
    </div>
  );
}
```

En este ejemplo, al utilizar la serialización **repeat**, la `URL` resultante se verá así:

- **Modo (repeat)**: `?page=1&page_size=10&only_is_active=false&tags=tag1&tags=tag2&tags=tag3`
- **Modo (csv)**: `?page=1&page_size=10&only_is_active=false&tags=tag1,tag2,tag3`
- **Modo (brackets)**: `?page=1&page_size=10&only_is_active=false&tags[]=tag1&tags[]=tag2&tags[]=tag3`

### Esta nueva funcionalidad permite:

- Enviar arrays de forma que se ajusten a las expectativas del backend.
- Gestionar de forma centralizada la conversión y serialización, reduciendo la complejidad en componentes individuales.
- Mantener la URL limpia y consistente, independientemente del método de serialización elegido.
- **Dar control total al desarrollador** sobre cómo transformar o enviar los parámetros, permitiendo operaciones personalizadas en función del backend.

### ¿Por Qué Esta Funcionalidad Es Clave? 🎯

- **Enviar arrays al backend de forma adaptable:**
  Se ajusta a diversos formatos que los servidores pueden esperar.
- **Reducción de complejidad en componentes:**
  Centraliza la lógica de serialización, evitando redundancia en el código.
- **Mejor experiencia para el usuario:**
  Una URL limpia y consistente facilita la depuración y mejora la usabilidad.

## 8 Buenas Prácticas y Consideraciones ✅

1. **Validar parámetros sensibles en backend**: Aunque el hook protege en frontend, el servidor debe imponer límites.
2. **Mantener los tipos actualizados**: A medida que cambian los requisitos, actualizar “mandatory” y “optional” para evitar descalces.
3. **Archivo de constantes por vista**: Permite organizar mejor cada pantalla o sección, manteniendo claridad y orden.

---

## 9 Pruebas Unitarias 🔬

Este proyecto cuenta con pruebas automatizadas para asegurar su robustez y fiabilidad.

### Ejecuta tus pruebas con `Vitest` 🧪

Para validar el funcionamiento de este hook (y de los demás), puedes dirigirte al directorio de tests y ejecutar el siguiente comando en la terminal:

```bash
npm run test ./test/useMagicSearchParams.test.ts
```

> [!WARNING]
> Nota: Asegúrate de tener Vitest configurado en tu proyecto para que estas pruebas se ejecuten correctamente, puedes ver la versión con `npm list`

## 10 Conclusión 🎉

El hook `useMagicSearchParams` aporta:

- **Legibilidad y Mantenibilidad** al centralizar la lógica.
- **Robustez** en la gestión de parámetros, limitando valores inseguros y permitiendo un flujo coherente.

Se recomienda ajustarlo o expandirlo según las necesidades de cada proyecto, añadiendo, por ejemplo, validaciones avanzadas o conversiones adicionales de tipos.

---

<div align="center">
  <img src="https://github.com/user-attachments/assets/acd13a47-dcd3-488c-b0be-69ce466bb106" alt="Captura de pantalla" width="500px" />
</div>
