'use strict';
goog.provide('Blockly.JavaScript.InspectorWidget.Accessibility');
goog.require('Blockly.InspectorWidget.JavaScript');
Blockly.JavaScript['accessibility_actions'] = function (block) {
    var argument0 = Blockly.JavaScript.valueToCode(block, 'TEST_VALUE'
        , /*until ? Blockly.JavaScript.ORDER_LOGICAL_NOT :*/
        Blockly.JavaScript.ORDER_NONE) || 'false';
    var argument1; //= block.getFieldValue('TEMPLATE_NAME');
    var test = block.getFieldValue('MODE');
    var name = '';
    // Replace by function finding name in ACCESSIBILITY_ACTIONS 
    if (test === 'getFocusApplication' || test === 'getFocusWindow' || test === 'getPointedWidget' || test === 'getWorkspaceSnapshot') {
        name = test;
        argument1 = block.getFieldValue('VAR');
    }
    else {
        // TODO: better handle error here
        console.log('Error for block accessibility_action: JavaScript export for type ' + test + ' unhandled.');
    }
    return argument1 + "=" + name + '();\n';
};