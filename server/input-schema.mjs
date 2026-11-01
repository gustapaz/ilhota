export const inputSchema = {
  type: "object",
  additionalProperties: false,
  required: ["seed", "sea", "roughness", "from", "to"],
  properties: {
    seed: { type: "integer", minimum: 1, maximum: 9999 },
    sea: { type: "number", minimum: 0.1, maximum: 0.7 },
    roughness: { type: "number", minimum: 0, maximum: 1 },
    from: { type: "integer", minimum: 0, maximum: 575 },
    to: { type: "integer", minimum: 0, maximum: 575 },
  },
};
