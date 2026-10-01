/** Vision plugin card: staged settings under Settings → Plugins. */
import { type ReactElement } from "react";
import type { ImagePathifyCardState } from "./card-form.ts";
import { type ImagePathifyKey } from "./locales.ts";
/** Injected business face: snapshot store plus form actions. */
export interface ImagePathifyCardInjected {
    hooks: {
        imagePathifyCard: {
            getSnapshot(): ImagePathifyCardState;
            subscribe(fn: () => void): () => void;
        };
    };
    edit: (field: string, text: string) => void;
    resetField: (field: string) => void;
    save: () => void;
    discard: () => void;
    setDisableThinking: (value: boolean) => void;
    setRelaxAdmission: (value: boolean) => void;
    addModel: (provider: string, model: string) => void;
    removeModel: (provider: string, model: string) => void;
}
/** Props the renderer binds for the Vision card. */
export interface ImagePathifyCardProps {
    useImagePathifyCard: <T>(selector: (state: ImagePathifyCardState) => T) => T;
    t: (key: ImagePathifyKey, params?: Record<string, string>) => string;
    edit: (field: string, text: string) => void;
    resetField: (field: string) => void;
    save: () => void;
    discard: () => void;
    setDisableThinking: (value: boolean) => void;
    setRelaxAdmission: (value: boolean) => void;
    addModel: (provider: string, model: string) => void;
    removeModel: (provider: string, model: string) => void;
}
/** Render the Vision plugin card. */
export declare function ImagePathifyCard({ useImagePathifyCard, t, edit, resetField, save, discard, setDisableThinking, setRelaxAdmission, addModel, removeModel, }: ImagePathifyCardProps): ReactElement | null;
