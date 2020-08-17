"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tmpDir = void 0;
const tslib_1 = require("tslib");
const fs = tslib_1.__importStar(require("fs-jetpack"));
const os = tslib_1.__importStar(require("os"));
const fs_1 = require("../fs");
const compose_create_1 = require("./compose-create");
exports.tmpDir = (opts) => compose_create_1.createContributor(() => {
    // Huge hack to force the tmpdir to be in its "long" form in the GH CI for windows
    const baseTmpDir = process.env.CI !== undefined && os.platform() === 'win32' ?
        'C:\\Users\\runneradmin\\AppData\\Local\\Temp' : undefined;
    const tmpDir = fs_1.getTmpDir(opts === null || opts === void 0 ? void 0 : opts.prefix, baseTmpDir);
    fs.dir(tmpDir);
    return { tmpDir };
});
//# sourceMappingURL=tmp-dir.js.map