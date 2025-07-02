import type { Database } from "@/lib/types/supabase";

type Farm = Database["public"]["Tables"]["farms"]["Row"];

export interface ExtendedFarm extends Farm {
  owner_name: string;
  member_count: number;
  visitor_count: number;
}
