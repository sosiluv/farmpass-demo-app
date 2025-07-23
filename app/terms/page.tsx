export default function TermsPage() {
  return (
    <div className="bg-background py-10">
      <section className="prose prose-h1:font-bold prose-h2:font-bold prose-h2:mt-6 prose-h2:mb-2 bg-white rounded-xl shadow-md p-8 max-w-2xl mx-auto border border-gray-100">
        <h1 className="font-bold">서비스 이용약관</h1>
        <p className="mb-6">
          본 약관은 귀하가 본 서비스를 이용함에 있어 필요한 권리, 의무 및
          책임사항을 규정합니다.
        </p>
        <h2 className="font-bold">제1조 (목적)</h2>
        <p className="mb-4">
          이 약관은 서비스 제공자(이하 "회사")가 제공하는 모든 서비스(이하
          "서비스")의 이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항,
          기타 필요한 사항을 규정함을 목적으로 합니다.
        </p>
        <h2 className="font-bold">제2조 (정의)</h2>
        <ul className="list-disc pl-5 space-y-1 mb-4">
          <li>
            "이용자"란 본 약관에 따라 회사가 제공하는 서비스를 받는 회원 및
            비회원을 말합니다.
          </li>
          <li>
            "회원"이란 회사와 서비스 이용계약을 체결하고 이용자 아이디(ID)를
            부여받은 자를 말합니다.
          </li>
        </ul>
        <h2 className="font-bold">제3조 (약관의 효력 및 변경)</h2>
        <ul className="list-disc pl-5 space-y-1 mb-4">
          <li>
            본 약관은 서비스를 이용하고자 하는 모든 이용자에 대하여 그 효력을
            발생합니다.
          </li>
          <li>
            회사는 관련 법령을 위배하지 않는 범위에서 본 약관을 변경할 수
            있습니다.
          </li>
        </ul>
        <h2 className="font-bold">제4조 (서비스의 제공 및 변경)</h2>
        <p className="mb-4">
          회사는 서비스의 내용, 운영상 또는 기술상 필요에 따라 제공하는 서비스의
          내용을 변경할 수 있습니다.
        </p>
        <h2 className="font-bold">제5조 (서비스 이용의 제한 및 중지)</h2>
        <p className="mb-2">
          회사는 다음 각 호의 어느 하나에 해당하는 경우 서비스의 전부 또는
          일부를 제한하거나 중지할 수 있습니다.
        </p>
        <ul className="list-disc pl-5 space-y-1 mb-4">
          <li>서비스 설비의 보수 등 공사로 인한 부득이한 경우</li>
          <li>이용자가 본 약관을 위반한 경우</li>
          <li>기타 회사가 필요하다고 인정하는 경우</li>
        </ul>
        <h2 className="font-bold">제6조 (이용자의 의무)</h2>
        <ul className="list-disc pl-5 space-y-1 mb-4">
          <li>
            이용자는 관계 법령, 본 약관의 규정, 이용안내 및 서비스와 관련하여
            공지한 주의사항 등을 준수하여야 합니다.
          </li>
          <li>
            이용자는 회사의 사전 승낙 없이 서비스를 이용하여 영업활동을 할 수
            없습니다.
          </li>
        </ul>
        <h2 className="font-bold">제7조 (면책조항)</h2>
        <p className="mb-4">
          회사는 천재지변, 불가항력적 사유, 이용자의 귀책사유로 인한 서비스 이용
          장애에 대하여 책임을 지지 않습니다.
        </p>
        <h2 className="font-bold">제8조 (분쟁의 해결)</h2>
        <p className="mb-4">
          본 약관에 관한 분쟁은 회사의 본사 소재지를 관할하는 법원을 제1심
          법원으로 합니다.
        </p>
        <hr />
        <div className="mt-8 text-xs text-muted-foreground text-center">
          본 약관은 2025년 7월 23일부터 적용됩니다.
        </div>
      </section>
    </div>
  );
}
