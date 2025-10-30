Set WshShell = CreateObject("WScript.Shell")
Set objFSO = CreateObject("Scripting.FileSystemObject")
' Obtener directorio raíz del proyecto (un nivel arriba de scripts)
strScriptPath = Replace(WScript.ScriptFullName, WScript.ScriptName, "")
strRootPath = objFSO.GetParentFolderName(strScriptPath) & "\"
' Detener procesos anteriores
WshShell.Run "cmd /c pm2 delete all", 0, False
WshShell.Run "cmd /c taskkill /F /IM node.exe /FI ""WINDOWTITLE eq serve*""", 0, False
' Esperar 2 segundos
WScript.Sleep 2000
' Iniciar Backend con PM2 de forma oculta
WshShell.Run "cmd /c cd /d """ & strRootPath & """ && pm2 start scripts\ecosystem.config.js && pm2 save", 0, False
' Esperar 2 segundos
WScript.Sleep 2000
' Iniciar Frontend con serve de forma oculta
WshShell.Run "cmd /c cd /d """ & strRootPath & "frontend"" && serve -s dist -p 4350", 0, False
