/* Minify scripts */

'use strict';

const Path = require('path');
const FileSystem = require('fs');
const minify = require('@node-minify/core');

const uglifyJS = require('@node-minify/uglify-js');
const cleanCSS = require('@node-minify/clean-css');

console.log("Minifying javascript files...");

let files;

files = FileSystem.readdirSync(Path.resolve(__dirname, "js"));

for (let file of files) {
	if ((/\.js$/).test(file) && !((/\.min\.js$/).test(file))) {
		let newfile = file.substr(0, file.length - 3) + ".min.js";
		minify({
			compressor: uglifyJS,
			input: Path.resolve(__dirname, "js", file),
			output: Path.resolve(__dirname, "js", newfile),
			callback: function (err, min) {
				if (err) {
                    console.error(err);
					console.log("ERROR: Could not parse javascript file: " + file + " | See above for details.");
					process.exit(1);
				}
			}
		});
	}
}
console.log("Minifying stylesheet files...");

files = FileSystem.readdirSync(Path.resolve(__dirname, "css"));

for (let file of files) {
	if ((/\.css$/).test(file) && !((/\.min\.css$/).test(file))) {
		let newfile = file.substr(0, file.length - 4) + ".min.css";
		minify({
			compressor: cleanCSS,
			input: Path.resolve(__dirname, "css", file),
			output: Path.resolve(__dirname, "css", newfile),
			callback: function (err, min) {
				if (err) {
                    console.error(err);
					console.log("ERROR: Could not parse stylesheet file: " + file + " | See above for details.");
					process.exit(1);
				}
			}
        });
	}
}
