"""Serve the generated site on localhost, then open the default browser."""
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import functools, threading, webbrowser

root=Path(__file__).resolve().parents[1]/'dist'
if not (root/'index.html').is_file():
    raise SystemExit('Falta dist/index.html. Genera la web antes de abrirla.')
handler=functools.partial(SimpleHTTPRequestHandler,directory=str(root))
server=ThreadingHTTPServer(('127.0.0.1',4321),handler)
url='http://127.0.0.1:4321/'
print('Cuenta Clara: '+url+'\nCierra esta ventana para detener la vista previa.',flush=True)
threading.Timer(0.7,lambda:webbrowser.open(url)).start()
try:server.serve_forever()
except KeyboardInterrupt:pass
finally:server.server_close()
