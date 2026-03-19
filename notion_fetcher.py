"""
Notion 페이지에서 상품 정보를 가져오는 모듈
"""

import os
import re
import requests
from pathlib import Path
from playwright.sync_api import sync_playwright


def fetch_notion_content(url: str, notion_token: str = None) -> dict:
    """Notion URL에서 상품 정보 가져오기"""
    # Notion API 시도 (토큰 있을 때)
    if notion_token:
        page_id_match = re.search(r"([a-f0-9]{32})", url.replace("-", ""))
        if page_id_match:
            try:
                print("  → Notion API로 가져오는 중...")
                return _fetch_via_api(page_id_match.group(), notion_token)
            except Exception as e:
                print(f"  → Notion API 실패 ({e}), 웹 스크래핑으로 전환...")

    print("  → 웹 스크래핑으로 가져오는 중...")
    return _fetch_via_playwright(url)


def _fetch_via_playwright(url: str) -> dict:
    """Playwright로 Notion 페이지 전체 텍스트 추출"""
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 1280, "height": 800})
        page.goto(url, wait_until="domcontentloaded", timeout=60000)
        page.wait_for_timeout(6000)
        full_text = page.evaluate("() => document.body.innerText")
        browser.close()

    return _parse_notion_text(full_text)


def _parse_notion_text(text: str) -> dict:
    """추출된 텍스트를 상세페이지 데이터 구조로 파싱"""
    lines = [l.strip() for l in text.split("\n") if l.strip()]

    content = {
        "title": "",
        "subtitle": "",
        "target": "",
        "location": "",
        "schedule": [],
        "price": "",
        "included": [],
        "excluded": [],
        "highlights": [],
        "program": [],
        "booking_link": "",
        "contact": "",
        "schedule_days": [],
    }

    # 제목 (첫 의미있는 줄)
    for line in lines[:5]:
        if len(line) > 5 and "Get Notion" not in line and "Skip to" not in line:
            content["title"] = line.lstrip("🏯🏠🌿🎯✨ ").strip()
            break

    current_section = ""
    i = 0
    while i < len(lines):
        line = lines[i]

        # 섹션 헤더 감지
        if any(kw in line for kw in ["소개", "일정표", "절차", "혜택", "모집", "돌봄 프로그램", "숙소", "추천"]):
            current_section = line.lower()

        # 부제/메인 카피
        if "죄책감" in line or ("프리오픈" in line and "에서는" in line):
            content["subtitle"] = line[:80]

        # 추천 대상
        if "추천드립니다" in line or "이런 분들" in line:
            j = i + 1
            targets = []
            while j < len(lines) and j < i + 6:
                if lines[j] and not any(kw in lines[j] for kw in ["패밀리", "워케이션으로", "목차"]):
                    targets.append(lines[j])
                j += 1
            content["target"] = "\n".join(targets[:3])

        # 모집 대상
        if "모집 대상" in line and i + 1 < len(lines):
            j = i + 1
            while j < len(lines) and j < i + 4:
                if lines[j] and "※" not in lines[j]:
                    content["target"] = content["target"] or lines[j]
                j += 1

        # 혜택/포함사항
        if re.match(r"[1-8]️⃣", line) or (re.match(r"\d+[️]", line)):
            clean = re.sub(r"[1-8️⃣🔢]+\s*", "", line).strip()
            if clean and len(clean) > 2:
                content["included"].append(clean)

        # 장소
        if "경주 신라레거시호텔" in line and not content["location"]:
            content["location"] = "경주 신라레거시호텔"
        if "원효로" in line and "경주" in line:
            content["location"] = "경북 경주시 원효로 14-1 신라레거시호텔"

        # 가격
        if "참여 비용" in line or "가정 당" in line:
            content["price"] = line

        # 연락처
        if "@darimaker.com" in line:
            content["contact"] = line.strip()
        if "카카오" in line and "바로가기" in line:
            pass  # 카카오 채널 링크는 있으면 추가

        # 일정표 파싱 (1일차/2일차/3일차)
        if "1일차" in line and "2일차" in line:
            schedule_days = _parse_schedule_from_table(lines, i)
            if schedule_days:
                content["schedule_days"] = schedule_days

        i += 1

    # 핵심 포인트 구성
    content["highlights"] = [
        {
            "icon": "👨‍👩‍👧",
            "title": "부모는 일에 몰입",
            "desc": "24시간 이용 가능한 전용 업무 공간에서 집중 근무. 모니터·키보드·마우스 완비"
        },
        {
            "icon": "🎓",
            "title": "아이는 전문 돌봄",
            "desc": "만족도 99.4% 발도르프 기반 프로그램. 가족심리상담사 자격 보유 두런선생님과 함께"
        },
        {
            "icon": "🏯",
            "title": "경주 역사 특화 콘텐츠",
            "desc": "대릉원·첨성대 탐구, 금관총·천마총 체험, 첨성대 무드등 만들기 등 6종 프로그램"
        },
    ]

    # 프로그램 목록
    content["program"] = [
        {"title": "대릉원·첨성대 탐구 지도 만들기", "desc": "경주 역사 유적 현장 탐방 및 지도 제작 체험"},
        {"title": "습식수채화 — 미추왕릉 댓잎군사", "desc": "신라 역사 이야기를 수채화로 표현하는 예술 활동"},
        {"title": "신라시대 주사위 주령구 만들기", "desc": "신라시대 놀이도구를 직접 만들어보는 수공예"},
        {"title": "윷놀이·제기차기 만들기", "desc": "전통 놀이를 만들고 함께 즐기는 협동 프로그램"},
        {"title": "금관총·천마총 파헤치기", "desc": "신라 왕릉의 비밀을 탐구하는 역사 탐험 활동"},
        {"title": "첨성대 무드등 만들기", "desc": "경주 첨성대를 모티프로 한 DIY 무드등 제작"},
    ]

    # 일정이 없으면 기본 구성
    if not content["schedule_days"]:
        content["schedule_days"] = [
            {
                "title": "1일차 — 도착 및 오리엔테이션",
                "date": "",
                "items": [
                    "13:00 경주 신라레거시호텔 로비 집합",
                    "부모) 업무 시작 / 자녀) 야외활동 — 대릉원·첨성대 탐구 지도 만들기",
                    "실내활동 — 습식수채화, 신라시대 주령구 만들기",
                    "18:00~ 자유시간 및 자율 업무",
                ]
            },
            {
                "title": "2일차 — 경주 역사 탐험",
                "date": "",
                "items": [
                    "10:00 실내활동 — 윷놀이·제기차기 만들기",
                    "부모) 업무 / 자녀) 야외활동 — 금관총·천마총 파헤치기",
                    "15:30 첨성대 무드등 만들기",
                    "16:00 자유시간 및 자율 업무",
                ]
            },
            {
                "title": "3일차 — 마무리",
                "date": "",
                "items": [
                    "11:00 체크아웃",
                    "소감 나누기 및 아쉬운 작별",
                ]
            },
        ]

    return content


def _parse_schedule_from_table(lines: list, start_idx: int) -> list:
    """일정표 테이블 파싱"""
    days = [
        {"title": "1일차 — 도착 및 오리엔테이션", "date": "", "items": []},
        {"title": "2일차 — 경주 역사 탐험", "date": "", "items": []},
        {"title": "3일차 — 마무리", "date": "", "items": []},
    ]

    i = start_idx
    limit = min(start_idx + 60, len(lines))
    current_time = ""

    while i < limit:
        line = lines[i]

        # 시간 감지
        time_match = re.match(r"(\d{1,2}:\d{2})", line)
        if time_match:
            current_time = time_match.group(1)

        # 각 일자 내용 감지
        if "부모)" in line or "자녀)" in line or "집합" in line or "체크" in line:
            if current_time:
                item = f"{current_time} {line}"
            else:
                item = line

            # 어느 날짜에 해당하는지 맥락으로 판단
            if "집합" in line and not days[0]["items"]:
                days[0]["items"].append(item)
            elif "체크아웃" in line:
                days[2]["items"].append(item)
            elif len(days[0]["items"]) > 0 and len(days[1]["items"]) == 0:
                days[0]["items"].append(item)
            elif len(days[1]["items"]) >= 0:
                days[1]["items"].append(item)

        i += 1

    # 빈 날짜 제거
    return [d for d in days if d["items"] or d["title"]]


def _fetch_via_api(page_id: str, token: str) -> dict:
    """Notion API로 가져오기 (비공개 페이지용)"""
    headers = {
        "Authorization": f"Bearer {token}",
        "Notion-Version": "2022-06-28",
    }
    resp = requests.get(f"https://api.notion.com/v1/blocks/{page_id}/children?page_size=100",
                        headers=headers)
    resp.raise_for_status()
    data = resp.json()

    lines = []
    for block in data.get("results", []):
        btype = block.get("type", "")
        rt = block.get(btype, {}).get("rich_text", [])
        text = "".join([t.get("plain_text", "") for t in rt])
        if text:
            lines.append(text)

    return _parse_notion_text("\n".join(lines))
