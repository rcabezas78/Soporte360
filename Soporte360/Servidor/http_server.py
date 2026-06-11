import http.server
import socketserver
import json
import os
import subprocess
from urllib.parse import urlparse

BASE_DIR = r'D:\\Sistemas\\Soporte360\\Servidor\\Updates'
CLIENTS_FILE = os.path.join(BASE_DIR, 'clients.json')
COMMANDS_FILE = os.path.join(BASE_DIR, 'commands.json')
PORT = 8080


def load_clients():
    if os.path.exists(CLIENTS_FILE):
        with open(CLIENTS_FILE, 'r', encoding='utf-8-sig') as f:
            return json.load(f)
    return []


def save_clients(clients):
    with open(CLIENTS_FILE, 'w', encoding='utf-8') as f:
        json.dump(clients, f, ensure_ascii=False, indent=2)


def load_commands():
    if os.path.exists(COMMANDS_FILE):
        with open(COMMANDS_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {}


def save_commands(commands):
    with open(COMMANDS_FILE, 'w', encoding='utf-8') as f:
        json.dump(commands, f, ensure_ascii=False, indent=2)


class Handler(http.server.SimpleHTTPRequestHandler):

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_POST(self):
        parsed = urlparse(self.path)
        length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(length)
        try:
            data = json.loads(body)
        except json.JSONDecodeError:
            self._respond(400, {'error': 'JSON invalido'})
            return

        if parsed.path == '/registrar':
            nombre     = data.get('nombre', '').strip()
            ip         = data.get('ip', '').strip()
            soporte_id = data.get('soporte_id', '').strip()
            grupo      = data.get('grupo', '').strip()
            alias      = data.get('alias', '').strip()
            password   = data.get('password', '').strip()

            if not nombre or not ip:
                self._respond(400, {'error': 'Faltan campos: nombre, ip'})
                return

            clients = load_clients()
            for c in clients:
                if c.get('ip') == ip:
                    update = {'nombre': nombre, 'soporte_id': soporte_id, 'grupo': grupo, 'alias': alias}
                    if password:
                        update['password'] = password
                    c.update(update)
                    save_clients(clients)
                    self._respond(200, {'status': 'actualizado', 'ip': ip})
                    return

            entry = {'nombre': nombre, 'ip': ip, 'soporte_id': soporte_id, 'grupo': grupo, 'alias': alias}
            if password:
                entry['password'] = password
            clients.append(entry)
            save_clients(clients)
            self._respond(201, {'status': 'registrado', 'ip': ip})

        elif parsed.path == '/actualizar':
            original_ip = data.get('original_ip', '').strip()
            nombre      = data.get('nombre', '').strip()
            ip          = data.get('ip', '').strip()
            soporte_id  = data.get('soporte_id', '').strip()
            grupo       = data.get('grupo', '').strip()
            alias       = data.get('alias', '').strip()

            if not original_ip:
                self._respond(400, {'error': 'Falta campo: original_ip'})
                return

            clients = load_clients()
            for c in clients:
                if c.get('ip') == original_ip:
                    c.update({
                        'nombre': nombre or c.get('nombre', ''),
                        'ip': ip or original_ip,
                        'soporte_id': soporte_id,
                        'grupo': grupo,
                        'alias': alias
                    })
                    save_clients(clients)
                    self._respond(200, {'status': 'actualizado', 'ip': c['ip']})
                    return

            self._respond(404, {'error': 'Equipo no encontrado', 'ip': original_ip})

        elif parsed.path == '/eliminar':
            ip = data.get('ip', '').strip()
            if not ip:
                self._respond(400, {'error': 'Falta campo: ip'})
                return

            clients = load_clients()
            new_clients = [c for c in clients if c.get('ip') != ip]
            if len(new_clients) == len(clients):
                self._respond(404, {'error': 'Equipo no encontrado', 'ip': ip})
                return

            save_clients(new_clients)
            self._respond(200, {'status': 'eliminado', 'ip': ip})

        elif parsed.path == '/enviar-comando':
            ip     = data.get('ip', '').strip()
            accion = data.get('accion', '').strip()
            if not ip or not accion:
                self._respond(400, {'error': 'Faltan campos: ip, accion'})
                return
            commands = load_commands()
            commands[ip] = {'accion': accion}
            save_commands(commands)
            self._respond(200, {'status': 'comando_enviado', 'ip': ip, 'accion': accion})

        elif parsed.path.startswith('/comando-ok/'):
            ip = parsed.path.split('/comando-ok/')[-1].strip()
            if ip:
                commands = load_commands()
                commands.pop(ip, None)
                save_commands(commands)
            self._respond(200, {'status': 'ok'})

        else:
            self._respond(404, {'error': 'Endpoint no encontrado'})

    def do_GET(self):
        parsed = urlparse(self.path)

        if parsed.path == '/clients.json':
            clients = load_clients()
            self._respond(200, clients)

        elif parsed.path.startswith('/comando/'):
            ip = parsed.path.split('/comando/')[-1].strip()
            commands = load_commands()
            cmd = commands.get(ip, {})
            self._respond(200, cmd)

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
                self._respond(500, {'error': 'Respuesta de tailscale no es JSON valido'})

        else:
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
print(f'  POST /registrar   -> upsert cliente por IP')
print(f'  POST /actualizar  -> actualiza cliente por original_ip')
print(f'  POST /eliminar    -> elimina cliente por IP')
print(f'  GET  /clients.json')
print(f'  GET  /tailscale-status')

with socketserver.TCPServer(('', PORT), Handler) as httpd:
    httpd.serve_forever()
