import { useState } from 'react'
import type { Destination } from '../../destinations'
import { fieldLoc, readField } from '../../lib/fields'
import { setConfig } from '../../lib/storage'
import { Button, Modal, ModalActions, ModalNote, ModalTitle } from '../Modal'
import { Field } from '../Field'

/** Collects a destination's required config before publishing for the first time. */
export function ConfigDialog({
  dest,
  onClose,
  onSaved,
}: {
  dest: Destination
  onClose: () => void
  onSaved: (dest: Destination) => void
}) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries((dest.config ?? []).map((f) => [f.key, readField(dest, f)])),
  )

  const canSave = (dest.config ?? []).every((f) => f.optional || values[f.key]?.trim())

  function save() {
    for (const f of dest.config ?? []) {
      const [d, k] = fieldLoc(dest, f)
      setConfig(d, k, values[f.key].trim())
    }
    onSaved(dest)
  }

  return (
    <Modal onClose={onClose}>
      <ModalTitle>
        {dest.icon} {dest.name} settings
      </ModalTitle>
      <ModalNote>Saved only in this browser (localStorage); never uploaded.</ModalNote>
      {(dest.config ?? []).map((f) => (
        <Field
          key={f.key}
          field={f}
          value={values[f.key]}
          autoFocus
          onChange={(value) => setValues((v) => ({ ...v, [f.key]: value }))}
          onEnter={() => canSave && save()}
        />
      ))}
      <ModalActions>
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button disabled={!canSave} onClick={save}>
          Save &amp; publish
        </Button>
      </ModalActions>
    </Modal>
  )
}
