# Help
If no parameters are given the app searches a file called ```.crunshrc```.  
The content should look like the following example:

## Example of `.crunshrc` containing default values
```js 
{
   "js" : {
       "mangle": true,
       "beautify": false,
       "fromString": true
   },
   "css" : {
       "maxLineLen": 500,
       "expandVars": true
   },
   "html": {
       "customAttrSurround": [["/\\{\\{#[^}]+\\}\\}/", "/\\{\\{\\/[^}]+\\}\\}/"]],
       "removeComments" : true,
       "html5" : true,
       "preserveLineBreaks" : false,
       "processScripts" : ["text/x-handlebars-template"],
       "removeCommentsFromCDATA" : true,
       "collapseWhitespace" : true,
       "collapseBooleanAttributes" : false,
       "removeAttributeQuotes" : false,
       "removeRedundantAttributes" : false,
       "useShortDoctype" : true,
       "removeEmptyAttributes" : false,
       "removeOptionalTags" : false,
       "removeEmptyElements" : false
   },
   "inputfile" : "c:/git/film/dev/index.html",
   "outputfolder" : "./public/"
}
```

## Usage

```sh
crunsh [--targetfolder ./out];
```

## Parameters
|Name|Description|
|----|-----------| 
|--outputfolder|Targetfolder for minified files.|
|help, --help, /? |Show this help.|
|version, --version, -v|Show version.|