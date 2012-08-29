var test = require('tap').test;
var responseStream = require('../');

var http = require('http');
var es = require('event-stream');
var filed = require('filed');

var fs = require('fs');
var fileContents = fs.readFileSync(__dirname + '/data.txt');

test('filed response', function (t) {
    t.plan(2);
    
    var port = Math.floor(Math.random() * 5e4 + 1e4);
    var server = http.createServer(function (req, res) {
        filed(__dirname + '/data.txt')
            .pipe(capStream())
            .pipe(res)
        ;
    });
    server.listen(port);
    
    server.on('listening', function () {
        var opts = {
            host : 'localhost',
            port : port,
            path : '/'
        };
        http.get(opts, function (res) {
            var data = '';
            res.on('data', function (buf) { data += buf });
            res.on('end', function () {
                t.equal(data, String(fileContents).toUpperCase());
                t.equal(
                    Number(res.headers['content-length']),
                    fileContents.length
                );
            });
        });
    });
    
    t.on('end', function () {
        server.close();
    });
    
    function capStream () {
        var s = responseStream(es.mapSync(function (s) {
            return String(s).toUpperCase()
        }));
        return s;
    }
});
