import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useHandleTheme } from "../hooks/useHandleTheme";

interface ExtendedMediaQueryList extends MediaQueryList {
  trigger: (matches: boolean) => void;
}

function createMatchMedia(matches: boolean): ExtendedMediaQueryList {
  let listeners: Array<(e: MediaQueryListEvent) => void> = [];

  const mql = {
    matches,
    addEventListener: (
      event: string,
      callback: (e: MediaQueryListEvent) => void
    ) => {
      if (event === "change") {
        listeners.push(callback);
      }
    },
    removeEventListener: (
      event: string,
      callback: (e: MediaQueryListEvent) => void
    ) => {
      if (event === "change") {
        listeners = listeners.filter((fn) => fn !== callback);
      }
    },
    trigger(newMatches: boolean) {
      mql.matches = newMatches;
      listeners.forEach((callback) =>
        callback({ matches: newMatches } as MediaQueryListEvent)
      );
    },
  };
  return mql as ExtendedMediaQueryList;
}

describe("useHandleTheme hook", () => {
  let originalMatchMedia: typeof window.matchMedia;

  beforeEach(() => {
    // Guardamos el matchMedia original para restaurarlo después.
    originalMatchMedia = window.matchMedia;
    // Limpiar localStorage antes de cada test.
    localStorage.clear();
  });

  afterEach(() => {
    // Restauramos matchMedia original.
    window.matchMedia = originalMatchMedia;
  });

  it("debe retornar el tema definido en localStorage (user-defined)", () => {
    localStorage.setItem("theme", "dark");

    // Configuramos matchMedia, pero no se llegará a usar por que hay un valor en localStorage
    window.matchMedia = vi.fn(() => createMatchMedia(false));

    const { result } = renderHook(() => useHandleTheme());
    expect(result.current.theme).toBe("dark");
    expect(result.current.origin).toBe("user-defined");
  });

  it("debe retornar el tema del sistema si no hay tema en localStorage", () => {
    // Simula que el sistema tiene preferencia dark (matches = true)
    window.matchMedia = vi.fn(() => createMatchMedia(true));

    const { result } = renderHook(() => useHandleTheme());
    expect(result.current.theme).toBe("dark");
    expect(result.current.origin).toBe("system");
  });

  it("onChangeTheme debe alternar el tema y establecer origin a user-defined", () => {
    // Simula sistema light por defecto (matches = false)
    window.matchMedia = vi.fn(() => createMatchMedia(false));

    const { result } = renderHook(() => useHandleTheme());
    expect(result.current.theme).toBe("light");

    act(() => {
      result.current.onChangeTheme();
    });

    expect(result.current.theme).toBe("dark");
    expect(result.current.origin).toBe("user-defined");
  });

  it("debe actualizar el tema al producirse un cambio en la preferencia del sistema si no es user-defined", () => {
    // Creamos un objeto MatchMedia controlable
    const mql = createMatchMedia(false);
    window.matchMedia = vi.fn(() => mql);

    const { result } = renderHook(() => useHandleTheme());
    // Al no haber en localStorage, debe tomar la preferencia del sistema: light en este caso
    expect(result.current.theme).toBe("light");
    expect(result.current.origin).toBe("system");

    // Simulamos cambio del sistema a dark
    act(() => {
      mql.trigger(true);
    });

    // El hook debe actualizar el tema a "dark"
    expect(result.current.theme).toBe("dark");
    expect(result.current.origin).toBe("system");
  });
});
