"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const rxjs_1 = require("rxjs");
const ramda_1 = require("ramda");
const shell_1 = require("@tauri-apps/api/shell");
const fs_1 = require("@tauri-apps/api/fs");
/**
 * Returns jupyter common directiories.
 */
const getJupyterCommonDirs = () => __awaiter(void 0, void 0, void 0, function* () {
    const output = yield new shell_1.Command("jupyter", ["--paths", "--json"]).execute();
    return JSON.parse(output.stdout);
});
/**
 * Needed to allow ts narrow type in the filter func.
 */
const isFileEntryExists = (entry) => !!entry;
/**
 * Recursively finds specified file.
 */
const findFile = (dir, file) => __awaiter(void 0, void 0, void 0, function* () {
    let foundFile;
    try {
        const dirEntries = yield (0, fs_1.readDir)(dir);
        foundFile = dirEntries.find((fileEntry) => fileEntry.name === file);
        if (foundFile)
            return foundFile;
        const entries = yield Promise.all(dirEntries.map((entry) => findFile(entry.path, file)));
        foundFile = entries
            .filter(isFileEntryExists)
            .find((entry) => entry.name === file);
    }
    catch (e) {
        // FIXME There is always occurs "Not a directory (os error 20)" error, it doesn't break the programm.
        // IDK how to check if path is a directory or a file :_)
        console.log(e);
    }
    return foundFile || null;
});
const kernelSpecsObs = (0, rxjs_1.from)(getJupyterCommonDirs()).pipe((0, rxjs_1.map)((0, ramda_1.prop)("data")), (0, rxjs_1.concatMap)((dirs) => dirs.map((dir) => findFile(dir, "kernel.json"))), 
// wait until promises will be resolved
(0, rxjs_1.concatMap)(ramda_1.identity), (0, rxjs_1.filter)(isFileEntryExists), (0, rxjs_1.map)((specsJSON) => (0, fs_1.readTextFile)(specsJSON.path)), (0, rxjs_1.concatMap)(ramda_1.identity), (0, rxjs_1.map)((jsonStr) => JSON.parse(jsonStr)));
kernelSpecsObs.subscribe(console.log);
