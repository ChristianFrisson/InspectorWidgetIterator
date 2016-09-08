'use strict';
goog.provide('Blockly.Blocks.InspectorWidget.InputEvents');
var INPUT_EVENTS_ACTIONS = [
        ["getWords", 'getWords']
        , ["getPointerClicks", 'getPointerClicks']
        , ["getKeysTyped", 'getKeysTyped']
        , ["getModifierKeysPressed", 'getModifierKeysPressed']
    , ];
var INPUT_EVENTS_TOOLTIPS = {
    'getWords': "get words from keyboard events"
    , 'getPointerClicks': "get pointer clicks"
    , 'getKeysTyped': "get keys typed (0-9 a-z A-Z -)"
    , 'getModifierKeysPressed': "get modifier keys pressed (Alt Ctrl Shift Meta)"
, };
Blockly.Blocks.InspectorWidget.InputEvents.HUE = 80;
Blockly.Blocks['input_events_actions'] = {
    /**
     * Block for text extraction.
     * @this Blockly.Block
     */
    init: function () {
        this.appendDummyInput().appendField(new Blockly.FieldDropdown(INPUT_EVENTS_ACTIONS, function (option) {
            this.sourceBlock_.updateShape_(option);
        }), 'MODE')
        this.setInputsInline(true);
        this.setPreviousStatement(true);
        this.setNextStatement(true);
        this.setInputsInline(true);
        // Assign 'this' to a variables for use in the tooltip closure below.
        var thisBlock = this;
        this.setTooltip(function () {
            var op = thisBlock.getFieldValue('MODE');
            return INPUT_EVENTS_TOOLTIPS[op];
        });
        this.setHelpUrl('https://github.com/InspectorWidget/InspectorWidget');
        this.setColour(Blockly.Blocks.InspectorWidget.InputEvents.HUE);
        if (INPUT_EVENTS_ACTIONS.length > 0) {
            this.updateShape_(INPUT_EVENTS_ACTIONS[0][1]);
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
        for (var f = 0; f < INPUT_EVENTS_ACTIONS.length; f++) {
            if (input === INPUT_EVENTS_ACTIONS[f][1]) {
                container.setAttribute('input_', INPUT_EVENTS_ACTIONS[f][1]);
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
        for (var f = 0; f < INPUT_EVENTS_ACTIONS.length; f++) {
            if (input === INPUT_EVENTS_ACTIONS[f][1]) {
                this.updateShape_(INPUT_EVENTS_ACTIONS[f][1]);
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
        var parenthesesExists = this.getInput('PARENTHESES');
        if (parenthesesExists) {
            this.removeInput('PARENTHESES');
        }
        if (test === 'getWords' || test === 'getPointerClicks' || test === 'getKeysTyped' || test === 'getModifierKeysPressed') {
            // add input for 1 variable
            this.appendDummyInput('TEST_VALUE').appendField(new Blockly.FieldVariable('variable'), 'VAR').appendField(new Blockly.FieldLabel(' = '));
            this.moveInputBefore('TEST_VALUE', 'ACTION');
            this.appendDummyInput('PARENTHESES').appendField(new Blockly.FieldLabel('()'));
        }
        else {
            // TODO: better handle error here
            console.log('Error for block input_events_actions: updating shape for detection type ' + test + ' unhandled.');
        }
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
}; 