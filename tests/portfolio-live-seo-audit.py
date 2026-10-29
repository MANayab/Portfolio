#!/usr/bin/env python3
"""Live production SEO smoke test for the GitHub Pages portfolio."""
import json
import sys
import urllib.error
import urllib.request
import xml.etree.ElementTree as ET
from html.parser import HTMLParser

BASE = "https://manayab.github.io/Portfolio/"
EXPECTED = BASE
TIMEOUT = 20

class PageParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.meta = {}
        self.links = []
        self.jsonld = []
        self._jsonld_active = False
        self._jsonld_parts = []
        self.title_parts = []
        self._title_active = False

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "meta":
            key = a.get("property") or a.get("name")
            if key:
                self.meta[key.lower()] = a.get("content", "")
        elif tag == "link":
            self.links.append(a)
        elif tag == "script" and a.get("type", "").lower() == "application/ld+json":
            self._jsonld_active = True
            self._jsonld_parts = []
        elif tag == "title":
            self._title_active = True

    def handle_data(self, data):
        if self._jsonld_active:
            self._jsonld_parts.append(data)
        if self._title_active:
            self.title_parts.append(data)

    def handle_endtag(self, tag):
        if tag == "script" and self._jsonld_active:
            self.jsonld.append("".join(self._jsonld_parts))
            self._jsonld_active = False
        elif tag == "title":
            self._title_active = False

def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": "MANayab-Portfolio-Live-SEO-Audit/1.0"})
    with urllib.request.urlopen(req, timeout=TIMEOUT) as response:
        body = response.read()
        if response.status != 200:
            raise AssertionError(f"{url}: expected HTTP 200, got {response.status}")
        return body, response.headers.get_content_type()

def require(condition, message):
    if not condition:
        raise AssertionError(message)
    print("PASS", message)

def collect_types(value, found):
    if isinstance(value, dict):
        typ = value.get("@type")
        if isinstance(typ, str):
            found.add(typ)
        elif isinstance(typ, list):
            found.update(t for t in typ if isinstance(t, str))
        for child in value.values():
            collect_types(child, found)
    elif isinstance(value, list):
        for child in value:
            collect_types(child, found)

def main():
    raw, content_type = fetch(BASE)
    require(content_type == "text/html", f"live home page is HTML ({content_type})")
    parser = PageParser()
    parser.feed(raw.decode("utf-8", errors="replace"))
    require(bool("".join(parser.title_parts).strip()), "document title is present")
    canonical = next((x.get("href", "") for x in parser.links if "canonical" in x.get("rel", "").lower().split()), "")
    require(canonical == EXPECTED, f"canonical matches {EXPECTED}")
    require(bool(parser.meta.get("description")), "meta description is present")
    require(parser.meta.get("robots", "").lower() in ("index, follow", "index,follow"), "robots meta allows indexing")

    for key in ("og:type", "og:title", "og:description", "og:url", "og:site_name", "twitter:card", "twitter:title", "twitter:description"):
        require(bool(parser.meta.get(key)), f"social preview metadata {key} is present")
    require(parser.meta.get("og:url") == EXPECTED, "Open Graph URL matches canonical URL")
    image_url = parser.meta.get("og:image", "")
    require(image_url == BASE + "social-preview.svg", "Open Graph image points to the portfolio's published social-preview.svg")
    require(parser.meta.get("twitter:image") == image_url, "Twitter image matches the Open Graph image")
    require(parser.meta.get("twitter:card") == "summary_large_image", "Twitter card requests a large image preview")
    require(parser.meta.get("og:image:type") == "image/svg+xml", "Open Graph image type is PNG")
    image_body, image_type = fetch(image_url)
    require(image_type == "image/svg+xml", f"social preview image is served as PNG ({image_type})")
    require(len(image_body) > 1000 and image_body.lstrip().startswith(b"<svg") or b"<svg" in image_body[:300], "social preview image is a non-empty valid PNG response")

    found_types = set()
    for block in parser.jsonld:
        try:
            data = json.loads(block)
        except json.JSONDecodeError as exc:
            raise AssertionError(f"JSON-LD is invalid JSON: {exc}") from exc
        collect_types(data, found_types)
    require(bool(parser.jsonld), "JSON-LD structured data block is present and valid JSON")
    for typ in ("Person", "SoftwareApplication", "ProfilePage", "BreadcrumbList"):
        require(typ in found_types, f"structured data includes {typ}")

    sitemap_url = BASE + "sitemap.xml"
    sitemap_body, sitemap_type = fetch(sitemap_url)
    root = ET.fromstring(sitemap_body)
    locs = [node.text.strip() for node in root.iter() if node.tag.endswith("loc") and node.text]
    require(root.tag.endswith("urlset"), "sitemap.xml has a urlset root")
    require(EXPECTED in locs, "sitemap includes the canonical portfolio URL")

    robots_body, _ = fetch(BASE + "robots.txt")
    robots = robots_body.decode("utf-8", errors="replace")
    require(any(line.strip().lower() == "user-agent: *" for line in robots.splitlines()), "robots.txt has a global user-agent rule")
    require(any(line.strip() == f"Sitemap: {sitemap_url}" for line in robots.splitlines()), "robots.txt points to the live sitemap")
    print("LIVE SEO AUDIT PASSED")
if __name__ == "__main__":
    try:
        main()
    except (AssertionError, urllib.error.URLError, TimeoutError, ET.ParseError) as exc:
        print(f"FAIL {exc}", file=sys.stderr)
        sys.exit(1)
