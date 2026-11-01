import { inputSchema } from "./input-schema.mjs";
import { fail } from "./errors.mjs";
import { z } from "zod";
function convert(s) {
  let r;
  if (s.enum) r = z.enum(s.enum);
  else if (s.type === "object")
    return z
      .object(
        Object.fromEntries(
          Object.entries(s.properties).map(([k, v]) => [k, convert(v)]),
        ),
      )
      .strict();
  else if (s.type === "array") {
    r = z.array(convert(s.items));
    if (s.minItems !== undefined) r = r.min(s.minItems);
    if (s.maxItems !== undefined) r = r.max(s.maxItems);
    if (s.uniqueItems) r = r.refine((v) => new Set(v).size === v.length);
    return r;
  } else if (s.type === "boolean") return z.boolean();
  else if (s.type === "string") {
    r = z.string();
    if (s.minLength !== undefined) r = r.min(s.minLength);
    if (s.maxLength !== undefined) r = r.max(s.maxLength);
    if (s.pattern) r = r.regex(new RegExp(s.pattern));
    return r;
  } else {
    r = z.number().finite();
    if (s.type === "integer") r = r.int();
    if (s.minimum !== undefined) r = r.min(s.minimum);
    if (s.maximum !== undefined) r = r.max(s.maximum);
  }
  return r;
}
export const schema = convert(inputSchema);
export function validateInput(input) {
  const r = schema.safeParse(input);
  if (!r.success)
    fail("invalid_input", "Confira tipos, limites e campos dos parâmetros.");
  return r.data;
}
