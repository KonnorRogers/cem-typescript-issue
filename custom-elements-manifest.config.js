// @ts-check

export default {
  /** Globs to analyze */
  globs: ['./exports/**/*.js', './internal/**/*.js'],
  /** Globs to exclude */
  // exclude: ['./node_modules', './docs'],
  /** Directory to output CEM to */
  outdir: '.',
  /** Run in dev mode, provides extra logging */
  dev: process.argv.includes("--verbose"),
  /** Run in watch mode, runs on file changes */
  watch: process.argv.includes("--watch"),
  /** Include third party custom elements manifests */
  // Change to false and it works fine.
  dependencies: false,
  /** Output CEM path to `package.json`, defaults to true */
  packagejson: true,
  /** Enable special handling for litelement */
  litelement: false,
  /** Enable special handling for catalyst */
  catalyst: false,
  /** Enable special handling for fast */
  fast: false,
  /** Enable special handling for stencil */
  stencil: false,
  /** Provide custom plugins */
  plugins: [
  ],

  overrideModuleCreation: ({ts, globs}) => {
    const configPath = ts.findConfigFile(
      process.cwd(),
      ts.sys.fileExists,
      "tsconfig.json"
    );

    if (!configPath) throw "No tsconfig found."

    const { config } = ts.readConfigFile(configPath, ts.sys.readFile);
    const program = ts.createProgram(globs, {...config, rootDir: process.cwd() });

    const typeChecker = program.getTypeChecker()
    return program
      .getSourceFiles()
      .filter((sf) => globs.find((glob) => {
        return sf.fileName.includes(glob)
      }))
  },
}
