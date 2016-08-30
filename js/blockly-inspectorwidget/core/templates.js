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
 * @fileoverview Utility functions for handling templates (forked from templates).
 * @author gmail.com:christian.frisson (Christian Frisson)
 * @author fraser@google.com (Neil Fraser)
 */
'use strict';

goog.provide('Blockly.Templates');

// TODO(scr): Fix circular dependencies
// goog.require('Blockly.Block');
goog.require('Blockly.Workspace');
goog.require('goog.string');


/**
 * Category to separate template names from procedures and generated functions.
 */
Blockly.Templates.NAME_TYPE = 'TEMPLATE';

/**
 * Find all user-created templates.
 * @param {!Blockly.Block|!Blockly.Workspace} root Root block or workspace.
 * @return {!Array.<string>} Array of template names.
 */
Blockly.Templates.allTemplates = function(root) {
  var blocks;
  if (root.getDescendants) {
    // Root is Block.
    blocks = root.getDescendants();
  } else if (root.getAllBlocks) {
    // Root is Workspace.
    blocks = root.getAllBlocks();
  } else {
    throw 'Not Block or Workspace: ' + root;
  }
  var templateHash = Object.create(null);
  // Iterate through every block and add each template to the hash.
  for (var x = 0; x < blocks.length; x++) {
    if (blocks[x].getTemplates) {
      var blockTemplates = blocks[x].getTemplates();
      for (var y = 0; y < blockTemplates.length; y++) {
        var varName = blockTemplates[y];
        // Template name may be null if the block is only half-built.
        if (varName) {
          templateHash[varName.toLowerCase()] = varName;
        }
      }
    }
  }
  // Flatten the hash into a list.
  var templateList = [];
  for (var name in templateHash) {
    templateList.push(templateHash[name]);
  }
  return templateList;
};

/**
 * Find all instances of the specified template and rename them.
 * @param {string} oldName Template to rename.
 * @param {string} newName New template name.
 * @param {!Blockly.Workspace} workspace Workspace rename templates in.
 */
Blockly.Templates.renameTemplate = function(oldName, newName, workspace) {
  var blocks = workspace.getAllBlocks();
  // Iterate through every block.
  for (var i = 0; i < blocks.length; i++) {
    if (blocks[i].renameTemplate) {
      blocks[i].renameTemplate(oldName, newName);
    }
  }
};

/**
 * Construct the blocks required by the flyout for the template category.
 * @param {!Blockly.Workspace} workspace The workspace contianing templates.
 * @return {!Array.<!Element>} Array of XML block elements.
 */
Blockly.Templates.flyoutCategory = function(workspace) {
  var templateList = Blockly.Templates.allTemplates(workspace);
  templateList.sort(goog.string.caseInsensitiveCompare);
  // In addition to the user's templates, we also want to display the default
  // template name at the top.  We also don't want this duplicated if the
  // user has created a template of the same name.
  goog.array.remove(templateList, Blockly.Msg.TEMPLATES_DEFAULT_NAME);
  templateList.unshift(Blockly.Msg.TEMPLATES_DEFAULT_NAME);

  var xmlList = [];
  for (var i = 0; i < templateList.length; i++) {
    if (Blockly.Blocks['template_set']) {
      // <block type="template_set" gap="8">
      //   <field name="TEMPLATE">item</field>
      // </block>
      var block = goog.dom.createDom('block');
      block.setAttribute('type', 'template_set');
      if (Blockly.Blocks['template_get']) {
        block.setAttribute('gap', 8);
      }
      var field = goog.dom.createDom('field', null, templateList[i]);
      field.setAttribute('name', 'TEMPLATE');
      block.appendChild(field);
      xmlList.push(block);
    }
    if (Blockly.Blocks['template_get']) {
      // <block type="template_get" gap="24">
      //   <field name="TEMPLATE">item</field>
      // </block>
      var block = goog.dom.createDom('block');
      block.setAttribute('type', 'template_get');
      if (Blockly.Blocks['template_set']) {
        block.setAttribute('gap', 24);
      }
      var field = goog.dom.createDom('field', null, templateList[i]);
      field.setAttribute('name', 'TEMPLATE');
      block.appendChild(field);
      xmlList.push(block);
    }
  }
  return xmlList;
};

/**
* Return a new template name that is not yet being used. This will try to
* generate single letter template names in the range 'i' to 'z' to start with.
* If no unique name is located it will try 'i' to 'z', 'a' to 'h',
* then 'i2' to 'z2' etc.  Skip 'l'.
 * @param {!Blockly.Workspace} workspace The workspace to be unique in.
* @return {string} New template name.
*/
Blockly.Templates.generateUniqueName = function(workspace) {
  var templateList = Blockly.Templates.allTemplates(workspace);
  var newName = '';
  if (templateList.length) {
    var nameSuffix = 1;
    var letters = 'ijkmnopqrstuvwxyzabcdefgh';  // No 'l'.
    var letterIndex = 0;
    var potName = letters.charAt(letterIndex);
    while (!newName) {
      var inUse = false;
      for (var i = 0; i < templateList.length; i++) {
        if (templateList[i].toLowerCase() == potName) {
          // This potential name is already used.
          inUse = true;
          break;
        }
      }
      if (inUse) {
        // Try the next potential name.
        letterIndex++;
        if (letterIndex == letters.length) {
          // Reached the end of the character sequence so back to 'i'.
          // a new suffix.
          letterIndex = 0;
          nameSuffix++;
        }
        potName = letters.charAt(letterIndex);
        if (nameSuffix > 1) {
          potName += nameSuffix;
        }
      } else {
        // We can use the current potential name.
        newName = potName;
      }
    }
  } else {
    newName = 'i';
  }
  return newName;
};
