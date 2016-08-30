/**
 * @license
 * Visual Blocks Editor
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
 * @fileoverview Object representing a thumbnail mutator dialog (inherits from Mutator).
 * A thumbnail mutator allows the user to visualise image thumbnails on blocks. 
 * @author gmail.com:christian.frisson (Christian Frisson)
 */
'use strict';

goog.require('Blockly.Mutator');
goog.provide('Blockly.ThumbnailMutator');

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
