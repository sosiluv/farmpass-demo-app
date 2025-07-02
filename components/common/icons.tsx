import {
  FileText,
  FileType,
  Square,
  HardDrive,
  Loader2,
  type LucideIcon,
} from "lucide-react";

export type Icon = LucideIcon;

export const Icons = {
  fileType: FileType,
  aspectRatio: Square,
  fileSize: HardDrive,
  fileText: FileText,
  spinner: Loader2,
} as const;
