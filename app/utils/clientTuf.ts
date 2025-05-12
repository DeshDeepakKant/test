import { RoleInfo } from './types';

/**
 * Load TUF metadata from a remote URL
 */
export async function loadTufDataClient(remoteUrl: string) {
    try {
        // Fetch timestamp.json to check if the repo is valid
        const timestampUrl = new URL('timestamp.json', remoteUrl).toString();
        const response = await fetch(timestampUrl);
        if (!response.ok) {
            return { roles: [], version: '0.1.0', error: `Failed to fetch timestamp.json: ${response.status}` };
        }

        // Fetch root.json for roles
        const rootUrl = new URL('root.json', remoteUrl).toString();
        const rootRes = await fetch(rootUrl);
        if (!rootRes.ok) {
            return { roles: [], version: '0.1.0', error: `Failed to fetch root.json: ${rootRes.status}` };
        }
        const rootData = await rootRes.json();

        // Extract roles and version
        const roles = rootData.signed?.roles || [];
        const version = rootData.signed?.version?.toString() || '0.1.0';

        return { roles, version, error: null };
    } catch (error) {
        return { roles: [], version: '0.1.0', error: error instanceof Error ? error.message : String(error) };
    }
}

/**
 * Get available root versions from a remote URL
 */
export async function getAvailableRootVersionsClient(remoteUrl: string) {
    const versions: { version: number, url: string }[] = [];
    
    // First try to get the current root.json
    try {
        const rootUrl = new URL('root.json', remoteUrl).toString();
        const res = await fetch(rootUrl);
        if (res.ok) {
            const data = await res.json();
            if (data.signed?.version) {
                versions.push({ version: data.signed.version, url: rootUrl });
            }
        }
    } catch (error) {
        console.error('Error fetching root.json:', error);
    }

    // Then try to get numbered versions
    for (let i = 1; i < 20; i++) {
        const url = new URL(`root.${i}.json`, remoteUrl).toString();
        try {
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                if (data.signed?.version) {
                    versions.push({ version: data.signed.version, url });
                }
            } else {
                break; // Stop if not found
            }
        } catch {
            break;
        }
    }

    return versions.sort((a, b) => a.version - b.version);
}

/**
 * Load root metadata by version
 */
export async function loadRootByVersionClient(version: number, remoteUrl: string) {
    try {
        const url = new URL(`root.${version}.json`, remoteUrl).toString();
        const response = await fetch(url);
        if (!response.ok) {
            return null;
        }
        return await response.json();
    } catch (error) {
        console.error(`Error loading root version ${version}:`, error);
        return null;
    }
}

/**
 * Compare two root versions
 */
export async function compareRootVersionsClient(
    oldVersion: number,
    newVersion: number,
    remoteUrl: string
) {
    try {
        const [oldRoot, newRoot] = await Promise.all([
            loadRootByVersionClient(oldVersion, remoteUrl),
            loadRootByVersionClient(newVersion, remoteUrl)
        ]);

        if (!oldRoot || !newRoot) {
            return {
                diff: null,
                error: 'Failed to load one or both root versions'
            };
        }

        // Compare the metadata
        const diff = {
            version: {
                old: oldRoot.signed.version,
                new: newRoot.signed.version
            },
            keys: {
                added: [],
                removed: [],
                modified: []
            },
            roles: {
                added: [],
                removed: [],
                modified: []
            },
            signatures: {
                added: [],
                removed: []
            }
        };

        // Compare keys
        const oldKeys = oldRoot.signed.keys || {};
        const newKeys = newRoot.signed.keys || {};

        // Find added and modified keys
        for (const [keyId, newKey] of Object.entries(newKeys)) {
            if (!oldKeys[keyId]) {
                diff.keys.added.push(keyId);
            } else if (JSON.stringify(oldKeys[keyId]) !== JSON.stringify(newKey)) {
                diff.keys.modified.push(keyId);
            }
        }

        // Find removed keys
        for (const keyId of Object.keys(oldKeys)) {
            if (!newKeys[keyId]) {
                diff.keys.removed.push(keyId);
            }
        }

        // Compare roles
        const oldRoles = oldRoot.signed.roles || {};
        const newRoles = newRoot.signed.roles || {};

        // Find added and modified roles
        for (const [roleName, newRole] of Object.entries(newRoles)) {
            if (!oldRoles[roleName]) {
                diff.roles.added.push(roleName);
            } else if (JSON.stringify(oldRoles[roleName]) !== JSON.stringify(newRole)) {
                diff.roles.modified.push(roleName);
            }
        }

        // Find removed roles
        for (const roleName of Object.keys(oldRoles)) {
            if (!newRoles[roleName]) {
                diff.roles.removed.push(roleName);
            }
        }

        // Compare signatures
        const oldSigs = oldRoot.signatures || [];
        const newSigs = newRoot.signatures || [];

        // Find added signatures
        for (const newSig of newSigs) {
            if (!oldSigs.some(oldSig => 
                oldSig.keyid === newSig.keyid && 
                oldSig.sig === newSig.sig
            )) {
                diff.signatures.added.push(newSig);
            }
        }

        // Find removed signatures
        for (const oldSig of oldSigs) {
            if (!newSigs.some(newSig => 
                newSig.keyid === oldSig.keyid && 
                newSig.sig === oldSig.sig
            )) {
                diff.signatures.removed.push(oldSig);
            }
        }

        return { diff, error: null };
    } catch (error) {
        return {
            diff: null,
            error: error instanceof Error ? error.message : String(error)
        };
    }
} 