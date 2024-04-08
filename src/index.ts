import { getInput } from '@actions/core';
import fs from 'fs';
import path from 'path';
import { Rule } from './Rule';
import { Pattern } from './Pattern';

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
    new Rule('header', [
      new Pattern(/^#{4}\s?([^\n]+)/gm, '<text font-size="5" text="$1"/>'),
      new Pattern(/^#{3}\s?([^\n]+)/gm, '<text font-size="6" text="$1"/>'),
      new Pattern(/^#{2}\s?([^\n]+)/gm, '<text font-size="7" text="$1"/>'),
      new Pattern(/^#{1}\s?([^\n]+)/gm, '<text font-size="8" text="$1"/>'),
    ]),
    new Rule('bold', [
      new Pattern(/\*\*\s?([^\n]+)\*\*/g, '<b>$1</b>'),
      new Pattern(/\_\_\s?([^\n]+)\_\_/g, '<b>$1</b>'),
    ]),
    new Rule('italic', [
      new Pattern(/\*\s?([^\n]+)\*/g, '<i>$1</i>'),
      new Pattern(/\_\s?([^\n]+)\_/g, '<i>$1</i>'),
    ]),
    new Rule('image', [
      new Pattern(/\!\[([^\]]+)\]\((\S+)\)/g, '<img src="$2" hover-hint="$1" />'),
    ]),
    new Rule('link', [
      new Pattern(
        /\[([^\n]+)\]\(([^\n]+)\)/g,
        '<open-page-text url="$2" open-in-browser="true">$1</open-page-text>'
      ),
    ]),
    new Rule('paragraph', [
      new Pattern(/([^\n]+\n?)/g, '\n<text font-size="4" text="$1"/>\n'),
    ]),
  ];


function processFile(content: string): string {
    // Process the content and return it
    BSMLGenRules.forEach(rule => {
        content = rule.apply(content);
    });
    return content;
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

                const processedContent = processFile(content);
                const outputFilename = path.join(outputDir, path.basename(file, '.md') + '.bsml');

                fs.writeFile(outputFilename, processedContent, err => {
                    if (err) {
                        console.error(`Error writing file: ${err}`);
                    }
                });
            });
        }
    });
});