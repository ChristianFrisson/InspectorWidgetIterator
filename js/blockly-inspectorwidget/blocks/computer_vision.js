'use strict';
goog.provide('Blockly.Blocks.InspectorWidget.ComputerVision');
Blockly.Blocks.InspectorWidget.ComputerVision.HUE = 280;
Blockly.Blocks['match_template'] = {
    init: function () {
        this.jsonInit({
            "message0": 'matchTemplate(%1)'
            , "args0": [
                {
                    "type": "field_template"
                    , "name": "TEMPLATE"
                    , "template": 'template'
                }
            ]
            , "tooltip": "Match template over the video(s)."
            , "helpUrl": "http://www.github.com/InspectorWidget/InspectorWidget"
            , "inputsInline": true
            , "previousStatement": null
            , "nextStatement": null
        , });
        this.setColour(Blockly.Blocks.InspectorWidget.ComputerVision.HUE);
    }
    , /**
     * Return all templates referenced by this block.
     * @return {!Array.<string>} List of template names.
     * @this Blockly.Block
     */
    getTemplates: function () {
        return [this.getFieldValue('TEMPLATE')];
    }
    , /**
     * Notification that a template is renaming.
     * If the name matches one of this block's templates, rename it.
     * @param {string} oldName Previous name of template.
     * @param {string} newName Renamed template.
     * @this Blockly.Block
     */
    renameTemplate: function (oldName, newName) {
        if (Blockly.Names.equals(oldName, this.getFieldValue('TEMPLATE'))) {
            this.setFieldValue(newName, 'TEMPLATE');
        }
    }
    , /*contextMenuType_: 'templates_get',
           customContextMenu: Blockly.Blocks['templates_get'].customContextMenu*/
};
/**
 * Block for template extraction.
 * @this Blockly.Block
 */
var EXTRACT_TESTS = [
        ["if", 'IF']
        , ["between", 'BETWEEN']
        , ["above", 'ABOVE']
        , ["below", 'BELOW']
        , ["leftof", 'LEFTOF']
        , ["rightof", 'RIGHTOF']
        , ["inrect", 'INRECT']
    ];
Blockly.Blocks['extract_test'] = {
    /**
     * Block for template extraction.
     * @this Blockly.Block
     */
    init: function () {
        this.appendDummyInput().appendField(new Blockly.FieldDropdown(EXTRACT_TESTS, function (option) {
            this.sourceBlock_.updateShape_(option);
        }), 'MODE')
        this.appendStatementInput('ACTION');
        this.setInputsInline(true);
        this.setPreviousStatement(true);
        this.setNextStatement(true);
        this.setInputsInline(true);
        // Assign 'this' to a template for use in the tooltip closure below.
        var thisBlock = this;
        this.setTooltip(function () {
            var op = thisBlock.getFieldValue('MODE');
            var TOOLTIPS = {
                'IF': "if the template is matched in a frame, then do some analysis"
                , 'BETWEEN': "if both template match in a frame, then do some analysis between both"
                , 'ABOVE': "if the template is matched in a frame, then do some analysis above it in the frame"
                , 'BELOW': "if the template is matched in a frame, then do some analysis below it in the frame"
                , 'LEFTOF': "if the template is matched in a frame, then do some analysis left to it in the frame"
                , 'RIGHTOF': "if the template is matched in a frame, then do some analysis right to it in the frame"
                , 'INRECT': "do some analysis on each frame in a rectangle of given x and y coordinates and width and height"
            , };
            return TOOLTIPS[op];
        });
        this.setHelpUrl('https://github.com/InspectorWidget/InspectorWidget');
        this.setColour(Blockly.Blocks.InspectorWidget.ComputerVision.HUE);
        if (EXTRACT_TESTS.length > 0) {
            this.updateShape_(EXTRACT_TESTS[0][1]);
        }
    }
    , /**
     * Create XML to represent the extraction test.
     * @return {Element} XML storage element.
     * @this Blockly.Block
     */
    mutationToDom: function () {
        var container = document.createElement('mutation');
        var input = this.getFieldValue('MODE');
        for (var f = 0; f < EXTRACT_TESTS.length; f++) {
            if (input === EXTRACT_TESTS[f][1]) {
                container.setAttribute('input_', EXTRACT_TESTS[f][1]);
                return container;
            }
        }
        return container;
    }
    , /**
     * Parse XML to restore the extraction test.
     * @param {!Element} xmlElement XML storage element.
     * @this Blockly.Block
     */
    domToMutation: function (xmlElement) {
        var input = xmlElement.getAttribute('input_');
        for (var f = 0; f < EXTRACT_TESTS.length; f++) {
            if (input === EXTRACT_TESTS[f][1]) {
                this.updateShape_(EXTRACT_TESTS[f][1]);
                return;
            }
        }
    }
    , /**
     * Modify this block along the extraction test.
     * @param {String} extraction test name.
     * @private
     * @this Blockly.Block
     */
    updateShape_: function (test) {
        var testValueInputExists = this.getInput('TEST_VALUE');
        if (testValueInputExists) {
            this.removeInput('TEST_VALUE');
        }
        if (test === 'IF') {
            // add bolean input
            //if (!testValueInputExists) {
            this.appendValueInput('TEST_VALUE').setCheck('Boolean')
                //this.moveInputBefore('TEST_VALUE','ACTION')
                //}
        }
        else if (test === 'BETWEEN') {
            // add inputs for 2 templates
            this.appendDummyInput('TEST_VALUE').appendField(new Blockly.FieldLabel('(')).appendField(new Blockly.FieldTemplate('template1'), 'TEMPLATE1').appendField(new Blockly.FieldLabel(',')).appendField(new Blockly.FieldTemplate('template2'), 'TEMPLATE2').appendField(new Blockly.FieldLabel(')'));
        }
        else if (test === 'ABOVE' || test === 'BELOW' || test === 'LEFTOF' || test === 'RIGHTOF') {
            // add input for 1 template
            this.appendDummyInput('TEST_VALUE').appendField(new Blockly.FieldLabel('(')).appendField(new Blockly.FieldTemplate('template'), 'TEMPLATE').appendField(new Blockly.FieldLabel(')'));
        }
        else if (test === 'INRECT') {
            /*if (testValueInputExists) {
                this.removeInput('TEST_VALUE');
            }*/
            // add inputs for: x,y,w,h,video,time,image
            this.appendDummyInput('TEST_VALUE').appendField(new Blockly.FieldLabel('(')).appendField(new Blockly.FieldTextInput('x', Blockly.FieldTextInput.nonnegativeFourDigitFloatValidator), 'X').appendField(new Blockly.FieldLabel(',')).appendField(new Blockly.FieldTextInput('y', Blockly.FieldTextInput.nonnegativeFourDigitFloatValidator), 'Y').appendField(new Blockly.FieldLabel(',')).appendField(new Blockly.FieldTextInput('width', Blockly.FieldTextInput.nonnegativeFourDigitFloatValidator), 'W').appendField(new Blockly.FieldLabel(',')).appendField(new Blockly.FieldTextInput('height', Blockly.FieldTextInput.nonnegativeFourDigitFloatValidator), 'H').appendField(new Blockly.FieldLabel(')'))
        }
        else {
            // TODO: better handle error here
            console.log('Error for block extract_test: updating shape for test ' + test + ' unhandled.');
        }
        this.moveInputBefore('TEST_VALUE', 'ACTION');
    }
};
////
var DETECT_TYPES = [
        ["detectText", 'TEXT']
        , ["detectNumber", 'NUMBER']
        , ["detectTime", 'TIME']
    , ];
Blockly.Blocks['detect_alphanum'] = {
    /**
     * Block for text extraction.
     * @this Blockly.Block
     */
    init: function () {
        this.appendDummyInput().appendField(new Blockly.FieldDropdown(DETECT_TYPES, function (option) {
            this.sourceBlock_.updateShape_(option);
        }), 'MODE')
        this.setInputsInline(true);
        this.setPreviousStatement(true);
        this.setNextStatement(true);
        this.setInputsInline(true);
        // Assign 'this' to a template for use in the tooltip closure below.
        var thisBlock = this;
        this.setTooltip(function () {
            var op = thisBlock.getFieldValue('MODE');
            var TOOLTIPS = {
                'TEXT': "detect text"
                , 'NUMBER': "detect numbers (characters restricted to digits)"
                , 'TIME': "detect time (characters restricted to digits and time delimiters ':','-',' ')"
            , };
            return TOOLTIPS[op];
        });
        this.setHelpUrl('https://github.com/InspectorWidget/InspectorWidget');
        this.setColour(Blockly.Blocks.InspectorWidget.ComputerVision.HUE);
        if (DETECT_TYPES.length > 0) {
            this.updateShape_(DETECT_TYPES[0][1]);
        }
    }
    , /**
     * Create XML to represent the text detection type.
     * @return {Element} XML storage element.
     * @this Blockly.Block
     */
    mutationToDom: function () {
        var container = document.createElement('mutation');
        var input = this.getFieldValue('MODE');
        for (var f = 0; f < DETECT_TYPES.length; f++) {
            if (input === DETECT_TYPES[f][1]) {
                container.setAttribute('input_', DETECT_TYPES[f][1]);
                return container;
            }
        }
        return container;
    }
    , /**
     * Parse XML to restore the extraction test.
     * @param {!Element} xmlElement XML storage element.
     * @this Blockly.Block
     */
    domToMutation: function (xmlElement) {
        var input = xmlElement.getAttribute('input_');
        for (var f = 0; f < DETECT_TYPES.length; f++) {
            if (input === DETECT_TYPES[f][1]) {
                this.updateShape_(DETECT_TYPES[f][1]);
                return;
            }
        }
    }
    , /**
     * Modify this block along the extraction test.
     * @param {String} extraction test name.
     * @private
     * @this Blockly.Block
     */
    updateShape_: function (test) {
        var testValueInputExists = this.getInput('TEST_VALUE');
        if (testValueInputExists) {
            this.removeInput('TEST_VALUE');
        }
        if (test === 'TEXT' || test === 'NUMBER' || test === 'TIME') {
            // add input for 1 template
            this.appendDummyInput('TEST_VALUE').appendField(new Blockly.FieldLabel('(')).appendField(new Blockly.FieldTemplate('template'), 'TEMPLATE').appendField(new Blockly.FieldLabel(')'));
        }
        else {
            // TODO: better handle error here
            console.log('Error for block detect_alphanum: updating shape for detection type ' + test + ' unhandled.');
        }
        //this.moveInputBefore('TEST_VALUE','ACTION');
    }
    , /**
     * Return all variables referenced by this block.
     * @return {!Array.<string>} List of variable names.
     * @this Blockly.Block
     */
    getTemplates: function () {
        return [this.getFieldValue('TEMPLATE')];
    }
    , /**
     * Notification that a variable is renaming.
     * If the name matches one of this block's variables, rename it.
     * @param {string} oldName Previous name of variable.
     * @param {string} newName Renamed variable.
     * @this Blockly.Block
     */
    renameTemplate: function (oldName, newName) {
        if (Blockly.Names.equals(oldName, this.getFieldValue('TEMPLATE'))) {
            this.setFieldValue(newName, 'TEMPLATE');
        }
    }
};