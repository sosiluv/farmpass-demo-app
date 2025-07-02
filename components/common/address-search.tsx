"use client";

import { useState } from "react";
import DaumPostcode from "react-daum-postcode";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin } from "lucide-react";

interface AddressSearchProps {
  onSelect: (address: string, detailedAddress: string) => void;
  defaultDetailedAddress?: string;
}

export function AddressSearch({
  onSelect,
  defaultDetailedAddress = "",
}: AddressSearchProps) {
  const [open, setOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState("");
  const [detailedAddress, setDetailedAddress] = useState(
    defaultDetailedAddress
  );
  const [isAddressSelected, setIsAddressSelected] = useState(false);
  const [isPostcodeLoaded, setIsPostcodeLoaded] = useState(false);

  const handleComplete = (data: any) => {
    let fullAddress = data.address;
    let extraAddress = "";

    if (data.addressType === "R") {
      if (data.bname !== "") {
        extraAddress += data.bname;
      }
      if (data.buildingName !== "") {
        extraAddress +=
          extraAddress !== "" ? `, ${data.buildingName}` : data.buildingName;
      }
      fullAddress += extraAddress !== "" ? ` (${extraAddress})` : "";
    }

    setSelectedAddress(fullAddress);
    setIsAddressSelected(true);
  };

  const handleConfirm = () => {
    onSelect(selectedAddress, detailedAddress);
    setOpen(false);
    setIsAddressSelected(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      // 다이얼로그가 열릴 때만 우편번호 API 로드
      setIsPostcodeLoaded(true);
    } else {
      // 다이얼로그가 닫힐 때 상태 초기화
      setIsAddressSelected(false);
      setSelectedAddress("");
      setIsPostcodeLoaded(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="w-full justify-start text-left font-normal"
        >
          <MapPin className="mr-2 h-4 w-4" />
          주소 검색
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>주소 검색</DialogTitle>
          <DialogDescription>
            도로명 주소나 지번 주소로 검색하여 정확한 주소를 입력해주세요.
          </DialogDescription>
        </DialogHeader>
        {!isAddressSelected && isPostcodeLoaded ? (
          <div className="h-[600px]">
            <DaumPostcode
              onComplete={handleComplete}
              style={{ height: "100%" }}
              onClose={() => setOpen(false)}
              autoClose={false}
              defaultQuery=""
              animation={false}
            />
          </div>
        ) : !isAddressSelected && !isPostcodeLoaded ? (
          <div className="h-[600px] flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
              <p className="text-sm text-gray-600">
                주소 검색 서비스를 불러오는 중...
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>기본 주소</Label>
              <Input value={selectedAddress} readOnly />
            </div>
            <div className="space-y-2">
              <Label>상세 주소</Label>
              <Input
                placeholder="상세 주소를 입력하세요 (예: 101동 1234호)"
                value={detailedAddress}
                onChange={(e) => setDetailedAddress(e.target.value)}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddressSelected(false)}
              >
                주소 다시 검색
              </Button>
              <Button type="button" onClick={handleConfirm}>
                확인
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
