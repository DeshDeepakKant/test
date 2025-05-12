import { getAvailableRootVersions, loadRootByVersion } from './loadTufData';
import { compareRootMetadata } from './diffUtils';
import { RootDiff } from './types';

/**
 * Get a list of available root versions
 */
export async function getAvailableRootVersionsClient(remoteUrl?: string): Promise<{ version: number }[]> {
    const versions = await getAvailableRootVersions(remoteUrl);
    return versions.map(v => ({ version: v.version }));
}

/**
 * Compare two root versions and generate a diff
 */
export async function compareRootVersionsClient(
    oldVersion: number, 
    newVersion: number,
    remoteUrl?: string
): Promise<{ diff: RootDiff | null; error: string | null }> {
    try {
        if (oldVersion === newVersion) {
            return { 
                diff: null, 
                error: 'Cannot compare a version to itself. Please select different versions.' 
            };
        }
        
        const [older, newer] = oldVersion < newVersion 
            ? [oldVersion, newVersion] 
            : [newVersion, oldVersion];
        
        const oldRoot = await loadRootByVersion(older, remoteUrl);
        const newRoot = await loadRootByVersion(newer, remoteUrl);
        
        if (!oldRoot || !newRoot) {
            return { 
                diff: null, 
                error: 'Failed to load one of the root versions.' 
            };
        }
        
        const diff = compareRootMetadata(
            oldRoot.signed,
            newRoot.signed,
            oldRoot.signatures,
            newRoot.signatures
        );
        
        return { 
            diff, 
            error: null 
        };
    } catch (error) {
        console.error('Error comparing root versions:', error);
        return { 
            diff: null, 
            error: error instanceof Error ? error.message : String(error) 
        };
    }
}

/**
 * Load TUF metadata from a remote URL
 */
export async function loadTufDataClient(remoteUrl?: string): Promise<{
    roles: any[];
    version: string;
    error: string | null;
}> {
    const { loadTufData } = require('./loadTufData');
    return await loadTufData(remoteUrl);
} 