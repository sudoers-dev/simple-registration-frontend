import { useState, useEffect } from "react"
import { Pencil, Trash2, Eye } from "lucide-react"
import { getRegistrants, subscribe, updateRegistrant, deleteRegistrant, type Registrant, type Status } from "@/store/registrants"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel, AlertDialogMedia } from "@/components/ui/alert-dialog"
import { CheckCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { TriangleAlert } from "lucide-react"


const STATUS_CLASS: Record<Status, string> = {
  Active: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
  Pending: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
  Inactive: "bg-muted text-muted-foreground border-border",
}

function StatusBadge({ status }: { status: Status }) {
  return <Badge variant="outline" className={STATUS_CLASS[status]}>{status}</Badge>
}

type EditFields = {
  firstName: string
  lastName: string
  username: string
  email: string
  mobile: string
  dob: string
  status: Status
}

function ViewModal({ registrant, open, onClose }: { registrant: Registrant; open: boolean; onClose: () => void }) {
  const rows: [string, string][] = [
    ["Full Name", `${registrant.firstName} ${registrant.lastName}`],
    ["Username", registrant.username],
    ["Email", registrant.email],
    ["Mobile", `+63 ${registrant.mobile}`],
    ["Date of Birth", registrant.dob],
    ["Registered", registrant.registeredAt],
  ]

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrant Details</DialogTitle>
        </DialogHeader>
        <Separator />
        <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm py-1">
          {rows.map(([label, value]) => (
            <>
              <span key={label + "-l"} className="text-muted-foreground font-medium">{label}</span>
              <span key={label + "-v"}>{value}</span>
            </>
          ))}
          <span className="text-muted-foreground font-medium">Status</span>
          <StatusBadge status={registrant.status} />
        </div>
        <DialogFooter showCloseButton />
      </DialogContent>
    </Dialog>
  )
}

function EditModal({ registrant, open, onClose }: { registrant: Registrant; open: boolean; onClose: () => void }) {
  const [fields, setFields] = useState<EditFields>({
    firstName: registrant.firstName,
    lastName: registrant.lastName,
    username: registrant.username,
    email: registrant.email,
    mobile: registrant.mobile,
    dob: registrant.dob,
    status: registrant.status,
  })

  useEffect(() => {
    if (open) {
      setFields({
        firstName: registrant.firstName,
        lastName: registrant.lastName,
        username: registrant.username,
        email: registrant.email,
        mobile: registrant.mobile,
        dob: registrant.dob,
        status: registrant.status,
      })
    }
  }, [open, registrant])

  const set = (k: keyof EditFields) => (v: string) => setFields((f) => ({ ...f, [k]: v }))

  const [confirming, setConfirming] = useState(false)

  const handleSave = () => {
    updateRegistrant(registrant.id, fields)
    setConfirming(false)
    onClose()
  }

  return (
    <>
      <Dialog open={open && !confirming} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Registrant</DialogTitle>
          </DialogHeader>
          <Separator />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-1">
            {(["firstName", "lastName", "username", "email", "mobile", "dob"] as const).map((key) => (
              <div key={key} className="flex flex-col gap-1.5">
                <Label htmlFor={`edit-${key}`}>
                  {{ firstName: "First Name", lastName: "Last Name", username: "Username", email: "Email", mobile: "Mobile", dob: "Date of Birth" }[key]}
                </Label>
                <Input
                  id={`edit-${key}`}
                  type={key === "dob" ? "date" : key === "email" ? "email" : "text"}
                  value={fields[key]}
                  onChange={(e) => set(key)(e.target.value)}
                />
              </div>
            ))}
            <div className="flex flex-col gap-1.5">
              <Label>Status</Label>
              <Select value={fields.status} onValueChange={(v) => set("status")(v as Status)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setConfirming(true)}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirming} onOpenChange={(o) => !o && setConfirming(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <CheckCircle className="text-primary" />
            </AlertDialogMedia>
            <AlertDialogTitle>Save Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to update the information for <strong>{fields.firstName} {fields.lastName}</strong>. Please confirm that the details are correct before saving.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirming(false)}>Go Back</AlertDialogCancel>
            <AlertDialogAction onClick={handleSave}>Confirm Save</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function DeleteDialog({ registrant, open, onClose }: { registrant: Registrant; open: boolean; onClose: () => void }) {
  const handleConfirm = () => {
    deleteRegistrant(registrant.id)
    onClose()
  }

  return (
    <AlertDialog open={open} onOpenChange={(o) => !o && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia>
            <TriangleAlert className="text-destructive" />
          </AlertDialogMedia>
          <AlertDialogTitle>Delete Registrant</AlertDialogTitle>
          <AlertDialogDescription>
            You are about to permanently delete <strong>{registrant.firstName} {registrant.lastName}</strong>. This action cannot be undone and all their data will be lost. Are you sure you want to continue?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={handleConfirm}>Yes, Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export function RegistrantsList() {
  const [registrants, setRegistrants] = useState<Registrant[]>(getRegistrants)
  const [view, setView] = useState<Registrant | null>(null)
  const [edit, setEdit] = useState<Registrant | null>(null)
  const [del, setDel] = useState<Registrant | null>(null)

  useEffect(() => {
    const unsub = subscribe(() => setRegistrants([...getRegistrants()]))
    return () => { unsub() }
  }, [])

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Registered Users</CardTitle>
          <CardDescription>{registrants.length} registrant{registrants.length !== 1 ? "s" : ""} found</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Full Name</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {registrants.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    No registrants yet.
                  </TableCell>
                </TableRow>
              )}
              {registrants.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.firstName} {r.lastName}</TableCell>
                  <TableCell className="text-muted-foreground">{r.registeredAt}</TableCell>
                  <TableCell><StatusBadge status={r.status} /></TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon-sm" aria-label="View" onClick={() => setView(r)}><Eye /></Button>
                      <Button variant="ghost" size="icon-sm" aria-label="Edit" onClick={() => setEdit(r)}><Pencil /></Button>
                      <Button variant="ghost" size="icon-sm" aria-label="Delete" onClick={() => setDel(r)} className="text-destructive hover:text-destructive"><Trash2 /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {view && <ViewModal registrant={view} open={!!view} onClose={() => setView(null)} />}
      {edit && <EditModal registrant={edit} open={!!edit} onClose={() => setEdit(null)} />}
      {del && <DeleteDialog registrant={del} open={!!del} onClose={() => setDel(null)} />}
    </>
  )
}
