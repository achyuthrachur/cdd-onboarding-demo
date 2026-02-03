VERSION 5.00
Begin {C62A69F0-16DC-11CE-9E98-00AA00574A4F} frmObservation 
   Caption         =   "Add Observation"
   ClientHeight    =   9420.001
   ClientLeft      =   120
   ClientTop       =   465
   ClientWidth     =   9795.001
   OleObjectBlob   =   "frmObservation.frx":0000
   StartUpPosition =   1  'CenterOwner
End
Attribute VB_Name = "frmObservation"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False

Option Explicit

Private m_IsCancelled As Boolean
Private m_SelectedObservation As String

Private Sub UserForm_Initialize()
    m_IsCancelled = True
    m_SelectedObservation = ""

    ' No need to populate - radio buttons have captions
    ' Set form background
    Me.BackColor = RGB(240, 240, 240)
End Sub

Private Sub btnOK_Click()
    Dim selectedOption As MSForms.OptionButton

    ' Check which radio button is selected
    If optObs1.value Then
        m_SelectedObservation = "Documentation appears incomplete. Additional verification required."
    ElseIf optObs2.value Then
        m_SelectedObservation = "Discrepancy noted between reported values and supporting documents."
    ElseIf optObs3.value Then
        m_SelectedObservation = "Unable to verify information with provided documentation. Follow-up needed."
    ElseIf optObs4.value Then
        m_SelectedObservation = "Additional clarification required from entity management."
    ElseIf optObs5.value Then
        m_SelectedObservation = "Supporting evidence provided does not fully address the requirement."
    ElseIf optObs6.value Then
        m_SelectedObservation = "Documentation quality is poor. Clearer evidence requested."
    ElseIf optObs7.value Then
        m_SelectedObservation = "Information conflicts with prior period records. Needs reconciliation."
    ElseIf optObs8.value Then
        m_SelectedObservation = "Third-party verification pending. Awaiting confirmation."
    ElseIf optObs9.value Then
        m_SelectedObservation = "Entity provided partial information. Complete details required."
    ElseIf optObs10.value Then
        m_SelectedObservation = "Documentation dated outside acceptable period. Updated records needed."
    ElseIf Len(Trim$(Me.txtCustomObservation.Text)) > 0 Then
        ' User entered custom observation
        m_SelectedObservation = Trim$(Me.txtCustomObservation.Text)
    Else
        ' No selection or input
        MsgBox "Please select an observation or enter a custom observation.", _
               vbExclamation, "No Observation Selected"
        Exit Sub
    End If

    m_IsCancelled = False
    Me.Hide
End Sub

Private Sub btnCancel_Click()
    m_IsCancelled = True
    m_SelectedObservation = ""
    Me.Hide
End Sub

' Clear custom text when radio button selected
Private Sub optObs1_Click()
    txtCustomObservation.Text = ""
End Sub

' Repeat for optObs2 through optObs10...
Private Sub optObs2_Click()
    txtCustomObservation.Text = ""
End Sub
' ... etc for optObs3-10

' Clear radio buttons when typing custom
Private Sub txtCustomObservation_Change()
    If Len(Trim$(Me.txtCustomObservation.Text)) > 0 Then
        optObs1.value = False
        optObs2.value = False
        optObs3.value = False
        optObs4.value = False
        optObs5.value = False
        optObs6.value = False
        optObs7.value = False
        optObs8.value = False
        optObs9.value = False
        optObs10.value = False
    End If
End Sub

Public Property Get IsCancelled() As Boolean
    IsCancelled = m_IsCancelled
End Property

Public Property Get SelectedObservation() As String
    SelectedObservation = m_SelectedObservation
End Property

