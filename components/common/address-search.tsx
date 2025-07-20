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
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="w-full justify-start text-left font-normal"
        >
          <MapPin className="mr-2 h-4 w-4" />
          {BUTTONS.ADDRESS_SEARCH_BUTTON}
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-[600px] max-h-[90vh] sm:max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg">
            {LABELS.ADDRESS_SEARCH_TITLE}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {LABELS.ADDRESS_SEARCH_DESCRIPTION}
          </DialogDescription>
        </DialogHeader>
        {!isAddressSelected && isPostcodeLoaded ? (
          <div className="h-[500px] sm:h-[550px] lg:h-[600px]">
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
          <div className="h-[500px] sm:h-[550px] lg:h-[600px] flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
              <p className="text-sm text-gray-600">
                {LABELS.ADDRESS_SEARCH_LOADING}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-sm">
                {LABELS.ADDRESS_SEARCH_BASIC_ADDRESS}
              </Label>
              <Input
                value={selectedAddress}
                readOnly
                className="h-10 sm:h-11 text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">
                {LABELS.ADDRESS_SEARCH_DETAILED_ADDRESS}
              </Label>
              <Input
                placeholder={PLACEHOLDERS.ADDRESS_SEARCH_DETAILED_PLACEHOLDER}
                value={detailedAddress}
                onChange={(e) => setDetailedAddress(e.target.value)}
                className="h-10 sm:h-11 text-sm"
              />
            </div>
            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddressSelected(false)}
                className="h-10 sm:h-11 text-sm flex-1 sm:flex-none"
              >
                {BUTTONS.ADDRESS_SEARCH_RESEARCH}
              </Button>
              <Button
                type="button"
                onClick={handleConfirm}
                className="h-10 sm:h-11 text-sm flex-1 sm:flex-none"
              >
                {BUTTONS.ADDRESS_SEARCH_CONFIRM}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
