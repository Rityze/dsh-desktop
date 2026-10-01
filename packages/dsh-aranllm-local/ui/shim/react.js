/*
 * React, as the plugin's caller supplied it.
 *
 * The bundle cannot import React: it is loaded inside the host's module factory,
 * which has no resolver, and a copy of React bundled in here would be a second
 * copy on a page that already has one — the first hook called across the two
 * throws. So `react` is aliased to this file at build time, and the plugin
 * installs the real module on the global before the bundle runs.
 */
const real = globalThis.__aranllmUI?.react
if (real === undefined) {
  throw new Error('aranllm-local: the bundle ran before React was installed')
}
export default real
export const {
  useState, useEffect, useMemo, useRef, useCallback, useReducer,
  useLayoutEffect, useContext, createContext, forwardRef, memo,
  Fragment, createElement, cloneElement, Children, isValidElement,
} = real
