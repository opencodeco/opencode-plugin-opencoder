/**
 * Version information module for opencoder
 */

/**
 * Version information structure
 */
export interface VersionInfo {
	opencoder: string
	bun: string
	sdk: string
	node: string
}

/**
 * Get OpenCoder version from package.json
 */
function getOpencodeVersion(): string {
	try {
		// Use dynamic import to read package.json
		const pkg = globalThis.require?.("../package.json") as { version?: string }
		return pkg?.version ?? "unknown"
	} catch {
		return "1.0.0" // Fallback to hardcoded version
	}
}

/**
 * Get Bun runtime version
 */
function getBunVersion(): string {
	try {
		// Access Bun.version - it's always a string at runtime
		const bunVersion = (Bun as { version: string }).version
		return bunVersion ?? "unknown"
	} catch {
		return "unknown"
	}
}

/**
 * Get OpenCode SDK version by checking node_modules
 */
function getSdkVersion(): string {
	try {
		// Try to require the SDK package.json
		const sdkPkg = globalThis.require?.("@opencode-ai/sdk/package.json") as {
			version?: string
		}
		return sdkPkg?.version ?? "unknown"
	} catch {
		return "unknown"
	}
}

/**
 * Get Node.js version for compatibility reference
 */
function getNodeVersion(): string {
	try {
		// Remove 'v' prefix from process.version
		const nodeVer = process.version
		return nodeVer.startsWith("v") ? nodeVer.substring(1) : nodeVer
	} catch {
		return "unknown"
	}
}

/**
 * Gather all version information
 */
export function getVersionInfo(): VersionInfo {
	return {
		opencoder: getOpencodeVersion(),
		bun: getBunVersion(),
		sdk: getSdkVersion(),
		node: getNodeVersion(),
	}
}

/**
 * Format version information for display
 */
export function formatVersionInfo(info: VersionInfo): string {
	return [
		`OpenCoder ${info.opencoder}`,
		`Bun ${info.bun}`,
		`OpenCode SDK ${info.sdk}`,
		`Node.js ${info.node} (compatibility reference)`,
	].join("\n")
}
