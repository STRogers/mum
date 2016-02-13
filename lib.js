'use strict';
const fs = require('fs');
const mkdirp = require('mkdirp');
const handlebars = require('handlebars');
const path = require('path');
const child_process = require('child_process');
const cla = require('command-line-args');

module.exports = {

    error: function(errorMessage, errorCode) {
        this.clog('Error['+errorCode+']: '+errorMessage);
        process.exit(errorCode);
    },

    readCommandInput: function(commands) {
        var cli = cla([
            {
                name: 'rawArgs',
                alias: 'a',
                type: String,
                multiple: true,
                defaultOption: true
            }
        ]);

        var o = cli.parse();

        if(! this.isArray(o.rawArgs) || ! o.rawArgs.length) {
            this.error('No arguments provided. At least one argument (the command name) must be provided. Expected: mum <command>', 0);
        }

        var command = o.rawArgs.shift();
        if(! commands.hasOwnProperty(command)) {
            var commandNames = [];
            for(var commandName in commands) {
                if(commands.hasOwnProperty(commandName)) {
                    commandNames.push(commandName);
                }
            }
            this.error('Invalid command: `'+command+'`. Expected one of ['+commandNames.join(', ')+']', 0);
        }

        if(! this.isArray(commands[command])) {
            this.error('Command descriptor object for `'+command+'` is not an array.', 0);
        }

        return {
            name: command,
            args: this._mapArgsToObject(o.rawArgs, commands[command], command)
        };
    },

    _mapArgsToObject: function(args, argsMap, command) {
        var o = {};

        var _self = this;

        argsMap.forEach(function(arg, index) {
            if(_self.isUndefined(args[index])) {
                if(_self.isDefined(arg.default)) {
                    args[index] = arg.default;
                } else {
                    var message = 'Expected: mum '+command;
                    argsMap.forEach(function(arg) {
                        message += ' <'+arg.name+'>';
                    });
                    _self.error('Missing required argument '+(index+1)+' <'+arg.name+">\n"+message, 0);
                }
            }
            o[arg.name] = args[index];
        });


        return o;
    },

    /**
     * Is the provided value a native JS Array?
     *
     * @param o
     * @returns {boolean}
     */
    isArray: function (o) {
        return (o instanceof Array);
    },

    /**
     * Is the provided value a native JS Object?
     *
     * @param o
     * @returns {boolean}
     */
    isObject: function (o) {
        return (o instanceof Object);
    },

    /**
     * Is the provided value an object of a type that is not an array-like or function-like argument.
     *
     * NOTE: This will return false for any object that is a native JS array, Basix.List object or Function
     *
     * @param o
     * @returns {boolean}
     */
    isPlainObject: function (o) {
        return (this.isObject(o) && !this.isArray(o) && !this.isFunction(o));
    },
    /**
     * Is the provided value a string?
     *
     * @param o
     * @returns {boolean}
     */
    isString: function (o) {
        return (typeof(o) == 'string');
    },

    /**
     * Is the provided value a boolean value? This is a strict check.
     *
     * @param o
     * @returns {boolean}
     */
    isBoolean: function (o) {
        return (o === true || o === false);
    },

    /**
     * Is the provided value a null value? This will return true only for a strict null match.
     * @param o
     * @returns {boolean}
     */
    isNull: function (o) {
        return o === null;
    },

    /**
     * Is the provided value an undefined value? This will return true only for a strict undefined match.
     * @param o
     * @returns {boolean}
     */
    isUndefined: function (o) {
        return typeof(o) === 'undefined';
    },

    isDefined: function(o) {
        return ! this.isUndefined(o);
    },

    isTruthy: function(o) {
        return this.isDefined(o) && o;
    },

    isFalsey: function(o) {
        return this.isUndefined(o) || !o;
    },

    /**
     * Is the provided value a numeric value? This will return true for any valid numeric string.
     *
     * @param o
     * @returns {boolean}
     */
    isNumeric: function (o) {
        if(this.isBoolean(o) || this.isNull() || o === '')
        {
            return false; // Boolean, null, and empty string values are considered numeric by isNaN()
        }
        return (!isNaN(o));
    },
    /**
     * Is the provided value a function?
     *
     * @param o
     * @returns {boolean}
     */
    isFunction: function (o) {
        return (o instanceof Function);
    },
    /**
     * Does the provided key exist in the provided array.
     *
     * NOTE: This currently just maps to jQuery.inArray() and then converts the result to a boolean to make using it less convoluted.
     *
     * @param key
     * @param targetArray
     * @returns {boolean}
     */
    inArray: function (key, targetArray) {
        return jQuery.inArray(key, targetArray) !== -1;
    },

    // initialize preferences file
    initializePreferences: function(appPrefsPath) {
        try {
            var stats = fs.lstatSync(appPrefsPath);
        } catch(e) {
            // Create the file
            this.clog('Initializing preferences file: '+appPrefsPath);
            var defaultPreferences = {};
            this.writePreferences(appPrefsPath, defaultPreferences);
        }
    },

    readPreferencesFromDisk: function(appPrefsPath) {
        return JSON.parse(fs.readFileSync(appPrefsPath));
    },

    writePreferences: function(appPrefsPath, preferences) {
        fs.writeFileSync(appPrefsPath, JSON.stringify(preferences));
    },

    clearTerminal: function () {
        process.stdout.write("\u001b[2J\u001b[0;0H");
    },

    clog: function () {
        var args = Array.prototype.slice.call(arguments);
        args.forEach(function (value, index) {
            console.log(value);
        });
    },

    getDirectoryListing: function (directoryPath, options, listing) {
        var self = this;

        if (typeof(listing) == 'undefined') {
            listing = [];
        }

        var files = fs.readdirSync(directoryPath);

        // @todo - allow overrides of the ignore list via options
        var ignore = [
            '.DS_Store',
            '.git',
            '.placeholder'
        ];

        files.forEach(function (file) {
            if (ignore.indexOf(file) > -1) {
                return;
            }
            var filePath = directoryPath + '/' + file;
            if (fs.statSync(filePath).isDirectory()) {
                listing.push({
                    path: filePath,
                    parentDirectory: path.dirname(filePath),
                    directoryName: path.basename(filePath),
                    type: 'directory'
                });
                self.getDirectoryListing(filePath, options, listing);
            } else {
                listing.push({
                    path: filePath,
                    parentDirectory: path.dirname(filePath),
                    fileName: path.basename(filePath),
                    fileExtension: path.extname(filePath),
                    type: 'file'
                });
            }
        });

        return listing;
    },

    capitalizeWords: function (string) {
        var self = this;
        string = self.toWords(string); // convert hyphens and underscores to spaces first
        var parts = string.split(' ');
        parts.forEach(function (part, index) {
            parts[index] = self.capitalizeFirstWord(part);
        });
        return parts.join(' ');
    },

    capitalizeFirstWord: function (string) {
        string = this.toWords(string);
        return string.substr(0, 1).toUpperCase() + string.substr(1);
    },

    toCamelCase: function (string) {
        string = this.toWords(string);
        return string.replace(/(\s[a-z])/g, function (match) {
            return match.toUpperCase().replace('_', '').replace(' ', '');
        });
    },

    toPascalCase: function (string) {
        string = this.toCamelCase(string);
        return string.substr(0, 1).toUpperCase() + string.substr(1);
    },

    toUnderscore: function (string) {
        string = this.toWords(string);
        return string.replace(/\s+/g, '_');
    },

    toHyphen: function (string) {
        string = this.toWords(string);
        return string.replace(/\s+/g, '-');
    },

    toWords: function (string) {
        return string.replace(/([A-Z]{1,})/g, function (match) {
            return ' ' + match.toLowerCase();
        }).replace(/[_-]/g, ' ').replace(/\s{2,}/g, ' ').trim();
    },

    updatePathName: function(fileName, context) {
        for (var propertyName in context) {
            if (context.hasOwnProperty(propertyName)) {
                fileName = fileName.replace(propertyName, context[propertyName]);
            }
        }
        return fileName;
    },

    // @todo change this to an "overlay" method for copying files from their git repo to their target directory
    generateAssets: function (sourcePath, targetPath, fileSystemContext, fileContentContext) {
        var self = this;
        self.clog('Source path: ' + sourcePath);
        self.clog('Target path: ' + targetPath);
        mkdirp.sync(targetPath); // Ensure the target directory exists

        self.clog('Made target path directory.');

        self.clog('Overlaying: ' + sourcePath + ' onto: ' + targetPath);

        var excludes = [];
        excludes.push('.git');
        excludes.push('.placeholder');
        excludes.push('.DS_Store');
        var excludeFlags = '';
        if (excludes.length) {
            excludeFlags = "--exclude '" + excludes.join("' --exclude '").trim() + "' ";
        }

        // Double quotes used to escape any spaces in the file paths, --ignore-existing used to only copy files that do not already exist
        var $command = 'rsync -vr --ignore-existing ' + excludeFlags + '"' + sourcePath + '/" "' + targetPath + '"';
        child_process.execSync($command);

        self.clog('Done overlaying files.');

        // We loop over the source paths because otherwise we are running this process on the entire site/system.
        var sourcePaths = self.getDirectoryListing(sourcePath);

        // Reverse the list of paths - we must work them backwards to avoid directory name changes causing failures later
        sourcePaths.reverse();

        sourcePaths.forEach(function (fileData, index) {
            // Change out the base path being used
            fileData.path = fileData.path.replace(sourcePath, targetPath);

            var oldPath = fileData.path;
            //self.clog('Working on: ' + oldPath);

            try {
                // Update the file contents
                if (fileData.type == 'file') {
                    var source = fs.readFileSync(fileData.path, 'utf8');
                    var template = handlebars.compile(source);
                    var output = template(fileContentContext);
                    fs.writeFileSync(fileData.path, output, 'utf8');
                }

                // Rename the file if needed
                var newPath = path.dirname(fileData.path) + '/' + self.updatePathName(path.basename(fileData.path), fileSystemContext);
                if (newPath != oldPath) {
                    fs.renameSync(oldPath, newPath);
                }
            } catch (e) {
                self.clog('Failed to apply all contexts to: ' + oldPath);
            }
        });

        self.clog('Done applying contexts to files.');
    }
};
