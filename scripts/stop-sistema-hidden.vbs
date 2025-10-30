Set WshShell = CreateObject("WScript.Shell")
' Detener Backend (PM2)
WshShell.Run "cmd /c pm2 delete all", 0, False
WScript.Sleep 1000
' Detener Frontend (serve)
WshShell.Run "cmd /c for /f ""tokens=5"" %a in ('netstat -aon ^| find "":4350"" ^| find ""LISTENING""') do taskkill /F /PID %a", 0, False
' Mensaje de confirmación (opcional, puedes comentarlo)
' MsgBox "Sistema IT detenido correctamente", vbInformation, "Sistema IT"
