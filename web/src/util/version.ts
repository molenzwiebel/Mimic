/**
 * Very simple semver-ish implementation of the Conduit version
 * so we can perform some checks based on its version.
 */
export default class Version {
    public readonly major: number;
    public readonly minor: number;
    public readonly patch: number;

    constructor(version: string) {
        const [major, minor, patch] = version.split(".");

        this.major = +major;
        this.minor = +minor;
        this.patch = +patch;
    }

    greaterThan(major: number, minor: number, patch: number): boolean {
        return this.major > major || this.minor > minor || this.patch > patch;
    }
}