import execa from 'execa'
import fs from 'fs'
import path from 'path'
import { spawnSync, SpawnSyncOptionsWithStringEncoding } from 'child_process'

export function sleep<T = void>(ms = 0, value?: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms))
}

export function isFile(filepath: string) {
  try {
    return fs.statSync(filepath).isFile()
  } catch (e) {
    if (e.code !== 'ENOENT') throw e // File might exist, but something else went wrong (e.g. permissions error)
    return false
  }
}

export type ReadDirSyncResult = { name: string; itemPath: string; isFile: boolean }

export function readDirSync(dir: string): ReadDirSyncResult[] {
  const items = []

  for (const name of fs.readdirSync(dir)) {
    if (name === '.DS_Store') continue
    const itemPath = path.join(dir, name)
    items.push({ name, itemPath, isFile: isFile(itemPath) })
  }

  return items
}

export function defaultSpawnSync(
  cmd: string,
  args: string[],
  options?: SpawnSyncOptionsWithStringEncoding,
) {
  const { error, stderr, stdout } = spawnSync(cmd, args, options)
  if (error) throw error
  const stderrStr = stderr.toString()
  if (stderrStr) throw new Error(stderrStr)
  return stdout.toString()
}

export function removeFileExt(filepath: string, extensions?: string[]) {
  const ext = path.extname(filepath)
  if (!ext) return filepath
  return !extensions || extensions.includes(ext.slice(1))
    ? filepath.slice(0, -ext.length)
    : filepath
}

export function findFileForExtensions(filepath: string, extensions: string[]) {
  const filepathRoot = removeFileExt(filepath)
  for (const ext of extensions) {
    const newPath = `${filepathRoot}.${ext}`
    if (isFile(newPath)) return newPath
  }
}

export function runCmd(cmd: string, args: string[], options?: execa.SyncOptions<null>) {
  try {
    const { stdout } = execa.sync(cmd, args.filter(Boolean), {
      stdio: 'inherit',
      ...options,
    })
    return stdout
  } catch (e) {
    // Catch the error so that we don't have to see the JS stack trace. The executed command will
    // have had its own output.
    process.exit(1)
  }
}

export const createDir = (dirpath: string, options?: fs.MakeDirectoryOptions) => {
  try {
    fs.mkdirSync(dirpath, { recursive: true, ...options })
  } catch (e) {
    if (e.code !== 'EEXIST') throw e
    return false
  }

  return true
}

export const writeFileIfNew = (filepath: string, data = '') => {
  if (isFile(filepath)) return false
  fs.writeFileSync(filepath, data)
  return true
}

class ErrorWithData<D> extends Error {
  name = 'ErrorWithData'
  data: D | undefined

  constructor(message: string, data?: D) {
    super(message)
    this.data = data
  }
}
/**
 * Capture stdout & stderr in variables, while also allowing it to flow through to the parent
 * process's stdout (e.g. a terminal window).
 *
 * Also provides some sensible error handling. Will throw if there is any stderr.
 */
export const exe = async (
  cmd: string,
  args: Record<string, string | null>,
  options?: execa.SyncOptions<null>,
) => {
  const argsArray = []
  for (const k in args) {
    if (k != null) argsArray.push(k, args[k])
  }

  const child = execa(cmd, argsArray, {
    ...options,
    stdio: 'pipe',
  })

  // Catch the error and exit the process. This is an irrecoverable crash.
  child.on('error', (e) => {
    console.error(`CRASH: ${e.message}`)
    process.exit(1)
  })

  // Let the ouput flow through to the main process's stdout
  child.stdout.pipe(process.stdout)
  child.stderr.pipe(process.stderr)

  let stdout = ''
  let stderr = ''

  child.stdout.on('data', (buffer) => {
    stdout += buffer.toString()
  })

  child.stderr.on('data', (buffer) => {
    stderr += buffer.toString()
  })

  // Wait for both stdout and stderr to close
  await Promise.all([
    new Promise((res) => child.stdout.on('close', res)),
    new Promise((res) => child.stderr.on('close', res)),
  ])

  if (stderr) throw new ErrorWithData('stderr has data', { stdout, stderr })
  return stdout
}
