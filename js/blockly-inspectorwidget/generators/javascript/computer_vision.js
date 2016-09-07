'use strict';
goog.provide('Blockly.JavaScript.InspectorWidget.ComputerVision');
goog.require('Blockly.InspectorWidget.JavaScript');
Blockly.JavaScript['match_template'] = function (block) {
    // Template setter.
    var argument0 = Blockly.JavaScript.valueToCode(block, 'TEMPLATE', Blockly.JavaScript.ORDER_ASSIGNMENT) || '0';
    var varName = Blockly.JavaScript.templateDB_.getName(block.getFieldValue('TEMPLATE'), Blockly.Templates.NAME_TYPE);
    return 'matchTemplate(' + varName + ');\n';
};
Blockly.JavaScript['controls_if'] = function (block) {
    // If/elseif/else condition.
    var n = 0;
    var argument = Blockly.JavaScript.valueToCode(block, 'IF' + n, Blockly.JavaScript.ORDER_NONE) || 'false';
    var branch = Blockly.JavaScript.statementToCode(block, 'DO' + n);
    var code = 'if (' + argument + ') {' + branch + '}';
    for (n = 1; n <= block.elseifCount_; n++) {
        argument = Blockly.JavaScript.valueToCode(block, 'IF' + n, Blockly.JavaScript.ORDER_NONE) || 'false';
        branch = Blockly.JavaScript.statementToCode(block, 'DO' + n);
        code += ' else if (' + argument + ') {' + branch + '}';
    }
    if (block.elseCount_) {
        branch = Blockly.JavaScript.statementToCode(block, 'ELSE');
        code += ' else {' + branch + '}';
    }
    return code;
};
Blockly.JavaScript['extract_test'] = function (block) {
    var isIf = block.getFieldValue('MODE') == 'IF';
    var isBetween = block.getFieldValue('MODE') == 'BETWEEN';
    var isAbove = block.getFieldValue('MODE') == 'ABOVE';
    var isBelow = block.getFieldValue('MODE') == 'BELOW';
    var isLeftOf = block.getFieldValue('MODE') == 'LEFTOF';
    var isRightOf = block.getFieldValue('MODE') == 'RIGHTOF';
    var isInRect = block.getFieldValue('MODE') == 'INRECT';
    var argument0 = Blockly.JavaScript.valueToCode(block, 'TEST_VALUE', /*until ? Blockly.JavaScript.ORDER_LOGICAL_NOT :*/ Blockly.JavaScript.ORDER_NONE) || 'false';
    var argument1; //= block.getFieldValue('TEMPLATE_NAME');
    var test = block.getFieldValue('MODE');
    if (test === 'IF') {
        argument1 = Blockly.JavaScript.valueToCode(block, 'TEST_VALUE', /*until ? Blockly.JavaScript.ORDER_LOGICAL_NOT :*/ Blockly.JavaScript.ORDER_NONE) || 'false';
    }
    else if (test === 'BETWEEN') {
        argument1 = block.getFieldValue('TEMPLATE1') + ',' + block.getFieldValue('TEMPLATE2');
    }
    else if (test === 'ABOVE' || test === 'BELOW' || test === 'LEFTOF' || test === 'RIGHTOF') {
        argument1 = block.getFieldValue('TEMPLATE');
    }
    else if (test === 'INRECT') {
        argument1 = block.getFieldValue('X') + ',' + block.getFieldValue('Y') + ',' + block.getFieldValue('W') + ',' + block.getFieldValue('H');
    }
    else {
        // TODO: better handle error here
        console.log('Error for block extract_test: JavaScript export for test ' + test + ' unhandled.');
    }
    var branch = Blockly.JavaScript.statementToCode(block, 'ACTION');
    branch = Blockly.JavaScript.addLoopTrap(branch, block.id);
    var name = '';
    if (isIf) {
        name = 'if';
    }
    else if (isBetween) {
        name = 'between';
    }
    else if (isAbove) {
        name = 'above';
    }
    else if (isBelow) {
        name = 'below';
    }
    else if (isLeftOf) {
        name = 'leftof';
    }
    else if (isRightOf) {
        name = 'rightof';
    }
    else if (isInRect) {
        name = 'inrect';
    }
    return name + '(' + argument1 + ') {' + branch + '}\n';
};
Blockly.JavaScript['detect_alphanum'] = function (block) {
    var argument0 = Blockly.JavaScript.valueToCode(block, 'TEST_VALUE', /*until ? Blockly.JavaScript.ORDER_LOGICAL_NOT :*/ Blockly.JavaScript.ORDER_NONE) || 'false';
    var argument1; //= block.getFieldValue('TEMPLATE_NAME');
    var test = block.getFieldValue('MODE');
    var name = '';
    // Replace by function finding name in DETECT_TYPES 
    if (test === 'TEXT') {
        name = "detectText";
    }
    else if (test === 'NUMBER') {
        name = "detectNumber";
    }
    else if (test === 'TIME') {
        name = "detectTime";
    }
    else {
        // TODO: better handle error here
        console.log('Error for block detect_alphanum: JavaScript export for type ' + test + ' unhandled.');
    }
    if (test === 'TEXT' || test === 'NUMBER' || test === 'TIME') {
        argument1 = block.getFieldValue('TEMPLATE');
    }
    else {
        // TODO: better handle error here
        console.log('Error for block detect_alphanum: JavaScript export for type ' + test + ' unhandled.');
    }
    return name + '(' + argument1 + ')\n';
};