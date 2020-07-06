import execa from 'execa'
import fs from 'fs'
import path from 'path'
import { spawnSync, SpawnSyncOptionsWithStringEncoding } from 'child_process'

export function sleep<T = void>(ms: number = 0, value?: T): Promise<T> {
  return new Promise(resolve => setTimeout(() => resolve(value), ms))
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

export const writeFileIfNew = (filepath: string, data: string = '') => {
  if (isFile(filepath)) return false
  fs.writeFileSync(filepath, data)
  return true
}
