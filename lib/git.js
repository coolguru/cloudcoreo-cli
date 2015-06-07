var fs = require('fs')
var gift = require('gift')
var helper = require('./helpers')

module.exports.init = function(dirPath, callback) {
    helper.git_cmd(dirPath, null, "init", {}, ['.'], callback);
};

module.exports.add_submodule = function(dir, git_url, module_path, callback){
    console.log(dir + ',' + git_url + ',' + module_path);
    helper.git_cmd(dir, null, "submodule add", {}, ['--force', git_url, module_path], function(err, data){
	if (err) { 
	    console.log(err);
	    callback(err, false);
	} else {
	    helper.git_cmd(dir, null, "submodule update",{},["--recursive", "--init"],function(err, stuff){
		if(err) {
		    console.log(err);
		} else {
		    callback(null, true);
		}
	    });
	}
    });
};

module.exports.clone = function(git_url, dirPath, callback) {
    gift.clone(git_url, dirPath, function(err, repo){
	if(err) { 
	    callback(err, null);
	    return;
	}
	helper.git_cmd(dirPath, null, "submodule update",{},["--recursive", "--init"],function(err, stuff){
	    if(err)console.log("logging error from version: " + err)
	    console.log("logging ouptut from version: " + stuff)
	    
	    get_config_files_recursive(dirPath, function(err, config_files){
		if(err) console.log(err)
		//sort the files based on lenght - its sketchy, but it works..
		// the longer file names are deeper in the inheritance.
		config_files.sort(function(a, b){
		    return b.length - a.length; // ASC -> a - b; DESC -> b - a
		});
		
		combine_files_into_json(config_files, function(err, json){
		    var config = new InstanceConfig();
		    config.document = json
		    config.user_id = appstackinstance.user_id;
		    config.appstackinstance_id = appstackinstance._id
		    config.save();
		})
	    })
	})
    })
};
