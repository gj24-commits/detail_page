"""
HTML 템플릿 → PNG 변환 모듈
"""
import os
import math
import base64
from pathlib import Path
from jinja2 import Environment, FileSystemLoader
from playwright.sync_api import sync_playwright

TEMPLATE_DIR = Path(__file__).parent / "templates"


def image_to_data_uri(image_path: str) -> str:
    path = Path(image_path)
    if not path.exists():
        return ""
    ext = path.suffix.lower().lstrip(".")
    mime = {"jpg":"image/jpeg","jpeg":"image/jpeg","png":"image/png","webp":"image/webp"}.get(ext,"image/jpeg")
    with open(path,"rb") as f:
        data = base64.b64encode(f.read()).decode()
    return f"data:{mime};base64,{data}"


def build_template_context(content: dict, images: list) -> dict:
    image_uris = [image_to_data_uri(img) for img in images if img and Path(img).exists()]

    # 핵심 포인트
    highlights = []
    for h in content.get("highlights", [])[:3]:
        if isinstance(h, dict):
            highlights.append(h)
        else:
            parts = h.split(":", 1)
            highlights.append({"icon": "✨", "title": parts[0].strip(), "desc": parts[1].strip() if len(parts) > 1 else h})

    # 프로그램
    program = []
    for p in content.get("program", [])[:6]:
        if isinstance(p, dict):
            program.append(p)
        else:
            parts = p.split("—", 1)
            program.append({"title": parts[0].strip(), "desc": parts[1].strip() if len(parts) > 1 else ""})

    # schedule_days
    schedule_days = content.get("schedule_days", [])

    # 시간표 (일별 구조 — 시간대별 부모/자녀 동시 표시)
    timetable_days = content.get("timetable_days", [
        {
            "name": "1일차",
            "slots": [
                {"time": "13:00~13:30", "entries": [
                    {"label": "공통", "type": "free", "text": "신라레거시호텔 로비 집합 · 오리엔테이션"},
                ]},
                {"time": "13:30~15:30", "entries": [
                    {"label": "부모", "type": "parent", "text": "업무 (워케이션 센터)"},
                    {"label": "자녀", "type": "child", "text": "실내활동 — 윷놀이·제기차기 만들기"},
                ]},
                {"time": "15:30~18:00", "entries": [
                    {"label": "부모", "type": "parent", "text": "업무"},
                    {"label": "자녀", "type": "child", "text": "실내활동 — 습식수채화·주령구 만들기"},
                ]},
                {"time": "18:00~", "entries": [
                    {"label": "공통", "type": "free", "text": "자유시간 가족과 함께"},
                ]},
            ]
        },
        {
            "name": "2일차",
            "slots": [
                {"time": "10:00~12:00", "entries": [
                    {"label": "부모", "type": "parent", "text": "업무 집중"},
                    {"label": "자녀", "type": "child", "text": "야외활동 — 대릉원·첨성대 탐구"},
                ]},
                {"time": "12:00~13:00", "entries": [
                    {"label": "공통", "type": "free", "text": "점심 시간"},
                ]},
                {"time": "13:00~15:30", "entries": [
                    {"label": "부모", "type": "parent", "text": "업무"},
                    {"label": "자녀", "type": "child", "text": "야외활동 — 금관총·천마총 파헤치기"},
                ]},
                {"time": "15:30~18:00", "entries": [
                    {"label": "부모", "type": "parent", "text": "업무"},
                    {"label": "자녀", "type": "child", "text": "실내활동 — 습식수채화·주령구 만들기"},
                ]},
                {"time": "18:00~", "entries": [
                    {"label": "공통", "type": "free", "text": "자유시간 가족과 함께"},
                ]},
            ]
        },
        {
            "name": "3일차",
            "slots": [
                {"time": "10:00~11:00", "entries": [
                    {"label": "자녀", "type": "child", "text": "첨성대 무드등 만들기"},
                ]},
                {"time": "11:00", "entries": [
                    {"label": "공통", "type": "free", "text": "체크아웃 마무리"},
                ]},
            ]
        },
    ])

    # 가격
    price_cards = []
    raw_price = content.get("price", "")
    if raw_price:
        for i, line in enumerate((raw_price.split("\n") if "\n" in raw_price else [raw_price])):
            if line.strip():
                parts = line.split(":", 1)
                price_cards.append({
                    "type": parts[0].strip() if len(parts) > 1 else f"옵션 {i+1}",
                    "amount": parts[1].strip() if len(parts) > 1 else line.strip(),
                    "original": "",
                    "unit": "원 / 가정 (2박 3일)",
                    "highlight": i == 0,
                })

    # 숙소 상세
    location_details = content.get("location_details", [
        {"icon": "📍", "title": "위치", "desc": "경북 경주시 원효로 14-1 신라레거시호텔\n황리단길·첨성대 도보 5분 거리"},
        {"icon": "🏢", "title": "업무 공간", "desc": "2층 워케이션 센터 · 24시간 이용 · 4석\n모니터·키보드·마우스·프린터 완비"},
        {"icon": "🛏️", "title": "체크인 / 체크아웃", "desc": "체크인 15:00 / 체크아웃 11:00\n수건·어메니티·매일 하우스키핑 제공"},
        {"icon": "🧒", "title": "키즈 특화 시설", "desc": "5층 키즈라운지 무료 이용\n히어로 플레이파크 기본권 무료"},
    ])

    room_types = content.get("room_types", [
        {"name": "레지던셜 로얄", "capacity": 6, "price": ""},
        {"name": "패밀리 노블 스위트", "capacity": 4, "price": ""},
        {"name": "수페리어 스위트", "capacity": 4, "price": ""},
    ])

    # 오피스 스펙
    office_specs = content.get("office_specs", [
        {"icon": "💻", "title": "업무 장비", "desc": "모니터·키보드·마우스·HDMI 완비, 프린터 사용 가능"},
        {"icon": "📶", "title": "네트워크", "desc": "고속 와이파이 24시간 제공"},
        {"icon": "🕐", "title": "이용 시간", "desc": "24시간 자유 이용 (체크인 전·아웃 후 포함)"},
        {"icon": "👥", "title": "수용 인원", "desc": "전용 4석 (추가 좌석 설치 가능)"},
    ])

    # 패키지 구성
    package_items = content.get("package_items", [
        {"icon": "🛏️", "title": "숙박 (2박)", "desc": "경주 신라레거시호텔\n선택한 객실 유형 기준"},
        {"icon": "💻", "title": "업무 공간", "desc": "2층 워케이션 센터\n24시간 자유 이용"},
        {"icon": "🎓", "title": "자녀 돌봄", "desc": "전문 두런선생님과 함께\n6종 역사 체험 프로그램"},
        {"icon": "🎁", "title": "특별 혜택", "desc": "숙박·교통 바우처\n키즈라운지·플레이파크 무료"},
    ])

    # 추천 대상
    target_list = []
    raw_target = content.get("target", "")
    if raw_target:
        for line in raw_target.split("\n"):
            if line.strip():
                target_list.append(line.strip())
    if not target_list:
        target_list = [
            "아이에게 경주에서 특별한 방학을 선물하고 싶은 부모님",
            "여행 중에도 확실한 업무 시간이 필요한 직장인·프리랜서",
            "정부지원사업 시즌, 일도 아이의 방학도 놓치고 싶지 않은 대표님",
        ]

    # 참여 절차
    process_steps = content.get("process_steps", [
        {"icon": "📋", "title": "신청", "desc": "카카오채널 또는\n신청 링크로 접수"},
        {"icon": "✅", "title": "잔여 확인", "desc": "담당자가\n잔여 객실 확인"},
        {"icon": "💳", "title": "결제", "desc": "개인 결제창\n문자 전송"},
        {"icon": "📩", "title": "확정 안내", "desc": "이용 가이드 +\n숙소 배정 안내"},
        {"icon": "🏨", "title": "워케이션 시작!", "desc": "오픈채팅방으로\n실시간 소통"},
    ])

    # 환불 규정
    refund_rows = content.get("refund_rows", [
        {"timing": "8일 이전 취소", "amount": "100% 환불"},
        {"timing": "7일 전 취소", "amount": "90% 환불"},
        {"timing": "5~6일 전 취소", "amount": "70% 환불"},
        {"timing": "3~4일 전 취소", "amount": "50% 환불"},
        {"timing": "2일 전 취소", "amount": "20% 환불"},
        {"timing": "1일 전 ~ 당일", "amount": "환불 불가"},
    ])

    cautions = content.get("cautions", [
        "취소 기준 시간은 자정(00:00)을 기준으로 합니다.",
        "예비 초1 이하 자녀의 돌봄 프로그램 참여를 희망하실 경우 별도 문의 부탁드립니다.",
        "날씨·계절에 따라 야외/실내 프로그램 일정이 변동될 수 있습니다.",
        "인터뷰·사진·영상 촬영이 진행되며 두런두런 홍보자료로 활용됩니다.",
    ])

    # 이미지 배분: hero_image=0번, images=전체(템플릿이 인덱스로 사용)
    hero_image = image_uris[0] if image_uris else ""

    # 섹션별 전용 이미지 (images 리스트 뒤쪽에서 할당)
    # [0]=hero, [1-3]=photo strip A, [4]=banner, [5-7]=programs+strip B
    # [8-11]=package, [12]=workspace, [13-15]=hotel
    package_images = image_uris[8:12] if len(image_uris) > 8 else []
    workspace_image = image_uris[12] if len(image_uris) > 12 else ""
    hotel_images = image_uris[13:16] if len(image_uris) > 13 else []

    return {
        "title": content.get("title", "경주 신라레거시 패밀리 워케이션"),
        "subtitle": content.get("subtitle", "아이에 대한 죄책감 없이 — 일에도, 아이에게도 집중할 수 있습니다"),
        "badge": "두런두런 패밀리 워케이션",
        "hero_image": hero_image,
        "images": image_uris,
        "highlights": highlights,
        "program": program,
        "package_items": package_items,
        "target_list": target_list,
        "process_steps": process_steps,
        "schedule_days": schedule_days,
        "timetable_days": timetable_days,
        "office_specs": office_specs,
        "location_details": location_details,
        "room_types": room_types,
        "included": content.get("included", [
            "숙박비 바우처 (경북형 워케이션)",
            "교통비 바우처 (경북형 워케이션)",
            "전문 자녀 돌봄 프로그램 (1~2일차)",
            "히어로 플레이파크 경주점 기본권 무료",
            "원더스페이스 보문점 50% 할인",
            "조식 할인 제공",
            "스크린 골프 1시간 무료",
            "웰컴티 무료 (보호자)",
            "5층 키즈라운지 무료 이용",
        ]),
        "excluded": content.get("excluded", [
            "개인 식비 (점심·저녁)",
            "개인 교통비",
            "추가 액티비티 비용",
            "객실 내 미니바 이용",
        ]),
        "price_cards": price_cards if price_cards else [
            {"type": "객실 유형에 따라 상이", "amount": "별도 문의", "original": "", "unit": "경북형 워케이션 바우처 지원 적용", "highlight": True}
        ],
        "price_note": "* 객실 유형에 따라 참여 비용이 상이합니다. 상세 비용은 카카오채널로 문의해 주세요.",
        "refund_rows": refund_rows,
        "cautions": cautions,
        "schedule_summary": "2박 3일",
        "location_summary": "경주 신라레거시호텔",
        "target_age": "예비 초1~초3",
        "capacity": "총 4가정",
        "price_summary": "바우처 지원",
        "workspace_image": workspace_image,
        "hotel_images": hotel_images,
        "package_images": package_images,
        "booking_link": content.get("booking_link", ""),
        "cta_subtitle": "마감 전 얼리버드 혜택을 놓치지 마세요",
        "contact_email": "",
        "contact_phone": "",
        "contact_kakao": "다리메이커 카카오톡 채널",
    }


def render_html(context: dict) -> str:
    env = Environment(loader=FileSystemLoader(str(TEMPLATE_DIR)))
    template = env.get_template("detail_page.html")
    return template.render(**context)


def generate_pngs_split(html_content: str, output_dir: str, max_height: int = 1600) -> list:
    """전체 페이지를 max_height 단위로 잘라서 여러 PNG로 저장"""
    output_dir = Path(output_dir)
    paths = []
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 1080, "height": 800})
        page.set_content(html_content, wait_until="networkidle")
        page.wait_for_timeout(2500)
        total_height = page.evaluate("document.body.scrollHeight")
        page.set_viewport_size({"width": 1080, "height": total_height})
        page.wait_for_timeout(600)
        num_pages = math.ceil(total_height / max_height)
        for i in range(num_pages):
            y_start = i * max_height
            clip_h = min(max_height, total_height - y_start)
            png_path = str(output_dir / f"상세페이지_{i+1:02d}.png")
            page.screenshot(
                path=png_path,
                clip={"x": 0, "y": y_start, "width": 1080, "height": clip_h},
                type="png",
            )
            print(f"  → PNG {i+1}/{num_pages} 저장: {png_path}")
            paths.append(png_path)
        browser.close()
    return paths


def generate_design(content: dict, images: list, output_dir: str) -> tuple:
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    ctx = build_template_context(content, images)
    html = render_html(ctx)
    html_path = str(output_dir / "상세페이지.html")
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"  → HTML 저장: {html_path}")
    png_paths = generate_pngs_split(html, str(output_dir))
    return png_paths, html_path
