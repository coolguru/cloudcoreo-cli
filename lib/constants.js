
_this = this;

module.exports.host = 'www.cloudcoreo.com';
module.exports.protocol = 'https';
module.exports.port = 443;

//module.exports.host = 'localhost';
//module.exports.protocol = 'http';
//module.exports.port = 3000;

module.exports.hubHost = 'hub.cloudcoreo.com';
module.exports.hubProtocol = 'http';
module.exports.hubPort = 80;

module.exports.soloPath = 'api/solo';
module.exports.linkPath = 'api/link';
module.exports.signupUrl = 'https://www.cloudcoreo.com/api/signup';

module.exports.apiBase = 'api';
module.exports.appstackPath = _this.apiBase + '/appstacks'
module.exports.appstackInstancePath = _this.apiBase + '/appstackinstances'

module.exports.soloLogTailMinutesOffset = 5;
