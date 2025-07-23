export default function PrivacyPage() {
  return (
    <div className="bg-background py-10">
      <section className="prose prose-h1:font-bold prose-h2:font-bold prose-h2:mt-6 prose-h2:mb-2 bg-white rounded-xl shadow-md p-8 max-w-2xl mx-auto border border-gray-100">
        <h1 className="font-bold">개인정보 처리방침</h1>
        <p className="mb-6">
          '삼원기업'(이하 '회사')은 이용자님의 개인정보를 중요시하며,
          "정보통신망 이용촉진 및 정보보호"에 관한 법률을 준수하고 있습니다.
          회사는 개인정보취급방침을 통하여 이용자님께서 제공하시는 개인정보가
          어떠한 용도와 방식으로 이용되고 있으며, 개인정보보호를 위해 어떠한
          조치가 취해지고 있는지 알려드립니다.
        </p>
        <h2 className="font-bold">1. 수집하는 개인정보 항목</h2>
        <ul className="list-disc pl-5 space-y-1 mb-4">
          <li>
            회원가입, 상담, 서비스 신청 등을 위해 아래와 같은 개인정보를
            수집하고 있습니다.
          </li>
          <li>개인정보 수집방법 : 홈페이지(회원가입, 게시판, 신청서)</li>
          <li>
            로그인ID, 패스워드, 별명, 이메일, 서비스 이용기록, 접속 로그, 쿠키,
            접속 IP 정보, 결제기록
          </li>
        </ul>
        <h2 className="font-bold">2. 개인정보의 수집 및 이용목적</h2>
        <ul className="list-disc pl-5 space-y-1 mb-4">
          <li>
            서비스 제공에 관한 계약 이행 및 서비스 제공에 따른 요금정산(컨텐츠
            제공, 물품배송 또는 청구서 등 발송, 본인인증, 구매 및 요금 결제,
            요금추심)
          </li>
          <li>
            회원 관리(회원제 서비스 이용에 따른 본인확인, 개인 식별, 불량회원의
            부정 이용 방지와 비인가 사용 방지, 가입 의사 확인)
          </li>
          <li>
            마케팅 및 광고에 활용(접속 빈도 파악 또는 회원의 서비스 이용에 대한
            통계)
          </li>
        </ul>
        <h2 className="font-bold">3. 개인정보의 보유 및 이용기간</h2>
        <ul className="list-disc pl-5 space-y-1 mb-4">
          <li>
            원칙적으로, 개인정보 수집 및 이용목적이 달성된 후에는 해당 정보를
            지체 없이 파기합니다.
          </li>
          <li>
            단, 관계법령의 규정에 의하여 보존할 필요가 있는 경우 회사는 아래와
            같이 관계법령에서 정한 일정한 기간 동안 회원정보를 보관합니다.
          </li>
        </ul>
        <h2 className="font-bold">4. 개인정보의 파기절차 및 방법</h2>
        <ul className="list-disc pl-5 space-y-1 mb-4">
          <li>
            목적 달성 후 즉시 파기, 전자적 파일은 복구 불가능한 방법으로 삭제
          </li>
        </ul>
        <h2 className="font-bold">5. 개인정보 제공</h2>
        <ul className="list-disc pl-5 space-y-1 mb-4">
          <li>
            이용자 동의 없이 외부에 제공하지 않음, 법령에 의거하거나 수사기관
            요청 시 제공 가능
          </li>
        </ul>
        <h2 className="font-bold">6. 수집한 개인정보의 위탁</h2>
        <ul className="list-disc pl-5 space-y-1 mb-4">
          <li>해당 없음(또는 홈페이지 참고)</li>
        </ul>
        <h2 className="font-bold">
          7. 이용자 및 법정대리인의 권리와 그 행사방법
        </h2>
        <ul className="list-disc pl-5 space-y-1 mb-4">
          <li>언제든지 개인정보 조회, 수정, 삭제, 처리정지 요청 가능</li>
          <li>개인정보관리책임자에게 서면, 이메일 등으로 연락 가능</li>
        </ul>
        <h2 className="font-bold">
          8. 개인정보 자동수집 장치의 설치, 운영 및 거부에 관한 사항
        </h2>
        <ul className="list-disc pl-5 space-y-1 mb-4">
          <li>쿠키 등 사용, 브라우저 설정을 통해 거부 가능</li>
          <li>
            쿠키 설정 거부 방법: 웹 브라우저 상단의 도구 &gt; 인터넷 옵션 &gt;
            개인정보
          </li>
          <li>
            쿠키 설치를 거부하였을 경우 서비스 제공에 어려움이 있을 수 있음
          </li>
        </ul>
        <h2 className="font-bold">9. 개인정보에 관한 민원서비스</h2>
        <ul className="list-disc pl-5 space-y-1 mb-4">
          <li>개인정보관리책임자: (회사 홈페이지 참고)</li>
          <li>대표전화: 054-843-1141, 팩스: 054-855-9398</li>
          <li>주소: 경상북도 안동시 풍산읍 괴정2길 106-23 주101~104동</li>
          <li>
            기타 개인정보침해에 대한 신고나 상담이 필요하신 경우에는 아래 기관에
            문의하시기 바랍니다.
            <br />
            - 개인정보보호 침해센터 (www.privacy.kisa.or.kr / 02-405-5118)
            <br />
            - 정보보호마크인증위원회 (www.eprivacy.or.kr / 02-580-9531~2)
            <br />
            - 대검찰청 사이버범죄신고 (www.spo.go.kr / 02-3480-2000)
            <br />- 경찰청 사이버안전국 (www.ctrc.go.kr / 1566-0112)
          </li>
        </ul>
        <h2 className="font-bold">10. 기타</h2>
        <ul className="list-disc pl-5 space-y-1 mb-4">
          <li>
            홈페이지에 링크되어 있는 웹사이트들이 개인정보를 수집하는 개별적인
            행위에 대해서는 본 "개인정보취급방침"이 적용되지 않음
          </li>
        </ul>
        <h2 className="font-bold">11. 고지의 의무</h2>
        <ul className="list-disc pl-5 space-y-1 mb-4">
          <li>
            현 개인정보취급방침의 내용이 변경될 경우에는 개정 최소 7일전부터
            홈페이지의 "공지사항"을 통해 고지
          </li>
        </ul>
        <hr />
        <div className="mt-8 text-xs text-muted-foreground text-center">
          본 약관은 2025년 7월 23일부터 적용됩니다.
        </div>
      </section>
    </div>
  );
}
