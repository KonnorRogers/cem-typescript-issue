// @ts-check

// This file is just to show TS is working as intended at top level of directory.
import ts from "typescript";
import { globSync } from "glob";
import * as fs from "fs";
import path from "path";

/**
 * @typedef {Array<string | TypeArray>} TypeArray
 */

/** @typedef {{
  name?: string;
  fileName?: string;
  documentation?: string;
  type?: string;
  constructors?: DocEntry[];
  parameters?: DocEntry[];
  returnType?: string;
}} DocEntry */

function generateDocumentation () {
  const configPath = ts.findConfigFile(
    /*searchPath*/ "./",
    ts.sys.fileExists,
    "tsconfig.json"
  );


  if (!configPath) throw "No tsconfig found."

  const { config } = ts.readConfigFile(configPath, ts.sys.readFile);

  console.log(config)
  // Prepare and emit the d.ts files
  const rootNames = globSync(["./{internal,exports}/**/*.js", "./types/**/*.d.ts"])

  let program = ts.createProgram(rootNames, config)

  // relative to your root
  const checker = program.getTypeChecker();

  const sourceFiles = new Map()

  for (const sourceFile of program.getSourceFiles()) {
    /** @type {TypeArray} */
    const types = []

    // Walk the tree to search for classes
    ts.forEachChild(sourceFile, (node) => processNode(node, types))

    sourceFiles.set(sourceFile.fileName, types)
  }

  fs.writeFileSync("./types.json", JSON.stringify(Object.fromEntries(sourceFiles), null, 2))

  /**
   * @param {ts.Node} node
   * @param {TypeArray} types
   */
  function processNode (node, types) {
    if (ts.isTypeAliasDeclaration(node)) {
      const type = checker.getTypeAtLocation(node.name);
      processProperty(type, node)
    }
    ts.forEachChild(node, (node) => processNode(node, types))
  }

  /**
  * Typescript can help us to spot types from outside of our local source files
  * which we don't want to process like literals string (think of trim(), length etc) or entire classes like Date.
  * @param {ts.Symbol} symbol
  */
  function isTypeLocal(symbol) {
    const sourceFile = symbol?.valueDeclaration?.getSourceFile();

    const isStandardLibrary = !!sourceFile && program.isSourceFileDefaultLibrary(sourceFile)
    const isExternal = !!sourceFile && program.isSourceFileFromExternalLibrary(sourceFile);
    const hasDeclaration = !!symbol?.declarations?.[0];

    return !(isStandardLibrary || isExternal) && hasDeclaration;
  }

  /**
   * @param {ts.Type} type
   * @param {ts.Node} node
   * @param {number} [level=0]
   * @return {string}
   */
  function processProperty(type, node, level = 0) {
    if (!ts.isTypeAliasDeclaration(node)) return ""

    const group = []

    if (ts.isIntersectionTypeNode(node.type) || ts.isUnionTypeNode(node.type)) {
      const type = checker.getTypeAtLocation(node.type)

      if (type.isLiteral()) {
        return checker.typeToString(type)
      }

      let separator = ""

      if (type.isUnion() || type.isIntersection()) {
        if (type.isUnion()) separator = "|"
        if (type.isIntersection()) separator = "&"

        for (const t of type.types) {
          group.push(checker.typeToString(t))
        }
      }

      return group.join(` ${separator} `)
    }

    // Flattens objects
    const obj = {}

    for (const property of type.getProperties()) {
      const propertyType = checker.getTypeOfSymbolAtLocation(property, node);
      const propertySymbol = propertyType.getSymbol();
      const propertyTypeName = checker.typeToString(propertyType);

      /**
      * If it's a local type belonging to our sources we are interested in
      * further analysis, so we process all properties again like we did for the current given property.
      */
      if(propertySymbol && isTypeLocal(propertySymbol)) {
        const properties = processProperty(propertyType, node, level + 1)

        obj[property.name] = properties
      }else {
        group.push(property.name)
        obj[property.name] = propertyTypeName
      }
    }

    return JSON.stringify(obj, null, 2)
  }
}

generateDocumentation()
