export class Pattern {
    constructor(public regex: RegExp, public replacement: string) {}
  
    apply(raw: string): string {
      return raw.replace(this.regex, this.replacement);
    }
  }