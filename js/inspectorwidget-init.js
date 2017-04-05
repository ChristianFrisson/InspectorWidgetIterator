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
Blockly.alert = function(message, callback) {
    vex.dialog.alert(message)
}

/** Override Blockly.confirm() with custom implementation. */
Blockly.confirm = function(message, callback) {
    vex.dialog.confirm({
        message: message,
        callback: callback
    })
}

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
socket.on('result', function(data) {
    console.log('Result: ', data)
    vex.dialog.alert('Result: ' + data);
});
socket.on('error', function(msg) {
    console.log('Error: ', msg)
    vex.dialog.alert('Error: ' + msg);
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
    } else {
        var recordings = document.getElementById('recordings');
        result.forEach(function(id) {
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
inspectorWidgetAnnotationPath = function(recordingId, recordingPath, annotation, type) {
    annotationSuffix = '';
    if (type === 'overlay') {
        annotationSuffix = overlaysSuffix;
    }
    if (type === 'segment') {
        annotationSuffix = segmentsSuffix;
    }
    return recordingPath + '/' + recordingId + '/' + recordingId + '-' + annotation.name + annotationSuffix + '.json';
}
inspectorWidgetVideoPath = function(recordingId, recordingPath) {
    return recordingPath + '/' + recordingId + '/' + recordingId + '.mp4';
}
trackColor = function(annotation) {
    if (annotation.source === 'input_events') {
        return '#8ca55b'; // '#c2a5cf'
    } else if (annotation.source === 'computer_vision') {
        return '#704984'; // '#a6dba0'
    } else if (annotation.source === 'accessibility') {
        return '#496684';
    } else if (annotation.source === 'progress') {
        return 'rgb(242, 80, 80)';
    } else {
        return '#FFFFFF';
    }
}
inspectorWidgetListDataServices = function(recordingId, recordingPath, annotations) {
    var dummyDataService = [recordingPath + '/Dummy.json'];
    var dataServices = [];
    if (!annotations || annotations.length === 0) {
        //console.log('null annotations')
        annotations = [];
        dataServices = dummyDataService;
        return dataServices;
    }
    annotations.forEach(function(d, i) {
        if (d.overlay) {
            dataServices = dataServices.concat({
                protocol: "http",
                url: inspectorWidgetAnnotationPath(recordingId, recordingPath, d, 'overlay'), // format : 'json',
                parameters: {
                    editingMode: true,
                    mainLevel: true
                }
            });
        }
        if (d.segment) {
            dataServices = dataServices.concat(inspectorWidgetAnnotationPath(recordingId, recordingPath, d, 'segment'));
        }
    });
    return dataServices;
};
inspectorWidgetListDataServiced = function(recordingId, recordingPath, annotations) {
    var dummyDataService = [recordingPath + '/Dummy.json'];
    var dataServices = [];
    if (!annotations || annotations.length === 0) {
        annotations = [];
        dataServices = dummyDataService;
        return dataServices;
    }
    annotations.forEach(function(d, i) {
        if (d.overlay) {
            dataServices = dataServices.concat({
                protocol: "http",
                url: inspectorWidgetAnnotationPath(recordingId, recordingPath, d, 'overlay'), // format : 'json',
                parameters: {
                    editingMode: true,
                    mainLevel: true
                }
            });
        }
        if (d.segment) {
            dataServices = dataServices.concat({
                protocol: "http",
                url: inspectorWidgetAnnotationPath(recordingId, recordingPath, d, 'segment'), // format : 'json',
                parameters: {
                    editingMode: true,
                    mainLevel: true
                }
            });
        }
    });
    return dataServices;
};
inspectorWidgetListLines = function(annotations) {
    var listOfLines = [];
    if (!annotations || annotations.length === 0) {
        annotations = [];
        return listOfLines;
    }
    annotations.forEach(function(d, i) {
        if (d.segment) {
            listOfLines = listOfLines.concat({
                title: d.name,
                type: 'segment',
                metadataId: d.name + '-segments',
                color: trackColor(d)
            })
        } else if (d.event) {
            listOfLines = listOfLines.concat({
                title: d.name,
                type: 'cuepoint',
                metadataId: d.name + '-events',
                color: trackColor(d),
                pointNav: true
            })
        }
    });
    return listOfLines;
};
inspectorWidgetListSegments = function(annotations) {
    var listOfSegments = [];
    if (!annotations || annotations.length === 0) {
        annotations = [];
        return listOfSegments;
    }
    annotations.forEach(function(d, i) {
        if (d.segment) {
            listOfSegments = listOfSegments.concat(d.name + '-segments')
        }
    });
    return listOfSegments;
};

var annotationInProgress = [];

annotationsInWorkspace = function() {
    var annotations = [];
    var workspace = Blockly.getMainWorkspace();
    var blocks = workspace.getAllBlocks();
    blocks.forEach(function(block) {
        var accessibles = block.getAccessibles();
        var templates = block.getTemplates();
        var variables = accessibles.concat(templates);
        variables.forEach(function(variable) {
            var index = annotations.indexOf(variable);
            if (index === -1) {
                annotations = annotations.concat(variable);
            }
        })
    })
    return annotations;
}

updateAnnotations = function(recordingId, annotations) {
    if (annotations.length === 0) {
        if (annotationInProgress.length == 0) {
            annotationInProgress = annotationsInWorkspace();
        }
        annotations = annotationInProgress;
    }
    console.log('annotations', annotations)

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
        if (err !== null) {
            //results.forEach(function(result) {
            var name = results[0];
            var annotationProgress = parseFloat(results[1]);
            var annotation = results[2];

            var parser = new fr.ina.amalia.player.parsers.BaseParserMetadata({});
            var duration = $(".ajs").data('fr.ina.amalia.player').player.getDuration();
            var fps = $(".ajs").data('fr.ina.amalia.player').player.settings.framerate;
            var durationTS = fr.ina.amalia.player.helpers.UtilitiesHelper.formatTime(duration, fps, 'mms');
            if (annotationProgress > progress) progress = annotationProgress;
            var currentTime = progress * duration;
            var currentTS = fr.ina.amalia.player.helpers.UtilitiesHelper.formatTime(currentTime, fps, 'mms')

            var error = null;
            try {
                result = JSON.parse(annotation);
            } catch (error) {
                console.log('Error ', error, ' parsing result ', result)
            }
            var data;
            if (error === null && 'localisation' in result && result.localisation.length === 1 && 'sublocalisations' in result.localisation[0] && 'localisation' in result.localisation[0].sublocalisations) {
                data = result;
                var metadataId = result.id;
                var name = result.id.split('-')[0];
                var type = result.id.split('-')[1];
                var source = result.source;
                /// Add annotation to timeline if not yet there
                if (timelinePlugin.isManagedMetadataId(metadataId) === false) {
                    var d = {
                        name: name,
                        segment: type === "segments",
                        overlay: false,
                        event: type === "events",
                        source: source
                    }
                    var listOfLines = inspectorWidgetListLines([d]);
                    timelinePlugin.createComponentsWithList(listOfLines)
                    timelinePlugin.displayLinesNb += 1;
                    timelinePlugin.settings.displayLines += 1;
                    timelinePlugin.updateComponentsLineHeight();
                    optimizePlayerHeight();
                    optimizePlayerWidth();
                }
                if (progress === 1.0) {
                    var index = annotationInProgress.indexOf(name);
                    if (index > -1) {
                        console.log('Removing annotation with complete progress', name);
                        annotationInProgress.splice(index, 1);
                        console.log('Remaining annotations', annotationInProgress);
                    }

                }
                if (progress < 1 && progress !== 0) {
                    data.localisation[0].sublocalisations.localisation = data.localisation[0].sublocalisations.localisation.concat({
                        "label": name,
                        "tcin": currentTS,
                        "tcout": durationTS,
                        "tclevel": 1.0,
                        "color": '#00ccff'
                    });
                }

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
                }, null);
                player.player.replaceAllMetadataById(data.id, data.list);
            }
            //});
        }
    }
    annotations.forEach(function(annotation) {
        socket.emit('annotationStatus', recordingId, annotation, statusDone);
    })
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
                name: xml.attributes.item(i).name,
                value: xml.attributes.item(i).value
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
        top: 30,
        right: 0,
        bottom: 30,
        left: 0
    },
    barHeight = 20,
    barWidth = 120 //width * .8;

    ,
    accessibilityTreeWidth = barWidth * 2 - accessibilityTreeMargin.left - accessibilityTreeMargin.right,
    accessibilityTreeHeight = 400
var i = 0,
    duration = 0,
    root;
var accessibilityTreeLayout = d3.layout.tree().nodeSize([0, 10]);
var diagonal = d3.svg.diagonal().projection(function(d) {
    return [d.y, d.x];
});

function colorAttributes(d) {
    return "#c6dbef";
}

function colorTree(d) {
    return d.hovered ? "#c6dbef" : "#3182bd";
}

function updateAccessibilityAttributes(source, nodes, d) {
    var accessibilityViewerSvg = d3.select("#accessibilityViewerCanvas")
    d.attributes.forEach(function(n, i) {
        n.x = (i + nodes.length + 1) * barHeight;
        n.y = 0;
    });
    var attribute = accessibilityViewerSvg.selectAll("g.attribute").data(d.attributes, function(d) {
        return d.name;
    });
    var attributeEnter = attribute.enter().append("g").attr("class", "attribute").attr("transform", function(d) {
        return "translate(" + source.y0 + "," + (source.x0 + (nodes.length + 1) * barHeight) + ")";
    }).style("opacity", 1e-6);
    attributeEnter.append("rect").attr("y", -barHeight / 2).attr("height", barHeight).attr("width", barWidth).style("fill", colorAttributes);
    attributeEnter.append("text").attr("dy", 3.5).attr("dx", 5.5).text(function(d) {
        return d.name;
    });
    attributeEnter.append("rect").attr("y", -barHeight / 2).attr("x", barWidth).attr("height", barHeight).attr("width", barWidth).style("fill", colorAttributes);
    attributeEnter.append("text").attr("dy", 3.5).attr("x", barWidth).attr("dx", 5.5).text(function(d) {
        return d.value;
    });
    // Transition nodes to their new position.
    attributeEnter.transition().duration(duration).attr("transform", function(d) {
        return "translate(" + d.y + "," + d.x + ")";
    }).style("opacity", 1);
    attribute.transition().duration(duration).attr("transform", function(d) {
        return "translate(" + d.y + "," + d.x + ")";
    }).style("opacity", 1).select("rect").style("fill", colorAttributes);
    // Transition exiting nodes to the parent's new position.
    attribute.exit().transition().duration(duration).attr("transform", function(d) {
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
    nodes.forEach(function(n, i) {
        n.x = i * barHeight;
        if (i === nodes.length - 1) n.hovered = !hovered;
        if (n.hovered) hovered = true;
    });
    // Update the nodes…
    var node = accessibilityViewerSvg.selectAll("g.node").data(nodes, function(d) {
        return d.id || (d.id = ++i);
    });
    var nodeEnter = node.enter().append("g").attr("class", "node")
        .attr("hovered", function(d, i) {
            return (i === nodes.length - 1);
        })
        .attr("transform", function(d) {
            return "translate(" + source.y0 + "," + source.x0 + ")";
        }).style("opacity", 1e-6)
    // Enter any new nodes at the parent's previous position.
    nodeEnter.append("rect").attr("y", -barHeight / 2).attr("height", barHeight).attr("width", barWidth).on("mouseover", function(d) {
            d.hovered = true;
            updateAccessibilityTree(source);
            updateAccessibilityAttributes(source, nodes, d);
        })
        .on("mouseout", function(d) {
            d.hovered = false;
            //updateAccessibilityTree(d);
        }).style("fill", colorTree).on("click", click)
    // Display the last node attributes
    //colorTree(nodes[nodes.length - 1]);
    updateAccessibilityAttributes(source, nodes, nodes[nodes.length - 1])
    nodeEnter.append("text").attr("dy", 3.5).attr("dx", 5.5).text(function(d) {
        return d.name;
    });
    // Transition nodes to their new position.
    nodeEnter.transition().duration(duration).attr("transform", function(d) {
        return "translate(" + d.y + "," + d.x + ")";
    }).style("opacity", 1);
    node.transition().duration(duration).attr("transform", function(d) {
        return "translate(" + d.y + "," + d.x + ")";
    }).style("opacity", 1).select("rect").style("fill", colorTree);
    // Transition exiting nodes to the parent's new position.
    node.exit().transition().duration(duration).attr("transform", function(d) {
        return "translate(" + source.y + "," + source.x + ")";
    }).style("opacity", 1e-6).remove();
    // Update the links…
    var link = accessibilityViewerSvg.selectAll("path.link").data(accessibilityTreeLayout.links(nodes), function(d) {
        return d.target.id;
    });
    // Enter any new links at the parent's previous position.
    link.enter().insert("path", "g").attr("class", "link").attr("d", function(d) {
        var o = {
            x: source.x0,
            y: source.y0
        };
        return diagonal({
            source: o,
            target: o
        });
    }).transition().duration(duration).attr("d", diagonal);
    // Transition links to their new position.
    link.transition().duration(duration).attr("d", diagonal);
    // Transition exiting nodes to the parent's new position.
    link.exit().transition().duration(duration).attr("d", function(d) {
        var o = {
            x: source.x,
            y: source.y
        };
        return diagonal({
            source: o,
            target: o
        });
    }).remove();
    // Stash the old positions for transition.
    nodes.forEach(function(d) {
        d.x0 = d.x;
        d.y0 = d.y;
    });
}
// Toggle children on click.
function click(d) {
    if (d.children) {
        d._children = d.children;
        d.children = null;
    } else {
        d.children = d._children;
        d._children = null;
    }
    updateAccessibilityTree(d);
}

loadBasicAnnotations = function(recordingId, definitions) {
    var annotations = [];
    definitions.forEach(function(d) {
        annotations = annotations.concat(d.variable);
    })
    /// Generate annotation definition syntax for InspectorWidgetProcessor
    var annotationDefinition = '';
    definitions.forEach(function(d) {
        annotationDefinition += d.variable + '=' + d.action + '();\n';
    });
    /// Generate annotation blocks and add them to the blockly workspace
    var workspace = Blockly.getMainWorkspace();
    definitions.forEach(function(d, i) {
        var allBlocks = workspace.getAllBlocks();
        var block = workspace.newBlock(d.type);
        if (d.type === "accessibility_actions") {
            block.setFieldValue(d.variable, 'ACCESSIBLE');
        } else {
            block.setFieldValue(d.variable, 'VAR');
        }
        block.setFieldValue(d.action, 'MODE')
        block.initSvg();
        block.render();
        if (allBlocks.length > 0) {
            var prevBlock = allBlocks[allBlocks.length - 1];
            var nextConn = prevBlock.nextConnection;
            var prevConn = block.previousConnection;
            if (nextConn && prevConn) {
                prevConn.connect(nextConn);
            }
        }

    })
    annotationDone = function(id, err, result) {
        updateAnnotations(id, annotations);
    };
    socket.emit('run', recordingId, annotationDefinition, annotationDone);
}

definitionBlocksOnTop = function() {
    var workspace = Blockly.getMainWorkspace();
    workspace.cleanUp();
    var cursorY = 0;
    workspace.getAllBlocks().reverse().forEach(function(block) {
        if (block.type === "accessibles_set" || block.type === "templates_set") {
            cursorY += block.height;
            block.translate(0, -cursorY);
        }
    })
    workspace.cleanUp();
}

function onBlocksDeleted(event) {
    if (event.type == Blockly.Events.DELETE) {
        /// Determine the name and variable type of the block just deleted
        var oldXml = event.oldXml;
        if (oldXml.nodeName === "BLOCK" && oldXml.children && oldXml.attributes) {
            var blockType, varType, varName;
            for (var i = 0; i < oldXml.attributes.length; i++) {
                if (oldXml.attributes.item(i).name === "type") {
                    blockType = oldXml.attributes.item(i).value;
                }
            }
            if (blockType.toString().match("_get") !== null) {
                return;
            }
            if (blockType.toString().match("accessib") !== null) {
                varType = "ACCESSIBLE";
            } else if (blockType.toString().match("template") !== null) {
                varType = "TEMPLATE";
            } else {
                varType = "VAR";
            }
            for (var i = 0; i < oldXml.childNodes.length; i++) {
                var child = oldXml.childNodes.item(i);
                if (child.nodeName === "FIELD") {
                    for (var j = 0; j < child.attributes.length; j++) {
                        if (child.attributes.item(j).name === "name" && child.attributes.item(j).value === varType && child.childNodes.length === 1) {
                            varName = child.childNodes.item(0).nodeValue;
                        }
                    }
                }
            }

            /// Delete the corresponding timeline line
            var annotations = [{
                name: varName,
                segment: true,
                overlay: false,
                event: true
            }];
            inspectorWidgetRemoveAnnotations(annotations);
        }
    }
}

var justDefined = {
    'accessible': null,
    'template': null
};

inspectorWidgetInit = function(recordingId, recordingPath, annotations) {
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
        autoplay: false,
        debug: false,
        src: inspectorWidgetVideoPath(recordingId, recordingPath), //controlBarClassName : "fr.ina.amalia.player.plugins.InspectorWidgetControlBarPlugin",
        controlBar: {
            sticky: true
        },
        plugins: {
            dataServices: dataServices,
            list: [
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
                    'className': 'fr.ina.amalia.player.plugins.InspectorWidgetPlugin',
                    'metadataId': 'InspectorWidget',
                    'debug': false,
                    'parameters': {
                        editable: true,
                        style: {
                            'fill': '#7b3294',
                            'strokeWidth': 4,
                            'stroke': '#7b3294',
                            'fillOpacity': 0,
                            'strokeDasharray': '-'
                        }
                    }
                }, {
                    'className': 'fr.ina.amalia.player.plugins.TimelinePlugin',
                    'container': '#timeline',
                    'parameters': {
                        editingMode: true,
                        timeaxe: true,
                        timecursor: true,
                        timeaxeExpandable: true,
                        displayLines: listOfLines.length,
                        resizable: false,
                        lineDisplayMode: fr.ina.amalia.player.plugins.PluginBaseMultiBlocks.METADATA_DISPLAY_TYPE.STATIC, //STATIC//STATIC_DYNAMIC//DYNAMIC
                        listOfLines: listOfLines
                    }
                }
            ]
        }
    };
    var f = $("#defaultPlayer").mediaPlayer(settings);

    socket.emit('run', recordingId, '', function(){});

    resizePlayerHeight($('#window').height() - $("#timeline").height());
    f.on(fr.ina.amalia.player.PlayerEventType.STARTED, {
        self: f
    }, function() {
        inspectorWidgetAddAnnotations(recordingId, recordingPath, annotations)

        optimizePlayerHeight();
        optimizePlayerWidth();

        inspectorWidgetPlugin = inspectorWidgetFindPlugin('InspectorWidgetPlugin');
        if (!inspectorWidgetPlugin) {
            console.log('Could not access amalia.js InspectorWidget plugin');
            return;
        }

        inspectorWidgetPlugin.axAvailable = false;

        inputEventsAvailable = function(err, files) {
            if (err) {
                vex.dialog.alert('No input events information available')
            } else {
                var definitions = [{
                    'variable': 'Words',
                    'action': 'getWords',
                    'type': 'input_events_actions'
                }, {
                    'variable': 'PointerClicks',
                    'action': 'getPointerClicks',
                    'type': 'input_events_actions'
                }, {
                    'variable': 'KeysTyped',
                    'action': 'getKeysTyped',
                    'type': 'input_events_actions'
                }, {
                    'variable': 'ModifierKeysPressed',
                    'action': 'getModifierKeysPressed',
                    'type': 'input_events_actions'
                }];
                //loadBasicAnnotations(recordingId, definitions);
            }

            axAvailable = function(err, files) {
                if (err) {
                    vex.dialog.alert('No accessibility information available')
                    return;
                } else {
                    /// Accessibility on mouse hover
                    d3.select("#accessibilityViewer")
                    .append("svg")
                    .attr("id", "accessibilityViewerSvg")
                    .attr("width", accessibilityTreeWidth + accessibilityTreeMargin.left + accessibilityTreeMargin.right)
                    .attr("height", accessibilityTreeHeight + accessibilityTreeMargin.top + accessibilityTreeMargin.bottom)
                    .append("g").attr("id", "accessibilityViewerCanvas")
                    .attr("transform", "translate(" + accessibilityTreeMargin.left + "," + accessibilityTreeMargin.top + ")");
                    resizeAccessibilityViewerWidth(accessibilityTreeWidth);

                    inspectorWidgetPlugin.axAvailable = true;

                    /// Try to load basic accessibility annotations
                    var definitions = [{
                        'variable': 'FocusApplication',
                        'action': 'getFocusApplication',
                        'type': 'accessibility_actions'
                    }, {
                        'variable': 'FocusWindow',
                        'action': 'getFocusWindow',
                        'type': 'accessibility_actions'
                    }, {
                        'variable': 'PointedWidget',
                        'action': 'getPointedWidget',
                        'type': 'accessibility_actions'
                    }, {
                        'variable': 'ApplicationSnapshot',
                        'action': 'trackApplicationSnapshot',
                        'type': 'accessibility_actions'
                    }];

                    //loadBasicAnnotations(recordingId, definitions);
                }
            };
            socket.emit('accessibilityAvailable', recordingId, axAvailable);


        }
        socket.emit('inputEventsAvailable', recordingId, inputEventsAvailable);

        onMouseDown = function(event) {
            event.data.self.mouseMoved = false;
            event.data.self.mouseDown = true;
            event.data.self.mouseDownJustTriggered = true;
        };

        onMouseMove = function(event) {
            if (event.data.self.mouseDownJustTriggered === true) {
                event.data.self.mouseDownJustTriggered = false;
                var startX = Math.max(0, event.offsetX); // + ((event.data.self.container.height() - 45 - videoSize.h) / 2));
                var startY = Math.max(0, event.offsetY); // + ((event.data.self.container.height() - videoSize.h) / 2));
                event.data.self.drawingHandler.doDraw.startX = startX;
                event.data.self.drawingHandler.doDraw.startY = startY;
                event.data.self.drawingHandler.doDraw.endX = startX;
                event.data.self.drawingHandler.doDraw.endY = startY;
                event.data.self.drawingHandler.attr('width', 0);
                event.data.self.drawingHandler.attr('height', 0);
                event.data.self.drawingHandler.attr('x', event.data.self.drawingHandler.doDraw.startX);
                event.data.self.drawingHandler.attr('y', event.data.self.drawingHandler.doDraw.startY);
            }
            event.data.self.mouseMoved = true;
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
            if (event.data.self.mouseDown === false && x - l > 0 && y - t > 0 && x - l < w && y - t < h && event.data.self.doDraw === false && event.ctrlKey === false) {
                var time = event.data.self.mediaPlayer.getCurrentTime();

                function accessibilityHoverReceived(id, err, x, y, w, h, axTreeParents, axTreeChildren) {
                    x = parseFloat(x);
                    y = parseFloat(y);
                    w = parseFloat(w);
                    h = parseFloat(h);
                    if (isNaN(x) || isNaN(y) || isNaN(w) || isNaN(h)) {
                        //console.log('NaN values in accessibility hover');
                        return;
                    }
                    var videoSize = event.data.self.getVideoSize();
                    event.data.self.drawingHandler.show();
                    event.data.self.drawingHandler.toFront();
                    event.data.self.drawingHandler.doDraw.startX = x * videoSize.w;
                    event.data.self.drawingHandler.doDraw.startY = y * videoSize.h;
                    event.data.self.drawingHandler.doDraw.endX = (x + w) * videoSize.w;
                    event.data.self.drawingHandler.doDraw.endY = (y + h) * videoSize.h;
                    event.data.self.drawingHandler.attr('width', w * videoSize.w);
                    event.data.self.drawingHandler.attr('height', h * videoSize.h);
                    event.data.self.drawingHandler.attr('x', event.data.self.drawingHandler.doDraw.startX);
                    event.data.self.drawingHandler.attr('y', event.data.self.drawingHandler.doDraw.startY);
                    event.data.self.drawingHandler.attr('stroke', '#3cf');
                    event.data.self.drawingHandler.attr('fill', '#3cf');
                    event.data.self.drawingHandler.attr('fill-opacity', '0.3');
                    //console.log(axTree);
                    if (axTreeChildren === "empty" || axTreeChildren === "identical") {
                        //console.log(axTreeChildren)
                    }
                    if (axTreeParents !== "empty" && axTreeParents !== "identical") {
                        var domParser = new DOMParser();
                        //console.log('new parents')
                        var axDOM = domParser.parseFromString(axTreeParents, "text/xml");
                        axJSON = xmlToJson(axDOM.firstChild);
                        axJSON.x0 = 0;
                        axJSON.y0 = 0;
                        updateAccessibilityTree(root = axJSON);
                    }
                }
                if (event.data.self.axAvailable === true) {
                    socket.emit('accessibilityHover', recordingId, time, (x - l) / w, (y - t) / h, accessibilityHoverReceived);
                }
            }
            /// Handle template annotation
            if (event.data.self.mouseDown === true) {
                event.data.self.drawingHandler.show();
                event.data.self.drawingHandler.toFront();
                var endX = event.offsetX;
                var endY = event.offsetY;
                event.data.self.drawingHandler.attr('x', Math.min(event.data.self.drawingHandler.doDraw.startX, event.data.self.drawingHandler.doDraw.endX));
                event.data.self.drawingHandler.attr('y', Math.min(event.data.self.drawingHandler.doDraw.startY, event.data.self.drawingHandler.doDraw.endY));
                var width = Math.abs(endX - event.data.self.drawingHandler.doDraw.startX);
                var height = Math.abs(endY - event.data.self.drawingHandler.doDraw.startY);
                event.data.self.drawingHandler.attr('stroke', 'rgb(112,73,132)');
                event.data.self.drawingHandler.attr('fill', 'rgb(112,73,132)');
                event.data.self.drawingHandler.attr('fill-opacity', '0.3');
                event.data.self.drawingHandler.doDraw.endX = endX;
                event.data.self.drawingHandler.doDraw.endY = endY;
                event.data.self.drawingHandler.attr('width', width);
                event.data.self.drawingHandler.attr('height', height);
            }
        };

        onMouseUp = function(event) {
            event.data.self.mouseDownJustTriggered = false;
            //if (event.data.self.drawing === true) {
            event.data.self.drawing = false;
            event.data.self.drawingHandler.hide();
            var w = Math.abs(event.data.self.drawingHandler.doDraw.endX - event.data.self.drawingHandler.doDraw.startX);
            var h = Math.abs(event.data.self.drawingHandler.doDraw.endY - event.data.self.drawingHandler.doDraw.startY);
            var _shape = event.data.self.drawShape('rectangle', event.data.self.drawingHandler.doDraw.startX, event.data.self.drawingHandler.doDraw.startY, w, h);

            function addAnnotation(type) {
                var blockType = type;
                var valueType = type.toString().toUpperCase();
                var x = Math.min(event.data.self.drawingHandler.doDraw.startX, event.data.self.drawingHandler.doDraw.endX) / parseFloat(event.data.self.canvas.width);
                var y = Math.min(event.data.self.drawingHandler.doDraw.startY, event.data.self.drawingHandler.doDraw.endY) / parseFloat(event.data.self.canvas.height);
                var rx = w / parseFloat(event.data.self.canvas.width);
                var ry = h / parseFloat(event.data.self.canvas.height);
                var time = parseFloat(event.data.self.mediaPlayer.getCurrentTime());
                var src = event.data.self.mediaPlayer.settings.src;
                tree = src.toString().split('/')
                var id = tree.length > 1 ? tree[tree.length - 2] : null;
                var name = blockType + "-" + id + "-" + time + "-" + x + "-" + y + "-" + rx + "-" + ry;
                var rightcode = "=template(" + x + "," + y + "," + rx + "," + ry + ",'" + id + "'," + time + ")";
                var extractCode = name + rightcode;

                function extracted(id, name, err) {
                    console.log(err)
                    if (err) {
                        event.data.self.clearCanvas();
                    }

                    vex.dialog.prompt({
                        unsafeMessage: 'You clicked on this ' + blockType + ' region:\
                                <br/><img style="max-width:100%;max-height:100%;" src="data/' + id + '/' + name + '.png"/>\
                                <br/>' + ((justDefined[type] === null) ? 'Please give it a name if you want to annotate it:' : 'Annotate it under name ' + justDefined[type].getFieldValue(valueType) + '?'),
                        placeholder: justDefined[type] ? justDefined[type].getFieldValue(valueType) : '',
                        callback: function(value) {
                            event.data.self.clearCanvas();
                            if (value || justDefined[type] !== null) {
                                var workspace = Blockly.getMainWorkspace();
                                var allBlocks = workspace.getAllBlocks();
                                var blockDefine = (justDefined[type] === null) ? workspace.newBlock(blockType + 's_set') : justDefined[type];

                                blockDefine.setFieldValue(x, 'X');
                                blockDefine.setFieldValue(y, 'Y');
                                blockDefine.setFieldValue(rx, 'W');
                                blockDefine.setFieldValue(ry, 'H');
                                blockDefine.setFieldValue(id, 'VIDEO');
                                blockDefine.setFieldValue(time, 'TIME');
                                if (justDefined[type] === null) {
                                    blockDefine.setFieldValue(value, valueType)
                                    blockDefine.initSvg();
                                    blockDefine.render();
                                    workspace.cleanUp();
                                } else {
                                    value = justDefined[type].getFieldValue(valueType);
                                }
                                var renameCode = value + rightcode;

                                function renamed(id, name, err) {
                                    if (err) {
                                        console.log('Error', err);
                                    } else {
                                        var url = '/data/' + id + '/' + value + '.png';
                                        blockDefine.thumbnailMutator_.changeSrc(url);
                                        justDefined[type] = null
                                    }
                                }
                                //socket.emit('run', id, renameCode, renamed);
                                socket.emit('extractTemplate', id, value, x, y, rx, ry, time, renamed);

                                if (justDefined[type] === null) {
                                    var blockMatch = workspace.newBlock('match_' + blockType);
                                    blockMatch.setFieldValue(value, valueType);
                                    blockMatch.initSvg();
                                    blockMatch.render();
                                    var topBlocks = workspace.getTopBlocks();
                                    if (topBlocks.length > 0) {
                                        var prevBlock = topBlocks[0];
                                        var nextConn = prevBlock.nextConnection;
                                        while (prevBlock.getNextBlock()) {
                                            prevBlock = prevBlock.getNextBlock();
                                            nextConn = prevBlock.nextConnection;
                                        }
                                        var prevConn = blockMatch.previousConnection;
                                        if (nextConn && prevConn) {
                                            prevConn.connect(nextConn);
                                        }
                                    }
                                    workspace.cleanUp();
                                }

                                definitionBlocksOnTop();
                            }
                        }
                    })
                }
                //socket.emit('run', id, extractCode, extracted);
                socket.emit('extractTemplate', id, name, x, y, rx, ry, time, extracted);
            }

            if (_shape !== null) {
                var _shapePos = {
                    c: {
                        x: parseFloat((event.data.self.drawingHandler.doDraw.startX + event.data.self.drawingHandler.doDraw.endX) / 2 / event.data.self.canvas.width),
                        y: parseFloat((event.data.self.drawingHandler.doDraw.startY + event.data.self.drawingHandler.doDraw.endY) / 2 / event.data.self.canvas.height)
                    },
                    rx: parseFloat((w / event.data.self.canvas.width) / 2),
                    ry: parseFloat((h / event.data.self.canvas.height) / 2),
                    o: 0,
                    t: event.data.self.getSelectedShape()
                };
                event.data.self.createDataShape(_shape, _shapePos);

                var _lastDrawnShape = {
                    x: parseFloat( /*(*/ event.data.self.drawingHandler.doDraw.startX /* + event.data.self.drawingHandler.doDraw.endX) / 2*/ / event.data.self.canvas.width),
                    y: parseFloat( /*(*/ event.data.self.drawingHandler.doDraw.startY /* + event.data.self.drawingHandler.doDraw.endY) / 2*/ / event.data.self.canvas.height),
                    rx: parseFloat((w / event.data.self.canvas.width) /*/ 2*/ ),
                    ry: parseFloat((h / event.data.self.canvas.height) /*/ 2*/ ),
                    time: parseFloat(event.data.self.mediaPlayer.getCurrentTime()),
                    src: event.data.self.mediaPlayer.settings.src,
                };
                event.data.self.lastDrawnShape = _lastDrawnShape;

                if (event.data.self.axAvailable === true && !isNaN(w) && !isNaN(h) && event.data.self.mouseDown === true && event.data.self.mouseMoved === false) {
                    addAnnotation('accessible')
                }
            }

            if (event.data.self.mouseDown === true && event.data.self.mouseMoved === true) {
                addAnnotation('template')
                event.data.self.clearCanvas();
            }

            event.data.self.mouseDown = false;
            event.data.self.doDraw = false;
            //}
        };

        inspectorWidgetPlugin.mouseMoved = false;
        inspectorWidgetPlugin.mouseDown = false;
        inspectorWidgetPlugin.mouseDownJustTriggered = false;

        inspectorWidgetPlugin.container.on('mousedown', {
            self: inspectorWidgetPlugin
        }, onMouseDown);
        inspectorWidgetPlugin.container.on('mouseup', {
            self: inspectorWidgetPlugin
        }, onMouseUp);
        inspectorWidgetPlugin.container.on('mousemove', {
            self: inspectorWidgetPlugin
        }, onMouseMove);
        inspectorWidgetPlugin.container.on('mouseleave', {
            self: inspectorWidgetPlugin
        }, function(event) {
            if (event.ctrlKey === false) {
                event.data.self.drawingHandler.hide();
            }
        });
        var workspace = Blockly.getMainWorkspace();
        workspace.addChangeListener(onBlocksDeleted);
    });
};
inspectorWidgetFindPlugin = function(pluginClass) {
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
inspectorWidgetRemoveAnnotations = function(annotations) {
    var timelinePlugin = inspectorWidgetFindPlugin('TimelinePlugin');
    if (!timelinePlugin) {
        console.log('Could not access amalia.js timeline plugin');
        return;
    }
    var fields = [timelinePlugin.listOfComponents, timelinePlugin.settingsListOfComponents, timelinePlugin.settings.listOfLines, timelinePlugin.managedMetadataIds, timelinePlugin.notManagedMetadataIds];

    function removeMetadataId(fields, metadataId) {
        fields.forEach(function(field) {
            //console.log('field',field);
            field.reverse().forEach(function(d, i) {
                //console.log('field',d);
                if (typeof(d) === 'string' && d === metadataId) {
                    field.splice(i, 1)
                } else if (typeof(d) === 'object' && 'metadataId' in d && d.metadataId === metadataId) {
                    field.splice(i, 1)
                }
            })
        })
    }
    annotations.forEach(function(annotation) {
        var suffices = [];
        if (annotation.event === true) {
            suffices = suffices.concat('-events')
        }
        if (annotation.segment === true) {
            suffices = suffices.concat('-segments')
        }
        suffices.forEach(function(suffix) {
            var deleteMetadataId = annotation.name + suffix;
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
        })
    });
    timelinePlugin.updateComponentsLineHeight();
    optimizePlayerHeight();
    //optimizePlayerWidth();
};
inspectorWidgetAddAnnotations = function(recordingId, recordingPath, annotations) {
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

    var dataServices = inspectorWidgetListDataServices(recordingId, recordingPath, annotations);
    annotations.forEach(function(d) {
        var metadataId = d.name + '-segments';
        if (timelinePlugin.isManagedMetadataId(metadataId) === false) {
            var listOfLines = inspectorWidgetListLines([d]);
            //timelinePlugin.createComponentsWithList(listOfLines)
            timelinePlugin.displayLinesNb += 1;
            timelinePlugin.settings.displayLines += 1;
        }
    })
    var parser = new fr.ina.amalia.player.parsers.BaseParserMetadata({});

    function loadData(url) {
        var self = this;
        $.ajax({
            type: 'GET',
            url: url,
            timeout: 120000,
            data: {},
            dataType: 'json',
            success: function(data, textStatus) {
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
                }, null);
                //console.log(data.list)
                player.player.replaceAllMetadataById(data.id, data.list);
                optimizePlayerHeight();
            },
            error: function(data, textStatus) {
                console.log(url, 'error', data, textStatus)
            }
        });
    }
    // pluginManager.loadData(dataServices);
    annotations.forEach(function(d, i) {
        if (d.segment) {
            loadData(inspectorWidgetAnnotationPath(recordingId, recordingPath, d, 'segment'))
        }
        if (d.overlay) {
            loadData(inspectorWidgetAnnotationPath(recordingId, recordingPath, d, 'overlay'))
        }
    });
    timelinePlugin.updateComponentsLineHeight();
};
resizePlayerWidth = function(width) {
    $('#playercode').width($(document).width());
    $('#code').width($(document).width() - width);
    $('#blockly').width($(document).width() - width - $('#accessibilityViewer').width() - 10);
    var workspace = Blockly.getMainWorkspace();
    Blockly.svgResize(workspace);
}
resizeAccessibilityViewerWidth = function(width) {
    $('#accessibilityViewer').width(width);
    $('#blockly').width($(document).width() - $('#player').width() - width - 10);
    var workspace = Blockly.getMainWorkspace();
    Blockly.svgResize(workspace);
}
resizePlayerHeight = function(height) {
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
    inspectorWidgetPlugins.each(function(i, plugin) {
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
optimizePlayerHeight = function() {
    resizePlayerHeight($('#window').height() - $("#timeline").height());
}

optimizePlayerWidth = function() {
  var availableWidth = $('#playercode').width() - accessibilityTreeWidth*2;
  var availableHeight = $('#window').height() - $("#timeline").height();
  var videoWidth = $('.player')[0].videoWidth;
  var videoHeight = $('.player')[0].videoHeight;
  var idealWidth = availableHeight*videoWidth/videoHeight;
  var w = idealWidth<availableWidth?idealWidth:availableWidth;
  $('#code').width($('#playercode').width()-w);
  $('#blockly').width($('#playercode').width()-w-accessibilityTreeWidth-10);
  $('#player').width(w);
  var workspace = Blockly.getMainWorkspace();
  Blockly.svgResize(workspace);
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

    /*function annotationsReceived(err, files) {
        if (err) {
            console.log('annotations Error', err);
            return;
        } else {*/
    $("#player").resizable({
        handles: 'e',
        ghost: false,
    });
    $('#player').resize(function(event, ui) {
        var x = event.clientX;
        resizePlayerWidth(x);
    })
    $("#playercode").resizable({
        handles: 's',
        ghost: false,
    });
    $('#playercode').resize(function(event, ui) {
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
        handles: 'e',
        ghost: false,
    });
    $('#accessibilityViewer').resize(function(event, ui) {
        var x = event.clientX;
        var accessibilityViewerWidth = x - $('#player').width();
        resizeAccessibilityViewerWidth(accessibilityViewerWidth);
    })
    window.addEventListener('resize', function(event) {
        optimizePlayerHeight();
        optimizePlayerWidth();
    });
    var blocklyDiv = document.getElementById('blocklyDiv');
    if (blocklyDiv !== null && blocklyDiv.childElementCount === 0) {
        var workspace = Blockly.inject(blocklyDiv, {
            media: 'bower_components/blockly/media/',
            toolbox: document.getElementById('toolbox')
        });
        /* Enable this line to load a default annotation program */
        Blockly.Xml.domToWorkspace(document.getElementById('startBlocks'), workspace);
    }
    var blocklyControls = document.getElementById('blocklyControlsDiv');
    //createButton(blocklyControls, 'showCode', 'showCode()', 'fa-info-circle');
    createButton(blocklyControls, 'saveCode', 'saveCode()', 'fa-download');
    document.getElementById('saveCode').setAttribute('download', 'InspectorWidget.xml');
    createButton(blocklyControls, 'runCode', 'runCode()', 'fa-play');
    createButton(blocklyControls, 'abort', 'abort()', 'fa-stop');
    //createButton(blocklyControls, 'processStatus', 'processStatus()', 'fa-question-circle');
    var annotations = [];
    /*files.forEach(function(file) {
        var stem = file.split('/').pop().split('.').reverse().pop();
        var hyphens = stem.split('-');
        var type = hyphens.pop();
        var label = hyphens.pop();
        var annotation = {
            name: label,
            segment: true,
            overlay: false,
            event: false,
            source: 'computer_vision'
        }
        annotations = annotations.concat(annotation);
    });*/
    var recordingPath = '/data/';
    inspectorWidgetInit(recordingId, recordingPath, annotations);
    /*    }
    }
    socket.emit('annotations', recordingId, annotationsReceived);*/
}
var recordings = document.getElementById('recordings');
recordings.onchange = function() {
    changeRecording(this.value);
};

showCode = function() {
    definitionBlocksOnTop();
    var workspace = Blockly.getMainWorkspace();
    // Generate JavaScript code and display it.
    Blockly.JavaScript.INFINITE_LOOP_TRAP = null;
    var code = Blockly.JavaScript.workspaceToCode(workspace);
    vex.dialog.alert(code);
}

processStatus = function() {
    var recordings = document.getElementById('recordings');
    var recordingId = recordings.value;

    function done(id, err, result, phase, progress) {
        if (err) {
            console.log('Error', err);
            vex.dialog.alert('Error: ' + err)
            //io.emit('error', err);
            return;
        } else {
            console.log('Result', result);
            vex.dialog.alert('Result: ' + result)
            //io.emit('result', result);
            return;
        }
    }
    if (socket.connected === false) {
        vex.dialog.alert('InspectorWidgetProcessor server disconnected.');
        return;
    }
    socket.emit('status', recordingId, done);
}

runCode = function() {
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
        vex.dialog.alert('InspectorWidgetProcessor server disconnected.');
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
                updateAnnotations(recordingId,[template)
            }
        }
    });*/
    timelinePlugin.updateComponentsLineHeight();
    optimizePlayerHeight();
    optimizePlayerWidth();

    runDone = function(id, err, result) {
        clearInterval(timer);
        annotationInProgress = [];
        $('#runCode')[0].disabled = false;
        $('#abort')[0].disabled = true;
        if (err) {
            vex.dialog.alert(err);
            console.log('Error', err);
            return;
        } else {
            updateAnnotations(recordingId, annotationsInWorkspace());
            return;
        }
    }
    socket.emit('run', recordingId, code, runDone);
    timer = setInterval(function() {
        updateAnnotations(recordingId, []);
    }, 250) // milliseconds
}

saveCode = function() {
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
    annotationInProgress = [];
    $('#runCode')[0].disabled = false;
    $('#abort')[0].disabled = true;
    socket.emit('abort', recordingId);
}

// Overload the Blockly defined template callback
Blockly.FieldTemplate.prototype.defineTemplateCallback = function(caller, name) {
    /*var inspectorWidgetPlugin = inspectorWidgetFindPlugin('InspectorWidgetPlugin');
    if (inspectorWidgetPlugin) {
        inspectorWidgetPlugin.openAddShape(caller, templateDefinedCallback);
    }
    return;*/
    confirmCallback = function(value) {
        console.log(value);
        if (value === true) {
            block = caller.sourceBlock_;
            justDefined['template'] = block;
        }
    }
    Blockly.confirm('Click and move on the video to draw a region you desire to match.', confirmCallback)
    return;
}

// Overload the Blockly defined accessible callback
Blockly.FieldAccessible.prototype.defineAccessibleCallback = function(caller, name) {
    confirmCallback = function(value) {
        console.log(value);
        if (value === true) {
            block = caller.sourceBlock_;
            justDefined['accessible'] = block;
        }
    }
    Blockly.confirm('Hover the video. Accessible widgets appear in blue. Click on the one you desire to match.', confirmCallback)
    return;
}

// Overload the workspace clean up function to compress vertical space
Blockly.WorkspaceSvg.prototype.cleanUp = function() {
    Blockly.Events.setGroup(true);
    var topBlocks = this.getTopBlocks(true);
    var cursorY = 0;
    for (var i = 0, block; block = topBlocks[i]; i++) {
        var xy = block.getRelativeToSurfaceXY();
        block.moveBy(-xy.x, cursorY - xy.y);
        block.snapToGrid();
        cursorY = block.getRelativeToSurfaceXY().y +
            block.getHeightWidth().height; // + Blockly.BlockSvg.MIN_BLOCK_Y;
    }
    Blockly.Events.setGroup(false);
    // Fire an event to allow scrollbars to resize.
    this.resizeContents();
};
