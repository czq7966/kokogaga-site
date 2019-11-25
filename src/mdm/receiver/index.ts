import * as MDM from "./mdm"
declare var process: {
    env: {
        NODE_ENV: string,
        LIBRARY_TARGET: string
    }
}
let exp: Object;
switch(process.env.LIBRARY_TARGET) {
    case 'umd':
        exp = { MDM }
        break;
    default: 
        exp = MDM;
        break;
}

export = exp;

