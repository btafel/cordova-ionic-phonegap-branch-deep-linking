/*
Parser for config.xml file. Read plugin-specific preferences (from <branch-config> tag) as JSON object.
*/
(function() {

  var path = require('path'),
    fs = require('fs'),
    xml2js = require('xml2js'),
    ConfigXmlHelper = require('./configXmlHelper.js'),
    DEFAULT_SCHEME = 'http';

  module.exports = {
    readPreferences: readPreferences
  };

  // region Public API

  /**
   * Read plugin preferences from the config.xml file.
   *
   * @param {Object} cordovaContext - cordova context object
   * @return {Array} list of host objects
   */
  function readPreferences(cordovaContext) {
    // read data from projects root config.xml file
    var configXml = new ConfigXmlHelper(cordovaContext).read();
    if (configXml == null) {
      console.warn('config.xml not found! Please, check that it exist\'s in your project\'s root directory.');
      return null;
    }

    // look for data from the <branch-config> tag
    console.log("configXml", configXml);

    var ulXmlPreferences = configXml.widget['branch-config'];
    if (ulXmlPreferences == null || ulXmlPreferences.length == 0) {
      console.warn('<branch-config> tag is not set in the config.xml. Universal Links plugin is not going to work.');
      return null;
    }

    var xmlPreferences = ulXmlPreferences[0];

    // read hosts
    var hosts = constructHostsList(xmlPreferences);

    // read ios team ID
    var iosTeamId = getTeamIdPreference(xmlPreferences);

    // read Android prefix
    var androidPrefix = getAndroidPrefixPreference(xmlPreferences);

    return {
      'hosts': hosts,
      'iosTeamId': iosTeamId,
      'androidPrefix': androidPrefix
    };
  }

  // endregion

  // region Private API

  function getTeamIdPreference(xmlPreferences) {
    if (xmlPreferences.hasOwnProperty('ios-team-id')) {
      return xmlPreferences['ios-team-id'][0]['$']['value'];
    }

    return null;
  }

  function getAndroidPrefixPreference(xmlPreferences) {
    if (xmlPreferences.hasOwnProperty('android-prefix')) {
      return xmlPreferences['android-prefix'][0]['$']['value'];
    }

    return null;
  }

  /**
   * Construct list of host objects, defined in xml file.
   *
   * @param {Object} xmlPreferences - plugin preferences from config.xml as JSON object
   * @return {Array} array of JSON objects, where each entry defines host data from config.xml.
   */
  function constructHostsList(xmlPreferences) {
    var hostsList = [];

    // look for defined hosts
    var xmlHostList = xmlPreferences['host'];
    if (xmlHostList == null || xmlHostList.length == 0) {
      return [];
    }

    xmlHostList.forEach(function(xmlElement) {
      var host = constructHostEntry(xmlElement);
      if (host) {
        hostsList.push(host);
      }
    });

    return hostsList;
  }

  /**
   * Construct host object from xml data.
   *
   * @param {Object} xmlElement - xml data to process.
   * @return {Object} host entry as JSON object
   */
  function constructHostEntry(xmlElement) {
    var host = {
        scheme: DEFAULT_SCHEME,
        name: ''
      },
      hostProperties = xmlElement['$'];

    if (hostProperties == null || hostProperties.length == 0) {
      return null;
    }

    // read host name
    host.name = hostProperties.name;

    // read scheme if defined
    if (hostProperties['scheme'] != null) {
      host.scheme = hostProperties.scheme;
    }

    return host;
  }

  // endregion

})();
