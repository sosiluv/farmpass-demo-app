import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface VisitorAvatarProps {
  name: string;
  imageUrl?: string | null;
  disinfectionCheck: boolean;
  size?: "sm" | "md" | "lg";
  showStatus?: boolean;
  onClick?: () => void;
  className?: string;
}

const sizeClasses = {
  sm: "w-9 h-9",
  md: "w-10 h-10",
  lg: "w-12 h-12",
};

const statusSizeClasses = {
  sm: "w-3 h-3 -bottom-1 -right-1",
  md: "w-4 h-4 -bottom-1 -right-1",
  lg: "w-5 h-5 -bottom-1 -right-1",
};

const statusDotClasses = {
  sm: "w-1.5 h-1.5",
  md: "w-2 h-2",
  lg: "w-2.5 h-2.5",
};

export function VisitorAvatar({
  name,
  imageUrl,
  disinfectionCheck,
  size = "md",
  showStatus = true,
  onClick,
  className,
}: VisitorAvatarProps) {
  return (
    <div className={`relative ${className || ""}`} onClick={onClick}>
      <Avatar
        className={`${sizeClasses[size]} border-2 border-white shadow-sm`}
      >
        <AvatarImage src={imageUrl || undefined} />
        <AvatarFallback className="bg-gradient-to-br from-blue-100 to-blue-200 text-blue-700 font-semibold">
          {name.charAt(0)}
        </AvatarFallback>
      </Avatar>
      {showStatus && (
        <div
          className={`absolute ${statusSizeClasses[size]} bg-white rounded-full flex items-center justify-center shadow-sm border`}
        >
          <div
            className={`${statusDotClasses[size]} rounded-full ${
              disinfectionCheck ? "bg-emerald-500" : "bg-red-500"
            }`}
          />
        </div>
      )}
    </div>
  );
}
