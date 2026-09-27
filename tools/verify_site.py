"""Validate the buildless site's local links and portfolio structure."""
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit


ROOT = Path(__file__).resolve().parents[1]
PAGES = [ROOT / "index.html", *ROOT.glob("work/*.html"), *ROOT.glob("public/resume/*.html")]


class Page(HTMLParser):
    def __init__(self, path):
        super().__init__()
        self.path = path
        self.ids = []
        self.refs = []
        self.errors = []
        self.feed(path.read_text(encoding="utf-8"))

    def handle_starttag(self, tag, attributes):
        attrs = dict(attributes)
        if "id" in attrs:
            self.ids.append(attrs["id"])
        for key in ("href", "src", "data-photo"):
            if attrs.get(key):
                self.refs.append(attrs[key])
        if tag == "img" and "alt" not in attrs:
            self.errors.append("Image missing alt attribute")


pages = {path.resolve(): Page(path) for path in PAGES}
errors = []
references = 0
for path, page in pages.items():
    errors.extend(f"{path.name}: {error}" for error in page.errors)
    errors.extend(f"{path.name}: duplicate id {key}" for key, count in Counter(page.ids).items() if count > 1)
    for ref in page.refs:
        url = urlsplit(ref)
        if url.scheme or url.netloc:
            continue
        references += 1
        target = (path.parent / unquote(url.path)).resolve() if url.path else path
        if not target.is_relative_to(ROOT) or not target.is_file():
            errors.append(f"{path.name}: missing or out-of-root target {ref}")
        elif url.fragment and target in pages and unquote(url.fragment) not in pages[target].ids:
            errors.append(f"{path.name}: missing fragment {ref}")

home = pages[(ROOT / "index.html").resolve()]
for identifier in ("projects", "aluminum", "steel", "concrete", "research", "about",
                   "experience", "teaching", "expertise", "software", "resume", "contact", "top"):
    if identifier not in home.ids:
        errors.append(f"Missing portfolio anchor: {identifier}")

if errors:
    raise SystemExit("\n".join(errors))
print(f"PASS: {len(pages)} HTML pages, {references} local references, and all portfolio anchors.")
