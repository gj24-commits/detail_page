"""
Google Drive 폴더 구조 관리
상품명/시즌 별로 자동 정리
"""

import os
import shutil
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / ".env")

GDRIVE_BASE = os.getenv(
    "GOOGLE_DRIVE_PATH",
    "/Users/gj/Library/CloudStorage/GoogleDrive-gj24@darimaker.com/"
    "공유 드라이브/(주)다리메이커(임원용) 드라이브/1. 두런두런 워케이션/1. 마케팅/상세페이지"
)


def get_output_dir(product_name: str, season: str) -> str:
    """Google Drive 내 출력 폴더 경로 반환 (없으면 생성)"""
    # 파일명에 사용 불가 문자 제거
    safe_product = product_name.replace("/", "-").replace("\\", "-")
    safe_season = season.replace("/", "-").replace("\\", "-")

    output_dir = Path(GDRIVE_BASE) / safe_product / safe_season
    output_dir.mkdir(parents=True, exist_ok=True)
    return str(output_dir)


def get_temp_dir(product_name: str, season: str) -> str:
    """로컬 임시 작업 폴더"""
    safe_product = product_name.replace("/", "-")
    safe_season = season.replace("/", "-")
    temp_dir = Path(__file__).parent / "output" / safe_product / safe_season
    temp_dir.mkdir(parents=True, exist_ok=True)
    return str(temp_dir)


def save_outputs(png_paths, html_path: str, figma_info_path: str,
                 product_name: str, season: str) -> dict:
    """
    생성된 파일들을 Google Drive 폴더로 복사 및 정리
    png_paths: str 또는 list[str]
    Returns: 저장된 파일 경로 dict
    """
    output_dir = get_output_dir(product_name, season)
    saved = {"pngs": []}

    # PNG 복사 (단일 또는 리스트)
    if isinstance(png_paths, str):
        png_paths = [png_paths]
    for i, png_path in enumerate(png_paths, 1):
        if png_path and Path(png_path).exists():
            dst = Path(output_dir) / f"상세페이지_{i:02d}.png"
            try:
                shutil.copy2(png_path, dst)
                saved["pngs"].append(str(dst))
                print(f"  → PNG {i} 저장됨: {dst}")
            except Exception as e:
                print(f"  ⚠️  PNG {i} 복사 실패: {e}")
                print(f"     로컬 경로: {png_path}")
    if saved["pngs"]:
        saved["png"] = saved["pngs"][0]  # 하위 호환

    # HTML 복사 (Figma 편집용)
    if html_path and Path(html_path).exists():
        dst = Path(output_dir) / "상세페이지_figma편집용.html"
        try:
            shutil.copy2(html_path, dst)
            saved["html"] = str(dst)
            print(f"  → HTML 저장됨: {dst}")
        except Exception as e:
            print(f"  ⚠️  HTML 복사 실패: {e}")
            print(f"     로컬 경로: {html_path}")

    # Figma 안내 파일 복사
    if figma_info_path and Path(figma_info_path).exists():
        dst = Path(output_dir) / "figma_안내.txt"
        shutil.copy2(figma_info_path, dst)
        saved["figma_info"] = str(dst)

    saved["folder"] = output_dir
    return saved


def list_all_pages() -> list[dict]:
    """Google Drive에 저장된 모든 상세페이지 목록"""
    base = Path(GDRIVE_BASE)
    if not base.exists():
        return []

    pages = []
    for product_dir in sorted(base.iterdir()):
        if not product_dir.is_dir():
            continue
        for season_dir in sorted(product_dir.iterdir()):
            if not season_dir.is_dir():
                continue
            has_png = any(season_dir.glob("상세페이지_*.png")) or (season_dir / "상세페이지.png").exists()
            pages.append({
                "product": product_dir.name,
                "season": season_dir.name,
                "path": str(season_dir),
                "has_png": has_png,
            })
    return pages
