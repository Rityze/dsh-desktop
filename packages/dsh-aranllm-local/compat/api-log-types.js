/**
 * The shape of one logged request.
 *
 * Kept in its own file with no imports, because it crosses three processes: the
 * main process writes these, the preload transports them, and the renderer draws
 * them. A type declared next to the buffer would pull `node:http` into the
 * renderer's graph the moment someone imported it.
 */
export {};
