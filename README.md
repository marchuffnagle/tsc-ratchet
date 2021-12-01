# tsc-ratchet

## Overview

When you first introduce [TypeScript](https://www.typescriptlang.org/) on a project, the number of reported errors can be overwhelming. Fixing all of them at once is often not realistic. `tsc-ratchet` aims to help you make incremental improvement toward improving your TypeScript code.

`tsc-ratchet` keeps track of how many TypeScript errors are being reported. This is the "high water mark", the number of reported errors that can't be exceeded. When you call `npm run lint:tsc`, it compares the current number of errors reported with the high water mark.

- If the number of errors have increased, it returns a failure status.
- If the number of errors has stayed the same, it returns a success status.
- If the number of errors has decreased, it stores that new number as the new high water mark and reports success. It essentially "ratchets down" the number of permitted errors.
- If running in CI mode (`CI` environment variable is "true"), and the number of reported errors is less than the high water mark, it returns a failure status. If this is the case, the high water mark value needs to be updated and committed to git.

## Usage

- Copy [bin/tsc-ratchet.sh](bin/tsc-ratchet.sh) into your project's `bin/` directory
- Add the `lint`, `lint:tsc`, and `lint:tsc:ci` scripts from [package.json](package.json) into your project's `package.json` file
- Update your CI scripts to run `npm run lint:tsc:ci`
- After making chagnes and before committing, execute `npm run lint:tsc`. If you have reduced the number of linter errors, the [.tsc-ratchet](.tsc-ratchet) file will have been updated with the new high water mark. Include that `.tsc-ratchet` file in your commit.

## Credits

This project is inspired by the [quality](https://rubygems.org/gems/quality) Ruby gem.
