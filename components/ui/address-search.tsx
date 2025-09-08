"use client";

import { useState } from "react";
import DaumPostcode from "react-daum-postcode";
import { Button } from "@/components/ui/button";
import { Sheet, SheetTrigger } from "@/components/ui/sheet";
import {
  CommonSheetHeader,
  CommonSheetContent,
  CommonSheetFooter,
} from "@/components/ui/sheet-common";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, MapPin } from "lucide-react";
import { BUTTONS, LABELS, PLACEHOLDERS } from "@/lib/constants/common";

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
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="w-full justify-start text-sm sm:text-base font-normal"
        >
          <MapPin className="mr-2 h-4 w-4" />
          {BUTTONS.ADDRESS_SEARCH_BUTTON}
        </Button>
      </SheetTrigger>
      <CommonSheetContent
        enableDragToResize={true}
        open={open}
        onClose={() => setOpen(false)}
      >
        <CommonSheetHeader
          title={LABELS.ADDRESS_SEARCH_TITLE}
          description={LABELS.ADDRESS_SEARCH_DESCRIPTION}
          show={false}
        />
        {!isAddressSelected && isPostcodeLoaded ? (
          <DaumPostcode
            onComplete={handleComplete}
            style={{ height: "100%" }}
            onClose={() => setOpen(false)}
            autoClose={false}
            defaultQuery=""
            animation={false}
          />
        ) : !isAddressSelected && !isPostcodeLoaded ? (
          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
              <p className="text-sm text-gray-600">
                {LABELS.ADDRESS_SEARCH_LOADING}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <Label className="flex items-center gap-2 text-sm">
              <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              {LABELS.ADDRESS_SEARCH_BASIC_ADDRESS}
              <span className="text-red-500">*</span>
            </Label>
            <Input value={selectedAddress} readOnly />

            <div className="space-y-4 py-4">
              <Label className="flex items-center gap-2 text-sm">
                <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                {LABELS.ADDRESS_SEARCH_DETAILED_ADDRESS}
              </Label>
              <Input
                placeholder={PLACEHOLDERS.ADDRESS_SEARCH_DETAILED_PLACEHOLDER}
                value={detailedAddress}
                onChange={(e) => setDetailedAddress(e.target.value)}
              />
            </div>
          </div>
        )}

        {isAddressSelected && (
          <CommonSheetFooter
            onCancel={() => setIsAddressSelected(false)}
            onConfirm={handleConfirm}
            cancelText={BUTTONS.ADDRESS_SEARCH_RESEARCH}
            confirmText={BUTTONS.ADDRESS_SEARCH_CONFIRM}
          />
        )}
      </CommonSheetContent>
    </Sheet>
  );
}
