var path = require('path')
let url = 'https://mdm.hk.101.com'
let p = path.resolve('http://www.baidu.com', url)
console.log(p)


var test = function(x, y, x1, y1, x2, y2) {
    let _x1 = x1, _x2 = x2, _y1 = y1, _y2 = y2;
    x1 = _x1 > _x2 ? _x2 : _x1;
    x2 = _x1 > _x2 ? _x1 : _x2;
    y1 = _y1 > _y2 ? _y2 : _y1;
    y2 = _y1 > _y2 ? _y1 : _y2;

    let z = x / y;
    let z1 = x1 / y2;
    let z2 = x2 / y1;
    if (z < z1) {
        _x1 = x / y * y2;
        _x1 = _x1 > x ? x : _x1;
        _y2 = _x1 * y / x;
        _x2 = x2 - (x1-_x1);
        _y1 = y1 - (y2 - _y2);            
    } else if (z >= z1 && z <= z2) {
        let xoff = 0;
        let yoff = 0;
        if ( x < x1) {
            xoff = x1 - x;
            yoff = y1 - y;                
        }
        _x1 = x1 - xoff;
        _x2 = x2 - xoff;
        _y1 = y1 - yoff;
        _y2 = y2 - yoff;            
    } else if (z > z2 ) {
        _y1 = x2 / x * y;
        _y1 = _y1 > y ? y : _y1;
        _x2 = _y1 * x / y;
        _x1 = x1 - (x2 - _x2);
        _y2 = y2 - (y1 - _y1);        
    }
    console.log('44444444444', [_x1, _y1, _x2, _y2]);
    return [_x1, _y1, _x2, _y2]

}