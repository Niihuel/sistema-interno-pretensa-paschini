Set WshShell = CreateObject("WScript.Shell")
Set objFSO = CreateObject("Scripting.FileSystemObject")
' Obtener directorio actual
strPath = Replace(WScript.ScriptFullName, WScript.ScriptName, "")
' Ejecutar el script de inicio desde la carpeta scripts
WshShell.Run "wscript.exe """ & strPath & "scripts\start-sistema-hidden.vbs""", 0, False
