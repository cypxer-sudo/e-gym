import os
import sys
import re

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
INDEX_PATH = os.path.join(BASE_DIR, "public", "index.html")
CSS_PATH = os.path.join(BASE_DIR, "public", "css", "styles.css")
APP_JS_PATH = os.path.join(BASE_DIR, "public", "js", "app.js")

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

with open(INDEX_PATH, "r", encoding="utf-8") as f:
    html = f.read()

with open(CSS_PATH, "r", encoding="utf-8") as f:
    css = f.read()

with open(APP_JS_PATH, "r", encoding="utf-8") as f:
    js = f.read()

passed = 0
failed = 0

def test(name, condition, details=""):
    global passed, failed
    if condition:
        print(f"  [PASS] {name}")
        passed += 1
    else:
        print(f"  [FAIL] {name} - {details}")
        failed += 1

print("\n=== E-GYM UI/UX & RESPONSIVE VERIFICATION SUITE ===\n")

print("[1] Mobile Bottom Navigation Dock:")
test("Mobile bottom nav exists in HTML", 'class="mobile-bottom-nav"' in html)
mobile_tabs = re.findall(r'class="[^"]*mobile-nav-btn[^"]*"[^>]*data-view="([^"]+)"', html)
test("Mobile bottom nav has 6 primary tabs", len(mobile_tabs) == 6, f"Found: {mobile_tabs}")
for expected in ["hq", "challenges", "departments", "ranks", "profile", "community"]:
    test(f'Mobile tab for view "{expected}" present', expected in mobile_tabs)
test("Mobile nav min-height 48px in CSS", "min-height: 48px" in css)
test("Safe area insets handled in bottom nav", "env(safe-area-inset-bottom" in css)

print("\n[2] Responsive Breakpoints Coverage (320px - 1920px):")
required_breakpoints = [
    ("Small Mobile (320px - 380px)", "@media (max-width: 380px)"),
    ("Standard Mobile (380px - 640px)", "@media (max-width: 640px)"),
    ("Large Mobile and Bottom Nav (<= 768px)", "@media (max-width: 768px)"),
    ("Mid-range Tablet / Landscape (<= 900px)", "@media (max-width: 900px)"),
    ("Tablet and Compact Desktop (<= 1024px)", "@media (max-width: 1024px)")
]
for label, bp in required_breakpoints:
    test(f"Breakpoint {label} defined in CSS", bp in css)

test("Root horizontal overflow prevented on mobile", "overflow-x: hidden" in css)
test("Viewport meta includes viewport-fit=cover", "viewport-fit=cover" in html)

print("\n[3] Touch Targets and Mobile Usability (>= 44px):")
test("Min touch target 44px on .btn in mobile", "min-height: 44px" in css)
test("Modal close button touch target enforced", ".modal-close-btn" in css and "min-height: 44px" in css)
test("Form inputs 16px font-size to prevent mobile auto-zoom", "font-size: 16px" in css)

print("\n[4] Apple-Inspired Motion Design and Interactions:")
test("Smooth view transition animation defined", "@keyframes viewFadeIn" in css)
test("Active view triggers fade-in animation", "animation: viewFadeIn" in css)
test("Modal pop entrance animation defined", "@keyframes modalScaleUp" in css)
test("Tactile button scale depression on active", "transform: scale(0.975)" in css or "transform: scale(0.98)" in css)
test("Card hover subtle elevation defined", "transform: translateY(-2px)" in css)
test("Accessibility: prefers-reduced-motion respected", "@media (prefers-reduced-motion: reduce)" in css)

print("\n[5] Keyboard Accessibility and Usability:")
test("ESC key dismisses active modals in app.js", "Escape" in js)
test("Backdrop click dismisses active modal overlay", 'overlay.classList.remove("open")' in js)
test("Visible focus ring for keyboard navigation", ":focus-visible" in css)

print("\n[6] Screen Space Optimization:")
test("Empty state card defined for Today Objectives", "empty-state-card" in js)
test("Compact stats grid defined in CSS", ".stats-bar" in css)
test("Fluid challenges grid layout defined", ".challenges-grid" in css)

print(f"\n=======================================================")
print(f"UI/UX OVERHAUL VERIFICATION: {passed} PASSED, {failed} FAILED")
print(f"=======================================================\n")

if failed > 0:
    sys.exit(1)
