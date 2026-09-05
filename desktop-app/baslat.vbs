' LabStock masaüstü başlatıcısı.
'
' Ne yapar: sunucu (standalone Next.js build) çalışmıyorsa arka planda,
' görünmez şekilde başlatır; sonra Microsoft Edge'i "uygulama modunda"
' (adres çubuğu/sekmeler olmadan, sanki ayrı bir program gibi) açar.
'
' Gerekli: `npm run build:desktop` en az bir kere çalıştırılmış olmalı
' (bkz. desktop-app/README.md).

Dim shell, fso, scriptDir, port, url

Set shell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
port = "4317"
url = "http://127.0.0.1:" & port & "/"

If Not SunucuHazirMi() Then
  shell.Environment("PROCESS")("PORT") = port
  shell.Environment("PROCESS")("HOSTNAME") = "127.0.0.1"
  shell.Environment("PROCESS")("NODE_ENV") = "production"
  shell.CurrentDirectory = scriptDir & "\..\.next\standalone"
  shell.Run "node ""server.js""", 0, False

  Dim denemeSayisi
  denemeSayisi = 0
  Do While (Not SunucuHazirMi()) And denemeSayisi < 60
    WScript.Sleep 300
    denemeSayisi = denemeSayisi + 1
  Loop
End If

shell.Run """" & EdgeYolu() & """ --app=" & url, 1, False

Function SunucuHazirMi()
  ' Not: MSXML2.XMLHTTP (WinInet tabanlı) kapalı bir porta bağlanırken
  ' bazı sistemlerde süresiz askıda kalabiliyor. MSXML2.ServerXMLHTTP
  ' (WinHTTP tabanlı) hem setTimeouts'u düzgün destekliyor hem de kapalı
  ' portta anında hata veriyor.
  Dim h, hataNo, durum
  SunucuHazirMi = False
  On Error Resume Next
  Err.Clear
  Set h = CreateObject("MSXML2.ServerXMLHTTP.6.0")
  h.setTimeouts 1500, 1500, 1500, 1500
  h.Open "GET", url, False
  h.Send
  hataNo = Err.Number
  durum = -1
  durum = h.Status
  If hataNo = 0 And durum >= 100 And durum < 600 Then SunucuHazirMi = True
  On Error Goto 0
End Function

Function EdgeYolu()
  Dim adaylar(1)
  adaylar(0) = shell.ExpandEnvironmentStrings("%ProgramFiles(x86)%") & "\Microsoft\Edge\Application\msedge.exe"
  adaylar(1) = shell.ExpandEnvironmentStrings("%ProgramFiles%") & "\Microsoft\Edge\Application\msedge.exe"
  Dim i
  For i = 0 To 1
    If fso.FileExists(adaylar(i)) Then
      EdgeYolu = adaylar(i)
      Exit Function
    End If
  Next
  EdgeYolu = "msedge.exe"
End Function
