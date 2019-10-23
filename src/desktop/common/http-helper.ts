export interface IRequestOptions {
    args?:{[key: string]: any},
    onreadystatechange?: (this: XMLHttpRequest, ev: Event) => any,
    onabort?: (this: XMLHttpRequest, ev: Event) => any;
    onerror?: (this: XMLHttpRequest, ev: ProgressEvent) => any;
    onload?: (this: XMLHttpRequest, ev: Event) => any;
    onloadend?: (this: XMLHttpRequest, ev: ProgressEvent) => any;
    onloadstart?: (this: XMLHttpRequest, ev: Event) => any;
    onprogress?: (this: XMLHttpRequest, ev: ProgressEvent) => any;
    ontimeout?: (this: XMLHttpRequest, ev: ProgressEvent) => any;
    upload?: {
        onabort?: (this: XMLHttpRequest, ev: Event) => any;
        onerror?: (this: XMLHttpRequest, ev: ProgressEvent) => any;
        onload?: (this: XMLHttpRequest, ev: Event) => any;
        onloadend?: (this: XMLHttpRequest, ev: ProgressEvent) => any;
        onloadstart?: (this: XMLHttpRequest, ev: Event) => any;
        onprogress?: (this: XMLHttpRequest, ev: ProgressEvent) => any;
        ontimeout?: (this: XMLHttpRequest, ev: ProgressEvent) => any;       
    }
}



export class HttpHelper {
    public static initEvents(xhr: XMLHttpRequest, options:IRequestOptions ) {
        if (options.onabort)
            xhr.onabort = options.onabort;
        if (options.onerror)
            xhr.onerror = options.onerror;
        if (options.onload)
            xhr.onload = options.onload;
        if (options.onloadend)
            xhr.onloadend = options.onloadend;
        if (options.onloadstart)
            xhr.onloadstart = options.onloadstart;
        if (options.onprogress)
            xhr.onprogress = options.onprogress;
        if (options.onreadystatechange)
            xhr.onreadystatechange = options.onreadystatechange        
        if (options.ontimeout)
            xhr.ontimeout = options.ontimeout;
        if (options.upload) {
            if (options.upload.onabort)
                xhr.upload.onabort = options.upload.onabort;
            if (options.upload.onerror)
                xhr.upload.onerror = options.upload.onerror;
            if (options.upload.onload)
                xhr.upload.onload = options.upload.onload;
            if (options.upload.onloadend)
                xhr.upload.onloadend = options.upload.onloadend;
            if (options.upload.onloadstart)
                xhr.upload.onloadstart = options.upload.onloadstart;
            if (options.upload.onprogress)
                xhr.upload.onprogress = options.upload.onprogress;
            if (options.upload.ontimeout)
                xhr.upload.ontimeout = options.upload.ontimeout;
        }
    }

    public static initFormData(formData: FormData, args?: {[key: string]: any}): void {        
        if (args) {
            let keys = Object.keys(args);
            keys.forEach(key => {
                let value = args[key];
                if (value instanceof File){
                    formData.append(key, value, (value as File).name);
                } else {
                    if (value instanceof Array) {
                        value.forEach((item) => {
                            if (item instanceof File){
                                formData.append(key, item, (item as File).name);
                            }
                            else {
                                formData.append(key, value);
                            }
                        })
                    }
                    else {
                        formData.append(key, value);
                    }                    
                }
            });
        }
    }

    public static initGetData(args?: {[key: string]: any}): string {
        let result = "";
        if (args) {
            let keys = Object.keys(args);            
            keys.forEach(key => {
                let value = args[key];
                let keyValue = key + "=" + value;
                if (result == "") {
                    result = keyValue;
                } else {
                    result = result + "&&" + keyValue;
                }
            });
        }
        return result;
    }


    public getData(url: string, options?: IRequestOptions): Promise<any> {
        return new Promise((resolve, reject) => {
            let xhr: XMLHttpRequest = new XMLHttpRequest();
            let init = () => {
                if (options) {
                    HttpHelper.initEvents(xhr, options)
                    let params = HttpHelper.initGetData(options.args);
                    if (params != "")
                        url = url + '?' + params;                     
                }

                let onreadystatechange = xhr.onreadystatechange;
                xhr.onreadystatechange = (ev: Event) => {
                    if (xhr.readyState === 4) {
                        if (xhr.status === 200) {
                            resolve(xhr.response);
                        } else {
                            reject(xhr.response);
                        }
                    }
                    if (onreadystatechange)
                        onreadystatechange.call(xhr, ev);
                };

            }


            try {
                init();    
                xhr.open('GET', url, true);
                xhr.send();   
            } catch (error) {
                reject(error);
            }
        
        });
    }


    public postData(url: string, options?: IRequestOptions): Promise<any> {
        return new Promise((resolve, reject) => {
            let  xhr: XMLHttpRequest = new XMLHttpRequest();
            let formData: FormData = new FormData();
            let init = () => {
                if (options) {
                    HttpHelper.initEvents(xhr, options)
                    HttpHelper.initFormData(formData, options.args);
                
                }

                let onreadystatechange = xhr.onreadystatechange;
                xhr.onreadystatechange = (ev: Event) => {
                    if (xhr.readyState === 4) {
                        if (xhr.status === 200) {
                            resolve(xhr.response);
                        } else {
                            reject(xhr.response);
                        }
                    }
                    if (onreadystatechange)
                        onreadystatechange.call(xhr, ev);
                };

            }


            try {
                init();
                xhr.open('POST', url, true);
                xhr.send(formData);                     
            } catch (error) {
                reject(error);
            }

        });
    }

    
}
