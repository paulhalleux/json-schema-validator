export type JSONSchemaTypeName =
  | "null"
  | "boolean"
  | "object"
  | "array"
  | "number"
  | "string"
  | "integer"
  | (string & {});

export type JSONSchemaType = JSONSchemaTypeName | JSONSchemaTypeName[];

export type JSONSchemaDefinition = boolean | JSONSchema;

export interface JSONSchema {
  // Core identifiers
  $id?: string;
  $schema?: string;
  $ref?: string;
  $anchor?: string;
  $dynamicRef?: string;
  $dynamicAnchor?: string;
  $defs?: Record<string, JSONSchemaDefinition>; // Replaces `definitions`

  // Type
  type?: JSONSchemaType;
  enum?: any[];
  const?: any;

  // Numbers
  multipleOf?: number;
  maximum?: number;
  exclusiveMaximum?: number;
  minimum?: number;
  exclusiveMinimum?: number;

  // Strings
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  format?: string; // Not enforced by core; left to implementation

  // Arrays
  items?: JSONSchemaDefinition | JSONSchemaDefinition[];
  additionalItems?: JSONSchemaDefinition; // Legacy; 2020-12 replaces this with `prefixItems`
  prefixItems?: JSONSchemaDefinition[]; // New in 2020-12
  contains?: JSONSchemaDefinition;
  minItems?: number;
  maxItems?: number;
  uniqueItems?: boolean;
  minContains?: number;
  maxContains?: number;

  // Objects
  properties?: Record<string, JSONSchemaDefinition>;
  patternProperties?: Record<string, JSONSchemaDefinition>;
  additionalProperties?: JSONSchemaDefinition;
  propertyNames?: JSONSchemaDefinition;
  required?: string[];
  minProperties?: number;
  maxProperties?: number;
  dependentSchemas?: Record<string, JSONSchemaDefinition>; // replaces `dependencies` in 2020-12
  dependentRequired?: Record<string, string[]>;

  // Logic
  allOf?: JSONSchemaDefinition[];
  anyOf?: JSONSchemaDefinition[];
  oneOf?: JSONSchemaDefinition[];
  not?: JSONSchemaDefinition;
  if?: JSONSchemaDefinition;
  then?: JSONSchemaDefinition;
  else?: JSONSchemaDefinition;

  // Unevaluated (2020-12)
  unevaluatedItems?: JSONSchemaDefinition;
  unevaluatedProperties?: JSONSchemaDefinition;

  // Metadata
  title?: string;
  description?: string;
  default?: any;
  deprecated?: boolean;
  readOnly?: boolean;
  writeOnly?: boolean;
  examples?: any[];

  // Extensions / Forward compatibility
  [key: string]: any;
}
