import * as fs from 'fs-jetpack';
import * as os from 'os';
import { getTmpDir } from '../fs';
import { createContributor } from './compose-create';
export const tmpDir = (opts) => createContributor(() => {
    // Huge hack to force the tmpdir to be in its "long" form in the GH CI for windows
    const baseTmpDir = process.env.CI !== undefined && os.platform() === 'win32' ?
        'C:\\Users\\runneradmin\\AppData\\Local\\Temp' : undefined;
    const tmpDir = getTmpDir(opts === null || opts === void 0 ? void 0 : opts.prefix, baseTmpDir);
    fs.dir(tmpDir);
    return { tmpDir };
});
//# sourceMappingURL=tmp-dir.js.map