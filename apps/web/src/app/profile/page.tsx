"use client"

import { useEffect, useMemo, useState } from "react"
import { auth, db, storage } from "@/lib/firebase"
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth"
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { useAuth } from "@/components/AuthProvider"
import PageHeader from "@/components/ui/PageHeader"
import Card, { CardContent } from "@/components/ui/Card"
import Input from "@/components/ui/Input"
import Button from "@/components/ui/Button"

export default function ProfilePage() {
  const { user, loading } = useAuth()
  const [displayName, setDisplayName] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [bio, setBio] = useState("")
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string>("")
  const [uploading, setUploading] = useState(false)

  const uid = user?.uid
  const userDocRef = useMemo(() => (uid ? doc(db, "users", uid) : null), [uid])

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!userDocRef) return
      try {
        const snap = await getDoc(userDocRef)
        if (cancelled) return
        const data = snap.data() as any
        if (data) {
          setDisplayName(data.displayName || "")
          setAvatarUrl(data.avatarUrl || "")
          setBio(data.bio || "")
        } else if (user) {
          setDisplayName(user.displayName || "")
        }
      } catch (e: any) {
        // Gracefully surface permission errors instead of crashing
        setMessage(e?.message || "Unable to load profile")
      }
    }
    load()
    return () => { cancelled = true }
  }, [userDocRef, user])

  async function onSignIn() {
    const provider = new GoogleAuthProvider()
    await signInWithPopup(auth, provider)
  }

  async function onSignOut() {
    await signOut(auth)
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !userDocRef) return
    try {
      setSaving(true)
      setMessage("")
      await setDoc(userDocRef, {
        displayName,
        avatarUrl,
        bio,
        wallets: [],
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      }, { merge: true })
      setMessage("Saved")
    } catch (e: any) {
      setMessage(e?.message || String(e))
    } finally {
      setSaving(false)
    }
  }

  async function onAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!user) return
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setUploading(true)
      const avatarRef = ref(storage, `avatars/${user.uid}/${Date.now()}_${file.name}`)
      await uploadBytes(avatarRef, file)
      const url = await getDownloadURL(avatarRef)
      setAvatarUrl(url)
      setMessage("Avatar uploaded. Click Save to apply.")
    } catch (e: any) {
      setMessage(e?.message || String(e))
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <PageHeader
          title="Profile"
          subtitle="Manage your account details and public profile."
        />

        {!loading && !user && (
          <Card className="text-center">
            <CardContent className="space-y-4">
              <p className="text-slate-300">Sign in to create your profile.</p>
              <Button onClick={onSignIn} size="lg">Sign in with Google</Button>
            </CardContent>
          </Card>
        )}

        {!loading && user && (
          <Card>
            <CardContent>
              <div className="flex items-center gap-4 mb-6">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt="avatar" className="h-16 w-16 rounded-full object-cover" />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-white/10" />
                )}
                <div className="text-sm text-slate-300">{user.email || user.uid}</div>
                <Button onClick={onSignOut} size="sm" variant="secondary" className="ml-auto">Sign out</Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Display name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />

                <Input
                  type="file"
                  label="Avatar"
                  accept="image/*"
                  onChange={onAvatarChange}
                  hint="Upload from your device. We store it in Firebase Storage."
                />

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-slate-300">Bio</label>
                  <textarea
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition min-h-[120px]"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 mt-6">
                <Button loading={saving || uploading} onClick={onSave}>
                  {saving ? "Saving..." : uploading ? "Uploading..." : "Save changes"}
                </Button>
                {message && <span className="text-xs text-slate-400">{message}</span>}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
