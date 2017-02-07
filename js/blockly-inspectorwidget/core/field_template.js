/**
 * @license
 * Visual Blocks Editor
 *
 * Copyright 2012 Google Inc.
 * https://developers.google.com/blockly/
 *
 * Copyright 2016 InspectorWidget.
 * https://github.com/InspectorWidget
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview Template input field (forked from variable input field).
 * @author gmail.com:christian.frisson (Christian Frisson)
 * @author fraser@google.com (Neil Fraser)
 */
'use strict';

goog.provide('Blockly.FieldTemplate');

goog.require('Blockly.FieldDropdown');
goog.require('Blockly.Msg');
goog.require('Blockly.Templates');
goog.require('goog.string');

Blockly.Msg.NEW_TEMPLATE = "New template...";
Blockly.Msg.NEW_TEMPLATE_TITLE = "New template name:";
Blockly.Msg.RENAME_TEMPLATE = "Rename template...";
Blockly.Msg.RENAME_TEMPLATE_TITLE = "Rename all '%1' templates to:";
Blockly.Msg.TEMPLATES_DEFAULT_NAME = "item";
Blockly.Msg.TEMPLATES_GET_CREATE_SET = "Create 'set %1'";
Blockly.Msg.TEMPLATES_GET_HELPURL = "https://github.com/google/blockly/wiki/Templates#get";
Blockly.Msg.TEMPLATES_GET_TOOLTIP = "Returns the value of this template.";
Blockly.Msg.TEMPLATES_SET = "set %1 to %2";
Blockly.Msg.TEMPLATES_SET_CREATE_GET = "Create 'get %1'";
Blockly.Msg.TEMPLATES_SET_HELPURL = "https://github.com/google/blockly/wiki/Templates#set";
Blockly.Msg.TEMPLATES_SET_TOOLTIP = "Sets this template to be equal to the input.";

/**
 * Class for a template's dropdown field.
 * @param {?string} varname The default name for the template.  If null,
 *     a unique template name will be generated.
 * @param {Function=} opt_validator A function that is executed when a new
 *     option is selected.  Its sole argument is the new option value.
 * @extends {Blockly.FieldDropdown}
 * @constructor
 */
Blockly.FieldTemplate = function(varname, opt_validator) {
  Blockly.FieldTemplate.superClass_.constructor.call(this,
      Blockly.FieldTemplate.dropdownCreate, opt_validator);
  this.setValue(varname || '');
};
goog.inherits(Blockly.FieldTemplate, Blockly.FieldDropdown);

/**
 * Sets a new change handler for angle field.
 * @param {Function} handler New change handler, or null.
 */
Blockly.FieldTemplate.prototype.setValidator = function(handler) {
  var wrappedHandler;
  if (handler) {
    // Wrap the user's change handler together with the template rename handler.
    wrappedHandler = function(value) {
      var v1 = handler.call(this, value);
      if (v1 === null) {
        var v2 = v1;
      } else {
        if (v1 === undefined) {
          v1 = value;
        }
        var v2 = Blockly.FieldTemplate.dropdownChange.call(this, v1);
        if (v2 === undefined) {
          v2 = v1;
        }
      }
      return v2 === value ? undefined : v2;
    };
  } else {
    wrappedHandler = Blockly.FieldTemplate.dropdownChange;
  }
  Blockly.FieldTemplate.superClass_.setValidator.call(this, wrappedHandler);
};

/**
 * Install this dropdown on a block.
 * @param {!Blockly.Block} block The block containing this text.
 */
Blockly.FieldTemplate.prototype.init = function(block) {
  if (this.sourceBlock_) {
    // Dropdown has already been initialized once.
    return;
  }
  Blockly.FieldTemplate.superClass_.init.call(this, block);
  if (!this.getValue()) {
    // Templates without names get uniquely named for this workspace.
    var workspace =
        block.isInFlyout ? block.workspace.targetWorkspace : block.workspace;
    this.setValue(Blockly.Templates.generateUniqueName(workspace));
  }
};

/**
 * Get the template's name (use a templateDB to convert into a real name).
 * Unline a regular dropdown, templates are literal and have no neutral value.
 * @return {string} Current text.
 */
Blockly.FieldTemplate.prototype.getValue = function() {
  return this.getText();
};

/**
 * Set the template name.
 * @param {string} newValue New text.
 */
Blockly.FieldTemplate.prototype.setValue = function(newValue) {
  if (this.sourceBlock_ && Blockly.Events.isEnabled()) {
    Blockly.Events.fire(new Blockly.Events.Change(
        this.sourceBlock_, 'field', this.name, this.value_, newValue));
  }
  this.value_ = newValue;
  this.setText(newValue);
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
            //console.log('from id',id);
            if (err) {
                console.log('Error',err);
                return;
            }
            else{
                var id = block.getFieldValue('VIDEO');
                var template = block.getFieldValue('TEMPLATE');
                var url = '/data/' + id + '/' + template + '.png';
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

/**
 * Return a sorted list of template names for template dropdown menus.
 * Include a special option at the end for creating a new template name.
 * @return {!Array.<string>} Array of template names.
 * @this {!Blockly.FieldTemplate}
 */
Blockly.FieldTemplate.dropdownCreate = function() {
  if (this.sourceBlock_ && this.sourceBlock_.workspace) {
    var templateList =
        Blockly.Templates.allTemplates(this.sourceBlock_.workspace);
  } else {
    var templateList = [];
  }
  // Ensure that the currently selected template is an option.
  var name = this.getText();
  if (name && templateList.indexOf(name) == -1) {
    templateList.push(name);
  }
  templateList.sort(goog.string.caseInsensitiveCompare);
  templateList.push(Blockly.Msg.RENAME_TEMPLATE);
  templateList.push(Blockly.Msg.NEW_TEMPLATE);
  if(this.sourceBlock_ && this.sourceBlock_.type === 'template_set'){
    templateList.push(Blockly.Msg.REDEFINE_TEMPLATE);
  }
  // Templates are not language-specific, use the name as both the user-facing
  // text and the internal representation.
  var options = [];
  for (var x = 0; x < templateList.length; x++) {
    options[x] = [templateList[x], templateList[x]];
  }
  return options;
};

/**
 * Event handler for a change in template name.
 * Special case the 'New template...' and 'Rename template...' options.
 * In both of these special cases, prompt the user for a new name.
 * @param {string} text The selected dropdown menu option.
 * @return {null|undefined|string} An acceptable new template name, or null if
 *     change is to be either aborted (cancel button) or has been already
 *     handled (rename), or undefined if an existing template was chosen.
 * @this {!Blockly.FieldTemplate}
 */
Blockly.FieldTemplate.dropdownChange = function(text) {
  function promptName(promptText, defaultText) {
    Blockly.hideChaff();
    var newVar = window.prompt(promptText, defaultText);
    // Merge runs of whitespace.  Strip leading and trailing whitespace.
    // Beyond this, all names are legal.
    if (newVar) {
      newVar = newVar.replace(/[\s\xa0]+/g, ' ').replace(/^ | $/g, '');
      if (newVar == Blockly.Msg.RENAME_TEMPLATE ||
          newVar == Blockly.Msg.NEW_TEMPLATE ||
          newVar == Blockly.Msg.REDEFINE_TEMPLATE
          ) {
        // Ok, not ALL names are legal...
        newVar = null;
      }
    }
    return newVar;
  }
  var workspace = this.sourceBlock_.workspace;
  if (text == Blockly.Msg.RENAME_TEMPLATE) {
    var oldVar = this.getText();
    text = promptName(Blockly.Msg.RENAME_TEMPLATE_TITLE.replace('%1', oldVar),
                      oldVar);
    if (text) {
      Blockly.Templates.renameTemplate(oldVar, text, workspace);
    }
    return null;
  } else if (text == Blockly.Msg.NEW_TEMPLATE || (Blockly.Msg.REDEFINE_TEMPLATE && this.sourceBlock_.type === 'template_set')) {
	  var msg = this.getText();
	  if (text == Blockly.Msg.NEW_TEMPLATE){
        var newtext = promptName(Blockly.Msg.NEW_TEMPLATE_TITLE, '');
    	// Since templates are case-insensitive, ensure that if the new template
    	// matches with an existing template, the new case prevails throughout.
    	if (newtext) {
      	  	Blockly.Templates.renameTemplate('', newtext, workspace);
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
