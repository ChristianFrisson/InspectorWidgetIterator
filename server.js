#!/usr/bin/env node

'use strict';

var port = 9998;
var localdatapath = './data/';
var datapath;
var ids = [];

var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var fs = require('fs');
var glob = require("glob")
var addon = require('InspectorWidgetProcessor');
var processor = new addon.InspectorWidgetProcessor();

function isPathWritable(path){
    try {
        fs.accessSync(path, fs.W_OK);
        return true;
    } catch (e) {
        return false;
    }
}
if(process.argv.length === 3){
    var arg = process.argv[2];
    if(isPathWritable(arg)){
        glob(arg+"/Dummy.json", {cwd : arg}, function (er, files) {
            if(files.length === 0){
                var encoding = 'utf8';
                var content = fs.readFileSync(localdatapath+"/Dummy.json", encoding);
                fs.writeFileSync(arg+"/Dummy.json", content, encoding);
            }  
        })
        datapath = arg;
    }
}
else{
    console.log("Please specify the data path as only argument")
    return;
}

app.use('/bower_components', express.static(__dirname + '/bower_components'))
app.use('/css', express.static(__dirname + '/css'))
app.use('/js', express.static(__dirname + '/js'))
app.use('/build', express.static(__dirname + '/build'))
app.use('/data/', express.static(datapath))

app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});

glob("*/mp4/*.mp4", {cwd : datapath}, function (er, files) {
    console.log(er,files)
    if(files){
        files.forEach(function(file){
            var id = file.split('/')[0];
            console.log('Available project file',id)
            ids = ids.concat(id)
        })
    }
    console.log('ids',ids)
})

io.on('connection', function(socket){
    console.log('user connected');
    socket.on('disconnect', function(){
        console.log('user disconnected');
    });
    socket.on('run', function(id,code,done){
        function buffer_done(id,err,result){
            glob(id+"/json/*-segments.json", {cwd : datapath}, function (er, files) {
            console.log(er,files)
            if(files){
                var annotations = [];
                files.forEach(function(file){
                var stem = file.split('/').pop().split('.').reverse().pop();
                var hyphens = stem.split('-');
                var type = hyphens.pop();
                var label = hyphens.pop();
                var annotation = {
                    name: label,
                    segment: true,
                    overlay: false,
                    type: 'cv:tm'
                }
                annotations = annotations.concat(annotation);
                });
                done(id,'',annotations);
            }
            else{
                done(id,er,'');
            }
        })
        }
        processor.run(datapath + '/' + id + '/mp4/' ,id+'.mp4',code,buffer_done);
    });
    socket.on('status', function(id,done){
        processor.status(id,done);
    });
    socket.on('annotationStatus', function(id,names,done){
        processor.annotationStatus(id,names,done);
    });
    socket.on('accessibilityUnderMouse', function(id,time,x,y,done){
        processor.accessibilityUnderMouse(id,time,x,y,done);
    });
    socket.on('abort', function(id){
        processor.abort(id);
    });
    socket.on('ids',function(done){
        done('',ids);
    });
    socket.on('annotations',function(id,done){
        glob(id+"/json/*-segments.json", {cwd : datapath}, function (er, files) {
            console.log(er,files)
            if(files){
                done('',files);
            }
            else{
                done(er,'');
            }
        })
    });
    socket.on('isAXAvailable',function(id,done){
        glob(id+"/xml/"+id+".xml", {cwd : datapath}, function (er, files) {
            console.log(er,files)
            if(files){
                done('',files);
            }
            else{
                done(er,'');
            }
        })
    });
});

http.listen(port, function(){
    console.log('listening on *:'+port);
});