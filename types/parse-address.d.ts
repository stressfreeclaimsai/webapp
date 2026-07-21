// Ambient declaration for the untyped `parse-address` package (B20).
declare module "parse-address" {
  export interface ParsedAddress {
    number?: string;
    prefix?: string;
    street?: string;
    type?: string;
    suffix?: string;
    city?: string;
    state?: string;
    zip?: string;
    sec_unit_type?: string;
    sec_unit_num?: string;
  }
  export function parseLocation(address: string): ParsedAddress | null | undefined;
}
