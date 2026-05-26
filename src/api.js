import { supabase } from './supabase'

// ── AUTH ──────────────────────────────────────────

export async function signUp(email, password, name, phone) {
  const { data, error } = await supabase.auth.signUp({
    email, password,
    options: { data: { name, phone } }
  })
  return { data, error }
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email, password
  })
  return { data, error }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export async function getSession() {
  const { data } = await supabase.auth.getSession()
  return data.session
}

export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  return { data, error }
}

// ── GAMES ─────────────────────────────────────────

export async function fetchGames() {
  const { data, error } = await supabase
    .from('games')
    .select('*')
    .order('created_at', { ascending: false })
  return { data, error }
}

export async function postGame(game) {
  const { data, error } = await supabase
    .from('games')
    .insert([game])
    .select()
  return { data, error }
}

export async function updateFilledSlots(gameId, newCount) {
  const { error } = await supabase
    .from('games')
    .update({ filled_slots: newCount })
    .eq('id', gameId)
  return { error }
}

// ── REQUESTS ──────────────────────────────────────

export async function fetchRequests(hostId) {
  const { data, error } = await supabase
    .from('requests')
    .select('*, games(title, color)')
    .eq('games.host_id', hostId)
  return { data, error }
}

export async function sendRequest(gameId, userId, userName, note) {
  const { data, error } = await supabase
    .from('requests')
    .insert([{ game_id: gameId, user_id: userId, user_name: userName, note, status: 'pending' }])
    .select()
  return { data, error }
}

export async function updateRequestStatus(requestId, status) {
  const { error } = await supabase
    .from('requests')
    .update({ status })
    .eq('id', requestId)
  return { error }
}