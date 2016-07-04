'use strict';

goog.provide('Blockly.Blocks.InspectorWidget');

goog.require('Blockly.Blocks');

goog.require('Blockly.Bubble');

//goog.provide('Blockly.JavaScript.variables');
goog.provide('Blockly.JavaScript.InspectorWidget');

goog.require('Blockly.JavaScript');

/**
 * Initialise the database of variable names.
 * @param {!Blockly.Workspace} workspace Workspace to generate code from.
 */
Blockly.JavaScript.init = function(workspace) {
    // Create a dictionary of definitions to be printed before the code.
    Blockly.JavaScript.definitions_ = Object.create(null);
    // Create a dictionary mapping desired function names in definitions_
    // to actual function names (to avoid collisions with user functions).
    Blockly.JavaScript.functionNames_ = Object.create(null);

    if (!Blockly.JavaScript.variableDB_) {
        Blockly.JavaScript.variableDB_ =
            new Blockly.Names(Blockly.JavaScript.RESERVED_WORDS_);
    } else {
        Blockly.JavaScript.variableDB_.reset();
    }

    /**
 * Workaround: do not define the variables in the JavaScript code
**/
    /*var defvars = [];
  var variables = Blockly.Variables.allVariables(workspace);
  for (var i = 0; i < variables.length; i++) {
    defvars[i] = 'var ' +
        Blockly.JavaScript.variableDB_.getName(variables[i],
        Blockly.Variables.NAME_TYPE) + ';';
  }
  Blockly.JavaScript.definitions_['variables'] = defvars.join('\n');*/
};


/**
 * Common HSV hue for all blocks in this category.
 */
Blockly.Blocks.variables.HUE = 330;

Blockly.Blocks['template_get'] = {
    /**
   * Block for variable getter.
   * @this Blockly.Block
   */
    init: function() {
        this.setHelpUrl(Blockly.Msg.VARIABLES_GET_HELPURL);
        this.setColour(Blockly.Blocks.variables.HUE);
        this.appendDummyInput()
            .appendField(new Blockly.FieldVariable(
            'template_name'/*Blockly.Msg.VARIABLES_DEFAULT_NAME*/), 'VAR');
        this.setOutput(true);
        this.setTooltip(Blockly.Msg.VARIABLES_GET_TOOLTIP);
        this.contextMenuMsg_ = Blockly.Msg.VARIABLES_GET_CREATE_SET;
    },
    /**
   * Return all variables referenced by this block.
   * @return {!Array.<string>} List of variable names.
   * @this Blockly.Block
   */
    getVars: function() {
        return [this.getFieldValue('VAR')];
    },
    /**
   * Notification that a variable is renaming.
   * If the name matches one of this block's variables, rename it.
   * @param {string} oldName Previous name of variable.
   * @param {string} newName Renamed variable.
   * @this Blockly.Block
   */
    renameVar: function(oldName, newName) {
        if (Blockly.Names.equals(oldName, this.getFieldValue('VAR'))) {
            this.setFieldValue(newName, 'VAR');
        }
    },
    contextMenuType_: 'template_set',
    /**
   * Add menu option to create getter/setter block for this setter/getter.
   * @param {!Array} options List of menu options to add to.
   * @this Blockly.Block
   */
    customContextMenu: function(options) {
        var option = {enabled: true};
        var name = this.getFieldValue('VAR');
        option.text = this.contextMenuMsg_.replace('%1', name);
        var xmlField = goog.dom.createDom('field', null, name);
        xmlField.setAttribute('name', 'VAR');
        var xmlBlock = goog.dom.createDom('block', null, xmlField);
        xmlBlock.setAttribute('type', this.contextMenuType_);
        option.callback = Blockly.ContextMenu.callbackFactory(this, xmlBlock);
        options.push(option);
    }
};

function findInspectorWidgetPlugin(arr) {
    for(var i=0; i<arr.length; i++) {
        if (arr[i].namespace == "fr.ina.amalia.player.plugins.InspectorWidgetPlugin") return arr[i];
    }
    return null;
};

function drawingCallback(caller,msg) {
    var block = caller.sourceBlock_;
        function done (id,err, result) {
            console.log('from id',id);
            if (err) {
                console.log('Error',err);
                return;
            }
            else{
                var id = block.getFieldValue('VIDEO');
                var template = block.getFieldValue('VAR');
                var url = '/data/' + id + '/mp4/' + template + '.png';
                block.thumbnailMutator_.changeSrc(url);
                return;
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
        var socket = io();
        socket.emit('run',recordingId,code,done);
    }
}

Blockly.Msg.REDEFINE_TEMPLATE = 'Reselect variable...';

/**
 * Return a sorted list of variable names for variable dropdown menus.
 * Include a special option at the end for creating a new variable name.
 * @return {!Array.<string>} Array of variable names.
 * @this {!Blockly.FieldVariable}
 */
Blockly.FieldVariable.dropdownCreate = function() {
  if (this.sourceBlock_ && this.sourceBlock_.workspace) {
    var variableList =
        Blockly.Variables.allVariables(this.sourceBlock_.workspace);
  } else {
    var variableList = [];
  }
  // Ensure that the currently selected variable is an option.
  var name = this.getText();
  if (name && variableList.indexOf(name) == -1) {
    variableList.push(name);
  }
  variableList.sort(goog.string.caseInsensitiveCompare);
  variableList.push(Blockly.Msg.RENAME_VARIABLE);
  variableList.push(Blockly.Msg.NEW_VARIABLE);
  if(this.sourceBlock_ && this.sourceBlock_.type === 'template_set'){
    variableList.push(Blockly.Msg.REDEFINE_TEMPLATE);
  }
  // Variables are not language-specific, use the name as both the user-facing
  // text and the internal representation.
  var options = [];
  for (var x = 0; x < variableList.length; x++) {
    options[x] = [variableList[x], variableList[x]];
  }
  return options;
};

Blockly.FieldVariable.dropdownChange = function(text) {

    function promptName(promptText, defaultText) {
        Blockly.hideChaff();
        var newVar = window.prompt(promptText, defaultText);
        // Merge runs of whitespace.  Strip leading and trailing whitespace.
        // Beyond this, all names are legal.
        if (newVar) {
            newVar = newVar.replace(/[\s\xa0]+/g, ' ').replace(/^ | $/g, '');
            if (newVar == Blockly.Msg.RENAME_VARIABLE ||
                newVar == Blockly.Msg.NEW_VARIABLE ||
                newVar == Blockly.Msg.REDEFINE_TEMPLATE
                ) {
                // Ok, not ALL names are legal...
                newVar = null;
            }
        }
        return newVar;
    }
    var workspace = this.sourceBlock_.workspace;
    console.log(this.sourceBlock_)
    if (text == Blockly.Msg.RENAME_VARIABLE) {
        var oldVar = this.getText();
        text = promptName(Blockly.Msg.RENAME_VARIABLE_TITLE.replace('%1', oldVar),
                          oldVar);
        if (text) {
            Blockly.Variables.renameVariable(oldVar, text, workspace);
        }
        return null;
    } else if (text == Blockly.Msg.NEW_VARIABLE || (Blockly.Msg.REDEFINE_TEMPLATE && this.sourceBlock_.type === 'template_set')) {
        var msg = this.getText();
        if (text == Blockly.Msg.NEW_VARIABLE){
        
        var newtext = promptName(Blockly.Msg.NEW_VARIABLE_TITLE, '');
        // Since variables are case-insensitive, ensure that if the new variable
        // matches with an existing variable, the new case prevails throughout.
        
        if (newtext) {
            Blockly.Variables.renameVariable('', newtext, workspace);
            msg = newtext;
        }
        }
        
        var plugList = $( ".ajs" ).data('fr.ina.amalia.player').player.pluginManager.plugins;        
        var plug = findInspectorWidgetPlugin(plugList);
        plug.openAddShape(this,drawingCallback);
        
        return msg;
    }    
    return undefined;
};


/**
 * Ensure that only a nonnegative float with 2 digits of precision may be entered.
 * @param {string} text The user's text.
 * @return {?string} A string representing a valid value, or null if invalid.
 */
Blockly.FieldTextInput.nonnegativeTwoDigitFloatValidator = function(text) {
    var n = Blockly.FieldTextInput.numberValidator(text);
    if (n) {
        n = String(Math.max(0, n));
    }
    return parseFloat(n).toFixed(2);
};

/**
 * Ensure that only a nonnegative float with 4 digits of precision may be entered.
 * @param {string} text The user's text.
 * @return {?string} A string representing a valid value, or null if invalid.
 */
Blockly.FieldTextInput.nonnegativeFourDigitFloatValidator = function(text) {
    var n = Blockly.FieldTextInput.numberValidator(text);
    if (n) {
        n = String(Math.max(0, n));
    }
    return parseFloat(n).toFixed(4);
};


// Thumbnail mutator

goog.require('Blockly.Mutator');

/**
 * Class for a mutator dialog.
 * @param {!Array.<string>} quarkNames List of names of sub-blocks for flyout.
 * @extends {Blockly.Icon}
 * @constructor
 */
Blockly.ThumbnailMutator = function(src) {
  Blockly.ThumbnailMutator.superClass_.constructor.call(this, null);
    this.src_ = src;
};
goog.inherits(Blockly.ThumbnailMutator, Blockly.Mutator);


/**
 * Draw the mutator icon.
 * @param {!Element} group The icon group.
 * @private
 */
Blockly.ThumbnailMutator.prototype.drawIcon_ = function(group) {
    this.iconElement_ = Blockly.createSvgElement('image',
      {'height': 20 + 'px',
       'width': 20 + 'px'},group);
    this.iconElement_.setAttributeNS('http://www.w3.org/1999/xlink',
        'xlink:href', goog.isString(this.src_) ? this.src_ : '');
};

/**
 * Draw the mutator icon.
 * @param {!Element} group The icon group.
 * @private
 */
Blockly.ThumbnailMutator.prototype.changeSrc = function(src) {
    this.src_ = src;
    this.iconElement_.setAttributeNS('http://www.w3.org/1999/xlink',
        'xlink:href', goog.isString(this.src_) ? this.src_ : '');
    if(this.popupElement_){
        this.popupElement_.setAttributeNS('http://www.w3.org/1999/xlink',
        'xlink:href', goog.isString(this.src_) ? this.src_ : '');
    }
};


/**
 * Create the editor for the mutator's bubble.
 * @return {!Element} The top-level node of the editor.
 * @private
 */
Blockly.ThumbnailMutator.prototype.createEditor_ = function() {
  /* Create the editor.  Here's the markup that will be generated:
  <svg>
    [Workspace]
  </svg>
  */
  this.svgDialog_ = Blockly.createSvgElement('svg',
      {'x': Blockly.Bubble.BORDER_WIDTH, 'y': Blockly.Bubble.BORDER_WIDTH},
      null);
    
  var workspaceOptions = {
    languageTree: null,
    parentWorkspace: this.block_.workspace,
    pathToMedia: this.block_.workspace.options.pathToMedia,
    RTL: this.block_.RTL,
    getMetrics: this.getFlyoutMetrics_.bind(this),
    setMetrics: null
  };
  this.workspace_ = new Blockly.WorkspaceSvg(workspaceOptions);
    
    this.popupElement_ = Blockly.createSvgElement('image',
      {'height': 200 + 'px',
       'width': 200 + 'px'},this.svgDialog_).setAttributeNS('http://www.w3.org/1999/xlink',
        'xlink:href', goog.isString(this.src_) ? this.src_ : '')

    return this.svgDialog_;
};

/**
 * Show or hide the mutator bubble.
 * @param {boolean} visible True if the bubble should be visible.
 */
Blockly.ThumbnailMutator.prototype.setVisible = function(visible) {
  if (visible == this.isVisible()) {
    // No change.
    return;
  }
  if (visible) {
    // Create the bubble.
    this.bubble_ = new Blockly.Bubble(this.block_.workspace,
        this.createEditor_(), this.block_.svgPath_,
        this.iconX_, this.iconY_, null, null);
      // Click on bubble to hid it
      Blockly.bindEvent_(this.svgDialog_, 'mouseup', this, this.iconClick_);    
      
    var tree = this.workspace_.options.languageTree;
    if (tree) {
      this.workspace_.flyout_.init(this.workspace_);
      this.workspace_.flyout_.show(tree.childNodes);
    }
    if (this.workspace_.flyout_) {
      var margin = this.workspace_.flyout_.CORNER_RADIUS * 2;
      var x = this.workspace_.flyout_.width_ + margin;
    } else {
      var margin = 16;
      var x = margin;
    }
    if (this.block_.RTL) {
      x = -x;
    }
    this.updateColour();
  } else {
    // Dispose of the bubble.
    this.svgDialog_ = null;
    this.workspace_.dispose();
    this.workspace_ = null;
    this.rootBlock_ = null;
    this.bubble_.dispose();
    this.bubble_ = null;
    this.workspaceWidth_ = 0;
    this.workspaceHeight_ = 0;
  }
};


//var newVar = window.prompt('promptText', 'defaultText');

Blockly.Blocks['template_set'] = {
    init: function() {
        this.jsonInit({
            "message0": '%1= template(%2,%3,%4,%5,%7,%6)',
            "args0": [
                {
                    "type": "field_variable",
                    "name": "VAR",
                    "variable": 'template_name'/*Blockly.Msg.VARIABLES_DEFAULT_NAME*/
                },
                {
                    "type": "field_input",
                    "name": "X",
                    "text": "x"
                },
                {
                    "type": "field_input",
                    "name": "Y",
                    "text": "y"
                },
                {
                    "type": "field_input",
                    "name": "W",
                    "text": "w"
                },
                {
                    "type": "field_input",
                    "name": "H",
                    "text": "h"
                },
                {
                    "type": "field_input",
                    "name": "VIDEO",
                    "text": "video"
                },
                {
                    "type": "field_input",
                    "name": "TIME",
                    "text": "time"
                }
            ],
            "tooltip": "Define a template image by selecting a region on a video frame at a given time. When choosing a new/other template name, the region can be selected by shift-clicking on the video on the right.",
            "helpUrl": "http://www.github.com/InspectorWidget/InspectorWidget",
            "inputsInline" : true,
        });
       
        this.getField('X').setValidator(Blockly.FieldTextInput.nonnegativeFourDigitFloatValidator);
        this.getField('Y').setValidator(Blockly.FieldTextInput.nonnegativeFourDigitFloatValidator);
        this.getField('W').setValidator(Blockly.FieldTextInput.nonnegativeFourDigitFloatValidator);
        this.getField('H').setValidator(Blockly.FieldTextInput.nonnegativeFourDigitFloatValidator);
        this.getField('TIME').setValidator(Blockly.FieldTextInput.nonnegativeFourDigitFloatValidator);
        /*this.setPreviousStatement(true);
        this.setNextStatement(true);*/ // otherwise these can be statements
        this.thumbnailMutator_ = new Blockly.ThumbnailMutator();
        this.setMutator(this.thumbnailMutator_);        
    },

    /**
   * Return all variables referenced by this block.
   * @return {!Array.<string>} List of variable names.
   * @this Blockly.Block
   */
    getVars: function() {
        return [this.getFieldValue('VAR')/*, 
                this.getFieldValue('X'), 
                this.getFieldValue('Y'), 
                this.getFieldValue('W'), 
                this.getFieldValue('H'),
                this.getFieldValue('VIDEO'),
                this.getFieldValue('TIME')*/
               ];
    },
    /**
   * Notification that a variable is renaming.
   * If the name matches one of this block's variables, rename it.
   * @param {string} oldName Previous name of variable.
   * @param {string} newName Renamed variable.
   * @this Blockly.Block
   */
    renameVar: function(oldName, newName) {
        if (Blockly.Names.equals(oldName, this.getFieldValue('VAR'))) {
            this.setFieldValue(newName, 'VAR');
        }
    },
    contextMenuType_: 'template_get',
    customContextMenu: Blockly.Blocks['template_get'].customContextMenu


};

Blockly.Blocks['match_template'] = {
    init: function() {
        this.jsonInit({
            "message0": 'matchTemplate(%1)',
            "args0": [
                {
                    "type": "field_variable",
                    "name": "VAR",
                    "variable": 'template_name'
                }
            ],
            "tooltip": "Match template over the video(s).",
            "helpUrl": "http://www.github.com/InspectorWidget/InspectorWidget",
            "inputsInline" : true,
            "previousStatement": null,
            "nextStatement": null,
        });
    },

    /**
   * Return all variables referenced by this block.
   * @return {!Array.<string>} List of variable names.
   * @this Blockly.Block
   */
    getVars: function() {
        return [this.getFieldValue('VAR')];
    },
    /**
   * Notification that a variable is renaming.
   * If the name matches one of this block's variables, rename it.
   * @param {string} oldName Previous name of variable.
   * @param {string} newName Renamed variable.
   * @this Blockly.Block
   */
    renameVar: function(oldName, newName) {
        if (Blockly.Names.equals(oldName, this.getFieldValue('VAR'))) {
            this.setFieldValue(newName, 'VAR');
        }
    },
    /*contextMenuType_: 'variables_get',
  customContextMenu: Blockly.Blocks['variables_get'].customContextMenu*/


};

Blockly.JavaScript['template_set'] = function(block) {
    // Variable setter.
    var argument0 = Blockly.JavaScript.valueToCode(block, 'VALUE',
                                                   Blockly.JavaScript.ORDER_ASSIGNMENT) || '0';
    var x = block.getFieldValue('X'); 
    var y = block.getFieldValue('Y'); 
    var w = block.getFieldValue('W');
    var h = block.getFieldValue('H');
    var v = block.getFieldValue('VIDEO');
    var t = block.getFieldValue('TIME');
    var varName = Blockly.JavaScript.variableDB_.getName(
        block.getFieldValue('VAR'), Blockly.Variables.NAME_TYPE);
    return varName + ' = template(' + x + ',' + y + ',' + w + ',' + h + ',\'' + v + '\',' + t + ');\n';
};

Blockly.JavaScript['template_get'] = function(block) {
    // Variable getter.
    var code = Blockly.JavaScript.variableDB_.getName(block.getFieldValue('VAR'),
                                                      Blockly.Variables.NAME_TYPE);
    return [code, Blockly.JavaScript.ORDER_ATOMIC];
};

Blockly.JavaScript['match_template'] = function(block) {
    // Variable setter.
    var argument0 = Blockly.JavaScript.valueToCode(block, 'VALUE',
                                                   Blockly.JavaScript.ORDER_ASSIGNMENT) || '0';
    var varName = Blockly.JavaScript.variableDB_.getName(
        block.getFieldValue('VAR'), Blockly.Variables.NAME_TYPE);
    return 'matchTemplate('+varName + ');';
};

Blockly.JavaScript['controls_if'] = function(block) {
    // If/elseif/else condition.
    var n = 0;
    var argument = Blockly.JavaScript.valueToCode(block, 'IF' + n,
                                                  Blockly.JavaScript.ORDER_NONE) || 'false';
    var branch = Blockly.JavaScript.statementToCode(block, 'DO' + n);
    var code = 'if (' + argument + ') {' + branch + '}';
    for (n = 1; n <= block.elseifCount_; n++) {
        argument = Blockly.JavaScript.valueToCode(block, 'IF' + n,
                                                  Blockly.JavaScript.ORDER_NONE) || 'false';
        branch = Blockly.JavaScript.statementToCode(block, 'DO' + n);
        code += ' else if (' + argument + ') {' + branch + '}';
    }
    if (block.elseCount_) {
        branch = Blockly.JavaScript.statementToCode(block, 'ELSE');
        code += ' else {' + branch + '}';
    }
    return code;
};


/**
 * Block for template extraction.
 * @this Blockly.Block
*/

var EXTRACT_TESTS =
    [
        ["if", 'IF'],
        ["between", 'BETWEEN'],
        ["above", 'ABOVE'],
        ["below", 'BELOW'],
        ["leftof", 'LEFTOF'],
        ["rightof", 'RIGHTOF'],
        ["inrect", 'INRECT']
    ]; 

Blockly.Blocks['extract_test'] = {

    /**
   * Block for template extraction.
   * @this Blockly.Block
   */
    init: function() {
        this.appendDummyInput()
            .appendField(new Blockly.FieldDropdown(EXTRACT_TESTS, function(option) {
            this.sourceBlock_.updateShape_(option);
        }), 'MODE')
        this.appendStatementInput('ACTION');
        this.setInputsInline(true);  
        this.setPreviousStatement(true);
        this.setNextStatement(true);
        this.setInputsInline(true);
        // Assign 'this' to a variable for use in the tooltip closure below.
        var thisBlock = this;
        this.setTooltip(function() {
            var op = thisBlock.getFieldValue('MODE');
            var TOOLTIPS = {
                'IF': "if the template is matched in a frame, then do some analysis",
                'BETWEEN': "if both template match in a frame, then do some analysis between both",
                'ABOVE' : "if the template is matched in a frame, then do some analysis above it in the frame",
                'BELOW' : "if the template is matched in a frame, then do some analysis below it in the frame",
                'LEFTOF': "if the template is matched in a frame, then do some analysis left to it in the frame",
                'RIGHTOF': "if the template is matched in a frame, then do some analysis right to it in the frame",
                'INRECT': "do some analysis on each frame in a rectangle of given x and y coordinates and width and height",
            };
            return TOOLTIPS[op];
        });
        this.setHelpUrl('https://github.com/InspectorWidget/InspectorWidget');
        this.setColour(Blockly.Blocks.loops.HUE);
        if(EXTRACT_TESTS.length > 0){
            this.updateShape_(EXTRACT_TESTS[0][1]);
        }
    },
    /**
   * Create XML to represent the extraction test.
   * @return {Element} XML storage element.
   * @this Blockly.Block
   */
    mutationToDom: function() {
        var container = document.createElement('mutation');
        var input = this.getFieldValue('MODE');
        for(var f=0; f<EXTRACT_TESTS.length;f++){
            if(input === EXTRACT_TESTS[f][1]){
                container.setAttribute('input_',EXTRACT_TESTS[f][1]);
                return container;
            }
        }
        return container;
    },
    /**
   * Parse XML to restore the extraction test.
   * @param {!Element} xmlElement XML storage element.
   * @this Blockly.Block
   */
    domToMutation: function(xmlElement) {
        var input = xmlElement.getAttribute('input_');
        for(var f=0; f<EXTRACT_TESTS.length;f++){
            if(input === EXTRACT_TESTS[f][1]){
                this.updateShape_(EXTRACT_TESTS[f][1]);
                return;
            }
        }
    },
    /**
   * Modify this block along the extraction test.
   * @param {String} extraction test name.
   * @private
   * @this Blockly.Block
   */
    updateShape_: function(test) {
        var testValueInputExists = this.getInput('TEST_VALUE');
        if (testValueInputExists) {
            this.removeInput('TEST_VALUE');
        }

        if (test === 'IF'){
            // add bolean input
            //if (!testValueInputExists) {
            this.appendValueInput('TEST_VALUE')
                .setCheck('Boolean')

            //this.moveInputBefore('TEST_VALUE','ACTION')
            //}
        }
        else if (test === 'BETWEEN'){
            // add inputs for 2 templates
            this.appendDummyInput('TEST_VALUE')
                .appendField(new Blockly.FieldLabel('('))
                .appendField(new Blockly.FieldVariable('template1'), 'VAR1')
                .appendField(new Blockly.FieldLabel(','))
                .appendField(new Blockly.FieldVariable('template2'), 'VAR2')
                .appendField(new Blockly.FieldLabel(')'));

        }
        else if (test === 'ABOVE' || test === 'BELOW' || test === 'LEFTOF' || test === 'RIGHTOF'){
            // add input for 1 template
            this.appendDummyInput('TEST_VALUE')
                .appendField(new Blockly.FieldLabel('('))
                .appendField(new Blockly.FieldVariable('template'), 'VAR')
                .appendField(new Blockly.FieldLabel(')'));
        }
        else if (test === 'INRECT'){
            /*if (testValueInputExists) {
                this.removeInput('TEST_VALUE');
            }*/
            // add inputs for: x,y,w,h,video,time,image
            this.appendDummyInput('TEST_VALUE')
                .appendField(new Blockly.FieldLabel('('))
                .appendField(new Blockly.FieldTextInput('x',Blockly.FieldTextInput.nonnegativeFourDigitFloatValidator), 'X')
                .appendField(new Blockly.FieldLabel(','))
                .appendField(new Blockly.FieldTextInput('y',Blockly.FieldTextInput.nonnegativeFourDigitFloatValidator),'Y')
                .appendField(new Blockly.FieldLabel(','))
                .appendField(new Blockly.FieldTextInput('width',Blockly.FieldTextInput.nonnegativeFourDigitFloatValidator),'W')
                .appendField(new Blockly.FieldLabel(','))
                .appendField(new Blockly.FieldTextInput('height',Blockly.FieldTextInput.nonnegativeFourDigitFloatValidator),'H')
                .appendField(new Blockly.FieldLabel(')'))
        }
        else{
            // TODO: better handle error here
            console.log('Error for block extract_test: updating shape for test '+test+' unhandled.');
        }
        this.moveInputBefore('TEST_VALUE','ACTION');
    }
};

Blockly.JavaScript['extract_test'] = function(block) {

    var isIf = block.getFieldValue('MODE') == 'IF';
    var isBetween = block.getFieldValue('MODE') == 'BETWEEN';
    var isAbove = block.getFieldValue('MODE') == 'ABOVE';
    var isBelow = block.getFieldValue('MODE') == 'BELOW';
    var isLeftOf = block.getFieldValue('MODE') == 'LEFTOF';
    var isRightOf = block.getFieldValue('MODE') == 'RIGHTOF';
    var isInRect = block.getFieldValue('MODE') == 'INRECT';
    var argument0 = Blockly.JavaScript.valueToCode(block, 'TEST_VALUE',
                                                   /*until ? Blockly.JavaScript.ORDER_LOGICAL_NOT :*/
                                                   Blockly.JavaScript.ORDER_NONE) || 'false';
    var argument1;//= block.getFieldValue('TEMPLATE_NAME');
    
    var test = block.getFieldValue('MODE');
    
    if (test === 'IF'){
        argument1 = Blockly.JavaScript.valueToCode(block, 'TEST_VALUE',
                                                   /*until ? Blockly.JavaScript.ORDER_LOGICAL_NOT :*/
                                                   Blockly.JavaScript.ORDER_NONE) || 'false';
    }
    else if (test === 'BETWEEN'){
        argument1 = block.getFieldValue('VAR1') + ',' + block.getFieldValue('VAR2');
    }
    else if (test === 'ABOVE' || test === 'BELOW' || test === 'LEFTOF' || test === 'RIGHTOF'){
        argument1 = block.getFieldValue('VAR');
    }
    else if (test === 'INRECT'){
        argument1 = block.getFieldValue('X') + ',' + block.getFieldValue('Y') + ',' + block.getFieldValue('W') + ',' + block.getFieldValue('H');
    }
    else{
        // TODO: better handle error here
        console.log('Error for block extract_test: JavaScript export for test '+test+' unhandled.');
    }
    
    var branch = Blockly.JavaScript.statementToCode(block, 'ACTION');
    branch = Blockly.JavaScript.addLoopTrap(branch, block.id);
    var name ='';
    if (isIf) {name = 'if';}
    else if (isBetween) {name = 'between';}
    else if (isAbove) {name = 'above';}
    else if (isBelow) {name = 'below';}
    else if (isLeftOf) {name = 'leftof';}
    else if (isRightOf) {name = 'rightof';}
    else if (isInRect) {name = 'inrect';}
    return name +'(' + argument1 + ') {' + branch + '}\n';
};

////

var DETECT_TYPES =
    [
        ["detectText", 'TEXT'],
        ["detectNumber", 'NUMBER'],
        ["detectTime", 'TIME'],
    ]; 

Blockly.Blocks['detect_alphanum'] = {

    /**
   * Block for text extraction.
   * @this Blockly.Block
   */
    init: function() {
        this.appendDummyInput()
            .appendField(new Blockly.FieldDropdown(DETECT_TYPES, function(option) {
            this.sourceBlock_.updateShape_(option);
        }), 'MODE')
        this.setInputsInline(true);  
        this.setPreviousStatement(true);
        this.setNextStatement(true);
        this.setInputsInline(true);
        // Assign 'this' to a variable for use in the tooltip closure below.
        var thisBlock = this;
        this.setTooltip(function() {
            var op = thisBlock.getFieldValue('MODE');
            var TOOLTIPS = {
                'TEXT': "detect text",
                'NUMBER': "detect numbers (characters restricted to digits)",
                'TIME': "detect time (characters restricted to digits and time delimiters ':','-',' ')",
            };
            return TOOLTIPS[op];
        });
        this.setHelpUrl('https://github.com/InspectorWidget/InspectorWidget');
        //this.setColour(Blockly.Blocks.loops.HUE);
        if(DETECT_TYPES.length > 0){
            this.updateShape_(DETECT_TYPES[0][1]);
        }
    },
    /**
   * Create XML to represent the text detection type.
   * @return {Element} XML storage element.
   * @this Blockly.Block
   */
    mutationToDom: function() {
        var container = document.createElement('mutation');
        var input = this.getFieldValue('MODE');
        for(var f=0; f<DETECT_TYPES.length;f++){
            if(input === DETECT_TYPES[f][1]){
                container.setAttribute('input_',DETECT_TYPES[f][1]);
                return container;
            }
        }
        return container;
    },
    /**
   * Parse XML to restore the extraction test.
   * @param {!Element} xmlElement XML storage element.
   * @this Blockly.Block
   */
    domToMutation: function(xmlElement) {
        var input = xmlElement.getAttribute('input_');
        for(var f=0; f<DETECT_TYPES.length;f++){
            if(input === DETECT_TYPES[f][1]){
                this.updateShape_(DETECT_TYPES[f][1]);
                return;
            }
        }
    },
    /**
   * Modify this block along the extraction test.
   * @param {String} extraction test name.
   * @private
   * @this Blockly.Block
   */
    updateShape_: function(test) {
        var testValueInputExists = this.getInput('TEST_VALUE');
        if (testValueInputExists) {
            this.removeInput('TEST_VALUE');
        }

        if (test === 'TEXT' || test === 'NUMBER' || test === 'TIME'){
            // add input for 1 template
            this.appendDummyInput('TEST_VALUE')
                .appendField(new Blockly.FieldLabel('('))
                .appendField(new Blockly.FieldVariable('template'), 'VAR')
                .appendField(new Blockly.FieldLabel(')'));
        }
        else{
            // TODO: better handle error here
            console.log('Error for block detect_alphanum: updating shape for detection type '+test+' unhandled.');
        }
        //this.moveInputBefore('TEST_VALUE','ACTION');
    }
};

Blockly.JavaScript['detect_alphanum'] = function(block) {

    var argument0 = Blockly.JavaScript.valueToCode(block, 'TEST_VALUE',
                                                   /*until ? Blockly.JavaScript.ORDER_LOGICAL_NOT :*/
                                                   Blockly.JavaScript.ORDER_NONE) || 'false';
    var argument1;//= block.getFieldValue('TEMPLATE_NAME');
    
    var test = block.getFieldValue('MODE');
    var name = '';
    
    // Replace by function finding name in DETECT_TYPES 
    if (test === 'TEXT'){
        name = "detectText";
    }
    else if (test === 'NUMBER'){
        name = "detectNumber";
    }
    else if (test === 'TIME'){
        name = "detectTime";
    }
    else{
        // TODO: better handle error here
        console.log('Error for block detect_alphanum: JavaScript export for type '+test+' unhandled.');
    }
    
    if (test === 'TEXT' || test === 'NUMBER' || test === 'TIME'){
        argument1 = block.getFieldValue('VAR');
    }
    else{
        // TODO: better handle error here
        console.log('Error for block detect_alphanum: JavaScript export for type '+test+' unhandled.');
    }
        
    return name +'(' + argument1 + ')';
};


