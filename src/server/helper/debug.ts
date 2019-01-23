export class Debug {
    public static enabled = false;
    public static log(...args: any[]) {
        this.enabled && console.log(...args);
    }
    public static dir(...args: any[]) {
        this.enabled && console.dir(...args);
    }
    public static trace(...args: any[]) {
        this.enabled && console.trace(...args);
    }
    public static error(...args: any[]) {
        this.enabled && console.error(...args)
    }
    
}