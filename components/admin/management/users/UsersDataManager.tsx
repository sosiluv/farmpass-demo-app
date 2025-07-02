import { useState, useEffect } from "react";
import { useCommonToast } from "@/lib/utils/notification/toast-messages";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { supabase } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";

interface UsersDataManagerProps {
  children: (data: {
    users: Profile[];
    lastUpdate: Date;
    setUsers: React.Dispatch<React.SetStateAction<Profile[]>>;
    setLastUpdate: (date: Date) => void;
  }) => React.ReactNode;
}

export function UsersDataManager({ children }: UsersDataManagerProps) {
  const { showCustomError } = useCommonToast();
  const [users, setUsers] = useState<Profile[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase.from("profiles").select("*");
      if (error) throw error;
      setUsers(data || []);
      setLastUpdate(new Date());
    } catch (error: any) {
      devLog.error("Error fetching users:", error);
      showCustomError(
        "사용자 정보 불러오기 실패",
        "사용자 정보를 불러오는데 실패했습니다."
      );
    }
  };

  return (
    <>
      {children({
        users,
        lastUpdate,
        setUsers,
        setLastUpdate,
      })}
    </>
  );
}
