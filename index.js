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
            cli.log("try fetch", src);
            if (fs.existsSync(path.join(dir, src))){
                js += fs.readFileSync(path.join(dir, src)).toString() + "\n";
                cli.log("remove", src, " from HTML");
                $(this).remove();
            } else {
                cli.log("skip", src);
            }
        }
    });
    $("link").each(function(){
        var src = $(this).attr("href");
        if (src !== undefined){
            cli.log("try fetch", src);
            if (fs.existsSync(path.join(dir, src))){
                css += fs.readFileSync(path.join(dir, src)).toString() + "\n";
                cli.log("remove", src, " from HTML");
                $(this).remove();
            } else {
                cli.log("skip", src);
            }
        }
    });

    var cssTarget = path.join(outputFolder, "style.css");
    var jsTarget = path.join(outputFolder, "app.js");
    var htmlTarget = path.join(outputFolder, "index.html");

    cli.log("minify js", jsTarget);
    var UglifyJS = require("uglify-js");
    js = UglifyJS.minify(js, {
        mangle: true,
        fromString: true
    }); 
    cli.log("write js", jsTarget);
    $("body").append("<script src=\"app.js\" charset=\"utf-8\"></script>");
    fs.writeFileSync(jsTarget, js.code);




    $("head").append("<link rel=\"stylesheet\" href=\"style.css\">");
    var uglifycss = require("uglifycss"); 
    var minifiedCss = uglifycss.processString(css, { 
        maxLineLen: 500, 
        expandVars: true 
    }); 
    fs.writeFileSync(cssTarget, minifiedCss);


    var minify = require("html-minifier").minify;
    $("body").html(minify($("body").html(), htmlMinifyOptions));
    $("head").html(minify($("head").html(), htmlMinifyOptions));
    fs.writeFileSync(htmlTarget, $.html());
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