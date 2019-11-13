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

export function readDirSync(dir: string) {
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
