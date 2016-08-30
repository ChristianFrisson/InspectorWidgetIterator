'use strict';

goog.provide('Blockly.JavaScript.InspectorWidget');

goog.require('Blockly.JavaScript');

//goog.require('Blockly.JavaScript.templates');

/**
 * Initialise the database of variable names.
 * @param {!Blockly.Workspace} workspace Workspace to generate code from.
 */
Blockly.JavaScript.init = function(workspace) {
    // Create a dictionary of definitions to be printed before the code.
    Blockly.JavaScript.definitions_ = Object.create(null);
    // Create a dictionary mapping desired function names in definitions_
    // to actual function names (to avoid collisions with user functions).
    Blockly.JavaScript.functionNames_ = Object.create(null);

    if (!Blockly.JavaScript.variableDB_) {
        Blockly.JavaScript.variableDB_ =
            new Blockly.Names(Blockly.JavaScript.RESERVED_WORDS_);
    } else {
        Blockly.JavaScript.variableDB_.reset();
    }
    
    if (!Blockly.JavaScript.templateDB_) {
        Blockly.JavaScript.templateDB_ =
            new Blockly.Names(Blockly.JavaScript.RESERVED_WORDS_);
    } else {
        Blockly.JavaScript.templateDB_.reset();
    }

    /**
 * Workaround: do not define the variables in the JavaScript code
**/
    /*var defvars = [];
  var variables = Blockly.Variables.allVariables(workspace);
  for (var i = 0; i < variables.length; i++) {
    defvars[i] = 'var ' +
        Blockly.JavaScript.variableDB_.getName(variables[i],
        Blockly.Variables.NAME_TYPE) + ';';
  }
  Blockly.JavaScript.definitions_['variables'] = defvars.join('\n');*/
};
