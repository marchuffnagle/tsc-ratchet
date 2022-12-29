# tsc-ratchet

Adding [TypeScript](https://www.typescriptlang.org/) to a project can be an overwhelming task. A large codebase can have thousands of errors reported by the TypeScript compiler. That's where tsc-ratchet comes in. Instead of fixing everything at once, tsc-ratchet helps ensure that things get better over time.

When you first run tsc-ratchet , it counts the number of errors reported by `tsc` and records that as the "high water mark".

If the number of reported errors increases, then tsc-ratchet will fail and report how many new errors have been discovered.

When the number of reported errors _decreases_, tsc-ratchet records that as the new high water mark, and that lower number is now your upper limit. As time goes on, that limit should approach zero.

If you find this utility useful, you may also be interested in [eslint-ratchet](https://www.npmjs.com/package/eslint-ratchet).

## Install

```sh
npm install --save-dev tsc-ratchet
```

## Usage

These instructions assume that you already have TypeScript configured for your project.

Run tsc-ratchet with:

```sh
$ npx tsc-ratchet
New tsc-ratchet high water mark: 123
```

The first time you run, the number of reported errors will be written to a `.tsc-ratchet` file. Another file called `.tsc-ratchet.log` will be created that contains the list of errors reported by `tsc`. These two files should be added to your git repository.

Once you've fixed some TypeScript errors, run again.

```sh
$ npx tsc-ratchet
tsc errors decreased from 123 to 101.
```

At this point, 101 is your new high water mark.

If you introduce new errors, then tsc-ratchet will fail and report the increase.

```sh
$ npx tsc-ratchet
tsc errors increased from 101 to 105.
>> 1
```

The `.tsc-ratchet.log` file is helpful for determining where you've introduced new errors. Using git diff, you can get an idea of where the new errors are. (Note that the errors stored in the log file don't contain line numbers. Because code changes often result in line number changes, including the line numbers of the errors makes the diff much harder to read.)

When you're happy with the changes you've made, make sure to include `.tsc-ratchet` and `.tsc-ratchet.log` in your commit.

## CI mode

When the `CI` environment variable is set to `"true"`, tsc-ratchet will require that the number of reported errors _exactly_ match the value stored in `.tsc-ratchet`. If fewer errors are reported, that's an indication that you probably reduced the number of errors but forgot to commit your updated `.tsc-ratchet` file.

## Credits

The idea for tsc-ratchet came from the excellent [quality](https://rubygems.org/gems/quality) Ruby gem.
