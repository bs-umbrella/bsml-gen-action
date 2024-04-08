"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Pattern = void 0;
class Pattern {
    constructor(regex, replacement) {
        this.regex = regex;
        this.replacement = replacement;
    }
    apply(raw) {
        return raw.replace(this.regex, this.replacement);
    }
}
exports.Pattern = Pattern;
