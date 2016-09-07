'use strict';
goog.provide('Blockly.Blocks.InspectorWidget.ComputerVision');
Blockly.Blocks['get_words'] = {
    init: function () {
        this.jsonInit({
            "message0": '%1= getWords()'
            , "args0": [
                {
                    "type": "field_variable"
                    , "name": "VAR"
                    , "variable": 'variable'
                }
            ]
            , "tooltip": "Get words from keyboard events."
            , "helpUrl": "http://www.github.com/InspectorWidget/InspectorWidget"
            , "inputsInline": true
            , "previousStatement": null
            , "nextStatement": null
        , });
    }
    , /**
     * Return all variables referenced by this block.
     * @return {!Array.<string>} List of variable names.
     * @this Blockly.Block
     */
    getVars: function () {
        return [this.getFieldValue('VAR')];
    }
    , /**
     * Notification that a variable is renaming.
     * If the name matches one of this block's variables, rename it.
     * @param {string} oldName Previous name of variable.
     * @param {string} newName Renamed variable.
     * @this Blockly.Block
     */
    renameVar: function (oldName, newName) {
        if (Blockly.Names.equals(oldName, this.getFieldValue('VAR'))) {
            this.setFieldValue(newName, 'VAR');
        }
    }
    , /*contextMenuType_: 'variables_get',
  customContextMenu: Blockly.Blocks['variables_get'].customContextMenu*/
};