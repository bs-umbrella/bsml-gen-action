"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Rule = void 0;
class Rule {
    constructor(name, patterns) {
        this.name = name;
        this.patterns = patterns;
    }
    apply(raw) {
        return this.patterns.reduce((result, pattern) => pattern.apply(result), raw);
    }
}
exports.Rule = Rule;
