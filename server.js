#!/usr/bin/env node

'use strict';
var port = 9998;
var localdatapath = './data/';
var datapath;
var express = require('express');
var app = express();

var http = require('http').Server(app);
var io = require('socket.io')(http);

var fs = require('fs');
var glob = require("glob")
var addon = require('InspectorWidgetProcessor');
var processor = new addon.InspectorWidgetProcessor();
var path = require('path');

function isPathWritable(path) {
    try {
        fs.accessSync(path, fs.W_OK);
        return true;
    }
    catch (e) {
        return false;
    }
}

console.log('Usage: optional argument for setting data path: --datapath=')

if (process.argv.length >= 2 && process.argv[process.argv.length-1].toString().startsWith('--datapath=') ){
  var datapatharg = process.argv[process.argv.length-1].toString()
   var datapathcheck = datapatharg.split('--datapath=')
   if(datapathcheck.length === 2){
     var path = datapathcheck[1];
     if(isPathWritable(path)){
        datapath = path;
        console.log('Using data path',datapath);
     }
     else{
       console.log('Desired data path not writable',path);
       return;
     }
   }
   else{
     console.log('Wrong data path argument',datapatharg)
     return;
   }
}

if (datapath === undefined || datapath === null) {
    var home = process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME'];
    var path = path.resolve.apply(path.resolve, [home].concat('Movies'));
    console.log('path', path)
    if (isPathWritable(path)) {
        glob(path + "/Dummy.json", {
            cwd: path
        }, function (er, files) {
            if (files.length === 0) {
                var encoding = 'utf8';
                var content = '';
                fs.writeFileSync(path + "/Dummy.json", content, encoding);
            }
        })
        datapath = path;
    }
}

/// Make sure the data path has a Dummy.json file.
/// (currently required for how we use amalia.js)
if (isPathWritable(datapath)) {
    glob(datapath + "/Dummy.json", {
        cwd: datapath
    }, function (er, files) {
        if (files.length === 0) {
            var encoding = 'utf8';
            var content = '';
            fs.writeFileSync(datapath + "/Dummy.json", content, encoding);
        }
    })
}

app.use('/bower_components', express.static(__dirname + '/bower_components'))
app.use('/node_modules', express.static(__dirname + '/node_modules'))
app.use('/css', express.static(__dirname + '/css'))
app.use('/js', express.static(__dirname + '/js'))
app.use('/build', express.static(__dirname + '/build'))
app.use('/data/', express.static(datapath))
app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});
io.on('connection', function (socket) {
    console.log('user connected');
    socket.on('disconnect', function () {
        console.log('user disconnected');
    });
    socket.on('run', function (id, code, done) {
        function buffer_done(id, err, result) {
            glob(id + "/*-segments.json", {
                cwd: datapath
            }, function (er, files) {
                console.log(er, files)
                if (files) {
                    var annotations = [];
                    files.forEach(function (file) {
                        var stem = file.split('/').pop().split('.').reverse().pop();
                        var hyphens = stem.split('-');
                        var type = hyphens.pop();
                        var label = hyphens.pop();
                        var annotation = {
                            name: label
                            , segment: true
                            , overlay: false
                            , type: 'cv:tm'
                        }
                        annotations = annotations.concat(annotation);
                    });
                    done(id, '', annotations);
                }
                else {
                    done(id, er, '');
                }
            })
        }
        processor.run(datapath + '/' + id + '/', id + '.mp4', code, buffer_done);
    });
    socket.on('status', function (id, done) {
        processor.status(id, done);
    });
    socket.on('annotationStatus', function (id, names, done) {
        processor.annotationStatus(id, names, done);
    });
    socket.on('accessibilityHover', function (id, time, x, y, done) {
        processor.accessibilityHover(id, time, x, y, done);
    });
    socket.on('abort', function (id) {
        processor.abort(id);
    });
    socket.on('ids', function (done) {
        glob("*/*.mp4", {
            cwd: datapath
        }, function (er, files) {
            console.log(er, files)
            var ids = [];
            if (files) {
                files.forEach(function (file) {
                    var id = file.split('/')[0];
                    console.log('Available project file', id)
                    ids = ids.concat(id)
                })
                done('', ids);
            }
            console.log('ids', ids)
        })
    });
    socket.on('annotations', function (id, done) {
        glob(id + "/*-segments.json", {
            cwd: datapath
        }, function (er, files) {
            console.log(er, files)
            if (files) {
                done('', files);
            }
            else {
                done(er, '');
            }
        })
    });
    socket.on('isAXAvailable', function (id, done) {
        glob(id + "/" + id + ".xml", {
            cwd: datapath
        }, function (er, files) {
            console.log(er, files)
            if (files) {
                done('', files);
            }
            else {
                done(er, '');
            }
        })
    });
});
http.listen(port, function () {
    console.log('listening on *:' + port);
});
