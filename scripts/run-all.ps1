$rootDir = Split-Path -Parent $PSScriptRoot

$apps = @(
  @{
    Name = 'backend'
    Path = Join-Path $rootDir 'backend'
    Command = 'npm.cmd run dev'
  },
  @{
    Name = 'frontend'
    Path = Join-Path $rootDir 'frontend'
    Command = '$env:PORT="3000"; $env:BROWSER="none"; npm.cmd start'
  }
)

foreach ($app in $apps) {
  Start-Process powershell.exe -WorkingDirectory $app.Path -ArgumentList @(
    '-NoExit',
    '-ExecutionPolicy', 'Bypass',
    '-Command',
    "Set-Location -LiteralPath '$($app.Path)'; $($app.Command)"
  )
}
