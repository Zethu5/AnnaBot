Param (
        [Parameter(Mandatory=$true, 
                   ValueFromPipeline=$true,
                   ValueFromPipelineByPropertyName=$true, 
                   ValueFromRemainingArguments=$false, 
                   Position=0)]
        [ValidateNotNull()]
        [ValidateNotNullOrEmpty()]
        [String]
        $spreadsheet_date
)

$ErrorActionPreference = 'SilentlyContinue'

Import-Module psexcel
$mvp_spreadsheet_time_data = Import-XLSX -Path '..\mvp_spreadsheet.xlsx' -RowStart 1
$mvp_spreadsheet_time_data = $mvp_spreadsheet_time_data[1..($mvp_spreadsheet_time_data.Length)]
$mvp_spreadsheet_player_data = Import-XLSX -Path '..\mvp_spreadsheet.xlsx' -RowStart 2


[pscustomobject] $data = @()
[datetime] $now = Get-Date
[int] $spreadsheet_month = [int] ($spreadsheet_date -replace "\/\d+","")
[int] $spreadsheet_day = [int] ($spreadsheet_date -replace "\d+\/","")
[string] $cell_datetime_string = ""
[string] $teleportTo = ""
[bool] $new_day = $false

# Server (UTC) - UTC Time (+3 for Israel)
[int] $utc_hours_difference_from_israel = 3

for([int] $i = 0; $i -lt $mvp_spreadsheet_time_data.Length; $i++)
{
    Write-Host "--------------------------------------------"
    Write-Host "==================== $i ====================" -ForegroundColor Yellow

    $cell_datetime = [DateTime]::FromOADate($mvp_spreadsheet_time_data[$i].'Server (UTC)')
    $cell_datetime = Get-Date -Year $now.Year -Month $spreadsheet_month -Day $spreadsheet_day -Hour $cell_datetime.Hour -Minute $cell_datetime.Minute
    $cell_datetime = $cell_datetime.AddHours($utc_hours_difference_from_israel)

    if($cell_datetime.ToShortTimeString() -eq "12:00 AM")
    {
        Write-Host "NEW DAY!"
        $data += @{time=$cell_datetime_string
                   location="NEW DAY"
                   teleportTo="NEW DAY"
                   dateString=(Get-Date $cell_datetime -Format "yyyy-MM-dd")
                   type="different"}

        $new_day = $true
        continue
    }

    if($mvp_spreadsheet_player_data[$i].Discord -eq "FLAG")
    {
        Write-Host "FLAG!"
        continue
    }

    if($mvp_spreadsheet_player_data[$i].Discord -eq "RESET")
    {
        Write-Host "RESET!"
        $data += @{time=$cell_datetime.ToShortTimeString()
                   location="RESET"
                   teleportTo="RESET"
                   type="different"}
    }

    if($now - $cell_datetime -gt 0 -or `
       !$mvp_spreadsheet_player_data[$i].Location)
    {
        if($now - $cell_datetime -gt 0)
        {
            Write-Host "TIME PASSED!: $($now - $cell_datetime)"
        } else {
            Write-Host "NO LOCATION: $($mvp_spreadsheet_player_data[$i].Location)"
        }

        continue
    }

    if($mvp_spreadsheet_player_data[$i].'Teleport to')
    {
        $teleportTo = $mvp_spreadsheet_player_data[$i].'Teleport to'
    }
    elseif($mvp_spreadsheet_player_data[$i].'Covered')
    {
        $teleportTo = $mvp_spreadsheet_player_data[$i].'Covered'
    }
    else
    {
        $teleportTo = $mvp_spreadsheet_player_data[$i].'MVPer'
    }

    Write-Host "ADDED ROW $i"

    $data += @{time=$cell_datetime.ToShortTimeString()
               location=$mvp_spreadsheet_player_data[$i].Location
               teleportTo=$mvp}
}


while($data[-1].type -and $data[-1].type -eq "different")
{
    if($data.Length -eq 1)
    {
        $data = @()
        break
    }

    Write-Host "DELETED: $($data[-1].location)"
    $data = $data[0..($data.Length - 2)]
}


$data_json = ConvertTo-Json $data
$data_json | Out-File '..\mvp_data.json' -Encoding ascii