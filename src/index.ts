import { exec } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { promisify } from 'node:util';
import { isError } from './utils';

const pExec = promisify(exec);

const isErrorWithCode = (x: unknown): x is Error & { code: string } =>
  isError(x) && 'code' in x;

const parseCaughtError = (x: unknown) => isError(x) ? x : new Error(`${x}`);

const getHighWaterMark = async () => {
  try {
    const ratchetFileText = await readFile('.tsc-ratchet', 'utf8');

    const trimmedText = ratchetFileText.trim();

    const highWaterMark = Number.parseInt(trimmedText, 10);

    return Number.isNaN(highWaterMark)
      ? new Error(`.tsc-ratchet contained invalid integer: ${trimmedText}`)
      : highWaterMark;
  } catch (error) {
    return isErrorWithCode(error) && error.code === 'ENOENT'
      ? undefined
      : parseCaughtError(error);
  }
}

const writeHighWaterMark = async (highWaterMark: number) =>
  writeFile('.tsc-ratchet', `${highWaterMark}`, 'utf8')
    .then(() => undefined)
    .catch(parseCaughtError);

const cleanDecNotFoundError = (line: string) => {
  if (!line.includes('TS7016')) return line;
  const [shortError] = line.split('. ');
  return shortError ? `${shortError}.` : line;
}

const writeTscErrorsLog = async (tscErrors: string[]) => {
  const errorsLog = tscErrors
    .map((e) => e.replace(/\(\d+,\d+\)/, ''))
    .map(cleanDecNotFoundError)
    .join('\n');

  return writeFile('.tsc-ratchet.log', errorsLog, 'utf8')
    .then(() => undefined)
    .catch(parseCaughtError);
}

interface ExecError {
  code: number
  stdout: string
}

const isExecError = (x: unknown): x is Error & ExecError =>
  isError(x) && 'code' in x && 'stdout' in x;

const handleTscError = (error: unknown) => {
  if (isExecError(error)) {
    return error.stdout
      .split('\n')
      .filter((line) => line.includes('error TS'))
      .map((line) => line.trim());
  }

  return parseCaughtError(error)
}

const getTscErrors = (): Promise<string[] | Error> =>
  pExec('tsc --noEmit')
    .then(() => [])
    .catch(handleTscError);

export const tscRatchet = async () => {
  const highWaterMark = await getHighWaterMark();
  if (isError(highWaterMark)) return highWaterMark;

  const tscErrors = await getTscErrors();
  if (isError(tscErrors)) return tscErrors;

  const writeLogResult = await writeTscErrorsLog(tscErrors);
  if (isError(writeLogResult)) return writeLogResult;

  const tscErrorsCount = tscErrors.length;

  if (highWaterMark === undefined) {
    console.log(`New tsc-ratchet high water mark: ${tscErrorsCount}`);
    return await writeHighWaterMark(tscErrorsCount);
  }

  if (tscErrorsCount > highWaterMark) {
    return new Error(
      `tsc errors increased from ${highWaterMark} to ${tscErrorsCount}.`
    );
  }

  if (tscErrorsCount < highWaterMark && process.env['CI'] === 'true') {
    return new Error(
      'tsc error count has decreased but .tsc-ratchet not updated.'
    );
  }

  if (tscErrorsCount < highWaterMark) {
    console.log(
      `tsc errors decreased from ${highWaterMark} to ${tscErrorsCount}.`
    );
    return await writeHighWaterMark(tscErrorsCount);
  }

  return undefined;
};

export default tscRatchet;
