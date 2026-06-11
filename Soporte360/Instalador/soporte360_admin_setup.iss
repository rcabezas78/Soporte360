#define MyAppName "Soporte360"
#define MyAppVersion "1.4.9"
#define MyAppPublisher "FRCM"
#define MyAppExeName "soporte360.exe"
#define InstallDir "C:\ProgramData\Soporte360"

[Setup]
AppId={{B4F2A1C3-8D7E-4F2A-9B3C-1D4E5F6A7B8C}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
DefaultDirName={#InstallDir}
DisableDirPage=yes
DefaultGroupName={#MyAppName}
DisableProgramGroupPage=yes
OutputDir=Output
OutputBaseFilename=Soporte360_Admin_Setup
Compression=lzma
SolidCompression=yes
PrivilegesRequired=admin
UninstallDisplayIcon={app}\soporte360.exe
UninstallDisplayName=Soporte360

[Languages]
Name: "spanish"; MessagesFile: "compiler:Languages\Spanish.isl"

[Files]
Source: "soporte360.exe";        DestDir: "{app}"; Flags: ignoreversion
Source: "sciter.dll";            DestDir: "{app}"; Flags: ignoreversion
Source: "updater.bat";           DestDir: "{app}"; Flags: ignoreversion skipifsourcedoesntexist
Source: "agente_comandos.ps1";   DestDir: "{app}"; Flags: ignoreversion skipifsourcedoesntexist

[Icons]
Name: "{commondesktop}\Soporte360"; Filename: "{app}\soporte360.exe"; Comment: "Soporte360 - Control Remoto"

[Registry]
; Autostart tray
Root: HKLM; Subkey: "SOFTWARE\Microsoft\Windows\CurrentVersion\Run"; ValueType: string; ValueName: "Soporte360Tray"; ValueData: """{app}\soporte360.exe"""; Flags: uninsdeletevalue

[Code]
var
  ResultCode: Integer;

procedure CurStepChanged(CurStep: TSetupStep);
var
  ConfigContent: string;
  UserConfigDir: string;
  SysConfigDir: string;
begin
  if CurStep = ssPostInstall then
  begin
    // Escribir version
    SaveStringToFile(ExpandConstant('{app}\version.txt'), '1.4.9', False);

    // Configuracion del servidor - usuario actual
    UserConfigDir := ExpandConstant('{userappdata}\Soporte360\config');
    if not DirExists(ExpandConstant('{userappdata}\Soporte360')) then
      CreateDir(ExpandConstant('{userappdata}\Soporte360'));
    if not DirExists(UserConfigDir) then
      CreateDir(UserConfigDir);

    ConfigContent :=
      '[options]' + #13#10 +
      'custom-rendezvous-server = "100.85.203.15:21116"' + #13#10 +
      'relay-server = "100.85.203.15:21117"' + #13#10 +
      'api-server = "http://100.85.203.15:21114"' + #13#10 +
      'key = "wlbUUND37G8QNPvgHIRUnsuKE9BlZVaIMYh7sWtrXOo="';

    SaveStringToFile(UserConfigDir + '\Soporte360.toml', ConfigContent, False);

    // Configuracion del servidor - SYSTEM
    SysConfigDir := 'C:\Windows\System32\config\systemprofile\AppData\Roaming\Soporte360\config';
    if not DirExists('C:\Windows\System32\config\systemprofile\AppData\Roaming\Soporte360') then
      CreateDir('C:\Windows\System32\config\systemprofile\AppData\Roaming\Soporte360');
    if not DirExists(SysConfigDir) then
      CreateDir(SysConfigDir);
    SaveStringToFile(SysConfigDir + '\Soporte360.toml', ConfigContent, False);

    // Instalar y arrancar servicio
    Exec(ExpandConstant('{app}\soporte360.exe'), '--install-service', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
    Exec('net.exe', 'start Soporte360', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);

    // Registrar tarea programada del agente (cada 5 minutos como SYSTEM)
    Exec('schtasks.exe',
      '/create /tn "Soporte360Agente" /tr "powershell -NoProfile -ExecutionPolicy Bypass -File C:\ProgramData\Soporte360\agente_comandos.ps1" /sc minute /mo 5 /ru SYSTEM /f',
      '', SW_HIDE, ewWaitUntilTerminated, ResultCode);

    // Ejecutar agente por primera vez para que aparezca en dashboard inmediatamente
    Exec('powershell.exe',
      '-NoProfile -ExecutionPolicy Bypass -File "C:\ProgramData\Soporte360\agente_comandos.ps1"',
      '', SW_HIDE, ewNoWait, ResultCode);

    // Arrancar tray
    Exec(ExpandConstant('{app}\soporte360.exe'), '', '', SW_SHOW, ewNoWait, ResultCode);
  end;
end;

procedure CurUninstallStepChanged(CurUninstallStep: TUninstallStep);
begin
  if CurUninstallStep = usUninstall then
  begin
    Exec('schtasks.exe', '/delete /tn "Soporte360Agente" /f', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
    Exec(ExpandConstant('{app}\soporte360.exe'), '--uninstall-service', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
    Exec('taskkill.exe', '/IM soporte360.exe /F', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
  end;
end;
