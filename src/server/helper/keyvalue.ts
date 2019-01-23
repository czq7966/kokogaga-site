export class KeyValue<T> {
    items: {[key: string]: T}
    constructor() {
        this.items = {}
    }
    destroy() {
        this.clear();
        delete this.items;
    }
    del(key: string) {
        let value = this.items[key];
        delete this.items[key]
        return value;
    }
    add(key: string, value: any) {
        this.items[key] = value
    }
    get(key: string): T {
        return this.items[key] as T;
    }
    exist(key: string) {
        return this.get(key) !== undefined
    }
    keys(): string[] {
        return Object.keys(this.items);
    }
    clear() {
        this.keys().forEach(key => {
            this.del(key)
        })
    }
}