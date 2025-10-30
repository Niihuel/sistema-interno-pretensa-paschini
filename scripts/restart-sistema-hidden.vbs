Set WshShell = CreateObject("WScript.Shell")
' Reiniciar PM2 de forma oculta
WshShell.Run "cmd /c pm2 restart all", 0, True
WScript.Sleep 1000
' Mensaje de confirmación (opcional, puedes comentarlo)
' MsgBox "Sistema IT reiniciado correctamente", vbInformation, "Sistema IT"
