#!/usr/bin/env python3
"""
두런두런 상세페이지 자동 빌더
사용법:
  python3 builder.py --product "두런두런 패밀리 워케이션" --season "2026 시즌1" --notion <URL> --images img1.jpg img2.jpg
  python3 builder.py --list   (저장된 상세페이지 목록 보기)
"""

import sys
import os
import argparse
from pathlib import Path
from dotenv import load_dotenv

# .env 로드
load_dotenv(Path(__file__).parent / ".env")
FIGMA_TOKEN = os.getenv("FIGMA_TOKEN", "")
NOTION_TOKEN = os.getenv("NOTION_TOKEN", "")

from notion_fetcher import fetch_notion_content
from design_generator import generate_design
from figma_uploader import create_figma_file_with_image, save_figma_info
from file_organizer import get_temp_dir, save_outputs, list_all_pages


def build(product: str, season: str, notion_url: str = None,
          images: list[str] = None, manual_content: dict = None):
    """상세페이지 빌드 메인 함수"""

    print(f"\n{'═'*50}")
    print(f"  상세페이지 빌더 시작")
    print(f"  상품: {product}")
    print(f"  시즌: {season}")
    print(f"{'═'*50}\n")

    # 1. Notion 내용 가져오기
    content = manual_content or {}
    if notion_url:
        print("① Notion 내용 가져오는 중...")
        content = fetch_notion_content(notion_url, NOTION_TOKEN or None)
        if not content.get("title"):
            content["title"] = product
        print(f"  → 제목: {content.get('title', '(없음)')}")
    elif not manual_content:
        print("① 내용 없음 - 기본 템플릿으로 진행...")
        content = {"title": product, "subtitle": f"{season} 프로그램"}

    # 2. 디자인 생성
    print("\n② 디자인 생성 중...")
    temp_dir = get_temp_dir(product, season)
    png_paths, html_path = generate_design(
        content=content,
        images=images or [],
        output_dir=temp_dir
    )

    # 3. Figma 정보 저장
    print("\n③ Figma 편집 파일 준비 중...")
    figma_result = create_figma_file_with_image(
        token=FIGMA_TOKEN,
        product_name=product,
        season=season,
        png_path=png_paths[0] if png_paths else "",
        html_path=html_path,
    )
    figma_info_path = save_figma_info(temp_dir, product, season, figma_result)
    print(f"  → Figma 안내 저장: {figma_info_path}")

    # 4. Google Drive 저장
    print("\n④ Google Drive에 저장 중...")
    saved = save_outputs(png_paths, html_path, figma_info_path, product, season)

    # 완료 출력
    print(f"\n{'═'*50}")
    print(f"  ✅ 완료!")
    print(f"{'═'*50}")
    print(f"\n📁 저장 위치:")
    print(f"   {saved['folder']}")
    print(f"\n📄 생성 파일:")
    for i, p in enumerate(saved.get("pngs", []), 1):
        print(f"   🖼️  상세페이지_{i:02d}.png")
    if saved.get("html"):
        print(f"   🎨  상세페이지_figma편집용.html  (Figma에 import 가능)")
    if saved.get("figma_info"):
        print(f"   📋  figma_안내.txt")
    print(f"\n💡 Figma에서 편집하려면:")
    print(f"   'HTML to Figma' 플러그인으로 HTML 파일을 import하세요")
    print(f"   플러그인: figma.com/community/plugin/753195897635688985\n")

    return saved


def list_pages():
    """저장된 상세페이지 목록 출력"""
    pages = list_all_pages()
    if not pages:
        print("저장된 상세페이지가 없습니다.")
        return

    print(f"\n{'═'*50}")
    print(f"  저장된 상세페이지 목록")
    print(f"{'═'*50}")
    for p in pages:
        status = "✅" if p["has_png"] else "⚠️ "
        print(f"  {status} {p['product']} / {p['season']}")
        print(f"       {p['path']}")
    print()


def main():
    parser = argparse.ArgumentParser(
        description="두런두런 상세페이지 자동 빌더",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
예시:
  python3 builder.py --product "두런두런 패밀리 워케이션" --season "2026 시즌1" --notion https://notion.so/xxx
  python3 builder.py --product "두런두런 패밀리 워케이션" --season "2026 시즌1" --images ~/Desktop/사진1.jpg ~/Desktop/사진2.jpg
  python3 builder.py --list
        """
    )
    parser.add_argument("--product", default="두런두런 패밀리 워케이션", help="상품명")
    parser.add_argument("--season", default="2026 시즌1", help="시즌 (예: 2026 시즌1)")
    parser.add_argument("--notion", help="Notion 페이지 URL")
    parser.add_argument("--images", nargs="*", help="이미지 파일 경로들")
    parser.add_argument("--list", action="store_true", help="저장된 상세페이지 목록 보기")

    args = parser.parse_args()

    if args.list:
        list_pages()
        return

    # 이미지 경로 정리
    images = []
    if args.images:
        for img in args.images:
            p = Path(img).expanduser()
            if p.exists():
                images.append(str(p))
            else:
                print(f"  ⚠️  이미지 없음 (건너뜀): {img}")

    build(
        product=args.product,
        season=args.season,
        notion_url=args.notion,
        images=images,
    )


if __name__ == "__main__":
    main()
