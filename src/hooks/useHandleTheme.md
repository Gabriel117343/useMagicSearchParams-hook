# Documentación del Hook `useHandleTheme`

Este hook es una adaptación especial para el manejo de dark mode en proyectos que utilizan Tailwind CSS v4. Su objetivo es asegurar que siempre se aplique el tema actual, ya sea definido por el usuario o detectado automáticamente a partir de la preferencia del sistema, y separar las responsabilidades en dos atributos distintos en el elemento HTML:

- **`data-theme`**: Representa el tema actualmente aplicado en la interfaz (por ejemplo, "light" o "dark").
- **`origin-theme`**: Indica el origen de la elección del tema, pudiendo ser:
  - `"user-defined"`: El tema fue seleccionado manualmente por el usuario.
  - `"system"`: El tema se determinó en base a la preferencia del sistema (mediante el media query `prefers-color-scheme`).

## ¿Por Qué Este Enfoque?

- **Claridad en la Aplicación de Estilos**:  
  Gracias a que el atributo `data-theme` siempre muestra el tema actual, Tailwind CSS puede aplicar los estilos correspondientes sin confusión. No se superpone la información de origen (como `"system"`) en `data-theme`, lo que podría resultar confuso.

- **Separación de Responsabilidades**:  
  Al almacenar el origen del tema en `origin-theme`, se mantiene una distinción clara:

  - **`data-theme`**: Solo contiene el valor real que afecta la UI (por ejemplo, `data-theme="dark"`).
  - **`origin-theme`**: Informa al desarrollador o para fines de debugging si el tema se estableció por el sistema o fue elegido por el usuario.

- **Persistencia y Adaptabilidad**:  
  El hook primero intenta obtener la preferencia del usuario desde `localStorage`. Si no existe, se basa en la preferencia del sistema mediante `window.matchMedia("(prefers-color-scheme: dark)")`. Además, se suscribe a los cambios del sistema y actualiza el estado dinámicamente (si el usuario no ha definido manualmente un tema).

- **Facilidad de Mantenimiento**:  
  Al centralizar la lógica de gestión de temas en este hook, se garantiza que toda la aplicación se comporte de forma consistente. El desarrollador cuenta con un único punto de control para manejar y actualizar la configuración de dark mode.

## Resumen del Funcionamiento

1. **Inicialización**

   - Se busca un tema previamente almacenado en `localStorage`.
   - Si existe y es válido, se marca el origen como `user-defined`.
   - Si no, se utiliza la preferencia del sistema (determinada con `prefers-color-scheme: dark`) y se marca el origen como `system`.

2. **Actualización del Tema**

   - Se añaden event listeners para reaccionar a los cambios en la preferencia del sistema, actualizando el estado _sólo_ si el usuario no ha definido manualmente el tema.
   - Al cambiar manualmente el tema mediante el método `handleChangeTheme`, se actualiza el estado y se define el origen como `user-defined`.

3. **Sincronización con el DOM**
   - El hook actualiza los atributos del elemento `<html>`:
     - `data-theme` se configura con el tema actual.
     - `origin-theme` se configura con el origen de la elección (system o user-defined).

Esta separación garantiza que la interfaz siempre muestre el tema correcto sin confundir la fuente de la preferencia, lo que es fundamental para integraciones con Tailwind CSS y otros frameworks que dependen del atributo `data-theme`.

---

Utiliza este hook para mejorar la experiencia del usuario y facilitar el mantenimiento y la escalabilidad del manejo de temas en tus proyectos.

---

## Cómo Depurar y Probar el Modo Oscuro

Para facilitar la depuración y pruebas relacionadas con `prefers-color-scheme`, Chrome DevTools permite emular el esquema de colores preferido por el usuario sin afectar la configuración global del sistema operativo. Esto es especialmente útil para validar el comportamiento del hook `useHandleTheme`.

### Pasos para Emular el Modo Oscuro en Chrome DevTools

1. **Abre Chrome DevTools**:  
   Puedes hacerlo haciendo clic derecho en la página y seleccionando **Inspeccionar** o usando la combinación `F12`.

2. **Accede al Menú Comandos**:  
   Pulsa `Ctrl + Shift + P` (o `Cmd + Shift + P` en macOS) para abrir la paleta de comandos.

3. **Escribe "Rendering" y Selecciona "Show Rendering"**:  
   Esto abrirá el panel de Rendering en DevTools.

4. **Configura la Emulación de `prefers-color-scheme`**:  
   En el panel Rendering, busca la opción **Emulate CSS media feature prefers-color-scheme** y cámbiala al valor deseado (light, dark o dejar sin especificar).  
   Al hacer esto, solo la pestaña visible reflejará la preferencia emulada, permitiéndote comprobar cómo reacciona la interfaz a diferentes configuraciones sin tener que cambiar el esquema de colores de todo el sistema.

<div align="center">
  <img src="https://github.com/user-attachments/assets/1a5c6b01-b349-4f24-8824-a4774567e059" alt="Chrome DevTools - Panel Rendering" width="400px" />
</div>

Esta funcionalidad es muy útil para desarrolladores que necesitan validar la adaptación del tema en tiempo real de forma rápida y sin modificar ajustes globales o modificar la fuente del Sistema Operativo.

---

**Referencia Adicional:**

[prefers-color-scheme🌒: hola oscuridad, mi vieja amiga ](https://web.dev/articles/prefers-color-scheme?hl=es)

---
