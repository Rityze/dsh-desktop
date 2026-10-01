import { type ReactNode } from 'react';
/**
 * A component's own settings, on its page: keyed by the component's package
 * name, rendered after the page's generated state, relations and options.
 */
export declare const MNEMON_COMPONENT_SETTINGS_SLOT: "mnemon.component.settings";
/**
 * What a component's card on the Memory System's Status page says while it
 * runs, keyed by the component's package name. A card that is not running
 * shows the page's own note instead.
 */
export declare const MNEMON_COMPONENT_STATUS_SLOT: "mnemon.component.status";
type ComponentRegion = typeof MNEMON_COMPONENT_SETTINGS_SLOT | typeof MNEMON_COMPONENT_STATUS_SLOT;
/** What the host tells a component's settings about the page they are on. */
export interface MemoryComponentSettingsProps {
    /** The component the page is about, as the host shows it. */
    component: {
        packageName: string;
        label: string;
        /** Whether the component is switched on. */
        enabled: boolean;
    };
    /** Whether the configuration can be written now; settings stay read-only otherwise. */
    writable: boolean;
    /** The active DSH locale id. */
    language: string;
    /** The conversation and workspace the page was opened for, when there is one. */
    sessionId?: string;
    workspace?: {
        id: string;
        label?: string;
    };
}
export type MemoryComponentSettingsComponent = (props: MemoryComponentSettingsProps) => ReactNode;
/** What the Status page tells a component's card: the component it is about. */
export interface MemoryComponentStatusProps {
    component: {
        packageName: string;
        label: string;
        enabled: boolean;
    };
    /** The active DSH locale id. */
    language: string;
    /** The conversation and workspace the Memory System shows, when there is one. */
    sessionId?: string;
    workspace?: {
        id: string;
        label?: string;
    };
}
export type MemoryComponentStatusComponent = (props: MemoryComponentStatusProps) => ReactNode;
/** Everything one component adds to dsh-mnemon's interface beyond its declaration. */
export interface MemoryComponentUIContribution {
    /** The npm package name the component's plugin declaration names. */
    packageName: string;
    /** Its own settings, shown on its page. Each saves on its own. */
    settings?: MemoryComponentSettingsComponent;
    /** What its card on the Status page says while it runs: a headline and one line. */
    status?: MemoryComponentStatusComponent;
}
/** The DSH Slot capability narrowed to the component regions. */
export interface MemoryComponentUIContext {
    slots: {
        inject(name: ComponentRegion, setup: () => () => void): () => void;
        register(options: {
            name: typeof MNEMON_COMPONENT_SETTINGS_SLOT;
            key: string;
        }, component: MemoryComponentSettingsComponent): () => void;
        register(options: {
            name: typeof MNEMON_COMPONENT_STATUS_SLOT;
            key: string;
        }, component: MemoryComponentStatusComponent): () => void;
    };
}
/**
 * Register a component's interface into the regions dsh-mnemon declares, the
 * way shipped components do. Registration waits for each region to exist and
 * is released by the returned function.
 */
export declare function installMemoryComponentUI(ctx: MemoryComponentUIContext, contribution: MemoryComponentUIContribution): () => void;
interface ComponentRegionDirectoryContext {
    slots: {
        getVersion(name: ComponentRegion): number;
        entriesOfSlot(name: ComponentRegion): readonly {
            options: {
                key?: string;
            };
        }[];
        subscribe(name: ComponentRegion, listener: () => void): () => void;
    };
}
/** The components that registered into one region, as the pages that show it need to know. */
export interface ComponentRegionDirectory {
    getSnapshot(): ReadonlySet<string>;
    subscribe(listener: () => void): () => void;
}
/** The components that registered settings. */
export type ComponentSettingsDirectory = ComponentRegionDirectory;
/** Thin adapter over a DSH child Slot: it keeps no registry of its own. */
export declare function createComponentRegionDirectory(ctx: ComponentRegionDirectoryContext, region: ComponentRegion): ComponentRegionDirectory;
export declare function createComponentSettingsDirectory(ctx: ComponentRegionDirectoryContext): ComponentSettingsDirectory;
interface ComponentRegionEntriesContext {
    slots: {
        entriesOfSlot(name: ComponentRegion): readonly {
            component: unknown;
            options: {
                key?: string;
            };
        }[];
    };
}
/**
 * Render what one component registered into a region, where the page is not
 * the region's declaring owner, as DSH's row page for a component is not:
 * a child slot has one declaring entry, the configuration's.
 */
export declare function renderComponentRegion<P extends object>(ctx: ComponentRegionEntriesContext, region: ComponentRegion, packageName: string, props: P): ReactNode;
export {};
