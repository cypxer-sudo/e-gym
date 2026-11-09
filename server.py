import http.server
import socketserver
import webbrowser
import os
import sys

PORT = 8000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))
if os.path.exists(os.path.join(DIRECTORY, "public")):
    DIRECTORY = os.path.join(DIRECTORY, "public")

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

def start_server():
    global PORT
    for attempt in range(5):
        try:
            with socketserver.TCPServer(("", PORT), Handler) as httpd:
                url = f"http://localhost:{PORT}"
                print("=" * 65)
                print("  E-GYM — The Self-Development Platform | BECOME UNREAL")
                print("=" * 65)
                print(f"  * Serving at: {url}")
                print(f"  * Local directory: {DIRECTORY}")
                print("  * Press Ctrl+C in this terminal to stop the server.")
                print("=" * 65)
                
                try:
                    webbrowser.open(url)
                except Exception as e:
                    print(f"Note: Could not automatically launch browser: {e}")
                
                httpd.serve_forever()
        except OSError as e:
            if e.errno == 98 or e.winerror == 10048: # Port already in use
                PORT += 1
                continue
            raise

if __name__ == "__main__":
    try:
        start_server()
    except KeyboardInterrupt:
        print("\nE-GYM Server stopped safely.")
        sys.exit(0)
