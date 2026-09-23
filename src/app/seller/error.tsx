'use client';

import { ErrorUI } from '@/components';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return <ErrorUI reset={reset} error={error} />;
}
