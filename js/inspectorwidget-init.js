var socket = io();
var timer;
socket.on('result', function (data) {
    console.log('Result: ', data)
    alert('Result: ' + data);
});
socket.on('error', function (msg) {
    console.log('Error: ', msg)
    alert('Error: ' + msg);
});
var segmentsSuffix = '-segments';
var overlaysSuffix = '-overlays';
// in:ptr <span style="color:#7b3294">Hook Events from Pointer</span> -- 
// cv:tm <span style="color:#c2a5cf">Computer Vision Template Matching</span> -- 
// cv:txt <span style="color:#a6dba0">Computer Vision Text Recognition</span> -- 
// in:key <span style="color:#008837">Hook Events from Keyboard</span> --
// nested <span style="color:#008CBA">Combined Variables</span>
function idsReceived(err, result) {
    if (err) {
        console.log('ids Error', err);
        //io.emit('error', err);
        return;
    }
    else {
        var recordings = document.getElementById('recordings');
        result.forEach(function (id) {
                var option = document.createElement('option');
                option.value = id;
                option.text = id;
                recordings.appendChild(option);
            })
            //io.emit('result', result);
        return;
    }
}
socket.emit('ids', idsReceived);
inspectorWidgetAnnotationPath = function (recordingId, recordingPath, annotation, type) {
    annotationSuffix = '';
    if (type === 'overlay') {
        annotationSuffix = overlaysSuffix;
    }
    if (type === 'segment') {
        annotationSuffix = segmentsSuffix;
    }
    return recordingPath + '/' + recordingId + '/json/' + recordingId + '-' + annotation.name + annotationSuffix + '.json';
}
inspectorWidgetVideoPath = function (recordingId, recordingPath) {
    return recordingPath + '/' + recordingId + '/mp4/' + recordingId + '.mp4';
}
trackColor = function (annotation) {
    if (annotation.source === 'input_events') {
        return '#8ca55b'; // '#c2a5cf'
    }
    else if (annotation.source === 'computer_vision') {
        return '#704984'; // '#a6dba0'
    }
    else if (annotation.source === 'accessibility') {
        return '#496684';
    }
    else if (annotation.source === 'progress') {
        return 'rgb(242, 80, 80)';
    }
    else {
        return '#FFFFFF';
    }
}
inspectorWidgetListDataServices = function (recordingId, recordingPath, annotations) {
    var dummyDataService = [recordingPath + '/Dummy.json'];
    var dataServices = [];
    if (!annotations || annotations.length === 0) {
        //console.log('null annotations')
        annotations = [];
        dataServices = dummyDataService;
        return dataServices;
    }
    annotations.forEach(function (d, i) {
        if (d.overlay) {
            dataServices = dataServices.concat({
                protocol: "http"
                , url: inspectorWidgetAnnotationPath(recordingId, recordingPath, d, 'overlay'), // format : 'json',
                parameters: {
                    editingMode: true
                    , mainLevel: true
                }
            });
        }
        if (d.segment) {
            dataServices = dataServices.concat(inspectorWidgetAnnotationPath(recordingId, recordingPath, d, 'segment'));
        }
    });
    return dataServices;
};
inspectorWidgetListDataServiced = function (recordingId, recordingPath, annotations) {
    var dummyDataService = [recordingPath + '/Dummy.json'];
    var dataServices = [];
    if (!annotations || annotations.length === 0) {
        annotations = [];
        dataServices = dummyDataService;
        return dataServices;
    }
    annotations.forEach(function (d, i) {
        if (d.overlay) {
            dataServices = dataServices.concat({
                protocol: "http"
                , url: inspectorWidgetAnnotationPath(recordingId, recordingPath, d, 'overlay'), // format : 'json',
                parameters: {
                    editingMode: true
                    , mainLevel: true
                }
            });
        }
        if (d.segment) {
            dataServices = dataServices.concat({
                protocol: "http"
                , url: inspectorWidgetAnnotationPath(recordingId, recordingPath, d, 'segment'), // format : 'json',
                parameters: {
                    editingMode: true
                    , mainLevel: true
                }
            });
        }
    });
    return dataServices;
};
inspectorWidgetListLines = function (annotations) {
    var listOfLines = [];
    if (!annotations || annotations.length === 0) {
        annotations = [];
        return listOfLines;
    }
    annotations.forEach(function (d, i) {
        if (d.segment) {
            listOfLines = listOfLines.concat({
                title: d.name
                , type: 'segment'
                , metadataId: d.name + '-segments'
                , color: trackColor(d)
            })
        }
        else if (d.event) {
            listOfLines = listOfLines.concat({
                title: d.name
                , type: 'cuepoint'
                , metadataId: d.name + '-events'
                , color: trackColor(d)
                , pointNav: true
            })
        }
    });
    return listOfLines;
};
inspectorWidgetListSegments = function (annotations) {
    var listOfSegments = [];
    if (!annotations || annotations.length === 0) {
        annotations = [];
        return listOfSegments;
    }
    annotations.forEach(function (d, i) {
        if (d.segment) {
            listOfSegments = listOfSegments.concat(d.name + '-segments')
        }
    });
    return listOfSegments;
};

function createAccessibilityBlock(variable, mode) {
    var block = document.createElement('block');
    block.setAttribute('type', "accessibility_actions");
    var mutation = document.createElement('mutation');
    mutation.setAttribute('input_', mode);
    block.appendChild(mutation);
    var fieldVar = document.createElement('field');
    fieldVar.setAttribute("name", "VAR");
    fieldVar.textContent = variable;
    block.appendChild(fieldVar);
    var fieldMode = document.createElement('field');
    fieldMode.setAttribute("name", "MODE");
    fieldMode.textContent = mode;
    block.appendChild(fieldMode);
    return block;
}

function updateAnnotations(recordingId, annotations) {
    function statusDone(id, err, results, phase, progress) {
        var timelinePlugin = inspectorWidgetFindPlugin('TimelinePlugin');
        if (!timelinePlugin) {
            console.log('Could not access amalia.js timeline plugin');
            return;
        }
        var player = $(".ajs").data('fr.ina.amalia.player');
        if (!player) {
            console.log('Could not access amalia.js player');
            return;
        }
        var parser = new fr.ina.amalia.player.parsers.BaseParserMetadata({});
        var duration = $(".ajs").data('fr.ina.amalia.player').player.getDuration();
        var fps = $(".ajs").data('fr.ina.amalia.player').player.settings.framerate;
        var durationTS = fr.ina.amalia.player.helpers.UtilitiesHelper.formatTime(duration, fps, 'mms');
        var currentTime = progress * duration;
        var currentTS = fr.ina.amalia.player.helpers.UtilitiesHelper.formatTime(currentTime, fps, 'mms')
        if (err !== null) {
            results.forEach(function (result) {
                result = JSON.parse(result);
                var data;
                if ('localisation' in result && result.localisation.length === 1 && 'sublocalisations' in result.localisation[0] && 'localisation' in result.localisation[0].sublocalisations) {
                    data = result;
                    var metadataId = result.id;
                    var name = result.id.split('-')[0];
                    var type = result.id.split('-')[1];
                    var source = result.source;
                    /// Add annotation to timeline if not yet there
                    if (timelinePlugin.isManagedMetadataId(metadataId) === false) {
                        var d = {
                            name: name
                            , segment: type === "segments"
                            , overlay: false
                            , event: type === "events"
                            , source: source
                        }
                        var listOfLines = inspectorWidgetListLines([d]);
                        timelinePlugin.createComponentsWithList(listOfLines)
                        timelinePlugin.displayLinesNb += 1;
                        timelinePlugin.settings.displayLines += 1;
                        timelinePlugin.updateComponentsLineHeight();
                        resizePlayerHeight($('#window').height() - $('#timeline').height());
                    }
                    if (progress < 1 && progress !== 0) {
                        data.localisation[0].sublocalisations.localisation = data.localisation[0].sublocalisations.localisation.concat({
                            "label": name
                            , "tcin": currentTS
                            , "tcout": durationTS
                            , "tclevel": 1.0
                            , "color": '#00ccff'
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
            });
        }
    }
    socket.emit('annotationStatus', recordingId, annotations, statusDone);
}
inspectorWidgetInit = function (recordingId, recordingPath, annotations) {
    if (!annotations || annotations.length === 0) {
        annotations = [];
        //dataServices = dummyDataService;
    }
    /*var dataServices = inspectorWidgetListDataServices(recordingId,recordingPath,annotations);
    var listOfLines = inspectorWidgetListLines(annotations);*/
    var dataServices = inspectorWidgetListDataServices(recordingId, recordingPath, []);
    var listOfLines = [];
    var autoplay = false;
    var settings = {
        autoplay: false
        , debug: false
        , src: inspectorWidgetVideoPath(recordingId, recordingPath), //controlBarClassName : "fr.ina.amalia.player.plugins.InspectorWidgetControlBarPlugin",
        controlBar: {
            sticky: true
        }
        , plugins: {
            dataServices: dataServices
            , list: [
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
                    'className': 'fr.ina.amalia.player.plugins.InspectorWidgetPlugin'
                    , 'metadataId': 'InspectorWidget'
                    , 'debug': false
                    , 'parameters': {
                        editable: true
                        , style: {
                            'fill': '#7b3294'
                            , 'strokeWidth': 4
                            , 'stroke': '#7b3294'
                            , 'fillOpacity': 0
                            , 'strokeDasharray': '-'
                        }
                    }
                }
                , {
                    'className': 'fr.ina.amalia.player.plugins.TimelinePlugin'
                    , 'container': '#timeline'
                    , 'parameters': {
                        editingMode: true
                        , timeaxe: true
                        , timecursor: true
                        , timeaxeExpandable: true
                        , displayLines: listOfLines.length
                        , resizable: false
                        , lineDisplayMode: fr.ina.amalia.player.plugins.PluginBaseMultiBlocks.METADATA_DISPLAY_TYPE.STATIC, //STATIC//STATIC_DYNAMIC//DYNAMIC
                        listOfLines: listOfLines
                    }
                }
            ]
        }
    };
    var f = $("#defaultPlayer").mediaPlayer(settings);
    resizePlayerHeight($('#window').height() - $("#timeline").height());
    f.on(fr.ina.amalia.player.PlayerEventType.STARTED, {
        self: f
    }, function () {
        inspectorWidgetAddAnnotations(recordingId, recordingPath, annotations)
        resizePlayerHeight($('#window').height() - $('#timeline').height());

        function axAvailable(err, files) {
            if (err) {
                alert('No accessibility information available')
                return;
            }
            else {
                /// Accessibility on mouse hover
                inspectorWidgetPlugin = inspectorWidgetFindPlugin('InspectorWidgetPlugin');
                if (!inspectorWidgetPlugin) {
                    console.log('Could not access amalia.js InspectorWidget plugin');
                    return;
                }

                function onMouseMove(event) {
                    var videoSize = event.data.self.getVideoSize();
                    var player = event.data.self.mediaPlayer.getMediaPlayer();
                    var l = (player.width() - videoSize.w) / 2;
                    var t = (player.height() - videoSize.h) / 2;
                    var w = videoSize.w;
                    var h = videoSize.h;
                    var rect = event.currentTarget.getBoundingClientRect();
                    var x = event.clientX - rect.left;
                    var y = event.clientY - rect.top;
                    /// Handle accessibility on hover
                    if (x - l > 0 && y - t > 0 && x - l < w && y - t < h && inspectorWidgetPlugin.doDraw === false) {
                        var time = event.data.self.mediaPlayer.getCurrentTime();

                        function accessibilityUnderMouseReceived(id, err, x, y, w, h) {
                            x = parseFloat(x);
                            y = parseFloat(y);
                            w = parseFloat(w);
                            h = parseFloat(h);
                            inspectorWidgetPlugin = inspectorWidgetFindPlugin('InspectorWidgetPlugin');
                            if (!inspectorWidgetPlugin) {
                                console.log('Could not access amalia.js InspectorWidget plugin');
                                return;
                            }
                            var videoSize = inspectorWidgetPlugin.getVideoSize();
                            inspectorWidgetPlugin.drawingHandler.show();
                            inspectorWidgetPlugin.drawingHandler.toFront();
                            inspectorWidgetPlugin.drawingHandler.doDraw.startX = x * videoSize.w;
                            inspectorWidgetPlugin.drawingHandler.doDraw.startY = y * videoSize.h;
                            inspectorWidgetPlugin.drawingHandler.doDraw.endX = (x + w) * videoSize.w;
                            inspectorWidgetPlugin.drawingHandler.doDraw.endY = (y + h) * videoSize.h;
                            inspectorWidgetPlugin.drawingHandler.attr('width', w * videoSize.w);
                            inspectorWidgetPlugin.drawingHandler.attr('height', h * videoSize.h);
                            inspectorWidgetPlugin.drawingHandler.attr('x', inspectorWidgetPlugin.drawingHandler.doDraw.startX);
                            inspectorWidgetPlugin.drawingHandler.attr('y', inspectorWidgetPlugin.drawingHandler.doDraw.startY);
                            inspectorWidgetPlugin.drawingHandler.attr('fill', '#3cf');
                            inspectorWidgetPlugin.drawingHandler.attr('fill-opacity', '0.3');
                        }
                        socket.emit('accessibilityUnderMouse', recordingId, time, (x - l) / w, (y - t) / h, accessibilityUnderMouseReceived);
                    }
                    /// Handle template annotation
                    if (event.data.self.drawing === true) {
                        var endX = Math.max(0, event.offsetX);
                        var endY = Math.max(0, event.offsetY);
                        var width = Math.max(0, endX - event.data.self.drawingHandler.doDraw.startX);
                        var height = Math.max(0, endY - event.data.self.drawingHandler.doDraw.startY);
                        event.data.self.drawingHandler.doDraw.endX = endX;
                        event.data.self.drawingHandler.doDraw.endY = endY;
                        event.data.self.drawingHandler.attr('width', width);
                        event.data.self.drawingHandler.attr('height', height);
                    }
                };
                inspectorWidgetPlugin.container.on('mousemove', {
                    self: inspectorWidgetPlugin
                }, onMouseMove);
                inspectorWidgetPlugin.container.on('mouseleave', {
                    self: inspectorWidgetPlugin
                }, function (event) {
                    event.data.self.drawingHandler.hide();
                });
                /// Try to load basic accessibility annotations
                //var loadAx = confirm('Accessibility information available. Do you want to load it?');
                //if (loadAx == true) {
                var accessibilityAnnotationDefinitions = [
                    {
                        'name': 'AXFocusApplication'
                        , 'mode': 'getFocusApplication'
                    }
                    , {
                        'name': 'AXFocusWindow'
                        , 'mode': 'getFocusWindow'
                    }
                    , {
                        'name': 'AXPointedWidget'
                        , 'mode': 'getPointedWidget'
                    }
                    , {
                        'name': 'AXWorkspaceSnapshot'
                        , 'mode': 'getWorkspaceSnapshot'
                    }
                ];
                /// Generate annotation definition syntax for InspectorWidgetProcessor
                var accessibilityAnnotationDefinition = '';
                accessibilityAnnotationDefinitions.forEach(function (d) {
                    accessibilityAnnotationDefinition += d.name + '=' + d.mode + '();\n';
                });
                /// Generate annotation blocks and add them to the blockly workspace
                var accessibilityAnnotationBlocks;
                var previousBlock;
                var previousNext;
                accessibilityAnnotationDefinitions.reverse().forEach(function (d, i) {
                    var currentBlock = createAccessibilityBlock(d.name, d.mode);
                    var currentNext = document.createElement('next');
                    if (i > 0) {
                        currentNext.appendChild(previousBlock);
                        currentBlock.appendChild(currentNext);
                    }
                    previousBlock = currentBlock;
                    previousNext = currentNext;
                });
                var startBlocks = document.getElementById('startBlocks');
                startBlocks.appendChild(previousBlock);
                var workspace = Blockly.getMainWorkspace();
                Blockly.Xml.domToWorkspace(workspace, startBlocks);
                function accessibilityAnnotationDone(id, err, result) {
                    var accessibilityAnnotations = ["AXFocusApplication", "AXFocusWindow", "AXPointedWidget", "AXWorkspaceSnapshot"];
                    updateAnnotations(id, accessibilityAnnotations)
                };
                socket.emit('run', recordingId, accessibilityAnnotationDefinition, accessibilityAnnotationDone);
            }
        };
        socket.emit('isAXAvailable', recordingId, axAvailable);
        //}
    });
};
inspectorWidgetFindPlugin = function (pluginClass) {
    var player = $(".ajs").data('fr.ina.amalia.player'); //.player.pluginManager.plugins;
    if (!player) {
        console.log('Could not access amalia.js player');
        return null;
    }
    var pluginList = player.player.pluginManager.plugins;
    if (!pluginList) {
        console.log('Could not access amalia.js plugin list');
        return null;
    }
    for (var i = 0; i < pluginList.length; i++) {
        if (pluginList[i].namespace == "fr.ina.amalia.player.plugins." + pluginClass) return pluginList[i];
    }
    return null;
};
inspectorWidgetRemoveAnnotations = function (recordingId, recordingPath, annotations) {
    var timelinePlugin = inspectorWidgetFindPlugin('TimelinePlugin');
    if (!timelinePlugin) {
        console.log('Could not access amalia.js timeline plugin');
        return;
    }
    var fields = [timelinePlugin.listOfComponents
                  , timelinePlugin.settingsListOfComponents
                  , timelinePlugin.settings.listOfLines
                  , timelinePlugin.managedMetadataIds
                  , timelinePlugin.notManagedMetadataIds
                 ];

    function removeMetadataId(fields, metadataId) {
        fields.forEach(function (field) {
            //console.log('field',field);
            field.reverse().forEach(function (d, i) {
                //console.log('field',d);
                if (typeof (d) === 'string' && d === metadataId) {
                    field.splice(i, 1)
                }
                else if (typeof (d) === 'object' && 'metadataId' in d && d.metadataId === metadataId) {
                    field.splice(i, 1)
                }
            })
        })
    }
    annotations.forEach(function (annotation) {
        var deleteMetadataId = annotation.name + '-segments';
        var managedMetadataIds = timelinePlugin.managedMetadataIds.length;
        if (timelinePlugin.isManagedMetadataId(deleteMetadataId) !== -1) {
            timelinePlugin.deleteComponentsWithMetadataId(deleteMetadataId);
            var _managedMetadataIds = timelinePlugin.managedMetadataIds.length;
            if (_managedMetadataIds - managedMetadataIds === -1) {
                timelinePlugin.displayLinesNb -= 1;
                timelinePlugin.settings.displayLines -= 1;
                removeMetadataId(fields, deleteMetadataId);
            }
        }
    });
    timelinePlugin.updateComponentsLineHeight();
};
inspectorWidgetAddAnnotations = function (recordingId, recordingPath, annotations) {
    var player = $(".ajs").data('fr.ina.amalia.player'); //.player.pluginManager.plugins;
    if (!player) {
        console.log('Could not access amalia.js player');
        return;
    }
    var timelinePlugin = inspectorWidgetFindPlugin('TimelinePlugin');
    if (!timelinePlugin) {
        console.log('Could not access amalia.js timeline plugin');
        return;
    }
    var dataServices = inspectorWidgetListDataServices(recordingId, recordingPath, annotations);
    annotations.forEach(function (d) {
        var metadataId = d.name + '-segments';
        if (timelinePlugin.isManagedMetadataId(metadataId) === false) {
            var listOfLines = inspectorWidgetListLines([d]);
            timelinePlugin.createComponentsWithList(listOfLines)
            timelinePlugin.displayLinesNb += 1;
            timelinePlugin.settings.displayLines += 1;
        }
    })
    var parser = new fr.ina.amalia.player.parsers.BaseParserMetadata({});

    function loadData(url) {
        var self = this;
        $.ajax({
            type: 'GET'
            , url: url
            , timeout: 120000
            , data: {}
            , dataType: 'json'
            , success: function (data, textStatus) {
                //console.log('success')
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
                //console.log(data.list)
                player.player.replaceAllMetadataById(data.id, data.list);
                resizePlayerHeight($('#window').height() - $('#timeline').height());
            }
            , error: function (data, textStatus) {
                console.log(url, 'error', data, textStatus)
            }
        });
    }
    // pluginManager.loadData(dataServices);
    annotations.forEach(function (d, i) {
        if (d.segment) {
            loadData(inspectorWidgetAnnotationPath(recordingId, recordingPath, d, 'segment'))
        }
        if (d.overlay) {
            loadData(inspectorWidgetAnnotationPath(recordingId, recordingPath, d, 'overlay'))
        }
    });
    timelinePlugin.updateComponentsLineHeight();
};
resizePlayerWidth = function (width) {
    $('#playercode').width($(document).width());
    $('#code').width($(document).width() - width);
    var workspace = Blockly.getMainWorkspace();
    Blockly.svgResize(workspace);
}
resizePlayerHeight = function (height) {
    //console.log(event.clientX,event.clientY,y);
    $('#playercode').height(height);
    $('#player').height(height);
    $('#defaultPlayer').height(height - $('#recording').height());
    var controlBars = $(".plugin-custom-controlbar");
    var barsHeight = 0;
    if (controlBars.length > 0) {
        barsHeight += parseInt(controlBars[0].clientHeight, 10);
    }
    $('.player').height(height - $('#recording').height() - barsHeight);
    var inspectorWidgetPlugins = $(".ajs-plugin.plugin-inspectorwidget");
    inspectorWidgetPlugins = inspectorWidgetPlugins.add($(".ajs-plugin.plugin-overlay"));
    inspectorWidgetPlugins.each(function (i, plugin) {
        plugin.style.top = 0 /*$('#recording').height()*/ + 'px';
        plugin.style.height = $('.player').height() + 'px';
    })
    $('#blocklyControlsDiv').height(barsHeight);
    $('#code').height(height);
    $('#blocklyDiv').height(height - $('#blocklyControlsDiv').height());
    var workspace = Blockly.getMainWorkspace();
    Blockly.svgResize(workspace);
    inspectorWidgetPlugin = inspectorWidgetFindPlugin('InspectorWidgetPlugin');
    if (!inspectorWidgetPlugin) {
        console.log('Could not access amalia.js InspectorWidget plugin');
        return;
    }
    inspectorWidgetPlugin.updateCanvasPosition();
}

function createButton(container, id, callback, iconId) {
    if (document.getElementById(id) === null) {
        var button = document.createElement('a');
        button.setAttribute('id', id)
        button.setAttribute('title', id)
        button.setAttribute('onclick', callback)
        var icon = document.createElement('i');
        icon.setAttribute('class', 'fa ' + iconId);
        button.appendChild(icon);
        var span = document.createElement('span');
        span.appendChild(button)
        container.appendChild(span);
    }
}

function changeRecording(recordingId) {
    if (recordingId === '') {
        return;
    }

    function annotationsReceived(err, files) {
        if (err) {
            console.log('annotations Error', err);
            return;
        }
        else {
            $("#player").resizable({
                handles: 'e, w'
                , ghost: false
            , });
            $('#player').resize(function (event, ui) {
                var x = event.clientX;
                resizePlayerWidth(x);
            })
            $("#playercode").resizable({
                handles: 's'
                , ghost: false
            , });
            $('#playercode').resize(function (event, ui) {
                var y = ui.size.height;
                var windowHeight = $('#window').height();
                // from timelinePlugin updateComponentsLineHeight()
                var element = $('#timeline');
                var headerAndFooterHeight = parseFloat(element.find('.timeaxis').height() + element.find('.module-nav-bar-container').height());
                $("#playercode").resizable("option", "maxHeight", windowHeight - headerAndFooterHeight);
                var maxHeight = $(".selector").resizable("option", "maxHeight");
                resizePlayerHeight(y);
                element.find('.components').first().css('height', windowHeight - y - headerAndFooterHeight);
                element.css("height", windowHeight - y);
            })
            window.addEventListener('resize', function (event) {
                resizePlayerHeight($('#window').height() - $("#timeline").height());
            });
            var blocklyDiv = document.getElementById('blocklyDiv');
            if (blocklyDiv !== null && blocklyDiv.childElementCount === 0) {
                var workspace = Blockly.inject(blocklyDiv, {
                    media: 'bower_components/blockly/media/'
                    , toolbox: document.getElementById('toolbox')
                });
                /* Enable this line to load a default annotation program */
                Blockly.Xml.domToWorkspace(workspace, document.getElementById('startBlocks'));
            }
            var blocklyControls = document.getElementById('blocklyControlsDiv');
            createButton(blocklyControls, 'showCode', 'showCode()', 'fa-info-circle');
            createButton(blocklyControls, 'saveCode', 'saveCode()', 'fa-download');
            document.getElementById('saveCode').setAttribute('download', 'InspectorWidget.xml');
            createButton(blocklyControls, 'runCode', 'runCode()', 'fa-play');
            createButton(blocklyControls, 'abort', 'abort()', 'fa-stop');
            createButton(blocklyControls, 'status', 'status()', 'fa-question-circle');
            var annotations = [];
            files.forEach(function (file) {
                var stem = file.split('/').pop().split('.').reverse().pop();
                var hyphens = stem.split('-');
                var type = hyphens.pop();
                var label = hyphens.pop();
                var annotation = {
                    name: label
                    , segment: true
                    , overlay: true
                    , event: false
                    , source: 'computer_vision'
                }
                annotations = annotations.concat(annotation);
            });
            var recordingPath = '/data/';
            inspectorWidgetInit(recordingId, recordingPath, annotations);
        }
    }
    socket.emit('annotations', recordingId, annotationsReceived);
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

    function done(id, err, result, phase, progress) {
        if (err) {
            console.log('Error', err);
            //io.emit('error', err);
            return;
        }
        else {
            console.log('Result', result);
            //io.emit('result', result);
            return;
        }
    }
    if (socket.connected === false) {
        alert('InspectorWidgetProcessor server disconnected.');
        return;
    }
    socket.emit('status', recordingId, done);
}

function runCode() {
    var workspace = Blockly.getMainWorkspace();
    var recordings = document.getElementById('recordings');
    var recordingId = recordings.value;
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
    /// Determine template names from template_set objects in the blockly code
    /*var templates = [];
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
                    , event: false
                    , type: 'progress'
                }
                var listOfLines = inspectorWidgetListLines([d]);
                timelinePlugin.createComponentsWithList(listOfLines)
                timelinePlugin.displayLinesNb += 1;
                timelinePlugin.settings.displayLines += 1;
                updateAnnotations(recordingId,[template])
            }
        }
    });*/
    timelinePlugin.updateComponentsLineHeight();
    resizePlayerHeight($('#window').height() - $('#timeline').height());

    function runDone(id, err, result) {
        clearInterval(timer);
        $('#runCode')[0].disabled = false;
        $('#abort')[0].disabled = true;
        if (err) {
            console.log('Error', err);
            return;
        }
        else {
            updateAnnotations(recordingId,[]);
            return;
        }
    }
    socket.emit('run', recordingId, code, runDone);
    timer = setInterval(function () {
            updateAnnotations(recordingId,[]);
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
    var url = "data:xml/xml;charset=utf-8," + encodeURIComponent(source);
    //set url value to a element's href attribute.
    document.getElementById("saveCode").href = url;
}

function abort() {
    var recordings = document.getElementById('recordings');
    var recordingId = recordings.value;
    clearInterval(timer);
    $('#runCode')[0].disabled = false;
    $('#abort')[0].disabled = true;
    socket.emit('abort', recordingId);
}