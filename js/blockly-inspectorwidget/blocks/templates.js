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
 * @fileoverview Template blocks for Blockly (forked from template blocks).
 * @author gmail.com:christian.frisson (Christian Frisson)
 * @author fraser@google.com (Neil Fraser)
 */
'use strict';

goog.provide('Blockly.Blocks.templates');

goog.require('Blockly.Blocks');
goog.require('Blockly.ThumbnailMutator');

/**
 * Common HSV hue for all blocks in this category.
 */
Blockly.Blocks.templates.HUE = 280;

/* Overload */

Blockly.Block.prototype.interpolate_ = function(message, args, lastDummyAlign) {
  var tokens = Blockly.tokenizeInterpolation(message);
  // Interpolate the arguments.  Build a list of elements.
  var indexDup = [];
  var indexCount = 0;
  var elements = [];
  for (var i = 0; i < tokens.length; i++) {
    var token = tokens[i];
    if (typeof token == 'number') {
      goog.asserts.assert(token > 0 && token <= args.length,
          'Message index "%s" out of range.', token);
      goog.asserts.assert(!indexDup[token],
          'Message index "%s" duplicated.', token);
      indexDup[token] = true;
      indexCount++;
      elements.push(args[token - 1]);
    } else {
      token = token.trim();
      if (token) {
        elements.push(token);
      }
    }
  }
  goog.asserts.assert(indexCount == args.length,
      'Message does not reference all %s arg(s).', args.length);
  // Add last dummy input if needed.
  if (elements.length && (typeof elements[elements.length - 1] == 'string' ||
      elements[elements.length - 1]['type'].indexOf('field_') == 0)) {
    var input = {type: 'input_dummy'};
    if (lastDummyAlign) {
      input['align'] = lastDummyAlign;
    }
    elements.push(input);
  }
  // Lookup of alignment constants.
  var alignmentLookup = {
    'LEFT': Blockly.ALIGN_LEFT,
    'RIGHT': Blockly.ALIGN_RIGHT,
    'CENTRE': Blockly.ALIGN_CENTRE
  };
  // Populate block with inputs and fields.
  var fieldStack = [];
  for (var i = 0; i < elements.length; i++) {
    var element = elements[i];
    if (typeof element == 'string') {
      fieldStack.push([element, undefined]);
    } else {
      var field = null;
      var input = null;
      do {
        var altRepeat = false;
        switch (element['type']) {
          case 'input_value':
            input = this.appendValueInput(element['name']);
            break;
          case 'input_statement':
            input = this.appendStatementInput(element['name']);
            break;
          case 'input_dummy':
            input = this.appendDummyInput(element['name']);
            break;
          case 'field_label':
            field = new Blockly.FieldLabel(element['text'], element['class']);
            break;
          case 'field_input':
            field = new Blockly.FieldTextInput(element['text']);
            if (typeof element['spellcheck'] == 'boolean') {
              field.setSpellcheck(element['spellcheck']);
            }
            break;
          case 'field_angle':
            field = new Blockly.FieldAngle(element['angle']);
            break;
          case 'field_checkbox':
            field = new Blockly.FieldCheckbox(
                element['checked'] ? 'TRUE' : 'FALSE');
            break;
          case 'field_colour':
            field = new Blockly.FieldColour(element['colour']);
            break;
          case 'field_variable':
            field = new Blockly.FieldVariable(element['variable']);
            break;
          case 'field_template':
            field = new Blockly.FieldTemplate(element['template']);
            break;
          case 'field_dropdown':
            field = new Blockly.FieldDropdown(element['options']);
            break;
          case 'field_image':
            field = new Blockly.FieldImage(element['src'],
                element['width'], element['height'], element['alt']);
            break;
          case 'field_date':
            if (Blockly.FieldDate) {
              field = new Blockly.FieldDate(element['date']);
              break;
            }
            // Fall through if FieldDate is not compiled in.
          default:
            // Unknown field.
            if (element['alt']) {
              element = element['alt'];
              altRepeat = true;
            }
        }
      } while (altRepeat);
      if (field) {
        fieldStack.push([field, element['name']]);
      } else if (input) {
        if (element['check']) {
          input.setCheck(element['check']);
        }
        if (element['align']) {
          input.setAlign(alignmentLookup[element['align']]);
        }
        for (var j = 0; j < fieldStack.length; j++) {
          input.appendField(fieldStack[j][0], fieldStack[j][1]);
        }
        fieldStack.length = 0;
      }
    }
  }
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

Blockly.Blocks['template_get'] = {
  /**
   * Block for template getter.
   * @this Blockly.Block
   */
  init: function() {
    this.setHelpUrl(Blockly.Msg.TEMPLATES_GET_HELPURL);
    this.setColour(Blockly.Blocks.templates.HUE);
    this.appendDummyInput()
        .appendField(new Blockly.FieldTemplate(
        'template'/*Blockly.Msg.TEMPLATES_DEFAULT_NAME*/), 'TEMPLATE');
    this.setOutput(true);
    this.setTooltip(Blockly.Msg.TEMPLATES_GET_TOOLTIP);
    this.contextMenuMsg_ = Blockly.Msg.TEMPLATES_GET_CREATE_SET;
  },
  /**
   * Return all templates referenced by this block.
   * @return {!Array.<string>} List of template names.
   * @this Blockly.Block
   */
  getTemplates: function() {
    return [this.getFieldValue('TEMPLATE')];
  },
  /**
   * Notification that a template is renaming.
   * If the name matches one of this block's templates, rename it.
   * @param {string} oldName Previous name of template.
   * @param {string} newName Renamed template.
   * @this Blockly.Block
   */
  renameTemplate: function(oldName, newName) {
    if (Blockly.Names.equals(oldName, this.getFieldValue('TEMPLATE'))) {
      this.setFieldValue(newName, 'TEMPLATE');
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
    var name = this.getFieldValue('TEMPLATE');
    option.text = this.contextMenuMsg_.replace('%1', name);
    var xmlField = goog.dom.createDom('field', null, name);
    xmlField.setAttribute('name', 'TEMPLATE');
    var xmlBlock = goog.dom.createDom('block', null, xmlField);
    xmlBlock.setAttribute('type', this.contextMenuType_);
    option.callback = Blockly.ContextMenu.callbackFactory(this, xmlBlock);
    options.push(option);
  }
};

Blockly.Blocks['template_set'] = {
    init: function() {
        this.jsonInit({
            "message0": '%1= template(%2,%3,%4,%5,%7,%6)',
            "args0": [
                {
                    "type": "field_template",
                    "name": "TEMPLATE",
                    "template": 'template'/*Blockly.Msg.TEMPLATES_DEFAULT_NAME*/
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
		this.setColour(Blockly.Blocks.templates.HUE);  
    },

    /**
   * Return all variables referenced by this block.
   * @return {!Array.<string>} List of variable names.
   * @this Blockly.Block
   */
    getTemplates: function() {
        return [this.getFieldValue('TEMPLATE')/*, 
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
    renameTemplate: function(oldName, newName) {
        if (Blockly.Names.equals(oldName, this.getFieldValue('TEMPLATE'))) {
            this.setFieldValue(newName, 'TEMPLATE');
        }
    },
    contextMenuType_: 'template_get',
    customContextMenu: Blockly.Blocks['template_get'].customContextMenu


};
