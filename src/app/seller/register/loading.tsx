import { DelayedLoading } from "@/components";

export default function Loading() {
    return <div className="absolute inset-0 flex items-center justify-center">
        <DelayedLoading />
    </div>
}