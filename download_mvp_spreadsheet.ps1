Param (
        [Parameter(Mandatory=$true, 
                   ValueFromPipeline=$true,
                   ValueFromPipelineByPropertyName=$true, 
                   ValueFromRemainingArguments=$false, 
                   Position=0)]
        [ValidateNotNull()]
        [ValidateNotNullOrEmpty()]
        [string]
        $spreadsheet_id
)

$client = new-object System.Net.WebClient
$client.DownloadFile("https://docs.google.com/spreadsheets/d/$spreadsheet_id/export?format=xlsx", "../mvp_spreadsheet.xlsx")