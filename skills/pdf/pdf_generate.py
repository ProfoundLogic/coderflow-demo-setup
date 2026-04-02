#!/usr/bin/env python3
"""
PDF generation helper for Claude Code pdf skill.

Input: JSON via first argument, file (@path), or stdin (-)

JSON schema:
{
  "output":      "/path/to/output.pdf",
  "title":       "Document Title",
  "author":      "Author Name",
  "page_size":   "letter" | "a4",
  "orientation":  "portrait" | "landscape",
  "margins":     {"top": 15, "right": 15, "bottom": 15, "left": 15},
  "header":      {"text": "Header text", "logo": "/path/to/logo.png"},
  "footer":      {"text": "Page {page_no} of {nb}", "show_page_numbers": true},
  "content":     [ ... content blocks ... ]
}
"""

import json
import os
import sys
import tempfile
import urllib.parse
import urllib.request

from fpdf import FPDF


# ---------------------------------------------------------------------------
# Input loading (same pattern as email skill)
# ---------------------------------------------------------------------------

def load_input():
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "No input provided. Pass JSON as argument, @file, or -"}))
        sys.exit(1)
    raw = sys.argv[1]
    if raw == "-":
        raw = sys.stdin.read()
    elif raw.startswith("@"):
        with open(raw[1:], "r") as f:
            raw = f.read()
    return json.loads(raw)


# ---------------------------------------------------------------------------
# Custom PDF class with header/footer support
# ---------------------------------------------------------------------------

class PDF(FPDF):
    def __init__(self, header_cfg=None, footer_cfg=None, **kwargs):
        super().__init__(**kwargs)
        self._header_cfg = header_cfg or {}
        self._footer_cfg = footer_cfg or {}

    def header(self):
        cfg = self._header_cfg
        if not cfg:
            return
        self.set_font("Helvetica", "B", 10)
        self.set_text_color(100, 100, 100)
        if cfg.get("logo") and os.path.isfile(cfg["logo"]):
            self.image(cfg["logo"], x=self.l_margin, y=8, h=10)
            self.set_x(self.l_margin + 15)
        if cfg.get("text"):
            self.cell(0, 10, cfg["text"], align="L")
        self.ln(6)
        self.set_draw_color(200, 200, 200)
        self.line(self.l_margin, self.get_y(), self.w - self.r_margin, self.get_y())
        self.ln(4)
        self.set_text_color(0, 0, 0)

    def footer(self):
        cfg = self._footer_cfg
        if not cfg:
            return
        self.set_y(-15)
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(128, 128, 128)
        text = cfg.get("text", "")
        if cfg.get("show_page_numbers", True):
            text = text.replace("{page_no}", str(self.page_no()))
            text = text.replace("{nb}", "{nb}")
            if not text:
                text = f"Page {self.page_no()} of {{nb}}"
        self.cell(0, 10, text, align="C")
        self.set_text_color(0, 0, 0)


# ---------------------------------------------------------------------------
# Image URL fetching
# ---------------------------------------------------------------------------

def fetch_url_to_temp(url):
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "PDFSkill/1.0"})
        with urllib.request.urlopen(req, timeout=30) as resp:
            suffix = os.path.splitext(urllib.parse.urlparse(url).path)[1] or ".png"
            tmp = tempfile.NamedTemporaryFile(delete=False, suffix=suffix, prefix="pdf_img_")
            tmp.write(resp.read())
            tmp.close()
            return tmp.name
    except Exception as e:
        raise RuntimeError(f"Failed to download image from {url}: {e}")


# ---------------------------------------------------------------------------
# Content block renderers
# ---------------------------------------------------------------------------

def render_heading(pdf, block):
    level = block.get("level", 1)
    sizes = {1: 20, 2: 16, 3: 13, 4: 11}
    size = sizes.get(level, 14)
    pdf.ln(4)
    pdf.set_font("Helvetica", "B", size)
    pdf.multi_cell(0, size * 0.6, block.get("text", ""))
    pdf.ln(2)


def render_text(pdf, block):
    size = block.get("size", 11)
    style = ""
    if block.get("bold"):
        style += "B"
    if block.get("italic"):
        style += "I"
    align = {"left": "L", "center": "C", "right": "R", "justify": "J"}.get(
        block.get("align", "left"), "L"
    )
    pdf.set_font("Helvetica", style, size)
    pdf.multi_cell(0, size * 0.55, block.get("text", ""), align=align)
    pdf.ln(2)


def render_html(pdf, block):
    pdf.set_font("Helvetica", "", 11)
    pdf.write_html(block.get("html", ""))
    pdf.ln(2)


def render_table(pdf, block):
    headers = block.get("headers", [])
    rows = block.get("rows", [])
    col_count = max(len(headers), max((len(r) for r in rows), default=0)) if (headers or rows) else 0
    if col_count == 0:
        return

    col_widths = block.get("col_widths")
    if not col_widths:
        usable = pdf.w - pdf.l_margin - pdf.r_margin
        col_widths = [usable / col_count] * col_count

    line_height = 7

    # Header row
    if headers:
        pdf.set_font("Helvetica", "B", 10)
        pdf.set_fill_color(230, 230, 230)
        for i, h in enumerate(headers):
            w = col_widths[i] if i < len(col_widths) else col_widths[-1]
            pdf.cell(w, line_height, str(h), border=1, fill=True)
        pdf.ln(line_height)

    # Data rows
    pdf.set_font("Helvetica", "", 10)
    pdf.set_fill_color(255, 255, 255)
    for row in rows:
        for i, cell in enumerate(row):
            w = col_widths[i] if i < len(col_widths) else col_widths[-1]
            pdf.cell(w, line_height, str(cell), border=1)
        pdf.ln(line_height)
    pdf.ln(2)


def render_image(pdf, block, temp_files):
    path = block.get("path", "")
    url = block.get("url", "")

    if url and not path:
        path = fetch_url_to_temp(url)
        temp_files.append(path)

    if not path or not os.path.isfile(path):
        return

    kwargs = {}
    if block.get("width"):
        kwargs["w"] = block["width"]
    if block.get("height"):
        kwargs["h"] = block["height"]
    if not kwargs:
        kwargs["w"] = pdf.w - pdf.l_margin - pdf.r_margin

    pdf.image(path, x=pdf.get_x(), **kwargs)
    pdf.ln(4)


def render_code(pdf, block):
    text = block.get("text", "")
    pdf.set_fill_color(245, 245, 245)
    pdf.set_draw_color(200, 200, 200)
    pdf.set_font("Courier", "", 9)

    x = pdf.get_x()
    w = pdf.w - pdf.l_margin - pdf.r_margin

    # Draw background rect then text
    lines = text.split("\n")
    line_h = 5
    block_h = len(lines) * line_h + 6
    y_start = pdf.get_y()

    # Check page break
    if y_start + block_h > pdf.h - pdf.b_margin:
        pdf.add_page()
        y_start = pdf.get_y()

    pdf.rect(x, y_start, w, block_h, style="DF")
    pdf.set_y(y_start + 3)

    for line in lines:
        pdf.set_x(x + 3)
        pdf.cell(w - 6, line_h, line)
        pdf.ln(line_h)

    pdf.ln(4)
    pdf.set_font("Helvetica", "", 11)


def render_page_break(pdf, block):
    pdf.add_page()


def render_spacer(pdf, block):
    pdf.ln(block.get("height", 10))


RENDERERS = {
    "heading": render_heading,
    "text": render_text,
    "html": render_html,
    "table": render_table,
    "image": lambda pdf, block: None,  # handled separately
    "code": render_code,
    "page_break": render_page_break,
    "spacer": render_spacer,
}


# ---------------------------------------------------------------------------
# Main generation logic
# ---------------------------------------------------------------------------

def generate_pdf(data):
    # Validate required fields
    if not data.get("output"):
        return {"success": False, "error": "Missing required field: 'output'"}
    if not data.get("content"):
        return {"success": False, "error": "Missing required field: 'content'"}

    output_path = data["output"]

    # Page settings
    page_size = data.get("page_size", "letter").upper()
    if page_size not in ("LETTER", "A4"):
        page_size = "LETTER"
    orientation = "L" if data.get("orientation", "portrait").lower() == "landscape" else "P"
    margins = data.get("margins", {})

    # Create PDF
    pdf = PDF(
        header_cfg=data.get("header"),
        footer_cfg=data.get("footer"),
        orientation=orientation,
        format=page_size,
    )

    pdf.set_auto_page_break(auto=True, margin=margins.get("bottom", 15))
    pdf.set_margins(
        left=margins.get("left", 15),
        top=margins.get("top", 15),
        right=margins.get("right", 15),
    )

    # Metadata
    if data.get("title"):
        pdf.set_title(data["title"])
    if data.get("author"):
        pdf.set_author(data["author"])

    pdf.alias_nb_pages()
    pdf.add_page()
    pdf.set_font("Helvetica", "", 11)

    # Render content blocks
    temp_files = []
    try:
        for block in data["content"]:
            btype = block.get("type", "text")
            if btype == "image":
                render_image(pdf, block, temp_files)
            elif btype in RENDERERS:
                RENDERERS[btype](pdf, block)
            else:
                # Unknown type — render as text
                pdf.set_font("Helvetica", "", 11)
                pdf.multi_cell(0, 6, block.get("text", f"[Unknown block type: {btype}]"))
                pdf.ln(2)

        # Ensure output directory exists
        out_dir = os.path.dirname(output_path)
        if out_dir:
            os.makedirs(out_dir, exist_ok=True)

        pdf.output(output_path)

        file_size = os.path.getsize(output_path)

        return {
            "success": True,
            "message": "PDF generated successfully",
            "details": {
                "output": output_path,
                "pages": pdf.pages_count,
                "size_bytes": file_size,
            },
        }

    except Exception as e:
        return {"success": False, "error": f"PDF generation error: {e}"}
    finally:
        for tf in temp_files:
            try:
                os.unlink(tf)
            except OSError:
                pass


def main():
    try:
        data = load_input()
    except json.JSONDecodeError as e:
        print(json.dumps({"success": False, "error": f"Invalid JSON input: {e}"}))
        sys.exit(1)
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))
        sys.exit(1)

    result = generate_pdf(data)
    print(json.dumps(result, indent=2))
    if not result.get("success"):
        sys.exit(1)


if __name__ == "__main__":
    main()
