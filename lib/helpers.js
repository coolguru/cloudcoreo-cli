var NodeRSA = require('node-rsa');
var exec = require('child_process').exec;
var fs = require('fs');
var fsutil = require('fs-utils');
var path = require('path');
var mkdirp = require('mkdirp');
var yaml = require('js-yaml');
var walk = require('walkdir');
var _ = require('underscore');
var jsonfile = require('jsonfile');
var gitane = require('gitane-windows');
var trim = require('trim');
var readlineSync = require('readline-sync');
var httpSync = require('sync-request');

var cloudcoreoPublicKeyMaterial = "-----BEGIN RSA PRIVATE KEY-----\nMIIEpQIBAAKCAQEAs2jYEk8RkE2u6uTFcHTspe+qwNL8YNB127VUzwnJz6mtk+e5\nnWq97CcbRIlh6bfH8qCO/jdVWXLCQ8zRtiaP0wPebBLQKzRTJ77MaHlfd+tfcOL3\njPDmsEwTzawWLfEykWQIFR2MS7fsZGwhvFKM3ZjdXwYIkGJFlVZarTDF2oRperq5\n6+KzFgPsKkY2RLMo1XD7QemM6PWeRIHwgysnFhct5cPP5AtGWJrR//hLN8TrZAUk\nfmpbGXHde3yo+ZIgf8Bm0vyA6eOfocdO3MK2KTGslGGznBofudfY6SKTEvTUXbKh\nKxmyv0U7Ii4hLrfS2HFAjqPFLJNTizcPNfI9awIDAQABAoIBABXNO9SdvyimCAeL\nXWLZEpjnkvxzpy+spWXZl0DBk8Ckge9jTW8PtZyo8+tUNo3MQ4P8duP1nW2NQIY0\nsZdNAFVINxMzBhD5/tDporVfanaMJ8D0E9kQvTfXRuDLdLaIhPieC01lldLtutBJ\nQ6A699tF5EDT3t6M0p/fKo25S5HOKVz5HwW7ifIJma6tORambSTelXq9rxZiAEbQ\nV8LJSF4jL8SmueMyDOgM1fqJ/1Kz/3nxus+itAp9nFJ+eSgd0QaqokCiaFro/2VX\nPpHalfqaeVHIfsQWcpXXrk/+siX7Q1o7x3/JNqrQQkftegJ8GYwFD/zolLlSerTx\nPe7SAaECgYEA11dz6uHsjehyzIZRuCb8K5E5Rr2jd1N/k295wbaH04d6Syc1CNPw\nCdI7/BZZXpzniiXz75mAdyntL9MWDAJWZMhrsF4Kt9MTrj1gJl8WLXeGdsvmWbEi\nMudcNzezQtlnY7rlD9u7g3fu24wSBqMhyojCXZlbN+vIXTlZklW9Bb8CgYEA1Uic\n9OC76NLu/rcmAMGKHzveZWX0w4xs9NGrRCvhlewakwflW6NUtTFS8O8mg8p17r68\nUgmjcI/uaHqqYqLrNNJX5cwZfAc19dE5YxZjYMviX28woSG0NPIKWVBTV8oHi/mf\nGFTftorgLKnKQ/LlPGG6lkMOH+ZtfA9kRjpX61UCgYEAnnKsymFeS7SD89XJf3TA\nC9aZjGGxS/XWY0edEVobaxu+clnw/gPkFXXpyT0wmRteixoN+Xi7O/NPoObyy/dU\nVmfaRTWNMWFQk955RwKkMORHvlWdstVRUp9GDSMg9ck99/Xm4dpOiRfQWx8fjF6w\nWHR0f6Z9phIJpf6y16fao8UCgYEAuhmB2qm9TInAv8BPCJnXSymSBCfSSk5dQ8Ev\nD2y6iXZaObDKEAuT/gXruQ7zLEucW5VR/MMsOStdewyNX0OIt65Rw9Ey62XfT34f\n9LW0QOGlxF/grrgZ5ZjMLuJH1nIR47ELgM+N5FmJAW+lbWSjYOxlQnd/+5W0Mmu7\nswt1a4ECgYEAjL1VRJFqGleWeZyiE7q/9GA5pA0UK+i6BvKqgGmYL3LzCu8suZZD\n6bhDY+R/+iFu8TKdmc/ikyqvHFOgvTVVaz79hkmfmjSJGt4Cm3iG957qDDYsiuBN\n30P/zDn99z9By6kOs1xIc6QpbfeGLNom3moHl/S4A3KlVjhPe2nNJQA=\n-----END RSA PRIVATE KEY-----\n"
var isWindows = /^win/.test(process.platform);

var constants = require('./constants');

var _this = this;

module.exports.getConfigFile = function() {
    mkdirp.sync(path.join(_this.getUserHome(), '.cloudcoreo'));
    var file = path.join(_this.getUserHome(), '.cloudcoreo', 'config');
    return file;
};

module.exports.clone = function(obj) {
    if (null == obj || "object" != typeof obj) return obj;
    var copy = obj.constructor();
    for (var attr in obj) {
        if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
    }
    return copy;
}

module.exports.addConfig = function(configToAdd) {
    var file = _this.getConfigFile();
    var configArray = _this.getConfigArray();
    for ( var i=0; i < configArray.length; i++ ) {
	var c = configArray[i];
	if (c["username"] == configToAdd["username"]) {
	    // just skip this one because we are going to add it anyway
	    continue;
	}
    }	
    configArray.push(configToAdd);
    jsonfile.writeFileSync(file, configArray);
};

module.exports.updateConfig = function(config, newConfig) { 
    var configs = _this.getConfigArray();
    for ( var i = 0; i < configs.length; i++ ) {
	var isCorrectConfig = true
	var c = configs[i];
	for (var prop in config) {
	    if( config.hasOwnProperty(prop) ) {
		
		if ( config[prop] && c[prop] && (config[prop] != c[prop] )) {
		    isCorrectConfig = false;
		}
	    } 
	}
	if ( isCorrectConfig ) {
	    configs.splice(i, 1);
	    configs.push(newConfig);
	    //done
	    isCorrectConfig = false;
	}
    }
    var file = _this.getConfigFile();
    jsonfile.writeFileSync(file, configs);
    return;
}

module.exports.getConfigArray = function(configName) {
    
    var file = _this.getConfigFile();
    var config = []
    if (fs.existsSync(file)) {
	config = jsonfile.readFileSync(file);
    }
    var configArray = []
    // handle user modified screwups array vs. not array etc.
    if ( Array.isArray(config) ) {
	for ( var i = 0; i < config.length; i++ ) {
	    var c = config[i];
	    if( ! c.profileName ){
		c.profileName = 'default';
	    }
	    configArray.push(c);
	}
    } else if (config) { // or its there but NOT an array
	// dont add it if it is the same username
	if( ! config.profileName ){
	    config.profileName = 'default';
	}
	configArray.push(config);
    }
    if(configName) {
	var singleConfig;
	for (var i = 0; i < configArray.length; i++) {
	    if (config[i].profileName == configName) {
		singleConfig = config[i];
	    }
	}
	configArray = [];
	configArray.push(singleConfig);
	return configArray;
    } else {
	return configArray;
    }
};

module.exports.getUserHome = function() {
  return process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
};

module.exports.check_git_config = function(git_dir, callback) {
    var bash;
    bash = 'git config --list';
    var child = exec(bash, {
	cwd: git_dir
    }, function(err, out){

    });
    
    child.stdout.on('data', function(data) {
	var dataArr = data.split('\n');
	hasEmail = false;
	hasName = false;
	for(var i=0; i < dataArr.length; i++){
	    if(dataArr[i].indexOf('user.name') > -1) {
		hasName = true;
	    }
	    if(dataArr[i].indexOf('user.email') > -1) {
		hasEmail = true;
	    }
	}
	if ( ! hasEmail){
	    throw 'please configure your git account with "git config --global user.email = \'<your email>\'"';
	}
	if ( ! hasName){
	    throw 'please configure your git account with "git config --global user.name = \'<your name>\'"';
	}
	callback(null, true);
    });
    child.stderr.on('error', function(data) {
	callback(data, false);
    });
};

module.exports.git_cmd = function(orig_git_dir, keyMaterial, command, options, args, callback) {
    var git_dir = orig_git_dir;
    if (isWindows == true) {
	git_dir = orig_git_dir.replace(/\\/g,"\\\\");
    }

    var bash, _ref, _ref1;
    
    if (!callback) {
	_ref = [args, callback], callback = _ref[0], args = _ref[1];
    }
    if (!callback) {
	_ref1 = [options, callback], callback = _ref1[0], options = _ref1[1];
    }
    if (options == null) {
	options = {};
    }
    options = _this.options_to_argv(options);
    options = options.join(" ");
    if (args == null) {
	args = [];
    }
    if (args instanceof Array) {
	args = args.join(" ");
    }
    var ws_bash = trim(command) + " " + trim(options) + " " + trim(args);
    bash = trim(ws_bash);
    if(keyMaterial) {
	gitane.run(git_dir, keyMaterial, bash, function(err, data){
	    // if (err) {
	    // 	console.log('error cloning repo - are you sure you have access or it is public?: ' + err);
	    // }
	    return callback(err, data);
	});
    } else {
	//there is no key material, run it with their own git setup
	var child = exec(bash, {
	    cwd: git_dir,
	    timeout: 10000
	}, function(err, out){
	    if(err) {
		module.exports.git_cmd(orig_git_dir, cloudcoreoPublicKeyMaterial, command, options, args, callback);
	    } else {
		return callback(err, out);
	    }
	});
	child.stdout.on('data', function(data) {
	    // supress output
	});
	child.stderr.on('data', function(data) {
	    // supress output
	});
    }
};
variableIsMissingValue = function(myVar){
    var missingValue = false
    if ( (typeof(myVar["default"]) === 'undefined' || myVar["default"] === null || String(myVar["default"]) === "" ) &&
	 (typeof(myVar["value"]) === 'undefined' || myVar["value"] === null || String(myVar["value"]) === "") &&
	 (typeof(myVar["switch"]) === 'undefined' || myVar["switch"] === null || String(myVar["switch"]) === "") && myVar["type"] == "case"
       ) {
	console.log('missing: ' + JSON.stringify(myVar));
	missingValue = true;
    }
    return missingValue;
};

variableIsRequired = function(myVar){
    return ( myVar["required"] && myVar["required"] == true );
};

module.exports.validateRequiredVariables = function(file, done){
    my_doc = fsutil.readYAMLSync(path.normalize(file));
    if(!my_doc['variables']) { return true; }

    var missingRequiredVaribles = [];
    for(var key in my_doc['variables']){
	var myVar = my_doc['variables'][key];
	// if this is required, we need to have a default or value set
	var missingValue = variableIsMissingValue(myVar);
	var isRequired = variableIsRequired(myVar);
	var isMissing = ( Object.keys(myVar).length === 0 );

	if ( (isMissing) || (missingValue && isRequired)) {
	    missingRequiredVaribles.push({key: myVar});
	    console.log("ERROR: " + key + " is missing and required - please add a default value");
	}
    }
    if(missingRequiredVaribles.length > 0) {
	err = new Error("Missing and required variables");
	return done(err, null);
    } else {
	return done(null, true);
    }
};

// this is going to simulate the prompt package a bit
// started off wanting to pass in a regex pattern and
// thought, why not do the rest
module.exports.promptSync = function(properties){

    var returnVar = {};
    for(var i = 0; i < properties.length; i++){
	var prop = properties[i];
	var name = prop.name;
	var hidden = prop.hidden;
	var required = prop.required;
	var message = prop.message;
	var pattern = prop.pattern;
	var limitMessage = prop.limitMessage;
	var defaultValue = prop.defaultValue;
	var inputValue = '';
	var questionProperties = {
	    hideEchoBack: (hidden || false),
	    limit: pattern,
	    limitMessage: limitMessage
	};
	if(defaultValue != null) {
	    questionProperties = extend(questionProperties, {defaultInput: defaultValue});
	}
	inputValue = readlineSync.question(message, questionProperties);
	var result = JSON.parse('{"' + name + '": "'+inputValue+'"}')
	returnVar = extend(returnVar, result )
    }
    return returnVar;

}

function extend(target) {
    var sources = [].slice.call(arguments, 1);
    sources.forEach(function (source) {
        for (var prop in source) {
            target[prop] = source[prop];
        }
    });
    return target;
}

module.exports.mkReq = function(urlPath, options, headers) {
    options = options || {};
    options.method = options.method || 'GET';

    if ( options.method != 'GET' && typeof headers == 'undefined' ) {
	var headers = {
            'Content-Type': 'application/json'
    	};
    }
    options = extend(options, {headers: headers});

    var response = httpSync(options.method, urlPath, options);
    return response;
}

module.exports.mkReqAuthenticated = function(config, urlPath, payload, method) {
    var encodedData = new Buffer(config.accessKeyId + ':' + config.secretAccessKey).toString('base64');
    var authHeaders = {
	'Authorization': 'Basic ' + encodedData
    };

    if(method == 'POST'){
	authHeaders['Content-Type'] = 'application/json';
	return _this.mkReqConfigEncrypted(config, urlPath, payload, null, authHeaders);
    } else {
	return _this.mkReq(urlPath, {method: 'GET'}, authHeaders);
    }
};

module.exports.mkReqConfigEncrypted = function(config, urlPath, encPayload, unencPayload, method) {
    //payload looks like:
    //   {method: 'POST', body: JSON.stringify(postForm) }

    var key = new NodeRSA();
    var headers = {};
    if(!method) { method = 'POST' }
    if(method != "GET") {
	// encrypt the pyload w/ the private key
	// 
	key.importKey(config.privateKeyMaterial, 'private');
	var postForm = unencPayload;
	headers['Content-Type'] = 'application/json';
	postForm.encPayload = key.encryptPrivate(JSON.stringify(encPayload), 'base64');
	postForm.accessKeyId = config.accessKeyId;
    } else {
	var postForm = null;
    }
    var res = _this.mkReq(urlPath, { method: method, body: JSON.stringify(postForm) }, headers);
    return res;
};

module.exports.fixConfigYaml = function(topLevelDir, done) {

    parseConfigVariablesFiles(topLevelDir, function(err, variables){
	var missingVariables = [];
	var setVariablesRequired = [];
	var theRest = [];
	for(var key in variables){
	    // dump empty dictionaries
	    if( ! variables[key] || variables[key] == null || Object.keys(variables[key]).length === 0) { 
		continue; 
	    }
	    var myVar = variables[key];
	    // if this is required, we need to have a default or value set
	    var missingValue = variableIsMissingValue(myVar);
	    var isRequired = variableIsRequired(myVar);
	    var isMissing = ( Object.keys(myVar).length === 0 );
	    if ( (isMissing) || (missingValue && isRequired)) {
		var missingVar = {};
		missingVar[key] = myVar;
		missingVariables.push(missingVar);
	    } else if (isRequired == true) {
		var setVar = {};
		setVar[key] = myVar;
		setVariablesRequired.push(setVar);
	    } else {
		var theRestVar = {};
		theRestVar[key] = myVar;
		theRest.push(theRestVar);
	    }
	}
	//we are now ordering variables like this:
	// 1) Missing required
	// 2) set required
	// 3) the rest alphabetically
	var variableArray = [];
	variableArray.push(missingVariables);
	variableArray.push(setVariablesRequired);
	variableArray.push(theRest);

	// console.log('creating yaml file ' + topLevelDir + ' ' + JSON.stringify(missingVariables));
	// console.log('creating yaml file ' + topLevelDir + ' ' + JSON.stringify(setVariablesRequired));
	// console.log('creating yaml file ' + topLevelDir + ' ' + JSON.stringify(theRest));
	
	forceCreateConfigYamlFile(topLevelDir, variableArray, function(err, data){
	    if(err){ return done(err, null); }
	    return done(null, data);
	});
    });
};
module.exports.options_to_argv = function(options) {
	var key, val;
	var argv = [];
	for (key in options) {
		val = options[key];
		if (key.length === 1) {
			if (val === true) {
				argv.push("-" + key);
			} else if (val === false) {

			} else {
				argv.push("-" + key);
				argv.push(val);
			}
		} else {
			if (val === true) {
				argv.push("--" + key);
			} else if (val === false) {

			} else {
				argv.push("--" + key + "=" + val);
			}
		}
	}
	return argv;
};

module.exports.createExtendsDirectory = function(startdir, extendDir, callback){
    module.exports.git_cmd(startdir, null, "git submoduleb add", {}, ['--force', extendDir, "extends"], function(err, data){
	if(err) {
	    console.log(err);
	}
    });
    //updateRepoSubmodules(startdir)
};

module.exports.createScriptDirectories = function(startdir, callback){
    var operational_scripts_dir = path.join(startdir, "operational-scripts");
    fs.exists(operational_scripts_dir, function(exists) {
	if ( ! exists ) {
            mkdirp.sync(operational_scripts_dir);
	}
        createReadmeMd(operational_scripts_dir, "## This file was auto-generated by CloudCoreo CLI\n" +
		       "Scripts contained in this directory will be exposed to the CloudCoreo UI and can be run on an\n" +
		       "adhoc basis.\n" +
		       "", function(err, data){
			   if (err) { console.log("error creating readme in operational scripts directory"); }
		       });
    });
    var shutdown_scripts_dir = path.join(startdir, "shutdown-scripts");
    fs.exists(shutdown_scripts_dir, function(exists){
	if ( ! exists ) {
	    mkdirp.sync(shutdown_scripts_dir);
	}
    });
    createReadmeMd(shutdown_scripts_dir, "## This file was auto-generated by CloudCoreo CLI\n" +
		   "Scripts contained in this directory will be proccessed (if possible) when an instance\n" +
		   "is asked to shut down. The order in which these scripts will be run is defined by the\n" +
		   "order.yaml\n" +
		   "", function(err, data) { if (err) { console.log('error creating readme in shutdown scripts dir' + err); }});
    shutdownOrderFile = path.join(shutdown_scripts_dir, "order.yaml");
    writeIfNeeded(shutdownOrderFile, "## This file was auto-generated by CloudCoreo CLI\n" +
		  "## this yaml file dictates the order in which the scripts will run. i.e:\n" +
		  "## script-order:\n" +
		  "##   - deregister_dns.sh\n" +
		  "##   - delete_backups.sh\n" +
		  "\n" +
		  "", false, function(err, data) { if (err) { console.log('error creating order.yaml file in shutdown scripts dir' + err); } });
    boot_scripts_dir = path.join(startdir, "boot-scripts");
    fs.exists(boot_scripts_dir, function(exists){
	if (! exists) {
	    mkdirp.sync(boot_scripts_dir);
	}
    });
    createReadmeMd(boot_scripts_dir, "## This file was auto-generated by CloudCoreo CLI\n" +
		   "Scripts contained in this directory will be proccessed when an instance is booting. \n" +
		   "The order in which these scripts will be run is defined by the order.yaml\n" +
		   "", function(err, data) { if (err) { console.log('error creating readme in the bootscripts dir: ' + err); } });
    var bootOrderYaml = path.join(boot_scripts_dir,"order.yaml");
    writeIfNeeded(bootOrderYaml,"## This file was auto-generated by CloudCoreo CLI\n" +
		  "## this yaml file dictates the order in which the scripts will run. i.e:\n" +
		  "## script-order:\n" +
		  "##   - install_chef.sh\n" +
		  "##   - run_chef.sh\n" +
		  "\n" +
		  "", false, function(err, data) { if (err) { console.log('error creating order.yaml in the bootscripts dir: ' + err); } });
};

getServicefiles = function(rootDir, callback){
    var servicefiles = []
    
    var emitter = walk(rootDir);
    emitter.on('file',function(filename, stat){
	// only do this stuff if it is not the git directory
	if ( ! /.git$/.test(filename) && /services[\/|\\]config.rb/.test(filename)) {
	    servicefiles.push(filename)
	}
    });
    emitter.on('end',function(filename, stat){
	servicefiles.sort(function(a, b){
	    return b.length - a.length;
	});
	return callback(null, servicefiles);
    });
}

getConfigVariableFiles = function(rootDir, callback) {
    var order_files = []
    var emitter = walk(rootDir);
    emitter.on('file',function(filename, stat){
	// only do this stuff if it is not the git directory
	if ( ! /.git$/.test(filename) && /\/config.y(a)?ml$/i.test(filename)) {
	    order_files.push(filename)
	}
    });
    emitter.on('end',function(filename, stat){
	order_files.sort(function(a, b){
	    // order by the number of path seperators
	    // that is the easiest way to figure out how many levels of
	    // extension there are
	    return b.split(path.sep).length - a.split(path.sep).length;
	});
	return callback(null, order_files);
    });
};

mergeOptions = function(obj1,obj2){
    var obj3 = {};
    // set up initially from obj1
    for (var attrname in obj1) { obj3[attrname] = obj1[attrname]; }
    // if obj2 is not blank, prefer that
    for (var attrname in obj2) { 
	if(obj2[attrname]) {
	    obj3[attrname] = obj2[attrname]; 
	}
    }
    return obj3;
};
getVariablesFromConfigFiles = function(variableFiles, callback){
    var combinedDictionary = {};
    for(fileIndex = 0; fileIndex < variableFiles.length; fileIndex++){
	var f = variableFiles[fileIndex];
	var namespace = getNamespace(f);
        try {
	    var my_doc;
	    try {
		my_doc = yaml.safeLoad(fs.readFileSync(path.normalize(f), 'utf8'));
		//namespace must always 
	    } catch (e) {
		console.log(e);
	    }
	    if (my_doc && my_doc['variables']) {
		if( (! my_doc) || (! my_doc.variables)) {
		    return;
		}
		for ( var m_var in my_doc['variables'] ){
		    my_doc['variables'][m_var]['namespace'] = namespace;
		    var isOverridden = false;

		    namespace_array = namespace.split('::');
		    // check to see if we are overridden by OR overriding anything already stored
		    for(var chk_var in combinedDictionary){
			for(var x = 0; x < namespace_array.length; x++){
			    // if anything in my namespace or above me overrides me, we need to dump out
			    if(x > 0) {
				chk_namespace = namespace_array.slice(namespace_array - x, x).join("::");
			    } else {
				chk_namespace = namespace_array.join("::");
			    }
			    
			    // match on me, me - 1... ROOT
			    // in order words if our namespace is "ROOT::A::B::C" check
			    //   ROOT::A::B::C
			    //   ROOT::A::B
			    //   ROOT::A
			    //   ROOT
			    // lets start with checking if we are overridden by any existing values
			    if(combinedDictionary[chk_var]['namespace'] == chk_namespace){
				if(combinedDictionary[chk_var]['overrides']){
				    //check if we are overriden
				    for(var j = 0; j < combinedDictionary[chk_var]['overrides'].length; j++){
					override_var = combinedDictionary[chk_var]['overrides'][j];
					if(override_var.split('::').slice(-1)[0] == m_var){
					    isOverridden = true;
					}
				    }
				}
			    }

			}
			// now lets see if we are overriding any existing values
			// if we have a namespace that is a subset of the stored value, then it is in our overridable tree
			if(combinedDictionary[chk_var]['namespace'].indexOf(namespace_array.join('::')) > -1) {
			    //console.log(combinedDictionary[chk_var]['namespace'] + '.indexOf(' + namespace_array.join('::') + ') > -1)');
			    // if we override anything at all - lets check it out since we are checking on our trees namespace
			    // i.e. if we are "ROOT::STACK-A" we should check anything that has ROOT::STACK-A in it
			    // like ROOT::STACK-A::STACK-PRIVATE::STACK-WHATSUP because ROOT::STACK-A is higher level
			    if(my_doc['variables'][m_var]['overrides']){
				//check if we override anything
				//console.log('we override: ' + m_var + ' overrides ' + my_doc['variables'][m_var]['overrides']);
				// now we need to go look and see if the stuff we override is already laid down, and if it is, delete it.
				for(var j = 0; j < my_doc['variables'][m_var]['overrides'].length; j++){
				    override_var = my_doc['variables'][m_var]['overrides'][j];
				    //console.log('   first var we override: ' + override_var.split('::').slice(-1)[0]);
				    //console.log('   chk_var: ' + chk_var);
				    if(override_var.split('::').slice(-1)[0] == chk_var){
					//console.log('    chk_var == override_var: ' + chk_var + ' == ' + override_var.split('::').slice(-1)[0]);
					delete combinedDictionary[chk_var];
				    }
				}
			    }
			}
		    }
		    if ( isOverridden == false ) {
			if (! combinedDictionary[m_var]) {
			    combinedDictionary[m_var] = my_doc['variables'][m_var]
			} else {
			    var mergedDictionary = mergeOptions(combinedDictionary[m_var], my_doc['variables'][m_var]);
			    combinedDictionary[m_var] = mergedDictionary;
			}
		    } else {
			if ( combinedDictionary[m_var] ) {
			    delete combinedDictionary[m_var];
			}
		    }
		};
	    }
        } catch (ex) {
	    callback(new Error("Error parsing file " + f + " - perhaps invalid yaml?"), null);
	}
    };
    
    return callback(null, combinedDictionary);
};

getAll = function(regex, string) {
    var match = null;
    var matches = new Array();
    while (match = regex.exec(string)) {
        var matchArray = [];
        for (i in match) {
            if (parseInt(i) == i && i > 0 && (matches.indexOf(match[i]) == -1 )) {
                matches.push(match[i]);
            }
        }
    }
    return matches;
};

cleanArray = function(actual){
    var newArray = new Array();
    for(var i = 0; i<actual.length; i++){
	if (actual[i] && actual[i] != ""){
            newArray.push(actual[i]);
	}
    }
    return newArray;
};

getNamespace = function(filepath){
    var namespace_array = [];
    var fname = filepath.replace(process.cwd(), '');
    var nme_array = cleanArray(fname.replace(/extends/g, "").replace(/services/g,'').replace(/:/g,'').split(path.sep));
    for(x = 0; x < nme_array.length; x++ ) {
	var re1 = new RegExp("config.y","gi");
	var re2 = new RegExp("config.rb","gi");
	if(re1.test(nme_array[x]) || re2.test(nme_array[x])) { 
	    nme_array.splice(x,1);
	}
    }
    // go handle extends dirs
    var re = new RegExp('(.*?(?:\/extends)\/)', 'g');
    var m;
    do {
	m = re.exec(fname);
	if (m) {
	    // get rid of 'extends/' first then 'extends', 'services/', 'services', ':' and then get the last item
	    if(m[1] != ""){
		var nme = cleanArray(m[1].replace(/extends\//g, '').replace(/extends/g, '').replace(/services\//g, '').replace(/services/g, '').split(path.sep)).slice(-1)[0];
		if(nme &&  nme != "") {
		    namespace_array.push(nme);
		}
	    }
	}
    } while (m);

    // do it al aavin for stack- dirs
    var added_stack = false;
    var re = new RegExp('(.*?(?:\/stack-[^\/]*\/))', 'g');
    var m;
    do {
	m = re.exec(fname);
	if (m) {
	    // get rid of 'extends/' first then 'extends', 'services/', 'services', ':' and then get the last item
	    if(m[1] != ""){
		
		var nme = cleanArray(m[1].replace(/extends\//g, '').replace(/extends/g, '').replace(/services\//g, '').replace(/services/g, '').split(path.sep)).slice(-1)[0];
		if(nme &&  nme != "") {
		    namespace_array.push(nme);
		}
		added_stack = true;
	    }
	}
    } while (m);

    if(added_stack == true) {
	for(x = 0; x < nme_array.length; x++ ) {
	    var n = nme_array.reverse()[x];
	    if(namespace_array.indexOf(n) == -1) {
		namespace_array.unshift(n);
		break;
	    }
	}
    }
    if (namespace_array === undefined || namespace_array.length == 0) {
	namespace_array.push(nme_array.slice(-1)[0]);
    }
    namespace_array.unshift("ROOT");
    var dedup = array_remove_consecutive_duplicates(cleanArray(namespace_array));
    var ret_namespace = cleanArray(dedup).join('::').toUpperCase();
    return ret_namespace;
};

array_remove_consecutive_duplicates = function(this_array) {
    var newArray = this_array;
    var i = 1;
    if ( this_array.length <= 1 ) {
	return this_array;
    }
    while(i < this_array.length) {
        this_value = this_array[i].toLowerCase();
        prev_value = this_array[i-1].toLowerCase();
        if(this_value == prev_value) {
            this_array.splice(i, 1);
        } else {
            i++;
        }
    }
    return this_array;
};

getVariablesFromServicefiles = function(servicefiles, callback){
    var variables = {}
    for (var sIndex = 0; sIndex < servicefiles.length; sIndex++) {
	var f = servicefiles[sIndex];
	var contents = fs.readFileSync(f);
	var matches = getAll(/\${([^\}]+).*/g, contents);
	if ( ! matches ) {
	    return callback(null, variables);
	}
        for( var mIndex = 0; mIndex < matches.length; mIndex++ ) {
	    var foundVar = matches[mIndex];
	    if ( /STACK::/.test(foundVar) ) { 
		continue; 
	    }
	    if ( ! variables[foundVar] ){
		variables[foundVar] = {};
	    }
	    
	};	    
    };
    return callback(null, variables);
};

parseConfigVariablesFiles = function(basedir, callback){
    getConfigVariableFiles(basedir, function(err, variable_files){
	if (err) {
	    return callback(err, null);
	} else {
	    getServicefiles(basedir, function(err, service_files){
		if (err){
		    return callback(err, null);
		} else {
		    getVariablesFromConfigFiles(variable_files, function(err, configVariables){
			if (err){
			    return callback(err, null);
			} else {
			    getVariablesFromServicefiles(service_files, function(err, scriptVariables){
				var target = _.extend(scriptVariables, configVariables);
				//console.log(target);
				return callback(null, target);
			    });
			}
		    });
		}
	    });
	}
    });
};

generateVariablesFile = function(startdir, showMissing, callback){
    parseConfigVariablesFiles(startdir, function(err, data){
	var finalDoc = {"variables": {}}
	for (var item in data) {
	    for (var key in item ) {
		if (item.hasOwnProperty(key)) {
		    alert(key + " -> " + p[key]);
		}
	    }
	}
	return callback(null, finalDoc);
    });
}

initBaseDirectory = function(startdir, callback){
    console.log('initing base dir');
    var yml = yaml.dump(generateVariablesFile(startdir, true, function(err, data){
	if (err) {
	    console.log(err);
	    process.exit(1);
	} else {
	    console.log('yaml dumped');
	}
    }))
//     with open(os.path.join(startdir, "config.yaml"), 'w') as var_file:
//         var_file.write(
//                   """## This file was auto-generated by CloudCoreo CLI
// ## this yaml file contains variables, their defaults, overrides, type and namespaces. i.e:
// ## variables:
// ##   PUBLIC_ROUTE_NAME:
// ##     default: my-public-route
// ##     description: 'the name to give to the public route'
// ##     required: true
// ##     type: string

// %s
//                   """ % yml)
}

createReadmeMd = function(directory, content, callback) {
    var readmeFile = path.join(directory, "README.md");
    writeIfNeeded(readmeFile, content, false, callback);
};

writeIfNeeded = function(file_path, content, forceWrite, callback){
    fs.exists(file_path, function(exists) {
	if ( ! exists || forceWrite == true ) {
	    content.toString().split('\n').forEach(function (line) { 
		fs.appendFileSync(file_path, line.toString() + "\n");
	    });
	}
	return callback(null, true);
    });
};

module.exports.createOverridesDirectory = function(startdir, callback) {
    override_dir = path.join(startdir, "overrides");
    mkdirp(override_dir, function(err) { 
	if (err) {
	    return callback(err, false);
	} else {
	    createReadmeMd(override_dir, "## This file was auto-generated by CloudCoreo CLI\n" +
			   "Anything contained in this directory will act as an override for the stack in which it is contained.\n" +
			   "\n" +
			   "The paths should be considered relative to the parent of this directory.\n" +
			   "\n" +
			   "For example, if you have a directory structure like this, \n" +
			   "```\n" +
			   "+-- parent\n" +
			   "|   +-- overrides\n" +
			   "|   |   +-- stack-a\n" +
			   "|   |   |   +-- boot-scripts\n" +
			   "|   |   |   |   +-- order.yaml\n" +
			   "|   +-- stack-a\n" +
			   "|   |   +-- boot-scripts\n" +
			   "|   |   |   +-- order.yaml\n" +
			   "```\n" +
			   "Because the directory structure within the override directory matches the structure of the parent, \n" +
			   "the 'order.yaml' file will be ignored in the stack-a directory and instead the overrides/stack-a order.yaml\n" +
			   "file will be used.\n" +
			   "", function(err, created) {
			      if(err) {
				   return callback(err, false);
			       } else {
				   return callback(null, true);
			       }
			   });
	}
    });
};

Array.prototype.unique = function() {
    var a = _this.concat();
    for(var i=0; i<a.length; ++i) {
        for(var j=i+1; j<a.length; ++j) {
            if(a[i] === a[j])
                a.splice(j--, 1);
        }
    }

    return a;
};

rewriteVariablesToFile = function(configFileName, myVariables, callback){
    var my_doc;
    var combinedDictionary = {}
    my_doc = fsutil.readYAMLSync(path.normalize(configFileName));
    if( (! my_doc) || (! my_doc.variables)) {
	my_doc = {};
    }
    if ( ! myVariables ) { 
	myVariables = {};
    }
    var variableArray = [];
    if (! Array.isArray(myVariables)) {
	console.log('not an array, pushing');
	variableArray.push(myVariables);
    } else {
	variableArray = myVariables;
    }
    for ( var m_varArrayIndex = 0; m_varArrayIndex < variableArray.length; m_varArrayIndex++) {
	var variables = variableArray[m_varArrayIndex] || [{}];
	//variables is an array of variable arrays
	for ( var m_varIndex = 0; m_varIndex < variables.length; m_varIndex++ ) {
	    // now variables[m_varIndex] is a hash
	    // iterate over the hash keys now
	    for (m_var in variables[m_varIndex] ) {
		// we need to operate on the actual key
		if (! combinedDictionary[m_var]) {
		    combinedDictionary[m_var] = variables[m_varIndex][m_var];
		} else {
		    var mergedDictionary = mergeOptions(combinedDictionary[m_var], variables[m_varIndex]);
		    combinedDictionary[m_var] = mergedDictionary;
		}
	    }
	};
	if ( ! my_doc['variables'] ) {continue;}
	for ( var m_varIndex = 0; m_varIndex < my_doc['variables'].length; m_varIndex++ ) {
	    var m_var = my_doc['variables'][m_varIndex];
	    var obj = {};
	    if (! combinedDictionary[m_var]) {
		obj = my_doc['variables'][m_var];
		combinedDictionary[m_var] = obj;
	    } else {
		var mergedDictionary = mergeOptions(combinedDictionary[m_var], my_doc['variables'][m_var]);
		combinedDictionary[m_var] = mergedDictionary;
	    }
	};
    }
    for(m_var in combinedDictionary){
	delete combinedDictionary[m_var]['namespace']
    }
    combinedDictionary = {variables: combinedDictionary};
    var conf = yaml.dump(combinedDictionary, {indent: 4, sortKeys: true});
    fs.writeFile(configFileName, conf, function(err) {
	if(err) {
	    return callback(err, null);
	} else {
	    return callback(null, true);
	}
	
    }); 
};

module.exports.createConfigYamlFile = function(dir, variables, callback) {
    var configFilename = path.join(dir, "config.yaml");
    mkdirp(dir, function(err) { 
	writeIfNeeded(configFilename, "## This file was auto-generated by CloudCoreo CLI\n" +
		      "## this yaml file contains variables, their defaults, overrides, type and namespaces. i.e:\n" +
		      "## variables:\n" +
		      "##   PUBLIC_ROUTE_NAME:\n" +
		      "##     default: my-public-route\n" +
		      "##     description: 'the name to give to the public route'\n" +
		      "##     required: true\n" +
		      "##     type: string\n" +
		      "", false, function(err, data) { 
			  if (err) { 
			      console.log('error');
			      return callback(err, data);
			  } 
			  rewriteVariablesToFile(configFilename, variables, callback);
		      });
    });
};

forceCreateConfigYamlFile = function(dir, variables, callback) {
    var configFilename = path.join(dir, "config.yaml");
    mkdirp(dir, function(err) { 
	writeIfNeeded(configFilename, "## This file was auto-generated by CloudCoreo CLI\n" +
		      "## this yaml file contains variables, their defaults, overrides, type and namespaces. i.e:\n" +
		      "\n" +
		      "", true, function(err, data) { 
			  if (err) { 
			      console.log('error');
			      return callback(err, data);
			  } 
			  rewriteVariablesToFile(configFilename, variables, callback);
		      });
    });
};

module.exports.createServicesDirectory = function(startdir, callback) {
    var services_dir = path.join(startdir, "services");
    mkdirp(services_dir, function(err) { 
	var configFilename = path.join(services_dir, "config.rb");
        writeIfNeeded(configFilename,"## This file was auto-generated by CloudCoreo CLI\n" +
		      "## This file was automatically generated using the CloudCoreo CLI\n" +
		      "##\n" +
		      "## This config.rb file exists to create and maintain services not related to compute.\n" +
		      "## for example, a VPC might be maintained using:\n" +
		      "##\n" +
		      "## coreo_aws_vpc_vpc \"my-vpc\" do\n" +
		      "##   action :sustain\n" +
		      "##   cidr \"12.0.0.0/16\"\n" +
		      "##   internet_gateway true\n" +
		      "## end\n" +
		      "##\n" +
		      "\n" +
		      "", false ,function(err, data) { if (err) { console.log('error');callback(err, false); } });
	createReadmeMd(services_dir, "## This file was auto-generated by CloudCoreo CLI\n" +
		       "This is your services directory. Place a config.rb file in here containing CloudCoreo service\n" +
		       "syntax. For example, your config.rb might contain the following in order to create a VPC\n" +
		       "```\n" +
		       "coreo_aws_vpc_vpc \"my-vpc\" do\n" +
		       "  action :sustain\n" +
		       "  cidr \"12.0.0.0/16\"\n" +
		       "  internet_gateway true\n" +
		       "end\n" +
		       "\n" +
		       "coreo_aws_vpc_routetable \"my-public-route\" do\n" +
		       "  action :create\n" +
		       "  vpc \"my-vpc\"\n" +
		       "  number_of_tables 3\n" +
		       "  routes [\n" +
		       "         { :from => \"0.0.0.0/0\", :to => \"my-vpc\", :type => :igw },\n" +
		       "        ]\n" +
		       "end\n" +
		       "\n" +
		       "coreo_aws_vpc_subnet \"my-public-subnet\" do\n" +
		       "  action :create\n" +
		       "  number_of_zones 3\n" +
		       "  percent_of_vpc_allocated 50\n" +
		       "  route_table \"my-public-route\"\n" +
		       "  vpc \"my-vpc\"\n" +
		       "  map_public_ip_on_launch true\n" +
		       "end\n" +
		       "```\n" +
		       "", function(err, created) {
			   if(err) {
			       return callback(err, false);
			   } else {
			       return callback(null, true);
			   }
		       });
    });
};

    
