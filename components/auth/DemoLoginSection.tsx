"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users } from "lucide-react";
import {
  DEMO_ACCOUNTS,
  DEMO_LOGIN_CONFIG,
  type DemoAccount,
} from "@/lib/constants/demo-accounts";

interface DemoLoginSectionProps {
  onAccountSelect: (account: DemoAccount) => void;
  loading?: boolean;
}

export function DemoLoginSection({
  onAccountSelect,
  loading = false,
}: DemoLoginSectionProps) {
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");

  const selectedAccount = DEMO_ACCOUNTS.find(
    (account) => account.id === selectedAccountId
  );

  const handleAccountSelect = (accountId: string) => {
    setSelectedAccountId(accountId);
    const account = DEMO_ACCOUNTS.find((acc) => acc.id === accountId);
    if (account) {
      onAccountSelect(account);
    }
  };

  const getRoleBadgeVariant = (role: DemoAccount["role"]) => {
    switch (role) {
      case "admin":
        return "destructive";
      case "owner":
        return "default";
      case "manager":
        return "secondary";
      case "viewer":
        return "outline";
      default:
        return "outline";
    }
  };

  const getRoleLabel = (role: DemoAccount["role"]) => {
    switch (role) {
      case "admin":
        return "관리자";
      case "owner":
        return "농장주";
      case "manager":
        return "관리자";
      case "viewer":
        return "조회자";
      default:
        return role;
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="mx-auto mb-2 flex justify-center">
          <div className="rounded-full bg-blue-100 p-2">
            <Users className="h-5 w-5 text-blue-600" />
          </div>
        </div>
        <h3 className="text-lg font-semibold text-blue-900">
          {DEMO_LOGIN_CONFIG.title}
        </h3>
        <p className="text-sm text-blue-700">{DEMO_LOGIN_CONFIG.subtitle}</p>
      </div>

      {/* 계정 선택 */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">
          체험할 계정 선택
        </label>
        <Select value={selectedAccountId} onValueChange={handleAccountSelect}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="계정을 선택하세요" />
          </SelectTrigger>
          <SelectContent>
            {DEMO_ACCOUNTS.map((account) => (
              <SelectItem key={account.id} value={account.id}>
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{account.avatar}</span>
                  <div className="flex flex-col">
                    <span className="font-medium">{account.name}</span>
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 선택된 계정 정보 */}
      {selectedAccount && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ duration: 0.3 }}
          className="space-y-3"
        >
          {/* 계정 정보 */}
          <div className="rounded-lg border bg-white p-3 space-y-2">
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="text-lg">
                  {selectedAccount.avatar}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h4 className="font-medium">{selectedAccount.name}</h4>
                  <Badge variant={getRoleBadgeVariant(selectedAccount.role)}>
                    {getRoleLabel(selectedAccount.role)}
                  </Badge>
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-500">
              {selectedAccount.description}
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
