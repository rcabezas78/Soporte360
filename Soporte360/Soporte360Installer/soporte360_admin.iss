; ============================================================
;  Soporte360 - Instalador Admin
;  Compilar con Inno Setup 6.x
;  Todos los archivos fuente deben estar en la misma carpeta
;  que este .iss al momento de compilar.
; ============================================================

#define AppName      "Soporte360"
#define AppVersion   "1.4.9"
#define AppPublisher "FRCM"
#define AppExeName   "soporte360.exe"
#define InstallDir   "{commonappdata}\Soporte360"

[Setup]
AppName={#AppName}
AppVersion={#AppVersion}
AppPublisherURL=http://100.85.203.15:21114
AppPublisher={#AppPublisher}
DefaultDirName={#InstallDir}
DisableDirPage=yes
DisableProgramGroupPage=yes
OutputBaseFilename=Soporte360_Admin_Setup
OutputDir=Output
Compression=lzma2
SolidCompression=yes
PrivilegesRequired=admin
UninstallDisplayIcon={app}\{#AppExeName}
UninstallDisplayName={#AppName}
; No mostrar licencia ni paginas innecesarias
DisableWelcomePage=no
DisableReadyPage=yes

[Languages]
Name: "spanish"; MessagesFile: "compiler:Languages\Spanish.isl"

[Files]
; Archivos principales - se copian por el instalador (no por cmd.exe)
Source: "soporte360.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "sciter.dll";     DestDir: "{app}"; Flags: ignoreversion
Source: "updater.bat";          DestDir: "{app}"; Flags: ignoreversion skipifsourcedoesntexist
Source: "agente_comandos.ps1"; DestDir: "{app}"; Flags: ignoreversion skipifsourcedoesntexist


[Registry]
; Autostart del tray para todos los usuarios
Root: HKLM; Subkey: "SOFTWARE\Microsoft\Windows\CurrentVersion\Run"; \
    ValueType: string; ValueName: "Soporte360Tray"; \
    ValueData: """{app}\{#AppExeName}"""; Flags: uninsdeletevalue

[Icons]
; Acceso directo en escritorio publico (todos los usuarios)
Name: "{commondesktop}\Soporte360"; Filename: "{app}\{#AppExeName}"; \
    Comment: "Soporte360 - Control Remoto"

[Code]
// Escribe el archivo version.txt correctamente (el INI section no sirve para texto plano)
procedure WriteVersionFile();
var
  FilePath: String;
  Lines: TArrayOfString;
begin
  FilePath := ExpandConstant('{app}\version.txt');
  SetArrayLength(Lines, 1);
  Lines[0] := '1.4.9';
  SaveStringsToFile(FilePath, Lines, False);
end;

// Escribe el archivo de configuracion del servidor
procedure WriteConfig(Path: String);
var
  Lines: TArrayOfString;
begin
  ForceDirectories(Path);
  SetArrayLength(Lines, 5);
  Lines[0] := '[options]';
  Lines[1] := 'custom-rendezvous-server = "100.85.203.15:21116"';
  Lines[2] := 'relay-server = "100.85.203.15:21117"';
  Lines[3] := 'api-server = "http://100.85.203.15:21114"';
  Lines[4] := 'key = "wlbUUND37G8QNPvgHIRUnsuKE9BlZVaIMYh7sWtrXOo="';
  SaveStringsToFile(Path + '\Soporte360.toml', Lines, False);
end;

procedure CurStepChanged(CurStep: TSetupStep);
var
  ResultCode: Integer;
  UserConfig: String;
  SysConfig:  String;
begin
  if CurStep = ssPostInstall then
  begin
    // version.txt
    WriteVersionFile();

    // Config usuario actual
    UserConfig := GetEnv('APPDATA') + '\Soporte360\config';
    WriteConfig(UserConfig);

    // Config cuenta SYSTEM
    SysConfig := 'C:\Windows\System32\config\systemprofile\AppData\Roaming\Soporte360\config';
    WriteConfig(SysConfig);

    // Instalar servicio
    Exec(ExpandConstant('{app}\{#AppExeName}'), '--install-service', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);

    // Iniciar servicio
    Exec('net.exe', 'start Soporte360', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);

    // Registrar tarea del agente cada 5 minutos como SYSTEM
    Exec('schtasks.exe', '/create /tn "Soporte360Agente" /tr "powershell -NoProfile -ExecutionPolicy Bypass -File \"C:\ProgramData\Soporte360\agente_comandos.ps1\"" /sc minute /mo 5 /ru SYSTEM /f', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);

    // Ejecutar agente inmediatamente para aparecer en dashboard al instante
    Exec('powershell.exe', '-NoProfile -ExecutionPolicy Bypass -File "C:\ProgramData\Soporte360\agente_comandos.ps1"', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
  end;
end;

// Al desinstalar: detener y remover servicio
procedure CurUninstallStepChanged(CurUninstallStep: TUninstallStep);
var
  ResultCode: Integer;
begin
  if CurUninstallStep = usUninstall then
  begin
    Exec('net.exe', 'stop Soporte360', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
    Exec(ExpandConstant('{app}\{#AppExeName}'), '--uninstall-service', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
  end;
end;
