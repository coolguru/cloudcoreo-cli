var exec = require('child_process').exec;
var fs = require('fs');
var path = require('path');
var mkdirp = require('mkdirp');
var yaml = require('js-yaml');
var walk = require('walkdir');
var _ = require('underscore');
var jsonfile = require('jsonfile');
var gitane = require('gitane-windows');

var cloudcoreoPublicKeyMaterial = "-----BEGIN RSA PRIVATE KEY-----\nMIIEpQIBAAKCAQEAs2jYEk8RkE2u6uTFcHTspe+qwNL8YNB127VUzwnJz6mtk+e5\nnWq97CcbRIlh6bfH8qCO/jdVWXLCQ8zRtiaP0wPebBLQKzRTJ77MaHlfd+tfcOL3\njPDmsEwTzawWLfEykWQIFR2MS7fsZGwhvFKM3ZjdXwYIkGJFlVZarTDF2oRperq5\n6+KzFgPsKkY2RLMo1XD7QemM6PWeRIHwgysnFhct5cPP5AtGWJrR//hLN8TrZAUk\nfmpbGXHde3yo+ZIgf8Bm0vyA6eOfocdO3MK2KTGslGGznBofudfY6SKTEvTUXbKh\nKxmyv0U7Ii4hLrfS2HFAjqPFLJNTizcPNfI9awIDAQABAoIBABXNO9SdvyimCAeL\nXWLZEpjnkvxzpy+spWXZl0DBk8Ckge9jTW8PtZyo8+tUNo3MQ4P8duP1nW2NQIY0\nsZdNAFVINxMzBhD5/tDporVfanaMJ8D0E9kQvTfXRuDLdLaIhPieC01lldLtutBJ\nQ6A699tF5EDT3t6M0p/fKo25S5HOKVz5HwW7ifIJma6tORambSTelXq9rxZiAEbQ\nV8LJSF4jL8SmueMyDOgM1fqJ/1Kz/3nxus+itAp9nFJ+eSgd0QaqokCiaFro/2VX\nPpHalfqaeVHIfsQWcpXXrk/+siX7Q1o7x3/JNqrQQkftegJ8GYwFD/zolLlSerTx\nPe7SAaECgYEA11dz6uHsjehyzIZRuCb8K5E5Rr2jd1N/k295wbaH04d6Syc1CNPw\nCdI7/BZZXpzniiXz75mAdyntL9MWDAJWZMhrsF4Kt9MTrj1gJl8WLXeGdsvmWbEi\nMudcNzezQtlnY7rlD9u7g3fu24wSBqMhyojCXZlbN+vIXTlZklW9Bb8CgYEA1Uic\n9OC76NLu/rcmAMGKHzveZWX0w4xs9NGrRCvhlewakwflW6NUtTFS8O8mg8p17r68\nUgmjcI/uaHqqYqLrNNJX5cwZfAc19dE5YxZjYMviX28woSG0NPIKWVBTV8oHi/mf\nGFTftorgLKnKQ/LlPGG6lkMOH+ZtfA9kRjpX61UCgYEAnnKsymFeS7SD89XJf3TA\nC9aZjGGxS/XWY0edEVobaxu+clnw/gPkFXXpyT0wmRteixoN+Xi7O/NPoObyy/dU\nVmfaRTWNMWFQk955RwKkMORHvlWdstVRUp9GDSMg9ck99/Xm4dpOiRfQWx8fjF6w\nWHR0f6Z9phIJpf6y16fao8UCgYEAuhmB2qm9TInAv8BPCJnXSymSBCfSSk5dQ8Ev\nD2y6iXZaObDKEAuT/gXruQ7zLEucW5VR/MMsOStdewyNX0OIt65Rw9Ey62XfT34f\n9LW0QOGlxF/grrgZ5ZjMLuJH1nIR47ELgM+N5FmJAW+lbWSjYOxlQnd/+5W0Mmu7\nswt1a4ECgYEAjL1VRJFqGleWeZyiE7q/9GA5pA0UK+i6BvKqgGmYL3LzCu8suZZD\n6bhDY+R/+iFu8TKdmc/ikyqvHFOgvTVVaz79hkmfmjSJGt4Cm3iG957qDDYsiuBN\n30P/zDn99z9By6kOs1xIc6QpbfeGLNom3moHl/S4A3KlVjhPe2nNJQA=\n-----END RSA PRIVATE KEY-----\n"
var isWindows = /^win/.test(process.platform);

module.exports.getConfigFile = function() {
    mkdirp.sync(path.join(this.getUserHome(), '.cloudcoreo'));
    var file = path.join(this.getUserHome(), '.cloudcoreo', 'config');
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
    var file = this.getConfigFile();
    var configArray = this.getConfigArray();
    for ( var i=0; i < configArray.length; i++ ) {
	var c = config[i];
	if (c["username"] == configToAdd["username"]) {
	    // just skip this one because we are going to add it anyway
	    continue;
	}
    }	
    configArray.push(configToAdd);
    jsonfile.writeFileSync(file, configArray);
};

module.exports.updateConfig = function(config, newConfig) { 
    var configs = this.getConfigArray();
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
    var file = this.getConfigFile();
    jsonfile.writeFileSync(file, configs);
    return;
}

module.exports.getConfigArray = function() {
    var file = this.getConfigFile();
    var config = []
    if (fs.existsSync(file)) {
	config = jsonfile.readFileSync(file);
    }
    var configArray = []
    // handle user modified screwups array vs. not array etc.
    if ( Array.isArray(config) ) {
	for ( var i = 0; i < config.length; i++ ) {
	    var c = config[i];
	    configArray.push(c);
	}
    } else if (config) { // or its there but NOT an array
	// dont add it if it is the same username
	configArray.push(config);
    }
    return configArray;
};

module.exports.getUserHome = function() {
  return process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
};

module.exports.git_cmd = function(orrig_git_dir, keyMaterial, command, options, args, callback) {
    var git_dir = orrig_git_dir;
    if (isWindows) {
	git_dir = orrig_git_dir.replace(/\\/g,"\\\\");
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
    options = this.options_to_argv(options);
    options = options.join(" ");
    if (args == null) {
	args = [];
    }
    if (args instanceof Array) {
	args = args.join(" ");
    }
    bash = command + " " + options + " " + args;
    if(keyMaterial) {
	gitane.run(git_dir, keyMaterial, bash, function(err, data){
	    if (err) {
		console.log('error cloning repo - are you sure you have access or it is public?');
		console.log('gitane: ' + err);
	    }
	    console.log('gitane: ' + data)
	    return callback(err, data);
	});
    } else {
	//there is no key material, run it with their own git setup
	var child = exec(bash, {
	    cwd: git_dir,
	    timeout: 10000
	}, function(err, out){
	    if(err) {
		module.exports.git_cmd(orrig_git_dir, cloudcoreoPublicKeyMaterial, command, options, args, callback);
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
module.exports.fixConfigYaml = function(topLevelDir) {
    parseConfigVariablesFiles(topLevelDir, function(err, variables){
	var missingVariables = []
	for(var key in variables){
	    var myVar = variables[key];
	    // if this is required, we need to have a default or value set
	    var missingValue = false;
	    if ( myVar["required"] && myVar["required"] == true ) {
		// this one is required - we better have a default or a value
		if (typeof(myVar["default"]) === 'undefined' && typeof(myVar["value"]) === 'undefined') {
		    missingValue = true;
		}
	    }
	    var isMissing = ( Object.keys(myVar).length === 0 );
	    if ( isMissing || missingValue ){
		var missingVar = {};
		missingVar[key] = myVar;
		missingVariables.push(missingVar);
	    }
	}
	module.exports.createConfigYamlFile(topLevelDir, missingVariables, function(err, data){
	    if(err){
		console.log(err);
		process.exit(1);
	    }
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
		  "", function(err, data) { if (err) { console.log('error creating order.yaml file in shutdown scripts dir' + err); } });
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
		  "", function(err, data) { if (err) { console.log('error creating order.yaml in the bootscripts dir: ' + err); } });
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
	if ( ! /.git$/.test(filename) && /\/config.y(a)?ml/.test(filename)) {
	    order_files.push(filename)
	}
    });
    emitter.on('end',function(filename, stat){
	order_files.sort(function(a, b){
	    return b.length - a.length;
	});
	return callback(null, order_files);
    });
};
mergeOptions = function(obj1,obj2){
    var obj3 = {};
    for (var attrname in obj1) { obj3[attrname] = obj1[attrname]; }
    for (var attrname in obj2) { obj3[attrname] = obj2[attrname]; }
    return obj3;
};
getVariablesFromConfigFiles = function(variableFiles, callback){
    var combinedDictionary = {}
    for(fileIndex = 0; fileIndex < variableFiles.length; fileIndex++){
	var f = variableFiles[fileIndex];
        try {
	    var my_doc;
	    var tabbedData = fs.readFileSync(path.normalize(f));
	    var data = tabbedData.toString().replace(/\t/g, '    ');
	    var my_doc = yaml.safeLoad(data);
	    if (my_doc && my_doc['variables']) {
		if( (! my_doc) || (! my_doc.variables)) {
		    return;
		}
		for ( var m_var in my_doc['variables'] ) {
		    if (! combinedDictionary[m_var]) {
			combinedDictionary[m_var] = my_doc['variables'][m_var]
		    } else {
			var mergedDictionary = mergeOptions(combinedDictionary[m_var], my_doc['variables'][m_var]);
			combinedDictionary[m_var] = mergedDictionary;
		    }
		};
	    }
        } catch (ex) {
            console.log("Error parsing file " + f + " - perhaps invalid yaml?");
	    process.exit(1);
	}
    };
    return callback(null, combinedDictionary);
};

RegExp.prototype.execAll = function(string) {
    var match = null;
    var matches = new Array();
    while (match = this.exec(string)) {
        var matchArray = [];
        for (i in match) {
            if (parseInt(i) == i) {
                matchArray.push(match[i]);
            }
        }
        matches.push(matchArray[1]);
    }
    return matches;
};

getVariablesFromServicefiles = function(servicefiles, callback){
    var variables = {}
    for (var sIndex = 0; sIndex < servicefiles.length; sIndex++) {
	var f = servicefiles[sIndex];
	var contents = fs.readFileSync(f);
	var matches = /\${([^\}]+).*/g.execAll(contents)
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
	    console.log(err);
	    process.exit(1);
	} else {
	    getServicefiles(basedir, function(err, service_files){
		if (err){
		    console.log(err);
		    process.exit(1);
		} else {
		    getVariablesFromConfigFiles(variable_files, function(err, configVariables){
			if (err){
			    console.log(err);
			    process.exit(1);
			} else {
			    getVariablesFromServicefiles(service_files, function(err, scriptVariables){
				var target = _.extend(scriptVariables, configVariables);
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
    var variables = parseConfigVariablesFiles(startdir, function(err, data){});
    var finalDoc = {"variables": {}}
    for (var item in variables) {
	for (var key in item ) {
	    if (item.hasOwnProperty(key)) {
		alert(key + " -> " + p[key]);
	    }
	}
    }
    return callback(null, finalDoc);
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
    writeIfNeeded(readmeFile, content, callback);
};

writeIfNeeded = function(file_path, content, callback){
    fs.exists(file_path, function(exists) {
	if ( ! exists ) {
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
    var a = this.concat();
    for(var i=0; i<a.length; ++i) {
        for(var j=i+1; j<a.length; ++j) {
            if(a[i] === a[j])
                a.splice(j--, 1);
        }
    }

    return a;
};

rewriteVariablesToFile = function(configFileName, variables, callback){
    var my_doc;
    var combinedDictionary = {}
    var tabbedData = fs.readFileSync(path.normalize(configFileName));
    var data = tabbedData.toString().replace(/\t/g, '    ');
    yaml.safeLoadAll(data, function(my_doc){
	if( (! my_doc) || (! my_doc.variables)) {
	    my_doc = {};
	}
	if ( ! variables ) { 
	    variables = {};
	}
	for ( var m_varIndex = 0; m_varIndex < variables.length; m_varIndex++ ) {
	    // we need to operate on the actual key
	    var m_var;
	    for(var k in variables[m_varIndex]) { m_var = k }
	    if (! combinedDictionary[m_var]) {
		var obj = {};
		allkeys = ['default', 'value', 'description', 'overrides', 'type', 'required'];
		
		for (var i = 0; i < allkeys.length ; i++) {
		    if ( ! variables[m_varIndex][allkeys[i]] ){
			obj[allkeys[i]] = '';
		    } else {
			obj[allkeys[i]] = variables[m_varIndex][allkeys[i]];
		    }
		}
		combinedDictionary[m_var] = obj;
	    } else {
		var mergedDictionary = mergeOptions(combinedDictionary[m_var], variables[m_varIndex]);
		combinedDictionary[m_var] = mergedDictionary;
	    }
	};
	for ( var m_var in my_doc['variables'] ) {
	    var obj = {};
	    if (! combinedDictionary[m_var]) {
		obj = my_doc['variables'][m_var];
		combinedDictionary[m_var] = obj;
	    } else {
		var mergedDictionary = mergeOptions(combinedDictionary[m_var], my_doc['variables'][m_var]);
		combinedDictionary[m_var] = mergedDictionary;
	    }
	};
	combinedDictionary = {variables: combinedDictionary};
	var conf = yaml.dump(combinedDictionary, {indent: 4, sortKeys: true});
	fs.writeFile(configFileName, conf, function(err) {
	    if(err) {
		return callback(err, null);
	    } else {
		return callback(null, true);
	    }
	    
	}); 
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
		      "", function(err, data) { 
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
		      "", function(err, data) { if (err) { console.log('error');callback(err, false); } });
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

    
