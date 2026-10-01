/**
 * Credentials wire used by the Vision card.
 *
 * 0.1.7 exposes credentials on `ctx.remote.credentials`: `describe([ref])`
 * and `set(ref, value)`.
 * @module dsh-image-pathify/client/credentials-api
 */
import type { VisionCredentialFace } from "./card-form.ts";
/** Minimal ctx face: `get` only, so this module does not import ClientContext. */
export interface CredentialsLookup {
    get(name: string): unknown;
}
interface CredentialsMethods {
    describe: (...args: never[]) => Promise<unknown>;
    set: (...args: never[]) => Promise<unknown>;
}
/** The live `remote.credentials` methods, when the host has mounted them. */
export declare function resolveCredentialsApi(ctx: CredentialsLookup): CredentialsMethods | undefined;
/**
 * Wrap the credentials namespace as the card's describe/set face.
 * @param api - live host methods, or undefined when the namespace is absent.
 */
export declare function credentialsFace(api: CredentialsMethods | undefined): VisionCredentialFace;
/**
 * Credentials face that re-resolves the host source on every call, so a
 * late-arriving `remote.credentials` fiber is picked up without remounting
 * the card.
 */
export declare function liveCredentials(ctx: CredentialsLookup): VisionCredentialFace;
export {};
