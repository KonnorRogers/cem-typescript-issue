# Purpose

CEM bug reproduction for using TypeScript + JSDoc.

## Installation

```
git clone https://github.com/konnorrogers/cem-typescript-issue
cd cem-typescript-issue
npm install
npm run analyze
# check custom-elements.json
```

## Explanation

There are 3 scenarios when `custom-elements.json` fails to generate, and 1 scenario where it
properly generates.

### Success

- `dependencies: false`, no override on module creation. No error messages.

### Failures

Failures are defined as an empty `custom-elements.json`

1. `dependencies: true`, No override on module creation. The `custom-elements.json` appears correctly, but the console has an error about resolution.
1. `dependencies: false`, `overrideModuleCreation` set to `ts.createProgram`. Says successfully created and no error message, but the `custom-elements.json` is empty.
1. `dependencies: true`, `overrideModuleCreation` set to `ts.createProgram`. Says successfully created, has an error message, and the `custom-elements.json` is empty.

## Extras

`node doc-generator.js` is a typescript program showing its resolving properly.
