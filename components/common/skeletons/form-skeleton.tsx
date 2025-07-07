import { Skeleton } from "@/components/ui/skeleton";

interface FormSkeletonProps {
  fields?: number;
  className?: string;
}

export function FormSkeleton({
  fields = 6,
  className = "",
}: FormSkeletonProps) {
  return (
    <div className={`space-y-6 ${className}`}>
      {(Array.from({ length: fields }) || []).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-[100px]" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      <Skeleton className="h-12 w-full mt-8" /> {/* Submit button */}
    </div>
  );
}
