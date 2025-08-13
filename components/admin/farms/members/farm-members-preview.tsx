"use client";

import { Users, Crown, Shield, Eye, ChevronRight } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { FarmMember } from "@/lib/types/common";
import { generateInitials, getAvatarUrl } from "@/lib/utils/media/avatar";
import { LABELS } from "@/lib/constants/farms";

interface FarmMembersPreviewProps {
  farmId: string;
  membersData?: Array<
    FarmMember & {
      profiles: {
        name: string;
        profile_image_url?: string | null;
        avatar_seed?: string | null;
      };
    }
  >;
}

export function FarmMembersPreview({ membersData }: FarmMembersPreviewProps) {
  const members = membersData || [];
  const isLoading = !membersData;

  if (isLoading) {
    return (
      <div className="mt-4 pt-4 border-t border-border/50">
        <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg border border-slate-200/50 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-muted rounded-full animate-pulse"></div>
              <div className="space-y-2">
                <div className="w-20 h-3 bg-muted rounded animate-pulse"></div>
                <div className="w-16 h-2 bg-muted rounded animate-pulse"></div>
              </div>
            </div>
            <div className="flex space-x-1">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="w-6 h-6 bg-muted rounded-full animate-pulse"
                ></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!members || members.length === 0) {
    return (
      <div className="mt-4 pt-4 border-t border-border/50">
        <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg border border-slate-200/50 p-4">
          <div className="flex items-center justify-center py-4">
            <div className="flex items-center space-x-3 text-muted-foreground">
              <div className="p-2 bg-slate-100 rounded-lg">
                <Users className="h-4 w-4" />
              </div>
              <div className="text-center">
                <div className="text-sm font-medium">{LABELS.NO_MEMBERS}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {LABELS.ADD_MEMBERS_SUGGESTION}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const memberCount = members.length;

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "owner":
        return <Crown className="h-3 w-3" />;
      case "manager":
        return <Shield className="h-3 w-3" />;
      case "viewer":
        return <Eye className="h-3 w-3" />;
      default:
        return <Users className="h-3 w-3" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "owner":
        return "bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 text-amber-700";
      case "manager":
        return "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 text-blue-700";
      case "viewer":
        return "bg-gradient-to-r from-slate-50 to-gray-50 border-slate-200 text-slate-700";
      default:
        return "bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200 text-gray-700";
    }
  };

  return (
    <div className="mt-4 pt-4 border-t border-border/50">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200/50 hover:border-blue-300/70 transition-all duration-200 group cursor-pointer">
        <div className="p-4">
          {/* 헤더 섹션 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <div className="text-xs text-blue-600">
                  {LABELS.MEMBERS_COUNT.replace(
                    "{count}",
                    memberCount.toString()
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* 아바타들 */}
              <div className="flex -space-x-2">
                {members.slice(0, 4).map(
                  (
                    member: FarmMember & {
                      profiles: {
                        name: string;
                        profile_image_url?: string | null;
                        avatar_seed?: string | null;
                      };
                    }
                  ) => (
                    <div
                      key={member.id}
                      className="relative group/avatar"
                      title={`${member.profiles.name} (${member.role})`}
                    >
                      <Avatar className="w-8 h-8 border-2 border-white shadow-sm transition-transform group-hover/avatar:scale-110 group-hover/avatar:z-10">
                        <AvatarImage
                          src={getAvatarUrl(
                            {
                              ...member,
                              name: member.profiles.name,
                              profile_image_url:
                                member.profiles.profile_image_url,
                              avatar_seed: member.profiles.avatar_seed,
                            },
                            { size: 64 }
                          )}
                          alt={member.profiles.name}
                          className="object-cover"
                        />
                        <AvatarFallback
                          className={`text-white ${getRoleColor(member.role)}`}
                        >
                          {generateInitials(member.profiles.name)}
                        </AvatarFallback>
                      </Avatar>
                      {/* 역할 표시 */}
                      <div className="absolute -bottom-1 -right-1 p-0.5 bg-white rounded-full border border-blue-200 shadow-sm">
                        {getRoleIcon(member.role)}
                      </div>
                    </div>
                  )
                )}

                {/* 더 많은 구성원이 있을 때 +N 표시 */}
                {memberCount > 4 && (
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-200 to-blue-300 border-2 border-white flex items-center justify-center text-xs font-semibold text-blue-700 shadow-sm">
                      +{memberCount - 4}
                    </div>
                  </div>
                )}
              </div>

              {/* 화살표 아이콘 */}
              <div className="p-1 bg-blue-100 rounded-full group-hover:bg-blue-200 transition-colors">
                <ChevronRight className="h-3 w-3 text-blue-600" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
