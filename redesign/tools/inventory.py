"""Capture the working source, including disclosure copy, art text and exact URLs."""
from collections import defaultdict
from hashlib import sha256
from html.parser import HTMLParser
import json
from pathlib import Path
import re
from urllib.parse import urlsplit, unquote

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "redesign/baseline"
VOID = set("area base br col embed hr img input link meta param source track wbr".split())

class Inventory(HTMLParser):
    def __init__(self):
        super().__init__()
        self.stack = []
        self.head, self.ids, self.links, self.resources, self.labels = [], [], [], [], []
        self.sections = defaultdict(list)
        self.text = []

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag not in VOID:
            self.stack.append((tag, a))
        tags = [t for t, _ in self.stack]
        if "head" in tags and tag != "head":
            self.head.append(dict(tag=tag, **a))
        if "id" in a:
            self.ids.append(a["id"])
        if tag == "a" and "href" in a:
            self.links.append(a)
        for key in ("href", "src", "poster", "data-src", "data-fallback-src", "srcset"):
            if key in a and not (tag == "a" and key == "href"):
                self.resources.append([tag, key, a[key]])
        for key in ("aria-label", "alt", "title"):
            if key in a:
                self.labels.append([tag, key, a[key]])

    def handle_endtag(self, tag):
        for idx in reversed(range(len(self.stack))):
            if self.stack[idx][0] == tag:
                del self.stack[idx:]
                return

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if tag not in VOID:
            self.handle_endtag(tag)

    def handle_data(self, data):
        s = " ".join(data.split())
        if not s:
            return
        tags = [t for t, _ in self.stack]
        if "title" in tags and "head" in tags:
            self.head.append({"title": s})
        if "body" not in tags or any(t in tags for t in ("style", "script")):
            return
        self.text.append(s)
        section = next((a.get("id", a.get("aria-labelledby", tag)) for tag, a in
                        reversed(self.stack) if tag in ("section", "header", "footer", "nav")), "body")
        self.sections[section].append(s)

def capture():
    pages = {}
    paths = [ROOT / "index.html", *sorted((ROOT / "case-studies").glob("*.html"))]
    for path in paths:
        parser = Inventory()
        parser.feed(path.read_text())
        pages[str(path.relative_to(ROOT))] = dict(
            sha256=sha256(path.read_bytes()).hexdigest(), head=parser.head,
            ids=parser.ids, links=parser.links, resources=parser.resources,
            labels=parser.labels, sections=parser.sections, text=" ".join(parser.text))
    usage = defaultdict(set)
    for page, item in pages.items():
        for url in ([l["href"] for l in item["links"]] + [r[2] for r in item["resources"]]):
            target = urlsplit(url)
            if target.scheme or not target.path:
                continue
            resolved = ((ROOT if url.startswith("/") else (ROOT / page).parent)
                        / unquote(target.path.lstrip("/"))).resolve()
            if ROOT in resolved.parents:
                usage[str(resolved.relative_to(ROOT))].add(page)
    for path in (ROOT / "futuristic").glob("*"):
        for url in re.findall(r"url\(['\"]?([^)'\"?#]+)", path.read_text()):
            resolved = (path.parent / url).resolve()
            if ROOT in resolved.parents:
                usage[str(resolved.relative_to(ROOT))].add(str(path.relative_to(ROOT)))
    files = {}
    for folder in ("assets", "futuristic"):
        for path in sorted((ROOT / folder).glob("*")):
            name = str(path.relative_to(ROOT))
            files[name] = dict(bytes=path.stat().st_size, sha256=sha256(path.read_bytes()).hexdigest(),
                               referenced_by=sorted(usage[name]))
    return {"pages": pages, "files": files}

if __name__ == "__main__":
    import argparse
    cli = argparse.ArgumentParser(description=__doc__)
    cli.add_argument("--output", type=Path, required=True, help="New manifest path")
    args = cli.parse_args()
    with args.output.open("x") as out:
        json.dump(capture(), out, indent=2, ensure_ascii=False)
        out.write("\n")
