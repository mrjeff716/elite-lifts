import React from "react";
import {
  ArrowUpRight,
  ChevronRight,
  LockKeyhole,
  SlidersHorizontal,
  UserRound,
} from "lucide-react";
import Navbar from "../components/Navbar";
import { useEffect, useRef, useState } from 'react'
import axios from '../api'
import { toast } from "react-hot-toast";
import { useNavigate } from 'react-router'

const Settings = ({user, setUser}) => {
  const settingsPage = useRef(null)
  const deleteAccountDialog = useRef(null)
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)

  const navigate = useNavigate()

  useEffect(() => {
    if (settingsPage.current !== null) {
      settingsPage.current.scrollIntoView()
    }
  }, [])

    async function updateUser() {
      try {
        const res = await axios.post('/api/settings', {
          id: user._id,
          name: user.name,
          email: user.email,
          workouts: user.workouts,
          weightUnit: user.weightUnit,
          workoutsPerWeek: Number(user.workoutsPerWeek)
        },
        {
          headers: {
            Accept: "application/json",
          },
        },)
        if (res.status !== 201) {
          toast.error('Error, please try again later')
        }
        if (res.status === 201) {
          toast.success('Your changes have been saved!')
        }
      } catch (error) {
        if (!error.status) {
          error.status = 500
          toast.error('Error, please try again later')
        }
      }
    }

    async function logout() {
      try {
        const res = await axios.post('/logout', {
          headers: {
            Accept: "application/json",
          },
        })
        if (res.status !== 200) {
          toast.error('Error, please try again later')
        }
        if (res.status === 200) {
          setUser(null)
          localStorage.removeItem('workout')
          toast.success('Logged out Successfully!')
          navigate('/auth', { replace: true })
        }
      } catch (error) {
        if (!error.status) {
          error.status = 500
          toast.error('Error, please try again later')
        }
      }
    }

    async function deleteAccount() {
      if (isDeletingAccount) return;
      setIsDeletingAccount(true);
      try {
        const res = await axios.delete(`/delete-user/${user._id}`, {
          headers: {
            Accept: "application/json",
          },
        })
        if (res.status !== 200) {
          toast.error('Error, please try again later')
        }
        if (res.status === 200) {
          setUser(null)
          localStorage.removeItem('workout')
          toast.success(res.data.message)
          deleteAccountDialog.current?.close()
          navigate('/auth', { replace: true })
        }
      } catch (error) {
        toast.error('Unable to delete your account. Please try again later')
      } finally {
        setIsDeletingAccount(false)
      }
    }



  return (
    <div className="min-h-screen bg-background px-4 pb-32 pt-8 text-text sm:px-8 sm:pt-12 scroll-mt-10" ref={settingsPage}>
      <main className="mx-auto max-w-4xl">
        <header className="mb-9 border-b border-border/10 pb-7 sm:mb-12">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Your space
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Settings
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            A few details. A better fit for the way you train.
          </p>
        </header>

        <div className="space-y-10 sm:space-y-12">
          <section
            aria-labelledby="profile-heading"
            className="grid gap-4 sm:grid-cols-[180px_minmax(0,1fr)] sm:gap-8"
          >
            <div>
              <div className="flex items-center gap-2.5">
                <UserRound
                  aria-hidden="true"
                  className="h-4 w-4 text-primary"
                />
                <h2 id="profile-heading" className="text-base font-semibold">
                  Profile
                </h2>
              </div>
              <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted">
                The basics, all in one place.
              </p>
            </div>
            <div className="overflow-hidden rounded-2xl border border-border/10 bg-card">
              <div className="flex items-center gap-4 border-b border-border/10 p-5 sm:px-6">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/10">
                  <UserRound
                    aria-hidden="true"
                    className="h-5 w-5 text-primary"
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold">Your profile</p>
                  <p className="mt-1 text-xs text-muted">
                    Make yourself at home.
                  </p>
                </div>
              </div>
              <div className="space-y-5 p-5 sm:p-6">
                <div>
                  <label
                    htmlFor="settings-name"
                    className="mb-2 block text-xs font-medium text-muted"
                  >
                    Display name
                  </label>
                  <input
                    id="settings-name"
                    name="displayName"
                    type="text"
                    autoComplete="name"
                    defaultValue={user.name}
                    onChange={(e) => {setUser(prev => {
                      return {...prev, name: e.target.value}
                    })}}
                    placeholder="Your name"
                    className="w-full rounded-lg border border-border/10 bg-background/70 px-3.5 py-3 text-sm text-text outline-none transition placeholder:text-muted/60 focus:border-primary focus:ring-2 focus:ring-primary/15"
                  />
                </div>
                {user.authProvider !== 'google' && !user.googleId && <div>
                  <label
                    htmlFor="settings-email"
                    className="mb-2 block text-xs font-medium text-muted"
                  >
                    Email address
                  </label>
                  <input
                    id="settings-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    defaultValue={user.email}
                    onChange={(e) => {setUser(prev => {
                      return {...prev, email: e.target.value}
                    })}}
                    className="w-full rounded-lg border border-border/10 bg-background/70 px-3.5 py-3 text-sm text-text outline-none transition placeholder:text-muted/60 focus:border-primary focus:ring-2 focus:ring-primary/15"
                  />
                </div>}
              </div>
            </div>
          </section>

          <section
            aria-labelledby="training-heading"
            className="grid gap-4 sm:grid-cols-[180px_minmax(0,1fr)] sm:gap-8"
          >
            <div>
              <div className="flex items-center gap-2.5">
                <SlidersHorizontal
                  aria-hidden="true"
                  className="h-4 w-4 text-primary"
                />
                <h2 id="training-heading" className="text-base font-semibold">
                  Training
                </h2>
              </div>
              <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted">
                Your defaults for every session.
              </p>
            </div>
            <div className="divide-y divide-border/10 overflow-hidden rounded-2xl border border-border/10 bg-card">
              <fieldset className="min-w-0 p-5 sm:p-6">
                <legend className="sr-only">Weight unit</legend>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium">Weight unit</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted">
                      How your weights are displayed.
                    </p>
                  </div>
                  <div className="inline-flex shrink-0 gap-1 rounded-lg border border-border/10 bg-background p-1">
                    <label className="cursor-pointer">
                      <input
                        type="radio"
                        name="weightUnit"
                        value="kg"
                        defaultChecked
                        className="peer sr-only"
                        onChange={() => {
                          return setUser(prev => {
                            return {...prev, weightUnit: 'kg'}
                          })
                        }}
                      />
                      <span className="block rounded-md px-5 py-2 text-sm font-semibold text-muted transition peer-checked:bg-primary peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background">
                        kg
                      </span>
                    </label>
                    <label className="cursor-pointer">
                      <input
                        type="radio"
                        name="weightUnit"
                        value="lb"
                        className="peer sr-only"
                        onChange={() => {
                          return setUser(prev => {
                            return {...prev, weightUnit: 'lb'}
                          })
                        }}
                      />
                      <span className="block rounded-md px-5 py-2 text-sm font-semibold text-muted transition peer-checked:bg-primary peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background">
                        lb
                      </span>
                    </label>
                  </div>
                </div>
              </fieldset>
              <div className="flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6">
                <div className="min-w-0 flex-1">
                  <label htmlFor="workouts-per-week" className="block text-sm font-medium">
                    Weekly workout goal
                  </label>
                  <p id="workouts-per-week-description" className="mt-1 text-xs leading-relaxed text-muted">
                    How many times do you plan to work out per week?
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <input
                    id="workouts-per-week"
                    type="number"
                    name="workoutsPerWeek"
                    min="0"
                    step="1"
                    inputMode="numeric"
                    placeholder="3"
                    value={user.workoutsPerWeek ?? ''}
                    aria-describedby="workouts-per-week-description"
                    className="w-20 rounded-lg border border-border/10 bg-background px-3 py-2.5 text-center text-sm font-semibold text-text outline-none transition placeholder:text-muted/60 focus:border-primary focus:ring-2 focus:ring-primary/20"
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || (Number.isInteger(Number(value)) && Number(value) >= 0)) {
                        setUser(prev => ({ ...prev, workoutsPerWeek: value === '' ? '' : Number(value) }));
                      }
                    }}
                  />
                  <span className="text-xs text-muted">/ week</span>
                </div>
              </div>
            </div>
          </section>

          <section
            aria-labelledby="account-heading"
            className="grid gap-4 sm:grid-cols-[180px_minmax(0,1fr)] sm:gap-8"
          >
            <div>
              <div className="flex items-center gap-2.5">
                <LockKeyhole
                  aria-hidden="true"
                  className="h-4 w-4 text-primary"
                />
                <h2 id="account-heading" className="text-base font-semibold">
                  Account
                </h2>
              </div>
              <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted">
                Keep your account yours.
              </p>
            </div>
            <div className="overflow-hidden rounded-2xl border border-border/10 bg-card">
              <button
                type="button"
                className="flex w-full cursor-pointer items-center justify-between gap-4 border-t border-border/10 p-5 text-left text-red-500 transition hover:bg-red-500/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-red-500 active:bg-red-500/10
                sm:p-6"
                onClick={async() => {
                    await logout()
                }}
                >
                <span className="text-sm font-medium">Log out</span>
                <ChevronRight aria-hidden="true" className="h-4 w-4 shrink-0" />
              </button>
              <button
                type="button"
                onClick={() => deleteAccountDialog.current.showModal()}
                className="flex w-full items-center justify-between gap-4 border-t border-border/10 p-5 text-left text-red-400 transition hover:bg-red-500/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-red-500 sm:p-6"
              >
                <span className="text-sm font-medium">Delete account</span>
                <ChevronRight aria-hidden="true" className="h-4 w-4 shrink-0" />
              </button>
            </div>
          </section>
        </div>

        <footer className="mt-10 border-t border-border/10 pt-5 sm:mt-12">
          <div className="flex items-center justify-between gap-4">
            <button
              type="button"
              className="w-full cursor-pointer rounded-xl border border-primary/20 bg-primary active:opacity-80 transition px-5 py-2.5 text-sm font-semibold
              text-white"
              onClick={async() => {
                await updateUser()
              }} 
            >
              Save changes
            </button>
          </div>
          <div className="mt-8 flex items-center justify-between text-xs text-muted/60">
            <span className="font-semibold tracking-wider">LIFTIT</span>
            <a
              href="/workout"
              className="inline-flex items-center gap-1.5 transition hover:text-primary"
            >
              Back to training
              <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
            </a>
          </div>
        </footer>
      </main>
      <dialog
        ref={deleteAccountDialog}
        aria-labelledby="delete-account-title"
        aria-describedby="delete-account-description"
        onCancel={(event) => { if (isDeletingAccount) event.preventDefault() }}
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-border/10 bg-card p-6 text-text shadow-2xl backdrop:bg-black/70 backdrop:backdrop-blur-sm"
      >
        <h2 id="delete-account-title" className="text-xl font-semibold">Delete your account?</h2>
        <p id="delete-account-description" className="mt-3 text-sm leading-6 text-muted">
          Are you sure you want to delete your account? This action cannot be undone.
        </p>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            autoFocus
            disabled={isDeletingAccount}
            onClick={() => deleteAccountDialog.current.close()}
            className="rounded-xl border border-border/20 px-4 py-3 text-sm font-semibold transition hover:bg-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isDeletingAccount}
            onClick={deleteAccount}
            className="rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 disabled:cursor-wait disabled:opacity-60"
          >
            {isDeletingAccount ? 'Deleting…' : 'Yes, delete account'}
          </button>
        </div>
      </dialog>
      <Navbar />
    </div>
  );
};

export default Settings;
