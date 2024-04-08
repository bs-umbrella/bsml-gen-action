import { getInput } from '@actions/core';
import fs from 'fs';
import path from 'path';
import { Rule } from './Rule';
import { Pattern } from './Pattern';
import xmlFormat from 'xml-formatter';

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

const BSMLGenRules: Rule[] = [
    new Rule('escape', [
      new Pattern(/(<)/g, '&lt;'),
      new Pattern(/(>)/g, '&gt;'),
      new Pattern(/(&)/g, '&amp;'),
      new Pattern(/(')/g, '&apos;'),
      new Pattern(/(")/g, '&quot;'),
    ]),
    new Rule('header', [
      new Pattern(/^#{4}\s?([^\n]+)/gm, '<text font-size="5" text="$1"/>'),
      new Pattern(/^#{3}\s?([^\n]+)/gm, '<text font-size="6" text="$1"/>'),
      new Pattern(/^#{2}\s?([^\n]+)/gm, '<text font-size="7" text="$1"/>'),
      new Pattern(/^#{1}\s?([^\n]+)/gm, '<text font-size="8" text="$1"/>'),
    ]),
    new Rule('list', [
      new Pattern(/\* \s?([^\n]+)/g, ':$1'), //bullet list
      new Pattern(/\- \s?([^\n]+)/g, ':$1'), 
      new Pattern(/\ - \s?([^\n]+)/g, '  :$1'),
      new Pattern(/\  - \s?([^\n]+)/g, '    :$1'),
      new Pattern(/\   - \s?([^\n]+)/g, '      :$1'),
      new Pattern(/\    - \s?([^\n]+)/g, '        :$1'),
    ]),
    new Rule('add-space', [
      new Pattern(/^\n/gm, '<bg bg="panel-top" pref-height="5" bg-alpha="0" bg-color="00000000"/>\n'),
    ]),
    new Rule('color', [
      new Pattern(/\[color="([^"]+)"\]\(([^)]+)\)/g, '<text color="$1" text="$2"/>'),
    ]),
    new Rule('image', [
      new Pattern(/\!\[([^\]]+)\]\((\S+)\)/g, '<img src="$2" hover-hint="$1"/>'),
    ]),
    new Rule('bsml-link', [
      new Pattern(
        /\[([^\n]+)\]\(([^\n]+bsml)\)/g,
        '<open-page-text text="$1" url="$2" open-in-browser="true"/>'
      ),
    ]),
    new Rule('weblink', [
      new Pattern(
        /\[([^\n]+)\]\(([^\n]+)\)/g,
        '<open-page-text text="$1" url="$2" open-in-browser="true"/>'
      ),
    ]),
    new Rule('paragraph', [
      new Pattern(/^(?!<)^(.+)$/gm, '<text font-size="4" text="$1"/>'),
    ]),
    new Rule('bold', [
      new Pattern(/\*\*\s?([^\n]+)\*\*/g, '&lt;b&gt;$1&lt;/b&gt;'),
    ]),
    new Rule('underline', [
      new Pattern(/\_\_\s?([^\n]+)\_\_/g, '&lt;u&gt;$1&lt;/u&gt;'),
    ]),
    new Rule('italic', [
      new Pattern(/\*\s?([^\n]+)\*/g, '&lt;i&gt;$1&lt;/i&gt;'),
      new Pattern(/\_\s?([^\n]+)\_/g, '&lt;i&gt;$1&lt;/i&gt;'),
    ]),
    new Rule('strikethrough', [
      new Pattern(/\-\-\s?([^\n]+)\-\-/g, '&lt;s&gt;$1&lt;/s&gt;'),
    ]),
  ];


function processFile(content: string): string {
    // Process the content and return it
    BSMLGenRules.forEach(rule => {
        content = rule.apply(content);
    });
    return content;
}

function removeNewLines(content: string): string {
    return content.replace(/\n/g, '');
}

function formatXML(content: string): string {
    return xmlFormat(content);
}

function wrapBSML(content: string): string {
    return "<bg xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' xsi:schemaLocation='https://monkeymanboy.github.io/BSML-Docs/ https://raw.githubusercontent.com/monkeymanboy/BSML-Docs/gh-pages/BSMLSchema.xsd'><vertical>" + content + "</vertical></document>";
}

const inputDir = getInput('input-dir');
const outputDir = getInput('output-dir');

console.log(`Starting workflow... exporting to ${inputDir}!`);

fs.readdir(inputDir, (err, files) => {
    if (err) {
        console.error(`Error reading directory: ${err}`);
        return;
    }

    files.forEach(file => {
        if (path.extname(file) === '.md') {
            fs.readFile(path.join(inputDir, file), 'utf8', (err, content) => {
                if (err) {
                    console.error(`Error reading file: ${err}`);
                    return;
                }

                let processedContent = processFile(content);
                processedContent = removeNewLines(processedContent);
                processedContent = wrapBSML(processedContent);
                processedContent = formatXML(processedContent);

                const outputFilename = path.join(outputDir, path.basename(file, '.md') + '.bsml');

                console.log(`Writing to ${outputFilename}...`);
                console.log(processedContent);

                fs.writeFile(outputFilename, processedContent, err => {
                    if (err) {
                        console.error(`Error writing file: ${err}`);
                    }
                });
            });
        }
    });
});