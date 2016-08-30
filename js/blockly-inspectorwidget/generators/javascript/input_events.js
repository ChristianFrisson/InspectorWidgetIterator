'use strict';

goog.provide('Blockly.JavaScript.InspectorWidget.InputEvents');

goog.require('Blockly.InspectorWidget.JavaScript');

Blockly.JavaScript['get_words'] = function(block) {
    // Variable setter.
    var argument0 = Blockly.JavaScript.valueToCode(block, 'VALUE',
                                                   Blockly.JavaScript.ORDER_ASSIGNMENT) || '0';
    var varName = Blockly.JavaScript.variableDB_.getName(
        block.getFieldValue('VAR'), Blockly.Variables.NAME_TYPE);
    return varName + '=getWords();\n';
};
