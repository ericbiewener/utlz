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

export function readDirFilesSync(dir: string) {
  const items = []

  for (const name of fs.readdirSync(dir)) {
    const filepath = path.join(dir, name)
    if (!isFile(filepath) || name === '.DS_Store') continue
    items.push({ filename: name, filepath })
  }

  return items
}

export function defaultSpawnSync(
  cmd: string,
  args: string[],
  options: SpawnSyncOptionsWithStringEncoding
) {
  const { error, stderr, stdout } = spawnSync(cmd, args, options)
  if (error) throw error
  if (stderr) throw new Error(stderr.toString())
  return JSON.parse(stdout.toString())
}
