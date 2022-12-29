#!/bin/bash

set -e

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm

for x in test/node-*; do
  (
    cd "$x"

    rm -rf node_modules package-lock.json
    nvm install
    nvm use
    npm i

    mkdir -p src
    cat > src/test.ts <<EOS
import { add } from 'my-lib';
const x: string = 123;
const y: number = '123';
const z = add(1, 2);
EOS

    # No .tsc-ratchet file

    rm -f .tsc-ratchet

    npx tsc-ratchet || exit 1

    HWM=$(< .tsc-ratchet)
    [ "$HWM" -eq "6" ] || exit 1

    # Errors increase

    echo 1 > .tsc-ratchet

    set +e
    npx tsc-ratchet
    STATUS="$?"
    set -e
    [ "$STATUS" -eq "1" ] || exit 1

    # Errors decrease

    echo 7 > .tsc-ratchet

    npx tsc-ratchet || exit 1

    HWM=$(< .tsc-ratchet)
    [ "$HWM" -eq "6" ] || exit 1

    # Errors decrease with CI=true

    echo 7 > .tsc-ratchet

    set +e
    env CI=true npx tsc-ratchet
    STATUS="$?"
    set -e
    [ "$STATUS" -eq "1" ] || exit 1

    # TS7016 lines do not include a path

    TS7016_LINE=`grep TS7016 .tsc-ratchet.log`
    
    set +e
    echo "$TS7016_LINE" | grep 'implicitly has an'
    STATUS="$?"
    set -e
    [ "$STATUS" -eq "1" ] || exit 1
  )
done

nvm use
