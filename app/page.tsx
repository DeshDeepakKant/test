import React from 'react';
import TufViewerClient from './components/TufViewerClient';

export const dynamic = 'force-static';

export default function Home() {
    // For static export, we'll only render the empty state
    // and let client-side code handle URL parameters and data fetching
    return (
        <TufViewerClient 
            roles={[]} 
            version={process.env.VERSION || '0.1.0'} 
            error={null}
            initialRemoteUrl={undefined}
        />
    );
} 