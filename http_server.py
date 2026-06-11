import http.server
import socketserver
import json
import os
import subprocess
from urllib.parse import urlparse

BASE_DIR = r'D:\Sistemas\Soporte360\Updates'
CLIENTS_FILE = os.path.join(BASE_DIR, 'clients.json')
PORT = 8080


def load_clients():
    if os.path.exists(CLIENTS_FILE):
        with open(CLIENTS_FILE, 'r', encoding='utf-8-sig') as f:
            return json.load(f)
    return []


def save_clients(clients):
    with open(CLIENTS_FILE, 'w', encoding='utf-8') as f:
        json.dump(clients, f, ensure_ascii=False, indent=2)


class Handler(http.server.SimpleHTTPRequestHandler):

    def do_POST(self):
        parsed = urlparse(self.path)
        if parsed.path == '/registrar':
            length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(length)
            try:
                data = json.loads(body)
            except json.JSONDecodeError:
                self._respond(400, {'error': 'JSON inválido'})
                return

            nombre    = data.get('nombre', '').strip()
            ip        = data.get('ip', '').strip()
            soporte_id = data.get('soporte_id', '').strip()
            grupo     = data.get('grupo', '').strip()

            if not nombre or not ip or not soporte_id:
                self._respond(400, {'error': 'Faltan campos: nombre, ip, soporte_id'})
                return

            clients = load_clients()

            # Actualiza si ya existe el soporte_id, sino agrega
            for c in clients:
                if c.get('soporte_id') == soporte_id:
                    c.update({'nombre': nombre, 'ip': ip, 'grupo': grupo})
                    save_clients(clients)
                    self._respond(200, {'status': 'actualizado', 'soporte_id': soporte_id})
                    return

            clients.append({'nombre': nombre, 'ip': ip, 'soporte_id': soporte_id, 'grupo': grupo})
            save_clients(clients)
            self._respond(201, {'status': 'registrado', 'soporte_id': soporte_id})
        else:
            self._respond(404, {'error': 'Endpoint no encontrado'})

    def do_GET(self):
        parsed = urlparse(self.path)

        if parsed.path == '/clients.json':
            clients = load_clients()
            self._respond(200, clients)

        elif parsed.path == '/tailscale-status':
            try:
                result = subprocess.run(
                    [r'C:\Program Files\Tailscale\tailscale.exe', 'status', '--json'],
                    capture_output=True, text=True, timeout=10
                )
                data = json.loads(result.stdout) if result.stdout else {}
                self._respond(200, data)
            except FileNotFoundError:
                self._respond(500, {'error': 'Tailscale no encontrado en PATH'})
            except subprocess.TimeoutExpired:
                self._respond(504, {'error': 'Timeout al ejecutar tailscale'})
            except json.JSONDecodeError:
                self._respond(500, {'error': 'Respuesta de tailscale no es JSON válido'})

        else:
            # Sirve archivos estáticos desde BASE_DIR para el resto de rutas
            os.chdir(BASE_DIR)
            super().do_GET()

    def _respond(self, code, payload):
        body = json.dumps(payload, ensure_ascii=False).encode('utf-8')
        self.send_response(code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, format, *args):
        print(f'[{self.address_string()}] {format % args}')


os.makedirs(BASE_DIR, exist_ok=True)
os.chdir(BASE_DIR)
print(f'Servidor corriendo en http://0.0.0.0:{PORT}')
print(f'  POST /registrar        -> guarda cliente en clients.json')
print(f'  GET  /clients.json     -> lista de clientes')
print(f'  GET  /tailscale-status -> estado de Tailscale en JSON')

with socketserver.TCPServer(('', PORT), Handler) as httpd:
    httpd.serve_forever()
