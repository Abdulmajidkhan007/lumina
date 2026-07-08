/**
 * Global runtime declarations not covered by the React Native TS lib.
 * Hermes (RN 0.74+) provides btoa/atob natively.
 */

declare function btoa(data: string): string;
declare function atob(data: string): string;
