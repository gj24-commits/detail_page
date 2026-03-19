"""
Figma 업로드 모듈
PNG를 Figma에 새 파일로 업로드하고 편집 가능한 링크 반환
"""

import os
import json
import base64
import requests
from pathlib import Path


def get_figma_user(token: str) -> dict:
    resp = requests.get("https://api.figma.com/v1/me",
                        headers={"X-Figma-Token": token})
    resp.raise_for_status()
    return resp.json()


def get_team_id(token: str):
    """사용자 팀 ID 가져오기"""
    user = get_figma_user(token)
    # teams 엔드포인트 없으므로 None 반환
    return None


def create_figma_file_with_image(token: str, product_name: str, season: str,
                                  png_path: str, html_path: str) -> dict:
    """
    Figma에 디자인 업로드
    - Figma REST API는 파일 생성을 지원하지 않으므로
      대신 Figma import용 HTML 파일 경로와 안내 메시지를 반환
    """
    result = {
        "method": "manual_import",
        "html_path": html_path,
        "png_path": png_path,
        "instructions": [],
    }

    result["instructions"] = [
        f"1. Figma 열기 (figma.com)",
        f"2. 새 파일 만들기",
        f"3. 메뉴 > Plugins > 'HTML to Figma' 플러그인 실행",
        f"4. HTML 파일 경로 입력: {html_path}",
        f"   또는: 파일 > Import... 에서 {html_path} 선택",
    ]

    # 또는: Figma에서 PNG를 직접 배치하는 방법도 안내
    result["quick_method"] = f"Figma에서 {png_path} 를 드래그앤드롭해서 바로 사용 가능"

    return result


def upload_image_to_figma_file(token: str, file_key: str, image_path: str):
    """기존 Figma 파일에 이미지 업로드 (file_key 있을 때)"""
    with open(image_path, "rb") as f:
        image_data = f.read()

    resp = requests.post(
        f"https://api.figma.com/v1/images/{file_key}",
        headers={
            "X-Figma-Token": token,
            "Content-Type": "image/png",
        },
        data=image_data,
    )

    if resp.status_code == 200:
        return resp.json().get("meta", {}).get("images", {})
    return None


def save_figma_info(output_dir: str, product_name: str, season: str,
                    result: dict) -> str:
    """Figma 업로드 결과를 텍스트로 저장"""
    info_path = Path(output_dir) / "figma_안내.txt"

    lines = [
        f"═══ Figma 파일 안내 ═══",
        f"상품: {product_name}",
        f"시즌: {season}",
        f"",
        f"─── PNG 파일 ───",
        f"{result['png_path']}",
        f"",
        f"─── HTML 파일 (Figma 편집용) ───",
        f"{result['html_path']}",
        f"",
        f"─── Figma에서 편집하는 방법 ───",
    ]
    lines.extend(result.get("instructions", []))
    lines.extend([
        f"",
        f"─── 빠른 방법 ───",
        result.get("quick_method", ""),
        f"",
        f"💡 Figma Plugin 추천: 'HTML to Figma' (무료)",
        f"   설치: figma.com/community/plugin/753195897635688985",
    ])

    content = "\n".join(lines)
    with open(info_path, "w", encoding="utf-8") as f:
        f.write(content)

    return str(info_path)
