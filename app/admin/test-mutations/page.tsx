import { MutationTestComponent } from "@/components/test/MutationTestComponent";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "React Query Mutation 테스트",
  description: "React Query Mutation Hook 테스트 페이지",
};

export default function MutationTestPage() {
  return <MutationTestComponent />;
}
