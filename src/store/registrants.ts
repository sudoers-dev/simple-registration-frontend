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
  enteredBy: string
}

export type CreateRegistrantPayload = {
  firstName: string
  lastName: string
  username: string
  email: string
  mobile: string
  dob: string
  password: string
}

export type UpdateRegistrantPayload = Partial<{
  firstName: string
  lastName: string
  username: string
  email: string
  mobile: string
  dob: string
  status: Status
}>

const BASE = "http://localhost:8000/user"

// Map backend snake_case → frontend camelCase
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapProfile(p: any): Registrant {
  return {
    id: p.id,
    firstName: p.first_name,
    lastName: p.last_name,
    username: p.username,
    email: p.email,
    mobile: p.mobile_number,
    dob: p.date_of_birth,
    registeredAt: p.created_at?.slice(0, 10) ?? "",
    status: p.status as Status,
    enteredBy: p.entered_by ?? "",
  }
}

export async function fetchRegistrants(query?: string): Promise<Registrant[]> {
  const url = query
    ? `${BASE}/profiles/?q=${encodeURIComponent(query)}`
    : `${BASE}/profiles/`
  const res = await fetch(url)
  if (!res.ok) throw new Error("Failed to fetch registrants")
  const data = await res.json()
  return data.map(mapProfile)
}

export async function createRegistrant(payload: CreateRegistrantPayload): Promise<void> {
  const res = await fetch(`${BASE}/register/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: payload.username,
      first_name: payload.firstName,
      last_name: payload.lastName,
      date_of_birth: payload.dob,
      mobile_number: payload.mobile,
      email: payload.email,
      password: payload.password,
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw Object.assign(new Error("Registration failed"), { detail: err })
  }
}

export async function updateRegistrant(
  id: string,
  patch: UpdateRegistrantPayload
): Promise<Registrant> {
  const body: Record<string, string> = {}
  if (patch.firstName !== undefined) body.first_name = patch.firstName
  if (patch.lastName !== undefined) body.last_name = patch.lastName
  if (patch.username !== undefined) body.username = patch.username
  if (patch.email !== undefined) body.email = patch.email
  if (patch.mobile !== undefined) body.mobile_number = patch.mobile
  if (patch.dob !== undefined) body.date_of_birth = patch.dob
  if (patch.status !== undefined) body.status = patch.status

  const res = await fetch(`${BASE}/profiles/${id}/`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw Object.assign(new Error("Update failed"), { detail: err })
  }
  return mapProfile(await res.json())
}

export async function deleteRegistrant(id: string): Promise<void> {
  const res = await fetch(`${BASE}/profiles/${id}/`, { method: "DELETE" })
  if (!res.ok) throw new Error("Delete failed")
}
