; Script generated by the Inno Setup Script Wizard.
; SEE THE DOCUMENTATION FOR DETAILS ON CREATING INNO SETUP SCRIPT FILES!

[Setup]
; NOTE: The value of AppId uniquely identifies this application.
; Do not use the same AppId value in installers for other applications.
; (To generate a new GUID, click Tools | Generate GUID inside the IDE.)
AppId={{6C182ACB-88CC-4DA6-BB7C-CD484F9E0648}
AppName=Apps SDK
AppVersion=0.2.4
;AppVerName=Apps SDK 0.2.4
AppPublisher=BitTorrent, Inc.
AppPublisherURL=http://btapps-sdk.bittorrent.com/
AppSupportURL=http://btapps-sdk.bittorrent.com/
AppUpdatesURL=http://btapps-sdk.bittorrent.com/
DefaultDirName={pf}\apps-sdk
DefaultGroupName=Apps SDK
AllowNoIcons=yes
LicenseFile=C:\apps-sdk\License.txt
OutputDir=.
OutputBaseFilename=setup
Compression=lzma
SolidCompression=yes

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Files]
Source: "C:\apps-sdk\loader\dist\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs
; NOTE: Don't use "Flags: ignoreversion" on any shared system files

[Icons]
Name: "{group}\{cm:UninstallProgram,Apps SDK}"; Filename: "{uninstallexe}"

