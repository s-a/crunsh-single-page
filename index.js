#!/usr/bin/env node
 
"use strict"; 

var hbAttrWrapOpen = /\{\{#[^}]+\}\}/;
var hbAttrWrapClose = /\{\{\/[^}]+\}\}/;
var hbAttrWrapPair = [hbAttrWrapOpen, hbAttrWrapClose];
var htmlMinifyOptions = { 
    customAttrSurround: [hbAttrWrapPair],
    removeComments : true,
    html5 : true,
    preserveLineBreaks : false,
    processScripts : ["text/x-handlebars-template"], 
    removeCommentsFromCDATA : true,
    collapseWhitespace : true,
    collapseBooleanAttributes : false,
    removeAttributeQuotes : false,
    removeRedundantAttributes : false,
    useShortDoctype : true,
    removeEmptyAttributes : false,
    removeOptionalTags : false,
    removeEmptyElements : false 
}

var CLI = require("n-cli");
var cli = new CLI({
    silent: false,
    handleUncaughtException : true
});


var fs = require("fs");
var path = require("path");
var cheerio = require("cheerio");
 
function crunsh(argv){
    var js = "";
    var css = "";
    var inputFilename = argv._[0];
    var outputFolder = argv.notNull("outputfolder");
    var dir = path.dirname(inputFilename);
    var $ = cheerio.load(fs.readFileSync(inputFilename));

    $("script:not([src=''])").each(function(){
        var src = $(this).attr("src");
        if (src !== undefined){
            cli.stdout(cli.color.yellow("try fetch " + src + "...\n"));
            if (fs.existsSync(path.join(dir, src))){
                js += fs.readFileSync(path.join(dir, src)).toString() + "\n";
                cli.stdout(cli.color.white("remove " + src + " from HTML\n"));
                $(this).remove();
            } else {
                cli.stdout(cli.color.red("skip " + src + "\n"));
            }
        }
    });
    $("link").each(function(){
        var src = $(this).attr("href"); 
        if (src !== undefined && src.toLowerCase().slice(src.length - 4, src.length) === ".css"){
            cli.stdout(cli.color.cyan("try fetch " + src + "...\n"));
            if (fs.existsSync(path.join(dir, src))){
                css += fs.readFileSync(path.join(dir, src)).toString() + "\n";
                cli.stdout(cli.color.white("remove " + src + " from HTML\n"));
                $(this).remove();
            } else {
                cli.stdout(cli.color.red("skip " + src + "\n"));
            }
        }
    });


    cli.stdout(cli.color.green("minify assets.\n"));

    var cssTarget = path.join(outputFolder, "style.css");
    var jsTarget = path.join(outputFolder, "app.js");
    var htmlTarget = path.join(outputFolder, "index.html");

    cli.stdout(cli.color.yellow("minify js...\n"));
    var UglifyJS = require("uglify-js");
    js = UglifyJS.minify(js, {
        mangle: true,
        fromString: true
    }); 
    cli.stdout(cli.color.white("write js " + jsTarget + "\n"));
    $("body").append("<script src=\"app.js\" charset=\"utf-8\"></script>");
    fs.writeFileSync(jsTarget, js.code);



    cli.stdout(cli.color.yellow("minify css...\n"));
    $("head").append("<link rel=\"stylesheet\" href=\"style.css\">");
    var uglifycss = require("uglifycss"); 
    var minifiedCss = uglifycss.processString(css, { 
        maxLineLen: 500, 
        expandVars: true 
    }); 
    cli.stdout(cli.color.white("write css " + cssTarget + "\n"));
    fs.writeFileSync(cssTarget, minifiedCss);


    var finalize = function(){
        cli.stdout(cli.color.yellow("minify html...\n"));
        var minify = require("html-minifier").minify;
        $("body").html(minify($("body").html(), htmlMinifyOptions));
        $("head").html(minify($("head").html(), htmlMinifyOptions));
        cli.stdout(cli.color.white("write html " + htmlTarget + "\n"));
        fs.writeFileSync(htmlTarget, $.html());
        cli.stdout(cli.color.green("done.\n"));
    };

    var packageJson = path.join(dir, "package.json");
    if (fs.existsSync(packageJson)){
        cli.stdout(cli.color.green("found " + packageJson + "...\n"));        
        cli.stdout(cli.color.yellow("try to bump version of " + packageJson + " ...\n"));
        var npm = require("npm");
        npm.load({
            loaded: false,
            prefix: dir
        }, function (err) {
          npm.commands.version(["patch"], function (er, data) {
            if (er){
                throw new cli.Error(er);
            } else {
                var packageJsonObject = require(packageJson);
                cli.stdout(cli.color.yellow("Add author " + packageJsonObject.author + " to HTML.\n"));        
                $("head").append("<meta name=\"author\" content=\"" + packageJsonObject.author + "\">");  

                cli.stdout(cli.color.yellow("Add version " + packageJsonObject.version + " to HTML.\n"));        
                $("head").append("<meta name=\"version\" content=\"" + packageJsonObject.version + "\">");  

                finalize();
            }
          });
        });
    } else {
        finalize();
    }

}

cli.on(function(){
    
    var f = this.argv._[0];
    if (!f){
        throw new cli.Error("missing-parameter", "<path-and-filename-to-html-file>");
    }
    if (!fs.existsSync(f)){
        throw new cli.Error("file-not-found", f);
    }
    crunsh(this.argv);
});