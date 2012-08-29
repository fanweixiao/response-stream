module.exports = function (stream) {
    var dst = null;
    
    var pipe = stream.pipe;
    stream.pipe = function (target) {
        if (target && target.writeHead && target.setHeader) {
            dst = target;
            if (target.statusCode === 200) {
                target.statusCode = stream.statusCode;
            }
            
            stream.__defineGetter__('statusCode', function (code) {
                return target.statusCode;
            });
            stream.__defineSetter__('statusCode', function (code) {
                target.statusCode = code;
            });
            
            proxied.forEach(function (p) {
                target[p.name].apply(target, p.arguments);
            });
            
            stream.emit('response', target);
        }
        return pipe.apply(this, arguments);
    };
    
    stream.statusCode = 200;
    
    var proxied = [];
    var methods = [
        'writeContinue', 'writeHead', 'setHeader', 'sendDate', 'getHeader',
        'removeHeader', 'addTrailers'
    ];
    methods.forEach(function (name) {
        stream[name] = function () {
            stream.emit(name, arguments);
            
            if (dst) return dst[name].apply(dst, arguments);
            proxied.push({ name : name, arguments : arguments });
        };
    });
    
    return stream;
};
