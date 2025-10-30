Set WshShell = CreateObject("WScript.Shell")
Set objFSO = CreateObject("Scripting.FileSystemObject")
' Obtener directorio actual
strPath = Replace(WScript.ScriptFullName, WScript.ScriptName, "")
' Ejecutar el script de detención desde la carpeta scripts
WshShell.Run "wscript.exe """ & strPath & "scripts\stop-sistema-hidden.vbs""", 0, False
