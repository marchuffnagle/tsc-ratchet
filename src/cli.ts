#!/usr/bin/env node
import tscRatchet from '.';
import { isError } from './utils';

(async () => {
  const result = await tscRatchet();

  if (isError(result)) {
    console.error(result.message);
    process.exitCode = 1;
  }
})();
