#!/usr/bin/env node
var path = require('path');
var yaml = require('js-yaml');
var fs = require('fs');

variableIsMissingValue = function(myVar){
    var missingValue = false
    if ( (typeof(myVar["default"]) === 'undefined' || myVar["default"] === null || String(myVar["default"]) === "" ) &&
         (typeof(myVar["value"]) === 'undefined' || myVar["value"] === null || String(myVar["value"]) === "")
       ) {
        missingValue = true;
    }
    return missingValue;
};

variableIsRequired = function(myVar){
    return ( myVar["required"] && myVar["required"] == true );
};

variableIsNotExcludable = function(myVar){
    var excludableTypes = ['case'];
    return excludableTypes.indexOf(myVar['type']) == -1;
};

dumpReadmeVars = function(header, myVariableSet){
    console.log("## " + header);
    console.log();
    if ( myVariableSet.length == 0 ) {
	console.log("**None**");
	console.log();
    }
    for(x = 0; x < myVariableSet.length; x++ ){
	var currentVar = myVariableSet[x];
	for ( prop in currentVar ) {
	    console.log('### `' + prop + '`:');
	    if (currentVar[prop]['description']) { console.log('  * description: ' + currentVar[prop]['description']); }
	    if (currentVar[prop]['default']) { 
		if ( String(currentVar[prop]['default']).split("\n").length > 1 ) {
		    console.log('  * default: ');
		    console.log('```');
		    console.log(currentVar[prop]['default']); 
		    console.log('```');
		} else {
		    console.log('  * default: ' + currentVar[prop]['default']);
		}
	    }
	    console.log();
	}
    }
}

head_file = path.join(process.cwd(), "head.md");
config_file = path.join(process.cwd(), "config.yaml");
description_file = path.join(process.cwd(), "description.md");
tags_file = path.join(process.cwd(), "tags.md");
icon_file = path.join(process.cwd(), "icon.md");
diagram_file = path.join(process.cwd(), "diagram.md");

my_doc = yaml.safeLoad(fs.readFileSync(String(config_file), 'utf8'));

if ( ! my_doc['variables'] ) 
{  
    return true; 
}

var missingRequiredVariables = [];
var requiredVars = [];
var theRest = [];

for(var key in my_doc['variables']){
    
    var myVar = my_doc['variables'][key];
    // if this is required, we need to have a default or value set
    var missingValue = variableIsMissingValue(myVar);
    var isRequired = variableIsRequired(myVar);
    var isMissing = ( Object.keys(myVar).length === 0 );
    var notExcludable = variableIsNotExcludable(myVar);

    var newVar= {};
    newVar[key] = myVar;
    if ( ((isMissing) || (missingValue && isRequired)) && notExcludable) {
	missingRequiredVariables.push(newVar);
    }
    if ( isRequired && notExcludable ) {
	requiredVars.push(newVar);
    } else if (notExcludable) {
	theRest.push(newVar);
    }
}

console.log(fs.readFileSync(head_file, 'utf8'));
console.log();

console.log('## Description');
console.log();
console.log(fs.readFileSync(description_file, 'utf8'));
console.log();

dumpReadmeVars('Variables Requiring Your Input', missingRequiredVariables);
dumpReadmeVars('Variables Required but Defaulted', requiredVars);
dumpReadmeVars('Variables Not Required', theRest);

console.log('## Tags');
console.log();
console.log(fs.readFileSync(tags_file, 'utf8'));
console.log();

console.log('## Diagram');
console.log();
console.log(fs.readFileSync(diagram_file, 'utf8'));
console.log();

console.log('## Icon');
console.log();
console.log(fs.readFileSync(icon_file, 'utf8'));
console.log();


