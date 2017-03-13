var io = require('socket.io-client')('http://localhost:9998');
var socket = io;
// from https://github.com/marcobiedermann/jquery-demo
var $ = require('jquery')
window.$ = window.jQuery = $;
//
require('jquery-ui')
var raphael = Raphael = require('raphael')
//window.raphael = raphael
//
require('amalia.js/build/js/amalia.js.min.js')
require('amalia.js/build/js/amalia.js-logger.min.js')
require('amalia.js/build/js/amalia.js-plugin-timeline.min.js')
require('amalia.js/build/js/amalia.js-plugin-editor.min.js')
require('amalia.js/build/js/amalia.js-plugin-overlay.min.js')
require('amalia.js/build/js/amalia.js-plugin-inspectorwidget.min.js')
require('amalia.js/build/js/i18n/amalia.js-message-en.js')
//
require('vkbeautify')
var d3 = require('d3')
//
require('blockly')

//
var vex = require('vex-js')
vex.registerPlugin(require('vex-dialog'))
vex.defaultOptions.className = 'vex-theme-os'

/** Override Blockly.alert() with custom implementation. */
//Blockly.alert = function(message, callback) {}

/** Override Blockly.confirm() with custom implementation. */
//Blockly.confirm = function(message, callback) {}

/** Override Blockly.prompt() with custom implementation. */
Blockly.prompt = function(message, defaultValue, callback) {
  vex.dialog.prompt({
      message: message,
      placeholder: defaultValue,
      callback: callback
  })
}

//
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
idsReceived = function(err, result) {
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
    return recordingPath + '/' + recordingId + '/' + recordingId + '-' + annotation.name + annotationSuffix + '.json';
}
inspectorWidgetVideoPath = function (recordingId, recordingPath) {
    return recordingPath + '/' + recordingId + '/' + recordingId + '.mp4';
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

createAccessibilityBlock = function(variable, mode) {
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

updateAnnotations = function(recordingId, annotations) {
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
                        optimizePlayerHeight();
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
/// Changes XML to JSON
/// Adapted from http://stackoverflow.com/questions/28184804/drawing-a-collapsible-indented-tree-with-d3-xml-instead-of-d3-json
xmlToJson = function(xml) {
    // ignore text leaves
    //if(xml.hasChildNodes())
    //{
    //console.log('xml node', xml, xml.nodeName, xml.nodeType)
    // Produce a node with a name
    var obj = {
        name: (xml.nodeName)
            // + (xml.firstChild && xml.firstChild.nodeValue ? (" = " + xml.firstChild.nodeValue) : "")
    };
    if (xml.attributes) {
        obj['attributes'] = [];
        for (var i = 0; i < xml.attributes.length; i++) {
            //obj['attributes'][xml.attributes.item(i).name] = xml.attributes.item(i).value;
            obj['attributes'].push({
                name: xml.attributes.item(i).name
                , value: xml.attributes.item(i).value
            });
        }
    }
    // iterate over children
    if (xml.childNodes) {
        for (var i = 0; i < xml.childNodes.length; i++) {
            // if recursive call returned a node, append it to children
            if (xml.childNodes.item(i).nodeType !== 3) { // text
                var child = xmlToJson(xml.childNodes.item(i));
                if (child) {
                    (obj.children || (obj.children = [])).push(child);
                }
            }
        }
    }
    return obj;
    /* }

     return undefined;*/
};
/// Adapted from Mike Bostock’s Block 1093025 Updated August 30, 2016
/// Collapsible Indented Tree
/// http://bl.ocks.org/mbostock/1093025
var accessibilityTreeMargin = {
        top: 30
        , right: 0
        , bottom: 30
        , left: 0
    }
    , barHeight = 20
    , barWidth = 120 //width * .8;

    , accessibilityTreeWidth = barWidth * 2 - accessibilityTreeMargin.left - accessibilityTreeMargin.right
    , accessibilityTreeHeight = 400
var i = 0
    , duration = 0
    , root;
var accessibilityTreeLayout = d3.layout.tree().nodeSize([0, 10]);
var diagonal = d3.svg.diagonal().projection(function (d) {
    return [d.y, d.x];
});

function colorAttributes(d) {
    return "#c6dbef";
}

function colorTree(d) {
    return d.hovered ? "#c6dbef" :  "#3182bd";
}

function updateAccessibilityAttributes(source, nodes, d) {
    var accessibilityViewerSvg = d3.select("#accessibilityViewerCanvas")
    d.attributes.forEach(function (n, i) {
        n.x = (i + nodes.length + 1) * barHeight;
        n.y = 0;
    });
    var attribute = accessibilityViewerSvg.selectAll("g.attribute").data(d.attributes, function (d) {
        return d.name;
    });
    var attributeEnter = attribute.enter().append("g").attr("class", "attribute").attr("transform", function (d) {
        return "translate(" + source.y0 + "," + (source.x0 + (nodes.length + 1) * barHeight) + ")";
    }).style("opacity", 1e-6);
    attributeEnter.append("rect").attr("y", -barHeight / 2).attr("height", barHeight).attr("width", barWidth).style("fill", colorAttributes);
    attributeEnter.append("text").attr("dy", 3.5).attr("dx", 5.5).text(function (d) {
        return d.name;
    });
    attributeEnter.append("rect").attr("y", -barHeight / 2).attr("x", barWidth).attr("height", barHeight).attr("width", barWidth).style("fill", colorAttributes);
    attributeEnter.append("text").attr("dy", 3.5).attr("x", barWidth).attr("dx", 5.5).text(function (d) {
        return d.value;
    });
    // Transition nodes to their new position.
    attributeEnter.transition().duration(duration).attr("transform", function (d) {
        return "translate(" + d.y + "," + d.x + ")";
    }).style("opacity", 1);
    attribute.transition().duration(duration).attr("transform", function (d) {
        return "translate(" + d.y + "," + d.x + ")";
    }).style("opacity", 1).select("rect").style("fill", colorAttributes);
    // Transition exiting nodes to the parent's new position.
    attribute.exit().transition().duration(duration).attr("transform", function (d) {
        return "translate(" + source.y + "," + source.x + ")";
    }).style("opacity", 1e-6).remove();
}

function updateAccessibilityTree(source) {
    var accessibilityViewerSvg = d3.select("#accessibilityViewerCanvas")
        // Compute the flattened node list. TODO use d3.layout.hierarchy.
    var nodes = accessibilityTreeLayout.nodes(root);
    var height = Math.max(400, nodes.length * barHeight + accessibilityTreeMargin.top + accessibilityTreeMargin.bottom);
    d3.select("#accessibilityViewerSvg").transition().duration(duration).attr("height", height);
    d3.select(self.frameElement).transition().duration(duration).style("height", height + "px");
    // Remove attributes from previous node selection
    var attribute = accessibilityViewerSvg.selectAll("g.attribute").remove();
    // Compute the "layout".
    var hovered = false;
    nodes.forEach(function (n, i) {
        n.x = i * barHeight;
        if(i === nodes.length-1) n.hovered = !hovered;
        if(n.hovered) hovered = true;
    });
    // Update the nodes…
    var node = accessibilityViewerSvg.selectAll("g.node").data(nodes, function (d) {
        return d.id || (d.id = ++i);
    });
    var nodeEnter = node.enter().append("g").attr("class", "node")
    .attr("hovered", function (d,i) {
        return (i === nodes.length-1);
    })
    .attr("transform", function (d) {
        return "translate(" + source.y0 + "," + source.x0 + ")";
    }).style("opacity", 1e-6)
    // Enter any new nodes at the parent's previous position.
    nodeEnter.append("rect").attr("y", -barHeight / 2).attr("height", barHeight).attr("width", barWidth).on("mouseover", function (d) {
        d.hovered = true;
        updateAccessibilityTree(source);
        updateAccessibilityAttributes(source, nodes, d);
    })
    .on("mouseout", function (d) {
            d.hovered = false;
            //updateAccessibilityTree(d);
        }).style("fill", colorTree).on("click", click)
    // Display the last node attributes
    //colorTree(nodes[nodes.length - 1]);
    updateAccessibilityAttributes(source, nodes, nodes[nodes.length - 1])
    nodeEnter.append("text").attr("dy", 3.5).attr("dx", 5.5).text(function (d) {
        return d.name;
    });
    // Transition nodes to their new position.
    nodeEnter.transition().duration(duration).attr("transform", function (d) {
        return "translate(" + d.y + "," + d.x + ")";
    }).style("opacity", 1);
    node.transition().duration(duration).attr("transform", function (d) {
        return "translate(" + d.y + "," + d.x + ")";
    }).style("opacity", 1).select("rect").style("fill", colorTree);
    // Transition exiting nodes to the parent's new position.
    node.exit().transition().duration(duration).attr("transform", function (d) {
        return "translate(" + source.y + "," + source.x + ")";
    }).style("opacity", 1e-6).remove();
    // Update the links…
    var link = accessibilityViewerSvg.selectAll("path.link").data(accessibilityTreeLayout.links(nodes), function (d) {
        return d.target.id;
    });
    // Enter any new links at the parent's previous position.
    link.enter().insert("path", "g").attr("class", "link").attr("d", function (d) {
        var o = {
            x: source.x0
            , y: source.y0
        };
        return diagonal({
            source: o
            , target: o
        });
    }).transition().duration(duration).attr("d", diagonal);
    // Transition links to their new position.
    link.transition().duration(duration).attr("d", diagonal);
    // Transition exiting nodes to the parent's new position.
    link.exit().transition().duration(duration).attr("d", function (d) {
        var o = {
            x: source.x
            , y: source.y
        };
        return diagonal({
            source: o
            , target: o
        });
    }).remove();
    // Stash the old positions for transition.
    nodes.forEach(function (d) {
        d.x0 = d.x;
        d.y0 = d.y;
    });
}
// Toggle children on click.
function click(d) {
    if (d.children) {
        d._children = d.children;
        d.children = null;
    }
    else {
        d.children = d._children;
        d._children = null;
    }
    updateAccessibilityTree(d);
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


        optimizePlayerHeight();

        axAvailable = function(err, files) {
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
                d3.select("#accessibilityViewer").append("svg").attr("id", "accessibilityViewerSvg").attr("width", accessibilityTreeWidth + accessibilityTreeMargin.left + accessibilityTreeMargin.right).attr("height", accessibilityTreeHeight + accessibilityTreeMargin.top + accessibilityTreeMargin.bottom).append("g").attr("id", "accessibilityViewerCanvas").attr("transform", "translate(" + accessibilityTreeMargin.left + "," + accessibilityTreeMargin.top + ")");
                resizeAccessibilityViewerWidth(accessibilityTreeWidth);

                onMouseMove = function(event) {
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
                    if (x - l > 0 && y - t > 0 && x - l < w && y - t < h && inspectorWidgetPlugin.doDraw === false && event.ctrlKey === false) {
                        var time = event.data.self.mediaPlayer.getCurrentTime();

                        function accessibilityHoverReceived(id, err, x, y, w, h, axTreeParents, axTreeChildren) {
							/*if(err){
								console.log('Error with receiving accessibility hover information:',err);
								return;
							};*/
                            x = parseFloat(x);
                            y = parseFloat(y);
                            w = parseFloat(w);
                            h = parseFloat(h);
							if(isNaN(x) || isNaN(y) || isNaN(w) || isNaN(h)){
								console.log('NaN values in accessibility hover');
								return;
							}
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
                            //console.log(axTree);
                            if (axTreeChildren === "empty" || axTreeChildren === "identical") {
                                console.log(axTreeChildren)
                            }
                            if (axTreeParents !== "empty" && axTreeParents !== "identical") {
                                var domParser = new DOMParser();
                                console.log('new parents')
                                var axDOM = domParser.parseFromString(axTreeParents, "text/xml");
                                axJSON = xmlToJson(axDOM.firstChild);
                                axJSON.x0 = 0;
                                axJSON.y0 = 0;
                                updateAccessibilityTree(root = axJSON);
                            }
                        }
                        socket.emit('accessibilityHover', recordingId, time, (x - l) / w, (y - t) / h, accessibilityHoverReceived);
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
                    if (event.ctrlKey === false) {
                        event.data.self.drawingHandler.hide();
                    }
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
                Blockly.Xml.domToWorkspace(startBlocks,workspace);

                accessibilityAnnotationDone = function(id, err, result) {
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
    if (timelinePlugin === null) {
        console.log('Could not access amalia.js timeline plugin');
        return;
    }
    console.log('passed')
    var dataServices = inspectorWidgetListDataServices(recordingId, recordingPath, annotations);
    annotations.forEach(function (d) {
        var metadataId = d.name + '-segments';
        if (timelinePlugin.isManagedMetadataId(metadataId) === false) {
            var listOfLines = inspectorWidgetListLines([d]);
            console.log('listOfLines',listOfLines)
            //timelinePlugin.createComponentsWithList(listOfLines)
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
                optimizePlayerHeight();
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
    $('#blockly').width($(document).width() - width - $('#accessibilityViewer').width() - 10);
    var workspace = Blockly.getMainWorkspace();
    Blockly.svgResize(workspace);
}
resizeAccessibilityViewerWidth = function (width) {
    $('#accessibilityViewer').width(width);
    $('#blockly').width($(document).width() - $('#player').width() - width - 10);
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
    $('#accessibilityViewer').height(height);
    $('#blockly').height(height);
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
optimizePlayerHeight = function () {
    resizePlayerHeight($('#window').height() - $("#timeline").height());
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
                handles: 'e'
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
            $("#accessibilityViewer").resizable({
                handles: 'e'
                , ghost: false
            , });
            $('#accessibilityViewer').resize(function (event, ui) {
                var x = event.clientX;
                var accessibilityViewerWidth = x - $('#player').width();
                resizeAccessibilityViewerWidth(accessibilityViewerWidth);
            })
            window.addEventListener('resize', function (event) {
                optimizePlayerHeight();
            });
            var blocklyDiv = document.getElementById('blocklyDiv');
            if (blocklyDiv !== null && blocklyDiv.childElementCount === 0) {
                var workspace = Blockly.inject(blocklyDiv, {
                    media: 'bower_components/blockly/media/'
                    , toolbox: document.getElementById('toolbox')
                });
                /* Enable this line to load a default annotation program */
                Blockly.Xml.domToWorkspace(document.getElementById('startBlocks'),workspace);
            }
            var blocklyControls = document.getElementById('blocklyControlsDiv');
            createButton(blocklyControls, 'showCode', 'showCode()', 'fa-info-circle');
            createButton(blocklyControls, 'saveCode', 'saveCode()', 'fa-download');
            document.getElementById('saveCode').setAttribute('download', 'InspectorWidget.xml');
            createButton(blocklyControls, 'runCode', 'runCode()', 'fa-play');
            createButton(blocklyControls, 'abort', 'abort()', 'fa-stop');
            createButton(blocklyControls, 'processStatus', 'processStatus()', 'fa-question-circle');
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
var recordings = document.getElementById('recordings');
recordings.onchange = function () {
    changeRecording(this.value);
};

showCode = function() {
    var workspace = Blockly.getMainWorkspace();
    // Generate JavaScript code and display it.
    Blockly.JavaScript.INFINITE_LOOP_TRAP = null;
    var code = Blockly.JavaScript.workspaceToCode(workspace);
    alert(code);
}

processStatus = function() {
    var recordings = document.getElementById('recordings');
    var recordingId = recordings.value;

    function done(id, err, result, phase, progress) {
        if (err) {
            console.log('Error', err);
            alert('Error: '+err)
            //io.emit('error', err);
            return;
        }
        else {
            console.log('Result', result);
            alert('Result: '+result)
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

runCode = function () {
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
    optimizePlayerHeight();

    runDone = function (id, err, result) {
        clearInterval(timer);
        $('#runCode')[0].disabled = false;
        $('#abort')[0].disabled = true;
        if (err) {
            console.log('Error', err);
            return;
        }
        else {
            updateAnnotations(recordingId, []);
            return;
        }
    }
    socket.emit('run', recordingId, code, runDone);
    timer = setInterval(function () {
            updateAnnotations(recordingId, []);
        }, 10) // milliseconds
}

saveCode = function () {
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

abort = function() {
    var recordings = document.getElementById('recordings');
    var recordingId = recordings.value;
    clearInterval(timer);
    $('#runCode')[0].disabled = false;
    $('#abort')[0].disabled = true;
    socket.emit('abort', recordingId);
}

var templateDefinedCallback = function(caller,msg) {
    var block = caller.sourceBlock_;
        function done (id,err, result) {
            //console.log('from id',id);
            if (err) {
                console.log('Error',err);
            }
            else{
                var id = block.getFieldValue('VIDEO');
                var template = block.getFieldValue('TEMPLATE');
                var url = '/data/' + id + '/' + template + '.png';
                block.thumbnailMutator_.changeSrc(url);
            }
            var inspectorWidgetPlugin = inspectorWidgetFindPlugin('InspectorWidgetPlugin');
            if(inspectorWidgetPlugin){
              inspectorWidgetPlugin.clearCanvas();
            }
        }
    if( msg !== null && 'rx' in msg){
        // Update block values
        var recordingFullPath = msg.src;
        var recordingId = recordingFullPath.split('\\').pop().split('/').pop().split('.').reverse().pop();
        block.setFieldValue(msg.x,'X');
        block.setFieldValue(msg.y,'Y');
        block.setFieldValue(msg.rx,'W');
        block.setFieldValue(msg.ry,'H');
        block.setFieldValue(recordingId,'VIDEO');
        block.setFieldValue(msg.time,'TIME');

        // Submit block code to InspectorWidget to get the template image
        var workspace = Blockly.getMainWorkspace();
        Blockly.JavaScript.init(workspace);
        var code = Blockly.JavaScript.blockToCode(block);
        //var socket = io();
        socket.emit('run',recordingId,code,done);
    }
}

// Overload the defined template callback
Blockly.FieldTemplate.prototype.defineTemplateCallback = function(caller,name) {
  var inspectorWidgetPlugin = inspectorWidgetFindPlugin('InspectorWidgetPlugin');
  if(inspectorWidgetPlugin){
    inspectorWidgetPlugin.openAddShape(caller,templateDefinedCallback);
  }
  return;
}
