interface Window {
    chrome: typeof chrome;
}

declare namespace chrome.i18n {
    export function getMessage(messageName: string, substitutions?: any): string;
    /**
     * Gets the browser UI language of the browser. This is different from i18n.getAcceptLanguages which returns the preferred user languages.
     * @since Chrome 35.
     */
    export function getUILanguage(): string;
    export function loadUILanguage(): Promise<any>;


}

declare namespace chrome.storage {
    export interface StorageArea {
        clear(callback?: () => void): void;
        /**
         * Sets multiple items.
         * @param items An object which gives each key/value pair to update storage with. Any other key/value pairs in storage will not be affected.
         * Primitive values such as numbers will serialize as expected. Values with a typeof "object" and "function" will typically serialize to {}, with the exception of Array (serializes as expected), Date, and Regex (serialize using their String representation).
         * @param callback Optional.
         * Callback on success, or on failure (in which case runtime.lastError will be set).
         */
        set(items: Object, callback?: () => void): void;
        /**
         * Removes one or more items from storage.
         * @param A single key or a list of keys for items to remove.
         * @param callback Optional.
         * Callback on success, or on failure (in which case runtime.lastError will be set).
         */
        remove(keys: string | string[], callback?: () => void): void;
        /**
         * Gets one or more items from storage.
         * @param callback Callback with storage items, or on failure (in which case runtime.lastError will be set).
         * Parameter items: Object with items in their key-value mappings.
         */
        get(callback: (items: { [key: string]: any }) => void): void;
        /**
         * Gets one or more items from storage.
         * @param keys A single key to get, list of keys to get, or a dictionary specifying default values.
         * An empty list or object will return an empty result object. Pass in null to get the entire contents of storage.
         * @param callback Callback with storage items, or on failure (in which case runtime.lastError will be set).
         * Parameter items: Object with items in their key-value mappings.
         */
        get(keys: string | string[] | Object | null, callback: (items: { [key: string]: any }) => void): void;
    }

    export interface StorageChange {
        /** Optional. The new value of the item, if there is a new value. */
        newValue?: any;
        /** Optional. The old value of the item, if there was an old value. */
        oldValue?: any;
    }

    export interface LocalStorageArea extends StorageArea {
        /** The maximum amount (in bytes) of data that can be stored in local storage, as measured by the JSON stringification of every value plus every key's length. This value will be ignored if the extension has the unlimitedStorage permission. Updates that would cause this limit to be exceeded fail immediately and set runtime.lastError. */
        QUOTA_BYTES: number;
    }

    export interface SyncStorageArea extends StorageArea {
        /** @deprecated since Chrome 40. The storage.sync API no longer has a sustained write operation quota. */
        MAX_SUSTAINED_WRITE_OPERATIONS_PER_MINUTE: number;
        /** The maximum total amount (in bytes) of data that can be stored in sync storage, as measured by the JSON stringification of every value plus every key's length. Updates that would cause this limit to be exceeded fail immediately and set runtime.lastError. */
        QUOTA_BYTES: number;
        /** The maximum size (in bytes) of each individual item in sync storage, as measured by the JSON stringification of its value plus its key length. Updates containing items larger than this limit will fail immediately and set runtime.lastError. */
        QUOTA_BYTES_PER_ITEM: number;
        /** The maximum number of items that can be stored in sync storage. Updates that would cause this limit to be exceeded will fail immediately and set runtime.lastError. */
        MAX_ITEMS: number;
        /**
         * The maximum number of set, remove, or clear operations that can be performed each hour. This is 1 every 2 seconds, a lower ceiling than the short term higher writes-per-minute limit.
         * Updates that would cause this limit to be exceeded fail immediately and set runtime.lastError.
         */
        MAX_WRITE_OPERATIONS_PER_HOUR: number;
        /**
         * The maximum number of set, remove, or clear operations that can be performed each minute. This is 2 per second, providing higher throughput than writes-per-hour over a shorter period of time.
         * Updates that would cause this limit to be exceeded fail immediately and set runtime.lastError.
         * @since Chrome 40.
         */
        MAX_WRITE_OPERATIONS_PER_MINUTE: number;
    }

    export interface StorageChangedEvent extends chrome.events.Event<(changes: { [key: string]: StorageChange }, areaName: string) => void> { }

    /** Items in the local storage area are local to each machine. */
    export var local: LocalStorageArea;
    /** Items in the sync storage area are synced using Chrome Sync. */
    export var sync: SyncStorageArea;

    /**
     * Items in the managed storage area are set by the domain administrator, and are read-only for the extension; trying to modify this namespace results in an error.
     * @since Chrome 33.
     */
    export var managed: StorageArea;

    /** Fired when one or more items change. */
    export var onChanged: StorageChangedEvent;
}


declare namespace chrome.tabs {
    export interface Tab {}
    export function get(tabId: number, callback: (tab: Tab) => void): void;    
    export function getSelected(callback: (tab: Tab) => void): void;
}

declare namespace chrome.desktopCapture {
    /**
     * Shows desktop media picker UI with the specified set of sources.
     * @param sources Set of sources that should be shown to the user.
     * @param callback The callback parameter should be a function that looks like this:
     * function(string streamId) {...};
     * Parameter streamId: An opaque string that can be passed to getUserMedia() API to generate media stream that corresponds to the source selected by the user. If user didn't select any source (i.e. canceled the prompt) then the callback is called with an empty streamId. The created streamId can be used only once and expires after a few seconds when it is not used.
     */
    export function chooseDesktopMedia(sources: string[], callback: (streamId: string) => void): number;
    /**
     * Shows desktop media picker UI with the specified set of sources.
     * @param sources Set of sources that should be shown to the user.
     * @param targetTab Optional tab for which the stream is created. If not specified then the resulting stream can be used only by the calling extension. The stream can only be used by frames in the given tab whose security origin matches tab.url.
     * @param callback The callback parameter should be a function that looks like this:
     * function(string streamId) {...};
     * Parameter streamId: An opaque string that can be passed to getUserMedia() API to generate media stream that corresponds to the source selected by the user. If user didn't select any source (i.e. canceled the prompt) then the callback is called with an empty streamId. The created streamId can be used only once and expires after a few seconds when it is not used.
     */
    export function chooseDesktopMedia(sources: string[], targetTab: chrome.tabs.Tab, callback: (streamId: string) => void): number;
    /**
     * Hides desktop media picker dialog shown by chooseDesktopMedia().
     * @param desktopMediaRequestId Id returned by chooseDesktopMedia()
     */
    export function cancelChooseDesktopMedia(desktopMediaRequestId: number): void;
}

declare namespace chrome.tabCapture {
    export interface CaptureOptions {
        /** Optional. */
        audio?: boolean;
        /** Optional. */
        video?: boolean;
        /** Optional. */
        audioConstraints?: MediaStreamConstraints;
        /** Optional. */
        videoConstraints?: MediaStreamConstraints;
    }    
    export interface CaptureInfo {
        /** The id of the tab whose status changed. */
        tabId: number;
        /**
         * The new capture status of the tab.
         * One of: "pending", "active", "stopped", or "error"
         */
        status: string;
        /** Whether an element in the tab being captured is in fullscreen mode. */
        fullscreen: boolean;
    }    
    export function capture(options: CaptureOptions, callback: (stream: MediaStream | null) => void): void;
    export function getCapturedTabs(callback: (result: CaptureInfo[]) => void): void;
}

declare namespace chrome.runtime {
    export interface PortDisconnectEvent extends chrome.events.Event<(port: Port) => void> { }    
    export interface PortMessageEvent extends chrome.events.Event<(message: any, port: Port) => void> { }    
    export interface Port {
        postMessage: (message: Object) => void;
        disconnect: () => void;
        onDisconnect: PortDisconnectEvent;
        /** An object which allows the addition and removal of listeners for a Chrome event. */
        onMessage: PortMessageEvent;
        name: string;
    }
    export interface ConnectInfo {
        name?: string;
        includeTlsChannelId?: boolean;
    }    
    export interface ExtensionConnectEvent extends chrome.events.Event<(port: Port) => void> { }    
    export function connect(connectInfo?: ConnectInfo): Port;
    export var onConnect: ExtensionConnectEvent;        
    export function connectNative(application: string): Port;
    export function reload(): void;        
}

declare namespace chrome.events {
    export interface Event<T extends Function> {
        destroy();
        emit(...args: any[])
        addListener(callback: T): void;
        removeListener(callback: T): void;
    }
}

declare namespace chrome.browserAction {
    export interface TabIconDetails {
        /** Optional. Either a relative image path or a dictionary {size -> relative image path} pointing to icon to be set. If the icon is specified as a dictionary, the actual image to be used is chosen depending on screen's pixel density. If the number of image pixels that fit into one screen space unit equals scale, then image with size scale * 19 will be selected. Initially only scales 1 and 2 will be supported. At least one image must be specified. Note that 'details.path = foo' is equivalent to 'details.imageData = {'19': foo}'  */
        path?: any;
        /** Optional. Limits the change to when a particular tab is selected. Automatically resets when the tab is closed.  */
        tabId?: number;
        /** Optional. Either an ImageData object or a dictionary {size -> ImageData} representing icon to be set. If the icon is specified as a dictionary, the actual image to be used is chosen depending on screen's pixel density. If the number of image pixels that fit into one screen space unit equals scale, then image with size scale * 19 will be selected. Initially only scales 1 and 2 will be supported. At least one image must be specified. Note that 'details.imageData = foo' is equivalent to 'details.imageData = {'19': foo}'  */
        imageData?: ImageData | { [index: number]: ImageData };
    }    
    export function setIcon(details: TabIconDetails, callback?: Function): void;    
}

declare namespace chrome.idle {
    export interface IdleStateChangedEvent extends chrome.events.Event<(newState: string) => void> { }    
    export var onStateChanged: IdleStateChangedEvent;    
}



