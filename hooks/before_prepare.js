var fs = require("fs");
var path = require("path");
var child_process = require("child_process");

module.exports = function(context) {

    // Temporary hack to run npm install on this plugin's package.json dependencies.
    var pluginDir = path.resolve(__dirname, "../");

    // Need a promise so that the install waits for us to complete our project modifications
    // before the plugin gets installed.
    var Q = context.requireCordovaModule("q");
    var deferral = new Q.defer();

    //BT commented -> incompatibility error with Meteor/cordova
    // child_process.execSync("npm --prefix " + pluginDir + " install " + pluginDir);
    child_process.exec("npm --prefix " + pluginDir + " install " + pluginDir, function(){
      var xcode = require("xcode");

      var platforms = context.opts.cordova.platforms;

      // We can bail out if the iOS platform isn't present.
      if (platforms.indexOf("ios") === -1) {
          deferral.resolve();
          return deferral.promise;
      }

      // We need to add the Branch frameworks to the project here.
      // They need to be embedded binaries and cordova does not yet support that.
      // We will use node-xcode directy to add them since that library has
      // been upgraded to support embedded binaries.

      // Cordova libs to get the project path and project name so we can locate the xcode project file.
      var cordova_util = context.requireCordovaModule("cordova-lib/src/cordova/util"),
          ConfigParser = context.requireCordovaModule("cordova-lib").configparser,
          projectRoot = cordova_util.isCordova(),
          xml = cordova_util.projectConfig(projectRoot),
          cfg = new ConfigParser(xml);

      var projectPath = path.join(projectRoot, "platforms", "ios", cfg.name() + ".xcodeproj", "project.pbxproj");
      var xcodeProject = xcode.project(projectPath);

      xcodeProject.parse(function(err) {

          // If we couldn't parse the project, bail out.
          if (err){
              deferral.reject("BranchPlugin - after_plugin_install: " + JSON.stringify(err));
              return;
          }

          // Remove all of the frameworks because they were not embeded correctly.
          // var frameworkPath = cfg.name() + "/Plugins/io.branch.sdk/";

          // xcodeProject.removeFramework(frameworkPath + "Branch.framework", {customFramework: true, embed: true, link: true});

          // // This is critical to include, otherwise the library loader cannot find the dynamic Branch libs at runtime on a device.
          // xcodeProject.addBuildProperty("LD_RUNPATH_SEARCH_PATHS", "\"$(inherited) @executable_path/Frameworks\"", "Debug");
          // xcodeProject.addBuildProperty("LD_RUNPATH_SEARCH_PATHS", "\"$(inherited) @executable_path/Frameworks\"", "Release");

          // // Add the frameworks again.  This time they will have the code-sign option set so they get code signed when being deployed to devices.
          // xcodeProject.addFramework(frameworkPath + "Branch.framework", {customFramework: true, embed: true, link: true});

          // Save the project file back to disk.
          fs.writeFileSync(projectPath, xcodeProject.writeSync(), "utf-8");
          console.log("Finished BranchPlugin after install", projectPath);
          deferral.resolve();
      });

    });

    return deferral.promise;

};
