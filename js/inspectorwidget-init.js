var socket = io();

var timer;

socket.on('result', function(data){
    console.log('Result: ',data)
    alert('Result: '+data);
});

socket.on('error', function(msg){
    console.log('Error: ',msg)
    alert('Error: '+msg);
});

var segmentsSuffix = '-segments';
var overlaysSuffix = '-overlays';

// in:ptr <span style="color:#7b3294">Hook Events from Pointer</span> -- 
// cv:tm <span style="color:#c2a5cf">Computer Vision Template Matching</span> -- 
// cv:txt <span style="color:#a6dba0">Computer Vision Text Recognition</span> -- 
// in:key <span style="color:#008837">Hook Events from Keyboard</span> --
// nested <span style="color:#008CBA">Combined Variables</span>

function idsReceived (err, result) {
    if (err) {
        console.log('ids Error',err);
        //io.emit('error', err);
        return;
    }
    else{
        var recordings = document.getElementById('recordings');
        result.forEach(function(id){
            var option = document.createElement('option');
            option.value=id;
            option.text=id;
            recordings.appendChild(option);
        })
        //io.emit('result', result);
        return;
    }
}
socket.emit('ids',idsReceived);

inspectorWidgetAnnotationPath = function(recordingId,recordingPath,annotation,type){
    annotationSuffix = '';
    if(type === 'overlay'){
        annotationSuffix = overlaysSuffix;
    }
    if(type === 'segment'){
        annotationSuffix = segmentsSuffix;
    }
    return recordingPath + '/' + recordingId + '/json/' + recordingId + '-' + annotation.name + annotationSuffix + '.json';
}

inspectorWidgetVideoPath = function(recordingId,recordingPath){
    return recordingPath + '/' + recordingId + '/mp4/' + recordingId + '.mp4';
}

trackColor = function(annotation){
    if(annotation.type === 'in:ptr'){
        return '#7b3294';
    }
    else if(annotation.type === 'cv:tm'){
        return '#c2a5cf';
    }
    else if(annotation.type === 'cv:txt'){
        return '#a6dba0';
    }
    else if(annotation.type === 'in:key'){
        return '#008837';
    }
    else if(annotation.type === 'nested'){
        return '#008CBA';
    }
    else if(annotation.type === 'progress'){
        return 'rgb(242, 80, 80)';
    }
    else{
        return '#FFFFFF';
    }
}

inspectorWidgetListDataServices = function (recordingId,recordingPath,annotations){
    var dummyDataService = [ recordingPath + '/Dummy.json' ];
    var dataServices = [];

    if(!annotations || annotations.length === 0){
        //console.log('null annotations')
        annotations = [];
        dataServices = dummyDataService;
        return dataServices;
    }

    annotations.forEach(function(d,i){
        if(d.overlay){
            dataServices = dataServices.concat({
                protocol : "http",
                url : inspectorWidgetAnnotationPath(recordingId,recordingPath,d,'overlay'),
                // format : 'json',
                parameters : {
                    editingMode : true,
                    mainLevel : true
                }
            }
                                              );
        }
        if(d.segment){
            dataServices = dataServices.concat(
                inspectorWidgetAnnotationPath(recordingId,recordingPath,d,'segment')
            );
        }
    });
    return dataServices;

};

inspectorWidgetListDataServiced = function (recordingId,recordingPath,annotations){
    var dummyDataService = [ recordingPath + '/Dummy.json' ];
    var dataServices = [];

    if(!annotations || annotations.length === 0){
        annotations = [];
        dataServices = dummyDataService;
        return dataServices;
    }

    annotations.forEach(function(d,i){
        if(d.overlay){
            dataServices = dataServices.concat({
                protocol : "http",
                url : inspectorWidgetAnnotationPath(recordingId,recordingPath,d,'overlay'),
                // format : 'json',
                parameters : {
                    editingMode : true,
                    mainLevel : true
                }
            }
                                              );
        }
        if(d.segment){
            dataServices = dataServices.concat({
                protocol : "http",
                url : inspectorWidgetAnnotationPath(recordingId,recordingPath,d,'segment'),
                // format : 'json',
                parameters : {
                    editingMode : true,
                    mainLevel : true
                }
            }
                                              );
        }
    });
    return dataServices;

};

inspectorWidgetListLines = function (annotations){
    var listOfLines = [];

    if(!annotations || annotations.length === 0){
        annotations = [];
        return listOfLines;
    }

    annotations.forEach(function(d,i){
        if(d.segment){
            listOfLines = listOfLines.concat({
                title : d.name,
                type : 'segment',
                metadataId : d.name + '-segments',
                color : trackColor(d),
                pointNav : true
            })
        }
    });
    return listOfLines;

};

inspectorWidgetListSegments = function (annotations){
    var listOfSegments = [];

    if(!annotations || annotations.length === 0){
        annotations = [];
        return listOfSegments;
    }

    annotations.forEach(function(d,i){
        if(d.segment){
            listOfSegments = listOfSegments.concat(
                d.name + '-segments'
            )
        }
    });
    return listOfSegments;

};

inspectorWidgetInit = function (recordingId,recordingPath,annotations) {

    if(!annotations || annotations.length === 0){
        annotations = [];
        //dataServices = dummyDataService;
    }

    /*var dataServices = inspectorWidgetListDataServices(recordingId,recordingPath,annotations);
    var listOfLines = inspectorWidgetListLines(annotations);*/
    var dataServices = inspectorWidgetListDataServices(recordingId,recordingPath,[]);
    var listOfLines = [];

    var autoplay = false;    
    var settings = {
        autoplay : false,
        debug: false,
        src : inspectorWidgetVideoPath(recordingId,recordingPath),
        //controlBarClassName : "fr.ina.amalia.player.plugins.InspectorWidgetControlBarPlugin",
        controlBar : {
            sticky : true
        },
        plugins : {
            dataServices : dataServices,
            list : [
                /*{
                    'className' : 'fr.ina.amalia.player.plugins.OverlayPlugin',
                    'metadataId' : 'ColorDropper-overlays',
                    'parameters' : {
                        style : {
                            'fill' : '#3CF',
                            'strokeWidth' : 4,
                            'stroke' : '#3CF',
                            'fillOpacity' : 0,
                            'strokeDasharray' : '- '
                        }
                    }
                },*/
                {
                    'className' : 'fr.ina.amalia.player.plugins.InspectorWidgetPlugin',
                    'metadataId' : 'InspectorWidget',
                    'debug' : false,
                    'parameters' : {
                        editable: true,
                        style : {
                            'fill' : '#7b3294',
                            'strokeWidth' : 4,
                            'stroke' : '#7b3294',
                            'fillOpacity' : 0,
                            'strokeDasharray' : '-'
                        }
                    }
                },
                {
                    'className' : 'fr.ina.amalia.player.plugins.TimelinePlugin',
                    'container' : '#timeline',
                    'parameters' : {
                        editingMode : true,
                        timeaxe: true,  
                        timecursor: true,
                        timeaxeExpandable: true,
                        displayLines : listOfLines.length,
                        resizable : false,
                        lineDisplayMode : fr.ina.amalia.player.plugins.PluginBaseMultiBlocks.METADATA_DISPLAY_TYPE.STATIC,//STATIC//STATIC_DYNAMIC//DYNAMIC
                        listOfLines : listOfLines
                    }
                }
            ]
        }

    };

    var f = $( "#defaultPlayer" ).mediaPlayer( settings );
    resizePlayerHeight($('#player').height());

    f.on(fr.ina.amalia.player.PlayerEventType.STARTED, {
        self: f
    },
         function(){
        inspectorWidgetAddAnnotations(recordingId,recordingPath,annotations)
        resizePlayerHeight($(document).height()-$('#timeline').height());
    });

};

inspectorWidgetFindPlugin = function (pluginClass) {
    var player = $( ".ajs" ).data('fr.ina.amalia.player');//.player.pluginManager.plugins;
    if(!player){
        console.log('Could not access amalia.js player');
        return null;
    }

    var pluginList = player.player.pluginManager.plugins;
    if(!pluginList){
        console.log('Could not access amalia.js plugin list');
        return null;
    }

    for(var i=0; i<pluginList.length; i++) {
        if (pluginList[i].namespace == "fr.ina.amalia.player.plugins."+ pluginClass) return pluginList[i];
    }
    return null;
};


inspectorWidgetRemoveAnnotations = function (recordingId,recordingPath,annotations) {

    var timelinePlugin = inspectorWidgetFindlinePlugin('TimelinePlugin');
    if(!timelinePlugin){
        console.log('Could not access amalia.js timeline plugin');
        return;
    }

    var fields = [timelinePlugin.listOfComponents,
                  timelinePlugin.settingsListOfComponents,
                  timelinePlugin.settings.listOfLines,
                  timelinePlugin.managedMetadataIds,
                  timelinePlugin.notManagedMetadataIds
                 ];
    function removeMetadataId(fields,metadataId){
        fields.forEach(function(field){
            //console.log('field',field);
            field.reverse().forEach(function(d,i){
                //console.log('field',d);
                if(typeof(d) === 'string' && d === metadataId){
                    field.splice(i,1)
                }
                else if(typeof(d) === 'object' && 'metadataId' in d && d.metadataId === metadataId){
                    field.splice(i,1)
                }
            })
        })
    }

    annotations.forEach(function(annotation) {
        var deleteMetadataId = annotation.name + '-segments';

        var managedMetadataIds = timelinePlugin.managedMetadataIds.length;
        if(timelinePlugin.isManagedMetadataId(deleteMetadataId) !== -1){
            timelinePlugin.deleteComponentsWithMetadataId( deleteMetadataId );
            var _managedMetadataIds = timelinePlugin.managedMetadataIds.length;            
            if( _managedMetadataIds - managedMetadataIds === -1 ){
                timelinePlugin.displayLinesNb -= 1;
                timelinePlugin.settings.displayLines -= 1;
                removeMetadataId(fields,deleteMetadataId);
            }
        }
    });
    timelinePlugin.updateComponentsLineHeight();
};

inspectorWidgetAddAnnotations = function (recordingId,recordingPath,annotations) {

    var player = $( ".ajs" ).data('fr.ina.amalia.player');//.player.pluginManager.plugins;
    if(!player){
        console.log('Could not access amalia.js player');
        return;
    }

    var timelinePlugin = inspectorWidgetFindPlugin('TimelinePlugin');
    if(!timelinePlugin){
        console.log('Could not access amalia.js timeline plugin');
        return;
    }

    var dataServices = inspectorWidgetListDataServices(recordingId,recordingPath,annotations);

    annotations.forEach(function(d){
        var metadataId = d.name  + '-segments';
        if( timelinePlugin.isManagedMetadataId (metadataId) === false){

            var listOfLines = inspectorWidgetListLines([d]);
            timelinePlugin.createComponentsWithList(listOfLines)

            timelinePlugin.displayLinesNb += 1;
            timelinePlugin.settings.displayLines += 1;
        }
    })

    var parser = new fr.ina.amalia.player.parsers.BaseParserMetadata({});

    function loadData(url){
        var self = this;
        $.ajax({
            type: 'GET',
            url: url,
            timeout: 120000,
            data: {},
            dataType: 'json',
            success: function (data, textStatus) {
                //console.log('success')
                data = parser.processParserData(data);
                var viewControl = data.viewControl;
                var action = (data.viewControl !== null && data.viewControl.hasOwnProperty('action')) ? data.viewControl.action : '';
                player.player.updateBlockMetadata(data.id, {
                    id: data.id,
                    label: data.label,
                    type: data.hasOwnProperty('type') ? data.type : 'default',
                    author: (viewControl !== null && viewControl.hasOwnProperty('author')) ? viewControl.author : '',
                    color: (viewControl !== null && viewControl.hasOwnProperty('color')) ? viewControl.color : '#3cf',
                    shape: (viewControl !== null && viewControl.hasOwnProperty('shape') && viewControl.shape !== "") ? viewControl.shape : 'circle'
                },null);
                //console.log(data.list)
                player.player.replaceAllMetadataById(data.id, data.list);
                //resizePlayerHeight($(document).height()-$('#timeline').height());
            },
            error: function (data, textStatus) {
                console.log(url,'error',data,textStatus)
            }
        });
    }

    // pluginManager.loadData(dataServices);
    annotations.forEach(function(d,i){
        if(d.segment){
            loadData( inspectorWidgetAnnotationPath(recordingId,recordingPath,d,'segment'))
        }
        if(d.overlay){
            loadData( inspectorWidgetAnnotationPath(recordingId,recordingPath,d,'overlay'))
        }
    });

    timelinePlugin.updateComponentsLineHeight();
};

resizePlayerWidth = function(width){
    $('#playercode').width($(document).width()); 
    $('#code').width($(document).width()-width); 
    var workspace = Blockly.getMainWorkspace();
    Blockly.svgResize(workspace); 
}
resizePlayerHeight = function(height){
    //console.log(event.clientX,event.clientY,y);
    $('#playercode').height(height);
    $('#player').height(height);
    $('#defaultPlayer').height(height-$('#recording').height());
    var controlBars = $(".plugin-custom-controlbar");
    var barsHeight = 0;
    if (controlBars.length > 0){
        barsHeight += parseInt( controlBars[0].clientHeight , 10);
    }
    $('.player').height(height-$('#recording').height()-barsHeight);
    var inspectorWidgetPlugins = $(".ajs-plugin.plugin-inspectorwidget");
    inspectorWidgetPlugins = inspectorWidgetPlugins.add($(".ajs-plugin.plugin-overlay"));
    inspectorWidgetPlugins.each(function(i,plugin){
        plugin.style.top = $('#recording').height() + 'px';
        plugin.style.height = $('.player').height() + 'px';
    })
    $('#blocklyControlsDiv').height(barsHeight);
    $('#code').height(height);
    $('#blocklyDiv').height(height-$('#blocklyControlsDiv').height());
    var workspace = Blockly.getMainWorkspace();
    Blockly.svgResize(workspace); 
}

function createButton(container,id,callback,iconId){
    if(document.getElementById(id) === null){
        var button = document.createElement('a');
        button.setAttribute('id',id)
        button.setAttribute('title',id)
        button.setAttribute('onclick',callback)
        var icon = document.createElement('i');
        icon.setAttribute('class','fa ' + iconId);
        button.appendChild(icon);
        var span = document.createElement('span');
        span.appendChild(button)
        container.appendChild(span);
    }    
}

function changeRecording(id){
    if(id === ''){
        return;
    }

    function annotationsReceived(err, files) {
        if (err) {
            console.log('annotations Error',err);
            return;
        }
        else{
            $("#player").resizable({
                handles: 'e, w',
                ghost: false,
            });
            $('#player').resize(function(event,ui){
                var x = event.clientX;
                resizePlayerWidth(x); 
            })
            $("#playercode").resizable({
                handles: 's',
                ghost: false,
            }); 
            $('#playercode').resize(function(event,ui){
                var y = ui.size.height;
                resizePlayerHeight(y);
            })
            var blocklyDiv = document.getElementById('blocklyDiv');
            if(blocklyDiv !== null && blocklyDiv.childElementCount === 0){
                var workspace = Blockly.inject(blocklyDiv,
                                               {media: 'bower_components/blockly/media/',
                                                toolbox: document.getElementById('toolbox')});
                /* Enable this line to load a default annotation program */ Blockly.Xml.domToWorkspace(workspace,document.getElementById('startBlocks'));
            }

            var blocklyControls = document.getElementById('blocklyControlsDiv');

            createButton(blocklyControls,'showCode','showCode()','fa-info-circle'); 
            createButton(blocklyControls,'saveCode','saveCode()','fa-download');
            document.getElementById('saveCode').setAttribute('download','InspectorWidget.xml');
            createButton(blocklyControls,'runCode','runCode()','fa-play'); 
            createButton(blocklyControls,'abort','abort()','fa-stop');
            createButton(blocklyControls,'status','status()','fa-question-circle');

            var annotations = [];
            files.forEach(function(file){
                var stem = file.split('/').pop().split('.').reverse().pop();
                var hyphens = stem.split('-');
                var type = hyphens.pop();
                var label = hyphens.pop();
                var annotation = {
                    name: label,
                    segment: true,
                    overlay: true,
                    type: 'cv:tm'
                }
                annotations = annotations.concat(annotation);

            });
            var recordingPath = '/data/';
            inspectorWidgetInit(id,recordingPath,annotations);
        }
    }
    socket.emit('annotations',id,annotationsReceived);
}

function showCode() {
    var workspace = Blockly.getMainWorkspace(); 
    // Generate JavaScript code and display it.
    Blockly.JavaScript.INFINITE_LOOP_TRAP = null;
    var code = Blockly.JavaScript.workspaceToCode(workspace);
    alert(code);
}

function status() {

    var recordings = document.getElementById('recordings');
    var recordingId = recordings.value;
    function done (id,err,result,phase,progress) {
        if (err) {
            console.log('Error',err);
            //io.emit('error', err);
            return;
        }
        else{
            console.log('Result',result);
            //io.emit('result', result);
            return;
        }
    }
    if(socket.connected === false){
        alert('InspectorWidgetProcessor server disconnected.');
        return; 
    }
    socket.emit('status',recordingId,done);

}

function runCode() {
    var workspace = Blockly.getMainWorkspace();
    var recordings = document.getElementById('recordings');
    var recordingId = recordings.value;

    function updateAnnotation(template) {
        function statusDone(id, err, result, phase, progress) {
            var currentTime = progress * duration;
            var currentTS = fr.ina.amalia.player.helpers.UtilitiesHelper.formatTime(currentTime, fps, 'mms')
            if (err !== null && progress > 0) {
                result = JSON.parse(result);
                var data;
                if ('localisation' in result && result.localisation.length === 1 && 'sublocalisations' in result.localisation[0] && 'localisation' in result.localisation[0].sublocalisations) {
                    data = result;
                }
                else {
                    data = {
                        "localisation": [
                            {
                                "sublocalisations": {
                                    "localisation": [
                                        /*{
                                            "label": template
                                            , "tcin": currentTS
                                            , "tcout": durationTS
                                            , "tclevel": 1.0
                                        }*/
                                    ]
                                }
                                , "type": "segments"
                                , "tcin": "00:00:00.0000"
                                , "tcout": durationTS
                                , "tclevel": 0.0
                            }
                        ]
                        , "id": template + "-segments"
                        , "type": "segments"
                        , "algorithm": "InspectorWidget Progress Bar"
                        , "processor": "University of Mons - Christian Frisson"
                        , "processed": 11421141589286
                        , "version": 1.0
                    };
                }
                if(progress<1){
                data.localisation[0].sublocalisations.localisation = data.localisation[0].sublocalisations.localisation.concat({
                    "label": template
                    , "tcin": currentTS
                    , "tcout": durationTS
                    , "tclevel": 1.0
                });
                }
                data = parser.processParserData(data);
                var viewControl = data.viewControl;
                var action = (data.viewControl !== null && data.viewControl.hasOwnProperty('action')) ? data.viewControl.action : '';
                player.player.updateBlockMetadata(data.id, {
                    id: data.id
                    , label: data.label
                    , type: data.hasOwnProperty('type') ? data.type : 'default'
                    , author: (viewControl !== null && viewControl.hasOwnProperty('author')) ? viewControl.author : ''
                    , color: (viewControl !== null && viewControl.hasOwnProperty('color')) ? viewControl.color : '#3cf'
                    , shape: (viewControl !== null && viewControl.hasOwnProperty('shape') && viewControl.shape !== "") ? viewControl.shape : 'circle'
                }, null);
                player.player.replaceAllMetadataById(data.id, data.list);
            }
        }
        socket.emit('annotationStatus', recordingId, template, statusDone);
    }
    if (socket.connected === false) {
        alert('InspectorWidgetProcessor server disconnected.');
        return;
    }
    // Generate JavaScript code and run it.
    /*window.LoopTrap = 1000;
                        Blockly.JavaScript.INFINITE_LOOP_TRAP =
                            'if (--window.LoopTrap == 0) throw "Infinite loop.";\n';*/
    var code = Blockly.JavaScript.workspaceToCode(workspace);
    /*Blockly.JavaScript.INFINITE_LOOP_TRAP = null;
                        try {
                            eval(code);
                        } catch (e) {
                            alert(e);
                        }*/
    $('#runCode')[0].disabled = true;
    $('#abort')[0].disabled = false;
    var timelinePlugin = inspectorWidgetFindPlugin('TimelinePlugin');
    if (!timelinePlugin) {
        console.log('Could not access amalia.js timeline plugin');
        return;
    }
    var player = $(".ajs").data('fr.ina.amalia.player'); //.player.pluginManager.plugins;
    if (!player) {
        console.log('Could not access amalia.js player');
        return;
    }
    var parser = new fr.ina.amalia.player.parsers.BaseParserMetadata({});
    var templates = [];
    var blocks = workspace.getAllBlocks();
    blocks.forEach(function (block) {
        if (block.type === "template_set") {
            var template = block.getFieldValue('VAR');
            templates = templates.concat(template);
            var metadataId = template + '-segments';
            if (timelinePlugin.isManagedMetadataId(metadataId) === false) {
                var d = {
                    name: template
                    , segment: true
                    , overlay: false
                    , type: 'progress'
                }
                var listOfLines = inspectorWidgetListLines([d]);
                timelinePlugin.createComponentsWithList(listOfLines)
                timelinePlugin.displayLinesNb += 1;
                timelinePlugin.settings.displayLines += 1;
                updateAnnotation(template)
            }
        }
    });
    timelinePlugin.updateComponentsLineHeight();
    resizePlayerHeight($(document).height() - $('#timeline').height());

    function runDone(id, err, result) {
        clearInterval(timer);
        $('#runCode')[0].disabled = false;
        $('#abort')[0].disabled = true;
        if (err) {
            console.log('Error', err);
            return;
        }
        else {
            templates.forEach(function (template) {
                updateAnnotation(template);
            })
            return;
        }
    }
    socket.emit('run', recordingId, code, runDone);
    var duration = $(".ajs").data('fr.ina.amalia.player').player.getDuration();
    var fps = $(".ajs").data('fr.ina.amalia.player').player.settings.framerate;
    var durationTS = fr.ina.amalia.player.helpers.UtilitiesHelper.formatTime(duration, fps, 'mms');
    timer = setInterval(function () {
            //console.log('templates', templates, 'duration', duration)
            templates.forEach(function (template) {
                updateAnnotation(template);
            })
        }, 10) // milliseconds
}

function saveCode() {
    // Generate JavaScript code and export it.
    var workspace = Blockly.getMainWorkspace();
    var xml = Blockly.Xml.workspaceToDom(workspace);
    var code = Blockly.Xml.domToText(xml);

    var serializer = new XMLSerializer();
    var source = serializer.serializeToString(xml);

    //Optional: prettify the XML with proper indentations
    source = vkbeautify.xml(source);
    //convert svg source to URI data scheme.
    var url = "data:xml/xml;charset=utf-8,"+encodeURIComponent(source);

    //set url value to a element's href attribute.
    document.getElementById("saveCode").href = url;
}

function abort() {
    var recordings = document.getElementById('recordings');
    var recordingId = recordings.value;
    clearInterval(timer);
    $('#runCode')[0].disabled = false;
    $('#abort')[0].disabled = true;
    socket.emit('abort',recordingId);
}