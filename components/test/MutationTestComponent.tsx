"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  useVisitorMutations,
  type CreateVisitorRequest,
  type UpdateVisitorRequest,
} from "@/lib/hooks/query/use-visitor-mutations";
import {
  useFarmMutations,
  type CreateFarmRequest,
  type UpdateFarmRequest,
} from "@/lib/hooks/query/use-farm-mutations";
import {
  useFarmMemberMutations,
  type InviteMemberRequest,
  type UpdateMemberRoleRequest,
} from "@/lib/hooks/query/use-farm-member-mutations";
import { useFarmsQuery } from "@/lib/hooks/query/use-farms-query";
import { Loader2, Plus, Edit, Trash2, UserPlus } from "lucide-react";

export function MutationTestComponent() {
  const [selectedSection, setSelectedSection] = useState<
    "visitor" | "farm" | "member"
  >("visitor");

  // Query Hook (기존 데이터 조회용)
  const { farms } = useFarmsQuery();

  // Mutation Hooks
  const visitorMutations = useVisitorMutations();
  const farmMutations = useFarmMutations();
  const memberMutations = useFarmMemberMutations();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">React Query Mutation 테스트</h1>
        <div className="flex items-center gap-2">
          <Badge variant="outline">Feature Flag 활성화</Badge>
          <Badge
            variant={selectedSection === "visitor" ? "default" : "secondary"}
          >
            방문자 테스트
          </Badge>
          <Badge variant={selectedSection === "farm" ? "default" : "secondary"}>
            농장 테스트
          </Badge>
          <Badge
            variant={selectedSection === "member" ? "default" : "secondary"}
          >
            멤버 테스트
          </Badge>
        </div>
      </div>

      {/* 섹션 선택 */}
      <div className="flex gap-2">
        <Button
          variant={selectedSection === "visitor" ? "default" : "outline"}
          onClick={() => setSelectedSection("visitor")}
        >
          방문자 Mutation
        </Button>
        <Button
          variant={selectedSection === "farm" ? "default" : "outline"}
          onClick={() => setSelectedSection("farm")}
        >
          농장 Mutation
        </Button>
        <Button
          variant={selectedSection === "member" ? "default" : "outline"}
          onClick={() => setSelectedSection("member")}
        >
          멤버 Mutation
        </Button>
      </div>

      {/* 방문자 Mutation 테스트 */}
      {selectedSection === "visitor" && (
        <VisitorMutationTest mutations={visitorMutations} farms={farms} />
      )}

      {/* 농장 Mutation 테스트 */}
      {selectedSection === "farm" && (
        <FarmMutationTest mutations={farmMutations} farms={farms} />
      )}

      {/* 멤버 Mutation 테스트 */}
      {selectedSection === "member" && (
        <MemberMutationTest mutations={memberMutations} farms={farms} />
      )}
    </div>
  );
}

// 방문자 Mutation 테스트 컴포넌트
function VisitorMutationTest({
  mutations,
  farms,
}: {
  mutations: any;
  farms: any[];
}) {
  const [visitorData, setVisitorData] = useState<CreateVisitorRequest>({
    farm_id: "",
    visitor_name: "",
    visitor_phone: "",
    visitor_address: "",
    visitor_purpose: "",
    disinfection_check: false,
    consent_given: false,
  });

  const handleCreateVisitor = () => {
    if (!visitorData.farm_id || !visitorData.visitor_name) {
      alert("농장과 방문자명을 입력해주세요.");
      return;
    }
    mutations.createVisitor(visitorData);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* 방문자 생성 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            방문자 등록
          </CardTitle>
          <CardDescription>새로운 방문자를 등록합니다.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="farm_id">농장 선택</Label>
            <Select
              value={visitorData.farm_id}
              onValueChange={(value) =>
                setVisitorData({ ...visitorData, farm_id: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="농장을 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {farms.map((farm) => (
                  <SelectItem key={farm.id} value={farm.id}>
                    {farm.farm_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="visitor_name">방문자명</Label>
            <Input
              id="visitor_name"
              value={visitorData.visitor_name}
              onChange={(e) =>
                setVisitorData({ ...visitorData, visitor_name: e.target.value })
              }
              placeholder="방문자명을 입력하세요"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="visitor_phone">연락처</Label>
            <Input
              id="visitor_phone"
              value={visitorData.visitor_phone}
              onChange={(e) =>
                setVisitorData({
                  ...visitorData,
                  visitor_phone: e.target.value,
                })
              }
              placeholder="연락처를 입력하세요"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="visitor_address">주소</Label>
            <Input
              id="visitor_address"
              value={visitorData.visitor_address}
              onChange={(e) =>
                setVisitorData({
                  ...visitorData,
                  visitor_address: e.target.value,
                })
              }
              placeholder="주소를 입력하세요"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="visitor_purpose">방문 목적</Label>
            <Input
              id="visitor_purpose"
              value={visitorData.visitor_purpose}
              onChange={(e) =>
                setVisitorData({
                  ...visitorData,
                  visitor_purpose: e.target.value,
                })
              }
              placeholder="방문 목적을 입력하세요"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="disinfection_check"
              checked={visitorData.disinfection_check}
              onCheckedChange={(checked) =>
                setVisitorData({
                  ...visitorData,
                  disinfection_check: checked as boolean,
                })
              }
            />
            <Label htmlFor="disinfection_check">방역 실시</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="consent_given"
              checked={visitorData.consent_given}
              onCheckedChange={(checked) =>
                setVisitorData({
                  ...visitorData,
                  consent_given: checked as boolean,
                })
              }
            />
            <Label htmlFor="consent_given">정보 제공 동의</Label>
          </div>

          <Button
            onClick={handleCreateVisitor}
            disabled={mutations.isCreating}
            className="w-full"
          >
            {mutations.isCreating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                등록 중...
              </>
            ) : (
              "방문자 등록"
            )}
          </Button>
        </CardContent>
      </Card>

      {/* 상태 정보 */}
      <Card>
        <CardHeader>
          <CardTitle>Mutation 상태</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span>생성 중:</span>
            <Badge variant={mutations.isCreating ? "destructive" : "secondary"}>
              {mutations.isCreating ? "진행 중" : "대기 중"}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span>수정 중:</span>
            <Badge variant={mutations.isUpdating ? "destructive" : "secondary"}>
              {mutations.isUpdating ? "진행 중" : "대기 중"}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span>삭제 중:</span>
            <Badge variant={mutations.isDeleting ? "destructive" : "secondary"}>
              {mutations.isDeleting ? "진행 중" : "대기 중"}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span>일괄 삭제 중:</span>
            <Badge
              variant={mutations.isBulkDeleting ? "destructive" : "secondary"}
            >
              {mutations.isBulkDeleting ? "진행 중" : "대기 중"}
            </Badge>
          </div>

          {/* 에러 정보 */}
          {(mutations.createError ||
            mutations.updateError ||
            mutations.deleteError ||
            mutations.bulkDeleteError) && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-700 font-medium">에러 발생:</p>
              <p className="text-sm text-red-600">
                {mutations.createError?.message ||
                  mutations.updateError?.message ||
                  mutations.deleteError?.message ||
                  mutations.bulkDeleteError?.message}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// 농장 Mutation 테스트 컴포넌트 (간단한 버전)
function FarmMutationTest({
  mutations,
  farms,
}: {
  mutations: any;
  farms: any[];
}) {
  const [farmData, setFarmData] = useState<CreateFarmRequest>({
    farm_name: "",
    farm_type: "",
    farm_address: "",
    description: "",
  });

  const handleCreateFarm = () => {
    if (!farmData.farm_name || !farmData.farm_address) {
      alert("농장명과 주소를 입력해주세요.");
      return;
    }
    mutations.createFarm(farmData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="w-5 h-5" />
          농장 등록
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="farm_name">농장명</Label>
            <Input
              id="farm_name"
              value={farmData.farm_name}
              onChange={(e) =>
                setFarmData({ ...farmData, farm_name: e.target.value })
              }
              placeholder="농장명을 입력하세요"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="farm_type">농장 타입</Label>
            <Input
              id="farm_type"
              value={farmData.farm_type}
              onChange={(e) =>
                setFarmData({ ...farmData, farm_type: e.target.value })
              }
              placeholder="농장 타입을 입력하세요"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="farm_address">주소</Label>
          <Input
            id="farm_address"
            value={farmData.farm_address}
            onChange={(e) =>
              setFarmData({ ...farmData, farm_address: e.target.value })
            }
            placeholder="주소를 입력하세요"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">설명</Label>
          <Textarea
            id="description"
            value={farmData.description}
            onChange={(e) =>
              setFarmData({ ...farmData, description: e.target.value })
            }
            placeholder="농장 설명을 입력하세요"
          />
        </div>

        <Button
          onClick={handleCreateFarm}
          disabled={mutations.isCreating}
          className="w-full"
        >
          {mutations.isCreating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              등록 중...
            </>
          ) : (
            "농장 등록"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

// 멤버 Mutation 테스트 컴포넌트 (간단한 버전)
function MemberMutationTest({
  mutations,
  farms,
}: {
  mutations: any;
  farms: any[];
}) {
  const [memberData, setMemberData] = useState<InviteMemberRequest>({
    farm_id: "",
    email: "",
    role: "viewer",
    message: "",
  });

  const handleInviteMember = () => {
    if (!memberData.farm_id || !memberData.email) {
      alert("농장과 이메일을 입력해주세요.");
      return;
    }
    mutations.inviteMember(memberData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="w-5 h-5" />
          멤버 초대
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="farm_id_member">농장 선택</Label>
          <Select
            value={memberData.farm_id}
            onValueChange={(value) =>
              setMemberData({ ...memberData, farm_id: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="농장을 선택하세요" />
            </SelectTrigger>
            <SelectContent>
              {farms.map((farm) => (
                <SelectItem key={farm.id} value={farm.id}>
                  {farm.farm_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">이메일</Label>
          <Input
            id="email"
            type="email"
            value={memberData.email}
            onChange={(e) =>
              setMemberData({ ...memberData, email: e.target.value })
            }
            placeholder="초대할 이메일을 입력하세요"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="role">역할</Label>
          <Select
            value={memberData.role}
            onValueChange={(value) =>
              setMemberData({ ...memberData, role: value as any })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="viewer">조회자</SelectItem>
              <SelectItem value="manager">관리자</SelectItem>
              <SelectItem value="owner">소유자</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="message">초대 메시지</Label>
          <Textarea
            id="message"
            value={memberData.message}
            onChange={(e) =>
              setMemberData({ ...memberData, message: e.target.value })
            }
            placeholder="초대 메시지를 입력하세요 (선택사항)"
          />
        </div>

        <Button
          onClick={handleInviteMember}
          disabled={mutations.isInviting}
          className="w-full"
        >
          {mutations.isInviting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              초대 중...
            </>
          ) : (
            "멤버 초대"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
