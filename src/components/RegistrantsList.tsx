import { useState, useEffect, useCallback } from "react"
import { Pencil, Trash2, Eye, RefreshCw } from "lucide-react"
import {
  fetchRegistrants, updateRegistrant, deleteRegistrant,
  type Registrant, type Status, type UpdateRegistrantPayload,
} from "@/store/registrants"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardAction } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel, AlertDialogMedia } from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import { TriangleAlert, CheckCircle } from "lucide-react"

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
        <DialogHeader><DialogTitle>Registrant Details</DialogTitle></DialogHeader>
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

function EditModal({ registrant, open, onClose, onSaved }: {
  registrant: Registrant; open: boolean; onClose: () => void; onSaved: () => void
}) {
  const [fields, setFields] = useState<EditFields>({
    firstName: registrant.firstName, lastName: registrant.lastName,
    username: registrant.username, email: registrant.email,
    mobile: registrant.mobile, dob: registrant.dob, status: registrant.status,
  })
  const [confirming, setConfirming] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setFields({
        firstName: registrant.firstName, lastName: registrant.lastName,
        username: registrant.username, email: registrant.email,
        mobile: registrant.mobile, dob: registrant.dob, status: registrant.status,
      })
      setConfirming(false)
      setError(null)
    }
  }, [open, registrant])

  const set = (k: keyof EditFields) => (v: string) => setFields((f) => ({ ...f, [k]: v }))

  const handleConfirm = async () => {
    setSaving(true)
    setError(null)
    try {
      const patch: UpdateRegistrantPayload = {
        firstName: fields.firstName, lastName: fields.lastName,
        username: fields.username, email: fields.email,
        mobile: fields.mobile, dob: fields.dob, status: fields.status,
      }
      await updateRegistrant(registrant.id, patch)
      onSaved()
      setConfirming(false)
      onClose()
    } catch {
      setError("Failed to save changes. Please try again.")
      setConfirming(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Dialog open={open && !confirming} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Edit Registrant</DialogTitle></DialogHeader>
          <Separator />
          {error && <p className="text-sm text-destructive">{error}</p>}
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
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
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
            <AlertDialogMedia><CheckCircle className="text-primary" /></AlertDialogMedia>
            <AlertDialogTitle>Save Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to update the information for <strong>{fields.firstName} {fields.lastName}</strong>. Please confirm that the details are correct before saving.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirming(false)}>Go Back</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} disabled={saving}>
              {saving ? <Spinner className="mr-1" /> : null}Confirm Save
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function DeleteDialog({ registrant, open, onClose, onDeleted }: {
  registrant: Registrant; open: boolean; onClose: () => void; onDeleted: () => void
}) {
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConfirm = async () => {
    setDeleting(true)
    setError(null)
    try {
      await deleteRegistrant(registrant.id)
      onDeleted()
      onClose()
    } catch {
      setError("Failed to delete. Please try again.")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={(o) => !o && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia><TriangleAlert className="text-destructive" /></AlertDialogMedia>
          <AlertDialogTitle>Delete Registrant</AlertDialogTitle>
          <AlertDialogDescription>
            You are about to permanently delete <strong>{registrant.firstName} {registrant.lastName}</strong>. This action cannot be undone and all their data will be lost. Are you sure you want to continue?
          </AlertDialogDescription>
          {error && <p className="text-sm text-destructive mt-1">{error}</p>}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={handleConfirm} disabled={deleting}>
            {deleting ? <Spinner className="mr-1" /> : null}Yes, Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

type Props = { refreshKey?: number }

export function RegistrantsList({ refreshKey }: Props) {
  const [registrants, setRegistrants] = useState<Registrant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [view, setView] = useState<Registrant | null>(null)
  const [edit, setEdit] = useState<Registrant | null>(null)
  const [del, setDel] = useState<Registrant | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setRegistrants(await fetchRegistrants())
    } catch {
      setError("Could not load registrants. Is the backend running?")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load, refreshKey])

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Registered Users</CardTitle>
          <CardDescription>
            {loading ? "Loading…" : `${registrants.length} registrant${registrants.length !== 1 ? "s" : ""} found`}
          </CardDescription>
          <CardAction>
            <Button variant="ghost" size="icon-sm" aria-label="Refresh" onClick={load} disabled={loading}>
              <RefreshCw className={loading ? "animate-spin" : ""} />
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="p-0">
          {error ? (
            <p className="text-sm text-destructive px-4 py-6">{error}</p>
          ) : (
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
                {loading && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      <Spinner className="mx-auto" />
                    </TableCell>
                  </TableRow>
                )}
                {!loading && registrants.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      No registrants yet.
                    </TableCell>
                  </TableRow>
                )}
                {!loading && registrants.map((r) => (
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
          )}
        </CardContent>
      </Card>

      {view && <ViewModal registrant={view} open={!!view} onClose={() => setView(null)} />}
      {edit && <EditModal registrant={edit} open={!!edit} onClose={() => setEdit(null)} onSaved={load} />}
      {del && <DeleteDialog registrant={del} open={!!del} onClose={() => setDel(null)} onDeleted={load} />}
    </>
  )
}
