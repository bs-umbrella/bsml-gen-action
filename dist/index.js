"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@actions/core");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const Rule_1 = require("./Rule");
const Pattern_1 = require("./Pattern");
const xml_formatter_1 = __importDefault(require("xml-formatter"));
/* EXAMPLE:

# Header 1
## Header 2
### Header 3
#### Header 4

test 1

- bullet 1
- bullet 2
* bullet 3
* bullet 4

1. one
2. two
3. three

[link](https://www.google.com)
![image](https://xxx.png)
*/
const BSMLGenRules = [
    new Rule_1.Rule('header', [
        new Pattern_1.Pattern(/^#{4}\s?([^\n]+)/gm, '<text font-size="5" text="$1"/>'),
        new Pattern_1.Pattern(/^#{3}\s?([^\n]+)/gm, '<text font-size="6" text="$1"/>'),
        new Pattern_1.Pattern(/^#{2}\s?([^\n]+)/gm, '<text font-size="7" text="$1"/>'),
        new Pattern_1.Pattern(/^#{1}\s?([^\n]+)/gm, '<text font-size="8" text="$1"/>'),
    ]),
    new Rule_1.Rule('list', [
        new Pattern_1.Pattern(/\* \s?([^\n]+)/g, ':$1'), //bullet list
        new Pattern_1.Pattern(/\- \s?([^\n]+)/g, ':$1'),
        new Pattern_1.Pattern(/\ - \s?([^\n]+)/g, '  :$1'),
        new Pattern_1.Pattern(/\  - \s?([^\n]+)/g, '    :$1'),
        new Pattern_1.Pattern(/\   - \s?([^\n]+)/g, '      :$1'),
        new Pattern_1.Pattern(/\    - \s?([^\n]+)/g, '        :$1'),
    ]),
    new Rule_1.Rule('add-space', [
        new Pattern_1.Pattern(/^\n/gm, '<bg bg="panel-top" pref-height="5" bg-alpha="0" bg-color="00000000"/>'),
    ]),
    new Rule_1.Rule('color', [
        new Pattern_1.Pattern(/\[color="([^"]+)"\]\(([^)]+)\)/g, '<text color="$1" text="$2"/>'),
    ]),
    new Rule_1.Rule('image', [
        new Pattern_1.Pattern(/\!\[([^\]]+)\]\((\S+)\)/g, '<img src="$2" hover-hint="$1"/>'),
    ]),
    new Rule_1.Rule('link', [
        new Pattern_1.Pattern(/\[([^\n]+)\]\(([^\n]+)\)/g, '<open-page-text text="$1" url="$2" open-in-browser="true"/>'),
    ])
    //new Rule('paragraph', [
    //  new Pattern(/^(?!<)([^\n]+\n)/gm, '\n<text font-size="4" text="$1"/>\n'),
    //]),
    //new Rule('bold', [
    //  new Pattern(/\*\*\s?([^\n]+)\*\*/g, '<b>$1</b>'),
    //]),
    //new Rule('italic', [
    //  new Pattern(/\*\s?([^\n]+)\*/g, '<i>$1</i>'),
    //  new Pattern(/\_\s?([^\n]+)\_/g, '<i>$1</i>'),
    //]),
    //new Rule('underline', [
    //  new Pattern(/\_\_\s?([^\n]+)\_\_/g, '<u>$1</u>'),
    //]),
    //new Rule('strikethrough', [
    //  new Pattern(/\-\-\s?([^\n]+)\-\-/g, '<s>$1</s>'),
    //]),
];
function processFile(content) {
    // Process the content and return it
    BSMLGenRules.forEach(rule => {
        content = rule.apply(content);
    });
    return content;
}
function removeNewLines(content) {
    return content.replace(/\n/g, '');
}
function formatXML(content) {
    return (0, xml_formatter_1.default)(content);
}
function wrapBSML(content) {
    return "<bg xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' xsi:schemaLocation='https://monkeymanboy.github.io/BSML-Docs/ https://raw.githubusercontent.com/monkeymanboy/BSML-Docs/gh-pages/BSMLSchema.xsd'><vertical>" + content + "</vertical></document>";
}
const inputDir = (0, core_1.getInput)('input-dir');
const outputDir = (0, core_1.getInput)('output-dir');
console.log(`Starting workflow... exporting to ${inputDir}!`);
fs_1.default.readdir(inputDir, (err, files) => {
    if (err) {
        console.error(`Error reading directory: ${err}`);
        return;
    }
    files.forEach(file => {
        if (path_1.default.extname(file) === '.md') {
            fs_1.default.readFile(path_1.default.join(inputDir, file), 'utf8', (err, content) => {
                if (err) {
                    console.error(`Error reading file: ${err}`);
                    return;
                }
                let processedContent = processFile(content);
                processedContent = removeNewLines(processedContent);
                processedContent = wrapBSML(processedContent);
                processedContent = formatXML(processedContent);
                const outputFilename = path_1.default.join(outputDir, path_1.default.basename(file, '.md') + '.bsml');
                console.log(`Writing to ${outputFilename}...`);
                console.log(processedContent);
                fs_1.default.writeFile(outputFilename, processedContent, err => {
                    if (err) {
                        console.error(`Error writing file: ${err}`);
                    }
                });
            });
        }
    });
});
