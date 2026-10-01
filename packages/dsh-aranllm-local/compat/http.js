/**
 * A Fetch-shaped handler around a plain function.
 *
 * ## What it replaces
 *
 * The desktop application answered these calls from `ipcMain.handle`, which
 * takes an argument and returns a value. A `fetch` route takes a `Request` and
 * returns a `Response`. Everything between the two is this file, and it is the
 * same four decisions for every route — which is exactly why it is written once.
 *
 * ## Why a failure is a described response rather than a throw
 *
 * A route that throws is answered by the webserver as a 400 with the exception's
 * message, and — worse — it logs a stack at warn level for something that is
 * usually ordinary. "No model folder is configured" is not a fault in the
 * server; it is a fact the page asked about. So the codes the copied modules
 * already use (`BINARY_MISSING`, `MODEL_MISSING`, and a `status` when they set
 * one) become the response's status, and the message becomes its `error` field.
 *
 * `Cache-Control: no-store` on every answer, including the failures: the panel
 * polls status while a model loads, and a cached 200 would show `ready` for a
 * load that has not finished.
 */
export function json(run) {
  return async (...args) => {
    try {
      return Response.json(await run(...args), {
        headers: { 'Cache-Control': 'no-store' },
      })
    } catch (error) {
      const status =
        error?.status ??
        (error?.code === 'BINARY_MISSING' || error?.code === 'MODEL_MISSING' ? 400 : 500)
      return Response.json(
        { code: error?.code ?? 'ERROR', error: error?.message ?? String(error) },
        { status, headers: { 'Cache-Control': 'no-store' } },
      )
    }
  }
}
