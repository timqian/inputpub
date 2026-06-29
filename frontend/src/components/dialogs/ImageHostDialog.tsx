import { useState } from 'react'
import { imageHosts, hostNs, type ImageHost } from '../../imagehosts'
import type { ConfigField } from '../../destinations/types'
import { getConfig, getImageHostDefault, setConfig, setImageHostDefault } from '../../lib/storage'
import { Button, Modal, ModalActions, ModalNote, ModalTitle } from '../Modal'
import { Field } from '../Field'

const iconCls =
  'inline-flex w-[1.2rem] items-center justify-center text-[1.05rem] [&_svg]:block [&_svg]:size-[1em]'

const locKey = (host: ImageHost, f: ConfigField) => `${host.id}.${f.key}`

/** Configure image hosts and pick the default used for uploads. Each host's
 *  config is stored under its own namespace; the default is stored separately. */
export function ImageHostDialog({ onClose }: { onClose: () => void }) {
  const [defaultId, setDefaultId] = useState(() => getImageHostDefault() ?? '')
  const [values, setValues] = useState<Record<string, string>>(() => {
    const v: Record<string, string> = {}
    for (const host of imageHosts)
      for (const f of host.config ?? []) v[locKey(host, f)] = getConfig(hostNs(host.id), f.key) ?? ''
    return v
  })
  const [open, setOpen] = useState<Record<string, boolean>>({})
  const [saved, setSaved] = useState(false)
  const toggleOpen = (id: string) => setOpen((o) => ({ ...o, [id]: !o[id] }))

  function chooseDefault(id: string) {
    setDefaultId(id)
    setImageHostDefault(id) // persist immediately; Save also re-applies it
  }

  function save() {
    for (const host of imageHosts)
      for (const f of host.config ?? [])
        setConfig(hostNs(host.id), f.key, (values[locKey(host, f)] ?? '').trim())
    setImageHostDefault(defaultId)
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  return (
    <Modal onClose={onClose}>
      <ModalTitle>Image hosts</ModalTitle>
      <ModalNote>
        Pick a default and configure it; uploads go there. Keys are saved only in this browser
        (localStorage); never sent to us.
      </ModalNote>

      <div className="-mx-[1.2rem] min-h-0 flex-1 overflow-y-auto px-[1.2rem]">
        <div className="flex flex-col divide-y divide-line">
          {imageHosts.map((host) => {
            const hasConfig = (host.config ?? []).length > 0
            return (
              <div key={host.id} className="py-[0.55rem]">
                <label className="flex cursor-pointer items-center gap-[0.6rem] text-[0.9rem]">
                  <input
                    type="radio"
                    name="imghost-default"
                    className="size-[1.05rem] shrink-0 cursor-pointer accent-btn-bg"
                    checked={defaultId === host.id}
                    onChange={() => chooseDefault(host.id)}
                  />
                  <span className={iconCls}>{host.icon}</span>
                  <span>{host.name}</span>
                  {host.pro && (
                    <>
                      <span className="rounded bg-hover px-[0.4em] py-[0.1em] text-[0.62rem] font-semibold uppercase tracking-wide text-muted">
                        Pro
                      </span>
                      <a
                        href="/pro"
                        className="ml-auto inline-flex items-center gap-1 text-[0.78rem] text-muted no-underline hover:text-text"
                      >
                        Upgrade ↗
                      </a>
                    </>
                  )}
                  {hasConfig && (
                    <button
                      type="button"
                      className="group ml-auto inline-flex cursor-pointer items-center gap-1 border-none bg-transparent p-0 text-[0.78rem] text-muted hover:text-text"
                      aria-expanded={!!open[host.id]}
                      onClick={(e) => {
                        e.preventDefault() // don't toggle the radio
                        toggleOpen(host.id)
                      }}
                    >
                      Configure
                      <svg
                        className="size-[0.85em] transition-transform duration-150 group-aria-expanded:rotate-180"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </button>
                  )}
                </label>

                {host.pro && (
                  // Indent matches the radio (1.05rem) + gaps + icon.
                  <p className="m-0 pl-[2.85rem] pt-1 text-[0.72rem] leading-snug text-muted">
                    Hosted by us — no setup. Available on Pro.
                  </p>
                )}

                {hasConfig && open[host.id] && (
                  <div className="flex flex-col gap-[0.7rem] pb-[0.3rem] pl-[2.85rem] pt-[0.7rem]">
                    {(host.config ?? []).map((f) => (
                      <Field
                        key={f.key}
                        field={f}
                        value={values[locKey(host, f)]}
                        onChange={(value) =>
                          setValues((v) => ({ ...v, [locKey(host, f)]: value }))
                        }
                      />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <ModalActions>
        <Button variant="ghost" onClick={onClose}>
          Close
        </Button>
        <Button onClick={save}>{saved ? 'Saved' : 'Save'}</Button>
      </ModalActions>
    </Modal>
  )
}
