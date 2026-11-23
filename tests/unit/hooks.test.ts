import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAbortableFetch, useDebouncedValue, useGeolocation } from "@/lib/hooks";

describe("useDebouncedValue", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("keeps the initial value until the delay elapses", () => {
    const { result } = renderHook(({ value }) => useDebouncedValue(value, 300), { initialProps: { value: "a" } });
    expect(result.current).toBe("a");
  });

  it("does not update immediately when the input value changes", () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 300), { initialProps: { value: "a" } });
    rerender({ value: "b" });
    expect(result.current).toBe("a");
  });

  it("updates to the latest value once the delay has elapsed", () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 300), { initialProps: { value: "a" } });
    rerender({ value: "b" });
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current).toBe("b");
  });

  it("resets the timer on each change, only committing the final value", () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 300), { initialProps: { value: "a" } });
    rerender({ value: "b" });
    act(() => {
      vi.advanceTimersByTime(200);
    });
    rerender({ value: "c" });
    act(() => {
      vi.advanceTimersByTime(200);
    });
    // Only 200ms have passed since "c" was set -- not yet committed.
    expect(result.current).toBe("a");
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current).toBe("c");
  });
});

describe("useAbortableFetch", () => {
  it("aborts the previously issued signal when a new one is requested", () => {
    const { result } = renderHook(() => useAbortableFetch());
    const first = result.current();
    expect(first.aborted).toBe(false);

    const second = result.current();
    expect(first.aborted).toBe(true);
    expect(second.aborted).toBe(false);
  });

  it("aborts the current in-flight signal when the component unmounts", () => {
    const { result, unmount } = renderHook(() => useAbortableFetch());
    const signal = result.current();
    unmount();
    expect(signal.aborted).toBe(true);
  });
});

describe("useGeolocation", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("reports an error instead of throwing when the browser has no geolocation API", () => {
    vi.stubGlobal("navigator", {});
    const { result } = renderHook(() => useGeolocation());

    act(() => {
      result.current.requestLocation(vi.fn());
    });

    expect(result.current.error).toBe("Geolocation is not available in this browser.");
    expect(result.current.loading).toBe(false);
  });

  it("calls onSuccess with a Location derived from the browser's reported coordinates", () => {
    const getCurrentPosition = vi.fn((onSuccess: (pos: { coords: { latitude: number; longitude: number } }) => void) => {
      onSuccess({ coords: { latitude: 28.6, longitude: 77.2 } });
    });
    vi.stubGlobal("navigator", { geolocation: { getCurrentPosition } });

    const { result } = renderHook(() => useGeolocation());
    const onSuccess = vi.fn();

    act(() => {
      result.current.requestLocation(onSuccess);
    });

    expect(onSuccess).toHaveBeenCalledWith({ name: "My current location", latitude: 28.6, longitude: 77.2 });
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("reports the browser's error message when permission is denied", () => {
    const getCurrentPosition = vi.fn((_onSuccess: unknown, onError: (err: { message: string }) => void) => {
      onError({ message: "User denied Geolocation" });
    });
    vi.stubGlobal("navigator", { geolocation: { getCurrentPosition } });

    const { result } = renderHook(() => useGeolocation());

    act(() => {
      result.current.requestLocation(vi.fn());
    });

    expect(result.current.error).toBe("User denied Geolocation");
  });
});
