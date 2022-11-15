import { from, map, concatMap, filter, catchError, of } from "rxjs"
import { prop, identity } from "ramda"

import { Command } from "@tauri-apps/api/shell"
import { readDir, FileEntry, readTextFile } from "@tauri-apps/api/fs"

/** @see https://docs.jupyter.org/en/latest/use/jupyter-directories.html */
interface JupyterPaths {
  runtime: string[]
  config: string[]
  data: string[]
}

interface KernelSpecs {
  argv: string[]
  display_name: string
  language: string
  metadata: any
}

/**
 * Returns jupyter common directiories.
 */
const getJupyterCommonDirs = async (): Promise<JupyterPaths> => {
  const output = await new Command("jupyter", ["--paths", "--json"]).execute()
  return JSON.parse(output.stdout)
}

/**
 * Needed to allow ts narrow type in the filter func.
 */
const isFileEntryExists = (entry: FileEntry | null): entry is FileEntry =>
  !!entry

/**
 * Recursively finds specified file.
 */
const findFile = async (
  dir: string,
  file: string
): Promise<FileEntry | null> => {
  let foundFile: FileEntry | undefined

  try {
    const dirEntries = await readDir(dir)

    foundFile = dirEntries.find((fileEntry) => fileEntry.name === file)
    if (foundFile) return foundFile

    const entries = await Promise.all(
      dirEntries.map((entry) => findFile(entry.path, file))
    )

    foundFile = entries
      .filter(isFileEntryExists)
      .find((entry) => entry.name === file)
  } catch (e) {
    // FIXME There is always occurs "Not a directory (os error 20)" error, it doesn't break the programm.
    // IDK how to check if path is a directory or a file :_)
    console.log(e)
  }

  return foundFile || null
}

const kernelSpecsObs = from(getJupyterCommonDirs()).pipe(

  map(prop("data")),
  concatMap((dirs) => dirs ? dirs
            .map((dir) => findFile(dir, "kernel.json") : throw new Error)),
  // wait until promises will be resolved
  concatMap(identity),
  filter(isFileEntryExists),
  map((specsJSON) => readTextFile(specsJSON.path)),
  concatMap(identity),
  map<string, KernelSpecs>((jsonStr) => JSON.parse(jsonStr)),
  catchError((err) => {
      console.log(err)
      return of({})
  })
)
kernelSpecsObs.subscribe(console.log)
