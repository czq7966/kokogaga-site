import { EventEmitter } from "events";
import { HttpHelper } from "../../../../common/http-helper";

export namespace chrome {
    export namespace events {
        export class Event<T extends Function> {
            emitter: EventEmitter;
            constructor() {
                this.emitter = new EventEmitter();
            }
            destroy() {
                this.emitter.removeAllListeners();
                delete this.emitter;
            }
            emit(...args: any[]) {
                this.emitter.emit(Event.name, ...args);
            }
            addListener(callback: T): void {
                this.emitter.addListener(Event.name, callback as any);
            }        
            removeListener(callback: T): void {
                this.emitter.removeListener(Event.name, callback as any);
            }
        }        
    }

    export namespace runtime {
        export class PortDisconnectEvent extends events.Event<(port: Port) => void> { }    
        export class PortMessageEvent extends events.Event<(message: any, port: Port) => void> { }    
        export class Port {
            twainPort: Port;
            constructor() {
                this.onDisconnect = new PortDisconnectEvent();
                this.onMessage = new PortMessageEvent();
            }
            destroy() {
                this.onDisconnect.destroy();
                this.onMessage.destroy();
            }
            postMessage(message: Object) : void {
                this.twainPort && this.twainPort.onMessage.emit(message);
            }
            disconnect() : void {
                let _twainPort = this.twainPort;
                delete this.twainPort;
                if (_twainPort) {
                    _twainPort.disconnect();                
                    this.onDisconnect.emit(this)
                }
            }
            onDisconnect: PortDisconnectEvent ;
            /** An object which allows the addition and removal of listeners for a Chrome event. */
            onMessage: PortMessageEvent;
            name: string;
        }
        export class ConnectInfo {
            name?: string;
            includeTlsChannelId?: boolean;
        }    
        export class ExtensionConnectEvent extends events.Event<(port: Port) => void> { }    
        export function connect(connectInfo?: ConnectInfo): Port {
            connectInfo = connectInfo || {};
            connectInfo.name = connectInfo.name || Math.random().toString(36).slice(-16);
            let portClient = new Port();
            let portServer = new Port();
            portClient.name = connectInfo.name;
            portServer.name = connectInfo.name;
            portClient.twainPort = portServer;
            portServer.twainPort = portClient;

            runtime.onConnect.emit(portServer);
            return portClient;
        }
        export var onConnect: ExtensionConnectEvent = new ExtensionConnectEvent();        
        export function connectNative(application: string): Port {
            // To Do
            return null;
        }
        export function reload(): void {
            window.location.reload();
        }       
    }
    

    export namespace i18n {
        var _currentLanguage: string;
        export var defaultLanguage: string = 'en';
        export var locals: {[name: string] : {[name: string]: {message: string}} } = {};
        export function getMessage(messageName: string, substitutions?: any): string {
            let local = locals[_currentLanguage] || locals[defaultLanguage];
            if (local) {
                let item = local[messageName]
                return item && item.message;
            }
            return ;
        }
        export function getUILanguage(): string {
            let remote: Electron.Remote =  mynode.electron['remote'];
            _currentLanguage = remote.app.getLocale()
            return _currentLanguage;
        }

        export function loadUILanguage(): Promise<any> {
            return new Promise((resolve, reject) => {
                let _getUrl = (_local) => {
                    return "../../_locales/" + _local + "/messages.json" 
                }
                let _getData = (_local): Promise<any> => {
                    let http = new HttpHelper();
                    let promise = http.getData(_getUrl(_local))
                    .then(v => {
                        i18n.locals[_local] = JSON.parse(v);
                        resolve()
                    })
                    return promise;
                }

                
                _getData(getUILanguage())
                .catch(e => {                    
                    if (!!defaultLanguage) {
                        _getData(defaultLanguage)
                        .catch(e => {
                            reject(e)
                        })
                    } else {
                        reject(e)
                    }
                })

            })
        }        
    
    
    }

    export namespace storage {
        export class StorageArea {
            clear(callback?: () => void): void {
                //Todo
            }
            set(items: Object, callback?: () => void): void {
                //Todo
            }
            remove(keys: string | string[], callback?: () => void): void {
                //Todo
            }

            get(callback: (items: { [key: string]: any }) => void): void {
                callback({});
            }

            // get(keys: string | string[] | Object | null, callback: (items: { [key: string]: any }) => void): void {
            //     //Todo
            // }
        }
    
        export class StorageChange {
            /** Optional. The new value of the item, if there is a new value. */
            newValue?: any;
            /** Optional. The old value of the item, if there was an old value. */
            oldValue?: any;
        }
    
        export class LocalStorageArea extends StorageArea {
            /** The maximum amount (in bytes) of data that can be stored in local storage, as measured by the JSON stringification of every value plus every key's length. This value will be ignored if the extension has the unlimitedStorage permission. Updates that would cause this limit to be exceeded fail immediately and set runtime.lastError. */
            QUOTA_BYTES: number;
        }
    
        export class SyncStorageArea extends StorageArea {
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
    
        export class StorageChangedEvent extends events.Event<(changes: { [key: string]: StorageChange }, areaName: string) => void> { }
    
        /** Items in the local storage area are local to each machine. */
        export var local: LocalStorageArea;
        /** Items in the sync storage area are synced using Chrome Sync. */
        export var sync: SyncStorageArea = new SyncStorageArea();
    
        /**
         * Items in the managed storage area are set by the domain administrator, and are read-only for the extension; trying to modify this namespace results in an error.
         * @since Chrome 33.
         */
        export var managed: StorageArea;
    
        /** Fired when one or more items change. */
        export var onChanged: StorageChangedEvent;
    }

    export namespace tabs {
        export class Tab {}
        export function get(tabId: number, callback: (tab: Tab) => void): void {
            callback(null);
        }  
        export function getSelected(callback: (tab: Tab) => void): void {
            callback(null);
        }
    }    
    
    export namespace desktopCapture {
        export function chooseDesktopMedia(sources: string[], callback: (streamId: string) => void): number {
            //Todo
            return null;
        }

        // export function chooseDesktopMedia(sources: string[], targetTab: chrome.tabs.Tab, callback: (streamId: string) => void): number {
        //     //todo
        //     return
        // }
        /**
         * Hides desktop media picker dialog shown by chooseDesktopMedia().
         * @param desktopMediaRequestId Id returned by chooseDesktopMedia()
         */
        export function cancelChooseDesktopMedia(desktopMediaRequestId: number): void {
            //todo
        }
    }    

    export namespace tabCapture {
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
        export function capture(options: CaptureOptions, callback: (stream: MediaStream | null) => void): void {

        }
        export function getCapturedTabs(callback: (result: CaptureInfo[]) => void): void {

        }
    }   
    
    export namespace browserAction {
        export interface TabIconDetails {
            /** Optional. Either a relative image path or a dictionary {size -> relative image path} pointing to icon to be set. If the icon is specified as a dictionary, the actual image to be used is chosen depending on screen's pixel density. If the number of image pixels that fit into one screen space unit equals scale, then image with size scale * 19 will be selected. Initially only scales 1 and 2 will be supported. At least one image must be specified. Note that 'details.path = foo' is equivalent to 'details.imageData = {'19': foo}'  */
            path?: any;
            /** Optional. Limits the change to when a particular tab is selected. Automatically resets when the tab is closed.  */
            tabId?: number;
            /** Optional. Either an ImageData object or a dictionary {size -> ImageData} representing icon to be set. If the icon is specified as a dictionary, the actual image to be used is chosen depending on screen's pixel density. If the number of image pixels that fit into one screen space unit equals scale, then image with size scale * 19 will be selected. Initially only scales 1 and 2 will be supported. At least one image must be specified. Note that 'details.imageData = foo' is equivalent to 'details.imageData = {'19': foo}'  */
            imageData?: ImageData | { [index: number]: ImageData };
        }    
        export function setIcon(details: TabIconDetails, callback?: Function): void {
            //todo
        }  
    }
    
    export namespace idle {
        export class IdleStateChangedEvent extends chrome.events.Event<(newState: string) => void> { }    
        export var onStateChanged: IdleStateChangedEvent = new IdleStateChangedEvent();    
    }    
}

window.chrome = chrome;


import { captureDesktop } from '../../../../../../../activ-cast/src/activ-cast/background/capture.desktop';
captureDesktop.getStream = (screenOptions: Array<string>,  callback: (stream: MediaStream, tab?: chrome.tabs.Tab) => void) => {
    let _getVideoStream = (sourceId?: string): Promise<MediaStream> => {        
        sourceId = sourceId || 'screen:0:0';
        let constraints = {
            audio: false,
            video: {
                mandatory: {
                    chromeMediaSource: 'desktop',
                    chromeMediaSourceId: sourceId,
                }
            }
        }
        return navigator.mediaDevices.getUserMedia(constraints as any);
    }

    let _getAudioStream = (): Promise<MediaStream> => {        
        let constraints = {
            audio: {
                mandatory: {
                      chromeMediaSource: 'desktop'
                }
              } ,
              video: {
                mandatory: {
                      chromeMediaSource: 'desktop'
                }
            }
        }

        return navigator.mediaDevices.getUserMedia(constraints as any);
    }      

    let _getStream = () => {
        let stream = new MediaStream();
        _getVideoStream()
        .then(v => {
            v.getVideoTracks().forEach(track => {
                stream.addTrack(track);
            });
            _getAudioStream()
            .then(a => {
                a.getAudioTracks().forEach(track => {
                    stream.addTrack(track);
                });                
                callback(stream);                
            })
            .catch(e => {
                callback(stream);                
            })


        })
        .catch(e => {
            callback(null)
        })
    }
    _getStream();
    
}
