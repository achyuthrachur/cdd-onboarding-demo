VERSION 5.00
Begin {C62A69F0-16DC-11CE-9E98-00AA00574A4F} frmNarrativePrompt
   Caption         =   "Copilot Narrative Prompt Generator"
   ClientHeight    =   9000
   ClientLeft      =   120
   ClientTop       =   465
   ClientWidth     =   12000
   OleObjectBlob   =   "frmNarrativePrompt.frx":0000
   StartUpPosition =   1  'CenterOwner
End
Attribute VB_Name = "frmNarrativePrompt"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False

Option Explicit

Private m_PromptText As String

'=============================================================================================
' PROPERTIES
'=============================================================================================

Public Property Let PromptText(ByVal value As String)
    m_PromptText = value
    txtPrompt.Text = value
End Property

Public Property Get PromptText() As String
    PromptText = m_PromptText
End Property

'=============================================================================================
' FORM EVENTS
'=============================================================================================

Private Sub UserForm_Initialize()
    ' Initialize form controls

    ' Set form background
    Me.BackColor = RGB(240, 240, 240)

    ' Configure text box
    With txtPrompt
        .MultiLine = True
        .ScrollBars = fmScrollBarsBoth
        .EnterKeyBehavior = True
        .WordWrap = True
        .Font.Name = "Consolas"
        .Font.Size = 10
    End With

    ' Initial status
    lblStatus.Caption = "Ready to copy"
    lblStatus.ForeColor = RGB(0, 100, 0)
    lblStatus.Visible = False
End Sub

'=============================================================================================
' BUTTON EVENTS
'=============================================================================================

Private Sub btnCopyToClipboard_Click()
    ' Copy prompt text to clipboard

    On Error GoTo ErrHandler

    If Len(Trim$(txtPrompt.Text)) = 0 Then
        MsgBox "No prompt text to copy.", vbInformation
        Exit Sub
    End If

    ' Create DataObject to access clipboard
    Dim dataObj As MSForms.DataObject
    Set dataObj = New MSForms.DataObject

    ' Put text on clipboard
    dataObj.SetText txtPrompt.Text
    dataObj.PutInClipboard

    ' Show success message
    lblStatus.Caption = "Copied to clipboard!"
    lblStatus.ForeColor = RGB(0, 150, 0)
    lblStatus.Visible = True

    ' Auto-hide status after 2 seconds
    Application.Wait Now + TimeValue("00:00:02")
    lblStatus.Visible = False

    Exit Sub

ErrHandler:
    MsgBox "Error copying to clipboard: " & Err.Description, vbExclamation
End Sub

Private Sub btnClose_Click()
    Unload Me
End Sub

Private Sub btnRefresh_Click()
    ' Regenerate the prompt (call the generator again)

    If MsgBox("Regenerate the prompt from the consolidated file?" & vbCrLf & vbCrLf & _
              "This will close this window and restart the generation process.", _
              vbQuestion + vbYesNo, "Regenerate Prompt") = vbYes Then
        Unload Me
        ' Call the generator again
        modNarrativePromptGenerator.GenerateNarrativePrompt
    End If
End Sub
