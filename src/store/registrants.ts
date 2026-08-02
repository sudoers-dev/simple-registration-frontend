export type Status = "Active" | "Inactive" | "Pending"

export type Registrant = {
  id: string
  firstName: string
  lastName: string
  username: string
  email: string
  mobile: string
  dob: string
  registeredAt: string
  status: Status
}

const SEED: Registrant[] = [
  { id: "1", firstName: "Maria", lastName: "Santos", username: "msantos", email: "maria.santos@example.com", mobile: "9171234567", dob: "1990-03-15", registeredAt: "2024-11-01", status: "Active" },
  { id: "2", firstName: "Juan", lastName: "dela Cruz", username: "jdelacruz", email: "juan.delacruz@example.com", mobile: "9289876543", dob: "1985-07-22", registeredAt: "2024-11-14", status: "Inactive" },
  { id: "3", firstName: "Ana", lastName: "Reyes", username: "areyes", email: "ana.reyes@example.com", mobile: "9351122334", dob: "1998-01-09", registeredAt: "2024-12-03", status: "Pending" },
  { id: "4", firstName: "Carlo", lastName: "Mendoza", username: "cmendoza", email: "carlo.mendoza@example.com", mobile: "9064455667", dob: "1993-09-30", registeredAt: "2025-01-07", status: "Active" },
  { id: "5", firstName: "Liza", lastName: "Garcia", username: "lgarcia", email: "liza.garcia@example.com", mobile: "9177788990", dob: "2000-05-18", registeredAt: "2025-02-20", status: "Active" },
]

let _store: Registrant[] = [...SEED]
type Listener = () => void
const listeners = new Set<Listener>()

function notify() {
  listeners.forEach((fn) => fn())
}

export function subscribe(fn: Listener) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function getRegistrants() {
  return _store
}

export function addRegistrant(r: Omit<Registrant, "id" | "registeredAt" | "status">) {
  _store = [
    ..._store,
    {
      ...r,
      id: crypto.randomUUID(),
      registeredAt: new Date().toISOString().slice(0, 10),
      status: "Pending",
    },
  ]
  notify()
}

export function updateRegistrant(id: string, patch: Partial<Omit<Registrant, "id">>) {
  _store = _store.map((r) => (r.id === id ? { ...r, ...patch } : r))
  notify()
}

export function deleteRegistrant(id: string) {
  _store = _store.filter((r) => r.id !== id)
  notify()
}
